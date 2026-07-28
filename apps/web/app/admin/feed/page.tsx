import { notFound } from 'next/navigation';
import PlatformDashboard from '@/components/admin/PlatformDashboard';
import { requireActiveStaff } from '@/lib/server/active-staff';
import { getPlatformMetrics } from '@/lib/server/platform-store';

export const metadata = {
  title: 'Feed Analytics | ScholarScout',
};

export default async function AdminFeedPage() {
  const authorization = await requireActiveStaff({
    action: 'view-feed-metrics',
    route: '/admin/feed',
  });

  if (!authorization.ok) {
    notFound();
  }

  const metrics = await getPlatformMetrics();

  return (
    <main className="min-h-screen bg-ink-50 px-5 py-8 text-ink-900">
      <div className="mx-auto max-w-6xl">
        <PlatformDashboard title="Feed analytics" metrics={metrics} />
      </div>
    </main>
  );
}
