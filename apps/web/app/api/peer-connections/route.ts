import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/auth';
import { creatorProfiles } from '@/lib/platform';
import {
  createUploaderInboxRequest,
} from '@/lib/server/data-store';
import type { UploaderInboxRequest } from '@/lib/campus-community';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Sign in to request a peer connection.' }, { status: 401 });
  }

  const input = (await request.json()) as Pick<
    UploaderInboxRequest,
    'uploader_username' | 'program_id' | 'body'
  >;
  const uploader = creatorProfiles.find(
    (candidate) =>
      candidate.username === input.uploader_username &&
      candidate.programmeId === input.program_id,
  );

  if (!uploader?.inboxEnabled) {
    return NextResponse.json(
      { error: 'This uploader has not enabled inbox requests. Leave a note on their school locker instead.' },
      { status: 403 },
    );
  }

  try {
    const inboxRequest = await createUploaderInboxRequest(session.user.id, input);
    return NextResponse.json({ request: inboxRequest }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to send inbox request.' },
      { status: 400 },
    );
  }
}
