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
      <h2 className="mb-1 text-xl font-semibold text-ink-900">
        What kind of programme interests you?
      </h2>
      <p className="mb-6 text-sm text-ink-600">
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
            className={`flex min-h-touch items-center gap-3 rounded-control border-2 px-4 py-3 text-sm font-semibold cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-brand-500 ${
              value === pathway
                ? 'border-brand-600 bg-brand-50 text-brand-800'
                : 'border-border bg-white text-ink-700 hover:border-brand-400'
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
              className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                value === pathway ? 'border-brand-600' : 'border-ink-500'
              }`}
            >
              {value === pathway && (
                <span className="h-2 w-2 rounded-full bg-brand-600" />
              )}
            </span>
            <span
              className={`text-sm font-semibold ${value === pathway ? 'text-brand-800' : 'text-ink-700'}`}
            >
              {PATHWAY_LABELS[pathway]}
            </span>
          </label>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger-700">
          {error}
        </p>
      )}
    </div>
  );
}
