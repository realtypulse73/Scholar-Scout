import Link from 'next/link';
import ShortlistButton from '@/components/shortlist/ShortlistButton';
import {
  buildCatalogueDetailHref,
  buildCatalogueDiscoveryHref,
  type CatalogueDiscoveryFilters,
  type CatalogueDiscoveryItem,
} from '@/lib/catalogue-discovery';
import { CATALOGUE_PATHWAYS } from '@/lib/catalogue-contract';

const pathwayLabels: Record<NonNullable<CatalogueDiscoveryItem['pathway']>, string> = {
  university: 'University',
  'community-college': 'Community college',
  'trade-career-school': 'Trade or career school',
  'registered-apprenticeship': 'Registered apprenticeship',
  'employer-linked-training': 'Employer-linked training',
  'military-information': 'Military information',
};

interface CatalogueOpportunityCardProps {
  item: CatalogueDiscoveryItem;
  filters: CatalogueDiscoveryFilters;
}

/** A scan-friendly public record card that keeps its evidence and next action visible. */
export default function CatalogueOpportunityCard({
  item,
  filters,
}: CatalogueOpportunityCardProps) {
  const factsToVerify = Object.entries({
    'Location': item.place,
    'Delivery': item.delivery,
    'Skill taught': item.facts.skillTaught,
    'Training payer': item.facts.trainingPayer,
    'Cost or tuition': item.facts.costOrTuition,
    'Duration': item.facts.duration,
  }).filter(([, fact]) => fact.state !== 'current');
  const alternatePathway = CATALOGUE_PATHWAYS.find((pathway) => pathway !== item.pathway) ?? 'university';
  const alternateHref = buildCatalogueDiscoveryHref({
    ...filters,
    pathway: alternatePathway,
    page: 1,
  });

  return (
    <article className="min-w-0 max-w-full rounded-card border border-ink-200 bg-white p-5 shadow-sm" aria-labelledby={`catalogue-card-${item.id}`}>
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-700">
            {item.pathway ? pathwayLabels[item.pathway] : 'Pathway needs confirmation'}
          </p>
          <h3 id={`catalogue-card-${item.id}`} className="mt-1 break-words text-xl font-semibold">{item.providerTitle}</h3>
          <p className="mt-1 text-sm text-ink-600">
            {item.place.value ?? 'Location needs confirmation'} · {formatValue(item.delivery.value) ?? 'Delivery needs confirmation'}
          </p>
        </div>
        <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-700">
          Facts: {formatState(item.factState)}
        </span>
      </div>

      <dl className="mt-4 grid min-w-0 gap-3 text-sm sm:grid-cols-2">
        <Fact label="Cost or tuition" value={item.facts.costOrTuition.value} state={item.facts.costOrTuition.state} />
        <Fact label="Skill taught" value={item.facts.skillTaught.value} state={item.facts.skillTaught.state} />
      </dl>

      <p className="mt-4 text-sm text-ink-600">
        Source: {item.source.label} · {item.source.date ?? 'date unavailable'} · {formatState(item.source.state)}
      </p>

      {factsToVerify.length > 0 ? (
        <section className="mt-4 rounded-card border border-warning-200 bg-warning-50 p-3" aria-label="Facts to verify">
          <h4 className="text-sm font-semibold text-warning-700">Facts to verify</h4>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-ink-700">
            {factsToVerify.map(([label, fact]) => (
              <li key={label}>{label}: {formatState(fact.state)}. {fact.evidence.verificationAction}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <div data-testid="catalogue-card-actions" className="mt-5 flex min-w-0 flex-wrap gap-3">
        <Link href={buildCatalogueDetailHref(item.id, filters)} aria-label={`See all facts and sources for ${item.providerTitle}`} className="inline-flex min-h-touch items-center rounded-control border border-brand-600 px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          See all facts and sources
        </Link>
        <ShortlistButton programmeId={item.id} />
        <Link href="/shortlist" className="inline-flex min-h-touch items-center rounded-control border border-ink-300 px-4 text-sm font-semibold text-ink-700 hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          Open comparison
        </Link>
        <Link href={alternateHref} className="inline-flex min-h-touch items-center rounded-control border border-ink-300 px-4 text-sm font-semibold text-ink-700 hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          Alternate routes: {pathwayLabels[alternatePathway]}
        </Link>
        <a href={item.officialVerificationUrl} target="_blank" rel="noreferrer" aria-label={`Official verification for ${item.providerTitle} (opens a new tab)`} className="inline-flex min-h-touch items-center rounded-control border border-ink-300 px-4 text-sm font-semibold text-ink-700 hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          Official verification (opens a new tab)
        </a>
      </div>
    </article>
  );
}

function Fact({ label, value, state }: { label: string; value: string | number | null; state: string }) {
  return <div><dt className="font-semibold text-ink-700">{label}</dt><dd className="mt-1 text-ink-600">{value ?? 'Needs confirmation'} <span className="text-xs">({formatState(state)})</span></dd></div>;
}

function formatState(value: string): string {
  return value.replaceAll('-', ' ');
}

function formatValue(value: string | null): string | null {
  return value ? value.replaceAll('-', ' ') : null;
}
