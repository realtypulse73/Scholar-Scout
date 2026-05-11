import Link from 'next/link';
import StaffGate from '@/components/auth/StaffGate';
import ProgrammeAdminManager from '@/components/admin/ProgrammeAdminManager';
import ShortlistCountLink from '@/components/shortlist/ShortlistCountLink';
import { getGovernedProgrammes } from '@/lib/server/programme-records';

export const metadata = {
  title: 'Programme Admin | ScholarScout',
  description:
    'Add and edit local ScholarScout programme records before a production CMS is connected.',
};

export default async function AdminProgrammesPage() {
  const programmes = await getGovernedProgrammes();

  return (
    <main className="min-h-screen bg-ink-50 text-ink-900">
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8"
        aria-label="Admin navigation"
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
          <ShortlistCountLink />
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-5 pb-10 pt-4 sm:px-6 lg:px-8">
        <StaffGate>
          <ProgrammeAdminManager baseProgrammes={programmes} />
        </StaffGate>
      </section>
    </main>
  );
}
