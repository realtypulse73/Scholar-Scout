'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { SHORTLIST_STORAGE_KEY, parseShortlist } from '@/lib/shortlist';

export default function ShortlistCountLink() {
  const { data: session } = useSession();
  const [count, setCount] = useState(0);

  useEffect(() => {
    function syncCount() {
      setCount(parseShortlist(window.localStorage.getItem(SHORTLIST_STORAGE_KEY)).length);
    }

    async function syncServerCount() {
      if (!session) {
        syncCount();
        return;
      }

      const response = await fetch('/api/account/shortlist');
      if (response.ok) {
        const body = (await response.json()) as { programmeIds?: string[] };
        const serverIds = body.programmeIds ?? [];
        window.localStorage.setItem(
          SHORTLIST_STORAGE_KEY,
          JSON.stringify(serverIds),
        );
        setCount(serverIds.length);
      } else {
        syncCount();
      }
    }

    void syncServerCount();
    window.addEventListener('storage', syncCount);
    window.addEventListener('shortlist:updated', syncCount);

    return () => {
      window.removeEventListener('storage', syncCount);
      window.removeEventListener('shortlist:updated', syncCount);
    };
  }, [session]);

  return (
    <Link
      href="/shortlist"
      className="text-sm font-semibold text-ink-600 hover:text-brand-700"
    >
      Shortlist{count > 0 ? ` (${count})` : ''}
    </Link>
  );
}
