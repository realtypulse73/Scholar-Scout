'use client';

import { GPA_BAND_LABELS, type GpaBand } from '@/lib/onboarding-types';

interface Props {
  value: GpaBand | null;
  onChange: (value: GpaBand) => void;
  error?: string | null;
}

const GPA_BANDS = Object.keys(GPA_BAND_LABELS) as GpaBand[];

export default function StepGpa({ value, onChange, error }: Props) {
  return (
    <div>
      <h2 className="mb-1 text-xl font-semibold text-ink-900">
        What&apos;s your current GPA?
      </h2>
      <p className="mb-6 text-sm text-ink-600">
        We use this to surface realistic matches — all paths are valid here.
      </p>

      <div
        role="radiogroup"
        aria-label="GPA band"
        className="grid grid-cols-2 gap-3"
      >
        {GPA_BANDS.map((band) => (
          <button
            key={band}
            role="radio"
            aria-checked={value === band}
            type="button"
            onClick={() => onChange(band)}
            className={`min-h-touch rounded-control border-2 px-4 py-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
              value === band
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-border bg-white text-ink-700 hover:border-brand-400'
            }`}
          >
            {GPA_BAND_LABELS[band]}
          </button>
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
