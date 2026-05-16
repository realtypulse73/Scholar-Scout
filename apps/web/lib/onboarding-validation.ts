import type { OnboardingData } from './onboarding-types';
import { TOTAL_STEPS } from './onboarding-types';

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
      if (data.interests.length === 0) {
        return 'Select at least one interest so ScholarScout can start shaping your matches.';
      }
      if (!data.pathwayPreference) {
        return 'Choose the kind of pathway you want to explore first.';
      }
      return null;

    case 2:
      if (!data.gpaBand) {
        return 'Select a GPA band. It helps us keep matches realistic, not judgmental.';
      }
      if (!data.locationPreference) {
        return 'Choose a location preference so we can tune the match list.';
      }
      return null;

    case 3:
      // Cost sensitivity always has a value and support needs are optional.
      return null;

    case 4:
      return validateAllRequired(data);

    default:
      return null;
  }
}

function validateAllRequired(data: OnboardingData): ValidationError | null {
  if (data.interests.length === 0) {
    return 'Add at least one interest before finishing.';
  }

  if (!data.pathwayPreference) {
    return 'Choose a pathway preference before finishing.';
  }

  if (!data.gpaBand) {
    return 'Select a GPA band before finishing.';
  }

  if (!data.locationPreference) {
    return 'Choose a location preference before finishing.';
  }

  return null;
}

/**
 * Validates the complete onboarding form.
 * Returns an array of step numbers that have errors.
 */
export function validateAll(data: OnboardingData): number[] {
  const errorSteps: number[] = [];
  for (let step = 1; step <= TOTAL_STEPS; step++) {
    if (validateStep(step, data) !== null) {
      errorSteps.push(step);
    }
  }
  return errorSteps;
}
