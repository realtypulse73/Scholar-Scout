import { NextResponse } from 'next/server';
import { parseJsonRequest } from '@/lib/api-request';
import { parseQualificationRecord } from '@/lib/qualification-record';
import {
  getQualificationRecord,
  PersistenceConflictError,
  saveQualificationRecord,
} from '@/lib/server/data-store';
import { resolveStudentActor } from '@/lib/server/student-actor';

const MAX_QUALIFICATION_REQUEST_BYTES = 4 * 1024;

export async function GET() {
  const actor = await resolveActor();
  if (actor instanceof NextResponse) return actor;
  return NextResponse.json({ record: await getQualificationRecord(actor.storageKey) });
}

export async function POST(request: Request) {
  const actor = await resolveActor();
  if (actor instanceof NextResponse) return actor;
  const body = await parseJsonRequest(request, { maxBytes: MAX_QUALIFICATION_REQUEST_BYTES, validate: parseQualificationRecord });
  if (!body.ok) return NextResponse.json({ error: 'Invalid qualification record.' }, { status: body.error === 'body-too-large' ? 413 : 400 });
  try {
    await saveQualificationRecord(actor.storageKey, body.value);
  } catch (error) {
    if (error instanceof PersistenceConflictError) return studentConflictResponse();
    throw error;
  }
  return NextResponse.json({ ok: true });
}

async function resolveActor() {
  try {
    const actor = await resolveStudentActor({ allowGuest: false });
    return actor?.kind === 'account' ? actor : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Student identity is not available right now.' }, { status: 503 });
  }
}

function studentConflictResponse() {
  return NextResponse.json({ error: 'Student data changed. Reload and try again.', category: 'conflict', action: 'reload' }, { status: 409 });
}
