import { NextResponse } from 'next/server';
import {
  cleanupE2eFixture,
  createAndVerifyE2eFixture,
  verifyE2eFixture,
} from '@/lib/server/e2e-programme-fixture';

const PROTOCOL = 'lifecycle-v1';

export async function POST(request: Request) {
  if (!isAuthorizedLifecycleRequest(request)) return denied();
  await createAndVerifyE2eFixture();
  return NextResponse.json({ ok: true, phase: 'verified' });
}

export async function GET(request: Request) {
  if (!isAuthorizedLifecycleRequest(request)) return denied();
  await verifyE2eFixture();
  return NextResponse.json({ ok: true, phase: 'verified' });
}

export async function DELETE(request: Request) {
  if (!isAuthorizedLifecycleRequest(request)) return denied();
  await cleanupE2eFixture();
  return NextResponse.json({ ok: true, phase: 'cleaned' });
}

function isAuthorizedLifecycleRequest(request: Request): boolean {
  // This route is deliberately enabled only by the branch-scoped Preview fixture switch.
  const capability = process.env.SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY;
  const url = new URL(request.url);
  if (
    process.env.VERCEL_ENV === 'production' ||
    process.env.SCHOLARSCOUT_E2E_FIXTURE !== 'true' ||
    !capability ||
    url.search ||
    request.body !== null ||
    request.headers.get('authorization') !== `Bearer ${capability}` ||
    request.headers.get('x-scholarscout-e2e-fixture-protocol') !== PROTOCOL ||
    (request.headers.get('content-length') && request.headers.get('content-length') !== '0') ||
    request.headers.get('content-type') ||
    request.headers.get('transfer-encoding') ||
    request.headers.get('origin') ||
    request.headers.get('referer') ||
    request.headers.get('cookie') ||
    request.headers.get('sec-fetch-site') ||
    request.headers.get('sec-fetch-mode') ||
    request.headers.get('sec-fetch-dest') ||
    request.headers.get('sec-fetch-user') ||
    request.headers.get('sec-ch-ua')
  ) return false;
  return true;
}

function denied() {
  return NextResponse.json({ error: 'Not found' }, { status: 403 });
}
