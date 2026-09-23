import 'server-only';

import { randomUUID } from 'node:crypto';
import {
  CATALOGUE_CHECKLIST_DISCLOSURE,
  createEmptyCataloguePublicationState,
  evaluateCatalogueChecklist,
  getCatalogueSnapshotDigest,
  getWeeklyReleasePeriodKey,
  isWithinNormalWeeklyReleaseWindow,
  parseCatalogueCandidateImport,
  type CatalogueCandidate,
  type CatalogueCandidateImportChange,
  type CatalogueCandidateInput,
  type CataloguePublicationAuditAction,
  type CataloguePublicationCapability,
  type CataloguePublicationState,
  type CataloguePublishedRecord,
  type CatalogueSnapshot,
  type CatalogueSnapshotKind,
  type CatalogueSnapshotManifest,
} from '@/lib/catalogue-publication';
import type { ActiveStaffActor } from '@/lib/server/active-staff';
import { readScholarScoutData } from '@/lib/server/data-store';
import { commitConditionalMutation } from '@/lib/server/persistence-operations';

export class CataloguePublicationConflictError extends Error {
  constructor() {
    super('Catalogue publication changed before the draft could be staged.');
    this.name = 'CataloguePublicationConflictError';
  }
}

export class CatalogueCandidateRevisionConflictError extends Error {
  constructor() {
    super('catalogue-candidate-revision-conflict');
    this.name = 'CatalogueCandidateRevisionConflictError';
  }
}

export class CatalogueCandidateOwnershipError extends Error {
  constructor() {
    super('catalogue-candidate-owner-required');
    this.name = 'CatalogueCandidateOwnershipError';
  }
}

export class CatalogueCandidateImportError extends Error {
  constructor() {
    super('catalogue-candidate-import-invalid');
    this.name = 'CatalogueCandidateImportError';
  }
}

export class CatalogueCandidateReviewError extends Error {
  constructor() {
    super('catalogue-candidate-review-forbidden');
    this.name = 'CatalogueCandidateReviewError';
  }
}

export class CatalogueCandidateConflictReasonError extends Error {
  constructor() {
    super('catalogue-candidate-conflict-reason-required');
    this.name = 'CatalogueCandidateConflictReasonError';
  }
}

export class CatalogueCandidateChecklistError extends Error {
  constructor() {
    super('catalogue-candidate-checklist-failed');
    this.name = 'CatalogueCandidateChecklistError';
  }
}

export class CatalogueReleaseScheduleError extends Error {
  constructor(readonly code: 'outside-release-window' | 'weekly-period-already-published') {
    super(code);
    this.name = 'CatalogueReleaseScheduleError';
  }
}

export class CatalogueReleaseAuthorizationError extends Error {
  constructor() {
    super('catalogue-release-forbidden');
    this.name = 'CatalogueReleaseAuthorizationError';
  }
}

export class CatalogueReleaseSelectionError extends Error {
  constructor() {
    super('catalogue-release-selection-invalid');
    this.name = 'CatalogueReleaseSelectionError';
  }
}

export async function resolveCatalogueCandidateConflict(input: {
  actor: ActiveStaffActor;
  candidateId: string;
  expectedRevision: number;
  attempted: { title?: unknown; claimBoundary?: unknown };
  choices: { title?: unknown; claimBoundary?: unknown };
  reason?: unknown;
  now?: Date;
}): Promise<
  | { status: 'conflict'; conflict: CatalogueCandidateConflictDto }
  | { status: 'resolved'; candidate: CatalogueCandidate }
> {
  if (!hasCapability(input.actor, 'editor')) throw new CatalogueCandidateReviewError();
  if (!boundedStableId(input.candidateId) || !isExpectedRevision(input.expectedRevision)) {
    throw new CatalogueCandidateRevisionConflictError();
  }

  const current = await getCandidateForConflict(input.candidateId);
  if (!current || current.creatorId !== input.actor.id || current.revision !== input.expectedRevision) {
    return {
      status: 'conflict',
      conflict: toCandidateConflictDto(current, input.expectedRevision, input.attempted),
    };
  }

  const attempted = normalizeConflictAttempt(input.attempted);
  const choices = normalizeConflictChoices(input.choices);
  const retainsOlderValue = (choices.title === 'attempted' && attempted.title !== current.title)
    || (choices.claimBoundary === 'attempted' && attempted.claimBoundary !== current.claimBoundary);
  const reason = normalizeReason(input.reason);
  if (retainsOlderValue && !reason) throw new CatalogueCandidateConflictReasonError();

  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const result = await commitConditionalMutation((data) => {
    const state = normalizeCataloguePublicationState(data.cataloguePublicationState);
    const stored = state.candidates.find((candidate) => candidate.id === input.candidateId);
    if (!stored || stored.creatorId !== input.actor.id || stored.revision !== input.expectedRevision) {
      throw new CatalogueCandidateRevisionConflictError();
    }
    const candidateInput = {
      ...stored,
      title: choices.title === 'attempted' ? attempted.title : stored.title,
      claimBoundary: choices.claimBoundary === 'attempted'
        ? attempted.claimBoundary
        : stored.claimBoundary,
    } satisfies CatalogueCandidateInput;
    const candidate: CatalogueCandidate = {
      ...stored,
      title: candidateInput.title ?? stored.title,
      claimBoundary: candidateInput.claimBoundary ?? stored.claimBoundary,
      revision: stored.revision + 1,
      lifecycle: 'draft',
      updatedAt: timestamp,
      checklist: evaluateCatalogueChecklist(candidateInput, now),
      approval: null,
    };
    const staged = replaceCandidate(
      state,
      candidate,
      input.actor,
      timestamp,
      'conflict-resolution',
      'editor',
      reason,
    );
    data.cataloguePublicationState = staged.state;
    return { status: 'resolved' as const, candidate: staged.candidate };
  });
  if (result.status === 'conflict') throw new CataloguePublicationConflictError();
  return result.value;
}

