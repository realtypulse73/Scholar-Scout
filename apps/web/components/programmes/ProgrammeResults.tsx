'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import OpportunityMatchCard from '@/components/opportunities/OpportunityMatchCard';
import { Card } from '@/components/ui';
import {
  ONBOARDING_PROFILE_STORAGE_KEY,
  parseOnboardingProfile,
} from '@/lib/preference-matching';
import { rankOpportunityMatches } from '@/lib/opportunity-matching';
import type { Programme } from '@/lib/programmes';
import {
  PROGRAMME_PAGE_SIZE,
  buildPageSearchParams,
  paginateItems,
} from '@/lib/pagination';
import type { OnboardingData } from '@/lib/onboarding-types';

interface ProgrammeResultsProps {
  programmes: Programme[];
  page: number;
  params: Record<string, string | undefined>;
  initialProfile?: OnboardingData | null;
}

export default function ProgrammeResults({
  programmes,
  page,
  params,
  initialProfile = null,
}: ProgrammeResultsProps) {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<OnboardingData | null>(initialProfile);

  useEffect(() => {
    async function loadProfile() {
      const localProfile = parseOnboardingProfile(
        window.localStorage.getItem(ONBOARDING_PROFILE_STORAGE_KEY),
      );

      if (!initialProfile) {
        setProfile(localProfile);
      }

      if (session) {
        const response = await fetch('/api/account/onboarding');
        if (response.ok) {
          const body = (await response.json()) as { profile?: OnboardingData };
          if (body.profile) {
            setProfile(body.profile);
          } else if (!initialProfile) {
            setProfile(localProfile);
          }
        }
      }
    }

    void loadProfile();
  }, [initialProfile, session]);

  const rankedMatches = useMemo(
    () => rankOpportunityMatches(programmes, profile),
    [programmes, profile],
  );
  const paginated = paginateItems(rankedMatches, page, PROGRAMME_PAGE_SIZE);

  return (
    <section aria-label="Programme results" className="space-y-4">
      <div className="rounded-card border border-ink-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-ink-700">
          {profile
            ? 'Sorted by your saved preferences.'
            : 'Sorted by ScholarScout baseline fit. Complete onboarding to personalize this list.'}
        </p>
      </div>

      {paginated.items.length > 0 ? (
        paginated.items.map((match) => (
          <OpportunityMatchCard key={match.programme.id} match={match} />
        ))
      ) : (
        <Card className="p-8 text-center">
          <h2 className="text-xl font-extrabold">No matches yet</h2>
          <p className="mt-2 text-sm text-ink-600">
            Try widening the tuition, pathway, or location filters.
          </p>
        </Card>
      )}

      {rankedMatches.length > PROGRAMME_PAGE_SIZE ? (
        <div className="flex items-center justify-between pt-2">
          <PageLink
            label="Previous"
            page={paginated.page - 1}
            disabled={paginated.page === 1}
            params={params}
          />
          <p className="text-sm font-semibold text-ink-600">
            Page {paginated.page} of {paginated.pageCount}
          </p>
          <PageLink
            label="Next"
            page={paginated.page + 1}
            disabled={paginated.page === paginated.pageCount}
            params={params}
          />
        </div>
      ) : null}
    </section>
  );
}

function PageLink({
  label,
  page,
  disabled,
  params,
}: {
  label: string;
  page: number;
  disabled: boolean;
  params: Record<string, string | undefined>;
}) {
  const nextParams = buildPageSearchParams(params, page);

  if (disabled) {
    return (
      <span className="inline-flex min-h-10 items-center rounded-card border border-ink-200 px-4 text-sm font-semibold text-ink-300">
        {label}
      </span>
    );
  }

  return (
    <Link
      href={`/programmes?${nextParams.toString()}`}
      className="inline-flex min-h-10 items-center rounded-card border border-ink-300 bg-white px-4 text-sm font-semibold text-ink-700 hover:border-brand-400 hover:text-brand-700"
    >
      {label}
    </Link>
  );
}
