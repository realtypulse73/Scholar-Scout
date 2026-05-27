'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import DeadlineTracker from '@/components/shortlist/DeadlineTracker';
import { Badge, Card } from '@/components/ui';
import {
  PROGRAMME_PATHWAY_LABELS,
  type Programme,
} from '@/lib/programmes';
import {
  SHORTLIST_PLAN_STATUS_LABELS,
  SHORTLIST_PLAN_STORAGE_KEY,
  SHORTLIST_STORAGE_KEY,
  getShortlistPlan,
  getShortlistDecisionHeadline,
  getShortlistDecisionSummaries,
  getShortlistedProgrammes,
  parseShortlist,
  parseShortlistPlans,
  pruneShortlistPlans,
  toggleShortlistId,
  updateShortlistPlan,
  type ShortlistPlanMap,
  type ShortlistPlanStatus,
} from '@/lib/shortlist';

interface ShortlistComparisonProps {
  programmes: Programme[];
}

export default function ShortlistComparison({
  programmes,
}: ShortlistComparisonProps) {
  const { data: session } = useSession();
  const [shortlistIds, setShortlistIds] = useState<string[]>([]);
  const [plans, setPlans] = useState<ShortlistPlanMap>({});
  const shortlisted = getShortlistedProgrammes(shortlistIds, programmes);
  const decisionSummaries = getShortlistDecisionSummaries(shortlisted);
  const decisionHeadline = getShortlistDecisionHeadline(shortlisted);

  useEffect(() => {
    async function loadShortlist() {
      const localIds = parseShortlist(
        window.localStorage.getItem(SHORTLIST_STORAGE_KEY),
      );
      setShortlistIds(localIds);
      setPlans(
        pruneShortlistPlans(
          parseShortlistPlans(
            window.localStorage.getItem(SHORTLIST_PLAN_STORAGE_KEY),
          ),
          localIds,
        ),
      );

      if (session) {
        const response = await fetch('/api/account/shortlist');
        if (response.ok) {
          const body = (await response.json()) as {
            programmeIds?: string[];
            plans?: ShortlistPlanMap;
          };
          const serverIds = body.programmeIds ?? [];
          const serverPlans = pruneShortlistPlans(body.plans ?? {}, serverIds);
          setShortlistIds(serverIds);
          setPlans(serverPlans);
          window.localStorage.setItem(
            SHORTLIST_STORAGE_KEY,
            JSON.stringify(serverIds),
          );
          window.localStorage.setItem(
            SHORTLIST_PLAN_STORAGE_KEY,
            JSON.stringify(serverPlans),
          );
        }
      }
    }

    void loadShortlist();
  }, [session]);

  function removeProgramme(programmeId: string) {
    const nextIds = toggleShortlistId(shortlistIds, programmeId);
    const nextPlans = pruneShortlistPlans(plans, nextIds);
    setShortlistIds(nextIds);
    setPlans(nextPlans);
    window.localStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(nextIds));
    window.localStorage.setItem(
      SHORTLIST_PLAN_STORAGE_KEY,
      JSON.stringify(nextPlans),
    );
    window.dispatchEvent(new Event('shortlist:updated'));
    if (session) {
      void fetch('/api/account/shortlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programmeIds: nextIds, plans: nextPlans }),
      });
    }
  }

  function updatePlan(
    programmeId: string,
    nextPlan: { status?: ShortlistPlanStatus; note?: string },
  ) {
    const nextPlans = updateShortlistPlan(plans, programmeId, nextPlan);
    setPlans(nextPlans);
    window.localStorage.setItem(
      SHORTLIST_PLAN_STORAGE_KEY,
      JSON.stringify(nextPlans),
    );
    if (session) {
      void fetch('/api/account/shortlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programmeIds: shortlistIds, plans: nextPlans }),
      });
    }
  }

  if (shortlisted.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Badge tone="brand" className="mb-4">
          Shortlist
        </Badge>
        <h1 className="text-2xl font-extrabold text-ink-900">
          No saved programmes yet
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-ink-600">
          Save programs from the list or detail pages. Then come back here to
          compare cost, entry options, support, and class format.
        </p>
        <Link
          href="/programmes"
          className="mt-6 inline-flex min-h-touch items-center justify-center rounded-card border border-brand-600 bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          Browse programmes
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-card border border-ink-200 bg-white p-5">
        <Badge tone="brand" className="mb-4">
          Shortlist
        </Badge>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-ink-900">
              Compare saved programs
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">
              Compare the basics: cost, entry options, class format, support,
              and next steps.
            </p>
          </div>
          <Link
            href="/programmes"
            className="inline-flex min-h-10 items-center justify-center rounded-card border border-ink-300 bg-white px-4 text-sm font-semibold text-ink-700 hover:border-brand-400 hover:text-brand-700"
          >
            Add more
          </Link>
        </div>
      </div>

      <DeadlineTracker shortlisted={shortlisted} />

      <section
        className="rounded-card border border-brand-200 bg-brand-50 p-5"
        aria-labelledby="decision-guide-heading"
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-brand-700">
              Choice guide
            </p>
            <h2
              id="decision-guide-heading"
              className="mt-1 text-xl font-extrabold text-ink-900"
            >
              {decisionHeadline}
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-ink-700">
            Use these clues to decide what to check next. Do not rule anything
            out too soon.
          </p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {decisionSummaries.map((summary) => {
            const plan = getShortlistPlan(plans, summary.programme.id);

            return (
              <article
                key={summary.programme.id}
                className="rounded-card border border-brand-100 bg-white p-4 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-ink-900">
                      {summary.programme.name}
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-ink-500">
                      {summary.programme.school}
                    </p>
                  </div>
                  <Badge tone="success">{summary.programme.matchScore}%</Badge>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-2">
                  {summary.signals.map((signal) => (
                    <div
                      key={signal.label}
                      className="rounded border border-ink-100 bg-ink-50 p-2"
                    >
                      <dt className="text-[11px] font-bold uppercase text-ink-500">
                        {signal.label}
                      </dt>
                      <dd className="mt-1">
                        <Badge tone={signal.tone}>{signal.value}</Badge>
                      </dd>
                    </div>
                  ))}
                </dl>

                {summary.cautions.length > 0 ? (
                  <p className="mt-4 text-sm leading-6 text-ink-700">
                    Check {summary.cautions.join(', ').toLowerCase()} before
                    you treat this as ready.
                  </p>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-ink-700">
                    This option has no big warning signs in the current data.
                  </p>
                )}

                <div className="mt-4 rounded border border-ink-100 bg-white p-3">
                  <p className="text-[11px] font-bold uppercase text-ink-500">
                    Next action
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-ink-800">
                    {summary.nextStep}
                  </p>
                </div>

                <div className="mt-4 space-y-3 rounded border border-ink-100 bg-ink-50 p-3">
                  <label className="block text-[11px] font-bold uppercase text-ink-500">
                    Planning status
                    <select
                      value={plan.status}
                      onChange={(event) =>
                        updatePlan(summary.programme.id, {
                          status: event.target.value as ShortlistPlanStatus,
                        })
                      }
                      className="mt-1 block min-h-10 w-full rounded border border-ink-300 bg-white px-3 text-sm font-semibold text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                    >
                      {Object.entries(SHORTLIST_PLAN_STATUS_LABELS).map(
                        ([status, label]) => (
                          <option key={status} value={status}>
                            {label}
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label className="block text-[11px] font-bold uppercase text-ink-500">
                    Notes
                    <textarea
                      value={plan.note}
                      onChange={(event) =>
                        updatePlan(summary.programme.id, {
                          note: event.target.value,
                        })
                      }
                      rows={3}
                      maxLength={500}
                      placeholder="What do you still need to ask or check?"
                      className="mt-1 block w-full rounded border border-ink-300 bg-white px-3 py-2 text-sm font-medium leading-6 text-ink-800 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                    />
                  </label>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="overflow-x-auto rounded-card border border-ink-200 bg-white">
        <table className="min-w-[860px] w-full border-collapse text-left text-sm">
          <thead className="bg-ink-50 text-xs uppercase text-ink-500">
            <tr>
              <th className="px-4 py-3">Program</th>
              <th className="px-4 py-3">Tuition</th>
              <th className="px-4 py-3">Entry flexibility</th>
              <th className="px-4 py-3">Pathway</th>
              <th className="px-4 py-3">Delivery</th>
              <th className="px-4 py-3">Fit</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {shortlisted.map((programme) => (
              <tr key={programme.id} className="border-t border-ink-200">
                <td className="px-4 py-4">
                  <Link
                    href={`/programmes/${programme.id}`}
                    className="font-extrabold text-ink-900 hover:text-brand-700"
                  >
                    {programme.name}
                  </Link>
                  <p className="mt-1 text-xs font-semibold text-ink-500">
                    {programme.school}
                  </p>
                </td>
                <td className="px-4 py-4 font-bold">
                  ${programme.annualTuition.toLocaleString()}
                </td>
                <td className="px-4 py-4 font-bold">
                  {programme.acceptanceRate}%
                </td>
                <td className="px-4 py-4">
                  {PROGRAMME_PATHWAY_LABELS[programme.pathway]}
                </td>
                <td className="px-4 py-4">{programme.delivery}</td>
                <td className="px-4 py-4">
                  <Badge tone="success">{programme.matchScore}%</Badge>
                </td>
                <td className="px-4 py-4">
                  <button
                    type="button"
                    onClick={() => removeProgramme(programme.id)}
                    className="inline-flex min-h-10 items-center rounded-card border border-ink-300 bg-white px-3 text-sm font-semibold text-ink-700 transition-colors hover:border-danger-600 hover:text-danger-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
