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
      <h2 className="text-xl font-bold text-gray-900 mb-1">
        What are your interests?
      </h2>
      <p className="text-sm text-gray-500 mb-6">
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
              className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                selected
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-400'
              }`}
            >
              {INTEREST_LABELS[interest]}
            </button>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
