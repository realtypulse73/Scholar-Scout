/** @jest-environment node */

import { resolveNextAuthSecret } from '@/lib/server/local-auth-secret';

describe('resolveNextAuthSecret', () => {
  it('uses a configured secret in every runtime', () => {
    expect(resolveNextAuthSecret({
      NODE_ENV: 'production',
      NEXTAUTH_SECRET: 'configured-secret',
    })).toBe('configured-secret');
  });

  it('generates one stable secret only for plain local development', () => {
    const environment = { NODE_ENV: 'development' };

    const first = resolveNextAuthSecret(environment);
    const second = resolveNextAuthSecret(environment);

    expect(first).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(second).toBe(first);
  });

  it.each([
    { NODE_ENV: 'production' },
    { NODE_ENV: 'development', VERCEL: '1', VERCEL_ENV: 'preview' },
  ])('does not invent a secret outside plain local development', (environment) => {
    expect(resolveNextAuthSecret(environment)).toBeUndefined();
  });
});
