import Link from 'next/link';
import AuthStatusLink from '@/components/auth/AuthStatusLink';
import RecommendationDashboard from '@/components/recommendations/RecommendationDashboard';
import { getGovernedProgrammes } from '@/lib/server/programme-records';

export const metadata = {
  title: 'Recommendations | ScholarScout',
  description:
    'A decision dashboard that turns ScholarScout matches into ranked options, pathways, and practical next steps.',
};

export default async function RecommendationsPage() {
  const programmes = await getGovernedProgrammes();

  return (
    <main className="min-h-screen bg-ink-50 text-ink-900">
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8"
        aria-label="Recommendation navigation"
      >
        <Link href="/" className="text-lg font-semibold text-brand-700">
          ScholarScout
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/programmes"
            className="text-sm font-semibold text-ink-600 hover:text-brand-700"
          >
            Programmes
          </Link>
          <Link
            href="/shortlist"
            className="text-sm font-semibold text-ink-600 hover:text-brand-700"
          >
            Shortlist
          </Link>
          <AuthStatusLink />
        </div>
      </nav>

      <section className="border-y border-border bg-white">
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:px-8">
          <RecommendationDashboard programmes={programmes} />
        </div>
      </section>
    </main>
  );
}
