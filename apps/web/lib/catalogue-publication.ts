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
import { createHash } from 'node:crypto';

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
export type CatalogueSnapshotKind = 'weekly' | 'emergency' | 'restore';
export type CataloguePublicationAuditAction =
  | 'stage'
  | 'edit'
  | 'submit'
  | 'approval'
  | 'failure'
  | 'conflict-resolution'
  | 'emergency-correction';
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

export interface CataloguePublishedRecord {
  id: string;
  revision: number;
  title: string;
  regionId: CatalogueRegionId;
  region: CatalogueRegion;
  source: SourceMetadata;
  facts: CatalogueOpportunityCardFacts;
  claimBoundary: string;
  media?: { url?: string; alt?: string };
  mediaFallback: boolean;
}

export interface CatalogueSnapshot {
  id: string;
  sequence: number;
  kind: CatalogueSnapshotKind;
  releasedAt: string;
  periodKey?: string;
  priorSnapshotId?: string;
  restoredFromSnapshotId?: string;
  records: CataloguePublishedRecord[];
  contentDigest: string;
}

export interface CatalogueSnapshotManifestEntry {
  id: string;
  revision: number;
}

export interface CatalogueSnapshotQuarantineEntry extends CatalogueSnapshotManifestEntry {
  correctionCodes: CatalogueChecklistCategory[];
}

export interface CatalogueSnapshotManifest {
  id: string;
  snapshotId: string;
  sequence: number;
  kind: CatalogueSnapshotKind;
  releasedAt: string;
  periodKey?: string;
  priorSnapshotId?: string;
  restoredFromSnapshotId?: string;
  actorId: string;
  capability: CataloguePublicationCapability;
  action: 'release';
  outcome: 'published';
  reason?: string;
  included: CatalogueSnapshotManifestEntry[];
  retired: CatalogueSnapshotManifestEntry[];
  quarantined: CatalogueSnapshotQuarantineEntry[];
  contentDigest: string;
}

export interface CataloguePublicationState {
  schemaVersion: 1;
  candidates: CatalogueCandidate[];
  auditEvents: CataloguePublicationAuditEvent[];
  snapshots?: CatalogueSnapshot[];
  manifests?: CatalogueSnapshotManifest[];
  activeSnapshotId?: string | null;
}

export function createEmptyCataloguePublicationState(): CataloguePublicationState {
  return {
    schemaVersion: 1,
    candidates: [],
    auditEvents: [],
    snapshots: [],
    manifests: [],
    activeSnapshotId: null,
  };
}

export const NORMAL_WEEKLY_RELEASE_TIME_ZONE = 'America/New_York';

/** Returns the ISO week for the release instant's fixed New York calendar date. */
export function getWeeklyReleasePeriodKey(now: Date): string {
  const parts = getNewYorkDateParts(now);
  const calendarDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  const weekday = calendarDate.getUTCDay() || 7;
  calendarDate.setUTCDate(calendarDate.getUTCDate() + 4 - weekday);
  const isoYear = calendarDate.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const firstWeekday = firstThursday.getUTCDay() || 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() + 4 - firstWeekday);
  const week = 1 + Math.round((calendarDate.getTime() - firstThursday.getTime()) / 604_800_000);
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

/** Normal releases are limited to Monday 09:00–17:00 in the fixed New York time zone. */
export function isWithinNormalWeeklyReleaseWindow(now: Date): boolean {
  const parts = getNewYorkDateParts(now);
  return parts.weekday === 'Mon' && parts.hour >= 9 && parts.hour < 17;
}

