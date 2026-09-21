import { render, screen } from '@testing-library/react';
import OpportunityMatchCard from '@/components/opportunities/OpportunityMatchCard';
import { rankOpportunityMatches } from '@/lib/opportunity-matching';
import type { OnboardingData } from '@/lib/onboarding-types';
import type { Programme } from '@/lib/programmes';

const programme: Programme = {
  id: 'example-programme',
  name: 'Example programme',
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
        state: 'documented',
        sourceLabel: 'Example catalogue',
        sourceUrl: 'https://example.test/catalogue',
        lastVerifiedAt: '2026-09-01',
        verificationGuidance: 'Confirm the current tuition with the programme.',
      },
    },
    supportBundle: [{ support: 'financial-aid', evidence: { state: 'documented' } }],
  },
};

const profile: OnboardingData = {
  gpaBand: '3.0-3.4',
  interests: ['technology'],
  locationPreference: 'online-only',
  pathwayPreference: 'certificate-program',
  affordabilitySensitivity: 5,
  supportNeeds: ['financial-aid'],
};

describe('OpportunityMatchCard', () => {
  it('renders governed evidence, verification guidance, and choice actions without an application action', () => {
    const match = rankOpportunityMatches([programme], profile)[0];
    render(<OpportunityMatchCard match={match} />);

    expect(screen.getByText('Why this matches your stated preferences')).toBeInTheDocument();
    expect(screen.getByText(/Example catalogue/i)).toBeInTheDocument();
    expect(screen.getByText(/Confirm the current tuition/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /compare/i })).toHaveAttribute('href', '/shortlist');
    expect(screen.getByRole('link', { name: /visit source/i })).toHaveAttribute('href', 'https://example.test/catalogue');
    expect(screen.getByRole('link', { name: /alternate pathway/i })).toHaveAttribute('href', '/programmes?pathway=2-year-community-college');
    expect(screen.queryByRole('link', { name: /apply/i })).not.toBeInTheDocument();
  });
});
