import { NextResponse } from 'next/server';
import { requireActiveStaff } from '@/lib/server/active-staff';
import {
  CatalogueCandidateOwnershipError,
  CatalogueCandidateReviewError,
  CatalogueCandidateRevisionConflictError,
  CataloguePublicationConflictError,
  getCatalogueCandidateHistory,
  reviewCatalogueCandidate,
  stageCatalogueCandidate,
  submitCatalogueCandidate,
} from '@/lib/server/catalogue-publications';

const ROUTE = '/api/admin/catalogue-publications';

export async function POST(request: Request) {
  const action = getPostAction(request);
  if (action === 'review' || action === 'submit') {
    return handleReviewAction(request, action);
  }

  const authorization = await requireActiveStaff({
    action: 'catalogue-publication:stage',
    route: ROUTE,
    capability: 'editor',
  });

  if (!authorization.ok) return authorization.response;

  let body: { action?: unknown; candidate?: unknown };
  try {
    body = await request.json() as { action?: unknown; candidate?: unknown };
  } catch {
    return NextResponse.json({ error: 'Invalid catalogue publication request.' }, { status: 400 });
  }

  if (body.action !== 'stage') {
    return NextResponse.json({ error: 'Unsupported catalogue publication action.' }, { status: 400 });
  }

  try {
    const result = await stageCatalogueCandidate({
      actor: authorization.actor,
      candidate: body.candidate,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof CataloguePublicationConflictError) {
      return NextResponse.json(
        { error: 'This catalogue draft changed before it could be staged. Reload and try again.' },
        { status: 409 },
      );
    }
    throw error;
  }
}

export async function GET(request: Request) {
  const authorization = await requireActiveStaff({
    action: 'catalogue-publication:history',
    route: ROUTE,
  });
  if (!authorization.ok) return authorization.response;

  const candidateId = new URL(request.url).searchParams.get('candidateId');
  if (!candidateId || candidateId.length > 160) {
    return NextResponse.json({ error: 'Catalogue candidate history was not found.' }, { status: 404 });
  }
  const history = await getCatalogueCandidateHistory(candidateId);
  return history
    ? NextResponse.json({ ok: true, history })
    : NextResponse.json({ error: 'Catalogue candidate history was not found.' }, { status: 404 });
}

function getPostAction(request: Request): 'stage' | 'review' | 'submit' {
  try {
    const action = new URL(request.url).searchParams.get('action');
    return action === 'review' || action === 'submit' ? action : 'stage';
  } catch {
    return 'stage';
  }
}

async function handleReviewAction(request: Request, action: 'review' | 'submit') {
  const authorization = await requireActiveStaff({
    action: `catalogue-publication:${action}`,
    route: ROUTE,
  });
  if (!authorization.ok) return authorization.response;

  let body: { candidateId?: unknown; expectedRevision?: unknown };
  try {
    body = await request.json() as { candidateId?: unknown; expectedRevision?: unknown };
  } catch {
    return NextResponse.json({ error: 'Invalid catalogue publication request.' }, { status: 400 });
  }
  const expectedRevision = body.expectedRevision;
  if (typeof body.candidateId !== 'string' || typeof expectedRevision !== 'number'
    || !Number.isSafeInteger(expectedRevision) || expectedRevision < 1) {
    return NextResponse.json({ error: 'Invalid catalogue publication request.' }, { status: 400 });
  }

  try {
    const result = action === 'review'
      ? await reviewCatalogueCandidate({
        actor: authorization.actor,
        candidateId: body.candidateId,
        expectedRevision,
      })
      : await submitCatalogueCandidate({
        actor: authorization.actor,
        candidateId: body.candidateId,
        expectedRevision,
      });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof CatalogueCandidateReviewError || error instanceof CatalogueCandidateOwnershipError) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (error instanceof CatalogueCandidateRevisionConflictError
      || error instanceof CataloguePublicationConflictError) {
      return NextResponse.json(
        { error: 'This catalogue candidate changed. Reload and try again.' },
        { status: 409 },
      );
    }
    throw error;
  }
}
