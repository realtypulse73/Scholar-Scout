import { render, screen, waitFor } from '@testing-library/react';
import RecommendationDashboard from '@/components/recommendations/RecommendationDashboard';
import { programmes, type Programme } from '@/lib/programmes';

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null }),
}));

jest.mock('@/components/opportunities/OpportunityMatchCard', () => ({
  __esModule: true,
  default: ({
    match,
  }: {
    match: {
      programme: { id: string; name: string };
      reasons: string[];
      cautions: string[];
      evidence: { state: string; verificationGuidance: string };
    };
  }) => (
    <article data-testid="opportunity-match-card" data-programme-id={match.programme.id}>
      {match.programme.name} | {match.reasons.join(' ')} | {match.evidence.state}:{' '}
      {match.evidence.verificationGuidance} | {match.cautions.join(' ')}
    </article>
  ),
}));

function profile(gpaBand: string) {
  return {
    gpaBand,
    interests: ['technology'],
    locationPreference: 'online-only',
    pathwayPreference: 'certificate-program',
    affordabilitySensitivity: 5,
    supportNeeds: ['financial-aid', 'housing'],
  };
}

function governedFixtures(): Programme[] {
  return JSON.parse(JSON.stringify(programmes.slice(0, 3))) as Programme[];
}

function snapshotDashboardCards(): string[] {
  return screen
    .getAllByTestId('opportunity-match-card')
    .map((card) => `${card.getAttribute('data-programme-id')}|${card.textContent}`);
}

describe('matching surfaces', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(
      'scholarscout.onboarding-profile',
      JSON.stringify(profile('4.0')),
    );
  });

  it('renders recommendation and pathway choices with the shared governed card', async () => {
    render(<RecommendationDashboard programmes={programmes} />);

    await waitFor(() => {
      expect(screen.getAllByTestId('opportunity-match-card').length).toBeGreaterThan(1);
    });
    expect(screen.queryByText(/housing support/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/simulation.*changing the ranking/i)).not.toBeInTheDocument();
  });

  it('keeps every governed dashboard card and verification count unchanged when legacy metadata changes', async () => {
    const baselineProgrammes = governedFixtures();
    const baselineView = render(<RecommendationDashboard programmes={baselineProgrammes} />);

    await waitFor(() => {
      expect(screen.getAllByTestId('opportunity-match-card')).toHaveLength(3);
    });

    const baselineCards = snapshotDashboardCards();
    const baselineVerificationCount = screen.getByText('Options to verify').nextElementSibling
      ?.textContent;

    baselineView.unmount();
    window.localStorage.setItem(
      'scholarscout.onboarding-profile',
      JSON.stringify(profile('below-2.0')),
    );
    const changedProgrammes = governedFixtures().map((programme, index) => ({
      ...programme,
      acceptanceRate: index === 0 ? 1 : 100,
      matchScore: index === 0 ? 1 : 100,
    }));
    render(<RecommendationDashboard programmes={changedProgrammes} />);

    await waitFor(() => {
      expect(screen.getAllByTestId('opportunity-match-card')).toHaveLength(3);
    });

    expect(snapshotDashboardCards()).toEqual(baselineCards);
    expect(screen.getByText('Options to verify').nextElementSibling?.textContent).toBe(
      baselineVerificationCount,
    );
    expect(screen.queryByText(/best pathway|confidence|priority/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/GPA|acceptance rate|match score/i)).not.toBeInTheDocument();
  });
});