/** Corrects one approved candidate and creates an append-only emergency snapshot. */
export async function publishEmergencyCatalogueSnapshot(input: {
  actor: ActiveStaffActor;
  candidateId: string;
  expectedRevision: number;
  candidate: unknown;
  reason: unknown;
  now?: Date;
}): Promise<{ snapshot: CatalogueSnapshot; manifest: CatalogueSnapshotManifest }> {
  if (!hasCapability(input.actor, 'reviewer')) throw new CatalogueReleaseAuthorizationError();
  const reason = normalizeReason(input.reason);
  const candidateInput = toCandidateInput(input.candidate);
  if (!reason || !boundedStableId(input.candidateId) || !isExpectedRevision(input.expectedRevision)) {
    throw new CatalogueReleaseAuthorizationError();
  }
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const result = await commitConditionalMutation((data) => {
    const state = getReleaseState(data.cataloguePublicationState);
    const existing = state.candidates.find((candidate) => candidate.id === input.candidateId);
    if (!existing || existing.revision !== input.expectedRevision) {
      throw new CatalogueCandidateRevisionConflictError();
    }
    const checklist = evaluateCatalogueChecklist(candidateInput, now);
    if (!checklist.passed) throw new CatalogueCandidateChecklistError();
    const corrected: CatalogueCandidate = {
      ...existing,
      ...candidateInput,
      id: existing.id,
      title: candidateInput.title ?? '',
      regionId: candidateInput.regionId as CatalogueCandidate['regionId'],
      region: candidateInput.region as CatalogueCandidate['region'],
      source: candidateInput.source as CatalogueCandidate['source'],
      facts: candidateInput.facts as CatalogueCandidate['facts'],
      claimBoundary: candidateInput.claimBoundary ?? '',
      revision: existing.revision + 1,
      lifecycle: 'approved',
      updatedAt: timestamp,
      checklist,
      approval: { reviewerId: input.actor.id, reviewedAt: timestamp, revision: existing.revision + 1 },
      retirementIntent: false,
    };
    const staged = replaceCandidate(
      state,
      corrected,
      input.actor,
      timestamp,
      'emergency-correction',
      'reviewer',
      reason,
    );
    const snapshot = appendSnapshot({
      state: getReleaseState(staged.state),
      actor: input.actor,
      kind: 'emergency',
      reason,
      timestamp,
      replaceRecord: toPublishedRecord(corrected, checklist.mediaFallback),
    });
    data.cataloguePublicationState = snapshot.state;
    return { snapshot: snapshot.snapshot, manifest: snapshot.manifest };
  });
  if (result.status === 'conflict') throw new CataloguePublicationConflictError();
  return result.value;
}

/** Restores retained public records by appending a new snapshot; historic state is never repointed. */
export async function restoreCatalogueSnapshot(input: {
  actor: ActiveStaffActor;
  targetSnapshotId: string;
  reason: unknown;
  now?: Date;
}): Promise<{ snapshot: CatalogueSnapshot; manifest: CatalogueSnapshotManifest }> {
  if (!hasCapability(input.actor, 'administrator')) throw new CatalogueReleaseAuthorizationError();
  const reason = normalizeReason(input.reason);
  if (!reason || !boundedStableId(input.targetSnapshotId)) throw new CatalogueReleaseAuthorizationError();
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const result = await commitConditionalMutation((data) => {
    const state = getReleaseState(data.cataloguePublicationState);
    const target = state.snapshots.find((snapshot) => snapshot.id === input.targetSnapshotId);
    if (!target) throw new CatalogueReleaseSelectionError();
    const appended = appendSnapshot({
      state,
      actor: input.actor,
      kind: 'restore',
      reason,
      timestamp,
      restoredFromSnapshotId: target.id,
      records: target.records,
    });
    data.cataloguePublicationState = appended.state;
    return { snapshot: appended.snapshot, manifest: appended.manifest };
  });
  if (result.status === 'conflict') throw new CataloguePublicationConflictError();
  return result.value;
}

