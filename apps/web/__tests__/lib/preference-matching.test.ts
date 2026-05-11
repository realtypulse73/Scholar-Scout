import type { OnboardingData } from '@/lib/onboarding-types';
import {
  explainProgrammeFit,
  parseOnboardingProfile,
  rankProgrammesForProfile,
  serializeOnboardingProfile,
} from '@/lib/preference-matching';
import { getProgrammeById, programmes } from '@/lib/programmes';

const PROFILE: OnboardingData = {
  gpaBand: '3.0-3.4',
  interests: ['healthcare', 'stem'],
  locationPreference: 'in-state',
  pathwayPreference: '2-year-community-college',
  affordabilitySensitivity: 2,
  supportNeeds: ['financial-aid', 'tutoring'],
};

describe('preference matching helpers', () => {
  it('serializes and parses onboarding profiles', () => {
    expect(parseOnboardingProfile(serializeOnboardingProfile(PROFILE))).toEqual(
      PROFILE,
    );
  });

  it('returns null for invalid stored profile values', () => {
    expect(parseOnboardingProfile('{bad')).toBeNull();
    expect(parseOnboardingProfile('{"interests":[]}')).toBeNull();
  });

  it('explains strong programme fit with reasons', () => {
    const programme = getProgrammeById('north-valley-health');

    expect(programme).toBeDefined();
    const fit = explainProgrammeFit(programme!, PROFILE);

    expect(fit.score).toBeGreaterThanOrEqual(80);
    expect(fit.reasons.join(' ')).toContain('Healthcare');
    expect(fit.reasons.join(' ')).toContain('Financial Aid');
  });

  it('adds cautions when preferences do not align', () => {
    const programme = getProgrammeById('openwest-it-degree');

    expect(programme).toBeDefined();
    const fit = explainProgrammeFit(programme!, PROFILE);

    expect(fit.cautions.length).toBeGreaterThan(0);
  });

  it('ranks programmes by personalized fit when a profile exists', () => {
    const ranked = rankProgrammesForProfile(programmes, PROFILE);

    expect(ranked[0].id).toBe('north-valley-health');
  });

  it('falls back to baseline match order without a profile', () => {
    const ranked = rankProgrammesForProfile(programmes, null);

    expect(ranked[0].matchScore).toBeGreaterThan(ranked[1].matchScore);
  });
});
