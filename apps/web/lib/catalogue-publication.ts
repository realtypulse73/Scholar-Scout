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
export type CatalogueImportCorrectionCode = 'invalid-import';
export type CatalogueCandidateAction = 'upsert' | 'retire';
export type CataloguePublicationAuditAction =
  | 'stage'
  | 'edit'
  | 'submit'
  | 'approval'
  | 'failure';
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
  approval: CatalogueCandidateApproval | null;
  retirementIntent?: boolean;
}

export interface CatalogueCandidateApproval {
  reviewerId: string;
  reviewedAt: string;
  revision: number;
}

export interface CatalogueCandidateImportUpsert {
  action: 'upsert';
  id: string;
  candidate: CatalogueCandidateInput;
  expectedRevision?: number;
}

export interface CatalogueCandidateImportRetire {
  action: 'retire';
  id: string;
  expectedRevision: number;
}

export type CatalogueCandidateImportChange =
  | CatalogueCandidateImportUpsert
  | CatalogueCandidateImportRetire;

export type CatalogueCandidateImportParseResult =
  | { ok: true; changes: CatalogueCandidateImportChange[] }
  | { ok: false; correctionCodes: CatalogueImportCorrectionCode[] };

export interface CataloguePublicationAuditEvent {
  candidateId?: string;
  actorId: string;
  capability: CataloguePublicationCapability;
  action: CataloguePublicationAuditAction;
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

/**
 * Parses the bounded, versioned staff intake envelope. This is deliberately
 * structural: the checklist separately reports editorial corrections without
 * allowing a malformed batch to partially mutate the catalogue state.
 */
export function parseCatalogueCandidateImport(value: unknown): CatalogueCandidateImportParseResult {
  if (!isBoundedImportValue(value) || !isRecord(value) || value.schemaVersion !== 1
    || !Array.isArray(value.changes) || value.changes.length < 1
    || value.changes.length > 25) {
    return invalidImport();
  }

  const ids = new Set<string>();
  const changes: CatalogueCandidateImportChange[] = [];
  for (const rawChange of value.changes) {
    const change = parseImportChange(rawChange);
    if (!change || ids.has(change.id)) return invalidImport();
    ids.add(change.id);
    changes.push(change);
  }

  return { ok: true, changes };
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
    || typeof value.updatedAt !== 'string' || !isCandidateApproval(value.approval)) return false;

  return isChecklist(value.checklist)
    && (value.retirementIntent === undefined || typeof value.retirementIntent === 'boolean');
}

function isCataloguePublicationAuditEvent(value: unknown): value is CataloguePublicationAuditEvent {
  if (!isRecord(value) || typeof value.actorId !== 'string' || !isCapability(value.capability)
    || !isAuditAction(value.action) || typeof value.timestamp !== 'string'
    || (value.outcome !== 'passed-checklist' && value.outcome !== 'needs-correction')
    || typeof value.version !== 'number' || !isLifecycle(value.reviewStatus)
    || !Array.isArray(value.correctionCodes)) return false;

  const allowedKeys = new Set([
    'candidateId',
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

  return (value.candidateId === undefined || isStableId(value.candidateId))
    && value.correctionCodes.every(isChecklistCategory)
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

function parseImportChange(value: unknown): CatalogueCandidateImportChange | null {
  if (!isRecord(value) || (value.action !== 'upsert' && value.action !== 'retire')) return null;

  if (value.action === 'retire') {
    return isStableId(value.id) && isCandidateRevision(value.expectedRevision)
      ? { action: 'retire', id: value.id, expectedRevision: value.expectedRevision }
      : null;
  }

  if (!isRecord(value.candidate) || !isCompleteCandidateInput(value.candidate)) return null;
  const expectedRevision = value.expectedRevision;
  if (expectedRevision !== undefined && !isExpectedCandidateRevision(expectedRevision)) return null;
  return {
    action: 'upsert',
    id: value.candidate.id as string,
    candidate: value.candidate as CatalogueCandidateInput,
    ...(expectedRevision === undefined ? {} : { expectedRevision }),
  };
}

function isCompleteCandidateInput(value: Record<string, unknown>): boolean {
  return isStableId(value.id)
    && isBoundedRequiredText(value.title, 240)
    && isBoundedRequiredText(value.regionId, 80)
    && isRecord(value.region)
    && isRecord(value.source)
    && isRecord(value.facts)
    && isBoundedRequiredText(value.claimBoundary, 500);
}

function invalidImport(): CatalogueCandidateImportParseResult {
  return { ok: false, correctionCodes: ['invalid-import'] };
}

function isBoundedImportValue(value: unknown): boolean {
  try {
    return JSON.stringify(value).length <= 250_000 && isBoundedValue(value, 0);
  } catch {
    return false;
  }
}

function isBoundedValue(value: unknown, depth: number): boolean {
  if (depth > 32) return false;
  if (value === null || typeof value === 'boolean' || typeof value === 'number') return true;
  if (typeof value === 'string') return value.length <= 4_000;
  if (Array.isArray(value)) return value.length <= 64
    && value.every((item) => isBoundedValue(item, depth + 1));
  if (!isRecord(value) || Object.keys(value).length > 64) return false;
  return Object.values(value).every((item) => isBoundedValue(item, depth + 1));
}

function isCandidateApproval(value: unknown): value is CatalogueCandidateApproval | null {
  if (value === null) return true;
  return isRecord(value) && typeof value.reviewerId === 'string'
    && typeof value.reviewedAt === 'string' && isCandidateRevision(value.revision)
    && Object.keys(value).every((key) => ['reviewerId', 'reviewedAt', 'revision'].includes(key));
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

function isAuditAction(value: unknown): value is CataloguePublicationAuditAction {
  return value === 'stage' || value === 'edit' || value === 'submit'
    || value === 'approval' || value === 'failure';
}

function isStableId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9:_-]{1,160}$/.test(value);
}

function isCandidateRevision(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function isExpectedCandidateRevision(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isBoundedRequiredText(value: unknown, maximum: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maximum;
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
