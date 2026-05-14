import PlatformDashboard from '@/components/admin/PlatformDashboard';
import { getPlatformMetrics } from '@/lib/server/platform-store';

export const metadata = {
  title: 'Feed Analytics | ScholarScout',
};

export default async function AdminFeedPage() {
  const metrics = await getPlatformMetrics();

  return (
    <main className="min-h-screen bg-ink-50 px-5 py-8 text-ink-900">
      <div className="mx-auto max-w-6xl">
        <PlatformDashboard title="Feed analytics" metrics={metrics} />
      </div>
    </main>
  );
}
