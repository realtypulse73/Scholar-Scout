'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import ProgrammeVisualPanel from '@/components/programmes/ProgrammeVisualPanel';
import SchoolLogo from '@/components/programmes/SchoolLogo';
import ShortlistButton from '@/components/shortlist/ShortlistButton';
import { Badge, Card } from '@/components/ui';
import {
  ONBOARDING_PROFILE_STORAGE_KEY,
  explainProgrammeFit,
  parseOnboardingProfile,
  rankProgrammesForProfile,
} from '@/lib/preference-matching';
import {
  PROGRAMME_PATHWAY_LABELS,
  type Programme,
} from '@/lib/programmes';
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

  const rankedProgrammes = useMemo(
    () => rankProgrammesForProfile(programmes, profile),
    [programmes, profile],
  );
  const paginated = paginateItems(rankedProgrammes, page, PROGRAMME_PAGE_SIZE);

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
        paginated.items.map((programme) => {
          const fit = profile ? explainProgrammeFit(programme, profile) : null;
          const reason = fit?.reasons[0] ?? programme.highlights[0];

          return (
            <Card key={programme.id} className="p-5">
              <div className="grid gap-5 md:grid-cols-[minmax(0,14rem)_1fr_auto]">
                <ProgrammeVisualPanel programme={programme} variant="compact" />
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="success">
                      {fit ? `${fit.score}% personal fit` : `${programme.matchScore}% fit`}
                    </Badge>
                    <Badge>{PROGRAMME_PATHWAY_LABELS[programme.pathway]}</Badge>
                    <Badge>{programme.delivery}</Badge>
                  </div>
                  <h2 className="mt-4 text-xl font-extrabold text-ink-900">
                    <Link
                      href={`/programmes/${programme.id}`}
                      className="hover:text-brand-700"
                    >
                      {programme.name}
                    </Link>
                  </h2>
                  <div className="mt-2 flex items-center gap-2">
                    <SchoolLogo programme={programme} size="sm" />
                    <p className="text-sm font-semibold text-ink-600">
                      {programme.school} - {programme.city}, {programme.state}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-ink-600">
                    {reason}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {programme.highlights.map((highlight) => (
                      <Badge key={highlight} tone="brand">
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                </div>
                <dl className="grid grid-cols-3 gap-3 text-sm md:w-72">
                  <div>
                    <dt className="text-xs font-semibold uppercase text-ink-500">
                      Tuition
                    </dt>
                    <dd className="mt-1 font-extrabold">
                      ${programme.annualTuition.toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-ink-500">
                      Entry flexibility
                    </dt>
                    <dd className="mt-1 font-extrabold">
                      {programme.acceptanceRate}%
                    </dd>
                    <dd className="mt-1 text-xs font-medium leading-4 text-ink-500">
                      Not an admission prediction
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-ink-500">
                      Time
                    </dt>
                    <dd className="mt-1 font-extrabold">
                      {programme.duration}
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <ShortlistButton programmeId={programme.id} />
                <Link
                  href={`/programmes/${programme.id}`}
                  className="inline-flex min-h-10 items-center justify-center rounded-card border border-brand-600 bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                >
                  View details
                </Link>
              </div>
            </Card>
          );
        })
      ) : (
        <Card className="p-8 text-center">
          <h2 className="text-xl font-extrabold">No matches yet</h2>
          <p className="mt-2 text-sm text-ink-600">
            Try widening the tuition, pathway, or location filters.
          </p>
        </Card>
      )}

      {rankedProgrammes.length > PROGRAMME_PAGE_SIZE ? (
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
