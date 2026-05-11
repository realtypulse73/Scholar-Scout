import {
  validateStep,
  validateAll,
} from '@/lib/onboarding-validation';
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
  describe('step 1 – GPA band', () => {
    it('returns an error when gpaBand is null', () => {
      expect(validateStep(1, INITIAL_ONBOARDING_DATA)).not.toBeNull();
    });

    it('returns null when a gpaBand is selected', () => {
      expect(validateStep(1, { ...INITIAL_ONBOARDING_DATA, gpaBand: '3.0-3.4' })).toBeNull();
    });

    it('accepts all valid GPA bands', () => {
      const bands = ['below-2.0', '2.0-2.4', '2.5-2.9', '3.0-3.4', '3.5-4.0', 'no-gpa'] as const;
      bands.forEach((band) => {
        expect(validateStep(1, { ...INITIAL_ONBOARDING_DATA, gpaBand: band })).toBeNull();
      });
    });
  });

  describe('step 2 – interests', () => {
    it('returns an error when no interests are selected', () => {
      expect(validateStep(2, INITIAL_ONBOARDING_DATA)).not.toBeNull();
    });

    it('returns null when at least one interest is selected', () => {
      expect(
        validateStep(2, { ...INITIAL_ONBOARDING_DATA, interests: ['stem'] }),
      ).toBeNull();
    });

    it('returns null when multiple interests are selected', () => {
      expect(
        validateStep(2, {
          ...INITIAL_ONBOARDING_DATA,
          interests: ['stem', 'arts', 'business'],
        }),
      ).toBeNull();
    });
  });

  describe('step 3 – location preference', () => {
    it('returns an error when locationPreference is null', () => {
      expect(validateStep(3, INITIAL_ONBOARDING_DATA)).not.toBeNull();
    });

    it('returns null when a location is selected', () => {
      expect(
        validateStep(3, {
          ...INITIAL_ONBOARDING_DATA,
          locationPreference: 'in-state',
        }),
      ).toBeNull();
    });
  });

  describe('step 4 – pathway preference', () => {
    it('returns an error when pathwayPreference is null', () => {
      expect(validateStep(4, INITIAL_ONBOARDING_DATA)).not.toBeNull();
    });

    it('returns null when a pathway is selected', () => {
      expect(
        validateStep(4, {
          ...INITIAL_ONBOARDING_DATA,
          pathwayPreference: '4-year-university',
        }),
      ).toBeNull();
    });
  });

  describe('step 5 – affordability (always valid)', () => {
    it('returns null for default value', () => {
      expect(validateStep(5, INITIAL_ONBOARDING_DATA)).toBeNull();
    });

    it('returns null for any slider value', () => {
      ([1, 2, 3, 4, 5] as const).forEach((v) => {
        expect(
          validateStep(5, {
            ...INITIAL_ONBOARDING_DATA,
            affordabilitySensitivity: v,
          }),
        ).toBeNull();
      });
    });
  });

  describe('step 6 – support needs (optional)', () => {
    it('returns null when no support needs are selected', () => {
      expect(validateStep(6, INITIAL_ONBOARDING_DATA)).toBeNull();
    });

    it('returns null when support needs are selected', () => {
      expect(
        validateStep(6, {
          ...INITIAL_ONBOARDING_DATA,
          supportNeeds: ['financial-aid', 'tutoring'],
        }),
      ).toBeNull();
    });
  });

  describe('unknown steps', () => {
    it('returns null for step 0', () => {
      expect(validateStep(0, INITIAL_ONBOARDING_DATA)).toBeNull();
    });

    it('returns null for step 99', () => {
      expect(validateStep(99, INITIAL_ONBOARDING_DATA)).toBeNull();
    });
  });
});

describe('validateAll', () => {
  it('returns steps 1, 2, 3, 4 as errors for empty data', () => {
    const errorSteps = validateAll(INITIAL_ONBOARDING_DATA);
    expect(errorSteps).toEqual([1, 2, 3, 4]);
  });

  it('returns empty array when all required fields are filled', () => {
    expect(validateAll(FULL_DATA)).toEqual([]);
  });

  it('returns only the steps with errors', () => {
    const partial: OnboardingData = {
      ...FULL_DATA,
      gpaBand: null,
      interests: [],
    };
    const errorSteps = validateAll(partial);
    expect(errorSteps).toContain(1);
    expect(errorSteps).toContain(2);
    expect(errorSteps).not.toContain(3);
    expect(errorSteps).not.toContain(4);
  });
});
