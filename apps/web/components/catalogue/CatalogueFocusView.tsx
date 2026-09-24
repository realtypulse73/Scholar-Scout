import Link from 'next/link';
import DiscoveryPreviewSlot from '@/components/catalogue/DiscoveryPreviewSlot';
import QualificationExplanation from '@/components/qualifications/QualificationExplanation';
import ShortlistButton from '@/components/shortlist/ShortlistButton';
import type { CatalogueDiscoveryItem } from '@/lib/catalogue-discovery';
import type { QualificationExplanation as QualificationExplanationModel } from '@/lib/qualification-lens';

const pathwayLabels: Record<NonNullable<CatalogueDiscoveryItem['pathway']>, string> = {
  university: 'University',
  'community-college': 'Community college',
  'trade-career-school': 'Trade or career school',
  'registered-apprenticeship': 'Registered apprenticeship',
  'employer-linked-training': 'Employer-linked training',
  'military-information': 'Military information',
};

interface CatalogueFocusViewProps {
  item: CatalogueDiscoveryItem;
  backHref: string;
  previousHref?: string;
  nextHref?: string;
  alternateHref: string;
  qualificationExplanation?: QualificationExplanationModel;
}

/** Complete source-first detail for one item in a finite reviewed sequence. */
export default function CatalogueFocusView({
  item,
  backHref,
  previousHref,
  nextHref,
  alternateHref,
  qualificationExplanation,
}: CatalogueFocusViewProps) {
  const facts = [
    ['Place', item.place],
    ['Delivery', item.delivery],
    ['Skill taught', item.facts.skillTaught],
    ['Training payer', item.facts.trainingPayer],
    ['Cost or tuition', item.facts.costOrTuition],
    ['Duration', item.facts.duration],
  ] as const;

  return (
    <main data-testid="catalogue-focus-layout" className="catalogue-focus min-h-screen min-w-0 max-w-full overflow-x-clip bg-ink-50 text-ink-900">
      <nav className="mx-auto flex w-full max-w-6xl min-w-0 flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-6 lg:px-8" aria-label="Opportunity detail navigation">
        <Link href={backHref} className="inline-flex min-h-touch items-center rounded-control border border-ink-300 bg-white px-4 text-sm font-semibold text-ink-700 hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Back to results</Link>
        <div className="flex flex-wrap gap-2">
          {previousHref ? <Link href={previousHref} className="inline-flex min-h-touch items-center rounded-control border border-ink-300 bg-white px-4 text-sm font-semibold text-ink-700 hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Previous opportunity</Link> : <span className="inline-flex min-h-touch items-center rounded-control border border-ink-200 bg-ink-100 px-4 text-sm font-semibold text-ink-500" aria-disabled="true">Previous opportunity unavailable</span>}
          {nextHref ? <Link href={nextHref} className="inline-flex min-h-touch items-center rounded-control border border-ink-300 bg-white px-4 text-sm font-semibold text-ink-700 hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Next opportunity</Link> : <span className="inline-flex min-h-touch items-center rounded-control border border-ink-200 bg-ink-100 px-4 text-sm font-semibold text-ink-500" aria-disabled="true">Next opportunity unavailable</span>}
        </div>
      </nav>

      <section className="relative overflow-hidden border-y border-ink-200 bg-white">
        <div data-testid="catalogue-focus-decoration" className="catalogue-focus-decoration" aria-hidden="true" />
        <div className="relative mx-auto w-full max-w-6xl min-w-0 px-5 py-10 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">{item.pathway ? pathwayLabels[item.pathway] : 'Pathway needs confirmation'}</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl">{item.providerTitle}</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-ink-600">{item.regionLabel} · {item.place.value ?? 'Location needs confirmation'} · {formatValue(item.delivery.value) ?? 'Delivery needs confirmation'}</p>
          <p className="mt-4 text-sm font-semibold text-ink-700">Factual status: {formatState(item.factState)}</p>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-6xl min-w-0 gap-6 px-5 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-8">
        <div className="min-w-0 space-y-6">
          <DiscoveryPreviewSlot />
          <section className="rounded-card border border-ink-200 bg-white p-5" aria-labelledby="facts-heading">
            <h2 id="facts-heading" className="text-xl font-semibold">Facts and sources</h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">Each detail is a reviewed factual record, not an eligibility, admission, job, pay, funding, enlistment, or outcome decision.</p>
            <dl className="mt-5 space-y-5">
              {facts.map(([label, fact]) => (
                <div key={label} className="min-w-0 border-t border-ink-100 pt-4 first:border-t-0 first:pt-0">
                  <dt className="text-sm font-semibold text-ink-900">{label}</dt>
                  <dd className="mt-1 text-base text-ink-700">{formatValue(fact.value) ?? 'Needs confirmation'}</dd>
                  <dd className="mt-2 text-sm text-ink-600">Status: {formatState(fact.state)} · Source: {fact.evidence.sourceLabel} · Reviewed: {fact.evidence.reviewedAt}</dd>
                  <dd className="mt-1 text-sm leading-6 text-ink-700">{fact.evidence.verificationAction}</dd>
                  <dd className="mt-2"><a href={fact.evidence.sourceUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-brand-700 underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Open source for {label} (opens a new tab)</a></dd>
                </div>
              ))}
            </dl>
          </section>
          {qualificationExplanation ? <QualificationExplanation explanation={qualificationExplanation} officialVerificationUrl={item.officialVerificationUrl} /> : null}
          <section className="rounded-card border border-ink-200 bg-white p-5" aria-labelledby="reasons-heading">
            <h2 id="reasons-heading" className="text-xl font-semibold">Reasons to consider</h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">These are reviewed factual details to verify, not a statement about your eligibility, outcome, or fit.</p>
            {item.reasonsToConsider.length === 0 ? (
              <p className="mt-4 text-sm text-ink-700">No reviewed factual reasons are currently listed.</p>
            ) : (
              <dl className="mt-5 space-y-5">
                {item.reasonsToConsider.map((reason) => (
                  <div key={reason.label} className="min-w-0 border-t border-ink-100 pt-4 first:border-t-0 first:pt-0">
                    <dt className="text-sm font-semibold text-ink-900">{reason.label}</dt>
                    <dd className="mt-1 text-base text-ink-700">{formatValue(reason.value)}</dd>
                    <dd className="mt-2 text-sm text-ink-600">Status: {formatState(reason.state)} · Source: {reason.evidence.sourceLabel} · Source date: {formatEvidenceDate(reason.evidence.sourceDate)}</dd>
                    <dd className="mt-1 text-sm leading-6 text-ink-700">{reason.evidence.verificationAction}</dd>
                    <dd className="mt-2"><a href={reason.evidence.sourceUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-brand-700 underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Open reason source for {reason.label} (opens a new tab)</a></dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="min-w-0 rounded-card border border-ink-200 bg-white p-5" aria-label="Official verification and student choices">
            <h2 className="text-lg font-semibold">Verify this opportunity</h2>
            <p className="mt-2 text-sm text-ink-600">Source: {item.source.label} · {item.source.date ?? 'date unavailable'} · {formatState(item.source.state)}</p>
            <a href={item.officialVerificationUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-touch w-full items-center justify-center rounded-control border border-brand-600 px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Official verification (opens a new tab)</a>
            <div className="mt-3"><ShortlistButton programmeId={item.id} /></div>
            <Link href="/shortlist" className="mt-3 inline-flex min-h-touch w-full items-center justify-center rounded-control border border-ink-300 px-4 text-sm font-semibold text-ink-700 hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Open comparison</Link>
          </section>
          <section className="min-w-0 rounded-card border border-ink-200 bg-white p-5" aria-label="Alternate paths">
            <h2 className="text-lg font-semibold">Alternate paths</h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">Browse another reviewed pathway type in the same selected metro.</p>
            <Link href={alternateHref} className="mt-3 inline-flex min-h-touch items-center rounded-control border border-ink-300 px-4 text-sm font-semibold text-ink-700 hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Explore alternate routes</Link>
          </section>
        </aside>
      </div>
    </main>
  );
}

function formatState(value: string): string {
  return value.replaceAll('-', ' ');
}

function formatValue(value: string | number | null): string | number | null {
  return typeof value === 'string' ? value.replaceAll('-', ' ') : value;
}

function formatEvidenceDate(sourceDate: { state: string; value?: string | null }): string {
  return sourceDate.state === 'documented' ? sourceDate.value ?? 'date unavailable' : 'date unavailable';
}