/** Builds a non-secret digest over a recursively key-sorted public snapshot payload. */
export function getCatalogueSnapshotDigest(records: CataloguePublishedRecord[]): string {
  return createHash('sha256').update(canonicalJson(records)).digest('hex');
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
    || !Array.isArray(value.auditEvents)
    || (value.snapshots !== undefined && !Array.isArray(value.snapshots))
    || (value.manifests !== undefined && !Array.isArray(value.manifests))
    || (value.activeSnapshotId !== undefined && value.activeSnapshotId !== null
      && typeof value.activeSnapshotId !== 'string')) return false;

  const snapshots = value.snapshots ?? [];
  const manifests = value.manifests ?? [];
  if (!value.candidates.every(isCatalogueCandidate)
    || !value.auditEvents.every(isCataloguePublicationAuditEvent)
    || !snapshots.every(isCatalogueSnapshot)
    || !manifests.every(isCatalogueSnapshotManifest)
    || !hasUnique(value.candidates.map((candidate) => candidate.id))
    || !hasUnique(snapshots.map((snapshot) => snapshot.id))
    || !hasUnique(snapshots.map((snapshot) => String(snapshot.sequence)))
    || !hasUnique(manifests.map((manifest) => manifest.id))
    || !hasUnique(manifests.map((manifest) => manifest.snapshotId))) return false;

  if (snapshots.length !== manifests.length) return false;
  const snapshotsById = new Map(snapshots.map((snapshot) => [snapshot.id, snapshot]));
  const candidatesById = new Map(value.candidates.map((candidate) => [candidate.id, candidate]));
  for (const snapshot of snapshots) {
    if (!isCanonicalSnapshot(snapshot, snapshotsById)) return false;
    const manifest = manifests.find((item) => item.snapshotId === snapshot.id);
    if (!manifest || !matchesSnapshotManifest(snapshot, manifest, snapshotsById, candidatesById)) return false;
  }
  return value.activeSnapshotId === undefined || value.activeSnapshotId === null
    || snapshotsById.has(value.activeSnapshotId);
}

