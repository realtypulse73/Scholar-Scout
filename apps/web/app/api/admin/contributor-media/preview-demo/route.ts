import { NextResponse } from 'next/server';
import { requireActiveStaff } from '@/lib/server/active-staff';
import { grantContributorMediaInvitation } from '@/lib/server/contributor-media';
import { isPreviewOwnerMediaDemoActor } from '@/lib/server/preview-owner-media-demo';

const ROUTE = '/api/admin/contributor-media/preview-demo';

export async function GET() {
  const authorization = await requireActiveStaff({
    action: 'contributor-media:preview-owner-demo',
    route: ROUTE,
    capability: 'administrator',
  });
  if (!authorization.ok) return authorization.response;
  if (!isPreviewOwnerMediaDemoActor(authorization.actor)) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }
  return NextResponse.json({ available: true });
}

/** Creates the owner invitation from the trusted session; request input is intentionally ignored. */
export async function POST(request: Request) {
  void request;
  const authorization = await requireActiveStaff({
    action: 'contributor-media:preview-owner-demo',
    route: ROUTE,
    capability: 'administrator',
  });
  if (!authorization.ok) return authorization.response;
  if (!isPreviewOwnerMediaDemoActor(authorization.actor)) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const result = await grantContributorMediaInvitation({
    accountId: authorization.actor.id,
    staffId: authorization.actor.id,
  });
  if (result.status === 'conflict') {
    return NextResponse.json({ category: 'conflict', action: 'reload' }, { status: 409 });
  }
  if (result.value.status === 'unknown-account') {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }
  return NextResponse.json({ status: 'ready' });
}
