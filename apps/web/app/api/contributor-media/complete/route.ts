import { NextResponse } from 'next/server';
import { parseJsonRequest } from '@/lib/api-request';
import { completeContributorMediaUpload } from '@/lib/server/contributor-media';
import { resolveStudentActor } from '@/lib/server/student-actor';

export async function POST(request: Request) {
  const actor = await resolveAccountActor();
  if (actor instanceof NextResponse) return actor;
  const body = await parseJsonRequest(request, { maxBytes: 1024, validate: parseCompletion });
  if (!body.ok) return NextResponse.json({ error: 'Upload details are not valid.' }, { status: 400 });
  const result = await completeContributorMediaUpload({ actor, ...body.value });
  if (result.status === 'conflict' || result.value.status === 'conflict') return conflict();
  if (result.value.status === 'forbidden') return NextResponse.json({ error: 'Contributor invitation required.' }, { status: 403 });
  if (result.value.status !== 'ready' && result.value.status !== 'action-needed') return conflict();
  return NextResponse.json({ submission: result.value.submission });
}

function parseCompletion(value: unknown): { uploadId: string; expectedRevision: number } | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length === 2 && typeof record.uploadId === 'string'
    && /^[a-zA-Z0-9-]{1,160}$/.test(record.uploadId)
    && Number.isSafeInteger(record.expectedRevision) && (record.expectedRevision as number) > 0
    ? { uploadId: record.uploadId, expectedRevision: record.expectedRevision as number }
    : null;
}

async function resolveAccountActor() {
  const actor = await resolveStudentActor({ allowGuest: false });
  return actor?.kind === 'account' ? actor : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function conflict() {
  return NextResponse.json({ error: 'Your contributor record changed. Reload and try again.', category: 'conflict', action: 'reload' }, { status: 409 });
}
