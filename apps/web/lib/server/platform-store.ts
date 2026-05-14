import 'server-only';

import { randomUUID } from 'crypto';
import {
  readScholarScoutData,
  writeScholarScoutData,
  type ScholarScoutData,
} from '@/lib/server/data-store';
import {
  feedItems,
  getStudentStage,
  rankRecommendations,
  runDecisionEngine,
  scoreSimulation,
  simulations,
  type AnalyticsArea,
  type DecisionLogEntry,
  type SimulationAnswer,
} from '@/lib/platform';
import { getGovernedProgrammes } from '@/lib/server/programme-records';

export interface FeedInteractionRecord {
  id: string;
  userKey: string;
  feedItemId: string;
  watchSeconds: number;
  skipped: boolean;
  createdAt: string;
}

export interface SimulationResultRecord {
  id: string;
  userKey: string;
  simulationId: string;
  score: number;
  maxScore: number;
  clarityScore: number;
  boosts: string[];
  feedback: string[];
  createdAt: string;
}

export interface MemoryRecord {
  id: string;
  userKey: string;
  stage: 'exploring' | 'comparing' | 'ready';
  summary: string;
  createdAt: string;
}

export interface ReferralRecord {
  id: string;
  referrer: string;
  code: string;
  converted: boolean;
  createdAt: string;
}

export interface ShareRecord {
  id: string;
  userKey: string;
  targetType: 'programme' | 'creator' | 'feed';
  targetId: string;
  deepLink: string;
  createdAt: string;
}

export interface AnalyticsEventRecord {
  id: string;
  area: AnalyticsArea;
  name: string;
  userKey: string;
  metadata: Record<string, string | number | boolean>;
  createdAt: string;
}

export interface PlatformData extends ScholarScoutData {
  feedInteractions?: FeedInteractionRecord[];
  simulationResults?: SimulationResultRecord[];
  memoryRecords?: MemoryRecord[];
  referralRecords?: ReferralRecord[];
  shareRecords?: ShareRecord[];
  analyticsEvents?: AnalyticsEventRecord[];
  decisionLogs?: DecisionLogEntry[];
}

export async function readPlatformData(): Promise<PlatformData> {
  const data = (await readScholarScoutData()) as PlatformData;

  return {
    ...data,
    feedInteractions: data.feedInteractions ?? [],
    simulationResults: data.simulationResults ?? [],
    memoryRecords: data.memoryRecords ?? [],
    referralRecords: data.referralRecords ?? [],
    shareRecords: data.shareRecords ?? [],
    analyticsEvents: data.analyticsEvents ?? [],
    decisionLogs: data.decisionLogs ?? [],
  };
}

export async function appendFeedInteraction(input: {
  userKey: string;
  feedItemId: string;
  watchSeconds: number;
  skipped: boolean;
}) {
  const data = await readPlatformData();
  const record: FeedInteractionRecord = {
    id: randomUUID(),
    userKey: input.userKey,
    feedItemId: input.feedItemId,
    watchSeconds: Math.max(0, Math.round(input.watchSeconds)),
    skipped: input.skipped,
    createdAt: new Date().toISOString(),
  };

  data.feedInteractions = [...(data.feedInteractions ?? []), record];
  await writeScholarScoutData(data);
  await updateMemory(input.userKey);

  return record;
}

export async function saveSimulationResult(input: {
  userKey: string;
  simulationId: string;
  answers: SimulationAnswer[];
}) {
  const simulation = simulations.find((item) => item.id === input.simulationId);

  if (!simulation) {
    throw new Error('Simulation not found.');
  }

  const result = scoreSimulation(simulation, input.answers);
  const data = await readPlatformData();
  const record: SimulationResultRecord = {
    id: randomUUID(),
    userKey: input.userKey,
    simulationId: input.simulationId,
    score: result.score,
    maxScore: result.maxScore,
    clarityScore: result.clarityScore,
    boosts: result.boosts,
    feedback: result.feedback,
    createdAt: new Date().toISOString(),
  };

  data.simulationResults = [...(data.simulationResults ?? []), record];
  await writeScholarScoutData(data);
  await updateMemory(input.userKey);

  return record;
}

export async function getRecommendationsForUser(userKey: string) {
  const data = await readPlatformData();
  const programmes = await getGovernedProgrammes();
  const latestSimulation = [...(data.simulationResults ?? [])]
    .reverse()
    .find((result) => result.userKey === userKey);
  const feedTags = (data.feedInteractions ?? [])
    .filter((record) => record.userKey === userKey && !record.skipped)
    .flatMap((record) =>
      feedItems.find((item) => item.id === record.feedItemId)?.tags ?? [],
    );

  return rankRecommendations({
    programmes,
    simulationBoosts: latestSimulation?.boosts ?? [],
    feedTags,
  });
}

