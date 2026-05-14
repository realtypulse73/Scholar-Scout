'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface ReferralPanelProps {
  referrer: string;
}

export default function ReferralPanel({ referrer }: ReferralPanelProps) {
  const [link, setLink] = useState('');

  async function createReferral() {
    const response = await fetch('/api/referrals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referrer }),
    });
    const body = (await response.json()) as { link: string };
    setLink(body.link);
  }

  return (
    <Card className="p-5">
      <h2 className="text-base font-bold text-ink-900">Referral link</h2>
      <p className="mt-2 text-sm leading-6 text-ink-600">
        Track creator-driven conversions without exposing secrets.
      </p>
      <Button className="mt-4 w-full" onClick={() => void createReferral()}>
        Generate referral
      </Button>
      {link ? (
        <p className="mt-3 break-all rounded-card border border-ink-200 bg-ink-50 p-3 text-xs text-ink-600">
          {link}
        </p>
      ) : null}
    </Card>
  );
}
