import { render, screen, waitFor } from '@testing-library/react';
import ProgrammeFitPanel from '@/components/programmes/ProgrammeFitPanel';
import { programmes } from '@/lib/programmes';

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null }),
}));

describe('ProgrammeFitPanel', () => {
  beforeEach(() => {
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

  it('uses the governed shared-card explanation without a predictive fit score', async () => {
    render(<ProgrammeFitPanel programme={programmes[1]} />);

    await waitFor(() => {
      expect(
        screen.getByText('Why this matches your stated preferences'),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/Verify this information directly/i)).toBeInTheDocument();
    expect(screen.queryByText(/personal fit/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/housing support/i)).not.toBeInTheDocument();
  });
});
