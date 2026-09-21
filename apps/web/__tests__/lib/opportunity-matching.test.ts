import { rankOpportunityMatches } from '@/lib/opportunity-matching';
import type { OnboardingData } from '@/lib/onboarding-types';
import type { Programme } from '@/lib/programmes';

const profile: OnboardingData = {
  gpaBand: '3.0-3.4',
  interests: ['technology'],
  locationPreference: 'online-only',
  pathwayPreference: 'certificate-program',
  affordabilitySensitivity: 5,
  supportNeeds: ['financial-aid'],
};

function programme(id: string, documentedSupport: boolean): Programme {
  return {
    id,
    name: id,
    school: 'Example School',
    city: 'Online',
    state: 'US',
    delivery: 'Online',
    pathway: 'certificate-program',
    interests: ['technology'],
    support: ['financial-aid'],
    annualTuition: 3200,
    acceptanceRate: 20,
    matchScore: 99,
    duration: '1 year',
    overview: 'Example overview',
    credential: 'Certificate',
    highlights: ['Hands-on learning'],
    nextSteps: ['Compare costs'],
    programmeEvidence: {
      materialFacts: {
        tuition: {
          state: documentedSupport ? 'documented' : 'stale',
          sourceLabel: 'Example catalogue',
          sourceUrl: 'https://example.test/catalogue',
          lastVerifiedAt: '2026-09-01',
          verificationGuidance: 'Confirm the current tuition with the programme.',
        },
      },
      supportBundle: [
        {
          support: 'financial-aid',
          evidence: {
            state: documentedSupport ? 'documented' : 'unknown',
            sourceLabel: 'Student support office',
            sourceUrl: 'https://example.test/support',
            lastVerifiedAt: '2026-09-01',
            verificationGuidance: 'Ask the programme whether this support is currently available.',
          },
        },
      ],
    },
  };
}

describe('rankOpportunityMatches', () => {
  it('keeps undocumented ordinary support visible but below documented support', () => {
    const documented = programme('documented', true);
    const undocumented = programme('undocumented', false);

    const matches = rankOpportunityMatches([undocumented, documented], profile);

    expect(matches.map((match) => match.programme.id)).toEqual([
      'documented',
      'undocumented',
    ]);
    expect(matches[0].reasons).toHaveLength(4);
    expect(matches[0].reasons.join(' ')).toMatch(/technology|certificate|online|financial aid/i);
    expect(matches[1].cautions.join(' ')).toMatch(/not documented|verify/i);
    expect(matches[1].evidence.state).toBe('stale');
  });

  it('does not use GPA, access, referral-only values, fixture metadata, or matchScore', () => {
    const first = programme('a', true);
    const second = programme('b', true);
    second.matchScore = 1;
    second.acceptanceRate = 100;
    second.support = ['financial-aid', 'housing'];

    const firstResult = rankOpportunityMatches([first, second], profile);
    const changedProfile: OnboardingData = {
      ...profile,
      gpaBand: '3.5-4.0',
      supportNeeds: ['financial-aid', 'housing'],
    };
    const secondResult = rankOpportunityMatches([first, second], changedProfile);

    expect(secondResult).toEqual(firstResult);
  });
});
