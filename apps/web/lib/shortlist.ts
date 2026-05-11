import type { Programme } from '@/lib/programmes';

export const SHORTLIST_STORAGE_KEY = 'scholarscout.shortlist';
export const SHORTLIST_PLAN_STORAGE_KEY = 'scholarscout.shortlistPlan';

export type ShortlistDecisionTone = 'success' | 'warning' | 'neutral';
export type ShortlistPlanStatus =
  | 'considering'
  | 'contacted'
  | 'visit-planned'
  | 'ready-to-apply';

export interface ShortlistDecisionSignal {
  label: string;
  value: string;
  tone: ShortlistDecisionTone;
}

export interface ShortlistDecisionSummary {
  programme: Programme;
  signals: ShortlistDecisionSignal[];
  strengths: string[];
  cautions: string[];
  nextStep: string;
}

export interface ShortlistProgrammePlan {
  status: ShortlistPlanStatus;
  note: string;
}

export type ShortlistPlanMap = Record<string, ShortlistProgrammePlan>;

export const SHORTLIST_PLAN_STATUS_LABELS: Record<ShortlistPlanStatus, string> = {
  considering: 'Considering',
  contacted: 'Contacted',
  'visit-planned': 'Visit planned',
  'ready-to-apply': 'Ready to apply',
};

const defaultPlan: ShortlistProgrammePlan = {
  status: 'considering',
  note: '',
};

export function normalizeShortlistIds(ids: string[]) {
  return Array.from(new Set(ids.filter(Boolean))).sort();
}

export function parseShortlist(value: string | null) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? normalizeShortlistIds(
          parsed.filter((item): item is string => typeof item === 'string'),
        )
      : [];
  } catch {
    return [];
  }
}

export function parseShortlistPlans(value: string | null): ShortlistPlanMap {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);

    if (!isRecord(parsed)) {
      return {};
    }

    return Object.entries(parsed).reduce<ShortlistPlanMap>(
      (plans, [programmeId, plan]) => {
        if (!isRecord(plan)) {
          return plans;
        }

        plans[programmeId] = normalizeShortlistPlan(plan);
        return plans;
      },
      {},
    );
  } catch {
    return {};
  }
}

export function getShortlistPlan(
  plans: ShortlistPlanMap,
  programmeId: string,
): ShortlistProgrammePlan {
  return plans[programmeId] ?? defaultPlan;
}

export function updateShortlistPlan(
  plans: ShortlistPlanMap,
  programmeId: string,
  nextPlan: Partial<ShortlistProgrammePlan>,
): ShortlistPlanMap {
  return {
    ...plans,
    [programmeId]: normalizeShortlistPlan({
      ...getShortlistPlan(plans, programmeId),
      ...nextPlan,
    }),
  };
}

export function pruneShortlistPlans(
  plans: ShortlistPlanMap,
  shortlistIds: string[],
): ShortlistPlanMap {
  const allowedIds = new Set(normalizeShortlistIds(shortlistIds));

  return Object.entries(plans).reduce<ShortlistPlanMap>(
    (nextPlans, [programmeId, plan]) => {
      if (allowedIds.has(programmeId)) {
        nextPlans[programmeId] = plan;
      }

      return nextPlans;
    },
    {},
  );
}

export function toggleShortlistId(ids: string[], programmeId: string) {
  const normalized = normalizeShortlistIds(ids);

  if (normalized.includes(programmeId)) {
    return normalized.filter((id) => id !== programmeId);
  }

  return normalizeShortlistIds([...normalized, programmeId]);
}

export function isShortlisted(ids: string[], programmeId: string) {
  return normalizeShortlistIds(ids).includes(programmeId);
}

export function getShortlistedProgrammes(
  ids: string[],
  programmes: Programme[],
) {
  const normalized = normalizeShortlistIds(ids);

  return normalized
    .map((id) => programmes.find((programme) => programme.id === id))
    .filter((programme): programme is Programme => Boolean(programme));
}

