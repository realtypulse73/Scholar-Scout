import { NextResponse } from 'next/server';
import {
  appendAnalyticsEvent,
  createReferral,
  readPlatformData,
} from '@/lib/server/platform-store';

export async function GET() {
  const data = await readPlatformData();
  return NextResponse.json({ referrals: data.referralRecords ?? [] });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { referrer?: string };
  const referrer = body.referrer?.trim() || 'local-student';
  const referral = await createReferral(referrer);

  await appendAnalyticsEvent({
    area: 'referral',
    name: 'referral_created',
    userKey: referrer,
    metadata: { code: referral.code },
  });

  return NextResponse.json({
    referral,
    link: `/onboarding?ref=${encodeURIComponent(referral.code)}`,
  });
}
