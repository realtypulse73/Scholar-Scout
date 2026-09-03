import { NextResponse } from 'next/server';

import {
  cleanupE2eProgrammeFixture,
  createE2eProgrammeFixture,
  verifyE2eCommunityOutageNoWrite,
  verifyE2eProgrammeFixture,
} from '@/lib/server/e2e-programme-fixture';

const PROTOCOL = 'lifecycle-v1';

type DenialReason =
  | 'browser-shaped'
  | 'capability-mismatch'
  | 'fixture-disabled'
  | 'non-empty-transport'
  | 'production'
  | 'protocol-mismatch'
  | 'query-present';

function deny(reason: DenialReason): NextResponse {
  if (process.env.VERCEL_ENV !== 'production') {
    console.warn('E2E fixture lifecycle denied.', { reason });
  }
  return NextResponse.json({ error: 'Fixture lifecycle unavailable.' }, { status: 403 });
}

function hasBrowserShape(request: Request): boolean {
  return Boolean(
    request.headers.get('origin') || request.headers.get('referer') || request.headers.get('cookie') ||
    request.headers.get('sec-fetch-site') || request.headers.get('sec-fetch-mode') ||
    request.headers.get('sec-fetch-dest') || request.headers.get('sec-fetch-user') ||
    request.headers.get('sec-ch-ua'),
  );
}

async function hasNoBodyTransport(request: Request): Promise<boolean> {
  const contentLength = request.headers.get('content-length');
  if (request.headers.has('transfer-encoding')) return false;
  if (contentLength !== null && contentLength !== '0') return false;
  if (request.body === null) return contentLength === null || contentLength === '0';
  // Vercel/Next can expose a zero-byte request as an empty stream and omit the
  // original content-length header. Capability and protocol checks run first.
  return (await request.arrayBuffer()).byteLength === 0;
}

async function getDenialReason(request: Request): Promise<DenialReason | null> {
  const capability = process.env.SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY;
  if (process.env.VERCEL_ENV === 'production') return 'production';
  if (process.env.SCHOLARSCOUT_E2E_FIXTURE_ENABLED !== 'true') return 'fixture-disabled';
  if (!capability || request.headers.get('x-scholarscout-e2e-fixture-capability') !== capability) {
    return 'capability-mismatch';
  }
  if (request.headers.get('x-scholarscout-e2e-fixture-protocol') !== PROTOCOL) {
    return 'protocol-mismatch';
  }
  if (new URL(request.url).search !== '') return 'query-present';
  if (!(await hasNoBodyTransport(request))) return 'non-empty-transport';
  if (hasBrowserShape(request)) return 'browser-shaped';
  return null;
}

async function guard(request: Request): Promise<NextResponse | null> {
  const reason = await getDenialReason(request);
  return reason ? deny(reason) : null;
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

export async function PUT(request: Request): Promise<NextResponse> {
  const rejected = await guard(request);
  if (rejected) return rejected;
  await verifyE2eCommunityOutageNoWrite();
  return NextResponse.json({ ok: true, phase: 'no-write' });
}
