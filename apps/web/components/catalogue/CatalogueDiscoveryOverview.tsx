import Link from 'next/link';
import ShortlistButton from '@/components/shortlist/ShortlistButton';
import {
  buildCatalogueDetailHref,
  type CatalogueDiscoveryModel,
} from '@/lib/catalogue-discovery';
import { CATALOGUE_PATHWAYS } from '@/lib/catalogue-contract';
import { catalogueRegions } from '@/lib/catalogue-fixtures';

const pathwayLabels: Record<(typeof CATALOGUE_PATHWAYS)[number], string> = {
  university: 'University',
  'community-college': 'Community college',
  'trade-career-school': 'Trade or career school',
  'registered-apprenticeship': 'Registered apprenticeship',
  'employer-linked-training': 'Employer-linked training',
  'military-information': 'Military information',
};

export default function CatalogueDiscoveryOverview({ model }: { model: CatalogueDiscoveryModel }) {
  const { filters, region } = model;
  return (
    <main className="min-h-screen bg-ink-50 text-ink-900">
      <section className="border-y border-ink-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Reviewed opportunity catalogue</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl">Reviewed opportunities in {region.label}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-600 sm:text-base">Browse factual records from the current reviewed snapshot. Your controls narrow this list only; they do not assess eligibility or rank you.</p>
        </div>
      </section>
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <form action="/programmes" className="space-y-5 rounded-card border border-ink-200 bg-white p-5 shadow-sm" aria-label="Catalogue filters">
            <FilterSelect label="Metro area" name="metro" value={filters.metro}>{catalogueRegions.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.label}</option>)}</FilterSelect>
            <FilterSelect label="Pathway type" name="pathway" value={filters.pathway}><option value="all">All pathway types</option>{CATALOGUE_PATHWAYS.map((pathway) => <option key={pathway} value={pathway}>{pathwayLabels[pathway]}</option>)}</FilterSelect>
            <FilterSelect label="Delivery" name="delivery" value={filters.delivery}><option value="all">Any delivery</option><option value="in-person">In person</option><option value="online">Online</option><option value="hybrid">Hybrid</option></FilterSelect>
            <FilterSelect label="Fact status" name="status" value={filters.status}><option value="all">Any status</option><option value="current">Current</option><option value="needs-confirmation">Needs confirmation</option><option value="unknown">Unknown</option><option value="conflicting">Conflicting</option></FilterSelect>
            <div><label htmlFor="q" className="text-sm font-semibold text-ink-800">Search reviewed records</label><input id="q" name="q" defaultValue={filters.q} className="mt-2 min-h-touch w-full rounded-card border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-focus" /></div>
            <button type="submit" className="inline-flex min-h-touch w-full items-center justify-center rounded-card bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2">Apply filters</button>
            <Link href={model.resetHref} className="block text-center text-sm font-semibold text-brand-700 underline underline-offset-4">Reset filters</Link>
          </form>
        </aside>
        <section aria-labelledby="catalogue-results-heading" className="min-w-0 space-y-5">
          <div className="rounded-card border border-ink-200 bg-white p-5">
            <h2 id="catalogue-results-heading" className="text-xl font-semibold">Reviewed cards</h2>
            <p className="mt-1 text-sm text-ink-600" role="status">{model.items.length} result{model.items.length === 1 ? '' : 's'}. {model.sortSummary}</p>
            <p className="mt-3 text-sm font-semibold text-ink-700">Coverage for {region.label}</p>
            <ul className="mt-2 grid gap-2 text-sm sm:grid-cols-2" aria-label="Pathway coverage">
              {model.coverage.map((coverage) => <li key={coverage.pathway} className="rounded-control border border-ink-200 px-3 py-2"><span className="font-medium">{pathwayLabels[coverage.pathway]}</span>: {coverage.state === 'verified' ? 'Verified coverage' : 'Not yet verified'} <span className="text-ink-500">(reviewed {coverage.reviewedAt})</span></li>)}
            </ul>
          </div>
          {model.items.length > 0 ? model.items.map((item) => <article key={item.id} className="rounded-card border border-ink-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold text-brand-700">{item.pathway ? pathwayLabels[item.pathway] : 'Pathway needs confirmation'}</p><h3 className="mt-1 text-xl font-semibold">{item.providerTitle}</h3><p className="mt-1 text-sm text-ink-600">{item.place.value ?? 'Location needs confirmation'} · {item.delivery.value ?? 'Delivery needs confirmation'}</p></div><span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-700">Facts: {item.factState.replace('-', ' ')}</span></div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><Fact label="Skill taught" value={item.facts.skillTaught.value} state={item.facts.skillTaught.state} /><Fact label="Training payer" value={item.facts.trainingPayer.value} state={item.facts.trainingPayer.state} /><Fact label="Cost or tuition" value={item.facts.costOrTuition.value} state={item.facts.costOrTuition.state} /><Fact label="Duration" value={item.facts.duration.value} state={item.facts.duration.state} /></dl>
            <p className="mt-4 text-sm text-ink-600">Source: {item.source.label} · {item.source.date ?? 'date unavailable'} · {item.source.state.replace('-', ' ')}</p>
            <p className="mt-2 text-sm text-ink-600">Visual preview is reserved for rights review; this card intentionally does not display provider or learner media.</p>
            <div className="mt-5 flex flex-wrap gap-3"><Link href={buildCatalogueDetailHref(item.id, filters)} className="inline-flex min-h-touch items-center rounded-control border border-brand-600 px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">See all facts and sources</Link><ShortlistButton programmeId={item.id} /><Link href="/shortlist" className="inline-flex min-h-touch items-center rounded-control border border-ink-300 px-4 text-sm font-semibold text-ink-700 hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Open comparison</Link><a href={item.officialVerificationUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-touch items-center rounded-control border border-ink-300 px-4 text-sm font-semibold text-ink-700 hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Official verification (opens a new tab)</a></div>
          </article>) : <EmptyState model={model} />}
        </section>
      </div>
    </main>
  );
}

