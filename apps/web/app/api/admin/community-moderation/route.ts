import { NextResponse } from 'next/server';
import { requireActiveStaff } from '@/lib/server/active-staff';
import {
  listPendingReviewCampusNotes,
  removePendingReviewCampusNote,
  restorePendingReviewCampusNote,
} from '@/lib/server/operational-records';

const ROUTE = '/api/admin/community-moderation';

export async function GET() {
  const authorization = await requireActiveStaff({
    action: 'community-moderation:read',
    route: ROUTE,
  });

  if (!authorization.ok) {
    return authorization.response;
  }

  return NextResponse.json({ records: await listPendingReviewCampusNotes() });
}

export async function POST(request: Request) {
  const authorization = await requireActiveStaff({
    action: 'community-moderation:resolve',
    route: ROUTE,
  });

  if (!authorization.ok) {
    return authorization.response;
  }

  const input = await parseResolutionRequest(request);
  if (!input) {
    return NextResponse.json({ error: 'Choose a pending note and resolution action.' }, { status: 400 });
  }

  const result = input.action === 'restore'
    ? await restorePendingReviewCampusNote(input.noteId)
    : await removePendingReviewCampusNote(input.noteId);

  if (result.status === 'conflict') {
    return NextResponse.json(
      { error: 'This note changed before it could be resolved. Refresh the queue and try again.' },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true, status: result.status });
}

async function parseResolutionRequest(
  request: Request,
): Promise<{ noteId: string; action: 'restore' | 'remove' } | null> {
  try {
    const input: unknown = await request.json();
    if (!input || typeof input !== 'object' || Array.isArray(input)) return null;

    const { noteId, action } = input as Record<string, unknown>;
    if (typeof noteId !== 'string' || !noteId.trim()) return null;
    if (action !== 'restore' && action !== 'remove') return null;

    return { noteId: noteId.trim(), action };
  } catch {
    return null;
  }
}
