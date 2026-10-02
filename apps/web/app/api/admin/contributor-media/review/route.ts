import { NextResponse } from 'next/server';
import { requireActiveStaff } from '@/lib/server/active-staff';
import {
  getContributorMediaReviewQueue,
  reviewContributorMedia,
} from '@/lib/server/contributor-media';

const ROUTE = '/api/admin/contributor-media/review';

export async function GET() {
  const authorization = await requireActiveStaff({
    action: 'contributor-media:review-queue',
    route: ROUTE,
    capability: 'reviewer',
  });
  if (!authorization.ok) return authorization.response;
  return NextResponse.json({ items: await getContributorMediaReviewQueue() });
}

export async function POST(request: Request) {
  const authorization = await requireActiveStaff({
    action: 'contributor-media:review',
    route: ROUTE,
    capability: 'reviewer',
  });
  if (!authorization.ok) return authorization.response;

  let body: { submissionId?: unknown; expectedRevision?: unknown; decision?: unknown };
  try {
    body = await request.json() as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid contributor review request.' }, { status: 400 });
  }
  if (typeof body.submissionId !== 'string' || typeof body.expectedRevision !== 'number'
    || (body.decision !== 'approve' && body.decision !== 'action-needed')) {
    return NextResponse.json({ error: 'Invalid contributor review request.' }, { status: 400 });
  }
  const result = await reviewContributorMedia({
    actor: authorization.actor,
    submissionId: body.submissionId,
    expectedRevision: body.expectedRevision,
    decision: body.decision,
  });
  if (result.status === 'conflict') {
    return NextResponse.json({ category: 'conflict', action: 'reload' }, { status: 409 });
  }
  if (result.status !== 'applied') {
    return NextResponse.json({ category: 'conflict', action: 'reload' }, { status: 409 });
  }
  const value = result.value;
  if (value.status === 'forbidden' || value.status === 'invalid-link') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (value.status === 'conflict') {
    return NextResponse.json({ category: 'conflict', action: 'reload' }, { status: 409 });
  }
  return NextResponse.json({ submission: value.submission });
}
