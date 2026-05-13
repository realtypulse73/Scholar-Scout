import Link from 'next/link';
import StaffGate from '@/components/auth/StaffGate';
import { Badge, Card } from '@/components/ui';
import { getGovernedProgrammes } from '@/lib/server/programme-records';
import { buildExecutiveCommandCenterSnapshot } from '@/lib/executive-command-center';

export const metadata = {
  title: 'Executive Command Center | ScholarScout',
  description:
    'Unified dashboard for product intelligence, pipeline health, and institutional signals.',
};

export default async function CommandCenterPage() {
  const programmes = await getGovernedProgrammes();

  const snapshot = buildExecutiveCommandCenterSnapshot({
    programmes,
  });

  return (
    <main className="min-h-screen bg-ink-50 text-ink-900">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" className="text-lg font-extrabold text-brand-700">
          ScholarScout
        </Link>
      </nav>

      <section className="mx-auto max-w-6xl px-5 py-8">
        <StaffGate>
          <div className="space-y-6">
            <Card className="p-5">
              <Badge tone="brand" className="mb-4">
                Executive Command Center
              </Badge>
              <h1 className="text-3xl font-extrabold">
                System Overview
              </h1>
              <p className="mt-2 text-sm text-ink-600">
                Unified view of product, intelligence, and execution pipeline.
              </p>
            </Card>

            <section className="grid gap-4 md:grid-cols-4">
              {snapshot.metrics.map((metric) => (
                <Card key={metric.label} className="p-5">
                  <p className="text-xs uppercase text-ink-500">
                    {metric.label}
                  </p>
                  <p className="text-2xl font-extrabold">
                    {metric.value}
                  </p>
                  <p className="text-xs text-ink-600 mt-1">
                    {metric.description}
                  </p>
                </Card>
              ))}
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <Card className="p-5">
                <h2 className="text-xl font-extrabold">Alerts</h2>
                <div className="mt-3 space-y-3">
                  {snapshot.alerts.map((alert, index) => (
                    <div key={index} className="border p-3 rounded">
                      <p className="font-bold">{alert.title}</p>
                      <p className="text-sm">{alert.description}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <h2 className="text-xl font-extrabold">Pipeline Status</h2>
                <div className="mt-3 space-y-3">
                  {snapshot.pipelineStatus.map((item) => (
                    <div key={item.label}>
                      <p className="font-bold">{item.label}</p>
                      <p className="text-sm">{item.value}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </section>

            <Card className="p-5">
              <h2 className="text-xl font-extrabold">Product Priorities</h2>
              <ul className="mt-3 space-y-2">
                {snapshot.productPriorities.map((priority, index) => (
                  <li key={index}>• {priority}</li>
                ))}
              </ul>
            </Card>
          </div>
        </StaffGate>
      </section>
    </main>
  );
}
