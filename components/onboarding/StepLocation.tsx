'use client';

import {
  LOCATION_LABELS,
  type LocationPreference,
} from '@/lib/onboarding-types';

interface Props {
  value: LocationPreference | null;
  onChange: (value: LocationPreference) => void;
  error?: string | null;
}

const LOCATIONS = Object.keys(LOCATION_LABELS) as LocationPreference[];

export default function StepLocation({ value, onChange, error }: Props) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">
        Where would you like to study?
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        This helps us filter schools by geography.
      </p>

      <div
        role="radiogroup"
        aria-label="Location preference"
        className="flex flex-col gap-3"
      >
        {LOCATIONS.map((loc) => (
          <label
            key={loc}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors ${
              value === loc
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-400'
            }`}
          >
            <input
              type="radio"
              name="location"
              value={loc}
              checked={value === loc}
              onChange={() => onChange(loc)}
              className="sr-only"
            />
            <span
              className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                value === loc ? 'border-blue-600' : 'border-gray-400'
              }`}
            >
              {value === loc && (
                <span className="w-2 h-2 rounded-full bg-blue-600" />
              )}
            </span>
            <span
              className={`text-sm font-medium ${value === loc ? 'text-blue-700' : 'text-gray-700'}`}
            >
              {LOCATION_LABELS[loc]}
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
