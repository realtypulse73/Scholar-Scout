import { render, screen, waitFor } from '@testing-library/react';
import RecommendationDashboard from '@/components/recommendations/RecommendationDashboard';
import { programmes } from '@/lib/programmes';

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null }),
}));

jest.mock('@/components/opportunities/OpportunityMatchCard', () => ({
  __esModule: true,
  default: ({ match }: { match: { programme: { name: string } } }) => (
    <article data-testid="opportunity-match-card">{match.programme.name}</article>
  ),
}));

describe('matching surfaces', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(
      'scholarscout.onboarding-profile',
      JSON.stringify({
        gpaBand: '4.0',
        interests: ['technology'],
        locationPreference: 'online-only',
        pathwayPreference: 'certificate-program',
        affordabilitySensitivity: 5,
        supportNeeds: ['financial-aid', 'housing'],
      }),
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
});
