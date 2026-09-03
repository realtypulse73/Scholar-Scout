import { render, screen } from '@testing-library/react';
import RecommendationDashboard from '@/components/recommendations/RecommendationDashboard';
import type { OnboardingData } from '@/lib/onboarding-types';
import type { Programme } from '@/lib/programmes';

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null }),
}));

const profile: OnboardingData = {
  gpaBand: '3.0-3.4',
  interests: ['technology'],
  locationPreference: 'in-state',
  pathwayPreference: 'online-degree',
  affordabilitySensitivity: 3,
  supportNeeds: ['career-counseling'],
};

const programme: Programme = {
  id: 'generated-technology',
  name: 'Generated Technology Pathway',
  school: 'Scholar Scout Fixture Institute',
  city: 'Fixture City',
  state: 'CA',
  delivery: 'Online',
  pathway: 'certificate-program',
  interests: ['technology'],
  support: ['career-counseling'],
  annualTuition: 2400,
  acceptanceRate: 100,
  matchScore: 90,
  duration: '9 months',
  credential: 'Generated certificate',
  overview: 'Generated non-personal programme fixture.',
  highlights: ['Generated support'],
  nextSteps: ['Confirm fixture details'],
};

describe('RecommendationDashboard', () => {
  beforeEach(() => {
    window.localStorage.clear();
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const body = url.endsWith('/api/account/onboarding')
        ? { profile }
        : { programmeIds: [programme.id], plans: {} };

      return {
        ok: true,
        json: async () => body,
      } as Response;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads the opaque guest recommendation context from account APIs', async () => {
    render(<RecommendationDashboard programmes={[programme]} />);

    expect(
      await screen.findByRole('heading', { name: 'Your best next move' }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('heading', { name: programme.name }).length,
    ).toBeGreaterThan(0);
    expect(global.fetch).toHaveBeenCalledWith('/api/account/onboarding');
    expect(global.fetch).toHaveBeenCalledWith('/api/account/shortlist');
  });
});
