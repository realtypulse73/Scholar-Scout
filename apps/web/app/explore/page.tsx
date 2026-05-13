import Link from 'next/link';
import SimulationPlayer from '@/components/simulations/SimulationPlayer';
import { CAREER_SIMULATIONS } from '@/lib/career-simulations';

export const metadata = {
  title: 'Explore Careers | ScholarScout',
};

export default function ExplorePage() {
  return (
    <main className="min-h-screen p-6 space-y-6">
      <h1 className="text-3xl font-extrabold">Try Your Future</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {CAREER_SIMULATIONS.map((simulation) => (
          <div key={simulation.id} className="border rounded p-4">
            <h2 className="text-xl font-bold">{simulation.title}</h2>
            <p className="text-sm text-gray-600">{simulation.summary}</p>
            <Link
              href={`?simulation=${simulation.id}`}
              className="text-blue-600 underline"
            >
              Start simulation
            </Link>
          </div>
        ))}
      </div>

      <div>
        {CAREER_SIMULATIONS.map((simulation) => (
          <SimulationPlayer key={simulation.id} simulation={simulation} />
        ))}
      </div>
    </main>
  );
}
