'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Badge, Card } from '@/components/ui';
import {
  ONBOARDING_PROFILE_STORAGE_KEY,
  parseOnboardingProfile,
} from '@/lib/preference-matching';
import {
  getAdaptiveRecommendations,
  type AdaptiveProgrammeRecommendation,
} from '@/lib/adaptive-recommendations';
import { buildPathwayRecommendations } from '@/lib/pathway-recommendations';
import {
  SIMULATION_RESULTS_STORAGE_KEY,
  getSimulationRecommendationSignal,
  parseSimulationResults,
  type SimulationResultMap,
} from '@/lib/simulation-recommendation-signals';
import {
  SHORTLIST_PLAN_STORAGE_KEY,
  SHORTLIST_STORAGE_KEY,
  parseShortlist,
  parseShortlistPlans,
  type ShortlistPlanMap,
} from '@/lib/shortlist';
import type { OnboardingData } from '@/lib/onboarding-types';
import type { Programme } from '@/lib/programmes';

interface RecommendationDashboardProps {
  programmes: Programme[];
}

interface SimulationAwareMatch {
  recommendation: AdaptiveProgrammeRecommendation;
  simulationBoost: number;
  simulationReasons: string[];
  clarityScore: number;
  finalScore: number;
}

export default function RecommendationDashboard({
  programmes,
}: RecommendationDashboardProps) {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<OnboardingData | null>(null);
  const [simulationResults, setSimulationResults] =
    useState<SimulationResultMap>({});
  const [shortlistIds, setShortlistIds] = useState<string[]>([]);
  const [shortlistPlans, setShortlistPlans] = useState<ShortlistPlanMap>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadRecommendationContext() {
      const localProfile = parseOnboardingProfile(
        window.localStorage.getItem(ONBOARDING_PROFILE_STORAGE_KEY),
      );
      const localShortlistIds = parseShortlist(
        window.localStorage.getItem(SHORTLIST_STORAGE_KEY),
      );
      const localPlans = parseShortlistPlans(
        window.localStorage.getItem(SHORTLIST_PLAN_STORAGE_KEY),
      );

      setProfile(localProfile);
      setShortlistIds(localShortlistIds);
      setShortlistPlans(localPlans);
      setSimulationResults(
        parseSimulationResults(
          window.localStorage.getItem(SIMULATION_RESULTS_STORAGE_KEY) ??
            window.localStorage.getItem('simulation-result'),
        ),
      );

      if (session) {
        const [profileResponse, shortlistResponse] = await Promise.all([
          fetch('/api/account/onboarding'),
          fetch('/api/account/shortlist'),
        ]);

        if (profileResponse.ok) {
          const body = (await profileResponse.json()) as {
            profile?: OnboardingData;
          };
          setProfile(body.profile ?? localProfile);
        }

        if (shortlistResponse.ok) {
          const body = (await shortlistResponse.json()) as {
            programmeIds?: string[];
            plans?: ShortlistPlanMap;
          };
          setShortlistIds(body.programmeIds ?? localShortlistIds);
          setShortlistPlans(body.plans ?? localPlans);
        }
      }

      setLoaded(true);
    }

    void loadRecommendationContext();
  }, [session]);

  const adaptiveRecommendations = useMemo(
    () =>
      profile
        ? getAdaptiveRecommendations(programmes, {
            profile,
            shortlistIds,
            plans: shortlistPlans,
          })
        : [],
    [programmes, profile, shortlistIds, shortlistPlans],
  );
  const simulationAwareMatches = useMemo<SimulationAwareMatch[]>(() => {
    return adaptiveRecommendations
      .map((recommendation) => {
        const signal = getSimulationRecommendationSignal(
          recommendation.programme,
          simulationResults,
        );

        return {
          recommendation,
          simulationBoost: signal.boost,
          simulationReasons: signal.reasons,
          clarityScore: signal.clarityScore,
          finalScore: Math.min(100, recommendation.adaptiveScore + signal.boost),
        };
      })
      .sort(
        (a, b) =>
          b.finalScore - a.finalScore ||
          b.simulationBoost - a.simulationBoost ||
          b.recommendation.adaptiveScore - a.recommendation.adaptiveScore,
      );
  }, [adaptiveRecommendations, simulationResults]);
  const simulationDrivenCount = simulationAwareMatches.filter(
    (item) => item.simulationBoost > 0,
  ).length;
  const adaptiveSignalCount = simulationAwareMatches.reduce(
    (count, item) => count + item.recommendation.signals.length,
    0,
  );
  const highestClarityScore = Math.max(
    0,
    ...Object.values(simulationResults).map((result) => result.clarityScore),
  );
  const pathwayRecommendations = useMemo(
    () =>
      buildPathwayRecommendations(
        simulationAwareMatches
          .slice(0, 5)
          .map((item) => item.recommendation.programme),
        profile,
      ),
    [simulationAwareMatches, profile],
  );
  const topMatch = simulationAwareMatches[0];
  const bestPathway = pathwayRecommendations[0];
  const verificationCount = pathwayRecommendations.reduce(
    (count, recommendation) =>
      count +
      recommendation.phases
        .filter((phase) => phase.type === 'verify')
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
          Adaptive recommendation dashboard
        </Badge>
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <h1 className="text-3xl font-extrabold text-ink-900">
              Your best next move
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-600">
              This dashboard combines onboarding fit, shortlist behavior,
              planning status, planning notes, programme similarity, and
              completed career simulations into a ranked set of practical next
              steps.
            </p>
          </div>
          {topMatch ? (
            <div className="rounded-card border border-brand-200 bg-brand-50 p-4">
              <p className="text-xs font-bold uppercase text-brand-700">
                Highest adaptive recommendation
              </p>
              <h2 className="mt-2 text-xl font-extrabold text-ink-900">
                {topMatch.recommendation.programme.name}
              </h2>
              <p className="mt-1 text-sm font-semibold text-ink-600">
                {topMatch.recommendation.programme.school} - {topMatch.finalScore}% final fit
              </p>
              <p className="mt-3 text-sm leading-6 text-ink-700">
                {topMatch.recommendation.rankReason}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="success">
                  {topMatch.recommendation.adaptiveScore}% adaptive
                </Badge>
                {topMatch.simulationBoost > 0 ? (
                  <Badge tone="brand">+{topMatch.simulationBoost} simulation</Badge>
                ) : null}
              </div>
              <Link
                href={`/programmes/${topMatch.recommendation.programme.id}`}
                className="mt-4 inline-flex min-h-10 items-center justify-center rounded-card border border-brand-600 bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
              >
                View programme
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <section
        className="grid gap-4 md:grid-cols-6"
        aria-label="Dashboard metrics"
      >
        <MetricCard label="Adaptive ranked" value={`${simulationAwareMatches.length}`} />
        <MetricCard label="Excellent / strong" value={`${simulationAwareMatches.filter((item) => item.finalScore >= 72).length}`} />
        <MetricCard label="Shortlisted" value={`${shortlistIds.length}`} />
        <MetricCard label="Adaptive signals" value={`${adaptiveSignalCount}`} />
        <MetricCard label="Clarity score" value={highestClarityScore ? `${highestClarityScore}%` : '-'} />
        <MetricCard label="Items to verify" value={`${verificationCount}`} />
      </section>

      {simulationDrivenCount > 0 ? (
        <section className="rounded-card border border-brand-200 bg-brand-50 p-5">
          <Badge tone="brand" className="mb-3">
            Simulation insight layer
          </Badge>
          <h2 className="text-xl font-extrabold text-ink-900">
            Your completed simulations are changing the ranking
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-700">
            ScholarScout is now giving extra weight to programmes that match the
            environments, interests, and pathways you tested through simulations.
          </p>
          <Link
            href="/explore"
            className="mt-4 inline-flex min-h-10 items-center justify-center rounded-card border border-brand-600 bg-white px-4 text-sm font-semibold text-brand-700 hover:bg-brand-100"
          >
            Try another simulation
          </Link>
        </section>
      ) : null}

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
                Priority: {bestPathway.priority} - Confidence:{' '}
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
        </section>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-5">
          <h2 className="text-xl font-extrabold text-ink-900">
            Ranked recommendations
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-600">
            These are sorted by adaptive fit first, then simulation-driven boosts
            when completed scenarios point toward a pathway.
          </p>
          <div className="mt-5 space-y-3">
            {simulationAwareMatches.slice(0, 5).map((item, index) => (
              <article
                key={item.recommendation.programme.id}
                className="rounded-card border border-ink-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-ink-500">
                      #{index + 1} recommendation
                    </p>
                    <h3 className="mt-1 text-base font-extrabold text-ink-900">
                      {item.recommendation.programme.name}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-ink-500">
                      {item.recommendation.programme.school}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge tone={item.finalScore >= 72 ? 'success' : 'warning'}>
                      {item.finalScore}%
                    </Badge>
                    <p className="mt-1 text-xs font-bold text-success-700">
                      {item.recommendation.adaptiveScore}% adaptive
                    </p>
                    {item.simulationBoost > 0 ? (
                      <p className="mt-1 text-xs font-bold text-brand-700">
                        +{item.simulationBoost} simulation
                      </p>
                    ) : null}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-ink-700">
                  {item.recommendation.rankReason}
                </p>
                {item.recommendation.signals.slice(0, 2).map((signal) => (
                  <p
                    key={`${item.recommendation.programme.id}-${signal.type}`}
                    className="mt-2 text-sm font-semibold leading-6 text-success-700"
                  >
                    {signal.message}
                  </p>
                ))}
                {item.simulationReasons.map((reason) => (
                  <p
                    key={reason}
                    className="mt-2 text-sm font-semibold leading-6 text-brand-700"
                  >
                    {reason}
                  </p>
                ))}
                {item.recommendation.fit?.cautions[0] ? (
                  <p className="mt-2 text-sm leading-6 text-danger-700">
                    Verify: {item.recommendation.fit.cautions[0]}
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
