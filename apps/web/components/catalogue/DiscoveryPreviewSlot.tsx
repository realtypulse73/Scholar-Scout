'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { CatalogueRenderableMedia } from '@/lib/catalogue-publication';

interface DiscoveryPreviewSlotProps {
  media?: CatalogueRenderableMedia;
  playback?: {
    shouldPlay: boolean;
    reducedMotion: boolean;
    onToggle: () => void;
  };
}

/** Renders only the immutable local presentation projection from a reviewed snapshot. */
export default function DiscoveryPreviewSlot({ media, playback }: DiscoveryPreviewSlotProps) {
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [playbackRejected, setPlaybackRejected] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isPlaybackControlled = playback !== undefined;
  const shouldPlay = playback?.shouldPlay ?? false;
  const reducedMotion = playback?.reducedMotion ?? false;

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

  useEffect(() => {
    if (media?.kind !== 'local-preview' || !isPlaybackControlled || !videoRef.current) return;
    const video = videoRef.current;
    setPlaybackRejected(false);
    if (!shouldPlay || reducedMotion) {
      video.pause();
      return;
    }
    let active = true;
    Promise.resolve(video.play()).catch(() => {
      if (active) setPlaybackRejected(true);
    });
    return () => {
      active = false;
      video.pause();
    };
  }, [isPlaybackControlled, media?.kind, reducedMotion, shouldPlay]);

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

  const localPreview = media.kind === 'local-preview' ? media : null;
  const reviewedMonthYear = localPreview ? new Intl.DateTimeFormat('en', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${localPreview.reviewedAt}T00:00:00.000Z`)) : null;
  const rightsBasis = localPreview?.rightsBasis.replaceAll('-', ' ');

  return (
    <section aria-label="Media preview" className="min-w-0 rounded-card border border-brand-300 bg-brand-50 p-5">
      {media.kind === 'local-preview' ? (
        <video ref={videoRef} aria-label={media.alt} className="w-full rounded-control bg-ink-900" controls={!playback} loop muted playsInline preload="metadata">
          <source src={media.assetPath} />
        </video>
      ) : <Image src={media.assetPath} alt={media.alt} width={960} height={540} className="w-full rounded-control object-cover" />}
      {media.kind === 'local-preview' && playback ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={playback.reducedMotion}
            onClick={playback.onToggle}
            className="inline-flex min-h-touch items-center rounded-control border border-brand-600 px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:border-ink-300 disabled:text-ink-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            {playback.shouldPlay ? 'Pause preview' : 'Play preview'}
          </button>
          <p role="status" aria-live="polite" className="text-sm text-ink-700">
            {playback.reducedMotion
              ? 'Motion is paused because your device prefers reduced motion.'
              : playback.shouldPlay ? 'Preview is playing muted.' : 'Preview is paused.'}
          </p>
        </div>
      ) : null}
      {playbackRejected ? <p className="mt-3 text-sm text-ink-700">Preview could not start automatically. Facts and source actions remain available.</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="text-sm font-semibold text-ink-900">{media.label}</p>
        {localPreview ? <button ref={triggerRef} type="button" onClick={() => setIsAboutOpen(true)} className="text-sm font-semibold text-brand-700 underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">About this media</button> : null}
      </div>
      <p className="mt-2 text-sm leading-6 text-ink-700">Scholar Scout is not affiliated with or endorsed by the provider. Facts and sources below remain the record to verify.</p>
      {isAboutOpen && localPreview && reviewedMonthYear && rightsBasis ? (
        <div role="dialog" aria-modal="true" aria-label="About this media" className="mt-4 rounded-control border border-ink-300 bg-white p-4 shadow-sm">
          <p className="font-semibold text-ink-900">About this media</p>
          <dl className="mt-3 space-y-2 text-sm text-ink-700">
            <div><dt className="inline font-semibold">Source: </dt><dd className="inline"><a href={localPreview.sourceUrl} target="_blank" rel="noreferrer" className="text-brand-700 underline underline-offset-4">{localPreview.sourceLabel} (opens a new tab)</a></dd></div>
            <div><dt className="inline font-semibold">Permission basis: </dt><dd className="inline">{rightsBasis}</dd></div>
            <div><dt className="inline font-semibold">Reviewed: </dt><dd className="inline">{reviewedMonthYear}</dd></div>
            {localPreview.attribution ? <div><dt className="inline font-semibold">Attribution: </dt><dd className="inline">{localPreview.attribution}</dd></div> : null}
          </dl>
          <button type="button" onClick={closeAbout} className="mt-4 min-h-touch rounded-control border border-ink-300 px-3 text-sm font-semibold text-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Close</button>
        </div>
      ) : null}
    </section>
  );
}
