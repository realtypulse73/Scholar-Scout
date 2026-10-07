import 'server-only';

import { isIP } from 'node:net';

export type TrustedRequestIp =
  | { status: 'available'; ip: string }
  | { status: 'unavailable' };

type RuntimeEnvironment = Readonly<Record<string, string | undefined>>;

/**
 * Allows authentication routes to use local-only dependencies during next dev.
 * Any Vercel-marked or non-development environment must retain the trusted-IP
 * and atomic-reservation controls.
 */
export function isLocalDevelopmentAuthenticationEnvironment(
  env: RuntimeEnvironment = process.env,
): boolean {
  return env.NODE_ENV === 'development' && !env.VERCEL?.trim() && !env.VERCEL_ENV?.trim();
}

/**
 * Resolves the client IP from Vercel's overwritten client-address headers.
 * The ordinary forwarded header is considered only on Vercel and only when
 * Vercel's companion header is absent, so non-Vercel callers cannot choose a
 * rate-limit identity.
 */
export function getTrustedRequestIp(
  headers: Headers,
  env: RuntimeEnvironment = process.env,
): TrustedRequestIp {
  const vercelValue = headers.get('x-vercel-forwarded-for')?.trim();
  const value = vercelValue || (env.VERCEL?.trim()
    ? headers.get('x-forwarded-for')?.trim()
    : undefined);

  if (!value || value.includes(',') || isIP(value) === 0) {
    return { status: 'unavailable' };
  }

  return { status: 'available', ip: value };
}
