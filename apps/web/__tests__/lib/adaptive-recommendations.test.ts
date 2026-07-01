import { getAdaptiveRecommendations } from '@/lib/adaptive-recommendations';
import type { OnboardingData } from '@/lib/onboarding-types';
import { programmes } from '@/lib/programmes';

const profile: OnboardingData = {
  gpaBand: '3.0-3.4',
  interests: ['business'],
  locationPreference: 'in-state',
  pathwayPreference: '2-year-community-college',
  affordabilitySensitivity: 3,
  supportNeeds: ['financial-aid'],
};

describe('getAdaptiveRecommendations', () => {
  it('boosts saved programmes with planning status above their baseline rank', () => {
    const baseline = getAdaptiveRecommendations(programmes, {
      profile,
      shortlistIds: [],
      plans: {},
    });
    const recommendations = getAdaptiveRecommendations(programmes, {
      profile,
      shortlistIds: ['metro-cybersecurity'],
      plans: {
        'metro-cybersecurity': {
          status: 'ready-to-apply',
          note: 'Student wants a short online credential with clear job outcomes.',
        },
      },
    });
    const baselineIndex = baseline.findIndex(
      (recommendation) => recommendation.programme.id === 'metro-cybersecurity',
    );
    const boostedIndex = recommendations.findIndex(
      (recommendation) => recommendation.programme.id === 'metro-cybersecurity',
    );
    const boostedRecommendation = recommendations[boostedIndex];

    expect(boostedIndex).toBeLessThan(baselineIndex);
    expect(boostedRecommendation.adaptiveScore).toBeGreaterThan(
      boostedRecommendation.fit?.score ?? 0,
    );
    expect(boostedRecommendation.rankReason).toMatch(/plan status/i);
  });

  it('preserves baseline ordering when there are no adaptive signals', () => {
    const recommendations = getAdaptiveRecommendations(programmes, {
      profile,
      shortlistIds: [],
      plans: {},
    });

    expect(recommendations[0].programme.id).toBe(
      recommendations
        .slice()
        .sort(
          (left, right) =>
            (right.fit?.score ?? 0) - (left.fit?.score ?? 0) ||
            right.programme.matchScore - left.programme.matchScore ||
            left.programme.annualTuition - right.programme.annualTuition,
        )[0].programme.id,
    );
  });
});
