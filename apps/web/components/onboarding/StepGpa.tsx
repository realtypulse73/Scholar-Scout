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
      <h2 className="text-xl font-bold text-gray-900 mb-1">
        What&apos;s your current GPA?
      </h2>
      <p className="text-sm text-gray-500 mb-6">
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
            className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              value === band
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-blue-400'
            }`}
          >
            {GPA_BAND_LABELS[band]}
          </button>
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
