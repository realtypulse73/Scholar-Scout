import type { HTMLAttributes } from 'react';
import { classNames } from '@/lib/class-names';

export default function StudentJourneyScene({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <section
      data-testid="student-journey-scene"
      className={classNames(
        'student-journey-scene relative min-h-[360px] overflow-hidden rounded-card border border-ink-200',
        className,
      )}
      {...props}
    >
      <div
        data-scene-decorations
        className="absolute inset-y-0 right-0 w-1/2 overflow-hidden"
      >
        <div
          aria-hidden="true"
          data-student-decoration
          className="student-motion-layer pointer-events-none absolute bottom-12 right-10 h-24 w-10 rounded-t-full border-4 border-brand-600 bg-white/65 shadow-card"
        />
        <div
          aria-hidden="true"
          data-student-decoration
          className="student-light-trail pointer-events-none absolute bottom-16 right-0 h-1 w-40 rounded-full bg-brand-500"
        />
      </div>
      <div data-scene-content className="relative z-10 h-full">
        {children}
      </div>
    </section>
  );
}
