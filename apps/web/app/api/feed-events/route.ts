import { NextResponse } from 'next/server';
import {
  appendAnalyticsEvent,
  appendFeedInteraction,
} from '@/lib/server/platform-store';

export async function POST(request: Request) {
  const body = (await request.json()) as {
    userKey?: string;
    feedItemId?: string;
    eventType?: 'view' | 'watch' | 'skip';
    watchSeconds?: number;
    skipped?: boolean;
  };

  if (!body.userKey || !body.feedItemId) {
    return NextResponse.json({ error: 'Missing feed event fields.' }, { status: 400 });
  }

  const eventType = body.eventType ?? (body.skipped ? 'skip' : 'watch');
  const watchSeconds = Number(body.watchSeconds ?? 0);

  const event =
    eventType === 'view'
      ? null
      : await appendFeedInteraction({
          userKey: body.userKey,
          feedItemId: body.feedItemId,
          watchSeconds,
          skipped: eventType === 'skip' || Boolean(body.skipped),
        });

  await appendAnalyticsEvent({
    area: 'feed',
    name:
      eventType === 'view'
        ? 'feed_view'
        : eventType === 'skip'
          ? 'feed_skip'
          : 'feed_watch',
    userKey: body.userKey,
    metadata: {
      feedItemId: body.feedItemId,
      watchSeconds,
    },
  });

  return NextResponse.json({ event });
}
