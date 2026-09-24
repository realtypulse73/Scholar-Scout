'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import QualificationExplanation from '@/components/qualifications/QualificationExplanation';
import {
  SHORTLIST_STORAGE_KEY,
  parseShortlist,
  toggleShortlistId,
} from '@/lib/shortlist';
import { CATALOGUE_PATHWAYS } from '@/lib/catalogue-contract';
import { buildCatalogueDetailHref } from '@/lib/catalogue-discovery';
import type {
  CatalogueDiscoveryFact,
  CatalogueDiscoveryItem,
} from '@/lib/catalogue-discovery';
import type { QualificationExplanation as QualificationExplanationModel } from '@/lib/qualification-lens';

interface CatalogueComparisonProps {
  items: CatalogueDiscoveryItem[];
  qualificationExplanations?: Record<string, QualificationExplanationModel>;
}

const pathwayLabels: Record<(typeof CATALOGUE_PATHWAYS)[number], string> = {
  university: 'University',
  'community-college': 'Community college',
  'trade-career-school': 'Trade or career school',
  'registered-apprenticeship': 'Registered apprenticeship',
  'employer-linked-training': 'Employer-linked training',
  'military-information': 'Military information',
};

/** Compares only visitor-saved IDs against the supplied public catalogue snapshot. */
export default function CatalogueComparison({
  items,
  qualificationExplanations = {},
}: CatalogueComparisonProps) {
  const { data: session } = useSession();
  const [shortlistIds, setShortlistIds] = useState<string[]>([]);

  useEffect(() => {
    async function loadShortlist() {
      const localIds = parseShortlist(window.localStorage.getItem(SHORTLIST_STORAGE_KEY));
      setShortlistIds(localIds);

      if (!session) return;

      const response = await fetch('/api/account/shortlist');
      if (!response.ok) return;

      const body = (await response.json()) as { programmeIds?: string[] };
      const serverIds = body.programmeIds ?? [];
      setShortlistIds(serverIds);
      window.localStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(serverIds));
    }

    void loadShortlist();
  }, [session]);

  const resolvedChoices = useMemo(() => {
    const itemsById = new Map(items.map((item) => [item.id, item]));
    return shortlistIds.map((id) => ({ id, item: itemsById.get(id) }));
  }, [items, shortlistIds]);

  function removeChoice(id: string) {
    const nextIds = toggleShortlistId(shortlistIds, id);
    setShortlistIds(nextIds);
    window.localStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(nextIds));
    window.dispatchEvent(new Event('shortlist:updated'));

    if (session) {
      void fetch('/api/account/shortlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programmeIds: nextIds }),
      });
    }
  }

  if (resolvedChoices.length === 0) {
    return (
      <section className="rounded-card border border-border bg-white p-6 text-center sm:p-8" aria-labelledby="empty-comparison-heading">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Saved choices</p>
        <h1 id="empty-comparison-heading" className="mt-2 text-2xl font-semibold text-ink-900">No saved opportunities yet</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-ink-600">Save any reviewed opportunity while browsing, then compare its published facts and official verification links here.</p>
        <Link href="/programmes" className="mt-6 inline-flex min-h-touch items-center rounded-control border border-brand-600 bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2">Browse reviewed opportunities</Link>
      </section>
    );
  }

  return (
    <section data-testid="catalogue-comparison-root" className="w-full min-w-0 max-w-full space-y-5" aria-labelledby="catalogue-comparison-heading">
      <header className="rounded-card border border-border bg-white p-5 sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Saved choices</p>
        <h1 id="catalogue-comparison-heading" className="mt-2 text-2xl font-semibold text-ink-900 sm:text-3xl">Compare reviewed opportunities</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-600">Compare each published fact and verify it with the named source. Scholar Scout does not choose an opportunity for you.</p>
        <Link href="/programmes" className="mt-5 inline-flex min-h-touch items-center rounded-control border border-brand-600 px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Browse more opportunities</Link>
      </header>

      <section aria-label="Saved opportunity comparison cards" className="grid w-full min-w-0 max-w-full gap-5 md:grid-cols-2 xl:grid-cols-3">
        {resolvedChoices.map(({ id, item }) => item ? (
          <ComparisonCard
            key={id}
            item={item}
            onRemove={removeChoice}
            qualificationExplanation={qualificationExplanations[id]}
          />
        ) : (
          <UnavailableChoice key={id} id={id} onRemove={removeChoice} />
        ))}
      </section>
    </section>
  );
}

