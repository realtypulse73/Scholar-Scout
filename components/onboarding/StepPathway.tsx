'use client';

import {
  PATHWAY_LABELS,
  type PathwayPreference,
} from '@/lib/onboarding-types';

interface Props {
  value: PathwayPreference | null;
  onChange: (value: PathwayPreference) => void;
  error?: string | null;
}

const PATHWAYS = Object.keys(PATHWAY_LABELS) as PathwayPreference[];

export default function StepPathway({ value, onChange, error }: Props) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">
        What kind of programme interests you?
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        No right answer — pick the path that feels right for you.
      </p>

      <div
        role="radiogroup"
        aria-label="Pathway preference"
        className="flex flex-col gap-3"
      >
        {PATHWAYS.map((pathway) => (
          <label
            key={pathway}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors ${
              value === pathway
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-400'
            }`}
          >
            <input
              type="radio"
              name="pathway"
              value={pathway}
              checked={value === pathway}
              onChange={() => onChange(pathway)}
              className="sr-only"
            />
            <span
              className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                value === pathway ? 'border-blue-600' : 'border-gray-400'
              }`}
            >
              {value === pathway && (
                <span className="w-2 h-2 rounded-full bg-blue-600" />
              )}
            </span>
            <span
              className={`text-sm font-medium ${value === pathway ? 'text-blue-700' : 'text-gray-700'}`}
            >
              {PATHWAY_LABELS[pathway]}
            </span>
          </label>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
