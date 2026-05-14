'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface SharePanelProps {
  targetType: 'programme' | 'creator' | 'feed';
  targetId: string;
}

export default function SharePanel({ targetType, targetId }: SharePanelProps) {
  const [deepLink, setDeepLink] = useState('');

  async function share() {
    const response = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userKey: 'local-student',
        targetType,
        targetId,
      }),
    });
    const body = (await response.json()) as { deepLink: string };
    setDeepLink(body.deepLink);
  }

  return (
    <Card className="p-5">
      <h2 className="text-base font-bold text-ink-900">Share card</h2>
      <div className="mt-3 rounded-card border border-ink-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase text-ink-500">
          ScholarScout path
        </p>
        <p className="mt-2 text-lg font-extrabold text-ink-900">{targetId}</p>
      </div>
      <Button variant="secondary" className="mt-4 w-full" onClick={() => void share()}>
        Create share link
      </Button>
      {deepLink ? (
        <p className="mt-3 break-all text-xs text-ink-500">{deepLink}</p>
      ) : null}
    </Card>
  );
}
