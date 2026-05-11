import type { OnboardingData } from './onboarding-types';

export type ValidationError = string;

/**
 * Returns a validation error message for the given step, or null if valid.
 * Steps are 1-indexed.
 */
export function validateStep(
  step: number,
  data: OnboardingData,
): ValidationError | null {
  switch (step) {
    case 1:
      if (!data.gpaBand) {
        return 'Please select your GPA band to continue.';
      }
      return null;

    case 2:
      if (data.interests.length === 0) {
        return 'Please select at least one area of interest.';
      }
      return null;

    case 3:
      if (!data.locationPreference) {
        return 'Please select a location preference to continue.';
      }
      return null;

    case 4:
      if (!data.pathwayPreference) {
        return 'Please select a pathway preference to continue.';
      }
      return null;

    case 5:
      // Affordability slider always has a value (default 3); no error possible.
      return null;

    case 6:
      // Support needs are optional (student may select none).
      return null;

    default:
      return null;
  }
}

/**
 * Validates the complete onboarding form.
 * Returns an array of step numbers that have errors.
 */
export function validateAll(data: OnboardingData): number[] {
  const errorSteps: number[] = [];
  for (let step = 1; step <= 6; step++) {
    if (validateStep(step, data) !== null) {
      errorSteps.push(step);
    }
  }
  return errorSteps;
}
