import type { Programme } from '@/lib/programmes';

export type FeedContentType = 'video' | 'voice';
export type StudentStage = 'exploring' | 'comparing' | 'ready';
export type AnalyticsArea =
  | 'feed'
  | 'simulation'
  | 'recommendation'
  | 'advisor'
  | 'creator'
  | 'referral'
  | 'share'
  | 'notification'
  | 'admin';

export interface FeedItem {
  id: string;
  type: FeedContentType;
  title: string;
  creatorUsername: string;
  pathway: string;
  programmeId: string;
  durationSeconds: number;
  mediaUrl: string;
  transcript: string;
  tags: string[];
}

export interface SimulationChoice {
  id: string;
  label: string;
  score: number;
  feedback: string;
  boosts: string[];
}

export interface SimulationScenario {
  id: string;
  title: string;
  prompt: string;
  choices: SimulationChoice[];
}

export interface Simulation {
  id: string;
  title: string;
  pathway: string;
  programmeIds: string[];
  scenarios: SimulationScenario[];
}

export interface SimulationAnswer {
  scenarioId: string;
  choiceId: string;
}

export interface SimulationScore {
  score: number;
  maxScore: number;
  clarityScore: number;
  boosts: string[];
  feedback: string[];
}

export interface Recommendation {
  programme: Programme;
  score: number;
  explanation: string[];
}

export interface CreatorProfile {
  username: string;
  displayName: string;
  pathway: string;
  stats: {
    followers: number;
    completions: number;
    averageWatchSeconds: number;
  };
  clarityScore: number;
  bio: string;
  tags: string[];
}

export interface VariantAssignment {
  experimentId: string;
  variant: string;
}

export interface DecisionLogEntry {
  id: string;
  createdAt: string;
  targetId: string;
  action: 'boost' | 'remove' | 'observe';
  reason: string;
}

export const feedItems: FeedItem[] = [
  {
    id: 'feed-health-day',
    type: 'video',
    title: 'A day in an allied health lab',
    creatorUsername: 'maya-health',
    pathway: 'Healthcare',
    programmeId: 'north-valley-health',
    durationSeconds: 48,
    mediaUrl:
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    transcript:
      'Students practice patient intake, lab safety, and teamwork before clinical placement.',
    tags: ['healthcare', 'hands-on', 'local'],
  },
  {
    id: 'feed-cyber-voice',
    type: 'voice',
    title: 'What cybersecurity students really practice',
    creatorUsername: 'devon-cyber',
    pathway: 'Technology',
    programmeId: 'metro-cybersecurity',
    durationSeconds: 36,
    mediaUrl:
      'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
    transcript:
      'The first projects are usually password hygiene, network basics, and incident response habits.',
    tags: ['technology', 'certificate', 'online'],
  },
  {
    id: 'feed-business-transfer',
    type: 'video',
    title: 'How a two-year transfer plan stays affordable',
    creatorUsername: 'lena-transfer',
    pathway: 'Business',
    programmeId: 'lakeside-business-transfer',
    durationSeconds: 42,
    mediaUrl:
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    transcript:
      'A transfer pathway can keep costs lower while preserving the option to finish a four-year degree.',
    tags: ['business', 'transfer', 'budget'],
  },
];

export const simulations: Simulation[] = [
  {
    id: 'career-fit-lab',
    title: 'Career fit lab',
    pathway: 'Healthcare and technology',
    programmeIds: ['north-valley-health', 'metro-cybersecurity'],
    scenarios: [
      {
        id: 'daily-work',
        title: 'Daily work style',
        prompt: 'Which task sounds most energizing for a typical Tuesday?',
        choices: [
          {
            id: 'people-care',
            label: 'Helping people directly through a practical process',
            score: 3,
            feedback: 'Strong fit for support-heavy and healthcare pathways.',
            boosts: ['healthcare', 'support'],
          },
          {
            id: 'systems',
            label: 'Solving a technical puzzle with clear evidence',
            score: 3,
            feedback: 'Strong fit for technical and cybersecurity pathways.',
            boosts: ['technology', 'certificate'],
          },
          {
            id: 'unclear',
            label: 'I am not sure yet',
            score: 1,
            feedback: 'Exploration is still useful; keep sampling short paths.',
            boosts: ['exploring'],
          },
        ],
      },
      {
        id: 'pressure',
        title: 'Pressure check',
        prompt: 'When a deadline gets tight, what support would help most?',
        choices: [
          {
            id: 'mentor',
            label: 'A mentor or instructor who checks in',
            score: 3,
            feedback: 'Look for programmes with advising and tutoring depth.',
            boosts: ['support', 'local'],
          },
          {
            id: 'flex',
            label: 'Flexible schedule and online materials',
            score: 2,
            feedback: 'Hybrid or online options may reduce friction.',
            boosts: ['online'],
          },
          {
            id: 'team',
            label: 'A peer team with shared goals',
            score: 2,
            feedback: 'Cohort-based programmes may help you persist.',
            boosts: ['community'],
          },
        ],
      },
    ],
  },
];

