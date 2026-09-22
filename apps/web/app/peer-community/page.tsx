import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { authOptions } from '@/auth';
import AuthStatusLink from '@/components/auth/AuthStatusLink';
import ScholarScoutBrandMark from '@/components/branding/ScholarScoutBrandMark';
import PeerCommunity from '@/components/peer-community/PeerCommunity';
import { getCampusUploaderMatches } from '@/lib/peer-guides';
import { creatorProfiles } from '@/lib/platform';
import { getGovernedProgrammes } from '@/lib/server/programme-records';
import { getOnboardingProfile } from '@/lib/server/data-store';

export const metadata = {
  title: 'Campus Conversations | ScholarScout',
  description: 'Connect prospective students with the campus uploaders sharing their experience.',
};

export default async function PeerCommunityPage() {
  const session = await getServerSession(authOptions);
  const [programmes, profile] = await Promise.all([
    getGovernedProgrammes(),
    session?.user?.id ? getOnboardingProfile(session.user.id) : Promise.resolve(null),
  ]);
  const matches = getCampusUploaderMatches(creatorProfiles, programmes, profile);

  return (
    <main className="min-h-screen bg-ink-50 text-ink-900">
      <nav className="mx-auto flex max-w-6xl flex-col items-start gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8" aria-label="Peer community navigation">
        <Link href="/" aria-label="Scholar Scout" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"><ScholarScoutBrandMark size="compact" /></Link>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href="/feed" className="text-sm font-semibold text-ink-600 hover:text-brand-700">Discover</Link>
          <Link href="/programmes" className="text-sm font-semibold text-ink-600 hover:text-brand-700">Programs</Link>
          <AuthStatusLink />
        </div>
      </nav>
      <section className="border-y border-border bg-white">
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:px-8">
          <PeerCommunity matches={matches} signedIn={Boolean(session?.user?.id)} />
        </div>
      </section>
    </main>
  );
}
