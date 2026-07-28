import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/auth';
import { migrateGuestOwnedRecords } from '@/lib/server/platform-store';
import {
  clearGuestActorCookie,
  resolveExistingGuestActor,
} from '@/lib/server/student-actor';

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const guestActor = await resolveExistingGuestActor();

  if (!guestActor) {
    return NextResponse.json({ ok: true, migrated: false });
  }

  const result = await migrateGuestOwnedRecords({
    guestId: guestActor.guestId,
    accountId: session.user.id,
  });

  if (result.migrated || result.alreadyMigrated) {
    await clearGuestActorCookie();
  }

  return NextResponse.json({ ok: true, migrated: result.migrated });
}
