import Link from 'next/link';
import ScholarScoutWordmark from '@/components/branding/ScholarScoutWordmark';
import ContributorMediaIntake from '@/components/contributor-media/ContributorMediaIntake';
import { getContributorMediaPrivateIntakeState } from '@/lib/server/contributor-media';
import { getGovernedProgrammes } from '@/lib/server/programme-records';
import { resolveStudentActor } from '@/lib/server/student-actor';

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata = {
  title: 'Contribute media | Scholar Scout',
  description: 'Private, invite-only contributor media intake.',
};

export default async function ContributorMediaPage({ searchParams }: PageProps) {
  const actor = await resolveStudentActor({ allowGuest: false });
  const freshPreviewDraft = (await searchParams)?.fresh === '1';
  const intakeState = actor?.kind === 'account'
    ? await getContributorMediaPrivateIntakeState(actor, new Date(), { freshPreviewDraft })
    : null;
  const programmes = intakeState && intakeState.status !== 'unavailable'
    ? (await getGovernedProgrammes()).map((programme) => ({ id: programme.id, name: programme.name }))
    : [];

  return (
    <main className="min-h-screen bg-ink-50 px-5 py-10 text-ink-900 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight">Private Contributor Pilot</h1>
        <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-brand-700">Share an original student perspective</p>
        <p className="mt-4 text-ink-700">
          This invitation-only material is for <ScholarScoutWordmark />&apos;s governed school-information workflow.
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
        ) : intakeState?.status === 'attestation-required' ? (
          <ContributorMediaIntake
            initialStatus={null}
            programmes={programmes}
          />
        ) : intakeState?.status === 'submission' ? (
          <ContributorMediaIntake
            initialStatus={intakeState.submission}
            programmes={programmes}
          />
        ) : (
          <p className="mt-6 text-sm text-ink-700">No active contributor draft is available for this account.</p>
        )}
      </section>
    </main>
  );
}
