'use client';

import {
  SUPPORT_NEED_LABELS,
  type SupportNeed,
} from '@/lib/onboarding-types';

interface Props {
  value: SupportNeed[];
  onChange: (value: SupportNeed[]) => void;
}

const SUPPORT_NEEDS = Object.keys(SUPPORT_NEED_LABELS) as SupportNeed[];

export default function StepSupportNeeds({ value, onChange }: Props) {
  const toggle = (need: SupportNeed) => {
    if (need === 'none') {
      // Selecting "none" clears all others
      if (value.includes('none')) {
        onChange([]);
      } else {
        onChange(['none']);
      }
      return;
    }

    // Selecting anything else removes "none"
    const withoutNone = value.filter((n) => n !== 'none');
    if (withoutNone.includes(need)) {
      onChange(withoutNone.filter((n) => n !== need));
    } else {
      onChange([...withoutNone, need]);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">
        Do you have any specific support needs?
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Select all that apply — this is optional and never used to exclude you.
      </p>

      <div
        role="group"
        aria-label="Support needs"
        className="flex flex-col gap-2"
      >
        {SUPPORT_NEEDS.map((need) => {
          const selected = value.includes(need);
          return (
            <button
              key={need}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(need)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                selected
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-400'
              }`}
            >
              <span
                className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  selected ? 'border-blue-600 bg-blue-600' : 'border-gray-400'
                }`}
              >
                {selected && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 12 12"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span className="text-sm font-medium">
                {SUPPORT_NEED_LABELS[need]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
