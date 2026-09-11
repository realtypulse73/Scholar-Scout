import { notFound } from 'next/navigation';
import CommunityModerationQueue from '@/components/admin/CommunityModerationQueue';
import { requireActiveStaff } from '@/lib/server/active-staff';
import { listPendingReviewCampusNotes } from '@/lib/server/operational-records';

export const metadata = {
  title: 'Community moderation | ScholarScout',
};

export const dynamic = 'force-dynamic';

export default async function CommunityModerationPage() {
  const authorization = await requireActiveStaff({
    action: 'community-moderation:read',
    route: '/admin/community-moderation',
  });

  if (!authorization.ok) {
    notFound();
  }

  const records = await listPendingReviewCampusNotes();

  return (
    <main className="min-h-screen bg-ink-50 px-5 py-8 text-ink-900">
      <div className="mx-auto max-w-4xl">
        <CommunityModerationQueue initialRecords={records} />
      </div>
    </main>
  );
}
