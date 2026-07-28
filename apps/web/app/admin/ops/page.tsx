import { notFound } from 'next/navigation';
import PlatformDashboard from '@/components/admin/PlatformDashboard';
import { requireActiveStaff } from '@/lib/server/active-staff';
import { getPlatformMetrics } from '@/lib/server/platform-store';

export const metadata = {
  title: 'Operations | ScholarScout',
};

export default async function AdminOpsPage() {
  const authorization = await requireActiveStaff({
    action: 'view-operations-metrics',
    route: '/admin/ops',
  });

  if (!authorization.ok) {
    notFound();
  }

  const metrics = await getPlatformMetrics();

  return (
    <main className="min-h-screen bg-ink-50 px-5 py-8 text-ink-900">
      <div className="mx-auto max-w-6xl">
        <PlatformDashboard title="Operations dashboard" metrics={metrics} />
      </div>
    </main>
  );
}
