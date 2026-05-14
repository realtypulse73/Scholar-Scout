import { NextResponse } from 'next/server';
import { appendAnalyticsEvent, trackShare } from '@/lib/server/platform-store';
import type { ShareRecord } from '@/lib/server/platform-store';

export async function POST(request: Request) {
  const body = (await request.json()) as {
    userKey?: string;
    targetType?: ShareRecord['targetType'];
    targetId?: string;
  };

  if (!body.targetType || !body.targetId) {
    return NextResponse.json({ error: 'Missing share target.' }, { status: 400 });
  }

  const share = await trackShare({
    userKey: body.userKey ?? 'local-student',
    targetType: body.targetType,
    targetId: body.targetId,
  });

  await appendAnalyticsEvent({
    area: 'share',
    name: 'share_created',
    userKey: share.userKey,
    metadata: {
      targetType: share.targetType,
      targetId: share.targetId,
    },
  });

  return NextResponse.json(share);
}
