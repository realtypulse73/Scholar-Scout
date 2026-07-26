import type { OnboardingData } from '@/lib/onboarding-types';
import { buildProfileMatchBullets } from '@/lib/recommendation-explanations';
import { getProgrammeById } from '@/lib/programmes';

const BASE_PROFILE: OnboardingData = {
  gpaBand: '3.0-3.4',
  interests: ['healthcare', 'stem'],
  locationPreference: 'in-state',
  pathwayPreference: '2-year-community-college',
  affordabilitySensitivity: 3,
  supportNeeds: ['financial-aid', 'tutoring'],
};

describe('buildProfileMatchBullets', () => {
  describe('interest bullets', () => {
    it('names one matched interest', () => {
      const prog = getProgrammeById('north-valley-health')!; // interests: healthcare, stem
      const bullets = buildProfileMatchBullets(
        { ...BASE_PROFILE, interests: ['healthcare'] },
        prog,
      );

      expect(bullets[0]).toContain('healthcare');
      expect(bullets[0]).toContain('You picked');
    });

    it('names both interests when two match', () => {
      const prog = getProgrammeById('north-valley-health')!;
      const bullets = buildProfileMatchBullets(BASE_PROFILE, prog);

      expect(bullets[0]).toMatch(/STEM|healthcare/);
      expect(bullets[0]).toContain('both');
    });

    it('does not emit an interest bullet when none match', () => {
      const prog = getProgrammeById('harbor-welding')!; // interests: trades
      const bullets = buildProfileMatchBullets(
        { ...BASE_PROFILE, interests: ['healthcare'] },
        prog,
      );

      expect(bullets.join(' ')).not.toContain('You picked');
    });
  });

  describe('pathway bullets', () => {
    it('calls out a matching pathway', () => {
      const prog = getProgrammeById('north-valley-health')!; // pathway: 2-year-community-college
      const bullets = buildProfileMatchBullets(BASE_PROFILE, prog);

      expect(bullets.join(' ')).toContain('2-year community college');
    });

    it('does not emit a pathway bullet for undecided preference', () => {
      const prog = getProgrammeById('north-valley-health')!;
      const bullets = buildProfileMatchBullets(
        { ...BASE_PROFILE, pathwayPreference: 'undecided' },
        prog,
      );

      expect(bullets.join(' ')).not.toContain('Fits the');
    });

    it('does not emit a pathway bullet when pathways differ', () => {
      const prog = getProgrammeById('evergreen-environmental')!; // 4-year
      const bullets = buildProfileMatchBullets(BASE_PROFILE, prog); // wants 2-year

      expect(bullets.join(' ')).not.toContain('Fits the');
    });
  });

  describe('support bullets', () => {
    it('names one matched support need', () => {
      const prog = getProgrammeById('north-valley-health')!; // support: tutoring, career-counseling, financial-aid
      const bullets = buildProfileMatchBullets(
        { ...BASE_PROFILE, supportNeeds: ['tutoring'] },
        prog,
      );

      expect(bullets.join(' ')).toContain('tutoring');
      expect(bullets.join(' ')).toContain('you said you need');
    });

    it('names two matched support needs', () => {
      const prog = getProgrammeById('north-valley-health')!;
      const bullets = buildProfileMatchBullets(BASE_PROFILE, prog); // financial-aid + tutoring

      const supportBullet = bullets.find((b) => b.includes('you said you need'));
      expect(supportBullet).toBeDefined();
      expect(supportBullet).toContain('financial aid');
      expect(supportBullet).toContain('tutoring');
    });

    it('skips support bullet when none of the student needs are offered', () => {
      const prog = getProgrammeById('metro-cybersecurity')!; // support: career-counseling, financial-aid
      const bullets = buildProfileMatchBullets(
        { ...BASE_PROFILE, supportNeeds: ['childcare', 'housing'] },
        prog,
      );

      expect(bullets.join(' ')).not.toContain('you said you need');
    });

    it('ignores "none" support entries', () => {
      const prog = getProgrammeById('metro-cybersecurity')!;
      const bullets = buildProfileMatchBullets(
        { ...BASE_PROFILE, supportNeeds: ['none'] },
        prog,
      );

      expect(bullets.join(' ')).not.toContain('you said you need');
    });
  });

  describe('cost and aid bullets', () => {
    it('notes affordability for cost-sensitive students on low-tuition programmes', () => {
      const prog = getProgrammeById('summit-teacher-apprentice')!; // $2,600
      const bullets = buildProfileMatchBullets(
        { ...BASE_PROFILE, affordabilitySensitivity: 1 },
        prog,
      );

      expect(bullets.join(' ')).toContain('affordable');
    });

    it('notes Pell Grant eligibility when financial aid is a stated need', () => {
      // metro-cybersecurity has pell-grant + student needs financial-aid
      const prog = getProgrammeById('metro-cybersecurity')!;
      const bullets = buildProfileMatchBullets(
        { ...BASE_PROFILE, supportNeeds: ['financial-aid'], affordabilitySensitivity: 4 },
        prog,
      );

      expect(bullets.join(' ')).toContain('Pell Grant');
    });

    it('does not show Pell Grant bullet when financial-aid is not in support needs', () => {
      const prog = getProgrammeById('metro-cybersecurity')!;
      const bullets = buildProfileMatchBullets(
        { ...BASE_PROFILE, supportNeeds: ['tutoring'], affordabilitySensitivity: 4 },
        prog,
      );

      expect(bullets.join(' ')).not.toContain('Pell Grant');
    });
  });

  describe('output constraints', () => {
    it('never returns more than 3 bullets', () => {
      const prog = getProgrammeById('north-valley-health')!;
      const bullets = buildProfileMatchBullets(BASE_PROFILE, prog);

      expect(bullets.length).toBeLessThanOrEqual(3);
    });

    it('returns an empty array when no profile answers match the programme', () => {
      const prog = getProgrammeById('harbor-welding')!; // trades, no support match
      const bullets = buildProfileMatchBullets(
        {
          gpaBand: '3.0-3.4',
          interests: ['social-sciences'],
          locationPreference: 'no-preference',
          pathwayPreference: 'undecided',
          affordabilitySensitivity: 5,
          supportNeeds: ['none'],
        },
        prog,
      );

      expect(bullets).toHaveLength(0);
    });
  });
});
