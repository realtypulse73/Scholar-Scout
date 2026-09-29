import Link from 'next/link';
import { getContributorMediaPrivateStatus } from '@/lib/server/contributor-media';
import { resolveStudentActor } from '@/lib/server/student-actor';

export const metadata = {
  title: 'Contribute media | Scholar Scout',
  description: 'Private, invite-only contributor media intake.',
};

export default async function ContributorMediaPage() {
  const actor = await resolveStudentActor({ allowGuest: false });
  const status = actor?.kind === 'account'
    ? await getContributorMediaPrivateStatus(actor)
    : null;

  return (
    <main className="min-h-screen bg-ink-50 px-5 py-10 text-ink-900 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Private contributor pilot</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Share an original student perspective</h1>
        <p className="mt-4 text-ink-700">
          This invitation-only material is for Scholar Scout&apos;s governed school-information workflow.
          It is not an official Houston Tillotson University post, provider endorsement, attendance claim,
          placement claim, or promise of outcomes.
        </p>

        {!actor || actor.kind !== 'account' ? (
          <p className="mt-6 text-sm text-ink-700">
            <Link className="font-semibold text-brand-700 underline" href="/auth/sign-in?callbackUrl=/contribute/media">
              Sign in
            </Link>{' '}
            with an invited account to continue.
          </p>
        ) : status ? (
          <div className="mt-6 rounded-xl border border-border bg-ink-50 p-4" aria-live="polite">
            <h2 className="font-semibold">Current private status: {status.status}</h2>
            <p className="mt-1 text-sm text-ink-700">Your submission is private. We will provide the next secure step after review preparation.</p>
          </div>
        ) : (
          <p className="mt-6 text-sm text-ink-700">No active contributor draft is available for this account.</p>
        )}
      </section>
    </main>
  );
}
