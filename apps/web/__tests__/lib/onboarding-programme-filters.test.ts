import { getProgrammeFiltersFromOnboarding } from '@/lib/onboarding-programme-filters';
import type { OnboardingData } from '@/lib/onboarding-types';

const DATA: OnboardingData = {
  gpaBand: '3.0-3.4',
  interests: ['stem'],
  locationPreference: 'online-only',
  pathwayPreference: 'certificate-program',
  affordabilitySensitivity: 2,
  supportNeeds: ['financial-aid'],
};

describe('onboarding programme filters', () => {
  it('maps onboarding preferences to programme URL filters', () => {
    expect(getProgrammeFiltersFromOnboarding(DATA)).toBe(
      '/programmes?pathway=certificate-program&location=online-only&maxTuition=5000',
    );
  });

  it('omits undecided and no-preference filters', () => {
    expect(
      getProgrammeFiltersFromOnboarding({
        ...DATA,
        pathwayPreference: 'undecided',
        locationPreference: 'no-preference',
        affordabilitySensitivity: 5,
      }),
    ).toBe('/programmes');
  });
});
