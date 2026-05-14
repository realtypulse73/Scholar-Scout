'use client';

import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import PathCard from '@/components/feed/PathCard';
import type { Path } from '@/lib/platform';

interface FeedResponse {
  paths: Path[];
}

export default function FeedPage() {
  const [paths, setPaths] = useState<Path[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [status, setStatus] = useState('Loading feed...');
  const touchStartY = useRef<number | null>(null);
  const wheelLocked = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function loadFeed() {
      try {
        const response = await fetch('/api/feed', { cache: 'no-store' });

        if (!response.ok) {
          throw new Error('Feed request failed.');
        }

        const data = (await response.json()) as FeedResponse;

        if (!cancelled) {
          setPaths(data.paths);
          setStatus(data.paths.length ? '' : 'No paths are available yet.');
        }
      } catch {
        if (!cancelled) {
          setStatus('Feed is unavailable right now.');
        }
      }
    }

    void loadFeed();

    return () => {
      cancelled = true;
    };
  }, []);

  function move(direction: 1 | -1) {
    setActiveIndex((index) => {
      const nextIndex = index + direction;
      return Math.min(Math.max(nextIndex, 0), Math.max(paths.length - 1, 0));
    });
  }

  function handleWheel(event: React.WheelEvent<HTMLElement>) {
    if (Math.abs(event.deltaY) < 24 || wheelLocked.current) {
      return;
    }

    wheelLocked.current = true;
    move(event.deltaY > 0 ? 1 : -1);
    window.setTimeout(() => {
      wheelLocked.current = false;
    }, 450);
  }

  function handleTouchStart(event: React.TouchEvent<HTMLElement>) {
    touchStartY.current = event.touches[0]?.clientY ?? null;
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLElement>) {
    const startY = touchStartY.current;
    const endY = event.changedTouches[0]?.clientY;
    touchStartY.current = null;

    if (startY == null || endY == null) {
      return;
    }

    const distance = startY - endY;

    if (Math.abs(distance) >= 48) {
      move(distance > 0 ? 1 : -1);
    }
  }

  return (
    <main
      className="relative h-screen overflow-hidden bg-ink-950 text-white"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {paths.length ? (
        <section
          aria-label="ScholarScout pathway feed"
          className="h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateY(-${activeIndex * 100}vh)` }}
        >
          {paths.map((path, index) => (
            <PathCard
              key={path.id}
              path={path}
              active={index === activeIndex}
              position={index + 1}
              total={paths.length}
              onNext={() => move(1)}
              onPrevious={() => move(-1)}
            />
          ))}
        </section>
      ) : (
        <div className="flex h-full items-center justify-center px-6 text-center">
          <p className="text-sm font-semibold text-white/80">{status}</p>
        </div>
      )}
    </main>
  );
}
