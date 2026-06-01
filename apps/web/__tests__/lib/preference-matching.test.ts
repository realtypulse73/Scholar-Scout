import type { OnboardingData } from '@/lib/onboarding-types';
import {
  explainProgrammeFit,
  isNonTraditionalStudent,
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

const STUDENT_READY_PROFILE: OnboardingData = {
  gpaBand: '2.0-2.4',
  interests: ['education', 'social-sciences'],
  locationPreference: 'local',
  pathwayPreference: 'apprenticeship',
  affordabilitySensitivity: 1,
  supportNeeds: ['first-gen', 'childcare', 'financial-aid'],
};

// 3 concurrent needs, none of which metro-cybersecurity offers.
const MISSING_SUPPORT_PROFILE: OnboardingData = {
  ...STUDENT_READY_PROFILE,
  supportNeeds: ['childcare', 'language-support', 'housing'],
};

const IEP_PROFILE: OnboardingData = {
  ...STUDENT_READY_PROFILE,
  interests: ['healthcare', 'stem'],
  pathwayPreference: '2-year-community-college',
  supportNeeds: ['iep-support', 'disability-services', 'tutoring'],
};

// Student with intense support needs but a standard academic record —
// should still see 4-year programmes where support fully aligns.
const LRE_PROFILE: OnboardingData = {
  gpaBand: '3.0-3.4',
  interests: ['environment'],
  locationPreference: 'no-preference',
  pathwayPreference: 'undecided',
  affordabilitySensitivity: 3,
  supportNeeds: ['disability-services', 'mental-health'],
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

  it('prioritizes student-ready fit for current-status needs', () => {
    const ranked = rankProgrammesForProfile(programmes, STUDENT_READY_PROFILE);
    const fit = explainProgrammeFit(
      getProgrammeById('summit-teacher-apprentice')!,
      STUDENT_READY_PROFILE,
    );

    expect(ranked[0].id).toBe('summit-teacher-apprentice');
    expect(fit.signals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'student-ready',
          label: 'Student-ready fit',
        }),
      ]),
    );
    expect(fit.reasons.join(' ')).toContain('Meets you where you are');
  });

  it('adds clearer support checks when key needs are missing', () => {
    const fit = explainProgrammeFit(
      getProgrammeById('metro-cybersecurity')!,
      MISSING_SUPPORT_PROFILE,
    );

    expect(fit.cautions.join(' ')).toContain('Support services');
    expect(fit.signals.some((signal) => signal.category === 'student-ready')).toBe(
      true,
    );
  });

  it('rewards schools with IEP and special needs expertise', () => {
    const fit = explainProgrammeFit(getProgrammeById('north-valley-health')!, IEP_PROFILE);

    expect(fit.reasons.join(' ')).toContain('IEP / Special Education Support');
    expect(fit.signals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'support',
          label: 'Strong support fit',
        }),
      ]),
    );
  });

  it('falls back to baseline match order without a profile', () => {
    const ranked = rankProgrammesForProfile(programmes, null);

    expect(ranked[0].matchScore).toBeGreaterThan(ranked[1].matchScore);
  });
});

describe('isNonTraditionalStudent', () => {
  it('flags students with intense support needs', () => {
    expect(
      isNonTraditionalStudent({ ...PROFILE, supportNeeds: ['disability-services'] }),
    ).toBe(true);
    expect(
      isNonTraditionalStudent({ ...PROFILE, supportNeeds: ['mental-health'] }),
    ).toBe(true);
    expect(
      isNonTraditionalStudent({ ...PROFILE, supportNeeds: ['childcare'] }),
    ).toBe(true);
    expect(
      isNonTraditionalStudent({ ...PROFILE, supportNeeds: ['language-support'] }),
    ).toBe(true);
    expect(
      isNonTraditionalStudent({ ...PROFILE, supportNeeds: ['housing'] }),
    ).toBe(true);
  });

  it('flags students with 3 or more concurrent support needs', () => {
    expect(isNonTraditionalStudent(STUDENT_READY_PROFILE)).toBe(true);
  });

  it('flags students with a non-standard academic record', () => {
    expect(
      isNonTraditionalStudent({ ...PROFILE, gpaBand: 'below-2.0' }),
    ).toBe(true);
    expect(
      isNonTraditionalStudent({ ...PROFILE, gpaBand: '2.0-2.4' }),
    ).toBe(true);
    expect(
      isNonTraditionalStudent({ ...PROFILE, gpaBand: 'no-gpa' }),
    ).toBe(true);
  });

  it('does not flag standard students', () => {
    expect(isNonTraditionalStudent(PROFILE)).toBe(false);
  });
});

describe('LRE — Least Restrictive Environment placement', () => {
  it('surfaces a 4-year programme with full support match for a non-traditional student', () => {
    const programme = getProgrammeById('evergreen-environmental');

    expect(programme).toBeDefined();
    const fit = explainProgrammeFit(programme!, LRE_PROFILE);

    // A 4-year programme that fully covers intensive support needs should earn
    // the top student-ready label — pathway type alone must not bury it.
    expect(fit.signals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'student-ready',
          label: 'Student-ready fit',
        }),
      ]),
    );
    expect(fit.reasons.join(' ')).toContain('Meets you where you are');
  });

  it('reduces access penalty for non-traditional students when support aligns', () => {
    // summit-teacher-apprentice has 86% acceptance (not open-access) but
    // matches first-gen + childcare for STUDENT_READY_PROFILE.
    const fit = explainProgrammeFit(
      getProgrammeById('summit-teacher-apprentice')!,
      STUDENT_READY_PROFILE,
    );
    const accessSignal = fit.signals.find((s) => s.category === 'access');

    expect(accessSignal).toBeDefined();
    // With support services aligned, access penalty should be softened vs -14.
    expect(accessSignal!.points).toBeGreaterThan(-14);
  });

  it('gives a higher support score for students with multiple concurrent needs when fully matched', () => {
    // STUDENT_READY_PROFILE has 3 concurrent needs; summit covers 2 of them.
    const fit = explainProgrammeFit(
      getProgrammeById('summit-teacher-apprentice')!,
      STUDENT_READY_PROFILE,
    );
    const supportSignal = fit.signals.find((s) => s.category === 'support');

    expect(supportSignal).toBeDefined();
    // Full match for a high-need student should score above the standard +20.
    expect(supportSignal!.points).toBeGreaterThanOrEqual(26);
  });

  it('does not apply LRE stretch to flexible-path programmes', () => {
    // summit-teacher-apprentice is an apprenticeship (flexible path) —
    // the stretch bonus applies only to 4-year programmes.
    const fit = explainProgrammeFit(
      getProgrammeById('summit-teacher-apprentice')!,
      STUDENT_READY_PROFILE,
    );
    const studentReadySignal = fit.signals.find(
      (s) => s.category === 'student-ready',
    );

    expect(studentReadySignal).toBeDefined();
    // Message should not reference 'support-ready at this level'
    expect(studentReadySignal!.message).not.toContain('support-ready at this level');
  });
});
