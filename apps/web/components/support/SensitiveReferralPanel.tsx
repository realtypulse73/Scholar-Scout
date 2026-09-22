'use client';

import { useState } from 'react';
import {
  REFERRAL_ONLY_SUPPORT_CATEGORIES,
  SUPPORT_NEED_LABELS,
  type ReferralOnlySupportCategory,
} from '@/lib/onboarding-types';
import { getSensitiveReferralFixture } from '@/lib/sensitive-referral-directory';

export default function SensitiveReferralPanel() {
  const [category, setCategory] = useState<ReferralOnlySupportCategory | ''>('');
  const [hasConsented, setHasConsented] = useState(false);
  const [hasDeclined, setHasDeclined] = useState(false);
  const fixture = category ? getSensitiveReferralFixture(category) : null;

  function selectCategory(value: string) {
    if (
      (REFERRAL_ONLY_SUPPORT_CATEGORIES as readonly string[]).includes(value)
    ) {
      setCategory(value as ReferralOnlySupportCategory);
      setHasConsented(false);
      setHasDeclined(false);
    }
  }

  function declineConsent() {
    setCategory('');
    setHasConsented(false);
    setHasDeclined(true);
  }

  return (
    <section
      aria-labelledby="sensitive-referral-heading"
      className="rounded-card border border-border bg-silver p-5"
    >
      <h2 id="sensitive-referral-heading" className="text-lg font-semibold text-ink-900">
        Find test-only support information
      </h2>
      <p className="mt-2 text-sm text-ink-700">
        This optional step is only for showing a temporary test link. Your answer is
        kept in this panel while it is open; it does not change your matches, profile,
        saved information, or what is sent to anyone else.
      </p>

      <label className="mt-4 block text-sm font-semibold text-ink-900" htmlFor="referral-support-area">
        Support area
      </label>
      <select
        id="referral-support-area"
        className="mt-1 min-h-touch w-full rounded-card border border-border bg-white px-3 py-2 text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        value={category}
        onChange={(event) => selectCategory(event.target.value)}
      >
        <option value="">Choose a support area</option>
        {REFERRAL_ONLY_SUPPORT_CATEGORIES.map((option) => (
          <option key={option} value={option}>
            {SUPPORT_NEED_LABELS[option]}
          </option>
        ))}
      </select>

      <button
        type="button"
        disabled={!fixture}
        onClick={() => {
          setHasConsented(true);
          setHasDeclined(false);
        }}
        className="mt-4 min-h-touch rounded-card bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-ink-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        Show test-only contact information
      </button>
      <button
        type="button"
        disabled={!fixture}
        onClick={declineConsent}
        className="ml-3 mt-4 min-h-touch rounded-card border border-ink-400 bg-white px-4 py-2 text-sm font-semibold text-ink-700 disabled:cursor-not-allowed disabled:text-ink-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        Decline and keep this local
      </button>

      {hasDeclined ? (
        <p className="mt-4 text-sm text-ink-700" role="status">
          No support information was opened.
        </p>
      ) : null}

      {hasConsented && fixture ? (
        <div className="mt-4 rounded-card border border-warning-600 bg-warning-50 p-4 text-sm text-ink-800">
          <p>
            You chose to view a temporary test-only link for this support area. This
            does not claim current provider availability.
          </p>
          <a
            className="mt-2 inline-block font-semibold text-brand-700 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            href={fixture.url}
            rel="noreferrer"
            target="_blank"
          >
            {fixture.label}
          </a>
        </div>
      ) : null}
    </section>
  );
}
