'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import type { FeedItem, Recommendation } from '@/lib/platform';

interface FeedExperienceProps {
  items: FeedItem[];
  initialRecommendations: Recommendation[];
}

const userKey = 'local-student';

export default function FeedExperience({
  items,
  initialRecommendations,
}: FeedExperienceProps) {
  const [visibleCount, setVisibleCount] = useState(Math.min(2, items.length));
  const [activeIndex, setActiveIndex] = useState(0);
  const [lastEvent, setLastEvent] = useState('');
  const watchStarts = useRef<Record<string, number>>({});
  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount],
  );

  useEffect(() => {
    const item = visibleItems[activeIndex];

    if (item) {
      watchStarts.current[item.id] = Date.now();
    }
  }, [activeIndex, visibleItems]);

  useEffect(() => {
    const onScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 240
      ) {
        setVisibleCount((count) => Math.min(items.length, count + 1));
      }
    };

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [items.length]);

  async function track(item: FeedItem, skipped: boolean) {
    const startedAt = watchStarts.current[item.id] ?? Date.now();
    const watchSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));

    await fetch('/api/feed-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userKey,
        feedItemId: item.id,
        watchSeconds,
        skipped,
      }),
    });

    setLastEvent(skipped ? 'Skip tracked' : 'Watch time saved');
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="space-y-4" aria-label="Pathway feed">
        {visibleItems.map((item, index) => (
          <article
            key={item.id}
            className="min-h-[78vh] scroll-mt-4 border-b border-ink-200 py-4"
            onMouseEnter={() => setActiveIndex(index)}
          >
            <div className="mx-auto flex max-w-xl flex-col gap-4">
              <div className="overflow-hidden rounded-card border border-ink-200 bg-ink-950">
                {item.type === 'video' ? (
                  <video
                    className="aspect-[9/16] w-full bg-ink-900 object-cover"
                    src={item.videoUrl}
                    controls
                    playsInline
                    onPlay={() => {
                      watchStarts.current[item.id] = Date.now();
                      setActiveIndex(index);
                    }}
                    onEnded={() => void track(item, false)}
                  />
                ) : (
                  <div className="flex aspect-[9/16] flex-col justify-center gap-5 bg-ink-900 p-8 text-white">
                    <p className="text-xs font-semibold uppercase text-brand-200">
                      Voice note
                    </p>
                    <h2 className="text-3xl font-extrabold">{item.title}</h2>
                    <audio
                      className="w-full"
                      src={item.videoUrl}
                      controls
                      onPlay={() => {
                        watchStarts.current[item.id] = Date.now();
                        setActiveIndex(index);
                      }}
                      onEnded={() => void track(item, false)}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-ink-900">
                    {item.title}
                  </h2>
                  <Link
                    href={`/u/${item.creatorUsername}`}
                    className="mt-1 inline-block text-sm font-semibold text-brand-700"
                  >
                    @{item.creatorUsername}
                  </Link>
                  <p className="mt-3 text-sm leading-6 text-ink-600">
                    {item.transcript}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                  </div>
                </div>
                <Button variant="secondary" onClick={() => void track(item, true)}>
                  Skip
                </Button>
              </div>
            </div>
          </article>
        ))}
        {visibleCount < items.length ? (
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setVisibleCount((count) => count + 1)}
          >
            Load more
          </Button>
        ) : null}
      </section>

      <aside className="lg:sticky lg:top-4 lg:self-start">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase text-ink-500">
            Recommendations
          </p>
          <div className="mt-4 space-y-3">
            {initialRecommendations.slice(0, 3).map((recommendation) => (
              <Link
                href={`/programmes/${recommendation.programme.id}`}
                key={recommendation.programme.id}
                className="block rounded-card border border-ink-200 p-3 hover:border-brand-400"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-bold text-ink-900">
                    {recommendation.programme.name}
                  </h3>
                  <span className="text-sm font-extrabold text-success-700">
                    {recommendation.score}%
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-ink-500">
                  {recommendation.explanation[0]}
                </p>
              </Link>
            ))}
          </div>
          {lastEvent ? (
            <p className="mt-4 text-xs font-semibold text-success-700">
              {lastEvent}
            </p>
          ) : null}
        </Card>
      </aside>
    </div>
  );
}