function isCatalogueCandidate(value: unknown): value is CatalogueCandidate {
  if (!isRecord(value) || !isStableId(value.id) || typeof value.title !== 'string'
    || !isStableId(value.creatorId) || !isCandidateRevision(value.revision)
    || !isLifecycle(value.lifecycle) || typeof value.createdAt !== 'string'
    || typeof value.updatedAt !== 'string' || !isIsoTimestamp(value.createdAt)
    || !isIsoTimestamp(value.updatedAt) || !isCandidateApproval(value.approval)
    || !isCandidateStoredFields(value)
    || (value.retirementIntent === undefined || typeof value.retirementIntent !== 'boolean')) return false;

  const candidateInput: CatalogueCandidateInput = {
    id: value.id,
    title: value.title,
    ...(value.regionId === undefined ? {} : { regionId: value.regionId as CatalogueRegionId }),
    ...(value.region === undefined ? {} : { region: value.region as CatalogueRegion }),
    ...(value.source === undefined ? {} : { source: value.source as SourceMetadata }),
    ...(value.facts === undefined ? {} : { facts: value.facts as CatalogueOpportunityCardFacts }),
    ...(value.claimBoundary === undefined ? {} : { claimBoundary: value.claimBoundary as string }),
    ...(value.media === undefined ? {} : { media: value.media as { url?: string; alt?: string } }),
    ...(value.mediaRights === undefined ? {} : { mediaRights: value.mediaRights as CatalogueMediaRights }),
  };
  const expectedChecklist = evaluateCatalogueChecklist(candidateInput, new Date(value.updatedAt));
  if (!isChecklist(value.checklist) || canonicalJson(value.checklist) !== canonicalJson(expectedChecklist)) {
    return false;
  }
  if (value.lifecycle === 'approved') {
    return expectedChecklist.passed && isCompleteCandidateInput(value)
      && value.approval !== null && value.approval.revision === value.revision
      && isStableId(value.approval.reviewerId) && isIsoTimestamp(value.approval.reviewedAt);
  }
  return value.approval === null;
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

function isCatalogueSnapshot(value: unknown): value is CatalogueSnapshot {
  if (!isRecord(value) || !isStableId(value.id) || !isSequence(value.sequence)
    || !isSnapshotKind(value.kind) || typeof value.releasedAt !== 'string'
    || !isIsoTimestamp(value.releasedAt) || !Array.isArray(value.records) || !isDigest(value.contentDigest)) return false;
  return value.records.every(isCataloguePublishedRecord)
    && (value.periodKey === undefined || isPeriodKey(value.periodKey))
    && (value.priorSnapshotId === undefined || typeof value.priorSnapshotId === 'string')
    && (value.restoredFromSnapshotId === undefined || typeof value.restoredFromSnapshotId === 'string');
}

function isCatalogueSnapshotManifest(value: unknown): value is CatalogueSnapshotManifest {
  if (!isRecord(value) || !isStableId(value.id) || !isStableId(value.snapshotId)
    || !isSequence(value.sequence) || !isSnapshotKind(value.kind)
    || typeof value.releasedAt !== 'string' || typeof value.actorId !== 'string'
    || !isCapability(value.capability) || value.action !== 'release' || value.outcome !== 'published'
    || !Array.isArray(value.included) || !Array.isArray(value.retired)
    || !Array.isArray(value.quarantined) || !isDigest(value.contentDigest)
    || !isIsoTimestamp(value.releasedAt) || !isStableId(value.actorId)) return false;
  return value.included.every(isManifestEntry)
    && value.retired.every(isManifestEntry)
    && value.quarantined.every(isQuarantineEntry)
    && (value.periodKey === undefined || isPeriodKey(value.periodKey))
    && (value.priorSnapshotId === undefined || typeof value.priorSnapshotId === 'string')
    && (value.restoredFromSnapshotId === undefined || typeof value.restoredFromSnapshotId === 'string')
    && (value.reason === undefined || typeof value.reason === 'string');
}

function isCataloguePublishedRecord(value: unknown): value is CataloguePublishedRecord {
  if (!isRecord(value) || !isStableId(value.id) || !isCandidateRevision(value.revision)
    || typeof value.title !== 'string' || typeof value.regionId !== 'string'
    || !isRecord(value.region) || !isRecord(value.source) || !isRecord(value.facts)
    || typeof value.claimBoundary !== 'string' || typeof value.mediaFallback !== 'boolean') return false;
  if (!isBoundedRequiredText(value.title, 240) || !isBoundedRequiredText(value.regionId, 80)
    || !isBoundedClaim(value.claimBoundary)
    || validateCatalogueRegion(value.region as unknown as CatalogueRegion).length > 0
    || (value.region as unknown as CatalogueRegion).id !== value.regionId
    || validateSourceMetadata(value.source as unknown as SourceMetadata).length > 0
    || validateCatalogueOpportunityCardFacts(value.facts as unknown as CatalogueOpportunityCardFacts, new Date()).length > 0) {
    return false;
  }
  return value.media === undefined || isMedia(value.media);
}

function isCandidateStoredFields(value: Record<string, unknown>): boolean {
  return (value.regionId === undefined || typeof value.regionId === 'string')
    && (value.region === undefined || isRecord(value.region))
    && (value.source === undefined || isRecord(value.source))
    && (value.facts === undefined || isRecord(value.facts))
    && (value.claimBoundary === undefined || typeof value.claimBoundary === 'string')
    && (value.media === undefined || isMedia(value.media))
    && (value.mediaRights === undefined || isMediaRights(value.mediaRights));
}

function isCanonicalSnapshot(
  snapshot: CatalogueSnapshot,
  snapshotsById: Map<string, CatalogueSnapshot>,
): boolean {
  if (!hasUnique(snapshot.records.map((record) => record.id))
    || snapshot.records.some((record, index) => index > 0
      && snapshot.records[index - 1].id.localeCompare(record.id) > 0)
    || snapshot.contentDigest !== getCatalogueSnapshotDigest(snapshot.records)) return false;
  if (snapshot.kind === 'weekly' ? snapshot.periodKey === undefined : snapshot.periodKey !== undefined) {
    return false;
  }
  return hasEarlierReference(snapshot.priorSnapshotId, snapshot, snapshotsById)
    && hasEarlierReference(snapshot.restoredFromSnapshotId, snapshot, snapshotsById)
    && (snapshot.kind !== 'restore' || snapshot.restoredFromSnapshotId !== undefined);
}

function matchesSnapshotManifest(
  snapshot: CatalogueSnapshot,
  manifest: CatalogueSnapshotManifest,
  snapshotsById: Map<string, CatalogueSnapshot>,
  candidatesById: Map<string, CatalogueCandidate>,
): boolean {
  if (manifest.sequence !== snapshot.sequence || manifest.kind !== snapshot.kind
    || manifest.releasedAt !== snapshot.releasedAt || manifest.periodKey !== snapshot.periodKey
    || manifest.priorSnapshotId !== snapshot.priorSnapshotId
    || manifest.restoredFromSnapshotId !== snapshot.restoredFromSnapshotId
    || manifest.contentDigest !== snapshot.contentDigest
    || !hasEarlierReference(manifest.priorSnapshotId, snapshot, snapshotsById)
    || !hasEarlierReference(manifest.restoredFromSnapshotId, snapshot, snapshotsById)) return false;

  const recordRevisions = new Map(snapshot.records.map((record) => [record.id, record.revision]));
  return hasUnique(manifest.included.map((entry) => entry.id))
    && hasUnique(manifest.retired.map((entry) => entry.id))
    && hasUnique(manifest.quarantined.map((entry) => entry.id))
    && manifest.included.every((entry) => recordRevisions.get(entry.id) === entry.revision)
    && manifest.retired.every((entry) => candidatesById.get(entry.id)?.revision === entry.revision)
    && manifest.quarantined.every((entry) => candidatesById.get(entry.id)?.revision === entry.revision);
}

function hasEarlierReference(
  referenceId: string | undefined,
  snapshot: CatalogueSnapshot,
  snapshotsById: Map<string, CatalogueSnapshot>,
): boolean {
  if (referenceId === undefined) return true;
  const reference = snapshotsById.get(referenceId);
  return Boolean(reference && reference.id !== snapshot.id && reference.sequence < snapshot.sequence);
}

function isMedia(value: unknown): boolean {
  return isRecord(value) && (value.url === undefined || isHttpUrl(value.url))
    && (value.alt === undefined || typeof value.alt === 'string')
    && Object.keys(value).every((key) => key === 'url' || key === 'alt');
}

function isMediaRights(value: unknown): boolean {
  return isRecord(value) && isMediaRightsKind(value.kind) && isHttpUrl(value.sourceUrl)
    && (value.expiresAt === undefined || (typeof value.expiresAt === 'string' && isIsoDate(value.expiresAt)))
    && (value.status === undefined || value.status === 'valid' || value.status === 'revoked' || value.status === 'uncertain')
    && Object.keys(value).every((key) => ['kind', 'sourceUrl', 'expiresAt', 'status'].includes(key));
}

function hasUnique(values: string[]): boolean {
  return new Set(values).size === values.length;
}

function isDigest(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}

function isManifestEntry(value: unknown): value is CatalogueSnapshotManifestEntry {
  return isRecord(value) && isStableId(value.id) && isCandidateRevision(value.revision)
    && Object.keys(value).every((key) => key === 'id' || key === 'revision');
}

function isQuarantineEntry(value: unknown): value is CatalogueSnapshotQuarantineEntry {
  const entry = value as Record<string, unknown>;
  return isManifestEntry(value) && Array.isArray(entry.correctionCodes)
    && entry.correctionCodes.every(isChecklistCategory)
    && Object.keys(value).every((key) => key === 'id' || key === 'revision' || key === 'correctionCodes');
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
    return utf8ByteLength(JSON.stringify(value)) <= 250_000 && isBoundedValue(value, 0);
  } catch {
    return false;
  }
}

