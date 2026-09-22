'use client';

import Link from 'next/link';
import { getProgrammeFiltersFromOnboarding } from '@/lib/onboarding-programme-filters';
import {
  GPA_BAND_LABELS,
  INTEREST_LABELS,
  LOCATION_LABELS,
  PATHWAY_LABELS,
  AFFORDABILITY_LABELS,
  SUPPORT_NEED_LABELS,
  type OnboardingData,
} from '@/lib/onboarding-types';

interface Props {
  data: OnboardingData;
  onStartOver: () => void;
}

export default function OnboardingSummary({ data, onStartOver }: Props) {
  const matchesHref = getProgrammeFiltersFromOnboarding(data);
  const rows = [
    {
      label: 'GPA Band',
      value: data.gpaBand ? GPA_BAND_LABELS[data.gpaBand] : '—',
    },
    {
      label: 'Interests',
      value:
        data.interests.length > 0
          ? data.interests.map((i) => INTEREST_LABELS[i]).join(', ')
          : '—',
    },
    {
      label: 'Location Preference',
      value: data.locationPreference
        ? LOCATION_LABELS[data.locationPreference]
        : '—',
    },
    {
      label: 'Pathway Preference',
      value: data.pathwayPreference
        ? PATHWAY_LABELS[data.pathwayPreference]
        : '—',
    },
    {
      label: 'Affordability Sensitivity',
      value: AFFORDABILITY_LABELS[data.affordabilitySensitivity],
    },
    {
      label: 'Support Needs',
      value:
        data.supportNeeds.length > 0
          ? data.supportNeeds.map((n) => SUPPORT_NEED_LABELS[n]).join(', ')
          : 'None specified',
    },
  ];

  return (
    <div className="text-center">
      {/* Success icon */}
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-50">
        <svg
          className="h-8 w-8 text-success-700"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h2 className="mb-1 text-2xl font-semibold text-ink-900">
        You&apos;re all set! 🎉
      </h2>
      <p className="mb-8 text-sm text-ink-600">
        Here&apos;s a summary of your preferences. We&apos;ll use these to find
        your best-fit schools.
      </p>

      <dl className="mb-8 space-y-3 text-left">
        {rows.map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col gap-1 rounded-card border border-border bg-silver px-4 py-3 sm:flex-row sm:justify-between"
          >
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              {label}
            </dt>
            <dd className="text-sm font-medium text-ink-800 sm:max-w-[60%] sm:text-right">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-3">
        <Link
          href={matchesHref}
          className="min-h-touch w-full rounded-control bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          Find My Matches
        </Link>
        <button
          type="button"
          onClick={onStartOver}
          className="min-h-touch w-full rounded-control border-2 border-border px-4 py-3 text-sm font-semibold text-ink-700 transition-colors hover:border-brand-400 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}
