import { notFound } from 'next/navigation';
import Link from 'next/link';
import CreatorProfileView from '@/components/creator/CreatorProfileView';
import { creatorProfiles } from '@/lib/platform';

interface CreatorPageProps {
  params: Promise<{ username: string }>;
}

export function generateStaticParams() {
  return creatorProfiles.map((creator) => ({
    username: creator.username,
  }));
}

export async function generateMetadata({ params }: CreatorPageProps) {
  const { username } = await params;
  const creator = creatorProfiles.find((item) => item.username === username);

  return {
    title: creator ? `${creator.displayName} | ScholarScout` : 'Creator',
  };
}

export default async function CreatorPage({ params }: CreatorPageProps) {
  const { username } = await params;
  const creator = creatorProfiles.find((item) => item.username === username);

  if (!creator) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white text-ink-900">
      <header className="border-b border-ink-200 bg-ink-50">
        <div className="mx-auto max-w-6xl px-5 py-6">
          <Link href="/feed" className="text-sm font-semibold text-brand-700">
            Back to feed
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-8">
        <CreatorProfileView creator={creator} />
      </div>
    </main>
  );
}
