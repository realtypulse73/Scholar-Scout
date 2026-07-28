import 'server-only';

import {
  getMemory,
  getRecommendationsForUser,
} from '@/lib/server/platform-store';

const MAX_CONTEXT_CHARACTERS = 2_000;
const MAX_MEMORY_CHARACTERS = 600;
const MAX_PROGRAMME_NAME_CHARACTERS = 120;
const MAX_RECOMMENDATION_CHARACTERS = 360;

export interface AdvisorContextRecommendation {
  name: string;
  explanation: string;
}

export interface AdvisorContext {
  summary: string;
  recommendations: AdvisorContextRecommendation[];
}

/**
 * Builds a compact context from the resolved actor only. The browser never
 * supplies this content, recommendation ranking, or storage owner.
 */
export async function buildAdvisorContext(input: {
  storageKey: string;
}): Promise<AdvisorContext> {
  const [memory, rankedRecommendations] = await Promise.all([
    getMemory(input.storageKey),
    getRecommendationsForUser(input.storageKey),
  ]);
  const recommendations = rankedRecommendations.slice(0, 3).map((recommendation) => ({
    name: truncate(recommendation.programme.name, MAX_PROGRAMME_NAME_CHARACTERS),
    explanation: truncate(
      recommendation.explanation.join(' '),
      MAX_RECOMMENDATION_CHARACTERS,
    ),
  }));
  const summaryParts = [
    `Student planning stage: ${memory.stage}.`,
    `Approved memory summary: ${truncate(memory.summary, MAX_MEMORY_CHARACTERS)}`,
    ...recommendations.map(
      (recommendation, index) =>
        `Recommendation ${index + 1}: ${recommendation.name}. Why it may fit: ${recommendation.explanation}`,
    ),
  ];

  return {
    summary: truncate(summaryParts.join('\n'), MAX_CONTEXT_CHARACTERS),
    recommendations,
  };
}

function truncate(value: string, maximum: number): string {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.length <= maximum
    ? normalized
    : `${normalized.slice(0, Math.max(0, maximum - 1)).trimEnd()}…`;
}
