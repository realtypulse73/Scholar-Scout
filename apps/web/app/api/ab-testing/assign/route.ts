import { NextResponse } from 'next/server';
import { assignVariant } from '@/lib/platform';
import { appendAnalyticsEvent } from '@/lib/server/platform-store';

export async function POST(request: Request) {
  const body = (await request.json()) as {
    userKey?: string;
    experimentId?: string;
  };
  const userKey = body.userKey ?? 'local-student';
  const experimentId = body.experimentId ?? 'feed-layout';
  const assignment = assignVariant(userKey, experimentId);

  await appendAnalyticsEvent({
    area: 'admin',
    name: 'ab_variant_assigned',
    userKey,
    metadata: {
      experimentId: assignment.experimentId,
      variant: assignment.variant,
    },
  });

  return NextResponse.json({ assignment });
}
