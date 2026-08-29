import 'server-only';

import {
  PersistenceConflictError,
  readVersionedScholarScoutData,
  writeVersionedScholarScoutData,
  type ScholarScoutData,
} from '@/lib/server/data-store';
import type { CampusNote } from '@/lib/campus-community';

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

export interface PendingReviewCampusNote {
  noteId: string;
  schoolSlug: string;
  uploaderUsername: string | null;
  programId: string | null;
  excerpt: string;
  reportedAt: string;
}

export type CampusNoteModerationResult =
  | { status: 'reported' | 'restored' | 'removed' }
  | { status: 'conflict' };

/** Moves a public note into review and creates one stable, private review record. */
export async function reportCampusNoteForReview(input: {
  noteId: string;
  reporterId: string;
}): Promise<CampusNoteModerationResult> {
  return transitionCampusNote(input.noteId, (data, note) => {
    if (note.status === 'pending-review') return { status: 'reported' };
    if (note.status !== 'public') return { status: 'conflict' };

    note.status = 'pending-review';
    const reviews = data.campusNoteReviews ?? [];
    const reviewId = `campus-note-review:${note.id}`;
    if (!reviews.some((review) => review.id === reviewId)) {
      data.campusNoteReviews = [
        ...reviews,
        {
          id: reviewId,
          note_id: note.id,
          reporter_id: input.reporterId,
          created_at: new Date().toISOString(),
        },
      ];
    }
    return { status: 'reported' };
  });
}

/** Lists only pending-review notes through a deliberately identity-safe staff DTO. */
export async function listPendingReviewCampusNotes(
  limit = 50,
): Promise<PendingReviewCampusNote[]> {
  const data = await readVersionedScholarScoutData();
  return (data.data.campusNotes ?? [])
    .filter((note) => note.status === 'pending-review')
    .sort((left, right) => right.created_at.localeCompare(left.created_at))
    .slice(0, Math.min(Math.max(limit, 1), 50))
    .map((note) => {
      const review = (data.data.campusNoteReviews ?? []).find(
        (candidate) => candidate.note_id === note.id,
      );
      return {
        noteId: note.id,
        schoolSlug: note.school_slug,
        uploaderUsername: note.uploader_username,
        programId: note.program_id,
        excerpt: note.body.slice(0, 500),
        reportedAt: review?.created_at ?? note.created_at,
      };
    });
}

export async function restorePendingReviewCampusNote(
  noteId: string,
): Promise<CampusNoteModerationResult> {
  return transitionCampusNote(noteId, (_data, note) => {
    if (note.status !== 'pending-review') return { status: 'conflict' };
    note.status = 'public';
    return { status: 'restored' };
  });
}

export async function removePendingReviewCampusNote(
  noteId: string,
): Promise<CampusNoteModerationResult> {
  return transitionCampusNote(noteId, (_data, note) => {
    if (note.status !== 'pending-review') return { status: 'conflict' };
    note.status = 'removed';
    return { status: 'removed' };
  });
}

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

async function transitionCampusNote(
  noteId: string,
  transition: (data: ScholarScoutData, note: CampusNote) => CampusNoteModerationResult,
): Promise<CampusNoteModerationResult> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const snapshot = await readVersionedScholarScoutData();
    const note = (snapshot.data.campusNotes ?? []).find((candidate) => candidate.id === noteId);
    if (!note) return { status: 'conflict' };

    const initialStatus = note.status;
    const result = transition(snapshot.data, note);
    if (result.status === 'conflict') return result;
    if (result.status === 'reported' && initialStatus === 'pending-review') return result;
    const write = await writeVersionedScholarScoutData(snapshot.data, snapshot.version);
    if (write.status === 'applied') return result;
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
