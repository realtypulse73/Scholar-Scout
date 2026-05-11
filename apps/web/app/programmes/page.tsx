import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import AuthStatusLink from '@/components/auth/AuthStatusLink';
import ProgrammeResults from '@/components/programmes/ProgrammeResults';
import ShortlistCountLink from '@/components/shortlist/ShortlistCountLink';
import { Badge, Card } from '@/components/ui';
import type { LocationPreference } from '@/lib/onboarding-types';
import {
  PROGRAMME_PATHWAY_LABELS,
  filterProgrammes,
  type ProgrammePathway,
} from '@/lib/programmes';
import { parsePageParam } from '@/lib/pagination';
import { rankProgrammesForProfile } from '@/lib/preference-matching';
import { getOnboardingProfile } from '@/lib/server/data-store';
import { getGovernedProgrammes } from '@/lib/server/programme-records';

const tuitionOptions = [
  { label: 'Any tuition', value: '' },
  { label: '$5k or less', value: '5000' },
  { label: '$8k or less', value: '8000' },
  { label: '$12k or less', value: '12000' },
];

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export const metadata = {
  title: 'Programmes | ScholarScout',
  description:
    'Browse matched post-secondary programmes by cost, pathway, location, entry flexibility, and support fit.',
};

export default async function ProgrammesPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const allProgrammes = await getGovernedProgrammes();
  const initialProfile = session?.user?.id
    ? await getOnboardingProfile(session.user.id)
    : null;
  const params = (await searchParams) ?? {};
  const query = readParam(params, 'q') ?? '';
  const pathway = (readParam(params, 'pathway') ?? 'all') as
    | ProgrammePathway
    | 'all';
  const location = readParam(params, 'location') ?? 'all';
  const maxTuitionValue = readParam(params, 'maxTuition') ?? '';
  const currentPage = parsePageParam(readParam(params, 'page'));
  const maxTuition = maxTuitionValue ? Number(maxTuitionValue) : undefined;
  const filtered = filterProgrammes(allProgrammes, {
    query,
    pathway,
    location: location as LocationPreference | 'all',
    maxTuition,
  });
  const ranked = rankProgrammesForProfile(filtered, initialProfile);
  const serializedParams = {
    q: query || undefined,
    pathway: pathway === 'all' ? undefined : pathway,
    location: location === 'all' ? undefined : location,
    maxTuition: maxTuitionValue || undefined,
  };

  return (
    <main className="min-h-screen bg-ink-50 text-ink-900">
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8"
        aria-label="Programmes navigation"
      >
        <Link href="/" className="text-lg font-extrabold text-brand-700">
          ScholarScout
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/onboarding"
            className="text-sm font-semibold text-ink-600 hover:text-brand-700"
          >
            Update preferences
          </Link>
          <ShortlistCountLink />
          <AuthStatusLink />
        </div>
      </nav>

      <section className="border-y border-ink-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 lg:px-8">
          <Badge tone="brand" className="mb-4">
            Match list
          </Badge>
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <h1 className="text-3xl font-extrabold text-ink-900 sm:text-4xl">
                Programmes worth exploring
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-600 sm:text-base">
                A first-pass directory of post-secondary routes scored for fit,
                cost, pathway, support services, and entry flexibility.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="border-l border-ink-200 pl-3">
                <p className="text-2xl font-extrabold">{filtered.length}</p>
                <p className="text-xs font-semibold uppercase text-ink-500">
                  matches
                </p>
              </div>
              <div className="border-l border-ink-200 pl-3">
                <p className="text-2xl font-extrabold">100%</p>
                <p className="text-xs font-semibold uppercase text-ink-500">
                  flexible routes
                </p>
              </div>
              <div className="border-l border-ink-200 pl-3">
                <p className="text-2xl font-extrabold">$0</p>
                <p className="text-xs font-semibold uppercase text-ink-500">
                  rejection fee
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <Card className="p-5">
            <form action="/programmes" className="space-y-5">
              <div>
                <label
                  htmlFor="q"
                  className="text-sm font-bold text-ink-800"
                >
                  Search
                </label>
                <input
                  id="q"
                  name="q"
                  defaultValue={query}
                  placeholder="Programme, school, city"
                  className="mt-2 min-h-touch w-full rounded-card border border-ink-200 bg-white px-3 text-sm text-ink-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                />
              </div>

              <div>
                <label
                  htmlFor="pathway"
                  className="text-sm font-bold text-ink-800"
                >
                  Pathway
                </label>
                <select
                  id="pathway"
                  name="pathway"
                  defaultValue={pathway}
                  className="mt-2 min-h-touch w-full rounded-card border border-ink-200 bg-white px-3 text-sm text-ink-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                >
                  <option value="all">All pathways</option>
                  {Object.entries(PROGRAMME_PATHWAY_LABELS).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="text-sm font-bold text-ink-800"
                >
                  Location
                </label>
                <select
                  id="location"
                  name="location"
                  defaultValue={location}
                  className="mt-2 min-h-touch w-full rounded-card border border-ink-200 bg-white px-3 text-sm text-ink-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                >
                  <option value="all">Any location</option>
                  <option value="local">Campus or hybrid</option>
                  <option value="online-only">Online only</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="maxTuition"
                  className="text-sm font-bold text-ink-800"
                >
                  Tuition
                </label>
                <select
                  id="maxTuition"
                  name="maxTuition"
                  defaultValue={maxTuitionValue}
                  className="mt-2 min-h-touch w-full rounded-card border border-ink-200 bg-white px-3 text-sm text-ink-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                >
                  {tuitionOptions.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="inline-flex min-h-touch w-full items-center justify-center rounded-card border border-brand-600 bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                Apply filters
              </button>
            </form>
          </Card>
        </aside>

        <ProgrammeResults
          programmes={ranked}
          page={currentPage}
          params={serializedParams}
          initialProfile={initialProfile}
        />
      </div>
    </main>
  );
}
