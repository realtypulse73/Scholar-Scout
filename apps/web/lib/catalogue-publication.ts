import {
  getFreshnessStatus,
  validateCatalogueOpportunityCardFacts,
  validateCatalogueRegion,
  validateSourceMetadata,
  type CatalogueOpportunityCardFacts,
  type CatalogueRegion,
  type CatalogueRegionId,
  type SourceMetadata,
} from '@/lib/catalogue-contract';

export const CATALOGUE_CHECKLIST_DISCLOSURE =
  'A pass means editorial completeness, not verified real-world provider truth.';

export const CATALOGUE_CHECKLIST_CATEGORIES = [
  'source',
  'material-evidence',
  'freshness',
  'claim-boundary',
  'regional-boundary',
  'media-rights',
] as const;

export type CatalogueChecklistCategory = (typeof CATALOGUE_CHECKLIST_CATEGORIES)[number];
export type CataloguePublicationCapability = 'editor' | 'reviewer' | 'administrator';
export type CatalogueCandidateLifecycle = 'draft' | 'approved' | 'quarantined';
export type MediaRightsKind =
  | 'scholarscout-owned'
  | 'licensed'
  | 'provider-approved'
  | 'approved-embed';

export interface CatalogueMediaRights {
  kind: MediaRightsKind;
  sourceUrl: string;
  expiresAt?: string;
  status?: 'valid' | 'revoked' | 'uncertain';
}

export interface CatalogueCandidateInput {
  id?: string;
  title?: string;
  regionId?: CatalogueRegionId;
  region?: CatalogueRegion;
  source?: SourceMetadata;
  facts?: Partial<CatalogueOpportunityCardFacts>;
  claimBoundary?: string;
  media?: { url?: string; alt?: string };
  mediaRights?: CatalogueMediaRights;
}

export interface CatalogueChecklistCategoryStatus {
  category: CatalogueChecklistCategory;
  status: 'passed' | 'needs-correction' | 'fallback';
}

export interface CatalogueChecklistResult {
  passed: boolean;
  correctionCodes: CatalogueChecklistCategory[];
  summary: CatalogueChecklistCategoryStatus[];
  disclosure: typeof CATALOGUE_CHECKLIST_DISCLOSURE;
  mediaFallback: boolean;
}

export interface CatalogueCandidate extends Required<Pick<CatalogueCandidateInput,
  'id' | 'title' | 'regionId' | 'region' | 'source' | 'facts' | 'claimBoundary'>> {
  creatorId: string;
  revision: number;
  lifecycle: CatalogueCandidateLifecycle;
  createdAt: string;
  updatedAt: string;
  media?: { url?: string; alt?: string };
  mediaRights?: CatalogueMediaRights;
  checklist: CatalogueChecklistResult;
  approval: null;
}

export interface CataloguePublicationAuditEvent {
  actorId: string;
  capability: CataloguePublicationCapability;
  action: 'stage';
  timestamp: string;
  outcome: 'passed-checklist' | 'needs-correction';
  version: number;
  reason?: string;
  correctionCodes: CatalogueChecklistCategory[];
  reviewStatus: CatalogueCandidateLifecycle;
}

export interface CataloguePublicationState {
  schemaVersion: 1;
  candidates: CatalogueCandidate[];
  auditEvents: CataloguePublicationAuditEvent[];
}

export function createEmptyCataloguePublicationState(): CataloguePublicationState {
  return { schemaVersion: 1, candidates: [], auditEvents: [] };
}

/** Evaluates editorial completeness only; it never asserts provider truth or learner eligibility. */
export function evaluateCatalogueChecklist(
  candidate: CatalogueCandidateInput,
  now: Date,
): CatalogueChecklistResult {
  const failed = new Set<CatalogueChecklistCategory>();

  if (!candidate.source || validateSourceMetadata(candidate.source).length > 0) {
    failed.add('source');
  }
  if (!candidate.facts || validateCatalogueOpportunityCardFacts(candidate.facts, now).length > 0) {
    failed.add('material-evidence');
  }
  if (!candidate.source || getFreshnessStatus(candidate.source, 'operational', now) !== 'current') {
    failed.add('freshness');
  }
  if (!isBoundedClaim(candidate.claimBoundary)) {
    failed.add('claim-boundary');
  }
  if (!candidate.region || validateCatalogueRegion(candidate.region).length > 0
    || candidate.region.id !== candidate.regionId) {
    failed.add('regional-boundary');
  }

  const mediaFallback = !isUsableMedia(candidate.media, candidate.mediaRights, now);
  const correctionCodes = CATALOGUE_CHECKLIST_CATEGORIES.filter(
    (category) => failed.has(category),
  );
  const summary: CatalogueChecklistCategoryStatus[] = CATALOGUE_CHECKLIST_CATEGORIES.map((category) => ({
    category,
    status: category === 'media-rights' && mediaFallback
      ? 'fallback'
      : failed.has(category)
        ? 'needs-correction'
        : 'passed',
  }));

  return {
    passed: correctionCodes.length === 0,
    correctionCodes,
    summary,
    disclosure: CATALOGUE_CHECKLIST_DISCLOSURE,
    mediaFallback,
  };
}

