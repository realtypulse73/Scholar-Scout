'use client';

import {
  AFFORDABILITY_LABELS,
  type AffordabilitySensitivity,
} from '@/lib/onboarding-types';

interface Props {
  value: AffordabilitySensitivity;
  onChange: (value: AffordabilitySensitivity) => void;
}

export default function StepAffordability({ value, onChange }: Props) {
  return (
    <div>
      <h2 className="mb-1 text-xl font-semibold text-ink-900">
        How important is cost to you?
      </h2>
      <p className="mb-6 text-sm text-ink-600">
        We&apos;ll prioritise schools that match your budget sensitivity.
      </p>

      <div className="flex flex-col gap-6">
        <div className="flex justify-between text-xs text-ink-600">
          <span>Cost is #1 priority</span>
          <span>Cost is no barrier</span>
        </div>

        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={value}
          aria-label="Affordability sensitivity"
          aria-valuemin={1}
          aria-valuemax={5}
          aria-valuenow={value}
          aria-valuetext={AFFORDABILITY_LABELS[value]}
          onChange={(e) =>
            onChange(Number(e.target.value) as AffordabilitySensitivity)
          }
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-silver accent-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        />

        <div className="flex justify-between">
          {([1, 2, 3, 4, 5] as AffordabilitySensitivity[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className={`min-h-touch min-w-touch rounded-control text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                value === v
                  ? 'bg-brand-600 text-white'
                  : 'bg-silver text-ink-700 hover:bg-brand-50'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="rounded-card border border-brand-200 bg-brand-50 px-4 py-3 text-center">
          <p className="text-sm font-semibold text-ink-800">
            {AFFORDABILITY_LABELS[value]}
          </p>
        </div>
      </div>
    </div>
  );
}
