'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import type { Path } from '@/lib/platform';

interface PathCardProps {
  path: Path;
  active: boolean;
  position: number;
  total: number;
  onNext: () => void;
  onPrevious: () => void;
}

const userKey = 'local-student';

export default function PathCard({
  path,
  active,
  position,
  total,
  onNext,
  onPrevious,
}: PathCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (active) {
      void video.play().catch(() => undefined);
      return;
    }

    video.pause();
  }, [active]);

  useEffect(() => {
    if (!active) {
      return;
    }

    const startedAt = Date.now();
    void logFeedEvent(path.id, 'view', 0);

    return () => {
      const watchSeconds = Math.max(
        1,
        Math.round((Date.now() - startedAt) / 1000),
      );
      void logFeedEvent(path.id, 'watch', watchSeconds);
    };
  }, [active, path.id]);

  async function skipPath() {
    await logFeedEvent(path.id, 'skip', 0);
    onNext();
  }

  return (
    <article className="relative h-screen overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full bg-ink-950 object-cover"
        src={path.videoUrl}
        autoPlay={active}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={`${path.title} video`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/25" />

      <div className="relative z-10 flex h-full flex-col justify-end px-5 py-6 sm:px-8 lg:px-12">
        <div className="max-w-2xl pb-16 sm:pb-10">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase text-white/75">
            <span>
              {position} / {total}
            </span>
            <span>{path.pathway}</span>
            <span>{path.durationSeconds}s</span>
          </div>

          <h1 className="mt-4 max-w-xl text-4xl font-extrabold leading-tight text-white sm:text-6xl">
            {path.title}
          </h1>
          <Link
            href={`/u/${path.creatorUsername}`}
            className="mt-3 inline-block text-sm font-bold text-brand-100 hover:text-white"
          >
            @{path.creatorUsername}
          </Link>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/85">
            {path.transcript}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {path.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-white/15 px-2 py-1 text-xs font-semibold text-white backdrop-blur"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/programmes/${path.programmeId}`}
              className="inline-flex min-h-touch items-center justify-center rounded-card border border-brand-500 bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
            >
              View programme
            </Link>
            <Button
              variant="secondary"
              className="border-white/30 bg-white/10 text-white hover:border-white hover:text-white"
              onClick={() => void skipPath()}
            >
              Skip
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute right-4 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-3">
        <Button
          variant="secondary"
          className="h-11 w-11 rounded-full border-white/30 bg-white/10 p-0 text-xl text-white hover:border-white hover:text-white"
          onClick={onPrevious}
          aria-label="Previous path"
          disabled={position === 1}
        >
          ^
        </Button>
        <Button
          variant="secondary"
          className="h-11 w-11 rounded-full border-white/30 bg-white/10 p-0 text-xl text-white hover:border-white hover:text-white"
          onClick={onNext}
          aria-label="Next path"
          disabled={position === total}
        >
          v
        </Button>
      </div>
    </article>
  );
}

async function logFeedEvent(
  feedItemId: string,
  eventType: 'view' | 'watch' | 'skip',
  watchSeconds: number,
) {
  await fetch('/api/feed-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userKey,
      feedItemId,
      eventType,
      watchSeconds,
      skipped: eventType === 'skip',
    }),
  }).catch(() => undefined);
}
