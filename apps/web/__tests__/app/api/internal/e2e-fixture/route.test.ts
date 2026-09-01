/** @jest-environment node */

import { DELETE, GET, POST } from '@/app/api/internal/e2e-fixture/route';
import {
  cleanupE2eProgrammeFixture,
  createE2eProgrammeFixture,
  verifyE2eProgrammeFixture,
} from '@/lib/server/e2e-programme-fixture';

jest.mock('@/lib/server/e2e-programme-fixture', () => ({
  cleanupE2eProgrammeFixture: jest.fn(),
  createE2eProgrammeFixture: jest.fn(),
  verifyE2eProgrammeFixture: jest.fn(),
}));

const url = 'https://localhost/api/internal/e2e-fixture';
const headers = {
  authorization: 'Bearer capability',
  'x-scholarscout-e2e-fixture-protocol': 'lifecycle-v1',
};

describe('e2e fixture route', () => {
  beforeEach(() => {
    process.env.SCHOLARSCOUT_E2E_FIXTURE_ENABLED = 'true';
    process.env.SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY = 'capability';
    jest.mocked(verifyE2eProgrammeFixture).mockResolvedValue(['generated-a']);
  });

  afterEach(() => {
    delete process.env.SCHOLARSCOUT_E2E_FIXTURE_ENABLED;
    delete process.env.SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY;
    jest.resetAllMocks();
  });

  it('creates then verifies only with its server capability', async () => {
    const response = await POST(new Request(url, { method: 'POST', headers }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, phase: 'verified' });
    expect(createE2eProgrammeFixture).toHaveBeenCalledTimes(1);
    expect(verifyE2eProgrammeFixture).toHaveBeenCalledTimes(1);
  });

  it('rejects browser-shaped and caller-selected input before lifecycle access', async () => {
    const response = await GET(new Request(`${url}?fixtureId=attacker`, {
      headers: { ...headers, origin: 'https://localhost' },
    }));
    expect(response.status).toBe(403);
    expect(verifyE2eProgrammeFixture).not.toHaveBeenCalled();
  });

  it('cleans through the bounded server lifecycle', async () => {
    const response = await DELETE(new Request(url, { method: 'DELETE', headers }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, phase: 'cleaned' });
    expect(cleanupE2eProgrammeFixture).toHaveBeenCalledTimes(1);
  });
});
