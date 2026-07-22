import { classNames } from '@/lib/class-names';
import {
  getProgrammeVisualAltText,
  getProgrammeVisualTheme,
} from '@/lib/programme-visual-themes';
import type { Programme } from '@/lib/programmes';

interface ProgrammeVisualPanelProps {
  programme: Programme;
  variant?: 'compact' | 'feature';
}

export default function ProgrammeVisualPanel({
  programme,
  variant = 'feature',
}: ProgrammeVisualPanelProps) {
  const theme = getProgrammeVisualTheme(programme);
  const altText = getProgrammeVisualAltText(programme);

  if (variant === 'compact') {
    return (
      <div
        className={classNames(
          'overflow-hidden rounded-card border border-ink-200 bg-gradient-to-br',
          theme.paletteClassName,
        )}
      >
        <img
          src={theme.stillUrl}
          alt={altText}
          className="aspect-[16/9] w-full object-cover"
        />
        <div className="space-y-2 p-3">
          <div className="flex items-center gap-2">
            <span
              className={classNames('h-2.5 w-2.5 rounded-full', theme.accentClassName)}
              aria-hidden="true"
            />
            <p className="text-xs font-extrabold uppercase text-ink-700">
              {theme.label}
            </p>
          </div>
          <p className="text-xs leading-5 text-ink-600">
            {theme.studentConcern}
          </p>
        </div>
      </div>
    );
  }

  return (
    <section
      className={classNames(
        'overflow-hidden rounded-card border border-ink-200 bg-gradient-to-br',
        theme.paletteClassName,
      )}
      aria-label={`${programme.name} visual theme`}
    >
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
        <div className="relative min-h-[18rem] bg-ink-950">
          <video
            className="h-full max-h-[30rem] min-h-[18rem] w-full object-cover"
            src={theme.videoUrl}
            poster={theme.stillUrl}
            controls
            muted
            playsInline
            preload="metadata"
            aria-label={`${programme.name} ${theme.label} video`}
          />
        </div>
        <div className="flex flex-col justify-between gap-6 p-5 sm:p-6">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={classNames('h-3 w-3 rounded-full', theme.accentClassName)}
                aria-hidden="true"
              />
              <p className="text-xs font-extrabold uppercase text-ink-600">
                Visual theme
              </p>
            </div>
            <h2 className="mt-3 text-2xl font-extrabold text-ink-900">
              {theme.label}
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink-700">
              {theme.sceneSummary}
            </p>
          </div>
          <div className="grid gap-3">
            <ThemeSignal label="Student concern" value={theme.studentConcern} />
            <ThemeSignal label="Support signal" value={theme.supportSignal} />
            <ThemeSignal label="Course route" value={theme.pathwaySignal} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ThemeSignal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-white/70 bg-white/75 p-3">
      <p className="text-xs font-bold uppercase text-ink-500">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-5 text-ink-800">
        {value}
      </p>
    </div>
  );
}
