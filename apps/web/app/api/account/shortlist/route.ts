import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/auth';
import {
  getShortlist,
  getShortlistPlans,
  saveShortlist,
  saveShortlistPlans,
} from '@/lib/server/data-store';
import type { ShortlistPlanMap } from '@/lib/shortlist';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    programmeIds: await getShortlist(session.user.id),
    plans: await getShortlistPlans(session.user.id),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    programmeIds?: string[];
    plans?: ShortlistPlanMap;
  };
  await saveShortlist(session.user.id, body.programmeIds ?? []);
  await saveShortlistPlans(session.user.id, body.plans ?? {});

  return NextResponse.json({ ok: true });
}
