'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import OpportunityMatchCard from '@/components/opportunities/OpportunityMatchCard';
import { Badge, Card } from '@/components/ui';
import {
  ONBOARDING_PROFILE_STORAGE_KEY,
  parseOnboardingProfile,
} from '@/lib/preference-matching';
import { buildPathwayRecommendations } from '@/lib/pathway-recommendations';
import {
  SHORTLIST_STORAGE_KEY,
  parseShortlist,
} from '@/lib/shortlist';
import type { OnboardingData } from '@/lib/onboarding-types';
import { rankOpportunityMatches } from '@/lib/opportunity-matching';
import type { Programme } from '@/lib/programmes';

interface RecommendationDashboardProps {
  programmes: Programme[];
}

export default function RecommendationDashboard({
  programmes,
}: RecommendationDashboardProps) {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<OnboardingData | null>(null);
  const [shortlistIds, setShortlistIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    function loadLocalRecommendationContext() {
      const localProfile = parseOnboardingProfile(
        window.localStorage.getItem(ONBOARDING_PROFILE_STORAGE_KEY),
      );
      const localShortlistIds = parseShortlist(
        window.localStorage.getItem(SHORTLIST_STORAGE_KEY),
      );
      setProfile(localProfile);
      setShortlistIds(localShortlistIds);

      return {
        localProfile,
        localShortlistIds,
      };
    }

    async function loadRecommendationContext() {
      const { localProfile, localShortlistIds } =
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
          };
          setShortlistIds(body.programmeIds ?? localShortlistIds);
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

  const governedMatches = useMemo(
    () => (profile ? rankOpportunityMatches(programmes, profile) : []),
    [programmes, profile],
  );
  const pathwayRecommendations = useMemo(
    () =>
      buildPathwayRecommendations(
        governedMatches.slice(0, 5).map((match) => match.programme),
        profile,
      ),
    [governedMatches, profile],
  );
  const topMatch = governedMatches[0];
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
          Governed recommendation dashboard
        </Badge>
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <h1 className="text-3xl font-extrabold text-ink-900">
              Your best next move
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-600">
              These options use the preferences you chose and programme details
              that are documented or clearly marked for verification.
            </p>
          </div>
          {topMatch ? (
            <OpportunityMatchCard match={topMatch} compact />
          ) : null}
        </div>
      </section>

      <section
        className="grid gap-4 md:grid-cols-6"
        aria-label="Dashboard metrics"
      >
        <MetricCard label="Options shown" value={`${governedMatches.length}`} />
        <MetricCard label="Documented details" value={`${governedMatches.filter((match) => match.evidence.state === 'documented').length}`} />
        <MetricCard label="Shortlisted" value={`${shortlistIds.length}`} />
        <MetricCard label="Preference reasons" value="2–4" />
        <MetricCard label="Evidence review" value="Included" />
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
            These are ordered from your stated ordinary preferences and the
            documented programme details available for review.
          </p>
          <div className="mt-5 space-y-3">
            {governedMatches.slice(0, 5).map((match) => (
              <OpportunityMatchCard key={match.programme.id} match={match} compact />
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
            {governedMatches.slice(0, 4).map((match) => (
              <OpportunityMatchCard key={match.programme.id} match={match} compact />
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
