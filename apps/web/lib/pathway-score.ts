import {
  assessOutcomeEvidence,
  type OutcomeProfile,
} from '@/lib/outcome-profiles';

export interface PathwayBarrier {
  id:
    | 'unmet-prerequisite'
    | 'unaffordable-aid-gap'
    | 'unworkable-commute'
    | 'required-test-missing'
    | 'required-support-unavailable'
    | 'other';
  label: string;
  severity: 'blocking' | 'major' | 'minor';
}

export interface CalibratedOutcomePrediction {
  model_type: 'calibrated-logistic-regression';
  model_version: string;
  validated_through: string;
  completion_probability: number | null;
  placement_probability: number | null;
}

export interface RecommendedPathwayInput {
  outcomeProfile: OutcomeProfile | null;
  prediction: CalibratedOutcomePrediction | null;
  affordabilityFit: number;
  logisticsFeasibility: number;
  supportAvailability: number;
  barriers: PathwayBarrier[];
}

export interface RecommendedPathwayScore {
  score: number | null;
  isEligible: boolean;
  barrierPenalty: number;
  missingEvidence: Array<
    'outcomeProfile' | 'completionProbability' | 'placementProbability'
  >;
  evidenceIssues: string[];
  explanation: string[];
}

const WEIGHTS = {
  completion: 0.3,
  placement: 0.25,
  affordability: 0.15,
  logistics: 0.15,
  support: 0.15,
} as const;

/**
 * Scores a pathway only when outcome probabilities are backed by measured data.
 * This function deliberately does not derive completion or placement likelihood
 * from protected traits, campus incident reports, or a missing GPA/test score.
 */
export function scoreRecommendedPathway(
  input: RecommendedPathwayInput,
): RecommendedPathwayScore {
  const missingEvidence: RecommendedPathwayScore['missingEvidence'] = [];
  const evidence = assessOutcomeEvidence(input.outcomeProfile);

  if (!input.outcomeProfile || !evidence.isEligibleForPathwayScore) {
    missingEvidence.push('outcomeProfile');
  }

  if (input.prediction?.completion_probability === null || !input.prediction) {
    missingEvidence.push('completionProbability');
  }

  if (input.prediction?.placement_probability === null || !input.prediction) {
    missingEvidence.push('placementProbability');
  }

  const blockingBarriers = input.barriers.filter(
    (barrier) => barrier.severity === 'blocking',
  );
  const barrierPenalty = getBarrierPenalty(input.barriers);

  if (blockingBarriers.length > 0) {
    return {
      score: null,
      isEligible: false,
      barrierPenalty,
      missingEvidence,
      evidenceIssues: evidence.reasons,
      explanation: [
        'This path is not ranked until blocking requirements are resolved.',
        ...blockingBarriers.map((barrier) => barrier.label),
      ],
    };
  }

  if (missingEvidence.length > 0) {
    return {
      score: null,
      isEligible: true,
      barrierPenalty,
      missingEvidence,
      evidenceIssues: evidence.reasons,
      explanation: [
        'Current, high-confidence program outcomes and separately calibrated predictions are required before ScholarScout presents a combined pathway score.',
      ],
    };
  }

  const completionProbability = input.prediction?.completion_probability;
  const placementProbability = input.prediction?.placement_probability;

  if (
    completionProbability === null ||
    completionProbability === undefined ||
    placementProbability === null ||
    placementProbability === undefined
  ) {
    throw new Error('Outcome probability evidence must be present before scoring.');
  }

  const weightedScore =
    normalize(completionProbability) * WEIGHTS.completion +
    normalize(placementProbability) * WEIGHTS.placement +
    normalize(input.affordabilityFit) * WEIGHTS.affordability +
    normalize(input.logisticsFeasibility) * WEIGHTS.logistics +
    normalize(input.supportAvailability) * WEIGHTS.support;

  return {
    score: Math.max(0, Math.round(weightedScore - barrierPenalty)),
      isEligible: true,
      barrierPenalty,
      missingEvidence,
      evidenceIssues: evidence.reasons,
    explanation: [
      `Completion likelihood contributes ${WEIGHTS.completion * 100}% of the score.`,
      `Placement likelihood contributes ${WEIGHTS.placement * 100}% of the score.`,
      `Predictions come from calibrated logistic-regression model ${input.prediction?.model_version}.`,
      'Affordability, logistics, and support each contribute 15%.',
      barrierPenalty > 0
        ? `${barrierPenalty} points were removed for unresolved barriers.`
        : 'No unresolved barrier penalty was applied.',
    ],
  };
}

function getBarrierPenalty(barriers: PathwayBarrier[]) {
  return Math.min(
    25,
    barriers.reduce((total, barrier) => {
      if (barrier.severity === 'major') {
        return total + 10;
      }

      if (barrier.severity === 'minor') {
        return total + 4;
      }

      return total;
    }, 0),
  );
}

function normalize(value: number) {
  return Math.min(100, Math.max(0, value));
}
