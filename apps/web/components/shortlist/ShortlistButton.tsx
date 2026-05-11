'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  SHORTLIST_STORAGE_KEY,
  isShortlisted,
  parseShortlist,
  toggleShortlistId,
} from '@/lib/shortlist';

interface ShortlistButtonProps {
  programmeId: string;
  className?: string;
}

export default function ShortlistButton({
  programmeId,
  className,
}: ShortlistButtonProps) {
  const { data: session } = useSession();
  const [shortlistIds, setShortlistIds] = useState<string[]>([]);
  const saved = isShortlisted(shortlistIds, programmeId);

  useEffect(() => {
    async function loadShortlist() {
      const localIds = parseShortlist(
        window.localStorage.getItem(SHORTLIST_STORAGE_KEY),
      );
      setShortlistIds(localIds);

      if (session) {
        const response = await fetch('/api/account/shortlist');
        if (response.ok) {
          const body = (await response.json()) as { programmeIds?: string[] };
          const serverIds = body.programmeIds ?? [];
          setShortlistIds(serverIds);
          window.localStorage.setItem(
            SHORTLIST_STORAGE_KEY,
            JSON.stringify(serverIds),
          );
        }
      }
    }

    void loadShortlist();
  }, [session]);

  function handleToggle() {
    const nextIds = toggleShortlistId(shortlistIds, programmeId);
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

  return (
    <button
      type="button"
      aria-pressed={saved}
      onClick={handleToggle}
      className={
        className ??
        'inline-flex min-h-10 items-center rounded-card border border-ink-300 bg-white px-4 text-sm font-semibold text-ink-700 transition-colors hover:border-brand-400 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2'
      }
    >
      {saved ? 'Saved to shortlist' : 'Save to shortlist'}
    </button>
  );
}
