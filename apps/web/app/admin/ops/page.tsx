import PlatformDashboard from '@/components/admin/PlatformDashboard';
import { getPlatformMetrics } from '@/lib/server/platform-store';

export const metadata = {
  title: 'Operations | ScholarScout',
};

export default async function AdminOpsPage() {
  const metrics = await getPlatformMetrics();

  return (
    <main className="min-h-screen bg-ink-50 px-5 py-8 text-ink-900">
      <div className="mx-auto max-w-6xl">
        <PlatformDashboard title="Operations dashboard" metrics={metrics} />
      </div>
    </main>
  );
}
