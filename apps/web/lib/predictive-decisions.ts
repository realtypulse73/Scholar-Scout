import type { Programme } from '@/lib/programmes';
import type { OnboardingData } from '@/lib/onboarding-types';
import type { ShortlistPlanMap, ShortlistPlanStatus } from '@/lib/shortlist';
import {
  getAdaptiveRecommendations,
  type AdaptiveProgrammeRecommendation,
} from '@/lib/adaptive-recommendations';

export type DecisionStage =
  | 'exploring'
  | 'comparing'
  | 'leaning'
  | 'ready-to-act';

export type DecisionRisk = 'low' | 'medium' | 'high';

export interface PredictiveDecisionContext {
  profile: OnboardingData | null;
  shortlistIds: string[];
  plans: ShortlistPlanMap;
}

export interface ProgrammeDecisionPrediction {
  programme: Programme;
  adaptiveScore: number;
  choiceProbability: number;
  decisionStage: DecisionStage;
  decisionRisk: DecisionRisk;
  confidence: number;
  likelyNextAction: string;
  whyLikely: string[];
  risks: string[];
}

const STATUS_STAGE: Record<ShortlistPlanStatus, DecisionStage> = {
  considering: 'comparing',
  contacted: 'leaning',
  'visit-planned': 'leaning',
  'ready-to-apply': 'ready-to-act',
};

export function predictProgrammeDecisions(
  programmes: Programme[],
  context: PredictiveDecisionContext,
): ProgrammeDecisionPrediction[] {
  const adaptive = getAdaptiveRecommendations(programmes, context);
  const maxScore = Math.max(...adaptive.map((item) => item.adaptiveScore), 1);
  const shortlistMomentum = getShortlistMomentum(context);

  return adaptive
    .map((recommendation) =>
      buildPrediction(recommendation, context, maxScore, shortlistMomentum),
    )
    .sort(
      (a, b) =>
        b.choiceProbability - a.choiceProbability ||
        b.adaptiveScore - a.adaptiveScore ||
        a.programme.annualTuition - b.programme.annualTuition,
    );
}

export function getPredictedDecisionSummary(
  predictions: ProgrammeDecisionPrediction[],
) {
  const top = predictions[0];

  if (!top) {
    return 'Complete onboarding and save programmes to generate a decision prediction.';
  }

  if (top.decisionStage === 'ready-to-act') {
    return `${top.programme.name} is the clearest ready-to-act pathway right now.`;
  }

  if (top.decisionStage === 'leaning') {
    return `The student appears to be leaning toward ${top.programme.name}.`;
  }

  if (top.decisionStage === 'comparing') {
    return `${top.programme.name} leads the comparison set, but the student is still evaluating options.`;
  }

  return `${top.programme.name} is the strongest early exploration signal.`;
}

function buildPrediction(
  recommendation: AdaptiveProgrammeRecommendation,
  context: PredictiveDecisionContext,
  maxScore: number,
  shortlistMomentum: number,
): ProgrammeDecisionPrediction {
  const { programme, fit, adaptiveScore, signals } = recommendation;
  const plan = context.plans[programme.id];
  const shortlisted = context.shortlistIds.includes(programme.id);
  const stage = getDecisionStage(shortlisted, plan?.status, adaptiveScore);
  const risks = getDecisionRisks(recommendation, context);
  const probability = getChoiceProbability({
    adaptiveScore,
    maxScore,
    shortlisted,
    planStatus: plan?.status,
    hasNote: Boolean(plan?.note.trim()),
    shortlistMomentum,
    riskCount: risks.length,
  });

  return {
    programme,
    adaptiveScore,
    choiceProbability: probability,
    decisionStage: stage,
    decisionRisk: getDecisionRisk(risks.length, fit?.cautions.length ?? 0),
    confidence: getConfidence(shortlisted, plan?.status, signals.length, Boolean(context.profile)),
    likelyNextAction: getLikelyNextAction(stage, programme, risks),
    whyLikely: getWhyLikely(recommendation, shortlisted, plan?.status),
    risks,
  };
}

