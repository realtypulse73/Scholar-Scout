import { NextResponse } from 'next/server';
import {
  appendAnalyticsEvent,
  readPlatformData,
} from '@/lib/server/platform-store';
import type { AnalyticsArea } from '@/lib/platform';

export async function GET() {
  const data = await readPlatformData();
  return NextResponse.json({ events: data.analyticsEvents ?? [] });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    area?: AnalyticsArea;
    name?: string;
    userKey?: string;
    metadata?: Record<string, string | number | boolean>;
  };

  if (!body.area || !body.name) {
    return NextResponse.json({ error: 'Missing analytics fields.' }, { status: 400 });
  }

  const event = await appendAnalyticsEvent({
    area: body.area,
    name: body.name,
    userKey: body.userKey ?? 'local-student',
    metadata: body.metadata,
  });

  return NextResponse.json({ event });
}
