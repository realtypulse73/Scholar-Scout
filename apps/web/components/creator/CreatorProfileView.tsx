import Link from 'next/link';
import Card from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import ReferralPanel from '@/components/referrals/ReferralPanel';
import SharePanel from '@/components/share/SharePanel';
import type { CreatorProfile } from '@/lib/platform';

interface CreatorProfileViewProps {
  creator: CreatorProfile;
}

export default function CreatorProfileView({ creator }: CreatorProfileViewProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="space-y-4">
        <Card className="p-6">
          <Badge tone="brand">{creator.pathway}</Badge>
          <h1 className="mt-4 text-4xl font-extrabold text-ink-900">
            {creator.displayName}
          </h1>
          <p className="mt-2 text-sm font-semibold text-brand-700">
            @{creator.username}
          </p>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink-600">
            {creator.bio}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {creator.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
          <Link
            href="/simulate"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-card border border-brand-600 bg-brand-600 px-5 text-sm font-semibold text-white"
          >
            Try this path
          </Link>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase text-ink-500">
              Followers
            </p>
            <p className="mt-2 text-2xl font-extrabold text-ink-900">
              {creator.stats.followers}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase text-ink-500">
              Completions
            </p>
            <p className="mt-2 text-2xl font-extrabold text-ink-900">
              {creator.stats.completions}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase text-ink-500">
              Clarity
            </p>
            <p className="mt-2 text-2xl font-extrabold text-ink-900">
              {creator.clarityScore}
            </p>
          </Card>
        </div>
      </section>

      <aside className="space-y-4">
        <ReferralPanel referrer={creator.username} />
        <SharePanel targetType="creator" targetId={creator.username} />
      </aside>
    </div>
  );
}
