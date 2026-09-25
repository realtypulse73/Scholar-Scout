'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import CatalogueOpportunityCard from '@/components/catalogue/CatalogueOpportunityCard';
import QualificationRecordForm from '@/components/qualifications/QualificationRecordForm';
import { type CatalogueDiscoveryModel } from '@/lib/catalogue-discovery';
import { CATALOGUE_PATHWAYS } from '@/lib/catalogue-contract';
import { orderQualificationsFirst, type QualificationLensModel } from '@/lib/qualification-lens';
import { catalogueRegions } from '@/lib/catalogue-fixtures';

const pathwayLabels: Record<(typeof CATALOGUE_PATHWAYS)[number], string> = {
  university: 'University',
  'community-college': 'Community college',
  'trade-career-school': 'Trade or career school',
  'registered-apprenticeship': 'Registered apprenticeship',
  'employer-linked-training': 'Employer-linked training',
  'military-information': 'Military information',
};

interface CatalogueDiscoveryOverviewProps {
  model: CatalogueDiscoveryModel;
  qualificationLens?: QualificationLensModel;
  qualificationLensState?: 'ready' | 'loading' | 'error';
  canEditQualifications?: boolean;
  onRetryQualificationLens?: () => void;
}

export default function CatalogueDiscoveryOverview({
  model,
  qualificationLens,
  qualificationLensState = qualificationLens ? 'ready' : 'error',
  canEditQualifications = false,
  onRetryQualificationLens,
}: CatalogueDiscoveryOverviewProps) {
  const router = useRouter();
  const { filters, region } = model;
  const activeFilters = describeActiveFilters(filters);
  const [order, setOrder] = useState<'normal' | 'qualifications'>('normal');
  const [showQualificationEditor, setShowQualificationEditor] = useState(false);
  const qualificationTrigger = useRef<HTMLButtonElement>(null);
  const lensEntries = qualificationLens?.items ?? [];
  const isLensReady = qualificationLensState === 'ready' && Boolean(qualificationLens);
  const displayedEntries = order === 'qualifications' && isLensReady
    ? orderQualificationsFirst(lensEntries)
    : model.items.map((item) => ({ item, explanation: undefined }));
  const resultCount = displayedEntries.length;
  const orderLabel = order === 'qualifications' ? 'Qualifications first' : 'Normal catalogue';

  function closeQualificationEditor() {
    setShowQualificationEditor(false);
    window.setTimeout(() => qualificationTrigger.current?.focus(), 0);
  }

  function refreshQualificationLens() {
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-ink-50 text-ink-900">
      <section className="border-y border-ink-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Reviewed opportunity catalogue</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl">Reviewed opportunities in {region.label}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-600 sm:text-base">Browse factual records from the current reviewed snapshot. Your controls narrow this list only; they do not assess eligibility or rank you.</p>
        </div>
      </section>
      <div data-testid="catalogue-overview-layout" className="mx-auto grid w-full min-w-0 max-w-6xl gap-6 px-5 py-8 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">
        <aside className="min-w-0 lg:sticky lg:top-4 lg:self-start">
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
            <p className="mt-1 text-sm text-ink-600" role="status" aria-live="polite">
              Showing {resultCount} reviewed opportunit{resultCount === 1 ? 'y' : 'ies'}. {orderLabel} order. Every opportunity is still shown. {model.sortSummary}
              {activeFilters ? ` Active filters: ${activeFilters}.` : ' No additional filters are active.'}
            </p>
            <fieldset className="mt-5 min-w-0 rounded-card border border-ink-200 bg-ink-50 p-3">
              <legend className="px-1 text-sm font-semibold text-ink-900">Order opportunities</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="flex min-h-touch items-center gap-3 rounded-control border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-800">
                  <input type="radio" name="catalogue-order" value="normal" checked={order === 'normal'} onChange={() => setOrder('normal')} />
                  Normal catalogue
                </label>
                <label className="flex min-h-touch items-center gap-3 rounded-control border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-800">
                  <input
                    type="radio"
                    name="catalogue-order"
                    value="qualifications"
                    checked={order === 'qualifications'}
                    disabled={!isLensReady}
                    onChange={() => setOrder('qualifications')}
                  />
                  Qualifications first
                </label>
              </div>
              <p className="mt-3 text-sm leading-6 text-ink-700">Every reviewed opportunity stays in the list. This changes order only.</p>
              {qualificationLensState === 'loading' ? <><p className="mt-2 text-sm text-ink-600">Loading your saved qualifications…</p><div aria-hidden="true" className="mt-2 min-h-24 rounded-card border border-ink-200 bg-white" /></> : null}
              {qualificationLensState === 'error' || !qualificationLens ? <><p className="mt-2 text-sm text-ink-600">Qualifications first is unavailable right now. You can still browse every opportunity.</p><button type="button" className="mt-2 text-sm font-semibold text-brand-red underline-offset-4 hover:underline" onClick={onRetryQualificationLens}>Retry qualifications first</button></> : null}
              {isLensReady && lensEntries.every((entry) => entry.explanation.checkedRequirements.length === 0 && entry.explanation.keywordConnections.length === 0) ? <p className="mt-2 text-sm text-ink-600">Add qualifications to check published requirements.</p> : null}
              {canEditQualifications ? <button ref={qualificationTrigger} type="button" onClick={() => setShowQualificationEditor(true)} className="mt-3 inline-flex min-h-touch items-center rounded-control border border-brand-600 px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Edit qualifications</button> : <Link href="/auth/sign-in" className="mt-3 inline-flex min-h-touch items-center text-sm font-semibold text-brand-700 underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Sign in to edit qualifications</Link>}
              {showQualificationEditor ? <div className="mt-4"><QualificationRecordForm onClose={closeQualificationEditor} onSuccess={refreshQualificationLens} /></div> : null}
            </fieldset>
            <p className="mt-3 text-sm font-semibold text-ink-700">Coverage for {region.label}</p>
            <ul data-testid="catalogue-coverage" className="mt-2 grid min-w-0 gap-2 text-sm sm:grid-cols-2" aria-label="Pathway coverage">
              {model.coverage.map((coverage) => <li key={coverage.pathway} className="rounded-control border border-ink-200 px-3 py-2"><span className="font-medium">{pathwayLabels[coverage.pathway]}</span>: {coverage.state === 'verified' ? 'Verified coverage' : 'Not yet verified'} <span className="text-ink-500">(reviewed {coverage.reviewedAt})</span></li>)}
            </ul>
          </div>
          {displayedEntries.length > 0 ? displayedEntries.map(({ item, explanation }) => <CatalogueOpportunityCard key={item.id} item={item} filters={filters} qualificationExplanation={order === 'qualifications' && isLensReady ? explanation : undefined} />) : <EmptyState model={model} />}
        </section>
      </div>
    </main>
  );
}

