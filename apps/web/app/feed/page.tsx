import Link from 'next/link';
import FeedExperience from '@/components/feed/FeedExperience';
import { Badge } from '@/components/ui';
import { feedItems } from '@/lib/platform';
import { getRecommendationsForUser } from '@/lib/server/platform-store';

export const metadata = {
  title: 'Pathway Feed | ScholarScout',
  description: 'Short video and voice pathway previews for ScholarScout.',
};

export default async function FeedPage() {
  const recommendations = await getRecommendationsForUser('local-student');

  return (
    <main className="min-h-screen bg-white text-ink-900">
      <header className="border-b border-ink-200 bg-ink-50">
        <div className="mx-auto max-w-6xl px-5 py-8">
          <Link href="/" className="text-sm font-semibold text-brand-700">
            ScholarScout
          </Link>
          <div className="mt-5 max-w-2xl">
            <Badge tone="brand">Feed</Badge>
            <h1 className="mt-4 text-3xl font-extrabold text-ink-900">
              Swipe through pathways before you commit.
            </h1>
            <p className="mt-3 text-sm leading-6 text-ink-600">
              Video and voice previews save watch time, skips, and interest
              signals for recommendations.
            </p>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-6">
        <FeedExperience
          items={feedItems}
          initialRecommendations={recommendations}
        />
      </div>
    </main>
  );
}
