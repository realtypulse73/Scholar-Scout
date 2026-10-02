import { NextResponse } from 'next/server';
import { parseJsonRequest } from '@/lib/api-request';
import { removeContributorMediaSubmission } from '@/lib/server/contributor-media';
import { resolveStudentActor } from '@/lib/server/student-actor';

export async function POST(request: Request) {
  const actor = await resolveAccountActor();
  if (actor instanceof NextResponse) return actor;
  const body = await parseJsonRequest(request, { maxBytes: 512, validate: parseRemoval });
  if (!body.ok) return NextResponse.json({ error: 'Removal details are not valid.' }, { status: 400 });

  const result = await removeContributorMediaSubmission({ actor, expectedRevision: body.value.expectedRevision });
  if (result.status === 'conflict') return conflict();
  const outcome = result.value;
  if (outcome.status === 'conflict') return conflict();
  if (outcome.status === 'forbidden') {
    return NextResponse.json({ error: 'Contributor submission not found.' }, { status: 403 });
  }
  if (outcome.status !== 'removed') return conflict();
  return NextResponse.json({ submission: outcome.submission });
}

function parseRemoval(value: unknown): { expectedRevision: number } | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length === 1 && Number.isSafeInteger(record.expectedRevision)
    && (record.expectedRevision as number) > 0
    ? { expectedRevision: record.expectedRevision as number }
    : null;
}

async function resolveAccountActor() {
  try {
    const actor = await resolveStudentActor({ allowGuest: false });
    return actor?.kind === 'account'
      ? actor
      : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Student identity is not available right now.' }, { status: 503 });
  }
}

function conflict() {
  return NextResponse.json(
    { error: 'Your contributor record changed. Reload and try again.', category: 'conflict', action: 'reload' },
    { status: 409 },
  );
}
