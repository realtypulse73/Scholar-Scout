import Link from 'next/link';
import AuthForm from '@/components/auth/AuthForm';
import { Card } from '@/components/ui';

export const metadata = {
  title: 'Sign In | ScholarScout',
  description: 'Sign in to a local ScholarScout prototype account.',
};

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-ink-50 text-ink-900">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
        <Link href="/" className="mb-6 text-lg font-extrabold text-brand-700">
          ScholarScout
        </Link>
        <Card className="p-6">
          <h1 className="text-2xl font-extrabold">Sign in</h1>
          <p className="mt-2 text-sm leading-6 text-ink-600">
            Sign in with your ScholarScout account. This build uses Auth.js
            credentials while OAuth provider credentials are pending.
          </p>
          <div className="mt-6">
            <AuthForm mode="sign-in" />
          </div>
          <p className="mt-4 text-sm text-ink-600">
            New here?{' '}
            <Link href="/auth/sign-up" className="font-semibold text-brand-700">
              Create a local account
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
