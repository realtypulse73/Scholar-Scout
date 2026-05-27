import type { Programme } from '@/lib/programmes';

export type AidType =
  | 'pell-grant'
  | 'institutional-grant'
  | 'work-study'
  | 'state-grant'
  | 'need-based-scholarship'
  | 'merit-scholarship'
  | 'employer-tuition-help';

export const AID_TYPE_LABELS: Record<AidType, string> = {
  'pell-grant': 'Pell Grant',
  'institutional-grant': 'School grant',
  'work-study': 'Work-study',
  'state-grant': 'State grant',
  'need-based-scholarship': 'Need-based scholarship',
  'merit-scholarship': 'Merit scholarship',
  'employer-tuition-help': 'Employer tuition help',
};

export interface AffordabilitySignal {
  label: string;
  description: string;
  tone: 'success' | 'brand' | 'warning';
}

export interface DeadlineSignal {
  label: string;
  date: string;
  formatted: string;
  soon: boolean;
}

/**
 * Format an ISO date string (YYYY-MM-DD) into a readable label.
 * Returns "Rolling" when no date is supplied.
 */
export function formatDeadline(dateStr: string | undefined): string {
  if (!dateStr) return 'Rolling';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Returns true when a deadline is within daysWindow calendar days from today.
 */
export function isDeadlineSoon(
  dateStr: string | undefined,
  daysWindow = 60,
): boolean {
  if (!dateStr) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  const deadline = new Date(year, month - 1, day);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffDays =
    (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= daysWindow;
}

/**
 * Build deadline signals for a programme (application + aid).
 */
export function getDeadlineSignals(programme: Programme): DeadlineSignal[] {
  const signals: DeadlineSignal[] = [];

  if (programme.applicationDeadline) {
    signals.push({
      label: 'Apply by',
      date: programme.applicationDeadline,
      formatted: formatDeadline(programme.applicationDeadline),
      soon: isDeadlineSoon(programme.applicationDeadline),
    });
  }

  if (programme.aidDeadline) {
    signals.push({
      label: 'Aid deadline',
      date: programme.aidDeadline,
      formatted: formatDeadline(programme.aidDeadline),
      soon: isDeadlineSoon(programme.aidDeadline),
    });
  }

  return signals;
}

/**
 * Build human-readable aid signals from a programme's aidTypes list.
 */
export function getAidSignals(programme: Programme): AffordabilitySignal[] {
  if (!programme.aidTypes?.length) return [];

  return programme.aidTypes.map((type) => {
    const label = AID_TYPE_LABELS[type];

    if (type === 'pell-grant') {
      return {
        label,
        description: 'Federal grant — does not need to be paid back.',
        tone: 'success' as const,
      };
    }
    if (type === 'work-study') {
      return {
        label,
        description: 'Earn money toward your costs through campus work.',
        tone: 'brand' as const,
      };
    }
    if (type === 'employer-tuition-help') {
      return {
        label,
        description: 'Your employer may pay part of the cost. Ask HR first.',
        tone: 'brand' as const,
      };
    }
    return {
      label,
      description: 'Ask the school how to apply for this aid.',
      tone: 'success' as const,
    };
  });
}

/**
 * Return a plain-language cost summary for a programme.
 */
export function getCostSummary(programme: Programme): string {
  const tuition = programme.annualTuition;

  if (tuition <= 4000) {
    return 'This is one of the lower-cost options. Still ask about fees and books.';
  }
  if (tuition <= 7000) {
    return 'Mid-range cost. Aid, grants, or work-study could lower what you pay.';
  }
  if (tuition <= 12000) {
    return 'Higher cost. Check what aid is available before you rule it out.';
  }
  return 'This has a higher annual cost. Aid and scholarships can make a big difference.';
}
