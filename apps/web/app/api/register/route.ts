import { NextResponse } from 'next/server';
import { isExactObject, parseJsonRequest } from '@/lib/api-request';
import { createUser, getAccountRoleForEmail } from '@/lib/server/data-store';
import { getTrustedRequestIp } from '@/lib/server/request-ip';
import { reserveRegistration } from '@/lib/server/rate-limit';

const MAX_REGISTRATION_BODY_BYTES = 1_024;

interface RegistrationPayload {
  email: string;
  name: string;
  password: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  const parsed = await parseJsonRequest(request, {
    maxBytes: MAX_REGISTRATION_BODY_BYTES,
    validate: parseRegistrationPayload,
  });

  if (!parsed.ok) {
    return NextResponse.json(
      { error: 'Invalid registration details.' },
      { status: 400 },
    );
  }

  const trustedIp = getTrustedRequestIp(request.headers);

  if (trustedIp.status !== 'available') {
    return unavailableResponse();
  }

  const reservation = await reserveRegistration(trustedIp.ip);

  if (reservation.status === 'unavailable') {
    return unavailableResponse();
  }

  if (reservation.status === 'denied') {
    return NextResponse.json(
      {
        error: 'registration-rate-limited',
        resetAt: reservation.resetAt.toISOString(),
      },
      {
        status: 429,
        headers: { 'Retry-After': String(reservation.retryAfterSeconds) },
      },
    );
  }

  try {
    await createUser({
      email: parsed.value.email,
      name: parsed.value.name,
      password: parsed.value.password,
      role: getAccountRoleForEmail(parsed.value.email),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: 'Unable to create account.' },
      { status: 400 },
    );
  }
}

function parseRegistrationPayload(value: unknown): RegistrationPayload | null {
  if (!isExactObject(value, ['email', 'name', 'password'])) {
    return null;
  }

  if (
    typeof value.email !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.password !== 'string'
  ) {
    return null;
  }

  const email = value.email.trim().toLowerCase();
  const name = value.name.trim();
  const password = value.password;

  if (
    email.length < 3 ||
    email.length > 320 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    name.length > 160 ||
    password.length < 8 ||
    password.length > 256
  ) {
    return null;
  }

  return { email, name, password };
}

function unavailableResponse(): NextResponse {
  return NextResponse.json(
    { error: 'registration-service-unavailable' },
    { status: 503 },
  );
}
