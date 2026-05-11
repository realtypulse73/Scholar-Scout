import type { OnboardingData } from '@/lib/onboarding-types';

export function getProgrammeFiltersFromOnboarding(data: OnboardingData) {
  const params = new URLSearchParams();

  if (data.pathwayPreference && data.pathwayPreference !== 'undecided') {
    params.set('pathway', data.pathwayPreference);
  }

  if (data.locationPreference && data.locationPreference !== 'no-preference') {
    params.set('location', data.locationPreference);
  }

  const maxTuition = getMaxTuitionFromAffordability(
    data.affordabilitySensitivity,
  );

  if (maxTuition) {
    params.set('maxTuition', String(maxTuition));
  }

  const query = params.toString();
  return query ? `/programmes?${query}` : '/programmes';
}

function getMaxTuitionFromAffordability(sensitivity: OnboardingData['affordabilitySensitivity']) {
  if (sensitivity <= 2) {
    return 5000;
  }

  if (sensitivity === 3) {
    return 8000;
  }

  return null;
}