function ComparisonCard({
  item,
  onRemove,
  qualificationExplanation,
}: {
  item: CatalogueDiscoveryItem;
  onRemove: (id: string) => void;
  qualificationExplanation?: QualificationExplanationModel;
}) {
  const pathway = item.pathway ? pathwayLabels[item.pathway] : 'Needs confirmation';
  const detailHref = buildCatalogueDetailHref(item.id, {
    metro: item.regionId,
    pathway: 'all',
    delivery: 'all',
    status: 'all',
    q: '',
    page: 1,
  });
  return (
    <article className="min-w-0 rounded-card border border-border bg-white p-5 shadow-card" aria-labelledby={`choice-${item.id}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{item.regionLabel}</p>
      <h2 id={`choice-${item.id}`} className="mt-1 break-words text-xl font-semibold text-ink-900">{item.providerTitle}</h2>
      <dl className="mt-5 space-y-4">
        <FactRow label="Pathway" fact={{ value: pathway, state: item.pathway ? 'current' : 'needs-confirmation', evidence: item.place.evidence }} />
        <FactRow label="Place" fact={item.place} />
        <FactRow label="Delivery" fact={item.delivery} />
        <FactRow label="Skill taught" fact={item.facts.skillTaught} />
        <FactRow label="Training payer" fact={item.facts.trainingPayer} />
        <FactRow label="Cost or tuition" fact={item.facts.costOrTuition} />
        <FactRow label="Duration" fact={item.facts.duration} />
      </dl>
      {qualificationExplanation ? <QualificationExplanation explanation={qualificationExplanation} officialVerificationUrl={item.officialVerificationUrl} /> : null}
      <section className="mt-5 border-t border-border pt-5" aria-label={`Factual reasons to consider for ${item.providerTitle}`}>
        <h3 className="text-sm font-semibold text-ink-900">Reasons to consider</h3>
        {item.reasonsToConsider.length === 0 ? (
          <p className="mt-2 text-sm text-ink-600">No reviewed factual reasons are currently listed.</p>
        ) : (
          <dl className="mt-3 space-y-4">
            {item.reasonsToConsider.map((reason) => <FactRow key={reason.label} label={reason.label} fact={reason} />)}
          </dl>
        )}
      </section>
      <div className="mt-5 flex flex-wrap gap-3 border-t border-border pt-5">
        <Link href={detailHref} aria-label={`Details for ${item.providerTitle}`} className="inline-flex min-h-touch items-center rounded-control border border-brand-600 px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Details and sources</Link>
        <a href={item.officialVerificationUrl} target="_blank" rel="noreferrer" aria-label={`Official verification for ${item.providerTitle} (opens a new tab)`} className="inline-flex min-h-touch items-center rounded-control border border-ink-300 px-3 text-sm font-semibold text-ink-700 hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Official verification</a>
        <button type="button" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.providerTitle}`} className="inline-flex min-h-touch items-center rounded-control border border-ink-300 px-3 text-sm font-semibold text-ink-700 hover:border-danger-600 hover:text-danger-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Remove</button>
      </div>
    </article>
  );
}

function FactRow<Value>({ label, fact }: { label: string; fact: CatalogueDiscoveryFact<Value> }) {
  const value = fact.value === null || fact.value === undefined ? 'Not available' : String(fact.value).replaceAll('-', ' ');
  const state = fact.state.replaceAll('-', ' ');
  const sourceDate = fact.evidence.sourceDate.state === 'documented' ? fact.evidence.sourceDate.value : 'Date unknown';
  return (
    <div className="min-w-0 rounded-control border border-border bg-silver p-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-600">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-ink-900">{value}</dd>
      <dd className="mt-2 text-xs text-ink-600"><span className="font-semibold">Status:</span> {state}</dd>
      <dd className="mt-1 break-words text-xs text-ink-600"><span className="font-semibold">Source:</span> {fact.evidence.sourceLabel}</dd>
      <dd className="mt-1 text-xs text-ink-600"><span className="font-semibold">Source date:</span> {sourceDate}</dd>
      <dd className="mt-1 text-xs leading-5 text-ink-700">{fact.evidence.verificationAction}</dd>
      <dd className="mt-2"><a href={fact.evidence.sourceUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Verify this fact (opens a new tab)</a></dd>
    </div>
  );
}

function UnavailableChoice({ id, onRemove }: { id: string; onRemove: (id: string) => void }) {
  return (
    <article className="min-w-0 rounded-card border border-dashed border-ink-300 bg-white p-5" role="status" aria-label={`${id} is unavailable in the current reviewed snapshot`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Saved choice unavailable</p>
      <h2 className="mt-1 break-words text-lg font-semibold text-ink-900">{id}</h2>
      <p className="mt-3 text-sm leading-6 text-ink-600">This saved choice is retired or is not in the current reviewed snapshot. Its current factual detail is unavailable, so Scholar Scout has not replaced it with another option.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/programmes" className="inline-flex min-h-touch items-center rounded-control border border-brand-600 px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Browse reviewed opportunities</Link>
        <button type="button" onClick={() => onRemove(id)} aria-label={`Remove unavailable choice ${id}`} className="inline-flex min-h-touch items-center rounded-control border border-ink-300 px-3 text-sm font-semibold text-ink-700 hover:border-danger-600 hover:text-danger-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Remove saved choice</button>
      </div>
    </article>
  );
}
