import { NextResponse } from 'next/server';
import { isExactObject, parseJsonRequest } from '@/lib/api-request';
import {
  issueCredentialGrant,
  verifyUserCredentials,
} from '@/lib/server/data-store';
import { getTrustedRequestIp } from '@/lib/server/request-ip';
import { reserveSignInAttempt } from '@/lib/server/rate-limit';

const MAX_CREDENTIAL_BODY_BYTES = 1_024;

interface CredentialPayload {
  email: string;
  password: string;
}

/** Exchanges exact credentials for a short-lived server grant that NextAuth consumes once. */
export async function POST(request: Request): Promise<NextResponse> {
  const parsed = await parseJsonRequest(request, {
    maxBytes: MAX_CREDENTIAL_BODY_BYTES,
    validate: parseCredentialPayload,
  });

  if (!parsed.ok) {
    return NextResponse.json({ error: 'invalid-credentials' }, { status: 400 });
  }

  const trustedIp = getTrustedRequestIp(request.headers);

  if (trustedIp.status !== 'available') {
    return unavailableResponse();
  }

  const reservation = await reserveSignInAttempt({
    email: parsed.value.email,
    ip: trustedIp.ip,
  });

  if (reservation.status === 'unavailable') {
    return unavailableResponse();
  }

  if (reservation.status === 'denied') {
    return NextResponse.json(
      { error: 'rate-limited', resetAt: reservation.resetAt.toISOString() },
      {
        status: 429,
        headers: { 'Retry-After': String(reservation.retryAfterSeconds) },
      },
    );
  }

  const result = await verifyUserCredentials(
    parsed.value.email,
    parsed.value.password,
  );

  if (result.status !== 'verified') {
    return NextResponse.json({ error: result.status }, { status: 401 });
  }

  return NextResponse.json({
    grant: issueCredentialGrant({
      email: parsed.value.email,
      ip: trustedIp.ip,
      user: result.user,
    }),
  });
}

function parseCredentialPayload(value: unknown): CredentialPayload | null {
  if (!isExactObject(value, ['email', 'password'])) {
    return null;
  }

  if (typeof value.email !== 'string' || typeof value.password !== 'string') {
    return null;
  }

  const email = value.email.trim().toLowerCase();
  const password = value.password;

  if (
    email.length < 3 ||
    email.length > 320 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length < 8 ||
    password.length > 256
  ) {
    return null;
  }

  return { email, password };
}

function unavailableResponse(): NextResponse {
  return NextResponse.json(
    { error: 'credential-service-unavailable' },
    { status: 503 },
  );
}