export function isCataloguePublicationState(value: unknown): value is CataloguePublicationState {
  if (!isRecord(value) || value.schemaVersion !== 1 || !Array.isArray(value.candidates)
    || !Array.isArray(value.auditEvents)) return false;

  return value.candidates.every(isCatalogueCandidate)
    && value.auditEvents.every(isCataloguePublicationAuditEvent);
}

function isCatalogueCandidate(value: unknown): value is CatalogueCandidate {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.title !== 'string'
    || typeof value.creatorId !== 'string' || typeof value.revision !== 'number'
    || !isLifecycle(value.lifecycle) || typeof value.createdAt !== 'string'
    || typeof value.updatedAt !== 'string' || value.approval !== null) return false;

  return isChecklist(value.checklist);
}

function isCataloguePublicationAuditEvent(value: unknown): value is CataloguePublicationAuditEvent {
  if (!isRecord(value) || typeof value.actorId !== 'string' || !isCapability(value.capability)
    || value.action !== 'stage' || typeof value.timestamp !== 'string'
    || (value.outcome !== 'passed-checklist' && value.outcome !== 'needs-correction')
    || typeof value.version !== 'number' || !isLifecycle(value.reviewStatus)
    || !Array.isArray(value.correctionCodes)) return false;

  const allowedKeys = new Set([
    'actorId',
    'capability',
    'action',
    'timestamp',
    'outcome',
    'version',
    'reason',
    'correctionCodes',
    'reviewStatus',
  ]);
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) return false;

  return value.correctionCodes.every(isChecklistCategory)
    && (value.reason === undefined || typeof value.reason === 'string');
}

function isChecklist(value: unknown): value is CatalogueChecklistResult {
  if (!isRecord(value) || typeof value.passed !== 'boolean' || !Array.isArray(value.correctionCodes)
    || !Array.isArray(value.summary) || value.disclosure !== CATALOGUE_CHECKLIST_DISCLOSURE
    || typeof value.mediaFallback !== 'boolean') return false;

  return value.correctionCodes.every(isChecklistCategory)
    && value.summary.length === CATALOGUE_CHECKLIST_CATEGORIES.length
    && value.summary.every((item) => isRecord(item) && isChecklistCategory(item.category)
      && (item.status === 'passed' || item.status === 'needs-correction' || item.status === 'fallback'));
}

function isUsableMedia(
  media: CatalogueCandidateInput['media'],
  rights: CatalogueMediaRights | undefined,
  now: Date,
): boolean {
  if (!media?.url) return true;
  if (!rights || !isMediaRightsKind(rights.kind) || !isHttpUrl(rights.sourceUrl)
    || rights.status === 'revoked' || rights.status === 'uncertain') return false;
  if (rights.expiresAt && (!isIsoDate(rights.expiresAt) || new Date(rights.expiresAt).getTime() < now.getTime())) {
    return false;
  }
  return true;
}

function isBoundedClaim(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > 500) return false;
  return !/\b(eligib(?:ility|le)|guarantee(?:d)?|admission|will earn|will make|outcome)\b/i.test(value);
}

function isChecklistCategory(value: unknown): value is CatalogueChecklistCategory {
  return typeof value === 'string' && CATALOGUE_CHECKLIST_CATEGORIES.includes(value as CatalogueChecklistCategory);
}

function isCapability(value: unknown): value is CataloguePublicationCapability {
  return value === 'editor' || value === 'reviewer' || value === 'administrator';
}

function isMediaRightsKind(value: unknown): value is MediaRightsKind {
  return value === 'scholarscout-owned' || value === 'licensed'
    || value === 'provider-approved' || value === 'approved-embed';
}

function isLifecycle(value: unknown): value is CatalogueCandidateLifecycle {
  return value === 'draft' || value === 'approved' || value === 'quarantined';
}

function isHttpUrl(value: unknown): boolean {
  return typeof value === 'string' && /^https?:\/\//.test(value);
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
