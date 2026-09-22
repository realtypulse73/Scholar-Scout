'use client';

import { INTEREST_LABELS, type Interest } from '@/lib/onboarding-types';

interface Props {
  value: Interest[];
  onChange: (value: Interest[]) => void;
  error?: string | null;
}

const INTERESTS = Object.keys(INTEREST_LABELS) as Interest[];

export default function StepInterests({ value, onChange, error }: Props) {
  const toggle = (interest: Interest) => {
    if (value.includes(interest)) {
      onChange(value.filter((i) => i !== interest));
    } else {
      onChange([...value, interest]);
    }
  };

  return (
    <div>
      <h2 className="mb-1 text-xl font-semibold text-ink-900">
        What are your interests?
      </h2>
      <p className="mb-6 text-sm text-ink-600">
        Select all that apply — this helps us personalise your matches.
      </p>

      <div
        role="group"
        aria-label="Areas of interest"
        className="flex flex-wrap gap-2"
      >
        {INTERESTS.map((interest) => {
          const selected = value.includes(interest);
          return (
            <button
              key={interest}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(interest)}
              className={`min-h-touch rounded-control border-2 px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                selected
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-border bg-white text-ink-700 hover:border-brand-400'
              }`}
            >
              {INTEREST_LABELS[interest]}
            </button>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger-700">
          {error}
        </p>
      )}
    </div>
  );
}
