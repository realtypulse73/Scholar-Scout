import Link from 'next/link';
import AuthStatusLink from '@/components/auth/AuthStatusLink';
import ScholarScoutBrandMark from '@/components/branding/ScholarScoutBrandMark';
import ShortlistComparison from '@/components/shortlist/ShortlistComparison';
import ShortlistCountLink from '@/components/shortlist/ShortlistCountLink';
import { getGovernedProgrammes } from '@/lib/server/programme-records';

export const metadata = {
  title: 'Shortlist | ScholarScout',
  description:
    'Compare saved ScholarScout programmes by cost, entry flexibility, pathway, support, and delivery.',
};

export default async function ShortlistPage() {
  const programmes = await getGovernedProgrammes();

  return (
    <main className="min-h-screen bg-ink-50 text-ink-900">
      <nav
        className="mx-auto flex max-w-6xl flex-col items-start gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"
        aria-label="Shortlist navigation"
      >
        <Link href="/" aria-label="Scholar Scout" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
          <ScholarScoutBrandMark size="compact" />
        </Link>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            href="/programmes"
            className="text-sm font-semibold text-ink-600 hover:text-brand-700"
          >
            Programmes
          </Link>
          <ShortlistCountLink />
          <AuthStatusLink />
        </div>
      </nav>

      <section className="border-y border-border bg-white">
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:px-8">
          <ShortlistComparison programmes={programmes} />
        </div>
      </section>
    </main>
  );
}
