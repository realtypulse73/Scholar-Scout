import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecommendationDashboard from '@/components/recommendations/RecommendationDashboard';
import { programmes } from '@/lib/programmes';

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null }),
}));

describe('RecommendationDashboard', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(
      'scholarscout.onboarding-profile',
      JSON.stringify({
        gpaBand: '3.5-4.0',
        interests: ['technology'],
        locationPreference: 'online-only',
        pathwayPreference: 'certificate-program',
        affordabilitySensitivity: 3,
        supportNeeds: ['financial-aid'],
      }),
    );
  });

  it('opens and declines the confidential-support path without changing profile, ranking, browser, network, or navigation state', async () => {
    const user = userEvent.setup();
    const originalFetch = globalThis.fetch;
    const fetchMock = jest.fn();
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fetchMock,
    });
    const storageSpy = jest.spyOn(Storage.prototype, 'setItem');
    const historySpy = jest.spyOn(window.history, 'pushState');
    const initialProfile = window.localStorage.getItem(
      'scholarscout.onboarding-profile',
    );

    render(<RecommendationDashboard programmes={programmes} />);

    const entryPoint = await screen.findByRole('button', {
      name: /need confidential support/i,
    });
    entryPoint.focus();
    await user.keyboard('{Enter}');

    expect(
      screen.getByRole('heading', { name: /find test-only support information/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/does not change your matches, profile, saved information/i),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/support area/i), {
      target: { value: 'housing' },
    });
    await user.click(screen.getByRole('button', { name: /decline/i }));

    expect(screen.queryByRole('link', { name: /test-only/i })).not.toBeInTheDocument();
    expect(window.localStorage.getItem('scholarscout.onboarding-profile')).toBe(
      initialProfile,
    );
    expect(storageSpy).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(historySpy).not.toHaveBeenCalled();

    if (originalFetch) {
      Object.defineProperty(globalThis, 'fetch', {
        configurable: true,
        value: originalFetch,
      });
    } else {
      delete (globalThis as { fetch?: typeof globalThis.fetch }).fetch;
    }
    storageSpy.mockRestore();
    historySpy.mockRestore();
  });
});
