import { NextResponse } from 'next/server';
import { parseJsonRequest } from '@/lib/api-request';
import { issueContributorMediaUpload } from '@/lib/server/contributor-media';
import { resolveStudentActor } from '@/lib/server/student-actor';

const MAX_UPLOAD_REQUEST_BYTES = 4 * 1024;

export async function POST(request: Request) {
  const actor = await resolveAccountActor();
  if (actor instanceof NextResponse) return actor;
  const body = await parseJsonRequest(request, { maxBytes: MAX_UPLOAD_REQUEST_BYTES, validate: (value) => value });
  if (!body.ok) return NextResponse.json({ error: 'Choose one supported video and poster.' }, { status: body.error === 'body-too-large' ? 413 : 400 });
  const result = await issueContributorMediaUpload({ actor, request: body.value });
  if (result.status === 'conflict' || result.value.status === 'conflict') return conflict();
  if (result.value.status === 'forbidden') return NextResponse.json({ error: 'Contributor invitation required.' }, { status: 403 });
  if (result.value.status === 'invalid-programme') return NextResponse.json({ error: 'Choose a current programme before uploading.' }, { status: 400 });
  if (result.value.status !== 'issued') return conflict();
  return NextResponse.json({ capability: result.value.capability });
}

async function resolveAccountActor() {
  const actor = await resolveStudentActor({ allowGuest: false });
  return actor?.kind === 'account' ? actor : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function conflict() {
  return NextResponse.json({ error: 'Your contributor record changed. Reload and try again.', category: 'conflict', action: 'reload' }, { status: 409 });
}
