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
      className="rounded-xl border border-slate-200 bg-slate-50 p-5"
    >
      <h2 id="sensitive-referral-heading" className="text-lg font-semibold text-slate-900">
        Find test-only support information
      </h2>
      <p className="mt-2 text-sm text-slate-700">
        This optional step is only for showing a temporary test link. Your answer is
        kept in this panel while it is open; it does not change your matches, profile,
        saved information, or what is sent to anyone else.
      </p>

      <label className="mt-4 block text-sm font-medium text-slate-900" htmlFor="referral-support-area">
        Support area
      </label>
      <select
        id="referral-support-area"
        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
        className="mt-4 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        Show test-only contact information
      </button>
      <button
        type="button"
        disabled={!fixture}
        onClick={declineConsent}
        className="ml-3 mt-4 rounded-md border border-slate-400 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        Decline and keep this local
      </button>

      {hasDeclined ? (
        <p className="mt-4 text-sm text-slate-700" role="status">
          No support information was opened.
        </p>
      ) : null}

      {hasConsented && fixture ? (
        <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-slate-800">
          <p>
            You chose to view a temporary test-only link for this support area. This
            does not claim current provider availability.
          </p>
          <a
            className="mt-2 inline-block font-semibold text-blue-800 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
