import { NextResponse } from 'next/server';
import { parseJsonRequest } from '@/lib/api-request';
import { validateContributorAttestation } from '@/lib/contributor-media';
import { createContributorMediaDraft } from '@/lib/server/contributor-media';
import { resolveStudentActor } from '@/lib/server/student-actor';

const MAX_ATTESTATION_REQUEST_BYTES = 2 * 1024;

export async function POST(request: Request) {
  const actor = await resolveAccountActor();
  if (actor instanceof NextResponse) return actor;

  const body = await parseJsonRequest(request, {
    maxBytes: MAX_ATTESTATION_REQUEST_BYTES,
    validate: (value) => {
      const parsed = validateContributorAttestation(value);
      return parsed.ok ? parsed.value : null;
    },
  });
  if (!body.ok) {
    return NextResponse.json(
      { error: 'Complete the adult contributor attestation before continuing.' },
      { status: body.error === 'body-too-large' ? 413 : 400 },
    );
  }

  const result = await createContributorMediaDraft({ actor, attestation: body.value });
  if (result.status === 'conflict') {
    return NextResponse.json(
      { error: 'Your contributor record changed. Reload and try again.', category: 'conflict', action: 'reload' },
      { status: 409 },
    );
  }
  const outcome = result.value;
  if (outcome.status === 'conflict') {
    return NextResponse.json(
      { error: 'Your contributor record changed. Reload and try again.', category: 'conflict', action: 'reload' },
      { status: 409 },
    );
  }
  if (outcome.status === 'forbidden') {
    return NextResponse.json({ error: 'Contributor invitation required.' }, { status: 403 });
  }

  return NextResponse.json({ submission: outcome.submission });
}

async function resolveAccountActor() {
  try {
    const actor = await resolveStudentActor({ allowGuest: false });
    return actor?.kind === 'account'
      ? actor
      : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  } catch {
    return NextResponse.json(
      { error: 'Student identity is not available right now.' },
      { status: 503 },
    );
  }
}
