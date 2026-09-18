import { NextResponse } from 'next/server';
import {
  assertE2eFixtureRuntimeConfiguration,
  cleanupE2eFixture,
  createAndVerifyE2eFixture,
  verifyE2eFixture,
} from '@/lib/server/e2e-programme-fixture';

const PROTOCOL = 'lifecycle-v1';

export async function HEAD(request: Request) {
  if (!isAuthorizedLifecycleRequest(request)) return denied(request);
  assertE2eFixtureRuntimeConfiguration();
  return new Response(null, { status: 204 });
}

export async function POST(request: Request) {
  if (!isAuthorizedLifecycleRequest(request)) return denied(request);
  await createAndVerifyE2eFixture();
  return NextResponse.json({ ok: true, phase: 'verified' });
}

export async function GET(request: Request) {
  if (!isAuthorizedLifecycleRequest(request)) return denied(request);
  await verifyE2eFixture();
  return NextResponse.json({ ok: true, phase: 'verified' });
}

export async function DELETE(request: Request) {
  if (!isAuthorizedLifecycleRequest(request)) return denied(request);
  await cleanupE2eFixture();
  return NextResponse.json({ ok: true, phase: 'cleaned' });
}

function isAuthorizedLifecycleRequest(request: Request): boolean {
  const capability = process.env.SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY;
  const url = new URL(request.url);
  if (
    process.env.VERCEL_ENV === 'production' ||
    process.env.SCHOLARSCOUT_E2E_FIXTURE !== 'true' ||
    !capability ||
    url.search ||
    request.headers.get('authorization') !== `Bearer ${capability}` ||
    request.headers.get('x-scholarscout-e2e-fixture-protocol') !== PROTOCOL ||
    (request.headers.get('content-length') && request.headers.get('content-length') !== '0') ||
    request.headers.get('content-type') ||
    request.headers.get('transfer-encoding') ||
    request.headers.get('origin') ||
    request.headers.get('referer') ||
    request.headers.get('cookie') ||
    request.headers.get('sec-fetch-site') ||
    isBrowserNavigationRequest(request) ||
    request.headers.get('sec-fetch-dest') ||
    request.headers.get('sec-fetch-user') ||
    request.headers.get('sec-ch-ua')
  ) return false;
  return true;
}

/**
 * Node's built-in fetch sends Sec-Fetch-Mode: cors without browser origin,
 * site, cookie, or client-hint metadata. That is the protected Preview
 * server-runner shape; browser navigations remain denied.
 */
function isBrowserNavigationRequest(request: Request): boolean {
  const mode = request.headers.get('sec-fetch-mode');
  return Boolean(mode && mode !== 'cors');
}

function denied(request: Request) {
  const capability = process.env.SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY;
  const hasFixtureCapability = Boolean(capability) &&
    request.headers.get('authorization') === `Bearer ${capability}`;
  const lifecycleEnabled = process.env.VERCEL_ENV !== 'production' &&
    process.env.SCHOLARSCOUT_E2E_FIXTURE === 'true';
  const denial = !hasFixtureCapability
    ? undefined
    : !lifecycleEnabled
      ? 'not-enabled'
      : getRejectedRequestShape(request);

  return NextResponse.json(
    { error: 'Not found' },
    {
      status: 403,
      headers: denial
        ? { 'x-scholarscout-e2e-fixture-denial': denial }
        : undefined,
    },
  );
}

function getRejectedRequestShape(request: Request): string | undefined {
  if (request.headers.get('content-length') && request.headers.get('content-length') !== '0') {
    return 'content-length';
  }
  if (request.headers.get('content-type') || request.headers.get('transfer-encoding')) {
    return 'content-metadata';
  }
  if (
    request.headers.get('origin') ||
    request.headers.get('referer') ||
    request.headers.get('cookie') ||
    request.headers.get('sec-fetch-site') ||
    isBrowserNavigationRequest(request) ||
    request.headers.get('sec-fetch-dest') ||
    request.headers.get('sec-fetch-user') ||
    request.headers.get('sec-ch-ua')
  ) return 'browser-metadata';
  return undefined;
}
