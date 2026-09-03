import 'server-only';

import { isIP } from 'node:net';

export type TrustedRequestIp =
  | { status: 'available'; ip: string }
  | { status: 'unavailable' };

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
