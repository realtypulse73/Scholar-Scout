import { NextResponse } from 'next/server';
import {
  appendAnalyticsEvent,
  appendFeedInteraction,
} from '@/lib/server/platform-store';
import { isExactObject, parseJsonRequest } from '@/lib/api-request';
import { feedItems } from '@/lib/platform';
import { resolveStudentActor } from '@/lib/server/student-actor';

const MAX_FEED_EVENT_REQUEST_BYTES = 4 * 1024;
const MAX_FEED_WATCH_SECONDS = 60 * 60;
const MAX_LEGACY_IDENTITY_LENGTH = 128;
const FEED_EVENT_TYPES = new Set(['view', 'watch', 'skip']);

interface FeedEventRequest {
  feedItemId: string;
  eventType: 'view' | 'watch' | 'skip';
  watchSeconds: number;
}

export async function POST(request: Request) {
  const actor = await resolveStudentActor({ allowGuest: true });

  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await parseJsonRequest(request, {
    maxBytes: MAX_FEED_EVENT_REQUEST_BYTES,
    validate: validateFeedEventRequest,
  });

  if (!body.ok) {
    return NextResponse.json(
      { error: 'Invalid feed event fields.' },
      { status: body.error === 'body-too-large' ? 413 : 400 },
    );
  }

  const event =
    body.value.eventType === 'view'
      ? null
      : await appendFeedInteraction({
          userKey: actor.storageKey,
          feedItemId: body.value.feedItemId,
          watchSeconds: body.value.watchSeconds,
          skipped: body.value.eventType === 'skip',
        });

  await appendAnalyticsEvent({
    area: 'feed',
    name:
      body.value.eventType === 'view'
        ? 'feed_view'
        : body.value.eventType === 'skip'
          ? 'feed_skip'
          : 'feed_watch',
    userKey: actor.storageKey,
    metadata: {
      feedItemId: body.value.feedItemId,
      watchSeconds: body.value.watchSeconds,
    },
  });

  return NextResponse.json({ event });
}

function validateFeedEventRequest(value: unknown): FeedEventRequest | null {
  if (
    !isExactObject(value, [
      'userKey',
      'feedItemId',
      'eventType',
      'watchSeconds',
      'skipped',
    ])
  ) {
    return null;
  }

  const legacyUserKey = value.userKey;
  const feedItemId = value.feedItemId;
  const suppliedEventType = value.eventType;
  const watchSeconds = value.watchSeconds;
  const skipped = value.skipped;
  const eventType =
    suppliedEventType === undefined ? (skipped === true ? 'skip' : 'watch') : suppliedEventType;

  if (
    (legacyUserKey !== undefined &&
      (typeof legacyUserKey !== 'string' || legacyUserKey.length > MAX_LEGACY_IDENTITY_LENGTH)) ||
    typeof feedItemId !== 'string' ||
    feedItemId.length === 0 ||
    feedItemId.length > 64 ||
    !feedItems.some((item) => item.id === feedItemId) ||
    typeof eventType !== 'string' ||
    !FEED_EVENT_TYPES.has(eventType) ||
    (skipped !== undefined &&
      (typeof skipped !== 'boolean' || skipped !== (eventType === 'skip'))) ||
    typeof watchSeconds !== 'number' ||
    !Number.isSafeInteger(watchSeconds) ||
    watchSeconds < 0 ||
    watchSeconds > MAX_FEED_WATCH_SECONDS
  ) {
    return null;
  }

  return {
    feedItemId,
    eventType: eventType as FeedEventRequest['eventType'],
    watchSeconds,
  };
}