function FilterSelect({ label, name, value, children }: { label: string; name: string; value: string; children: React.ReactNode }) {
  return <div><label htmlFor={name} className="text-sm font-semibold text-ink-800">{label}</label><select id={name} name={name} defaultValue={value} className="mt-2 min-h-touch w-full rounded-card border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-focus">{children}</select></div>;
}

function describeActiveFilters(filters: CatalogueDiscoveryModel['filters']): string {
  const descriptions = [
    filters.pathway !== 'all' ? `Pathway type: ${pathwayLabels[filters.pathway]}` : null,
    filters.delivery !== 'all' ? `Delivery: ${filters.delivery.replaceAll('-', ' ')}` : null,
    filters.status !== 'all' ? `Fact status: ${filters.status.replaceAll('-', ' ')}` : null,
    filters.q ? `Search: ${filters.q}` : null,
  ].filter((description): description is string => description !== null);

  return descriptions.join('; ');
}
function EmptyState({ model }: { model: CatalogueDiscoveryModel }) {
  const message = model.emptyState === 'filters-empty' ? 'Your active filters removed all reviewed cards. Reset or widen the filters to return to this metro’s reviewed snapshot.' : model.emptyState === 'coverage-not-yet-verified' ? 'This pathway’s coverage is not yet verified for this metro, so no availability or exclusion is implied.' : 'The current reviewed snapshot has no published cards for this metro. This does not mean no opportunities exist.';
  return <div className="rounded-card border border-dashed border-ink-300 bg-white p-6" role="status"><h2 className="text-xl font-semibold">No reviewed cards to show</h2><p className="mt-2 text-sm leading-6 text-ink-600">{message}</p><p className="mt-2 text-sm text-ink-600">Boundary: {model.region.officialBoundary.boundaryVersion}. Local focus: {model.region.localFocus.anchorLabel}.</p><Link href={model.resetHref} className="mt-4 inline-flex min-h-touch items-center rounded-control border border-brand-600 px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50">Browse this metro’s reviewed snapshot</Link></div>;
}
