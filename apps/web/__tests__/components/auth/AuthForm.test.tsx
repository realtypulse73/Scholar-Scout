import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/auth/AuthForm';

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('AuthForm', () => {
  const signInMock = jest.mocked(signIn);
  const useRouterMock = jest.mocked(useRouter);
  const fetchMock = jest.fn();
  const router = {
    push: jest.fn(),
    refresh: jest.fn(),
  };

  beforeEach(() => {
    signInMock.mockReset();
    fetchMock.mockReset();
    router.push.mockReset();
    router.refresh.mockReset();
    useRouterMock.mockReturnValue(router as never);
    global.fetch = fetchMock as typeof fetch;
  });

  it('shows Apple sign-in as unavailable without initiating an unconfigured provider', async () => {
    const user = userEvent.setup();

    const { rerender } = render(<AuthForm mode="sign-in" />);
    const appleButton = screen.getByRole('button', { name: 'Continue with Apple' });

    expect(appleButton).toBeDisabled();
    expect(appleButton).toHaveAccessibleDescription('Apple sign-in is not available yet.');
    await user.click(appleButton);
    expect(signInMock).not.toHaveBeenCalled();

    rerender(<AuthForm mode="sign-up" />);
    expect(screen.queryByRole('button', { name: 'Continue with Apple' })).not.toBeInTheDocument();
  });

  it('exchanges only email and password for an opaque grant before migrating and navigating', async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ grant: 'one-use-grant' }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, migrated: false }));
    signInMock.mockResolvedValue({ ok: true, error: undefined } as never);

    render(<AuthForm mode="sign-in" />);
    await user.type(screen.getByLabelText('Student email address'), 'student@example.com');
    await user.type(screen.getByLabelText('Password'), 'secure-password');
    await user.click(screen.getByRole('button', { name: 'Sign in to your account' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/auth/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'student@example.com',
          password: 'secure-password',
        }),
      });
    });
    expect(signInMock).toHaveBeenCalledWith('credentials', {
      grant: 'one-use-grant',
      redirect: false,
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/account/guest-migration', {
      method: 'POST',
    });
    expect(router.push).toHaveBeenCalledWith('/profile');
    expect(router.refresh).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['unknown-account', 'No account was found for that email address.'],
    ['incorrect-password', 'That password is incorrect.'],
  ])('renders only the fixed 401 %s credential message', async (error, expectedMessage) => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(jsonResponse({ error }, 401));

    render(<AuthForm mode="sign-in" />);
    await user.type(screen.getByLabelText('Student email address'), 'student@example.com');
    await user.type(screen.getByLabelText('Password'), 'secure-password');
    await user.click(screen.getByRole('button', { name: 'Sign in to your account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(expectedMessage);
    expect(signInMock).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('shows fixed rate-limit reset guidance and unavailable errors without exposing server text', async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(jsonResponse({
        error: 'rate-limited',
        resetAt: '2026-07-28T12:15:00.000Z',
        detail: 'raw limiter internals',
      }, 429))
      .mockResolvedValueOnce(jsonResponse({
        error: 'credential-service-unavailable',
        detail: 'raw provider internals',
      }, 503));

    render(<AuthForm mode="sign-in" />);
    await user.type(screen.getByLabelText('Student email address'), 'student@example.com');
    await user.type(screen.getByLabelText('Password'), 'secure-password');
    await user.click(screen.getByRole('button', { name: 'Sign in to your account' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many sign-in attempts. Try again after 2026-07-28T12:15:00.000Z.',
    );
    expect(screen.queryByText('raw limiter internals')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sign in to your account' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Sign-in is temporarily unavailable. Please try again.',
    );
    expect(screen.queryByText('raw provider internals')).not.toBeInTheDocument();
  });

  it('keeps migration failure recoverable and does not navigate before it succeeds', async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ grant: 'one-use-grant' }))
      .mockResolvedValueOnce(jsonResponse({ error: 'Unavailable' }, 503));
    signInMock.mockResolvedValue({ ok: true, error: undefined } as never);

    render(<AuthForm mode="sign-in" />);
    await user.type(screen.getByLabelText('Student email address'), 'student@example.com');
    await user.type(screen.getByLabelText('Password'), 'secure-password');
    await user.click(screen.getByRole('button', { name: 'Sign in to your account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We signed you in, but could not transfer your guest activity. Please try again.',
    );
    expect(router.push).not.toHaveBeenCalled();
    expect(router.refresh).not.toHaveBeenCalled();
  });

  it('submits registration without a browser role, then uses the credential boundary', async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
      .mockResolvedValueOnce(jsonResponse({ grant: 'one-use-grant' }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, migrated: true }));
    signInMock.mockResolvedValue({ ok: true, error: undefined } as never);

    render(<AuthForm mode="sign-up" />);
    expect(screen.queryByText('Account type')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Name'), 'Student');
    await user.type(screen.getByLabelText('Student email address'), 'student@example.com');
    await user.type(screen.getByLabelText('Password'), 'secure-password');
    await user.click(screen.getByRole('button', { name: 'Create your student account' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'student@example.com',
          name: 'Student',
          password: 'secure-password',
        }),
      });
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/auth/credentials', expect.any(Object));
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain('role');
    expect(signInMock).toHaveBeenCalledWith('credentials', {
      grant: 'one-use-grant',
      redirect: false,
    });
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}
