/** @jest-environment node */

import { DELETE, GET, POST, PUT } from '@/app/api/internal/e2e-fixture/route';
import {
  cleanupE2eProgrammeFixture,
  cleanupE2eReleaseDataScope,
  createE2eProgrammeFixture,
  verifyE2eCommunityOutageNoWrite,
  verifyE2eProgrammeFixture,
} from '@/lib/server/e2e-programme-fixture';

jest.mock('@/lib/server/e2e-programme-fixture', () => ({
  cleanupE2eProgrammeFixture: jest.fn(),
  cleanupE2eReleaseDataScope: jest.fn(),
  createE2eProgrammeFixture: jest.fn(),
  verifyE2eProgrammeFixture: jest.fn(),
  verifyE2eCommunityOutageNoWrite: jest.fn(),
}));

const url = 'https://localhost/api/internal/e2e-fixture';
const headers = {
  'x-scholarscout-e2e-fixture-capability': 'capability',
  'x-scholarscout-e2e-fixture-protocol': 'lifecycle-v1',
};
let warn: jest.SpyInstance;

describe('e2e fixture route', () => {
  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    process.env.SCHOLARSCOUT_E2E_FIXTURE_ENABLED = 'true';
    process.env.SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY = 'capability';
    jest.mocked(verifyE2eProgrammeFixture).mockResolvedValue(['generated-a']);
  });

  afterEach(() => {
    delete process.env.SCHOLARSCOUT_E2E_FIXTURE_ENABLED;
    delete process.env.SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY;
    delete process.env.VERCEL_ENV;
    warn.mockRestore();
    jest.resetAllMocks();
  });

  it('logs only a fixed denial category while preserving the generic client response', async () => {
    const response = await GET(new Request(url, {
      headers: {
        ...headers,
        'x-scholarscout-e2e-fixture-capability': 'wrong-capability',
      },
    }));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Fixture lifecycle unavailable.' });
    expect(warn).toHaveBeenCalledWith('E2E fixture lifecycle denied.', {
      reason: 'capability-mismatch',
    });
    expect(JSON.stringify(warn.mock.calls)).not.toContain('wrong-capability');
  });

  it('creates then verifies only with its server capability', async () => {
    const response = await POST(new Request(url, { method: 'POST', headers }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, phase: 'verified' });
    expect(createE2eProgrammeFixture).toHaveBeenCalledTimes(1);
    expect(verifyE2eProgrammeFixture).toHaveBeenCalledTimes(1);
  });

  it('accepts a transport-level empty POST stream from the owned Node launcher', async () => {
    const response = await POST(new Request(url, {
      method: 'POST',
      headers: { ...headers, 'content-length': '0' },
      body: new ReadableStream({
        start(controller) {
          controller.close();
        },
      }),
      // The Fetch standard requires this when supplying a request stream in Node.
      duplex: 'half',
    } as RequestInit));

    expect(response.status).toBe(200);
    expect(createE2eProgrammeFixture).toHaveBeenCalledTimes(1);
  });

  it('accepts a proxy-exposed zero-byte stream when content-length is omitted', async () => {
    const response = await POST(new Request(url, {
      method: 'POST',
      headers,
      body: new ReadableStream({
        start(controller) {
          controller.close();
        },
      }),
      duplex: 'half',
    } as RequestInit));

    expect(response.status).toBe(200);
    expect(createE2eProgrammeFixture).toHaveBeenCalledTimes(1);
  });

  it('rejects browser-shaped and caller-selected input before lifecycle access', async () => {
    const response = await GET(new Request(`${url}?fixtureId=attacker`, {
      headers: { ...headers, origin: 'https://localhost' },
    }));
    expect(response.status).toBe(403);
    expect(verifyE2eProgrammeFixture).not.toHaveBeenCalled();
  });

  it.each([
    ['referer', 'https://localhost/programmes'],
    ['sec-fetch-user', '?1'],
    ['sec-ch-ua', '"Chromium"'],
  ])('rejects browser navigation metadata (%s) before lifecycle access', async (name, value) => {
    const response = await GET(new Request(url, {
      headers: { ...headers, [name]: value },
    }));

    expect(response.status).toBe(403);
    expect(verifyE2eProgrammeFixture).not.toHaveBeenCalled();
  });

  it('denies the lifecycle in production before lifecycle access', async () => {
    process.env.VERCEL_ENV = 'production';

    const response = await GET(new Request(url, { headers }));

    expect(response.status).toBe(403);
    expect(verifyE2eProgrammeFixture).not.toHaveBeenCalled();
    delete process.env.VERCEL_ENV;
  });

  it('rejects a non-empty lifecycle request even with the server capability', async () => {
    const response = await POST(new Request(url, {
      method: 'POST',
      headers,
      body: 'caller-selected-input',
    }));

    expect(response.status).toBe(403);
    expect(createE2eProgrammeFixture).not.toHaveBeenCalled();
  });

  it('cleans through the bounded server lifecycle', async () => {
    const response = await DELETE(new Request(url, { method: 'DELETE', headers }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, phase: 'cleaned' });
    expect(cleanupE2eProgrammeFixture).toHaveBeenCalledTimes(1);
    expect(cleanupE2eReleaseDataScope).toHaveBeenCalledTimes(1);
  });

  it('verifies the fixed generated outage bodies were not written', async () => {
    const response = await PUT(new Request(url, { method: 'PUT', headers }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, phase: 'no-write' });
    expect(verifyE2eCommunityOutageNoWrite).toHaveBeenCalledTimes(1);
  });
});
