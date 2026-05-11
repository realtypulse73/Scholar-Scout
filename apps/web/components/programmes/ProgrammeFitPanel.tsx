'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Badge, Card } from '@/components/ui';
import type { OnboardingData } from '@/lib/onboarding-types';
import {
  ONBOARDING_PROFILE_STORAGE_KEY,
  explainProgrammeFit,
  parseOnboardingProfile,
} from '@/lib/preference-matching';
import type { Programme } from '@/lib/programmes';

interface ProgrammeFitPanelProps {
  programme: Programme;
}

export default function ProgrammeFitPanel({
  programme,
}: ProgrammeFitPanelProps) {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<OnboardingData | null>(null);
  const fit = profile ? explainProgrammeFit(programme, profile) : null;

  useEffect(() => {
    async function loadProfile() {
      setProfile(
        parseOnboardingProfile(
          window.localStorage.getItem(ONBOARDING_PROFILE_STORAGE_KEY),
        ),
      );

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
  }, [session]);

  if (!fit) {
    return (
      <Card className="p-5">
        <Badge tone="warning" className="mb-3">
          Personal fit
        </Badge>
        <h2 className="text-xl font-extrabold text-ink-900">
          Add your preferences
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-600">
          Complete onboarding to see why this programme may or may not fit your
          goals, budget, location, pathway, and support needs.
        </p>
        <Link
          href="/onboarding"
          className="mt-4 inline-flex min-h-10 items-center rounded-card border border-brand-600 bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          Complete onboarding
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge tone="success" className="mb-3">
            Personal fit
          </Badge>
          <h2 className="text-xl font-extrabold text-ink-900">
            Why this may fit
          </h2>
        </div>
        <p className="text-3xl font-extrabold text-success-700">
          {fit.score}%
        </p>
      </div>

      {fit.reasons.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {fit.reasons.map((reason) => (
            <li key={reason} className="text-sm font-medium text-ink-700">
              {reason}
            </li>
          ))}
        </ul>
      ) : null}

      {fit.cautions.length > 0 ? (
        <div className="mt-4 rounded-card bg-warning-50 p-3">
          <h3 className="text-sm font-extrabold text-warning-700">
            Worth checking
          </h3>
          <ul className="mt-2 space-y-2">
            {fit.cautions.map((caution) => (
              <li key={caution} className="text-sm font-medium text-ink-700">
                {caution}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Link
        href="/onboarding"
        className="mt-4 inline-flex min-h-10 items-center rounded-card border border-ink-300 bg-white px-4 text-sm font-semibold text-ink-700 transition-colors hover:border-brand-400 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      >
        Update preferences
      </Link>
    </Card>
  );
}
