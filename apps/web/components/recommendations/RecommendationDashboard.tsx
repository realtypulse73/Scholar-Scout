'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Badge, Card } from '@/components/ui';
import {
  ONBOARDING_PROFILE_STORAGE_KEY,
  getRankedProgrammeMatches,
  parseOnboardingProfile,
} from '@/lib/preference-matching';
import { buildPathwayRecommendations } from '@/lib/pathway-recommendations';
import type { OnboardingData } from '@/lib/onboarding-types';
import type { Programme } from '@/lib/programmes';

interface RecommendationDashboardProps {
  programmes: Programme[];
}

export default function RecommendationDashboard({
  programmes,
}: RecommendationDashboardProps) {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<OnboardingData | null>(null);
  const [loaded, setLoaded] = useState(false);

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
          setProfile(body.profile ?? localProfile);
        }
      }

      setLoaded(true);
    }

    void loadProfile();
  }, [session]);

  const rankedMatches = useMemo(
    () => (profile ? getRankedProgrammeMatches(programmes, profile) : []),
    [programmes, profile],
  );
  const pathwayRecommendations = useMemo(
    () => buildPathwayRecommendations(
      rankedMatches.slice(0, 5).map((match) => match.programme),
      profile,
    ),
    [rankedMatches, profile],
  );
  const topMatch = rankedMatches[0];
  const bestPathway = pathwayRecommendations[0];
  const verificationCount = pathwayRecommendations.reduce(
    (count, recommendation) =>
      count +
      recommendation.phases.filter((phase) => phase.type === 'verify')
        .flatMap((phase) => phase.actions).length,
    0,
  );

  if (!loaded) {
    return (
      <Card className="p-8 text-center">
        <Badge tone="brand" className="mb-4">
          Recommendation dashboard
        </Badge>
        <p className="text-sm font-semibold text-ink-600">
          Building your ScholarScout recommendations...
        </p>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="p-8 text-center">
        <Badge tone="warning" className="mb-4">
          Onboarding needed
        </Badge>
        <h1 className="text-2xl font-extrabold text-ink-900">
          Complete onboarding to unlock recommendations
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-ink-600">
          ScholarScout needs your interests, pathway preference, location,
          affordability sensitivity, GPA band, and support needs before it can
          produce a practical next-move dashboard.
        </p>
        <Link
          href="/onboarding"
          className="mt-6 inline-flex min-h-touch items-center justify-center rounded-card border border-brand-600 bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          Start onboarding
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-card border border-ink-200 bg-white p-5 shadow-card">
        <Badge tone="brand" className="mb-4">
          Recommendation dashboard
        </Badge>
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <h1 className="text-3xl font-extrabold text-ink-900">
              Your best next move
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-600">
              This dashboard combines onboarding signals, programme fit, access,
              affordability, support needs, and pathway planning into a ranked
              set of practical next steps.
            </p>
          </div>
          {topMatch ? (
            <div className="rounded-card border border-brand-200 bg-brand-50 p-4">
              <p className="text-xs font-bold uppercase text-brand-700">
                Highest-fit recommendation
              </p>
              <h2 className="mt-2 text-xl font-extrabold text-ink-900">
                {topMatch.programme.name}
              </h2>
              <p className="mt-1 text-sm font-semibold text-ink-600">
                {topMatch.programme.school} · {topMatch.fit.score}% personal fit
              </p>
              <Link
                href={`/programmes/${topMatch.programme.id}`}
                className="mt-4 inline-flex min-h-10 items-center justify-center rounded-card border border-brand-600 bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
              >
                View programme
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4" aria-label="Dashboard metrics">
        <MetricCard label="Ranked options" value={`${rankedMatches.length}`} />
        <MetricCard label="Excellent / strong" value={`${rankedMatches.filter((match) => match.fit.score >= 72).length}`} />
        <MetricCard label="Pathways built" value={`${pathwayRecommendations.length}`} />
        <MetricCard label="Items to verify" value={`${verificationCount}`} />
      </section>

      {bestPathway ? (
        <section className="rounded-card border border-success-100 bg-white p-5 shadow-card">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <Badge tone="success" className="mb-4">
                Best pathway
              </Badge>
              <h2 className="text-2xl font-extrabold text-ink-900">
                {bestPathway.headline}
              </h2>
              <p className="mt-2 text-sm font-semibold text-ink-600">
                Priority: {bestPathway.priority} · Confidence:{' '}
                {bestPathway.confidenceScore}%
              </p>
            </div>
            <Link
              href="/shortlist"
              className="inline-flex min-h-10 items-center justify-center rounded-card border border-ink-300 bg-white px-4 text-sm font-semibold text-ink-700 hover:border-brand-400 hover:text-brand-700"
            >
              Compare shortlist
            </Link>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-4">
            {bestPathway.phases.map((phase) => (
              <article
                key={phase.type}
                className="rounded-card border border-ink-200 bg-ink-50 p-4"
              >
                <p className="text-xs font-bold uppercase text-ink-500">
                  {phase.type}
                </p>
                <h3 className="mt-2 text-base font-extrabold text-ink-900">
                  {phase.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-ink-600">
                  {phase.description}
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-ink-700">
                  {phase.actions.slice(0, 2).map((action) => (
                    <li key={action}>• {action}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-5">
          <h2 className="text-xl font-extrabold text-ink-900">
            Ranked recommendations
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-600">
            These are sorted by personal fit first, then baseline programme
            strength and affordability.
          </p>
          <div className="mt-5 space-y-3">
            {rankedMatches.slice(0, 5).map((match, index) => (
              <article
                key={match.programme.id}
                className="rounded-card border border-ink-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-ink-500">
                      #{index + 1} recommendation
                    </p>
                    <h3 className="mt-1 text-base font-extrabold text-ink-900">
                      {match.programme.name}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-ink-500">
                      {match.programme.school}
                    </p>
                  </div>
                  <Badge tone={match.fit.score >= 72 ? 'success' : 'warning'}>
                    {match.fit.score}%
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-ink-700">
                  {match.fit.reasons[0]}
                </p>
                {match.fit.cautions[0] ? (
                  <p className="mt-2 text-sm leading-6 text-danger-700">
                    Verify: {match.fit.cautions[0]}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-xl font-extrabold text-ink-900">
            Pathways side-by-side
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-600">
            Each pathway translates a programme into what the student should do
            first, what it leads to, and what must be verified.
          </p>
          <div className="mt-5 space-y-3">
            {pathwayRecommendations.slice(0, 4).map((pathway) => (
              <article
                key={pathway.programme.id}
                className="rounded-card border border-ink-200 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-ink-900">
                      {pathway.programme.name}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-ink-600">
                      {pathway.headline}
                    </p>
                  </div>
                  <Badge tone={pathway.priority === 'high' ? 'success' : 'brand'}>
                    {pathway.priority} priority
                  </Badge>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {pathway.phases.slice(0, 2).map((phase) => (
                    <div
                      key={phase.type}
                      className="rounded border border-ink-100 bg-ink-50 p-3"
                    >
                      <p className="text-[11px] font-bold uppercase text-ink-500">
                        {phase.type}
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-ink-800">
                        {phase.actions[0]}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-bold uppercase text-ink-500">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-ink-900">{value}</p>
    </Card>
  );
}