export async function publishWeeklyCatalogueSnapshot(input: {
  actor: ActiveStaffActor;
  candidateIds: string[];
  kind?: CatalogueSnapshotKind;
  reason?: string;
  now?: Date;
}): Promise<{
  snapshot: CatalogueSnapshot;
  manifest: CatalogueSnapshotManifest;
  quarantined: CatalogueSnapshotManifest['quarantined'];
}> {
  const kind = input.kind ?? 'weekly';
  authorizeRelease(input.actor, kind, input.reason);
  const candidateIds = normalizeReleaseSelection(input.candidateIds);
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const periodKey = kind === 'weekly' ? getWeeklyReleasePeriodKey(now) : undefined;
  if (kind === 'weekly' && !isWithinNormalWeeklyReleaseWindow(now)) {
    throw new CatalogueReleaseScheduleError('outside-release-window');
  }

  const result = await commitConditionalMutation((data) => {
    const state = getReleaseState(data.cataloguePublicationState);
    if (kind === 'weekly' && state.manifests.some((manifest) => (
      manifest.kind === 'weekly' && manifest.periodKey === periodKey
    ))) {
      throw new CatalogueReleaseScheduleError('weekly-period-already-published');
    }

    const selected = candidateIds.map((id) => state.candidates.find((candidate) => candidate.id === id));
    if (selected.some((candidate) => !candidate || candidate.lifecycle !== 'approved'
      || candidate.approval?.revision !== candidate.revision)) {
      throw new CatalogueReleaseSelectionError();
    }

    const priorSnapshot = state.activeSnapshotId
      ? state.snapshots.find((snapshot) => snapshot.id === state.activeSnapshotId)
      : undefined;
    const records = new Map((priorSnapshot?.records ?? []).map((record) => [record.id, record]));
    const quarantined: CatalogueSnapshotManifest['quarantined'] = [];
    const retired: CatalogueSnapshotManifest['retired'] = [];
    const included: CatalogueSnapshotManifest['included'] = [];
    const candidates = state.candidates.map((candidate) => {
      if (!candidateIds.includes(candidate.id)) return candidate;
      const checklist = evaluateCatalogueChecklist(candidate, now);
      if (!checklist.passed) {
        quarantined.push({
          id: candidate.id,
          revision: candidate.revision,
          correctionCodes: checklist.correctionCodes,
        });
        return {
          ...candidate,
          lifecycle: 'quarantined' as const,
          approval: null,
          updatedAt: timestamp,
          checklist,
        };
      }
      if (candidate.retirementIntent) {
        records.delete(candidate.id);
        retired.push({ id: candidate.id, revision: candidate.revision });
        return candidate;
      }
      records.set(candidate.id, toPublishedRecord(candidate, checklist.mediaFallback));
      included.push({ id: candidate.id, revision: candidate.revision });
      return candidate;
    });
    const orderedRecords = [...records.values()].sort((left, right) => left.id.localeCompare(right.id));
    const sequence = state.snapshots.length + 1;
    const snapshotId = `catalogue-snapshot-${sequence}`;
    const contentDigest = getCatalogueSnapshotDigest(orderedRecords);
    const snapshot: CatalogueSnapshot = {
      id: snapshotId,
      sequence,
      kind,
      releasedAt: timestamp,
      ...(periodKey === undefined ? {} : { periodKey }),
      ...(priorSnapshot === undefined ? {} : { priorSnapshotId: priorSnapshot.id }),
      records: orderedRecords,
      contentDigest,
    };
    const manifest: CatalogueSnapshotManifest = {
      id: `catalogue-manifest-${sequence}`,
      snapshotId,
      sequence,
      kind,
      releasedAt: timestamp,
      ...(periodKey === undefined ? {} : { periodKey }),
      ...(priorSnapshot === undefined ? {} : { priorSnapshotId: priorSnapshot.id }),
      actorId: input.actor.id,
      capability: hasCapability(input.actor, 'administrator') ? 'administrator' : 'reviewer',
      action: 'release',
      outcome: 'published',
      ...(input.reason === undefined ? {} : { reason: input.reason }),
      included: included.sort(compareEntries),
      retired: retired.sort(compareEntries),
      quarantined: quarantined.sort(compareEntries),
      contentDigest,
    };
    data.cataloguePublicationState = {
      ...state,
      candidates,
      snapshots: [...state.snapshots, snapshot],
      manifests: [...state.manifests, manifest],
      activeSnapshotId: snapshot.id,
    };
    return { snapshot, manifest, quarantined: manifest.quarantined };
  });
  if (result.status === 'conflict') throw new CataloguePublicationConflictError();
  return result.value;
}

