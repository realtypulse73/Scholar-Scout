import type { Programme } from '@/lib/programmes';
import type {
  SimulationDecisionTrait,
  SimulationRunResult,
} from '@/lib/career-simulations';

export const SIMULATION_RESULTS_STORAGE_KEY = 'scholarscout.simulation-results';

export interface SimulationRecommendationSignal {
  boost: number;
  reasons: string[];
  clarityScore: number;
  nextSteps: string[];
}

export type SimulationResultMap = Record<string, SimulationRunResult>;

export function parseSimulationResults(value: string | null): SimulationResultMap {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    if (isSimulationRunResult(parsed)) {
      return {
        [parsed.simulationId]: parsed,
      };
    }

    return Object.entries(parsed).reduce<SimulationResultMap>((results, [key, result]) => {
      if (isSimulationRunResult(result)) {
        results[key] = result;
      }

      return results;
    }, {});
  } catch {
    return {};
  }
}

export function serializeSimulationResult(
  current: SimulationResultMap,
  result: SimulationRunResult,
) {
  return JSON.stringify({
    ...current,
    [result.simulationId]: result,
  });
}

export function getSimulationRecommendationSignal(
  programme: Programme,
  simulationResults: SimulationResultMap,
): SimulationRecommendationSignal {
  const results = Object.values(simulationResults);
  const reasons: string[] = [];
  const nextSteps: string[] = [];
  let boost = 0;
  let clarityScore = 0;

  results.forEach((result) => {
    clarityScore = Math.max(clarityScore, result.clarityScore);

    const interestOverlap = programme.interests.filter((interest) =>
      result.recommendedInterests.includes(interest),
    );
    const pathwayOverlap = result.recommendedPathways.includes(programme.pathway);

    if (interestOverlap.length > 0) {
      const points = Math.min(8, interestOverlap.length * 4);
      boost += points;
      reasons.push(
        `Boosted by simulation interest signal: ${interestOverlap
          .map((interest) => interest.replace('-', ' '))
          .join(', ')}.`,
      );
    }

    if (pathwayOverlap) {
      boost += 10;
      reasons.push('Boosted because this programme pathway matches a completed simulation result.');
    }

    if (result.score >= 80 && (interestOverlap.length > 0 || pathwayOverlap)) {
      boost += 5;
      reasons.push('Boosted because the student scored strongly in a related career simulation.');
    }

    const traitSignal = getTraitSignal(programme, result.dominantTraits);

    if (traitSignal.points > 0) {
      boost += traitSignal.points;
      reasons.push(traitSignal.reason);
    }

    if (result.clarityScore >= 80 && (traitSignal.points > 0 || pathwayOverlap)) {
      boost += 4;
      reasons.push('Boosted because the student showed high clarity in a related simulation.');
    }

    nextSteps.push(...result.nextActions);
  });

  return {
    boost: Math.min(20, boost),
    reasons: Array.from(new Set(reasons)).slice(0, 3),
    clarityScore,
    nextSteps: Array.from(new Set(nextSteps)).slice(0, 4),
  };
}

function getTraitSignal(
  programme: Programme,
  traits: SimulationDecisionTrait[],
) {
  const traitPoints = traits.reduce((points, trait) => {
    if (trait === 'hands-on' && programme.pathway !== 'online-degree') {
      return points + 3;
    }

    if (trait === 'analytical' && programme.interests.some((interest) => ['stem', 'technology'].includes(interest))) {
      return points + 4;
    }

    if (trait === 'service-oriented' && programme.interests.includes('healthcare')) {
      return points + 4;
    }

    if (trait === 'communication' && programme.support.includes('career-counseling')) {
      return points + 2;
    }

    if (trait === 'safety-minded' && programme.interests.some((interest) => ['trades', 'healthcare'].includes(interest))) {
      return points + 3;
    }

    if (trait === 'detail-focused' && programme.interests.some((interest) => ['technology', 'stem', 'healthcare'].includes(interest))) {
      return points + 3;
    }

    if (trait === 'collaborative' && programme.delivery !== 'Online') {
      return points + 2;
    }

    if (trait === 'pressure-ready' && programme.pathway !== '4-year-university') {
      return points + 2;
    }

    return points;
  }, 0);

  if (traitPoints === 0) {
    return { points: 0, reason: '' };
  }

  return {
    points: Math.min(10, traitPoints),
    reason: `Boosted by simulation traits: ${traits
      .map((trait) => trait.replace('-', ' '))
      .join(', ')}.`,
  };
}

function isSimulationRunResult(value: unknown): value is SimulationRunResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const result = value as Partial<SimulationRunResult>;

  return (
    typeof result.simulationId === 'string' &&
    typeof result.score === 'number' &&
    typeof result.clarityScore === 'number' &&
    Array.isArray(result.dominantTraits) &&
    Array.isArray(result.insights) &&
    Array.isArray(result.recommendedInterests) &&
    Array.isArray(result.recommendedPathways) &&
    Array.isArray(result.nextActions)
  );
}
