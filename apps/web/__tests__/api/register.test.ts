/** @jest-environment node */

import { POST } from '@/app/api/register/route';
import { createUser, getAccountRoleForEmail } from '@/lib/server/data-store';
import { getTrustedRequestIp } from '@/lib/server/request-ip';
import { reserveRegistration } from '@/lib/server/rate-limit';

type RegistrationEnvironment = {
  NODE_ENV: 'development' | 'production' | 'test';
  VERCEL?: '1';
  VERCEL_ENV?: string;
};

jest.mock('@/lib/server/data-store', () => ({
  createUser: jest.fn(),
  getAccountRoleForEmail: jest.fn(),
}));

jest.mock('@/lib/server/request-ip', () => ({
  getTrustedRequestIp: jest.fn(),
  isLocalDevelopmentAuthenticationEnvironment:
    jest.requireActual('@/lib/server/request-ip').isLocalDevelopmentAuthenticationEnvironment,
}));

jest.mock('@/lib/server/rate-limit', () => ({
  reserveRegistration: jest.fn(),
}));

describe('POST /api/register', () => {
  const originalEnv = process.env;
  const createUserMock = jest.mocked(createUser);
  const getAccountRoleForEmailMock = jest.mocked(getAccountRoleForEmail);
  const getTrustedRequestIpMock = jest.mocked(getTrustedRequestIp);
  const reserveRegistrationMock = jest.mocked(reserveRegistration);

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: 'test' };
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    createUserMock.mockReset();
    getAccountRoleForEmailMock.mockReset();
    getTrustedRequestIpMock.mockReset();
    reserveRegistrationMock.mockReset();
    getAccountRoleForEmailMock.mockReturnValue('student');
    getTrustedRequestIpMock.mockReturnValue({
      status: 'available',
      ip: '203.0.113.7',
    });
    reserveRegistrationMock.mockResolvedValue({
      status: 'allowed',
      allowed: true,
      resetAt: new Date('2026-07-28T13:00:00.000Z'),
      retryAfterSeconds: 0,
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('reserves five trusted-IP registrations before account creation and denies the sixth', async () => {
    reserveRegistrationMock.mockImplementation(async () => {
      const denied = reserveRegistrationMock.mock.calls.length > 5;

      return denied
        ? {
            status: 'denied',
            allowed: false,
            resetAt: new Date('2026-07-28T13:00:00.000Z'),
            retryAfterSeconds: 3600,
          }
        : {
            status: 'allowed',
            allowed: true,
            resetAt: new Date('2026-07-28T13:00:00.000Z'),
            retryAfterSeconds: 0,
          };
    });

    for (let index = 0; index < 5; index += 1) {
      const response = await POST(createRequest());
      expect(response.status).toBe(200);
    }

    const denied = await POST(createRequest());

    expect(denied.status).toBe(429);
    expect(denied.headers.get('retry-after')).toBe('3600');
    await expect(denied.json()).resolves.toEqual({
      error: 'registration-rate-limited',
      resetAt: '2026-07-28T13:00:00.000Z',
    });
    expect(reserveRegistrationMock).toHaveBeenCalledTimes(6);
    expect(reserveRegistrationMock).toHaveBeenCalledWith('203.0.113.7');
    expect(createUserMock).toHaveBeenCalledTimes(5);
    expect(reserveRegistrationMock.mock.invocationCallOrder[0]).toBeLessThan(
      createUserMock.mock.invocationCallOrder[0],
    );
  });

  it('restores registration access after a rolling window expires', async () => {
    reserveRegistrationMock
      .mockResolvedValueOnce({
        status: 'denied',
        allowed: false,
        resetAt: new Date('2026-07-28T13:00:00.000Z'),
        retryAfterSeconds: 1,
      })
      .mockResolvedValueOnce({
        status: 'allowed',
        allowed: true,
        resetAt: new Date('2026-07-28T14:00:00.000Z'),
        retryAfterSeconds: 0,
      });

    expect((await POST(createRequest())).status).toBe(429);
    expect((await POST(createRequest())).status).toBe(200);
    expect(createUserMock).toHaveBeenCalledTimes(1);
  });

  it.each<[string, RegistrationEnvironment]>([
    ['Vercel production', { NODE_ENV: 'production', VERCEL: '1', VERCEL_ENV: 'production' }],
    ['Vercel Preview', { NODE_ENV: 'development', VERCEL: '1', VERCEL_ENV: 'preview' }],
  ])('keeps %s fail-closed when trusted-IP or atomic reservation is unavailable', async (_name, env) => {
    process.env = { ...originalEnv, ...env };
    getTrustedRequestIpMock.mockReturnValueOnce({ status: 'unavailable' });

    expect((await POST(createRequest())).status).toBe(503);
    expect(reserveRegistrationMock).not.toHaveBeenCalled();
    expect(createUserMock).not.toHaveBeenCalled();

    reserveRegistrationMock.mockResolvedValueOnce({
      status: 'unavailable',
      allowed: false,
      resetAt: null,
      retryAfterSeconds: null,
    });
    expect((await POST(createRequest())).status).toBe(503);
    expect(reserveRegistrationMock).toHaveBeenCalledWith('203.0.113.7');
    expect(createUserMock).not.toHaveBeenCalled();
  });

  it('derives the server-side role and accepts only bounded account fields', async () => {
    const response = await POST(createRequest({ role: 'staff' }));

    expect(response.status).toBe(400);
    expect(reserveRegistrationMock).not.toHaveBeenCalled();
    expect(createUserMock).not.toHaveBeenCalled();

    const accepted = await POST(createRequest());
    expect(accepted.status).toBe(200);
    expect(createUserMock).toHaveBeenCalledWith({
      email: 'student@example.com',
      name: 'Student',
      password: 'secure-password',
      role: 'student',
    });
  });

  it('does not use a spoofed forwarded header to select the reservation key', async () => {
    await POST(createRequest({}, { 'x-forwarded-for': '198.51.100.2' }));

    expect(getTrustedRequestIpMock).toHaveBeenCalledWith(expect.any(Headers));
    expect(reserveRegistrationMock).toHaveBeenCalledWith('203.0.113.7');
  });

  it('allows only local development registration without reading forwarded headers or reserving', async () => {
    process.env = { ...originalEnv, NODE_ENV: 'development' };
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;

    const response = await POST(createRequest(
      {},
      {
        forwarded: 'for=198.51.100.2',
        'x-forwarded-for': '198.51.100.2',
      },
      false,
    ));

    expect(response.status).toBe(200);
    expect(getTrustedRequestIpMock).not.toHaveBeenCalled();
    expect(reserveRegistrationMock).not.toHaveBeenCalled();
    expect(createUserMock).toHaveBeenCalledWith({
      email: 'student@example.com',
      name: 'Student',
      password: 'secure-password',
      role: 'student',
    });
  });

  it.each<[string, RegistrationEnvironment]>([
    ['deployed', { NODE_ENV: 'test' }],
    ['local development', { NODE_ENV: 'development' }],
  ])('rejects malformed bounded input before either registration path in %s', async (_name, env) => {
    process.env = { ...originalEnv, ...env };
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    const body = { email: 'invalid', name: 'Student', password: 'secure-password' };
    const response = await POST(createRequest(body));

    expect(response.status).toBe(400);
    expect(getTrustedRequestIpMock).not.toHaveBeenCalled();
    expect(reserveRegistrationMock).not.toHaveBeenCalled();
    expect(createUserMock).not.toHaveBeenCalled();
  });
});

function createRequest(
  values: Record<string, string> = {},
  headers: Record<string, string> = {},
  includeTrustedVercelHeader = true,
): Request {
  return new Request('http://localhost/api/register', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(includeTrustedVercelHeader ? { 'x-vercel-forwarded-for': '203.0.113.7' } : {}),
      ...headers,
    },
    body: JSON.stringify({
      email: 'student@example.com',
      name: 'Student',
      password: 'secure-password',
      ...values,
    }),
  });
}