function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 0x80) bytes += 1;
    else if (code < 0x800) bytes += 2;
    else if (code >= 0xd800 && code <= 0xdbff && index + 1 < value.length
      && value.charCodeAt(index + 1) >= 0xdc00 && value.charCodeAt(index + 1) <= 0xdfff) {
      bytes += 4;
      index += 1;
    } else bytes += 3;
  }
  return bytes;
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
    || value === 'approval' || value === 'failure' || value === 'conflict-resolution'
    || value === 'emergency-correction';
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

function getNewYorkDateParts(now: Date): {
  year: number;
  month: number;
  day: number;
  hour: number;
  weekday: string;
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: NORMAL_WEEKLY_RELEASE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    weekday: 'short',
  });
  const values = Object.fromEntries(formatter.formatToParts(now)
    .filter((part) => part.type !== 'literal')
    .map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    weekday: values.weekday,
  };
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(',')}}`;
}

function isSequence(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function isSnapshotKind(value: unknown): value is CatalogueSnapshotKind {
  return value === 'weekly' || value === 'emergency' || value === 'restore';
}

function isPeriodKey(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-W\d{2}$/.test(value);
}

function isHttpUrl(value: unknown): boolean {
  return typeof value === 'string' && /^https?:\/\//.test(value);
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function isIsoTimestamp(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(Date.parse(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
