'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Badge, Card } from '@/components/ui';
import {
  ONBOARDING_PROFILE_STORAGE_KEY,
  parseOnboardingProfile,
} from '@/lib/preference-matching';
import { SHORTLIST_STORAGE_KEY, parseShortlist } from '@/lib/shortlist';
import type { OnboardingData } from '@/lib/onboarding-types';

export default function ProfileDashboard() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<OnboardingData | null>(null);
  const [shortlistCount, setShortlistCount] = useState(0);

  useEffect(() => {
    async function loadProfile() {
      const localProfile = parseOnboardingProfile(
        window.localStorage.getItem(ONBOARDING_PROFILE_STORAGE_KEY),
      );
      setProfile(localProfile);

      if (session) {
        const response = await fetch('/api/account/onboarding');
        if (response.ok) {
          const body = (await response.json()) as { profile?: OnboardingData };
          if (body.profile) {
            setProfile(body.profile);
          }
        }
      }
    }

    void loadProfile();
    setShortlistCount(
      parseShortlist(window.localStorage.getItem(SHORTLIST_STORAGE_KEY)).length,
    );
  }, [session]);

  if (!session) {
    return (
      <Card className="p-8 text-center">
        <Badge tone="brand" className="mb-4">
          Account
        </Badge>
        <h1 className="text-2xl font-extrabold text-ink-900">
          Sign in to see your saved ScholarScout workspace
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-ink-600">
          Auth.js sign-in connects your account to saved ScholarScout data.
        </p>
        <Link
          href="/auth/sign-in"
          className="mt-6 inline-flex min-h-touch items-center justify-center rounded-card border border-brand-600 bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          Sign in
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Badge tone="success" className="mb-4">
              {session.user.role}
            </Badge>
            <h1 className="text-3xl font-extrabold text-ink-900">
              {session.user.name}
            </h1>
            <p className="mt-2 text-sm font-semibold text-ink-600">
              {session.user.email}
            </p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="inline-flex min-h-10 items-center justify-center rounded-card border border-ink-300 bg-white px-4 text-sm font-semibold text-ink-700 hover:border-danger-600 hover:text-danger-700"
          >
            Sign out
          </button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <StatusCard
          label="Preferences"
          value={profile ? 'Saved locally' : 'Not started'}
          href="/onboarding"
        />
        <StatusCard
          label="Shortlist"
          value={`${shortlistCount} saved locally`}
          href="/shortlist"
        />
        <StatusCard
          label="Programmes"
          value="Browse matches"
          href="/programmes"
        />
      </div>

      {session.user.role === 'staff' ? (
        <Card className="p-5">
          <h2 className="text-xl font-extrabold text-ink-900">Staff tools</h2>
          <p className="mt-2 text-sm leading-6 text-ink-600">
            Staff access is enabled for this authenticated session.
          </p>
          <Link
            href="/admin/programmes"
            className="mt-4 inline-flex min-h-10 items-center rounded-card border border-brand-600 bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Open programme CMS
          </Link>
        </Card>
      ) : null}
    </div>
  );
}

function StatusCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link href={href} className="block">
      <Card className="h-full p-5 transition-colors hover:border-brand-300">
        <p className="text-xs font-semibold uppercase text-ink-500">{label}</p>
        <p className="mt-2 text-xl font-extrabold text-ink-900">{value}</p>
      </Card>
    </Link>
  );
}
