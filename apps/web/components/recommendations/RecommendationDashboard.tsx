'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import SchoolLogo from '@/components/programmes/SchoolLogo';
import { Badge, Card } from '@/components/ui';
import {
  ONBOARDING_PROFILE_STORAGE_KEY,
  parseOnboardingProfile,
} from '@/lib/preference-matching';
import { buildProfileMatchBullets } from '@/lib/recommendation-explanations';
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
  nextSteps: string[];
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
    function loadLocalRecommendationContext() {
      const localProfile = parseOnboardingProfile(
        window.localStorage.getItem(ONBOARDING_PROFILE_STORAGE_KEY),
      );
      const localShortlistIds = parseShortlist(
        window.localStorage.getItem(SHORTLIST_STORAGE_KEY),
      );
      const localPlans = parseShortlistPlans(
        window.localStorage.getItem(SHORTLIST_PLAN_STORAGE_KEY),
      );
      const storedSimulationResults = parseSimulationResults(
        window.localStorage.getItem(SIMULATION_RESULTS_STORAGE_KEY),
      );
      const latestSimulationResult = parseSimulationResults(
        window.localStorage.getItem('simulation-result'),
      );

      setProfile(localProfile);
      setShortlistIds(localShortlistIds);
      setShortlistPlans(localPlans);
      setSimulationResults({
        ...storedSimulationResults,
        ...latestSimulationResult,
      });

      return {
        localProfile,
        localShortlistIds,
        localPlans,
      };
    }

    async function loadRecommendationContext() {
      const { localProfile, localShortlistIds, localPlans } =
        loadLocalRecommendationContext();

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

    const refreshLocalContext = () => {
      loadLocalRecommendationContext();
    };

    window.addEventListener('storage', refreshLocalContext);
    window.addEventListener('focus', refreshLocalContext);

    return () => {
      window.removeEventListener('storage', refreshLocalContext);
      window.removeEventListener('focus', refreshLocalContext);
    };
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
          nextSteps: signal.nextSteps,
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
  const nextStepGuidance = Array.from(
    new Set(simulationAwareMatches.flatMap((item) => item.nextSteps)),
  ).slice(0, 4);
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
          Match dashboard
        </Badge>
        <p className="text-sm font-semibold text-ink-600">
          Building your school matches...
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
          Answer a few questions to see matches
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-ink-600">
          ScholarScout needs your interests, school type, location, budget, GPA
          range, and support needs before it can sort your options.
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
              This page uses your answers, saved schools, plans, notes, and
              career games to sort your next steps.
            </p>
          </div>
          {topMatch ? (
            <div className="rounded-card border border-brand-200 bg-brand-50 p-4">
              <div className="flex items-start gap-3">
                <SchoolLogo programme={topMatch.recommendation.programme} size="lg" />
                <div>
                  <p className="text-xs font-bold uppercase text-brand-700">
                    Best match right now
                  </p>
                  <h2 className="mt-2 text-xl font-extrabold text-ink-900">
                    {topMatch.recommendation.programme.name}
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-ink-600">
                    {topMatch.recommendation.programme.school} - {topMatch.finalScore}% fit
                  </p>
                </div>
              </div>
              {(() => {
                const bullets = buildProfileMatchBullets(
                  profile,
                  topMatch.recommendation.programme,
                );
                return bullets.length > 0 ? (
                  <ul className="mt-3 space-y-1.5">
                    {bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-start gap-2 text-sm leading-6 text-ink-800"
                      >
                        <span
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-success-600"
                          aria-hidden="true"
                        />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-ink-700">
                    {topMatch.recommendation.rankReason}
                  </p>
                );
              })()}
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="success">
                  {topMatch.recommendation.adaptiveScore}% match
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
        <MetricCard label="Ranked now" value={`${simulationAwareMatches.length}`} />
        <MetricCard label="Strong fits" value={`${simulationAwareMatches.filter((item) => item.finalScore >= 72).length}`} />
        <MetricCard label="Shortlisted" value={`${shortlistIds.length}`} />
        <MetricCard label="Match clues" value={`${adaptiveSignalCount}`} />
        <MetricCard label="Clarity" value={highestClarityScore ? `${highestClarityScore}%` : '-'} />
        <MetricCard label="Facts to check" value={`${verificationCount}`} />
      </section>

      {simulationDrivenCount > 0 ? (
        <section className="rounded-card border border-brand-200 bg-brand-50 p-5">
          <Badge tone="brand" className="mb-3">
            Career game update
          </Badge>
          <h2 className="text-xl font-extrabold text-ink-900">
            Your career games changed the order
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-700">
            ScholarScout gives more weight to programs that match the work,
            interests, and paths you tried.
          </p>
          <Link
            href="/explore"
            className="mt-4 inline-flex min-h-10 items-center justify-center rounded-card border border-brand-600 bg-white px-4 text-sm font-semibold text-brand-700 hover:bg-brand-100"
          >
            Try another simulation
          </Link>
        </section>
      ) : null}

      {nextStepGuidance.length > 0 ? (
        <section className="rounded-card border border-ink-200 bg-white p-5 shadow-card">
          <Badge tone="success" className="mb-3">
            Next-step guidance
          </Badge>
          <h2 className="text-xl font-extrabold text-ink-900">
            What to do after your simulation
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {nextStepGuidance.map((step) => (
              <p
                key={step}
                className="rounded-card border border-success-100 bg-success-50 p-3 text-sm font-semibold leading-6 text-success-700"
              >
                {step}
              </p>
            ))}
          </div>
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
            These are sorted by fit first. Career games can move a school up
            when they show a strong match.
          </p>
          <div className="mt-5 space-y-3">
            {simulationAwareMatches.slice(0, 5).map((item, index) => (
              <article
                key={item.recommendation.programme.id}
                className="rounded-card border border-ink-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <SchoolLogo programme={item.recommendation.programme} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase text-ink-500">
                        #{index + 1} match
                      </p>
                      <h3 className="mt-1 text-base font-extrabold text-ink-900">
                        {item.recommendation.programme.name}
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-ink-500">
                        {item.recommendation.programme.school}
                      </p>
                    </div>
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
                {(() => {
                  const bullets = buildProfileMatchBullets(
                    profile,
                    item.recommendation.programme,
                  );
                  return bullets.length > 0 ? (
                    <ul className="mt-3 space-y-1.5">
                      {bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="flex items-start gap-2 text-sm leading-6 text-ink-700"
                        >
                          <span
                            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-success-600"
                            aria-hidden="true"
                          />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-ink-700">
                      {item.recommendation.rankReason}
                    </p>
                  );
                })()}
                {item.recommendation.signals[0] ? (
                  <p className="mt-2 text-xs font-semibold leading-5 text-brand-700">
                    {item.recommendation.signals[0].message}
                  </p>
                ) : null}
                {item.simulationReasons[0] ? (
                  <p className="mt-2 text-xs font-semibold leading-5 text-brand-700">
                    {item.simulationReasons[0]}
                  </p>
                ) : null}
                {item.recommendation.fit?.cautions[0] ? (
                  <p className="mt-2 text-xs leading-5 text-warning-700">
                    Check: {item.recommendation.fit.cautions[0]}
                  </p>
                ) : null}
                {item.nextSteps[0] ? (
                  <p className="mt-2 text-xs font-semibold leading-5 text-ink-500">
                    Next: {item.nextSteps[0]}
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
            Each path shows what to do first, what it can lead to, and what
            facts to check.
          </p>
          <div className="mt-5 space-y-3">
            {pathwayRecommendations.slice(0, 4).map((pathway) => (
              <article
                key={pathway.programme.id}
                className="rounded-card border border-ink-200 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <SchoolLogo programme={pathway.programme} size="sm" />
                    <div className="min-w-0">
                      <h3 className="text-base font-extrabold text-ink-900">
                        {pathway.programme.name}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-ink-600">
                        {pathway.headline}
                      </p>
                    </div>
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
