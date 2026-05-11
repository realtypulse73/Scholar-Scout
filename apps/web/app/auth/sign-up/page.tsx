import Link from 'next/link';
import AuthForm from '@/components/auth/AuthForm';
import { Card } from '@/components/ui';

export const metadata = {
  title: 'Sign Up | ScholarScout',
  description: 'Create a local ScholarScout prototype account.',
};

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-ink-50 text-ink-900">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
        <Link href="/" className="mb-6 text-lg font-extrabold text-brand-700">
          ScholarScout
        </Link>
        <Card className="p-6">
          <h1 className="text-2xl font-extrabold">Create account</h1>
          <p className="mt-2 text-sm leading-6 text-ink-600">
            Create an account backed by Auth.js credentials. Staff accounts can
            access governed programme record tools.
          </p>
          <div className="mt-6">
            <AuthForm mode="sign-up" />
          </div>
          <p className="mt-4 text-sm text-ink-600">
            Already have one?{' '}
            <Link href="/auth/sign-in" className="font-semibold text-brand-700">
              Sign in locally
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
