/** @jest-environment node */

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
});
