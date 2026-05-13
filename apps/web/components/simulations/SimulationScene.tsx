import { Badge } from '@/components/ui';
import type { CareerSimulation, SimulationStep } from '@/lib/career-simulations';

interface SimulationSceneProps {
  simulation: CareerSimulation;
  step?: SimulationStep;
}

const environmentStyles: Record<CareerSimulation['environment'], string> = {
  'job-site': 'from-amber-100 via-orange-50 to-slate-100 border-amber-200',
  'security-operations-center': 'from-slate-900 via-blue-950 to-slate-800 border-blue-800 text-white',
  'healthcare-floor': 'from-sky-50 via-white to-emerald-50 border-sky-200',
};

const environmentLabels: Record<CareerSimulation['environment'], string> = {
  'job-site': 'Trade environment',
  'security-operations-center': 'Technology environment',
  'healthcare-floor': 'Healthcare environment',
};

export default function SimulationScene({
  simulation,
  step,
}: SimulationSceneProps) {
  const isDark = simulation.environment === 'security-operations-center';

  return (
    <section
      className={`overflow-hidden rounded-card border bg-gradient-to-br ${environmentStyles[simulation.environment]} shadow-panel`}
      aria-label={`${simulation.title} immersive scene`}
    >
      <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative min-h-[320px] p-6">
          <div className="absolute inset-0 opacity-30" aria-hidden="true">
            <div className="absolute left-8 top-10 h-24 w-24 rounded-full border border-current" />
            <div className="absolute bottom-10 right-8 h-32 w-32 rounded-full border border-current" />
            <div className="absolute left-1/3 top-1/3 h-40 w-40 rounded-full border border-current" />
          </div>

          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <Badge tone={isDark ? 'brand' : 'success'} className="mb-4">
                {environmentLabels[simulation.environment]}
              </Badge>
              <h2 className="max-w-xl text-3xl font-extrabold leading-tight">
                {simulation.careerTitle}
              </h2>
              <p className={`mt-3 max-w-xl text-sm leading-6 ${isDark ? 'text-blue-100' : 'text-ink-700'}`}>
                {simulation.summary}
              </p>
            </div>

            <div className={`mt-8 rounded-card border p-4 ${isDark ? 'border-blue-700 bg-white/10 text-blue-50' : 'border-white/70 bg-white/70 text-ink-700'}`}>
              <p className="text-xs font-bold uppercase opacity-80">
                AI scene prompt
              </p>
              <p className="mt-2 text-sm leading-6">
                {simulation.imagePrompt}
              </p>
            </div>
          </div>
        </div>

        <div className={`border-t p-6 lg:border-l lg:border-t-0 ${isDark ? 'border-blue-800 bg-black/20' : 'border-white/70 bg-white/60'}`}>
          <p className={`text-xs font-bold uppercase ${isDark ? 'text-blue-200' : 'text-ink-500'}`}>
            Current scene
          </p>
          <h3 className="mt-2 text-2xl font-extrabold">
            {step?.title ?? simulation.title}
          </h3>
          <p className={`mt-3 text-sm leading-7 ${isDark ? 'text-blue-100' : 'text-ink-700'}`}>
            {step?.scene ?? simulation.summary}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {simulation.relatedInterests.slice(0, 3).map((interest) => (
              <div
                key={interest}
                className={`rounded-card border p-3 ${isDark ? 'border-blue-700 bg-white/10' : 'border-ink-100 bg-white'}`}
              >
                <p className="text-[11px] font-bold uppercase opacity-70">
                  Signal
                </p>
                <p className="mt-1 text-sm font-extrabold capitalize">
                  {interest.replace('-', ' ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
