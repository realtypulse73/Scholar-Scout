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
      <h2 className="mb-1 text-xl font-semibold text-ink-900">
        Where would you like to study?
      </h2>
      <p className="mb-6 text-sm text-ink-600">
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
            className={`flex min-h-touch items-center gap-3 rounded-control border-2 px-4 py-3 text-sm font-semibold cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-brand-500 ${
              value === loc
                ? 'border-brand-600 bg-brand-50 text-brand-800'
                : 'border-border bg-white text-ink-700 hover:border-brand-400'
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
              className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                value === loc ? 'border-brand-600' : 'border-ink-500'
              }`}
            >
              {value === loc && (
                <span className="h-2 w-2 rounded-full bg-brand-600" />
              )}
            </span>
            <span
              className={`text-sm font-semibold ${value === loc ? 'text-brand-800' : 'text-ink-700'}`}
            >
              {LOCATION_LABELS[loc]}
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
