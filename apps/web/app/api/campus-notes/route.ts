import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/auth';
import { creatorProfiles } from '@/lib/platform';
import { createCampusNote, getCampusNotes } from '@/lib/server/data-store';
import type { CampusNote } from '@/lib/campus-community';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const schoolSlug = url.searchParams.get('school');
  const uploaderUsername = url.searchParams.get('uploader') ?? undefined;
  if (!schoolSlug) return NextResponse.json({ error: 'school is required.' }, { status: 400 });
  return NextResponse.json({ notes: await getCampusNotes(schoolSlug, uploaderUsername) });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in to post a note.' }, { status: 401 });
  const input = (await request.json()) as Omit<CampusNote, 'id' | 'author_id' | 'created_at'>;
  const uploader = input.uploader_username
    ? creatorProfiles.find((item) => item.username === input.uploader_username && item.schoolSlug === input.school_slug)
    : null;
  if (input.uploader_username && !uploader) return NextResponse.json({ error: 'That uploader is not part of this school locker.' }, { status: 400 });
  try {
    const note = await createCampusNote(session.user.id, input);
    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to post note.' }, { status: 400 });
  }
}
