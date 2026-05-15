import Link from 'next/link';
import SimulationPlayer from '@/components/simulation/SimulationPlayer';
import { Badge } from '@/components/ui';
import { simulations } from '@/lib/simulations';

export const metadata = {
  title: 'Simulation | ScholarScout',
  description: 'Run a short pathway simulation and save results.',
};

export default async function SimulationPage() {
  const simulation = simulations[0];

  return (
    <main className="min-h-screen bg-white text-ink-900">
      <header className="border-b border-ink-200 bg-ink-50">
        <div className="mx-auto max-w-6xl px-5 py-8">
          <Link href="/" className="text-sm font-semibold text-brand-700">
            ScholarScout
          </Link>
          <div className="mt-5 max-w-2xl">
            <Badge tone="warning">Simulation</Badge>
            <h1 className="mt-4 text-3xl font-extrabold text-ink-900">
              Try a path before choosing one.
            </h1>
            <p className="mt-3 text-sm leading-6 text-ink-600">
              Results create a clarity score and boost recommendations toward
              the work style and support model you chose.
            </p>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-8">
        <SimulationPlayer simulation={simulation} />
      </div>
    </main>
  );
}
