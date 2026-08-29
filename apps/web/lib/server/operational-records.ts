import 'server-only';

import {
  PersistenceConflictError,
  readVersionedScholarScoutData,
  writeVersionedScholarScoutData,
  type ScholarScoutData,
} from '@/lib/server/data-store';

export interface OperationalMutationPolicy {
  name: string;
  retry: 'stable-id-append-once' | 'never';
}

export const OPERATIONAL_MUTATION_POLICIES = {
  privilegedAuditAppend: { name: 'privileged-audit-append', retry: 'stable-id-append-once' },
  recoveryLifecycleAppend: { name: 'recovery-lifecycle-append', retry: 'stable-id-append-once' },
  recoveryOutcomeAppend: { name: 'recovery-outcome-append', retry: 'stable-id-append-once' },
  feedInteractionAppend: { name: 'feed-interaction-append', retry: 'stable-id-append-once' },
  analyticsAppend: { name: 'analytics-append', retry: 'stable-id-append-once' },
  referralAppend: { name: 'referral-append', retry: 'stable-id-append-once' },
  shareAppend: { name: 'share-append', retry: 'stable-id-append-once' },
  guestLifecycleRegistration: { name: 'guest-lifecycle-registration', retry: 'never' },
  guestMigration: { name: 'guest-migration', retry: 'never' },
  incidentHoldReplacement: { name: 'incident-hold-replacement', retry: 'never' },
  communityMutation: { name: 'community-mutation', retry: 'never' },
  outcomeMetricsReplacement: { name: 'outcome-metrics-replacement', retry: 'never' },
  simulationReplacement: { name: 'simulation-replacement', retry: 'never' },
  memoryReplacement: { name: 'memory-replacement', retry: 'never' },
  decisionReplacement: { name: 'decision-replacement', retry: 'never' },
} as const satisfies Record<string, OperationalMutationPolicy>;

export async function appendOperationalRecord<T extends { id: string }>(input: {
  policy: OperationalMutationPolicy;
  collection: string;
  record: T;
}): Promise<T> {
  if (input.policy.retry !== 'stable-id-append-once' || !input.record.id) {
    if (input.policy.retry === 'stable-id-append-once') {
      throw new Error('Retryable operational appends require a stable event ID.');
    }
    return applyOperationalReplacement(input.policy, (data) => {
      appendUnique(data, input.collection, input.record);
      return input.record;
    });
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const snapshot = await readVersionedScholarScoutData();
    if (!appendUnique(snapshot.data, input.collection, input.record)) {
      return input.record;
    }
    const result = await writeVersionedScholarScoutData(snapshot.data, snapshot.version);
    if (result.status === 'applied') return input.record;
  }
  throw new PersistenceConflictError();
}

export async function applyOperationalReplacement<T>(
  policy: OperationalMutationPolicy,
  mutate: (data: ScholarScoutData) => T,
): Promise<T> {
  return commitMutation({ ...policy, retry: 'never' }, mutate);
}

async function commitMutation<T>(
  policy: OperationalMutationPolicy,
  mutate: (data: ScholarScoutData) => T,
): Promise<T> {
  const attempts = policy.retry === 'stable-id-append-once' ? 2 : 1;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const snapshot = await readVersionedScholarScoutData();
    const value = mutate(snapshot.data);
    const result = await writeVersionedScholarScoutData(snapshot.data, snapshot.version);
    if (result.status === 'applied') return value;
  }
  throw new PersistenceConflictError();
}

function appendUnique<T extends { id: string }>(
  data: ScholarScoutData,
  collection: string,
  record: T,
): boolean {
  const target = data as unknown as Record<string, T[] | undefined>;
  const records = target[collection] ?? [];
  if (records.some((candidate) => candidate.id === record.id)) return false;
  target[collection] = [...records, record];
  return true;
}
