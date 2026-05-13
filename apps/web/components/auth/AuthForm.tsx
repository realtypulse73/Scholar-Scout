'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type AuthRole = 'student' | 'staff';

interface AuthFormProps {
  mode: 'sign-in' | 'sign-up';
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AuthRole>('student');
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
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password, role }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setError(body.error ?? 'Unable to create account.');
        return;
      }
    }

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid email or password.');
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

        {mode === 'sign-up' ? (
          <fieldset>
            <legend className="text-sm font-bold text-ink-800">
              Account type
            </legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(['student', 'staff'] as const).map((option) => (
                <label
                  key={option}
                  className="flex min-h-touch items-center gap-2 rounded-card border border-ink-200 bg-white px-3 text-sm font-semibold capitalize text-ink-700"
                >
                  <input
                    type="radio"
                    name="role"
                    value={option}
                    checked={role === option}
                    onChange={() => setRole(option)}
                    className="h-4 w-4 accent-brand-600"
                  />
                  {option}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

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
