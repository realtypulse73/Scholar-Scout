import { NextResponse } from 'next/server';

import {
  cleanupE2eProgrammeFixture,
  createE2eProgrammeFixture,
  verifyE2eProgrammeFixture,
} from '@/lib/server/e2e-programme-fixture';

const PROTOCOL = 'lifecycle-v1';

function deny(): NextResponse {
  return NextResponse.json({ error: 'Fixture lifecycle unavailable.' }, { status: 403 });
}

function hasBrowserShape(request: Request): boolean {
  return Boolean(
    request.headers.get('origin') || request.headers.get('cookie') ||
    request.headers.get('sec-fetch-site') || request.headers.get('sec-fetch-mode') ||
    request.headers.get('sec-fetch-dest'),
  );
}

function isAuthorized(request: Request): boolean {
  const capability = process.env.SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY;
  return process.env.VERCEL_ENV !== 'production' &&
    process.env.SCHOLARSCOUT_E2E_FIXTURE_ENABLED === 'true' &&
    Boolean(capability) &&
    request.headers.get('authorization') === `Bearer ${capability}` &&
    request.headers.get('x-scholarscout-e2e-fixture-protocol') === PROTOCOL &&
    new URL(request.url).search === '' && request.body === null && !hasBrowserShape(request);
}

async function guard(request: Request): Promise<NextResponse | null> {
  return isAuthorized(request) ? null : deny();
}

export async function POST(request: Request): Promise<NextResponse> {
  const rejected = await guard(request);
  if (rejected) return rejected;
  await createE2eProgrammeFixture();
  await verifyE2eProgrammeFixture();
  return NextResponse.json({ ok: true, phase: 'verified' });
}

export async function GET(request: Request): Promise<NextResponse> {
  const rejected = await guard(request);
  if (rejected) return rejected;
  await verifyE2eProgrammeFixture();
  return NextResponse.json({ ok: true, phase: 'verified' });
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const rejected = await guard(request);
  if (rejected) return rejected;
  await cleanupE2eProgrammeFixture();
  return NextResponse.json({ ok: true, phase: 'cleaned' });
}
