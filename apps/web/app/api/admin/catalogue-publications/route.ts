import { NextResponse } from 'next/server';
import { requireActiveStaff } from '@/lib/server/active-staff';
import {
  CatalogueCandidateOwnershipError,
  CatalogueCandidateChecklistError,
  CatalogueCandidateConflictReasonError,
  CatalogueCandidateReviewError,
  CatalogueCandidateRevisionConflictError,
  CataloguePublicationConflictError,
  CatalogueReleaseAuthorizationError,
  CatalogueReleaseScheduleError,
  CatalogueReleaseSelectionError,
  getCatalogueCandidateHistory,
  getCatalogueCandidateIntake,
  getCatalogueSnapshotHistory,
  previewWeeklyCatalogueRelease,
  publishEmergencyCatalogueSnapshot,
  publishWeeklyCatalogueSnapshot,
  resolveCatalogueCandidateConflict,
  reviewCatalogueCandidate,
  restoreCatalogueSnapshot,
  stageCatalogueCandidate,
  submitCatalogueCandidate,
} from '@/lib/server/catalogue-publications';

const ROUTE = '/api/admin/catalogue-publications';

export async function POST(request: Request) {
  const action = getPostAction(request);
  if (action === 'review' || action === 'submit') {
    return handleReviewAction(request, action);
  }
  if (action === 'preview-weekly' || action === 'publish-weekly') {
    return handleWeeklyReleaseAction(request, action);
  }
  if (action === 'resolve-conflict') {
    return handleConflictResolutionAction(request);
  }
  if (action === 'emergency-correction' || action === 'restore-snapshot') {
    return handleRecoveryAction(request, action);
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

  const view = getQueryParameter(request, 'view');
  if (view === 'candidate-intake') {
    return NextResponse.json({
      ok: true,
      capabilities: authorization.actor.capabilities instanceof Set
        ? [...authorization.actor.capabilities].sort()
        : [],
      candidates: await getCatalogueCandidateIntake(),
    });
  }
  if (view === 'snapshot-history') {
    return NextResponse.json({ ok: true, history: await getCatalogueSnapshotHistory() });
  }

  const candidateId = getQueryParameter(request, 'candidateId');
  if (!candidateId || candidateId.length > 160) {
    return NextResponse.json({ error: 'Catalogue candidate history was not found.' }, { status: 404 });
  }
  const history = await getCatalogueCandidateHistory(candidateId);
  return history
    ? NextResponse.json({ ok: true, history })
    : NextResponse.json({ error: 'Catalogue candidate history was not found.' }, { status: 404 });
}

function getPostAction(request: Request):
  | 'stage'
  | 'review'
  | 'submit'
  | 'preview-weekly'
  | 'publish-weekly'
  | 'resolve-conflict'
  | 'emergency-correction'
  | 'restore-snapshot' {
  const action = getQueryParameter(request, 'action');
  return action === 'review' || action === 'submit'
    || action === 'preview-weekly' || action === 'publish-weekly'
    || action === 'resolve-conflict' || action === 'emergency-correction'
    || action === 'restore-snapshot'
    ? action
    : 'stage';
}

async function handleConflictResolutionAction(request: Request) {
  const authorization = await requireActiveStaff({
    action: 'catalogue-publication:resolve-conflict',
    route: ROUTE,
    capability: 'editor',
  });
  if (!authorization.ok) return authorization.response;

  let body: {
    candidateId?: unknown;
    expectedRevision?: unknown;
    attempted?: { title?: unknown; claimBoundary?: unknown };
    choices?: { title?: unknown; claimBoundary?: unknown };
    reason?: unknown;
  };
  try {
    body = await request.json() as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid catalogue conflict request.' }, { status: 400 });
  }
  if (typeof body.candidateId !== 'string' || typeof body.expectedRevision !== 'number'
    || !body.attempted || !body.choices) {
    return NextResponse.json({ error: 'Invalid catalogue conflict request.' }, { status: 400 });
  }
  try {
    const result = await resolveCatalogueCandidateConflict({
      actor: authorization.actor,
      candidateId: body.candidateId,
      expectedRevision: body.expectedRevision,
      attempted: body.attempted,
      choices: body.choices,
      reason: body.reason,
    });
    return NextResponse.json({ ok: true, ...result }, { status: result.status === 'conflict' ? 409 : 200 });
  } catch (error) {
    if (error instanceof CatalogueCandidateConflictReasonError) {
      return NextResponse.json({ error: 'Explain why the older value should be retained.' }, { status: 400 });
    }
    if (error instanceof CatalogueCandidateReviewError || error instanceof CatalogueCandidateOwnershipError) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (error instanceof CatalogueCandidateRevisionConflictError || error instanceof CataloguePublicationConflictError) {
      return NextResponse.json({ error: 'This catalogue candidate changed. Review both values before resolving it.' }, { status: 409 });
    }
    throw error;
  }
}

async function handleRecoveryAction(
  request: Request,
  action: 'emergency-correction' | 'restore-snapshot',
) {
  const authorization = await requireActiveStaff({
    action: `catalogue-publication:${action}`,
    route: ROUTE,
    capability: action === 'emergency-correction' ? 'reviewer' : 'administrator',
  });
  if (!authorization.ok) return authorization.response;

  let body: {
    candidateId?: unknown;
    expectedRevision?: unknown;
    candidate?: unknown;
    targetSnapshotId?: unknown;
    reason?: unknown;
  };
  try {
    body = await request.json() as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid catalogue recovery request.' }, { status: 400 });
  }
  try {
    const result = action === 'emergency-correction'
      ? await publishEmergencyCatalogueSnapshot({
        actor: authorization.actor,
        candidateId: typeof body.candidateId === 'string' ? body.candidateId : '',
        expectedRevision: typeof body.expectedRevision === 'number' ? body.expectedRevision : 0,
        candidate: body.candidate,
        reason: body.reason,
      })
      : await restoreCatalogueSnapshot({
        actor: authorization.actor,
        targetSnapshotId: typeof body.targetSnapshotId === 'string' ? body.targetSnapshotId : '',
        reason: body.reason,
      });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof CatalogueCandidateChecklistError || error instanceof CatalogueReleaseSelectionError) {
      return NextResponse.json({ error: 'The catalogue recovery request needs correction before it can be released.' }, { status: 400 });
    }
    if (error instanceof CatalogueReleaseAuthorizationError) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (error instanceof CatalogueCandidateRevisionConflictError || error instanceof CataloguePublicationConflictError) {
      return NextResponse.json({ error: 'This catalogue changed. Reload before making a recovery release.' }, { status: 409 });
    }
    throw error;
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

async function handleWeeklyReleaseAction(
  request: Request,
  action: 'preview-weekly' | 'publish-weekly',
) {
  const authorization = await requireActiveStaff({
    action: `catalogue-publication:${action}`,
    route: ROUTE,
    capability: 'administrator',
  });
  if (!authorization.ok) return authorization.response;

  let body: { candidateIds?: unknown };
  try {
    body = await request.json() as { candidateIds?: unknown };
  } catch {
    return NextResponse.json({ error: 'Invalid catalogue publication request.' }, { status: 400 });
  }
  if (!Array.isArray(body.candidateIds) || body.candidateIds.some((id) => typeof id !== 'string')) {
    return NextResponse.json({ error: 'Invalid catalogue publication request.' }, { status: 400 });
  }

  try {
    const result = action === 'preview-weekly'
      ? await previewWeeklyCatalogueRelease({
        actor: authorization.actor,
        candidateIds: body.candidateIds,
      })
      : await publishWeeklyCatalogueSnapshot({
        actor: authorization.actor,
        candidateIds: body.candidateIds,
      });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof CatalogueReleaseAuthorizationError) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (error instanceof CatalogueReleaseScheduleError || error instanceof CatalogueReleaseSelectionError) {
      return NextResponse.json({ error: 'This catalogue release is not currently eligible. Review and try again.' }, { status: 400 });
    }
    if (error instanceof CataloguePublicationConflictError) {
      return NextResponse.json({ error: 'This catalogue release changed. Reload and try again.' }, { status: 409 });
    }
    throw error;
  }
}

function getQueryParameter(request: Request, name: string): string | null {
  try {
    return new URL(request.url).searchParams.get(name);
  } catch {
    return null;
  }
}
