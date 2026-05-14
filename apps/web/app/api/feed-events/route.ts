import { NextResponse } from 'next/server';
import {
  appendAnalyticsEvent,
  appendFeedInteraction,
} from '@/lib/server/platform-store';

export async function POST(request: Request) {
  const body = (await request.json()) as {
    userKey?: string;
    feedItemId?: string;
    watchSeconds?: number;
    skipped?: boolean;
  };

  if (!body.userKey || !body.feedItemId) {
    return NextResponse.json({ error: 'Missing feed event fields.' }, { status: 400 });
  }

  const event = await appendFeedInteraction({
    userKey: body.userKey,
    feedItemId: body.feedItemId,
    watchSeconds: Number(body.watchSeconds ?? 0),
    skipped: Boolean(body.skipped),
  });

  await appendAnalyticsEvent({
    area: 'feed',
    name: body.skipped ? 'feed_skip' : 'feed_watch',
    userKey: body.userKey,
    metadata: {
      feedItemId: body.feedItemId,
      watchSeconds: Number(body.watchSeconds ?? 0),
    },
  });

  return NextResponse.json({ event });
}