/** Calculates the exact normal-release outcome without writing a snapshot, audit, or candidate state. */
export async function previewWeeklyCatalogueRelease(input: {
  actor: ActiveStaffActor;
  candidateIds: string[];
  now?: Date;
}): Promise<{
  eligibility: {
    periodKey: string;
    withinWindow: boolean;
    alreadyPublished: boolean;
    eligible: boolean;
  };
  selected: CatalogueSnapshotManifest['included'];
  quarantined: CatalogueSnapshotManifest['quarantined'];
  mediaFallbackIds: string[];
}> {
  authorizeRelease(input.actor, 'weekly', undefined);
  const candidateIds = normalizeReleaseSelection(input.candidateIds);
  const now = input.now ?? new Date();
  const state = getReleaseState((await readScholarScoutData()).cataloguePublicationState);
  const periodKey = getWeeklyReleasePeriodKey(now);
  const withinWindow = isWithinNormalWeeklyReleaseWindow(now);
  const alreadyPublished = state.manifests.some((manifest) => (
    manifest.kind === 'weekly' && manifest.periodKey === periodKey
  ));
  const selectedCandidates = candidateIds.map((id) => state.candidates.find((candidate) => candidate.id === id));
  if (selectedCandidates.some((candidate) => !candidate || candidate.lifecycle !== 'approved'
    || candidate.approval?.revision !== candidate.revision)) {
    throw new CatalogueReleaseSelectionError();
  }

  const selected: CatalogueSnapshotManifest['included'] = [];
  const quarantined: CatalogueSnapshotManifest['quarantined'] = [];
  const mediaFallbackIds: string[] = [];
  for (const candidate of selectedCandidates as CatalogueCandidate[]) {
    const checklist = evaluateCatalogueChecklist(candidate, now);
    if (!checklist.passed) {
      quarantined.push({
        id: candidate.id,
        revision: candidate.revision,
        correctionCodes: checklist.correctionCodes,
      });
      continue;
    }
    selected.push({ id: candidate.id, revision: candidate.revision });
    if (checklist.mediaFallback) mediaFallbackIds.push(candidate.id);
  }

  return {
    eligibility: {
      periodKey,
      withinWindow,
      alreadyPublished,
      eligible: withinWindow && !alreadyPublished,
    },
    selected: selected.sort(compareEntries),
    quarantined: quarantined.sort(compareEntries),
    mediaFallbackIds: mediaFallbackIds.sort(),
  };
}

/** Returns concise staff-only release lineage, never raw candidates or provider-private evidence. */
export async function getCatalogueSnapshotHistory() {
  const state = getReleaseState((await readScholarScoutData()).cataloguePublicationState);
  return state.manifests.map((manifest) => ({
    actor: manifest.actorId,
    capability: manifest.capability,
    action: manifest.action,
    timestamp: manifest.releasedAt,
    outcome: manifest.outcome,
    version: manifest.sequence,
    kind: manifest.kind,
    ...(manifest.periodKey === undefined ? {} : { periodKey: manifest.periodKey }),
    ...(manifest.reason === undefined ? {} : { reason: manifest.reason }),
    correctionStatus: manifest.quarantined.length === 0 ? 'all-selected-passed' : 'quarantined-records',
    reviewStatus: manifest.included.length === 0 && manifest.retired.length > 0
      ? 'retirement-release'
      : 'approved-release',
    lineage: {
      snapshotId: manifest.snapshotId,
      priorSnapshotId: manifest.priorSnapshotId ?? null,
      restoredFromSnapshotId: manifest.restoredFromSnapshotId ?? null,
      contentDigest: manifest.contentDigest,
    },
  }));
}

/** Returns a cloned public snapshot DTO only; it has no provider or candidate lookup path. */
export async function getPublishedCatalogueSnapshot(): Promise<
  | { status: 'empty'; records: [] }
  | { status: 'published'; snapshotId: string; version: number; records: CataloguePublishedRecord[] }
> {
  const state = getReleaseState((await readScholarScoutData()).cataloguePublicationState);
  const active = state.activeSnapshotId
    ? state.snapshots.find((snapshot) => snapshot.id === state.activeSnapshotId)
    : undefined;
  if (!active) return { status: 'empty', records: [] };
  return {
    status: 'published',
    snapshotId: active.id,
    version: active.sequence,
    records: clonePublicRecords(active.records),
  };
}

