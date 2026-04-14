'use client';

import { TOTAL_STEPS } from '@/lib/onboarding-types';

interface Props {
  currentStep: number; // 1-indexed
}

const STEP_LABELS = [
  'GPA',
  'Interests',
  'Location',
  'Pathway',
  'Affordability',
  'Support',
];

export default function ProgressIndicator({ currentStep }: Props) {
  return (
    <div className="w-full" aria-label={`Step ${currentStep} of ${TOTAL_STEPS}`}>
      {/* Step dots */}
      <div className="flex items-center justify-between mb-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => {
          const step = i + 1;
          const isComplete = step < currentStep;
          const isCurrent = step === currentStep;
          return (
            <div key={step} className="flex flex-col items-center gap-1 flex-1">
              <div
                aria-hidden="true"
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isComplete
                    ? 'bg-blue-600 text-white'
                    : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isComplete ? (
                  <svg
                    className="w-4 h-4"
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
              <span
                className={`hidden sm:block text-[10px] font-medium ${
                  isCurrent ? 'text-blue-600' : isComplete ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                {STEP_LABELS[i]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          aria-hidden="true"
          className="h-full bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
        />
      </div>

      <p className="sr-only">
        Step {currentStep} of {TOTAL_STEPS}: {STEP_LABELS[currentStep - 1]}
      </p>
    </div>
  );
}
