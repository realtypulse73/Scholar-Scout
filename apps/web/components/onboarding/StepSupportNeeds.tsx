'use client';

import {
  ORDINARY_SUPPORT_CATEGORIES,
  SUPPORT_NEED_LABELS,
  type OrdinarySupportCategory,
} from '@/lib/onboarding-types';

type OrdinarySupportSelection = OrdinarySupportCategory | 'none';

interface Props {
  value: OrdinarySupportSelection[];
  onChange: (value: OrdinarySupportSelection[]) => void;
}

const SUPPORT_NEEDS: readonly OrdinarySupportSelection[] = [
  ...ORDINARY_SUPPORT_CATEGORIES,
  'none',
];

export default function StepSupportNeeds({ value, onChange }: Props) {
  const toggle = (need: OrdinarySupportSelection) => {
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
      <h2 className="mb-1 text-xl font-semibold text-ink-900">
        Do you have any specific support needs?
      </h2>
      <p className="mb-6 text-sm text-ink-600">
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
              className={`flex min-h-touch items-center gap-3 rounded-control border-2 px-4 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                selected
                  ? 'border-brand-600 bg-brand-50 text-brand-800'
                  : 'border-border bg-white text-ink-700 hover:border-brand-400'
              }`}
            >
              <span
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${
                  selected ? 'border-brand-600 bg-brand-600' : 'border-ink-500'
                }`}
              >
                {selected && (
                  <svg
                    className="h-3 w-3 text-white"
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
              <span className="text-sm font-semibold">
                {SUPPORT_NEED_LABELS[need]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
