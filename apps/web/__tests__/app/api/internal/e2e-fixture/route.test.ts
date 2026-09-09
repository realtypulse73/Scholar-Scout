/** @jest-environment node */

jest.mock('@/lib/server/e2e-programme-fixture', () => ({
  cleanupE2eFixture: jest.fn(),
  createAndVerifyE2eFixture: jest.fn(),
  verifyE2eFixture: jest.fn(),
}));

import { POST } from '@/app/api/internal/e2e-fixture/route';

describe('internal e2e fixture route', () => {
  it('denies a request without the server-only lifecycle headers', async () => {
    const response = await POST(new Request('https://localhost/api/internal/e2e-fixture', {
      method: 'POST',
    }));
    expect(response.status).toBe(403);
  });

  it('denies browser-shaped and selector-bearing requests before fixture access', async () => {
    const response = await POST(new Request('https://localhost/api/internal/e2e-fixture?source=seed', {
      method: 'POST',
      headers: {
        Origin: 'https://localhost',
        Authorization: 'Bearer browser-value',
        'x-scholarscout-e2e-fixture-protocol': 'lifecycle-v1',
      },
    }));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Not found' });
  });

  it.each([
    ['referer', 'https://localhost/programmes'],
    ['sec-fetch-user', '?1'],
    ['sec-ch-ua', '"Chromium"'],
  ])('denies browser navigation metadata (%s)', async (name, value) => {
    const response = await POST(new Request('https://localhost/api/internal/e2e-fixture', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer browser-value',
        'x-scholarscout-e2e-fixture-protocol': 'lifecycle-v1',
        [name]: value,
      },
    }));

    expect(response.status).toBe(403);
  });

  it('denies a body even when the caller has the protocol-shaped headers', async () => {
    const response = await POST(new Request('https://localhost/api/internal/e2e-fixture', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test',
        'x-scholarscout-e2e-fixture-protocol': 'lifecycle-v1',
        'Content-Type': 'application/json',
      },
      body: '{}',
    }));
    expect(response.status).toBe(403);
  });

  it('accepts a no-body Node fetch request with Content-Length: 0', async () => {
    const originalEnabled = process.env.SCHOLARSCOUT_E2E_FIXTURE;
    const originalCapability = process.env.SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY;
    process.env.SCHOLARSCOUT_E2E_FIXTURE = 'true';
    process.env.SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY = 'runner-capability';

    try {
      const response = await POST(new Request('https://localhost/api/internal/e2e-fixture', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer runner-capability',
          'x-scholarscout-e2e-fixture-protocol': 'lifecycle-v1',
          'Content-Length': '0',
        },
      }));

      expect(response.status).toBe(200);
    } finally {
      if (originalEnabled === undefined) delete process.env.SCHOLARSCOUT_E2E_FIXTURE;
      else process.env.SCHOLARSCOUT_E2E_FIXTURE = originalEnabled;
      if (originalCapability === undefined) delete process.env.SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY;
      else process.env.SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY = originalCapability;
    }
  });
});
