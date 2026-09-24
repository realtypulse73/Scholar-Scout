import {
  getTrustedRequestIp,
  isLocalDevelopmentAuthenticationEnvironment,
} from '@/lib/server/request-ip';

describe('trusted request IP resolution', () => {
  it('uses one valid Vercel-controlled client IP value', () => {
    const headers = new Headers({
      'x-vercel-forwarded-for': '203.0.113.10',
    });

    expect(getTrustedRequestIp(headers)).toEqual({
      status: 'available',
      ip: '203.0.113.10',
    });
  });

  it('ignores client-controlled forwarding headers', () => {
    const headers = new Headers({
      'x-vercel-forwarded-for': '2001:db8::1',
      'x-forwarded-for': '198.51.100.4, 203.0.113.15',
      forwarded: 'for=198.51.100.4',
    });

    expect(getTrustedRequestIp(headers)).toEqual({
      status: 'available',
      ip: '2001:db8::1',
    });
  });

  it.each([
    new Headers(),
    new Headers({ 'x-vercel-forwarded-for': '203.0.113.10, 198.51.100.4' }),
    new Headers({ 'x-vercel-forwarded-for': 'not-an-ip' }),
  ])('fails closed when the Vercel header is missing, multi-valued, or malformed', (headers) => {
    expect(getTrustedRequestIp(headers)).toEqual({ status: 'unavailable' });
  });

  it.each([
    ['a plain local development process', { NODE_ENV: 'development' }, true],
    ['production', { NODE_ENV: 'production' }, false],
    ['test', { NODE_ENV: 'test' }, false],
    ['a Vercel-marked process', { NODE_ENV: 'development', VERCEL: '1' }, false],
    ['Vercel production', { NODE_ENV: 'development', VERCEL_ENV: 'production' }, false],
    ['Vercel Preview', { NODE_ENV: 'development', VERCEL_ENV: 'preview' }, false],
  ])('permits the local authentication branch only for %s', (_name, env, expected) => {
    expect(isLocalDevelopmentAuthenticationEnvironment(env)).toBe(expected);
  });
});
