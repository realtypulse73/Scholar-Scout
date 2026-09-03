import { render, screen, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import AuthSessionProvider from '@/components/auth/AuthSessionProvider';

jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSession: jest.fn(),
}));

describe('AuthSessionProvider', () => {
  const useSessionMock = jest.mocked(useSession);
  const fetchMock = jest.fn();

  beforeEach(() => {
    useSessionMock.mockReset();
    fetchMock.mockReset();
    global.fetch = fetchMock as typeof fetch;
  });

  it('migrates a newly authenticated session once before rendering dependent children', async () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: 'oauth-account' } },
      status: 'authenticated',
    } as never);
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true, migrated: true }) });

    const { rerender } = render(
      <AuthSessionProvider>
        <p>Protected profile</p>
      </AuthSessionProvider>,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/account/guest-migration', {
        method: 'POST',
      });
    });
    expect(screen.getByText('Protected profile')).toBeInTheDocument();

    rerender(
      <AuthSessionProvider>
        <p>Protected profile</p>
      </AuthSessionProvider>,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('surfaces a recoverable error when migration fails', async () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: 'oauth-account' } },
      status: 'authenticated',
    } as never);
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: 'Unavailable' }) });

    render(
      <AuthSessionProvider>
        <p>Protected profile</p>
      </AuthSessionProvider>,
    );

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent('We could not transfer your guest activity. Please try again.');
  });
});
