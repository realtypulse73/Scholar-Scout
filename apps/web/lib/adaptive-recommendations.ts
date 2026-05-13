import type { OnboardingData } from '@/lib/onboarding-types';
import type { Programme } from '@/lib/programmes';
import {
  getRankedProgrammeMatches,
  type ProgrammeFitExplanation,
} from '@/lib/preference-matching';
import {
  type ShortlistPlanMap,
  type ShortlistPlanStatus,
} from '@/lib/shortlist';

export type AdaptiveSignalType =
  | 'shortlisted'
  | 'plan-status'
  | 'planning-note'
  | 'similarity'
  | 'fit-score';

export interface AdaptiveRecommendationContext {
  profile: OnboardingData | null;
  shortlistIds: string[];
  plans: ShortlistPlanMap;
}

export interface AdaptiveRecommendationSignal {
  type: AdaptiveSignalType;
  points: number;
  message: string;
}

export interface AdaptiveProgrammeRecommendation {
  programme: Programme;
  fit: ProgrammeFitExplanation | null;
  adaptiveScore: number;
  rankReason: string;
  signals: AdaptiveRecommendationSignal[];
}

const PLAN_STATUS_POINTS: Record<ShortlistPlanStatus, number> = {
  considering: 4,
  contacted: 8,
  'visit-planned': 12,
  'ready-to-apply': 18,
};

export function getAdaptiveRecommendations(
  programmes: Programme[],
  context: AdaptiveRecommendationContext,
): AdaptiveProgrammeRecommendation[] {
  const baseMatches = context.profile
    ? getRankedProgrammeMatches(programmes, context.profile)
    : programmes.map((programme) => ({
        programme,
        fit: null,
      }));

  return baseMatches
    .map(({ programme, fit }) => {
      const signals = getAdaptiveSignals(programme, fit, programmes, context);
      const baseScore = fit?.score ?? programme.matchScore;
      const adaptiveScore = clampScore(
        baseScore + signals.reduce((sum, signal) => sum + signal.points, 0),
      );

      return {
        programme,
        fit,
        adaptiveScore,
        rankReason: getRankReason(programme, fit, signals),
        signals,
      };
    })
    .sort(
      (a, b) =>
        b.adaptiveScore - a.adaptiveScore ||
        (b.fit?.score ?? b.programme.matchScore) -
          (a.fit?.score ?? a.programme.matchScore) ||
        a.programme.annualTuition - b.programme.annualTuition,
    );
}

function getAdaptiveSignals(
  programme: Programme,
  fit: ProgrammeFitExplanation | null,
  programmes: Programme[],
  context: AdaptiveRecommendationContext,
): AdaptiveRecommendationSignal[] {
  const signals: AdaptiveRecommendationSignal[] = [];
  const plan = context.plans[programme.id];
  const shortlisted = context.shortlistIds.includes(programme.id);

  if (shortlisted) {
    signals.push({
      type: 'shortlisted',
      points: 10,
      message: 'Boosted because the student saved this programme.',
    });
  }

  if (plan) {
    signals.push({
      type: 'plan-status',
      points: PLAN_STATUS_POINTS[plan.status],
      message: `Boosted because planning status is ${plan.status.replace('-', ' ')}.`,
    });

    if (plan.note.trim().length >= 20) {
      signals.push({
        type: 'planning-note',
        points: 5,
        message: 'Boosted because the student added planning notes.',
      });
    }
  }

  const similarityBoost = getSimilarityBoost(programme, programmes, context.shortlistIds);
  if (similarityBoost > 0) {
    signals.push({
      type: 'similarity',
      points: similarityBoost,
      message: 'Boosted because it resembles programmes the student already saved.',
    });
  }

  if (fit && fit.score >= 85) {
    signals.push({
      type: 'fit-score',
      points: 5,
      message: 'Boosted because baseline personal fit is excellent.',
    });
  }

  return signals;
}

function getSimilarityBoost(
  programme: Programme,
  programmes: Programme[],
  shortlistIds: string[],
) {
  if (shortlistIds.length === 0 || shortlistIds.includes(programme.id)) {
    return 0;
  }

  const shortlistedProgrammes = programmes.filter((candidate) =>
    shortlistIds.includes(candidate.id),
  );

  const similarity = shortlistedProgrammes.reduce((score, saved) => {
    const pathwayScore = saved.pathway === programme.pathway ? 3 : 0;
    const interestScore = programme.interests.filter((interest) =>
      saved.interests.includes(interest),
    ).length;
    const supportScore = programme.support.filter((support) =>
      saved.support.includes(support),
    ).length > 0 ? 1 : 0;

    return Math.max(score, pathwayScore + interestScore + supportScore);
  }, 0);

  return Math.min(8, similarity * 2);
}

function getRankReason(
  programme: Programme,
  fit: ProgrammeFitExplanation | null,
  signals: AdaptiveRecommendationSignal[],
) {
  const strongestSignal = [...signals].sort((a, b) => b.points - a.points)[0];

  if (strongestSignal) {
    return strongestSignal.message;
  }

  if (fit?.reasons[0]) {
    return fit.reasons[0];
  }

  return `${programme.name} is ranked from ScholarScout baseline programme fit.`;
}

function clampScore(score: number) {
  return Math.min(100, Math.max(0, Math.round(score)));
}
