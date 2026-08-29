import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/auth';
import { reportCampusNoteForReview } from '@/lib/server/operational-records';

const PRIVATE_CONFIRMATION = 'Thanks. This note is no longer shown publicly while it is reviewed.';

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Sign in to report a note.' }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id.trim()) {
    return NextResponse.json({ error: 'Choose a note to report.' }, { status: 400 });
  }

  await reportCampusNoteForReview({ noteId: id, reporterId: session.user.id });
  return NextResponse.json({ ok: true, message: PRIVATE_CONFIRMATION });
}
