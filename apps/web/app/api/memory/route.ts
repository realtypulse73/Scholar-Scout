import { NextResponse } from 'next/server';
import { getMemory, updateMemory } from '@/lib/server/platform-store';
import { resolveStudentActor } from '@/lib/server/student-actor';

export async function GET() {
  const actor = await resolveStudentActor({ allowGuest: true });

  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ memory: await getMemory(actor.storageKey) });
}

export async function POST() {
  const actor = await resolveStudentActor({ allowGuest: true });

  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    memory: await updateMemory(actor.storageKey),
  });
}
