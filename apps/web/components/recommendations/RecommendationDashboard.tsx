'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import OpportunityMatchCard from '@/components/opportunities/OpportunityMatchCard';
import SensitiveReferralPanel from '@/components/support/SensitiveReferralPanel';
import { Badge, Card } from '@/components/ui';
import {
  ONBOARDING_PROFILE_STORAGE_KEY,
  parseOnboardingProfile,
} from '@/lib/preference-matching';
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
  const [isSensitiveReferralOpen, setIsSensitiveReferralOpen] = useState(false);

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
  const verificationCount = governedMatches.filter(
    (match) =>
      match.cautions.length > 0 || match.evidence.state !== 'documented',
  ).length;

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
          ScholarScout uses your interests, pathway preference, location,
          affordability sensitivity, and ordinary support preferences to show
          options you can compare.
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
      <section className="rounded-card border border-border bg-white p-5 shadow-card">
        <Badge tone="brand" className="mb-4">
          Governed recommendation dashboard
        </Badge>
        <h1 className="text-3xl font-extrabold text-ink-900">
          Options to compare
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-600">
          These options reflect the ordinary preferences you selected and
          programme details that are documented or clearly marked for
          verification.
        </p>
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
        <MetricCard label="Options to verify" value={`${verificationCount}`} />
      </section>

      <Card className="p-5" aria-labelledby="verification-support-heading">
        <h2
          id="verification-support-heading"
          className="text-xl font-extrabold text-ink-900"
        >
          Verify options and find support
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-600">
          Review each option&apos;s documented details before acting. If you need
          confidential support, you can use a private, current-action option
          that does not change your profile or recommendation order.
        </p>
        <button
          type="button"
          aria-controls="sensitive-referral-panel"
          aria-expanded={isSensitiveReferralOpen}
          className="mt-4 inline-flex min-h-touch items-center justify-center rounded-control border border-brand-600 bg-white px-4 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          onClick={() => setIsSensitiveReferralOpen((open) => !open)}
        >
          Need confidential support?
        </button>
        {isSensitiveReferralOpen ? (
          <div id="sensitive-referral-panel" className="mt-4">
            <SensitiveReferralPanel />
          </div>
        ) : null}
      </Card>

      <Card className="p-5">
        <h2 className="text-xl font-extrabold text-ink-900">
          Programme and pathway options
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-600">
          Each option explains the ordinary preferences and documented details
          behind it, including what to verify before you act.
        </p>
        <div className="mt-5 space-y-3">
          {governedMatches.map((match) => (
            <OpportunityMatchCard key={match.programme.id} match={match} compact />
          ))}
        </div>
      </Card>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-bold uppercase text-ink-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink-900">{value}</p>
    </Card>
  );
}
