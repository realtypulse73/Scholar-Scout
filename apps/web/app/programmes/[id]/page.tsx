import Link from 'next/link';
import { notFound } from 'next/navigation';
import AffordabilityPanel from '@/components/programmes/AffordabilityPanel';
import ProgrammeFitPanel from '@/components/programmes/ProgrammeFitPanel';
import ProgrammeVisualPanel from '@/components/programmes/ProgrammeVisualPanel';
import SchoolLogo from '@/components/programmes/SchoolLogo';
import ShortlistButton from '@/components/shortlist/ShortlistButton';
import ShortlistCountLink from '@/components/shortlist/ShortlistCountLink';
import { Badge, Card } from '@/components/ui';
import {
  INTEREST_LABELS,
  SUPPORT_NEED_LABELS,
} from '@/lib/onboarding-types';
import {
  PROGRAMME_PATHWAY_LABELS,
  getProgrammeById,
  getRelatedProgrammes,
  programmes,
} from '@/lib/programmes';
import { getGovernedProgrammes } from '@/lib/server/programme-records';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export function generateStaticParams() {
  return programmes.map((programme) => ({
    id: programme.id,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const programme =
    (await getGovernedProgrammes()).find((item) => item.id === id) ??
    getProgrammeById(id);

  if (!programme) {
    return {
      title: 'Programme Not Found | ScholarScout',
    };
  }

  return {
    title: `${programme.name} | ScholarScout`,
    description: `${programme.name} at ${programme.school}: cost, entry options, support, place, and next steps.`,
  };
}

export default async function ProgrammeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const allProgrammes = await getGovernedProgrammes();
  const programme = allProgrammes.find((item) => item.id === id);

  if (!programme) {
    notFound();
  }

  const related = getRelatedProgrammes(programme).filter((item) =>
    allProgrammes.some((record) => record.id === item.id),
  );

  return (
    <main className="min-h-screen bg-ink-50 text-ink-900">
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8"
        aria-label="Programme detail navigation"
      >
        <Link href="/" className="text-lg font-extrabold text-brand-700">
          ScholarScout
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/programmes"
            className="text-sm font-semibold text-ink-600 hover:text-brand-700"
          >
            Programmes
          </Link>
          <ShortlistCountLink />
        </div>
      </nav>

      <section className="border-y border-ink-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="success">{programme.matchScore}% fit</Badge>
              <Badge>{PROGRAMME_PATHWAY_LABELS[programme.pathway]}</Badge>
              <Badge>{programme.delivery}</Badge>
              <Badge tone="brand">{programme.credential}</Badge>
            </div>
            <h1 className="mt-5 text-3xl font-extrabold leading-tight text-ink-900 sm:text-4xl">
              {programme.name}
            </h1>
            <div className="mt-3 flex items-center gap-3">
              <SchoolLogo programme={programme} size="md" />
              <p className="text-base font-semibold text-ink-600">
                {programme.school} - {programme.city}, {programme.state}
              </p>
            </div>
            <p className="mt-5 max-w-3xl text-base leading-7 text-ink-600">
              {programme.overview}
            </p>
            <div className="mt-6">
              <ShortlistButton
                programmeId={programme.id}
                className="inline-flex min-h-12 items-center rounded-card border border-brand-600 bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              />
            </div>
          </div>

          <Card className="p-5">
            <h2 className="text-sm font-extrabold uppercase text-ink-500">
              Snapshot
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-4">
              <Metric label="Annual tuition" value={`$${programme.annualTuition.toLocaleString()}`} />
              <Metric
                label="Entry flexibility"
                value={`${programme.acceptanceRate}%`}
                note="Not an admission prediction"
              />
              <Metric label="Duration" value={programme.duration} />
              <Metric label="Delivery" value={programme.delivery} />
            </dl>
          </Card>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
        <div className="space-y-6">
          <ProgrammeVisualPanel programme={programme} />

          <ProgrammeFitPanel programme={programme} />

          <AffordabilityPanel programme={programme} />

          <Card className="p-5">
            <h2 className="text-xl font-extrabold">Fit factors</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {programme.highlights.map((highlight) => (
                <div
                  key={highlight}
                  className="rounded-card border border-ink-200 bg-ink-50 p-4"
                >
                  <p className="text-sm font-bold text-ink-900">{highlight}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-xl font-extrabold">Support services</h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">
              These supports are listed for this program. Use them to compare
              fit before you apply.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {programme.support.map((support) => (
                <Badge key={support} tone="brand">
                  {SUPPORT_NEED_LABELS[support]}
                </Badge>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-xl font-extrabold">Next steps</h2>
            <ol className="mt-4 space-y-3">
              {programme.nextSteps.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-extrabold text-brand-800">
                    {index + 1}
                  </span>
                  <span className="pt-1 text-sm font-medium text-ink-700">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="p-5">
            <h2 className="text-lg font-extrabold">Program details</h2>
            <dl className="mt-4 space-y-4">
              <Detail label="Pathway" value={PROGRAMME_PATHWAY_LABELS[programme.pathway]} />
              <Detail label="Credential" value={programme.credential} />
              <Detail label="Location" value={`${programme.city}, ${programme.state}`} />
              <Detail label="Delivery" value={programme.delivery} />
              <Detail
                label="Interest areas"
                value={programme.interests
                  .map((interest) => INTEREST_LABELS[interest])
                  .join(', ')}
              />
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-extrabold">Related options</h2>
            <div className="mt-4 space-y-3">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/programmes/${item.id}`}
                  className="block rounded-card border border-ink-200 p-3 transition-colors hover:border-brand-300 hover:bg-brand-50"
                >
                  <p className="text-sm font-bold text-ink-900">{item.name}</p>
                  <p className="mt-1 text-xs font-semibold text-ink-500">
                    {item.school}
                  </p>
                </Link>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-ink-500">{label}</dt>
      <dd className="mt-1 text-xl font-extrabold text-ink-900">{value}</dd>
      {note ? (
        <dd className="mt-1 text-xs font-medium leading-4 text-ink-500">
          {note}
        </dd>
      ) : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-ink-500">{label}</dt>
      <dd className="mt-1 text-sm font-bold leading-6 text-ink-800">{value}</dd>
    </div>
  );
}
