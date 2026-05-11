import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/auth';
import {
  getOnboardingProfile,
  saveOnboardingProfile,
} from '@/lib/server/data-store';
import type { OnboardingData } from '@/lib/onboarding-types';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    profile: await getOnboardingProfile(session.user.id),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = (await request.json()) as OnboardingData;
  await saveOnboardingProfile(session.user.id, profile);

  return NextResponse.json({ ok: true });
}