function FilterSelect({ label, name, value, children }: { label: string; name: string; value: string; children: React.ReactNode }) {
  return <div><label htmlFor={name} className="text-sm font-semibold text-ink-800">{label}</label><select id={name} name={name} defaultValue={value} className="mt-2 min-h-touch w-full rounded-card border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-focus">{children}</select></div>;
}
function Fact({ label, value, state }: { label: string; value: string | number | null; state: string }) {
  return <div><dt className="font-semibold text-ink-700">{label}</dt><dd className="mt-1 text-ink-600">{value ?? 'Needs confirmation'} <span className="text-xs">({state.replace('-', ' ')})</span></dd></div>;
}
function EmptyState({ model }: { model: CatalogueDiscoveryModel }) {
  const message = model.emptyState === 'filters-empty' ? 'Your active filters removed all reviewed cards. Reset or widen the filters to return to this metro’s reviewed snapshot.' : model.emptyState === 'coverage-not-yet-verified' ? 'This pathway’s coverage is not yet verified for this metro, so no availability or exclusion is implied.' : 'The current reviewed snapshot has no published cards for this metro. This does not mean no opportunities exist.';
  return <div className="rounded-card border border-dashed border-ink-300 bg-white p-6" role="status"><h2 className="text-xl font-semibold">No reviewed cards to show</h2><p className="mt-2 text-sm leading-6 text-ink-600">{message}</p><p className="mt-2 text-sm text-ink-600">Boundary: {model.region.officialBoundary.boundaryVersion}. Local focus: {model.region.localFocus.anchorLabel}.</p><Link href={model.resetHref} className="mt-4 inline-flex min-h-touch items-center rounded-control border border-brand-600 px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50">Browse this metro’s reviewed snapshot</Link></div>;
}
