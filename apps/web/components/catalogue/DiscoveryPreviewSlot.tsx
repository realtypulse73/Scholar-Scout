'use client';

import { useEffect, useRef, useState } from 'react';
import type { CatalogueRenderableMedia } from '@/lib/catalogue-publication';

interface DiscoveryPreviewSlotProps {
  media?: CatalogueRenderableMedia;
}

/** Renders only the immutable local presentation projection from a reviewed snapshot. */
export default function DiscoveryPreviewSlot({ media }: DiscoveryPreviewSlotProps) {
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function closeAbout(): void {
    setIsAboutOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }

  useEffect(() => {
    if (!isAboutOpen) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAbout();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isAboutOpen]);

  if (!media) return (
    <section aria-label="Media preview" className="min-w-0 rounded-card border border-dashed border-brand-300 bg-brand-50 p-5">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Media preview</p>
      <h2 className="mt-2 text-xl font-semibold text-ink-900">Visual media needs rights review</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-700">
        This factual opportunity page does not display provider or learner media yet. A future
        preview can appear here only after documented rights, accessibility, attribution, and
        fallback review are complete.
      </p>
    </section>
  );

  const reviewedMonthYear = new Intl.DateTimeFormat('en', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${media.reviewedAt}T00:00:00.000Z`));
  const rightsBasis = media.rightsBasis.replaceAll('-', ' ');

  return (
    <section aria-label="Media preview" className="min-w-0 rounded-card border border-brand-300 bg-brand-50 p-5">
      {media.kind === 'local-preview' ? (
        <video aria-label={media.alt} className="w-full rounded-control bg-ink-900" controls muted playsInline preload="metadata">
          <source src={media.assetPath} />
        </video>
      ) : <img src={media.assetPath} alt={media.alt} className="w-full rounded-control object-cover" />}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="text-sm font-semibold text-ink-900">{media.label}</p>
        <button ref={triggerRef} type="button" onClick={() => setIsAboutOpen(true)} className="text-sm font-semibold text-brand-700 underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">About this media</button>
      </div>
      <p className="mt-2 text-sm leading-6 text-ink-700">Scholar Scout is not affiliated with or endorsed by the provider. Facts and sources below remain the record to verify.</p>
      {isAboutOpen ? (
        <div role="dialog" aria-modal="true" aria-label="About this media" className="mt-4 rounded-control border border-ink-300 bg-white p-4 shadow-sm">
          <p className="font-semibold text-ink-900">About this media</p>
          <dl className="mt-3 space-y-2 text-sm text-ink-700">
            <div><dt className="inline font-semibold">Source: </dt><dd className="inline"><a href={media.sourceUrl} target="_blank" rel="noreferrer" className="text-brand-700 underline underline-offset-4">{media.sourceLabel} (opens a new tab)</a></dd></div>
            <div><dt className="inline font-semibold">Permission basis: </dt><dd className="inline">{rightsBasis}</dd></div>
            <div><dt className="inline font-semibold">Reviewed: </dt><dd className="inline">{reviewedMonthYear}</dd></div>
            {media.attribution ? <div><dt className="inline font-semibold">Attribution: </dt><dd className="inline">{media.attribution}</dd></div> : null}
          </dl>
          <button type="button" onClick={closeAbout} className="mt-4 min-h-touch rounded-control border border-ink-300 px-3 text-sm font-semibold text-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Close</button>
        </div>
      ) : null}
    </section>
  );
}
