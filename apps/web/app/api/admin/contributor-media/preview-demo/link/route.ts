import { NextResponse } from 'next/server';
import { requireActiveStaff } from '@/lib/server/active-staff';
import {
  getPreviewOwnerMediaReconciliation,
  reconcilePreviewOwnerMedia,
} from '@/lib/server/contributor-media';
import { isPreviewOwnerMediaDemoActor } from '@/lib/server/preview-owner-media-demo';

const ROUTE = '/api/admin/contributor-media/preview-demo/link';

export async function GET() {
  const authorization = await requirePreviewOwner();
  if (authorization instanceof NextResponse) return authorization;
  const reconciliation = await getPreviewOwnerMediaReconciliation(authorization.actor);
  return NextResponse.json({ reconciliation });
}

export async function POST(request: Request) {
  const authorization = await requirePreviewOwner();
  if (authorization instanceof NextResponse) return authorization;
  const body = await parseLinkRequest(request);
  if (!body) return NextResponse.json({ error: 'Invalid Preview reconciliation request.' }, { status: 400 });

  const result = await reconcilePreviewOwnerMedia({ actor: authorization.actor, ...body });
  if (result.status === 'conflict' || result.value.status === 'conflict') {
    return NextResponse.json({ category: 'conflict', action: 'reload' }, { status: 409 });
  }
  if (result.value.status === 'forbidden' || result.value.status === 'invalid-link') {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }
  if (result.value.status !== 'linked' && result.value.status !== 'existing') {
    return NextResponse.json({ category: 'conflict', action: 'reload' }, { status: 409 });
  }
  return NextResponse.json({ submission: result.value.submission });
}

async function requirePreviewOwner() {
  const authorization = await requireActiveStaff({
    action: 'contributor-media:preview-owner-reconciliation',
    route: ROUTE,
    capability: 'administrator',
  });
  if (!authorization.ok) return authorization.response;
  if (!isPreviewOwnerMediaDemoActor(authorization.actor)) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }
  return authorization;
}

async function parseLinkRequest(request: Request): Promise<{
  submissionId: string;
  expectedRevision: number;
  candidateId: string;
} | null> {
  try {
    const body = await request.json() as Record<string, unknown>;
    if (Object.keys(body).length !== 3 || typeof body.submissionId !== 'string'
      || typeof body.expectedRevision !== 'number' || !Number.isSafeInteger(body.expectedRevision)
      || typeof body.candidateId !== 'string') {
      return null;
    }
    return {
      submissionId: body.submissionId,
      expectedRevision: body.expectedRevision,
      candidateId: body.candidateId,
    };
  } catch {
    return null;
  }
}
