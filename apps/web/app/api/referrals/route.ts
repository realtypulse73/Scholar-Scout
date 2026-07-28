import { NextResponse } from 'next/server';
import {
  appendAnalyticsEvent,
  createReferral,
  readPlatformData,
} from '@/lib/server/platform-store';
import { isExactObject, parseJsonRequest } from '@/lib/api-request';
import { resolveStudentActor } from '@/lib/server/student-actor';

const MAX_REFERRAL_REQUEST_BYTES = 1024;

export async function GET() {
  const actor = await resolveStudentActor({ allowGuest: true });

  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await readPlatformData();

  return NextResponse.json({
    referrals: (data.referralRecords ?? []).filter(
      (referral) => referral.referrer === actor.storageKey,
    ),
  });
}

export async function POST(request: Request) {
  const actor = await resolveStudentActor({ allowGuest: true });

  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await parseJsonRequest(request, {
    maxBytes: MAX_REFERRAL_REQUEST_BYTES,
    validate: validateReferralRequest,
  });

  if (!body.ok) {
    return NextResponse.json(
      { error: 'Invalid referral request.' },
      { status: body.error === 'body-too-large' ? 413 : 400 },
    );
  }

  const referral = await createReferral(actor.storageKey);

  await appendAnalyticsEvent({
    area: 'referral',
    name: 'referral_created',
    userKey: actor.storageKey,
    metadata: { code: referral.code },
  });

  return NextResponse.json({
    referral,
    link: `/onboarding?ref=${encodeURIComponent(referral.code)}`,
  });
}

function validateReferralRequest(value: unknown): Record<string, never> | null {
  if (!isExactObject(value, ['referrer'])) {
    return null;
  }

  const referrer = value.referrer;

  return referrer === undefined || (typeof referrer === 'string' && referrer.length <= 64)
    ? {}
    : null;
}
