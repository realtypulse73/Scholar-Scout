import { validateAll, validateStep } from '@/lib/onboarding-validation';
import type { OnboardingData } from '@/lib/onboarding-types';
import { INITIAL_ONBOARDING_DATA } from '@/lib/onboarding-types';

const FULL_DATA: OnboardingData = {
  gpaBand: '3.0-3.4',
  interests: ['stem', 'technology'],
  locationPreference: 'in-state',
  pathwayPreference: '4-year-university',
  affordabilitySensitivity: 3,
  supportNeeds: ['financial-aid'],
};

describe('validateStep', () => {
  it('requires interests and pathway on step 1', () => {
    expect(validateStep(1, INITIAL_ONBOARDING_DATA)).toMatch(/interest/i);
    expect(
      validateStep(1, {
        ...INITIAL_ONBOARDING_DATA,
        interests: ['stem'],
      }),
    ).toMatch(/pathway/i);
    expect(
      validateStep(1, {
        ...INITIAL_ONBOARDING_DATA,
        interests: ['stem'],
        pathwayPreference: '4-year-university',
      }),
    ).toBeNull();
  });

  it('requires GPA and location on step 2', () => {
    expect(validateStep(2, INITIAL_ONBOARDING_DATA)).toMatch(/gpa/i);
    expect(
      validateStep(2, {
        ...INITIAL_ONBOARDING_DATA,
        gpaBand: '3.0-3.4',
      }),
    ).toMatch(/location/i);
    expect(
      validateStep(2, {
        ...INITIAL_ONBOARDING_DATA,
        gpaBand: '3.0-3.4',
        locationPreference: 'in-state',
      }),
    ).toBeNull();
  });

  it('treats affordability and support as valid on step 3', () => {
    expect(validateStep(3, INITIAL_ONBOARDING_DATA)).toBeNull();
  });

  it('requires all required fields on final review step', () => {
    expect(validateStep(4, INITIAL_ONBOARDING_DATA)).not.toBeNull();
    expect(validateStep(4, FULL_DATA)).toBeNull();
  });

  it('returns null for unknown steps', () => {
    expect(validateStep(0, INITIAL_ONBOARDING_DATA)).toBeNull();
    expect(validateStep(99, INITIAL_ONBOARDING_DATA)).toBeNull();
  });
});

describe('validateAll', () => {
  it('returns steps 1, 2, and 4 as errors for empty data', () => {
    expect(validateAll(INITIAL_ONBOARDING_DATA)).toEqual([1, 2, 4]);
  });

  it('returns empty array when all required fields are filled', () => {
    expect(validateAll(FULL_DATA)).toEqual([]);
  });
});