export async function stageCatalogueCandidate(input: {
  actor: ActiveStaffActor;
  candidate: unknown;
  expectedRevision?: number;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const candidateInput = toCandidateInput(input.candidate);

  const result = await commitConditionalMutation((data) => {
    const state = normalizeCataloguePublicationState(data.cataloguePublicationState);
    const staged = stageOneCandidate({
      state,
      actor: input.actor,
      candidateInput,
      expectedRevision: input.expectedRevision,
      timestamp,
    });
    data.cataloguePublicationState = staged.state;
    return { candidate: staged.candidate, checklist: staged.candidate.checklist };
  });

  if (result.status === 'conflict') throw new CataloguePublicationConflictError();
  return result.value;
}

export async function importCatalogueCandidates(input: {
  actor: ActiveStaffActor;
  envelope: unknown;
  now?: Date;
}) {
  const parsed = parseCatalogueCandidateImport(input.envelope);
  if (!parsed.ok) throw new CatalogueCandidateImportError();

  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const result = await commitConditionalMutation((data) => {
    let state = normalizeCataloguePublicationState(data.cataloguePublicationState);
    const candidates: CatalogueCandidate[] = [];
    for (const change of parsed.changes) {
      const staged = applyImportChange({
        state,
        actor: input.actor,
        change,
        timestamp,
      });
      state = staged.state;
      candidates.push(staged.candidate);
    }
    data.cataloguePublicationState = state;
    return { candidates };
  });

  if (result.status === 'conflict') throw new CataloguePublicationConflictError();
  return result.value;
}

export async function submitCatalogueCandidate(input: {
  actor: ActiveStaffActor;
  candidateId: string;
  expectedRevision: number;
  now?: Date;
}) {
  if (!hasCapability(input.actor, 'editor')) throw new CatalogueCandidateReviewError();
  const timestamp = (input.now ?? new Date()).toISOString();
  const result = await commitConditionalMutation((data) => {
    const state = normalizeCataloguePublicationState(data.cataloguePublicationState);
    const existing = state.candidates.find((candidate) => candidate.id === input.candidateId);
    if (!existing || existing.revision !== input.expectedRevision) {
      throw new CatalogueCandidateRevisionConflictError();
    }
    if (existing.creatorId !== input.actor.id) throw new CatalogueCandidateOwnershipError();

    const candidate: CatalogueCandidate = {
      ...existing,
      lifecycle: 'draft',
      updatedAt: timestamp,
      approval: null,
      checklist: evaluateCatalogueChecklist(existing, new Date(timestamp)),
    };
    const staged = replaceCandidate(state, candidate, input.actor, timestamp, 'submit');
    data.cataloguePublicationState = staged.state;
    return { candidate: staged.candidate, checklist: staged.candidate.checklist };
  });
  if (result.status === 'conflict') throw new CataloguePublicationConflictError();
  return result.value;
}

export async function reviewCatalogueCandidate(input: {
  actor: ActiveStaffActor;
  candidateId: string;
  expectedRevision: number;
  now?: Date;
}) {
  const timestamp = (input.now ?? new Date()).toISOString();
  const result = await commitConditionalMutation((data) => {
    const state = normalizeCataloguePublicationState(data.cataloguePublicationState);
    const existing = state.candidates.find((candidate) => candidate.id === input.candidateId);
    if (!existing || existing.revision !== input.expectedRevision) {
      throw new CatalogueCandidateRevisionConflictError();
    }

    const selfReview = existing.creatorId === input.actor.id;
    const administratorException = selfReview
      && hasCapability(input.actor, 'editor')
      && hasCapability(input.actor, 'administrator');
    if (!administratorException && (!hasCapability(input.actor, 'reviewer') || selfReview)) {
      throw new CatalogueCandidateReviewError();
    }

    const checklist = evaluateCatalogueChecklist(existing, new Date(timestamp));
    const candidate: CatalogueCandidate = checklist.passed
      ? {
        ...existing,
        lifecycle: 'approved',
        updatedAt: timestamp,
        checklist,
        approval: {
          reviewerId: input.actor.id,
          reviewedAt: timestamp,
          revision: existing.revision,
        },
      }
      : {
        ...existing,
        lifecycle: 'draft',
        updatedAt: timestamp,
        checklist,
        approval: null,
      };
    const staged = replaceCandidate(
      state,
      candidate,
      input.actor,
      timestamp,
      checklist.passed ? 'approval' : 'failure',
      administratorException ? 'administrator' : 'reviewer',
    );
    data.cataloguePublicationState = staged.state;
    return { candidate: staged.candidate, checklist: staged.candidate.checklist };
  });
  if (result.status === 'conflict') throw new CataloguePublicationConflictError();
  return result.value;
}

/** Returns only concise staff-review metadata; candidates and raw imports never leave this seam. */
export async function getCatalogueCandidateHistory(candidateId: string) {
  const data = await readScholarScoutData();
  const state = normalizeCataloguePublicationState(data.cataloguePublicationState);
  const candidate = state.candidates.find((item) => item.id === candidateId);
  if (!candidate) return null;

  return {
    candidate: {
      id: candidate.id,
      lifecycle: candidate.lifecycle,
      revision: candidate.revision,
      correctionCodes: candidate.checklist.correctionCodes,
      reviewStatus: candidate.lifecycle,
      checklist: {
        summary: candidate.checklist.summary.map((item) => ({
          category: item.category,
          status: item.status,
        })),
        passMeaning: CATALOGUE_CHECKLIST_DISCLOSURE,
      },
    },
    audit: state.auditEvents
      .filter((event) => event.candidateId === candidateId)
      .map((event) => ({
        actor: event.actorId,
        capability: event.capability,
        action: event.action,
        timestamp: event.timestamp,
        outcome: event.outcome,
        ...(event.reason === undefined ? {} : { reason: event.reason }),
        correctionCodes: event.correctionCodes,
        reviewStatus: event.reviewStatus,
        candidateRevision: event.version,
      })),
  };
}

/** Returns the minimum staff-console lifecycle DTO; it deliberately omits raw candidates and imports. */
export async function getCatalogueCandidateIntake() {
  const state = normalizeCataloguePublicationState((await readScholarScoutData()).cataloguePublicationState);
  return state.candidates
    .map((candidate) => ({
      id: candidate.id,
      title: candidate.title,
      lifecycle: candidate.lifecycle,
      revision: candidate.revision,
      correctionCodes: candidate.checklist.correctionCodes,
      reviewStatus: candidate.lifecycle,
      creatorId: candidate.creatorId,
      reviewerId: candidate.approval?.reviewerId ?? null,
      checklist: {
        summary: candidate.checklist.summary.map((item) => ({
          category: item.category,
          status: item.status,
        })),
        passMeaning: CATALOGUE_CHECKLIST_DISCLOSURE,
      },
      audit: state.auditEvents
        .filter((event) => event.candidateId === candidate.id)
        .map((event) => ({
          actor: event.actorId,
          capability: event.capability,
          action: event.action,
          timestamp: event.timestamp,
          outcome: event.outcome,
          ...(event.reason === undefined ? {} : { reason: event.reason }),
          correctionCodes: event.correctionCodes,
          reviewStatus: event.reviewStatus,
          candidateRevision: event.version,
        })),
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

interface CatalogueCandidateConflictComparable {
  title: string;
  claimBoundary: string;
  regionId: string;
}

interface CatalogueCandidateConflictDto {
  candidateId: string;
  currentRevision: number | null;
  attemptedRevision: number;
  current: CatalogueCandidateConflictComparable | null;
  attempted: CatalogueCandidateConflictComparable;
  mergeChoices: ['current', 'attempted'];
}

async function getCandidateForConflict(candidateId: string): Promise<CatalogueCandidate | null> {
  const state = normalizeCataloguePublicationState((await readScholarScoutData()).cataloguePublicationState);
  return state.candidates.find((candidate) => candidate.id === candidateId) ?? null;
}

function toCandidateConflictDto(
  current: CatalogueCandidate | null,
  attemptedRevision: number,
  attempted: { title?: unknown; claimBoundary?: unknown },
): CatalogueCandidateConflictDto {
  const safeAttempt = normalizeConflictAttempt(attempted);
  return {
    candidateId: current?.id ?? '',
    currentRevision: current?.revision ?? null,
    attemptedRevision,
    current: current ? toComparableCandidate(current) : null,
    attempted: {
      title: safeAttempt.title,
      claimBoundary: safeAttempt.claimBoundary,
      regionId: current?.regionId ?? '',
    },
    mergeChoices: ['current', 'attempted'],
  };
}

function toComparableCandidate(candidate: CatalogueCandidate): CatalogueCandidateConflictComparable {
  return {
    title: candidate.title,
    claimBoundary: candidate.claimBoundary,
    regionId: candidate.regionId,
  };
}

function normalizeConflictAttempt(value: { title?: unknown; claimBoundary?: unknown }): {
  title: string;
  claimBoundary: string;
} {
  return {
    title: boundedText(value.title, 240) ?? '',
    claimBoundary: boundedText(value.claimBoundary, 500) ?? '',
  };
}

function normalizeConflictChoices(value: { title?: unknown; claimBoundary?: unknown }): {
  title: 'current' | 'attempted';
  claimBoundary: 'current' | 'attempted';
} {
  return {
    title: value.title === 'attempted' ? 'attempted' : 'current',
    claimBoundary: value.claimBoundary === 'attempted' ? 'attempted' : 'current',
  };
}

function normalizeReason(value: unknown): string | null {
  const reason = boundedText(value, 500);
  return reason && reason.length >= 8 ? reason : null;
}

function appendSnapshot(input: {
  state: CataloguePublicationState & Required<Pick<CataloguePublicationState,
    'snapshots' | 'manifests' | 'activeSnapshotId'>>;
  actor: ActiveStaffActor;
  kind: 'emergency' | 'restore';
  reason: string;
  timestamp: string;
  replaceRecord?: CataloguePublishedRecord;
  records?: CataloguePublishedRecord[];
  restoredFromSnapshotId?: string;
}): {
  state: CataloguePublicationState;
  snapshot: CatalogueSnapshot;
  manifest: CatalogueSnapshotManifest;
} {
  const priorSnapshot = input.state.activeSnapshotId
    ? input.state.snapshots.find((snapshot) => snapshot.id === input.state.activeSnapshotId)
    : undefined;
  const records = input.records
    ? clonePublicRecords(input.records)
    : [...(priorSnapshot?.records ?? []).filter((record) => record.id !== input.replaceRecord?.id), input.replaceRecord]
      .filter((record): record is CataloguePublishedRecord => Boolean(record));
  const orderedRecords = records.sort((left, right) => left.id.localeCompare(right.id));
  const sequence = input.state.snapshots.length + 1;
  const snapshotId = `catalogue-snapshot-${sequence}`;
  const contentDigest = getCatalogueSnapshotDigest(orderedRecords);
  const snapshot: CatalogueSnapshot = {
    id: snapshotId,
    sequence,
    kind: input.kind,
    releasedAt: input.timestamp,
    ...(priorSnapshot === undefined ? {} : { priorSnapshotId: priorSnapshot.id }),
    ...(input.restoredFromSnapshotId === undefined
      ? {}
      : { restoredFromSnapshotId: input.restoredFromSnapshotId }),
    records: orderedRecords,
    contentDigest,
  };
  const manifest: CatalogueSnapshotManifest = {
    id: `catalogue-manifest-${sequence}`,
    snapshotId,
    sequence,
    kind: input.kind,
    releasedAt: input.timestamp,
    ...(priorSnapshot === undefined ? {} : { priorSnapshotId: priorSnapshot.id }),
    ...(input.restoredFromSnapshotId === undefined
      ? {}
      : { restoredFromSnapshotId: input.restoredFromSnapshotId }),
    actorId: input.actor.id,
    capability: input.kind === 'restore' ? 'administrator' : 'reviewer',
    action: 'release',
    outcome: 'published',
    reason: input.reason,
    included: orderedRecords.map((record) => ({ id: record.id, revision: record.revision })),
    retired: [],
    quarantined: [],
    contentDigest,
  };
  return {
    state: {
      ...input.state,
      snapshots: [...input.state.snapshots, snapshot],
      manifests: [...input.state.manifests, manifest],
      activeSnapshotId: snapshot.id,
    },
    snapshot,
    manifest,
  };
}

function applyImportChange(input: {
  state: CataloguePublicationState;
  actor: ActiveStaffActor;
  change: CatalogueCandidateImportChange;
  timestamp: string;
}): { state: CataloguePublicationState; candidate: CatalogueCandidate } {
  const existing = input.state.candidates.find((candidate) => candidate.id === input.change.id);
  if (input.change.action === 'retire') {
    if (!existing || existing.revision !== input.change.expectedRevision) {
      throw new CatalogueCandidateRevisionConflictError();
    }
    if (existing.creatorId !== input.actor.id) throw new CatalogueCandidateOwnershipError();

    const candidate: CatalogueCandidate = {
      ...existing,
      revision: existing.revision + 1,
      lifecycle: 'draft',
      updatedAt: input.timestamp,
      approval: null,
      retirementIntent: true,
    };
    return replaceCandidate(input.state, candidate, input.actor, input.timestamp, 'edit');
  }

  return stageOneCandidate({
    state: input.state,
    actor: input.actor,
    candidateInput: toCandidateInput(input.change.candidate),
    expectedRevision: input.change.expectedRevision,
    timestamp: input.timestamp,
  });
}

function stageOneCandidate(input: {
  state: CataloguePublicationState;
  actor: ActiveStaffActor;
  candidateInput: CatalogueCandidateInput;
  expectedRevision?: number;
  timestamp: string;
}): { state: CataloguePublicationState; candidate: CatalogueCandidate } {
  const id = input.candidateInput.id ?? `catalogue:${randomUUID()}`;
  const existing = input.state.candidates.find((candidate) => candidate.id === id);
  if (existing && input.expectedRevision !== existing.revision) {
    throw new CatalogueCandidateRevisionConflictError();
  }
  if (existing && existing.creatorId !== input.actor.id) throw new CatalogueCandidateOwnershipError();

  const checklist = evaluateCatalogueChecklist(input.candidateInput, new Date(input.timestamp));
  const candidate: CatalogueCandidate = {
    ...input.candidateInput,
    id,
    title: input.candidateInput.title ?? '',
    regionId: input.candidateInput.regionId as CatalogueCandidate['regionId'],
    region: input.candidateInput.region as CatalogueCandidate['region'],
    source: input.candidateInput.source as CatalogueCandidate['source'],
    facts: input.candidateInput.facts as CatalogueCandidate['facts'],
    claimBoundary: input.candidateInput.claimBoundary ?? '',
    creatorId: existing?.creatorId ?? input.actor.id,
    revision: (existing?.revision ?? 0) + 1,
    lifecycle: 'draft',
    createdAt: existing?.createdAt ?? input.timestamp,
    updatedAt: input.timestamp,
    checklist,
    approval: null,
    retirementIntent: false,
  };
  return replaceCandidate(
    input.state,
    candidate,
    input.actor,
    input.timestamp,
    existing ? 'edit' : 'stage',
  );
}

function replaceCandidate(
  state: CataloguePublicationState,
  candidate: CatalogueCandidate,
  actor: ActiveStaffActor,
  timestamp: string,
  action: CataloguePublicationAuditAction,
  capability: CataloguePublicationCapability = 'editor',
  reason?: string | null,
): { state: CataloguePublicationState; candidate: CatalogueCandidate } {
  const prior = state.candidates.find((item) => item.id === candidate.id);
  const candidates = prior
    ? state.candidates.map((item) => item.id === candidate.id ? candidate : item)
    : [...state.candidates, candidate];
  return {
    candidate,
    state: {
      ...state,
      candidates,
      auditEvents: [
        ...state.auditEvents,
        {
          candidateId: candidate.id,
          actorId: actor.id,
          capability,
          action,
          timestamp,
          outcome: candidate.checklist.passed ? 'passed-checklist' : 'needs-correction',
          version: candidate.revision,
          ...(reason === null || reason === undefined ? {} : { reason }),
          correctionCodes: candidate.checklist.correctionCodes,
          reviewStatus: candidate.lifecycle,
        },
      ],
    },
  };
}

function hasCapability(
  actor: ActiveStaffActor,
  capability: CataloguePublicationCapability,
): boolean {
  return actor.capabilities instanceof Set && actor.capabilities.has(capability);
}

function authorizeRelease(
  actor: ActiveStaffActor,
  kind: CatalogueSnapshotKind,
  reason: string | undefined,
): void {
  const authorized = kind === 'weekly'
    ? hasCapability(actor, 'administrator')
    : hasCapability(actor, 'administrator') || hasCapability(actor, 'reviewer');
  if (!authorized || (kind === 'emergency' && (!reason || reason.trim().length === 0 || reason.length > 500))) {
    throw new CatalogueReleaseAuthorizationError();
  }
}

function normalizeReleaseSelection(candidateIds: string[]): string[] {
  if (!Array.isArray(candidateIds) || candidateIds.length < 1 || candidateIds.length > 25
    || candidateIds.some((id) => !boundedStableId(id))) {
    throw new CatalogueReleaseSelectionError();
  }
  const unique = new Set(candidateIds);
  if (unique.size !== candidateIds.length) throw new CatalogueReleaseSelectionError();
  return [...unique].sort();
}

function toPublishedRecord(
  candidate: CatalogueCandidate,
  mediaFallback: boolean,
): CataloguePublishedRecord {
  return {
    id: candidate.id,
    revision: candidate.revision,
    title: candidate.title,
    regionId: candidate.regionId,
    region: candidate.region,
    source: candidate.source,
    facts: candidate.facts as CataloguePublishedRecord['facts'],
    claimBoundary: candidate.claimBoundary,
    ...(!mediaFallback && candidate.media === undefined ? {} : !mediaFallback ? { media: candidate.media } : {}),
    mediaFallback,
  };
}

function compareEntries(
  left: { id: string },
  right: { id: string },
): number {
  return left.id.localeCompare(right.id);
}

function clonePublicRecords(records: CataloguePublishedRecord[]): CataloguePublishedRecord[] {
  return JSON.parse(JSON.stringify(records)) as CataloguePublishedRecord[];
}

function normalizeCataloguePublicationState(
  state: CataloguePublicationState | undefined,
): CataloguePublicationState {
  const fallback = createEmptyCataloguePublicationState();
  if (!state) return fallback;
  return {
    ...fallback,
    ...state,
    snapshots: state.snapshots ?? [],
    manifests: state.manifests ?? [],
    activeSnapshotId: state.activeSnapshotId ?? null,
  };
}

function getReleaseState(
  state: CataloguePublicationState | undefined,
): CataloguePublicationState & Required<Pick<CataloguePublicationState,
  'snapshots' | 'manifests' | 'activeSnapshotId'>> {
  const normalized = normalizeCataloguePublicationState(state);
  return {
    ...normalized,
    snapshots: normalized.snapshots ?? [],
    manifests: normalized.manifests ?? [],
    activeSnapshotId: normalized.activeSnapshotId ?? null,
  };
}

function toCandidateInput(value: unknown): CatalogueCandidateInput {
  if (!isRecord(value)) return {};

  return {
    id: boundedStableId(value.id),
    title: boundedText(value.title, 240),
    regionId: typeof value.regionId === 'string' ? value.regionId as CatalogueCandidateInput['regionId'] : undefined,
    region: isRecord(value.region) ? value.region as unknown as CatalogueCandidateInput['region'] : undefined,
    source: isRecord(value.source) ? value.source as unknown as CatalogueCandidateInput['source'] : undefined,
    facts: isRecord(value.facts) ? value.facts as CatalogueCandidateInput['facts'] : undefined,
    claimBoundary: boundedText(value.claimBoundary, 500),
    media: isRecord(value.media) ? {
      url: boundedText(value.media.url, 2_000),
      alt: boundedText(value.media.alt, 500),
    } : undefined,
    mediaRights: isRecord(value.mediaRights) ? {
      kind: value.mediaRights.kind as CatalogueCandidateInput['mediaRights'] extends infer Rights
        ? Rights extends { kind: infer Kind } ? Kind : never : never,
      sourceUrl: boundedText(value.mediaRights.sourceUrl, 2_000) ?? '',
      expiresAt: boundedText(value.mediaRights.expiresAt, 20),
      status: value.mediaRights.status as 'valid' | 'revoked' | 'uncertain' | undefined,
    } : undefined,
  };
}

function boundedStableId(value: unknown): string | undefined {
  return typeof value === 'string' && /^[a-zA-Z0-9:_-]{1,160}$/.test(value) ? value : undefined;
}

function isExpectedRevision(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 1;
}

function boundedText(value: unknown, maximum: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= maximum ? trimmed : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
