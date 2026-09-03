/** @jest-environment node */

import { getServerSession } from 'next-auth';
import { POST } from '@/app/api/peer-connections/route';
import { createUploaderInboxRequest } from '@/lib/server/data-store';
import { setAtomicReservationLimiterForTests } from '@/lib/server/rate-limit';

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/auth', () => ({ authOptions: {} }));
jest.mock('@/lib/platform', () => ({ creatorProfiles: [{
  username: 'maya-health', programmeId: 'north-valley-health', inboxEnabled: true,
}] }));
jest.mock('@/lib/server/data-store', () => ({ createUploaderInboxRequest: jest.fn() }));

const originalEnvironment = {
  outage: process.env.SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE,
  vercel: process.env.VERCEL_ENV,
};

function inboxRequest(): Request {
  return new Request('https://scholar-scout.test/api/peer-connections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uploader_username: 'maya-health',
      program_id: 'north-valley-health',
      body: 'What helped you decide this programme was a fit?',
    }),
  });
}

describe('peer-inbox Preview community outage boundary', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(getServerSession).mockResolvedValue({ user: { id: 'student-session-id' } } as never);
    setAtomicReservationLimiterForTests({
      reserve: jest.fn().mockResolvedValue({
        allowed: true,
        resetAt: new Date('2026-09-01T00:00:00.000Z'),
        retryAfterSeconds: 0,
      }),
    });
  });

  afterEach(() => {
    setAtomicReservationLimiterForTests(null);
    if (originalEnvironment.vercel === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = originalEnvironment.vercel;
    if (originalEnvironment.outage === undefined) delete process.env.SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE;
    else process.env.SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE = originalEnvironment.outage;
  });

  it('returns the safe Preview outage category before an inbox write', async () => {
    process.env.VERCEL_ENV = 'preview';
    process.env.SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE = '1';

    const response = await POST(inboxRequest());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({
      error: 'Inbox requests are temporarily unavailable. Please try again later.',
    });
    expect(JSON.stringify(body)).not.toMatch(/limit|provider|remaining|upstash/i);
    expect(createUploaderInboxRequest).not.toHaveBeenCalled();
  });

  it('ignores the isolated outage switch outside Preview', async () => {
    process.env.VERCEL_ENV = 'development';
    process.env.SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE = '1';
    jest.mocked(createUploaderInboxRequest).mockResolvedValue({
      id: 'inbox-1', sender_id: 'student-session-id', uploader_username: 'maya-health',
      program_id: 'north-valley-health', body: 'What helped you decide this programme was a fit?',
      status: 'pending', created_at: '2026-09-01T00:00:00.000Z',
    } as never);

    const response = await POST(inboxRequest());

    expect(response.status).toBe(201);
    expect(createUploaderInboxRequest).toHaveBeenCalledWith('student-session-id', expect.any(Object));
  });
});
