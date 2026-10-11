import { NextResponse } from 'next/server';
import { isExactObject, parseJsonRequest } from '@/lib/api-request';
import {
  issueCredentialGrant,
  issuePreviewOwnerCredentialGrant,
  verifyUserCredentials,
} from '@/lib/server/data-store';
import {
  getTrustedRequestIp,
  isLocalDevelopmentAuthenticationEnvironment,
} from '@/lib/server/request-ip';
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

  let credentialIp = 'local-development';
  let usePreviewOwnerCredentialGrant = false;

  if (!isLocalDevelopmentAuthenticationEnvironment()) {
    const trustedIp = getTrustedRequestIp(request.headers);

    if (trustedIp.status !== 'available') {
      if (!isPreviewOwnerMediaDemoCredentialExchange(parsed.value.email)) {
        return unavailableResponse();
      }
      credentialIp = 'preview-owner-demo';
      usePreviewOwnerCredentialGrant = true;
    } else {
      const reservation = await reserveSignInAttempt({
        email: parsed.value.email,
        ip: trustedIp.ip,
      });

      if (
        reservation.status === 'unavailable' &&
        !isPreviewOwnerMediaDemoCredentialExchange(parsed.value.email)
      ) {
        return unavailableResponse();
      }

      if (reservation.status === 'unavailable') {
        usePreviewOwnerCredentialGrant = true;
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

      credentialIp = trustedIp.ip;
    }
  }

  const result = await verifyUserCredentials(
    parsed.value.email,
    parsed.value.password,
  );

  if (result.status !== 'verified') {
    return NextResponse.json({ error: result.status }, { status: 401 });
  }

  const grant = usePreviewOwnerCredentialGrant
    ? issuePreviewOwnerCredentialGrant({ user: result.user })
    : issueCredentialGrant({
      email: parsed.value.email,
      ip: credentialIp,
      user: result.user,
    });

  return grant
    ? NextResponse.json({ grant })
    : unavailableResponse();
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

/**
 * Keeps only the configured Preview school-demo owner moving if Vercel's
 * optional Preview Redis connection is unavailable. Production and every
 * other account continue to fail closed.
 */
function isPreviewOwnerMediaDemoCredentialExchange(
  email: string,
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  const configuredOwner = env.SCHOLARSCOUT_PREVIEW_OWNER_MEDIA_DEMO_OWNER_EMAIL
    ?.trim()
    .toLowerCase();

  return env.VERCEL_ENV === 'preview' &&
    env.SCHOLARSCOUT_PREVIEW_OWNER_MEDIA_DEMO === 'true' &&
    Boolean(configuredOwner) &&
    email === configuredOwner;
}