function getChoiceProbability(input: {
  adaptiveScore: number;
  maxScore: number;
  shortlisted: boolean;
  planStatus?: ShortlistPlanStatus;
  hasNote: boolean;
  shortlistMomentum: number;
  riskCount: number;
}) {
  const relativeStrength = input.adaptiveScore / input.maxScore;
  let probability = 12 + relativeStrength * 38;

  if (input.shortlisted) {
    probability += 14;
  }

  if (input.planStatus) {
    probability += getPlanMomentum(input.planStatus);
  }

  if (input.hasNote) {
    probability += 6;
  }

  probability += Math.min(10, input.shortlistMomentum);
  probability -= Math.min(12, input.riskCount * 4);

  return Math.min(95, Math.max(5, Math.round(probability)));
}

function getPlanMomentum(status: ShortlistPlanStatus) {
  switch (status) {
    case 'ready-to-apply':
      return 24;
    case 'visit-planned':
      return 18;
    case 'contacted':
      return 12;
    case 'considering':
    default:
      return 5;
  }
}

function getShortlistMomentum(context: PredictiveDecisionContext) {
  return context.shortlistIds.reduce((score, id) => {
    const plan = context.plans[id];
    if (!plan) {
      return score + 1;
    }

    return score + 1 + Math.round(getPlanMomentum(plan.status) / 6);
  }, 0);
}

function getDecisionStage(
  shortlisted: boolean,
  status: ShortlistPlanStatus | undefined,
  adaptiveScore: number,
): DecisionStage {
  if (status) {
    return STATUS_STAGE[status];
  }

  if (shortlisted) {
    return 'comparing';
  }

  if (adaptiveScore >= 82) {
    return 'exploring';
  }

  return 'exploring';
}

function getDecisionRisks(
  recommendation: AdaptiveProgrammeRecommendation,
  context: PredictiveDecisionContext,
) {
  const risks = new Set<string>();

  recommendation.fit?.cautions.forEach((caution) => risks.add(caution));

  if (context.profile && !context.shortlistIds.includes(recommendation.programme.id)) {
    risks.add('Student has not saved this programme yet, so intent is still weak.');
  }

  if (recommendation.programme.annualTuition > 9000) {
    risks.add('Higher annual cost should be checked against aid and scholarship options.');
  }

  if (recommendation.programme.support.length < 2) {
    risks.add('Support services may need confirmation before this becomes a primary option.');
  }

  return Array.from(risks).slice(0, 4);
}

function getDecisionRisk(riskCount: number, cautionCount: number): DecisionRisk {
  if (riskCount + cautionCount >= 4) {
    return 'high';
  }

  if (riskCount + cautionCount >= 2) {
    return 'medium';
  }

  return 'low';
}

function getConfidence(
  shortlisted: boolean,
  status: ShortlistPlanStatus | undefined,
  signalCount: number,
  hasProfile: boolean,
) {
  let confidence = hasProfile ? 40 : 20;

  if (shortlisted) {
    confidence += 20;
  }

  if (status) {
    confidence += getPlanMomentum(status);
  }

  confidence += Math.min(15, signalCount * 3);

  return Math.min(95, confidence);
}

function getLikelyNextAction(
  stage: DecisionStage,
  programme: Programme,
  risks: string[],
) {
  if (stage === 'ready-to-act') {
    return programme.nextSteps[0] ?? 'Prepare application materials and confirm the deadline.';
  }

  if (stage === 'leaning') {
    return risks[0]
      ? `Resolve this before moving forward: ${risks[0]}`
      : 'Schedule a direct admissions or advising conversation.';
  }

  if (stage === 'comparing') {
    return 'Compare this option against two alternatives using cost, support, and outcome route.';
  }

  return 'Save or dismiss this option to help ScholarScout learn from the student’s intent.';
}

function getWhyLikely(
  recommendation: AdaptiveProgrammeRecommendation,
  shortlisted: boolean,
  status: ShortlistPlanStatus | undefined,
) {
  const reasons = new Set<string>();

  if (shortlisted) {
    reasons.add('The student saved this programme.');
  }

  if (status) {
    reasons.add(`Planning status shows ${status.replace('-', ' ')} momentum.`);
  }

  recommendation.signals
    .slice(0, 3)
    .forEach((signal) => reasons.add(signal.message));

  if (recommendation.fit?.reasons[0]) {
    reasons.add(recommendation.fit.reasons[0]);
  }

  return Array.from(reasons).slice(0, 4);
}
