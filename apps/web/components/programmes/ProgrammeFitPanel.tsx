'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import OpportunityMatchCard from '@/components/opportunities/OpportunityMatchCard';
import { Badge, Card } from '@/components/ui';
import type { OnboardingData } from '@/lib/onboarding-types';
import {
  ONBOARDING_PROFILE_STORAGE_KEY,
  parseOnboardingProfile,
} from '@/lib/preference-matching';
import { rankOpportunityMatches } from '@/lib/opportunity-matching';
import type { Programme } from '@/lib/programmes';

interface ProgrammeFitPanelProps {
  programme: Programme;
}

export default function ProgrammeFitPanel({
  programme,
}: ProgrammeFitPanelProps) {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<OnboardingData | null>(null);
  const match = profile
    ? rankOpportunityMatches([programme], profile)[0]
    : null;

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

  if (!match) {
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
          className="mt-4 inline-flex min-h-touch items-center rounded-control border border-brand-600 bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          Complete onboarding
        </Link>
      </Card>
    );
  }

  return <OpportunityMatchCard match={match} compact />;
}