export const creatorProfiles: CreatorProfile[] = [
  {
    username: 'maya-health',
    displayName: 'Maya R.',
    pathway: 'Allied Health',
    stats: { followers: 1240, completions: 318, averageWatchSeconds: 31 },
    clarityScore: 91,
    bio: 'Shows students what healthcare training feels like before they apply.',
    tags: ['healthcare', 'student-life', 'labs'],
  },
  {
    username: 'devon-cyber',
    displayName: 'Devon K.',
    pathway: 'Cybersecurity',
    stats: { followers: 980, completions: 227, averageWatchSeconds: 29 },
    clarityScore: 88,
    bio: 'Breaks technical pathways into beginner-friendly practice missions.',
    tags: ['technology', 'certificates', 'career-ready'],
  },
  {
    username: 'lena-transfer',
    displayName: 'Lena S.',
    pathway: 'Business Transfer',
    stats: { followers: 760, completions: 184, averageWatchSeconds: 26 },
    clarityScore: 84,
    bio: 'Explains lower-cost transfer strategies for undecided students.',
    tags: ['business', 'transfer', 'budget'],
  },
];

export function scoreSimulation(
  simulation: Simulation,
  answers: SimulationAnswer[],
): SimulationScore {
  const answerMap = new Map(
    answers.map((answer) => [answer.scenarioId, answer.choiceId]),
  );
  const choices = simulation.scenarios.flatMap((scenario) => scenario.choices);
  const maxScore = simulation.scenarios.length * 3;
  const selected = simulation.scenarios
    .map((scenario) =>
      scenario.choices.find((choice) => choice.id === answerMap.get(scenario.id)),
    )
    .filter(Boolean) as SimulationChoice[];
  const score = selected.reduce((total, choice) => total + choice.score, 0);
  const boosts = Array.from(
    new Set(selected.flatMap((choice) => choice.boosts)),
  );
  const feedback = selected.map((choice) => choice.feedback);
  const clarityScore = Math.round((score / Math.max(maxScore, 1)) * 100);

  return {
    score,
    maxScore,
    clarityScore,
    boosts: boosts.length > 0 ? boosts : choices[0]?.boosts ?? [],
    feedback,
  };
}

export function rankRecommendations(input: {
  programmes: Programme[];
  simulationBoosts?: string[];
  feedTags?: string[];
}): Recommendation[] {
  const boosts = new Set([
    ...(input.simulationBoosts ?? []),
    ...(input.feedTags ?? []),
  ]);

  return input.programmes
    .map((programme) => {
      const explanation: string[] = [];
      let score = programme.matchScore;

      if (boosts.has(programme.pathway)) {
        score += 8;
        explanation.push(`Simulation interest boosted ${programme.pathway}.`);
      }

      const supportHits = programme.support.filter((service) =>
        boosts.has(service),
      );

      if (supportHits.length > 0) {
        score += supportHits.length * 4;
        explanation.push('Support signals matched your recent activity.');
      }

      if (boosts.has('online') && programme.delivery !== 'Campus') {
        score += 5;
        explanation.push('Flexible delivery matched your simulation choice.');
      }

      if (explanation.length === 0) {
        explanation.push('Baseline fit comes from programme access, cost, and support profile.');
      }

      return {
        programme,
        score: Math.min(100, score),
        explanation,
      };
    })
    .sort((left, right) => right.score - left.score);
}

export function getStudentStage(eventCount: number, simulationCount: number) {
  if (simulationCount > 0 && eventCount >= 6) {
    return 'ready' satisfies StudentStage;
  }

  if (eventCount >= 3 || simulationCount > 0) {
    return 'comparing' satisfies StudentStage;
  }

  return 'exploring' satisfies StudentStage;
}

export function assignVariant(userKey: string, experimentId: string): VariantAssignment {
  const total = Array.from(`${experimentId}:${userKey}`).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  );

  return {
    experimentId,
    variant: total % 2 === 0 ? 'A' : 'B',
  };
}

export function runDecisionEngine(input: {
  feed: FeedItem[];
  watchSecondsByFeedId: Record<string, number>;
  skipsByFeedId: Record<string, number>;
}): DecisionLogEntry[] {
  return input.feed.map((item) => {
    const watchSeconds = input.watchSecondsByFeedId[item.id] ?? 0;
    const skips = input.skipsByFeedId[item.id] ?? 0;

    if (watchSeconds >= item.durationSeconds * 2 && skips <= 1) {
      return {
        id: `${item.id}-boost`,
        createdAt: new Date().toISOString(),
        targetId: item.id,
        action: 'boost',
        reason: 'High watch time and low skip count.',
      };
    }

    if (skips >= 4 && watchSeconds < item.durationSeconds) {
      return {
        id: `${item.id}-remove`,
        createdAt: new Date().toISOString(),
        targetId: item.id,
        action: 'remove',
        reason: 'Repeated skips with low watch time.',
      };
    }

    return {
      id: `${item.id}-observe`,
      createdAt: new Date().toISOString(),
      targetId: item.id,
      action: 'observe',
      reason: 'Insufficient signal for automatic action.',
    };
  });
}
