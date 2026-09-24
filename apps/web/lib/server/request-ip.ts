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
 * Resolves the client IP only from Vercel's overwritten client-address header.
 * Caller-controlled forwarded headers are deliberately ignored.
 */
export function getTrustedRequestIp(headers: Headers): TrustedRequestIp {
  const value = headers.get('x-vercel-forwarded-for')?.trim();

  if (!value || value.includes(',') || isIP(value) === 0) {
    return { status: 'unavailable' };
  }

  return { status: 'available', ip: value };
}
