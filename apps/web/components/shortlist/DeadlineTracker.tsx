import Link from 'next/link';
import { getShortlistDeadlines } from '@/lib/affordability';
import type { Programme } from '@/lib/programmes';

interface Props {
  shortlisted: Programme[];
}

export default function DeadlineTracker({ shortlisted }: Props) {
  const deadlines = getShortlistDeadlines(shortlisted);

  if (deadlines.length === 0) {
    return null;
  }

  const overdue = deadlines.filter((d) => d.urgency === 'overdue');
  const soon = deadlines.filter((d) => d.urgency === 'soon');
  const later = deadlines.filter((d) => d.urgency === 'later');

  return (
    <section
      className="rounded-card border border-ink-200 bg-white p-5"
      aria-labelledby="deadline-tracker-heading"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-ink-500">
            Dates to check
          </p>
          <h2
            id="deadline-tracker-heading"
            className="mt-1 text-xl font-extrabold text-ink-900"
          >
            Deadlines on your saved programs
          </h2>
        </div>
        {soon.length > 0 && (
          <span className="inline-flex items-center rounded-card bg-warning-50 px-3 py-1 text-sm font-extrabold text-warning-700">
            {soon.length} coming up soon
          </span>
        )}
      </div>

      <div className="mt-5 space-y-2" role="list" aria-label="Programme deadlines">
        {overdue.length > 0 && (
          <DeadlineGroup
            label="Past due — check with the school"
            deadlines={overdue}
            rowClassName="border-danger-200 bg-danger-50"
            dateClassName="text-danger-700"
            badgeClassName="bg-danger-50 text-danger-700 border-danger-200"
            badgeText="Past due"
          />
        )}

        {soon.length > 0 && (
          <DeadlineGroup
            label="Coming up in the next 60 days"
            deadlines={soon}
            rowClassName="border-warning-200 bg-warning-50"
            dateClassName="text-warning-700"
            badgeClassName="bg-warning-50 text-warning-700 border-warning-200"
            badgeText="Coming up"
          />
        )}

        {later.length > 0 && (
          <DeadlineGroup
            label="Later this year"
            deadlines={later}
            rowClassName="border-ink-200 bg-ink-50"
            dateClassName="text-ink-700"
            badgeClassName=""
            badgeText=""
          />
        )}
      </div>

      <p className="mt-4 text-xs leading-5 text-ink-500">
        Dates shown are from program listings. Always confirm with the school
        before you apply.
      </p>
    </section>
  );
}

interface DeadlineGroupProps {
  label: string;
  deadlines: ReturnType<typeof getShortlistDeadlines>;
  rowClassName: string;
  dateClassName: string;
  badgeClassName: string;
  badgeText: string;
}

function DeadlineGroup({
  label,
  deadlines,
  rowClassName,
  dateClassName,
  badgeClassName,
  badgeText,
}: DeadlineGroupProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase text-ink-500">{label}</p>
      <ul className="space-y-2">
        {deadlines.map((deadline) => (
          <li
            key={`${deadline.programme.id}-${deadline.label}`}
            role="listitem"
            className={`flex flex-wrap items-center justify-between gap-3 rounded-card border px-4 py-3 ${rowClassName}`}
          >
            <div className="min-w-0">
              <Link
                href={`/programmes/${deadline.programme.id}`}
                className="text-sm font-extrabold text-ink-900 hover:text-brand-700"
              >
                {deadline.programme.name}
              </Link>
              <p className="mt-0.5 text-xs font-semibold text-ink-500">
                {deadline.programme.school}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <span className="text-xs font-bold uppercase text-ink-500">
                {deadline.label}
              </span>
              <span className={`text-sm font-extrabold ${dateClassName}`}>
                {deadline.formatted}
              </span>
              {badgeText && (
                <span
                  className={`rounded border px-2 py-0.5 text-xs font-extrabold uppercase ${badgeClassName}`}
                >
                  {badgeText}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
