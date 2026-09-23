import 'server-only';

import { randomUUID } from 'node:crypto';
import {
  CATALOGUE_CHECKLIST_DISCLOSURE,
  createEmptyCataloguePublicationState,
  evaluateCatalogueChecklist,
  parseCatalogueCandidateImport,
  type CatalogueCandidate,
  type CatalogueCandidateImportChange,
  type CatalogueCandidateInput,
  type CataloguePublicationAuditAction,
  type CataloguePublicationCapability,
  type CataloguePublicationState,
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
    const state = data.cataloguePublicationState ?? createEmptyCataloguePublicationState();
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
    let state = data.cataloguePublicationState ?? createEmptyCataloguePublicationState();
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
    const state = data.cataloguePublicationState ?? createEmptyCataloguePublicationState();
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
    const state = data.cataloguePublicationState ?? createEmptyCataloguePublicationState();
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
  const state = data.cataloguePublicationState ?? createEmptyCataloguePublicationState();
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

function boundedText(value: unknown, maximum: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= maximum ? trimmed : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
