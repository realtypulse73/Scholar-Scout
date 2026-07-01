import { Card } from '@/components/ui';
import {
  getAidSignals,
  getCostSummary,
  getDeadlineSignals,
} from '@/lib/affordability';
import type { Programme } from '@/lib/programmes';

interface Props {
  programme: Programme;
}

export default function AffordabilityPanel({ programme }: Props) {
  const costSummary = getCostSummary(programme);
  const aidSignals = getAidSignals(programme);
  const deadlineSignals = getDeadlineSignals(programme);

  return (
    <Card className="p-5">
      <h2 className="text-xl font-extrabold">Cost &amp; aid</h2>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-3xl font-extrabold text-ink-900">
          ${programme.annualTuition.toLocaleString()}
        </span>
        <span className="text-sm font-semibold text-ink-500">per year</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-ink-600">{costSummary}</p>

      {aidSignals.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs font-extrabold uppercase text-ink-500">
            Aid options
          </h3>
          <ul className="mt-3 space-y-3" aria-label="Aid options">
            {aidSignals.map((signal) => (
              <li key={signal.label} className="flex items-start gap-3">
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    signal.tone === 'success'
                      ? 'bg-success-600'
                      : signal.tone === 'warning'
                        ? 'bg-warning-600'
                        : 'bg-brand-500'
                  }`}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-bold text-ink-900">
                    {signal.label}
                  </p>
                  <p className="text-xs leading-5 text-ink-600">
                    {signal.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {deadlineSignals.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs font-extrabold uppercase text-ink-500">
            Dates to know
          </h3>
          <ul className="mt-3 space-y-2" aria-label="Dates to know">
            {deadlineSignals.map((signal) => (
              <li
                key={signal.label}
                className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-ink-200 px-4 py-3"
              >
                <span className="text-sm font-bold text-ink-900">
                  {signal.label}
                </span>
                <span
                  className={`flex items-center gap-2 text-sm font-semibold ${
                    signal.soon ? 'text-warning-700' : 'text-ink-700'
                  }`}
                >
                  {signal.formatted}
                  {signal.soon && (
                    <span className="rounded bg-warning-50 px-1.5 py-0.5 text-xs font-extrabold uppercase text-warning-700">
                      Coming up
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 rounded-card border border-brand-200 bg-brand-50 p-4">
        <h3 className="text-sm font-extrabold text-brand-900">
          Ask the school
        </h3>
        <ul className="mt-2 space-y-2">
          <li className="text-sm leading-6 text-brand-800">
            What grants or scholarships can I apply for here?
          </li>
          <li className="text-sm leading-6 text-brand-800">
            Are there payment plans or fee waivers?
          </li>
          {programme.aidTypes?.includes('work-study') && (
            <li className="text-sm leading-6 text-brand-800">
              How does work-study work and when can I apply?
            </li>
          )}
          {programme.aidTypes?.includes('employer-tuition-help') && (
            <li className="text-sm leading-6 text-brand-800">
              How do I use employer tuition benefits here?
            </li>
          )}
          {programme.aidTypes?.includes('merit-scholarship') && (
            <li className="text-sm leading-6 text-brand-800">
              What GPA or criteria do merit scholarships require?
            </li>
          )}
        </ul>
      </div>
    </Card>
  );
}
