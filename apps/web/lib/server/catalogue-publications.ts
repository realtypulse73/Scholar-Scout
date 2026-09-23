import 'server-only';

import { randomUUID } from 'node:crypto';
import {
  createEmptyCataloguePublicationState,
  evaluateCatalogueChecklist,
  type CatalogueCandidate,
  type CatalogueCandidateInput,
  type CataloguePublicationCapability,
} from '@/lib/catalogue-publication';
import type { ActiveStaffActor } from '@/lib/server/active-staff';
import { commitConditionalMutation } from '@/lib/server/persistence-operations';

export class CataloguePublicationConflictError extends Error {
  constructor() {
    super('Catalogue publication changed before the draft could be staged.');
    this.name = 'CataloguePublicationConflictError';
  }
}

export async function stageCatalogueCandidate(input: {
  actor: ActiveStaffActor;
  candidate: unknown;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const candidateInput = toCandidateInput(input.candidate);
  const checklist = evaluateCatalogueChecklist(candidateInput, now);
  const timestamp = now.toISOString();
  const candidate: CatalogueCandidate = {
    ...candidateInput,
    id: candidateInput.id ?? `catalogue:${randomUUID()}`,
    title: candidateInput.title ?? '',
    regionId: candidateInput.regionId as CatalogueCandidate['regionId'],
    region: candidateInput.region as CatalogueCandidate['region'],
    source: candidateInput.source as CatalogueCandidate['source'],
    facts: candidateInput.facts as CatalogueCandidate['facts'],
    claimBoundary: candidateInput.claimBoundary ?? '',
    creatorId: input.actor.id,
    revision: 1,
    lifecycle: 'draft',
    createdAt: timestamp,
    updatedAt: timestamp,
    checklist,
    approval: null,
  };

  const result = await commitConditionalMutation((data) => {
    const state = data.cataloguePublicationState ?? createEmptyCataloguePublicationState();
    data.cataloguePublicationState = {
      ...state,
      candidates: [...state.candidates, candidate],
      auditEvents: [
        ...state.auditEvents,
        {
          actorId: input.actor.id,
          capability: 'editor' as CataloguePublicationCapability,
          action: 'stage',
          timestamp,
          outcome: checklist.passed ? 'passed-checklist' : 'needs-correction',
          version: candidate.revision,
          correctionCodes: checklist.correctionCodes,
          reviewStatus: candidate.lifecycle,
        },
      ],
    };
    return { candidate, checklist };
  });

  if (result.status === 'conflict') throw new CataloguePublicationConflictError();
  return result.value;
}

function toCandidateInput(value: unknown): CatalogueCandidateInput {
  if (!isRecord(value)) return {};

  return {
    id: boundedText(value.id, 160),
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

function boundedText(value: unknown, maximum: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= maximum ? trimmed : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
