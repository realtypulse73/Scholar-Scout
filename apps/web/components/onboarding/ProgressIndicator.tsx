'use client';

import { TOTAL_STEPS } from '@/lib/onboarding-types';

interface Props {
  currentStep: number; // 1-indexed
}

const STEP_LABELS = [
  'Interests',
  'Fit basics',
  'Support',
  'Preview',
];

export default function ProgressIndicator({ currentStep }: Props) {
  return (
    <div className="w-full" aria-label={`Step ${currentStep} of ${TOTAL_STEPS}`}>
      {/* Step dots */}
      <div className="flex items-center justify-between mb-2">
        {Array.from({ length: TOTAL_STEPS }, (_, index) => {
          const step = index + 1;
          const isComplete = step < currentStep;
          const isCurrent = step === currentStep;
          return (
            <div key={step} className="flex flex-col items-center gap-1 flex-1">
              <div
                aria-hidden="true"
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isComplete
                    ? 'bg-ink-700 text-white'
                    : isCurrent
                      ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                      : 'bg-silver text-ink-500'
                }`}
              >
                {isComplete ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 8l3.5 3.5L13 4"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  step
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 overflow-hidden rounded-full bg-silver">
        <div
          aria-hidden="true"
          className="h-full rounded-full bg-brand-600 transition-all duration-300"
          style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      <p className="sr-only">
        Step {currentStep} of {TOTAL_STEPS}: {STEP_LABELS[currentStep - 1]}
      </p>
    </div>
  );
}