export async function appendAnalyticsEvent(input: {
  area: AnalyticsArea;
  name: string;
  userKey: string;
  metadata?: Record<string, string | number | boolean>;
}) {
  const data = await readPlatformData();
  const event: AnalyticsEventRecord = {
    id: randomUUID(),
    area: input.area,
    name: input.name,
    userKey: input.userKey,
    metadata: input.metadata ?? {},
    createdAt: new Date().toISOString(),
  };

  data.analyticsEvents = [...(data.analyticsEvents ?? []), event];
  await writeScholarScoutData(data);

  return event;
}

export async function createReferral(referrer: string) {
  const data = await readPlatformData();
  const code = `${referrer.replace(/[^a-z0-9]/gi, '').slice(0, 10) || 'scout'}-${randomUUID().slice(0, 8)}`.toLowerCase();
  const record: ReferralRecord = {
    id: randomUUID(),
    referrer,
    code,
    converted: false,
    createdAt: new Date().toISOString(),
  };

  data.referralRecords = [...(data.referralRecords ?? []), record];
  await writeScholarScoutData(data);

  return record;
}

export async function trackShare(input: {
  userKey: string;
  targetType: ShareRecord['targetType'];
  targetId: string;
}) {
  const data = await readPlatformData();
  const deepLink = `https://scholarscout.app/share/${input.targetType}/${input.targetId}`;
  const record: ShareRecord = {
    id: randomUUID(),
    userKey: input.userKey,
    targetType: input.targetType,
    targetId: input.targetId,
    deepLink,
    createdAt: new Date().toISOString(),
  };

  data.shareRecords = [...(data.shareRecords ?? []), record];
  await writeScholarScoutData(data);

  return record;
}

export async function updateMemory(userKey: string) {
  const data = await readPlatformData();
  const eventCount = (data.feedInteractions ?? []).filter(
    (record) => record.userKey === userKey,
  ).length;
  const simulationCount = (data.simulationResults ?? []).filter(
    (record) => record.userKey === userKey,
  ).length;
  const stage = getStudentStage(eventCount, simulationCount);
  const summary = `Student is ${stage}; ${eventCount} feed interactions and ${simulationCount} simulations recorded.`;
  const memory: MemoryRecord = {
    id: randomUUID(),
    userKey,
    stage,
    summary,
    createdAt: new Date().toISOString(),
  };

  data.memoryRecords = [
    ...(data.memoryRecords ?? []).filter((record) => record.userKey !== userKey),
    memory,
  ];
  await writeScholarScoutData(data);

  return memory;
}

export async function getMemory(userKey: string) {
  const data = await readPlatformData();
  return (
    [...(data.memoryRecords ?? [])]
      .reverse()
      .find((record) => record.userKey === userKey) ??
    (await updateMemory(userKey))
  );
}

export async function runAndStoreDecisions() {
  const data = await readPlatformData();
  const watchSecondsByFeedId: Record<string, number> = {};
  const skipsByFeedId: Record<string, number> = {};

  for (const record of data.feedInteractions ?? []) {
    watchSecondsByFeedId[record.feedItemId] =
      (watchSecondsByFeedId[record.feedItemId] ?? 0) + record.watchSeconds;

    if (record.skipped) {
      skipsByFeedId[record.feedItemId] =
        (skipsByFeedId[record.feedItemId] ?? 0) + 1;
    }
  }

  const decisions = runDecisionEngine({
    feed: feedItems,
    watchSecondsByFeedId,
    skipsByFeedId,
  });

  data.decisionLogs = decisions;
  await writeScholarScoutData(data);

  return decisions;
}

export async function getPlatformMetrics() {
  const data = await readPlatformData();
  const decisions = data.decisionLogs?.length
    ? data.decisionLogs
    : await runAndStoreDecisions();

  return {
    feedInteractions: data.feedInteractions?.length ?? 0,
    simulationsCompleted: data.simulationResults?.length ?? 0,
    referrals: data.referralRecords?.length ?? 0,
    shares: data.shareRecords?.length ?? 0,
    analyticsEvents: data.analyticsEvents?.length ?? 0,
    memoryRecords: data.memoryRecords?.length ?? 0,
    boostedContent: decisions.filter((decision) => decision.action === 'boost')
      .length,
    removedContent: decisions.filter((decision) => decision.action === 'remove')
      .length,
    decisions,
  };
}
