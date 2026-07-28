/** @jest-environment node */

import { POST } from '@/app/api/advisor-chat/route';
import { ADVISOR_SAFE_FALLBACK } from '@/lib/advisor-contract';

jest.mock('../../lib/server/student-actor', () => ({
  resolveStudentActor: jest.fn(),
}));
jest.mock('../../lib/server/rate-limit', () => ({
  reserveAdvisorAccount: jest.fn(),
  reserveAdvisorGuest: jest.fn(),
}));
jest.mock('../../lib/server/advisor-context', () => ({
  buildAdvisorContext: jest.fn(),
}));
jest.mock('../../lib/server/platform-store', () => ({
  appendAnalyticsEvent: jest.fn(),
}));
jest.mock('../../lib/server/data-store', () => ({
  getGuestQuotaBindingForAccount: jest.fn(),
}));

const actorModule = jest.requireMock('../../lib/server/student-actor') as {
  resolveStudentActor: jest.Mock;
};
const rateLimitModule = jest.requireMock('../../lib/server/rate-limit') as {
  reserveAdvisorAccount: jest.Mock;
  reserveAdvisorGuest: jest.Mock;
};
const contextModule = jest.requireMock('../../lib/server/advisor-context') as {
  buildAdvisorContext: jest.Mock;
};
const dataStoreModule = jest.requireMock('../../lib/server/data-store') as {
  getGuestQuotaBindingForAccount: jest.Mock;
};

function advisorRequest(value: unknown): Request {
  const body = JSON.stringify(value);
  return new Request('http://localhost/api/advisor-chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': String(Buffer.byteLength(body)),
    },
    body,
  });
}

describe('advisor chat route', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.OPENAI_MODEL = 'gpt-4.1-mini';
    global.fetch = fetchMock as typeof fetch;
    actorModule.resolveStudentActor.mockResolvedValue({
      kind: 'account',
      accountId: 'student-one',
      storageKey: 'account:student-one',
    });
    rateLimitModule.reserveAdvisorAccount.mockResolvedValue({
      status: 'allowed',
      allowed: true,
      resetAt: new Date('2026-07-29T00:00:00.000Z'),
      retryAfterSeconds: 0,
    });
    contextModule.buildAdvisorContext.mockResolvedValue({
      summary: 'Approved server context.',
      recommendations: [{ name: 'Programme One', explanation: 'Verified fit signal.' }],
    });
    dataStoreModule.getGuestQuotaBindingForAccount.mockResolvedValue(null);
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_MODEL;
  });

  it('rejects oversized and client-context request envelopes before actor or provider access', async () => {
    const unknownField = await POST(advisorRequest({ message: 'Hello', context: {} }));
    const oversized = await POST(advisorRequest({ message: 'x'.repeat(3_001) }));

    expect(unknownField.status).toBe(400);
    expect(oversized.status).toBe(400);
    expect(actorModule.resolveStudentActor).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns reset-aware 429 before server context or provider access when a quota is denied', async () => {
    rateLimitModule.reserveAdvisorAccount.mockResolvedValue({
      status: 'denied',
      allowed: false,
      resetAt: new Date('2026-07-29T00:00:00.000Z'),
      retryAfterSeconds: 120,
    });

    const response = await POST(advisorRequest({ message: 'Compare options.' }));

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({
      resetAt: '2026-07-29T00:00:00.000Z',
      retryAfterSeconds: 120,
    });
    expect(contextModule.buildAdvisorContext).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps an active guest quota window when the same student signs in', async () => {
    dataStoreModule.getGuestQuotaBindingForAccount.mockResolvedValue('guest-window-one');
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({ output_text: JSON.stringify({ message: 'Check the current official details.' }) }),
    });

    await POST(advisorRequest({ message: 'Can I keep using my guest limit?' }));

    expect(rateLimitModule.reserveAdvisorAccount).toHaveBeenCalledWith('student-one', {
      guestWindowId: 'guest-window-one',
    });
  });

  it('sends only server-selected context in a bounded strict Responses request', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'x-request-id': 'request-1' }),
      json: async () => ({ output_text: JSON.stringify({ message: 'Compare the official programme pages.' }) }),
    });

    const response = await POST(advisorRequest({ message: 'Which option should I compare?' }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      reply: 'Compare the official programme pages.',
      fallback: false,
      crisis: false,
    });
    const upstreamPayload = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(upstreamPayload).toMatchObject({
      model: 'gpt-4.1-mini',
      max_output_tokens: 1_000,
      safety_identifier: expect.any(String),
      text: { format: { type: 'json_schema', strict: true } },
    });
    expect(upstreamPayload.tools).toBeUndefined();
    expect(upstreamPayload.input).toContain('Approved server context.');
    expect(upstreamPayload.input).toContain('Which option should I compare?');
    expect(upstreamPayload.input).not.toContain('account:student-one');
  });

  it('returns the fixed fallback after one schema retry and exposes no provider diagnostic', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({ output_text: '{not-json' }),
    });

    const response = await POST(advisorRequest({ message: 'Help me plan.' }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      reply: ADVISOR_SAFE_FALLBACK,
      fallback: true,
      crisis: false,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('fails closed when the limiter is unavailable and handles acute crisis before actor access', async () => {
    rateLimitModule.reserveAdvisorAccount.mockResolvedValue({
      status: 'unavailable',
      allowed: false,
      resetAt: null,
      retryAfterSeconds: null,
    });
    const unavailable = await POST(advisorRequest({ message: 'Compare options.' }));
    const crisis = await POST(advisorRequest({ message: 'I want to hurt myself tonight.' }));

    expect(unavailable.status).toBe(503);
    expect(crisis.status).toBe(200);
    expect(actorModule.resolveStudentActor).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
