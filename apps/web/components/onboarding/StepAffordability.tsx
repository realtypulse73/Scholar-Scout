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
      <h2 className="text-xl font-bold text-gray-900 mb-1">
        How important is cost to you?
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        We&apos;ll prioritise schools that match your budget sensitivity.
      </p>

      <div className="flex flex-col gap-6">
        <div className="flex justify-between text-xs text-gray-500">
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
          className="w-full h-2 rounded-full appearance-none bg-gray-200 accent-blue-600 cursor-pointer"
        />

        <div className="flex justify-between">
          {([1, 2, 3, 4, 5] as AffordabilitySensitivity[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className={`w-9 h-9 rounded-full text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                value === v
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-blue-100'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-center">
          <p className="text-sm font-semibold text-blue-800">
            {AFFORDABILITY_LABELS[value]}
          </p>
        </div>
      </div>
    </div>
  );
}
