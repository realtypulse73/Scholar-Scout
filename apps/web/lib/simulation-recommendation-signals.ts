import type { Programme } from '@/lib/programmes';
import type { SimulationRunResult } from '@/lib/career-simulations';

export const SIMULATION_RESULTS_STORAGE_KEY = 'scholarscout.simulation-results';

export interface SimulationRecommendationSignal {
  boost: number;
  reasons: string[];
  clarityScore: number;
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
  });

  return {
    boost: Math.min(20, boost),
    reasons: Array.from(new Set(reasons)).slice(0, 3),
    clarityScore,
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
