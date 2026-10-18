import { NextResponse } from 'next/server';
import { reinspectCurrentContributorMediaPackage } from '@/lib/server/contributor-media';
import { resolveStudentActor } from '@/lib/server/student-actor';

export async function POST() {
  const actor = await resolveAccountActor();
  if (actor instanceof NextResponse) return actor;
  const result = await reinspectCurrentContributorMediaPackage({ actor });
  if (result.status === 'conflict' || result.value.status === 'conflict') return conflict();
  if (result.value.status === 'forbidden') {
    return NextResponse.json({ error: 'Contributor invitation required.' }, { status: 403 });
  }
  if (result.value.status !== 'ready' && result.value.status !== 'action-needed') return conflict();
  return NextResponse.json({ submission: result.value.submission });
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
