import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/auth';
import { creatorProfiles } from '@/lib/platform';
import {
  createUploaderInboxRequest,
  PersistenceConflictError,
} from '@/lib/server/data-store';
import { reserveCommunitySubmission } from '@/lib/server/rate-limit';
import {
  isUploaderInboxRequestDraft,
  toPublicUploaderInboxRequest,
  validateUploaderInboxRequest,
} from '@/lib/campus-community';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Sign in to request a peer connection.' }, { status: 401 });
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: 'Send a valid inbox request.' }, { status: 400 });
  }

  if (!isUploaderInboxRequestDraft(input)) {
    return NextResponse.json({ error: 'Send a valid inbox request.' }, { status: 400 });
  }

  const draft = {
    uploader_username: input.uploader_username,
    program_id: input.program_id,
    body: input.body,
  };
  const validationErrors = validateUploaderInboxRequest(draft);
  if (validationErrors.length) {
    return NextResponse.json({ error: validationErrors[0] }, { status: 400 });
  }

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

  const reservation = await reserveCommunitySubmission(session.user.id);
  if (reservation.status === 'unavailable') {
    return NextResponse.json(
      { error: 'Inbox requests are temporarily unavailable. Please try again later.' },
      { status: 503 },
    );
  }

  if (reservation.status === 'denied') {
    return NextResponse.json(
      { error: 'You have reached the shared community submission limit. Please try again later.' },
      { status: 429 },
    );
  }

  try {
    const inboxRequest = await createUploaderInboxRequest(session.user.id, draft);
    return NextResponse.json({ request: toPublicUploaderInboxRequest(inboxRequest) }, { status: 201 });
  } catch (error) {
    if (error instanceof PersistenceConflictError) {
      return NextResponse.json(
        { error: 'This inbox request changed before it could be sent. Please try again.' },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: 'Inbox requests are temporarily unavailable. Please try again later.' },
      { status: 503 },
    );
  }
}
