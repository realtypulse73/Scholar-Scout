'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface AuthFormProps {
  mode: 'sign-in' | 'sign-up';
}

interface CredentialExchangeResponse {
  error?: string;
  grant?: string;
  resetAt?: string;
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleGoogleSignIn() {
    setError('');
    await signIn('google', { callbackUrl: '/profile' });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!email.includes('@') || password.length < 8) {
      setError('Use an email address and an 8-character password.');
      return;
    }

    if (mode === 'sign-up') {
      const registered = await registerAccount({ email, name, password });

      if (!registered) {
        setError('Unable to create account. Please review your details and try again.');
        return;
      }
    }

    const credentialResult = await exchangeCredentials({ email, password });

    if (!credentialResult.ok) {
      setError(credentialResult.message);
      return;
    }

    const result = await signIn('credentials', {
      grant: credentialResult.grant,
      redirect: false,
    });

    if (result?.error) {
      setError('Sign-in is temporarily unavailable. Please try again.');
      return;
    }

    try {
      const migrationResponse = await fetch('/api/account/guest-migration', {
        method: 'POST',
      });

      if (!migrationResponse.ok) {
        throw new Error('Guest migration failed.');
      }
    } catch {
      setError('We signed you in, but could not transfer your guest activity. Please try again.');
      return;
    }

    router.push('/profile');
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {mode === 'sign-in' ? (
        <>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="inline-flex min-h-touch w-full items-center justify-center rounded-card border border-ink-300 bg-white px-4 text-sm font-semibold text-ink-800 transition-colors hover:border-brand-500 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            Continue with Google
          </button>
          <button
            type="button"
            disabled
            aria-describedby="apple-sign-in-status"
            className="inline-flex min-h-touch w-full cursor-not-allowed items-center justify-center rounded-card border border-ink-200 bg-ink-50 px-4 text-sm font-semibold text-ink-500"
          >
            Continue with Apple
          </button>
          <p id="apple-sign-in-status" className="text-center text-xs text-ink-600">
            Apple sign-in is not available yet.
          </p>
          <div className="flex items-center gap-3" aria-hidden="true">
            <div className="h-px flex-1 bg-ink-200" />
            <span className="text-xs font-semibold uppercase text-ink-500">
              or use email
            </span>
            <div className="h-px flex-1 bg-ink-200" />
          </div>
        </>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'sign-up' ? (
          <label className="block">
            <span className="text-sm font-bold text-ink-800">Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 min-h-touch w-full rounded-card border border-ink-200 bg-white px-3 text-sm text-ink-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            />
          </label>
        ) : null}

        <label className="block">
          <span className="text-sm font-bold text-ink-800">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 min-h-touch w-full rounded-card border border-ink-200 bg-white px-3 text-sm text-ink-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold text-ink-800">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 min-h-touch w-full rounded-card border border-ink-200 bg-white px-3 text-sm text-ink-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          />
        </label>

        {error ? (
          <p role="alert" className="text-sm font-semibold text-danger-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="inline-flex min-h-touch w-full items-center justify-center rounded-card border border-brand-600 bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          {mode === 'sign-in' ? 'Sign in with email' : 'Create account'}
        </button>
      </form>
    </div>
  );
}

async function registerAccount(input: {
  email: string;
  name: string;
  password: string;
}): Promise<boolean> {
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    return response.ok;
  } catch {
    return false;
  }
}

async function exchangeCredentials(input: {
  email: string;
  password: string;
}): Promise<{ ok: true; grant: string } | { ok: false; message: string }> {
  let response: Response;

  try {
    response = await fetch('/api/auth/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch {
    return { ok: false, message: 'Sign-in is temporarily unavailable. Please try again.' };
  }

  const body = await readCredentialResponse(response);

  if (response.ok && typeof body.grant === 'string' && body.grant) {
    return { ok: true, grant: body.grant };
  }

  return { ok: false, message: getCredentialMessage(response.status, body) };
}

async function readCredentialResponse(response: Response): Promise<CredentialExchangeResponse> {
  try {
    const body = (await response.json()) as CredentialExchangeResponse;

    return body && typeof body === 'object' ? body : {};
  } catch {
    return {};
  }
}

function getCredentialMessage(
  status: number,
  body: CredentialExchangeResponse,
): string {
  if (status === 401 && body.error === 'unknown-account') {
    return 'No account was found for that email address.';
  }

  if (status === 401 && body.error === 'incorrect-password') {
    return 'That password is incorrect.';
  }

  if (status === 429 && body.error === 'rate-limited' && body.resetAt) {
    return `Too many sign-in attempts. Try again after ${body.resetAt}.`;
  }

  return 'Sign-in is temporarily unavailable. Please try again.';
}
