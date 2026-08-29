import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/auth';
import {
  isCampusNoteDraft,
  toPublicCampusNote,
  validateCampusNote,
  type CampusNoteDraft,
} from '@/lib/campus-community';
import { creatorProfiles } from '@/lib/platform';
import { createCampusNote, getCampusNotes } from '@/lib/server/data-store';
import { reserveCommunitySubmission } from '@/lib/server/rate-limit';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const schoolSlug = url.searchParams.get('school');
  const uploaderUsername = url.searchParams.get('uploader') ?? undefined;
  if (!schoolSlug) return NextResponse.json({ error: 'school is required.' }, { status: 400 });
  const notes = await getCampusNotes(schoolSlug, uploaderUsername);
  return NextResponse.json({ notes: notes.map(toPublicCampusNote) });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in to post a note.' }, { status: 401 });
  const input = await parseCampusNoteDraft(request);
  if (!input) return NextResponse.json({ error: 'Provide a valid public note.' }, { status: 400 });

  const validationErrors = validateCampusNote(input);
  if (validationErrors.length > 0) {
    return NextResponse.json({ error: validationErrors[0] }, { status: 400 });
  }

  const uploader = input.uploader_username
    ? creatorProfiles.find((item) => item.username === input.uploader_username && item.schoolSlug === input.school_slug)
    : null;
  if (input.uploader_username && !uploader) return NextResponse.json({ error: 'That uploader is not part of this school locker.' }, { status: 400 });

  const reservation = await reserveCommunitySubmission(session.user.id);
  if (reservation.status === 'denied') {
    return NextResponse.json({ error: 'Please wait before sending another community submission.' }, { status: 429 });
  }
  if (reservation.status === 'unavailable') {
    return NextResponse.json({ error: 'Community submissions are temporarily unavailable.' }, { status: 503 });
  }

  try {
    const note = await createCampusNote(session.user.id, input);
    return NextResponse.json({ note: toPublicCampusNote(note) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to post note.' }, { status: 400 });
  }
}

async function parseCampusNoteDraft(request: Request): Promise<CampusNoteDraft | null> {
  try {
    const value: unknown = await request.json();
    if (!isCampusNoteDraft(value)) return null;

    return {
      school_slug: value.school_slug,
      uploader_username: value.uploader_username,
      program_id: value.program_id,
      body: value.body,
    };
  } catch {
    return null;
  }
}
