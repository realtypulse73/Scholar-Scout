import Link from 'next/link';
import SimulationPlayer from '@/components/simulations/SimulationPlayer';
import { Card } from '@/components/ui';
import { CAREER_SIMULATIONS } from '@/lib/career-simulations';

export const metadata = {
  title: 'Explore Careers | ScholarScout',
};

export default function ExplorePage() {
  return (
    <main className="min-h-screen bg-ink-50 text-ink-900">
      <section className="border-y border-border bg-white">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">Try Your Future</h1>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-8 px-5 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {CAREER_SIMULATIONS.map((simulation) => (
            <Card key={simulation.id} className="p-5">
              <h2 className="text-xl font-semibold text-ink-900">{simulation.title}</h2>
              <p className="mt-2 text-base leading-6 text-ink-600">{simulation.summary}</p>
              <Link
                href={`?simulation=${simulation.id}`}
                className="mt-4 inline-flex min-h-touch items-center rounded-card border border-brand-600 bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
              >
                Start simulation
              </Link>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          {CAREER_SIMULATIONS.map((simulation) => (
            <SimulationPlayer key={simulation.id} simulation={simulation} />
          ))}
        </div>
      </div>
    </main>
  );
}