export function getProgrammeDecisionSummary(
  programme: Programme,
): ShortlistDecisionSummary {
  const signals = getProgrammeDecisionSignals(programme);
  const strengths = signals
    .filter((signal) => signal.tone === 'success')
    .map((signal) => signal.label);
  const cautions = signals
    .filter((signal) => signal.tone === 'warning')
    .map((signal) => signal.label);

  return {
    programme,
    signals,
    strengths,
    cautions,
    nextStep:
      programme.nextSteps[0] ??
      'Contact the programme team to confirm admissions, costs, and support options.',
  };
}

export function getShortlistDecisionSummaries(programmes: Programme[]) {
  return programmes
    .map(getProgrammeDecisionSummary)
    .sort((a, b) => {
      const bScore = getDecisionScore(b.signals);
      const aScore = getDecisionScore(a.signals);

      if (bScore !== aScore) {
        return bScore - aScore;
      }

      return b.programme.matchScore - a.programme.matchScore;
    });
}

export function getShortlistDecisionHeadline(programmes: Programme[]) {
  if (programmes.length === 0) {
    return 'Save programmes to build a decision guide.';
  }

  const summaries = getShortlistDecisionSummaries(programmes);
  const strongest = summaries[0];
  const cautionCount = summaries.reduce(
    (count, summary) => count + summary.cautions.length,
    0,
  );

  if (cautionCount === 0) {
    return `${strongest.programme.name} currently has the clearest practical fit.`;
  }

  return `${strongest.programme.name} is the strongest starting point, with ${cautionCount} item${cautionCount === 1 ? '' : 's'} to verify across the shortlist.`;
}

function getProgrammeDecisionSignals(
  programme: Programme,
): ShortlistDecisionSignal[] {
  return [
    {
      label: 'Cost',
      value: getCostSignalValue(programme.annualTuition),
      tone: getCostSignalTone(programme.annualTuition),
    },
    {
      label: 'Access',
      value:
        programme.acceptanceRate >= 95
          ? 'Open-access friendly'
          : `${programme.acceptanceRate}% entry flexibility`,
      tone: programme.acceptanceRate >= 85 ? 'success' : 'neutral',
    },
    {
      label: 'Support',
      value:
        programme.support.length >= 3
          ? `${programme.support.length} support options`
          : `${programme.support.length} support option${programme.support.length === 1 ? '' : 's'}`,
      tone: programme.support.length >= 3 ? 'success' : 'neutral',
    },
    {
      label: 'Readiness',
      value:
        programme.nextSteps.length >= 3
          ? 'Next steps are specific'
          : 'Confirm next steps',
      tone: programme.nextSteps.length >= 3 ? 'success' : 'warning',
    },
  ];
}

function getCostSignalValue(annualTuition: number) {
  if (annualTuition <= 5000) {
    return 'Lower annual cost';
  }

  if (annualTuition <= 9000) {
    return 'Moderate annual cost';
  }

  return 'Higher annual cost';
}

function getCostSignalTone(annualTuition: number): ShortlistDecisionTone {
  if (annualTuition <= 5000) {
    return 'success';
  }

  if (annualTuition > 12000) {
    return 'warning';
  }

  return 'neutral';
}

function getDecisionScore(signals: ShortlistDecisionSignal[]) {
  return signals.reduce((score, signal) => {
    if (signal.tone === 'success') {
      return score + 2;
    }

    if (signal.tone === 'warning') {
      return score - 1;
    }

    return score;
  }, 0);
}

function normalizeShortlistPlan(input: Partial<ShortlistProgrammePlan>) {
  return {
    status: isPlanStatus(input.status) ? input.status : defaultPlan.status,
    note: typeof input.note === 'string' ? input.note.slice(0, 500) : '',
  };
}

function isPlanStatus(value: unknown): value is ShortlistPlanStatus {
  return (
    value === 'considering' ||
    value === 'contacted' ||
    value === 'visit-planned' ||
    value === 'ready-to-apply'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
