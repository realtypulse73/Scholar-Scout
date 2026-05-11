import Link from 'next/link';
import AuthStatusLink from '@/components/auth/AuthStatusLink';
import ProfileDashboard from '@/components/profile/ProfileDashboard';

export const metadata = {
  title: 'Profile | ScholarScout',
  description:
    'View local ScholarScout account status, saved preferences, and shortlist progress.',
};

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-ink-50 text-ink-900">
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8"
        aria-label="Profile navigation"
      >
        <Link href="/" className="text-lg font-extrabold text-brand-700">
          ScholarScout
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/programmes"
            className="text-sm font-semibold text-ink-600 hover:text-brand-700"
          >
            Programmes
          </Link>
          <AuthStatusLink />
        </div>
      </nav>
      <section className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:px-8">
        <ProfileDashboard />
      </section>
    </main>
  );
}
