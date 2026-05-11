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
      <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-green-600"
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

      <h2 className="text-2xl font-bold text-gray-900 mb-1">
        You&apos;re all set! 🎉
      </h2>
      <p className="text-sm text-gray-500 mb-8">
        Here&apos;s a summary of your preferences. We&apos;ll use these to find
        your best-fit schools.
      </p>

      <dl className="text-left space-y-3 mb-8">
        {rows.map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col sm:flex-row sm:justify-between bg-gray-50 rounded-xl px-4 py-3 gap-1"
          >
            <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {label}
            </dt>
            <dd className="text-sm font-medium text-gray-800 sm:text-right sm:max-w-[60%]">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-3">
        <Link
          href={matchesHref}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
        >
          Find My Matches
        </Link>
        <button
          type="button"
          onClick={onStartOver}
          className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:border-blue-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}
