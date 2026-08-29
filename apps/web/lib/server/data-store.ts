import 'server-only';

import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
} from 'node:crypto';
import { mkdir, open, readFile, rename, unlink } from 'fs/promises';
import path from 'path';
import { TextDecoder } from 'util';
import { validateProgrammeDraft } from '@/lib/admin-programmes';
import type { OnboardingData } from '@/lib/onboarding-types';
import {
  validatePeerConnectionRequest,
  type CreatePeerConnectionRequest,
  type PeerConnectionRequest,
} from '@/lib/peer-connections';
import {
  validateOutcomeMetricRecord,
  type OutcomeMetricRecord,
} from '@/lib/outcome-profiles';
import {
  validateCampusNote,
  validateUploaderInboxRequest,
  type CampusNote,
  type UploaderInboxRequest,
} from '@/lib/campus-community';
import type { Programme } from '@/lib/programmes';
import type { ShortlistPlanMap, ShortlistProgrammePlan } from '@/lib/shortlist';

export type AccountRole = 'student' | 'staff';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  role: AccountRole;
  passwordHash: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  userId: string;
  action: string;
  entityType: 'onboarding' | 'shortlist' | 'programme' | 'data';
  entityId: string;
  createdAt: string;
}

export interface ProgrammeAuditEvent extends AuditEvent {
  actorLabel: string;
}

export type CredentialVerificationResult =
  | { status: 'verified'; user: StoredUser }
  | { status: 'unknown-account' | 'incorrect-password'; user: null };

const CREDENTIAL_GRANT_TTL_MS = 2 * 60 * 1_000;
const credentialGrants = new Map<
  string,
  {
    email: string;
    ip: string;
    expiresAt: number;
    user: StoredUser;
  }
>();

export interface GuestLifecycleRecord {
  id: string;
  credentialHash: string;
  quotaWindowId: string;
  createdAt: string;
  expiresAt: string;
  migratedAt?: string;
  migratedToAccountId?: string;
}

export interface GuestQuotaBinding {
  guestId: string;
  guestWindowId: string;
  createdAt: string;
  expiresAt: string;
}

export interface GuestMigrationAuditRecord {
  id: string;
  guestId: string;
  accountId: string;
  migratedAt: string;
  transferredCollections: string[];
}

export interface PrivilegedOperationAuditEvent {
  id: string;
  actorId: string;
  action: string;
  route: string;
  outcome: 'allowed' | 'denied';
  createdAt: string;
}

export interface ScholarScoutData {
  users: StoredUser[];
  onboardingProfiles: Record<string, OnboardingData>;
  shortlists: Record<string, string[]>;
  shortlistPlans?: Record<string, ShortlistPlanMap>;
  programmeRecords: Programme[];
  outcomeMetricRecords?: OutcomeMetricRecord[];
  peerConnectionRequests?: PeerConnectionRequest[];
  campusNotes?: CampusNote[];
  uploaderInboxRequests?: UploaderInboxRequest[];
  auditEvents: AuditEvent[];
  restoreBackups?: ScholarScoutDataBackup[];
  guestLifecycles?: GuestLifecycleRecord[];
  guestQuotaBindings?: Record<string, GuestQuotaBinding>;
  guestMigrationAuditRecords?: GuestMigrationAuditRecord[];
  privilegedOperationAuditEvents?: PrivilegedOperationAuditEvent[];
  recoveryLifecycleEvents?: RecoveryLifecycleEvent[];
  recoveryPlanOutcomes?: RecoveryPlanOutcome[];
}

export interface RecoveryLifecycleEvent {
  id: string;
  actorId: string;
  action: 'apply-recovery-plan' | 'release-incident-hold' | 'prune-recovery-backup';
  category: 'recovery';
  timestamp: string;
  outcome: 'succeeded' | 'failed-no-write';
  planId?: string;
  sourceId?: string;
  incidentId?: string;
  backupId?: string;
}

export interface RecoveryPlanOutcome {
  planId: string;
  actorId: string;
  sourceId: string;
  backupId: string;
  incidentId: string;
  appliedAt: string;
  outcome: 'succeeded';
}

export interface ScholarScoutDataBackup {
  id: string;
  createdAt: string;
  actorUserId: string;
  reason: string;
  counts: ScholarScoutDataStoreStatus['counts'];
  data: ScholarScoutData;
  incidentHold?: {
    incidentId: string;
    status: 'unresolved' | 'resolved';
    createdAt: string;
    resolvedAt?: string;
    resolvedBy?: string;
    reason?: string;
  };
}

export interface ScholarScoutDataBackupSummary {
  id: string;
  createdAt: string;
  actorUserId: string;
  actorLabel: string;
  reason: string;
  counts: ScholarScoutDataStoreStatus['counts'];
}

export interface ScholarScoutDataRestorePlanRow {
  key: keyof ScholarScoutDataStoreStatus['counts'];
  label: string;
  currentCount: number;
  restoredCount: number;
  delta: number;
}

export interface ScholarScoutDataRestorePlan {
  backup: ScholarScoutDataBackupSummary;
  rows: ScholarScoutDataRestorePlanRow[];
}

export interface ScholarScoutDataStore {
  read(): Promise<ScholarScoutData>;
  write(data: ScholarScoutData): Promise<void>;
  readVersioned?(): Promise<VersionedScholarScoutData>;
  writeVersioned?(data: ScholarScoutData, expectedVersion: string | null): Promise<ConditionalWriteResult>;
}

export interface VersionedScholarScoutData {
  data: ScholarScoutData;
  version: string | null;
}

export type ConditionalWriteResult =
  | { status: 'applied'; version: string }
  | { status: 'conflict' };

export class PersistenceConflictError extends Error {
  constructor() {
    super('ScholarScout data changed before the operation could be committed.');
    this.name = 'PersistenceConflictError';
  }
}

export interface ScholarScoutDataStoreStatus {
  adapter: string;
  backingStore: string;
  isDurable: boolean;
  isConfigured: boolean;
  issues: string[];
  backupRetention: ScholarScoutBackupRetentionStatus;
  counts: {
    users: number;
    onboardingProfiles: number;
    shortlists: number;
    programmeRecords: number;
    auditEvents: number;
  };
}

export interface ScholarScoutBackupRetentionStatus {
  retainedBackups: number;
  maxRetainedBackups: number;
  isWithinPolicy: boolean;
  issues: string[];
}

export interface ScholarScoutDataImportValidation {
  isValid: boolean;
  errors: string[];
  counts: ScholarScoutDataStoreStatus['counts'];
}

export interface ScholarScoutDataRestoreResult {
  backupId: string;
  restoredAt: string;
  counts: ScholarScoutDataStoreStatus['counts'];
  sourceBackupId?: string;
}

export const SCHOLARSCOUT_RESTORE_CONFIRMATION = 'RESTORE SCHOLARSCOUT DATA';
const MAX_RESTORE_BACKUPS = 5;

const INITIAL_DATA: ScholarScoutData = {
  users: [],
  onboardingProfiles: {},
  shortlists: {},
  shortlistPlans: {},
  programmeRecords: [],
  outcomeMetricRecords: [],
  peerConnectionRequests: [],
  campusNotes: [],
  uploaderInboxRequests: [],
  auditEvents: [],
  restoreBackups: [],
  guestLifecycles: [],
  guestQuotaBindings: {},
  guestMigrationAuditRecords: [],
  privilegedOperationAuditEvents: [],
  recoveryLifecycleEvents: [],
  recoveryPlanOutcomes: [],
};

const dataFilePath =
  process.env.SCHOLARSCOUT_DATA_FILE ??
  path.join(process.cwd(), 'data', 'scholarscout-data.json');

export class JsonScholarScoutDataStore implements ScholarScoutDataStore {
  constructor(private readonly filePath: string) {}

  async read() {
    try {
      const file = await readFile(this.filePath, 'utf8');
      return parseStoredScholarScoutData(JSON.parse(file));
    } catch (error) {
      if (isFileNotFoundError(error)) {
        return createInitialData();
      }

      if (error instanceof ScholarScoutDataStoreReadError) {
        throw error;
      }

      throw new ScholarScoutDataStoreReadError(
        error instanceof SyntaxError ? 'invalid-data' : 'unavailable',
      );
    }
  }

  async write(data: ScholarScoutData) {
    const current = await this.readVersioned();
    const result = await this.writeVersioned(data, current.version);
    if (result.status === 'conflict') throw new PersistenceConflictError();
  }

  async readVersioned(): Promise<VersionedScholarScoutData> {
    try {
      const file = await readFile(this.filePath, 'utf8');
      return {
        data: parseStoredScholarScoutData(JSON.parse(file)),
        version: hashStoredDocument(file),
      };
    } catch (error) {
      if (isFileNotFoundError(error)) return { data: createInitialData(), version: null };
      throw normalizeStoreReadError(error);
    }
  }

  async writeVersioned(
    data: ScholarScoutData,
    expectedVersion: string | null,
  ): Promise<ConditionalWriteResult> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const lockPath = `${this.filePath}.lock`;
    const lock = await acquireJsonStoreLock(lockPath);
    const temporaryPath = `${this.filePath}.${process.pid}.${randomUUID()}.tmp`;
    try {
      const current = await this.readVersioned();
      if (current.version !== expectedVersion) return { status: 'conflict' };
      const serialized = JSON.stringify(normalizeScholarScoutData(data), null, 2);
      const temporary = await open(temporaryPath, 'wx');
      try {
        await temporary.writeFile(serialized, 'utf8');
        await temporary.sync();
      } finally {
        await temporary.close();
      }
      await rename(temporaryPath, this.filePath);
      return { status: 'applied', version: hashStoredDocument(serialized) };
    } finally {
      await unlink(temporaryPath).catch(() => undefined);
      await lock.close();
      await unlink(lockPath).catch(() => undefined);
    }
  }
}

class HttpScholarScoutDataStore implements ScholarScoutDataStore {
  constructor(
    private readonly serviceUrl: string,
    private readonly token: string | undefined,
  ) {}

  async read() {
    return (await this.readVersioned()).data;
  }

  async readVersioned(): Promise<VersionedScholarScoutData> {
    let response: Response;

    try {
      response = await fetch(this.serviceUrl, {
        headers: this.getHeaders(),
        cache: 'no-store',
      });
    } catch (error) {
      throw new ScholarScoutDataStoreReadError(
        isTimeoutError(error) ? 'timeout' : 'unavailable',
      );
    }

    if (response.status === 404) {
      return { data: createInitialData(), version: null };
    }

    if (!response.ok) {
      throw new ScholarScoutDataStoreReadError('unavailable');
    }

    try {
      return {
        data: parseStoredScholarScoutData(await response.json()),
        version: response.headers?.get('etag') ?? null,
      };
    } catch (error) {
      if (error instanceof ScholarScoutDataStoreReadError) {
        throw error;
      }

      throw new ScholarScoutDataStoreReadError(
        error instanceof SyntaxError ? 'invalid-data' : 'unavailable',
      );
    }
  }

  async write(data: ScholarScoutData) {
    const current = await this.readVersioned();
    const result = await this.writeVersioned(data, current.version);
    if (result.status === 'conflict') throw new PersistenceConflictError();
  }

  async writeVersioned(
    data: ScholarScoutData,
    expectedVersion: string | null,
  ): Promise<ConditionalWriteResult> {
    const response = await fetch(this.serviceUrl, {
      method: 'PUT',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json',
        ...(expectedVersion === null
          ? { 'If-None-Match': '*' }
          : { 'If-Match': expectedVersion }),
      },
      body: JSON.stringify(data),
    });

    if (response.status === 412) return { status: 'conflict' };
    if (!response.ok) {
      throw new Error(
        `ScholarScout data service write failed with ${response.status}.`,
      );
    }
    return {
      status: 'applied',
      version: response.headers?.get('etag') ?? hashScholarScoutData(data),
    };
  }

  private getHeaders(): Record<string, string> {
    if (!this.token) {
      return {};
    }

    return {
      Authorization: `Bearer ${this.token}`,
    };
  }
}

class VercelBlobScholarScoutDataStore implements ScholarScoutDataStore {
  constructor(
    private readonly pathname: string,
    private readonly token: string,
  ) {}

  async read() {
    return (await this.readVersioned()).data;
  }

  async readVersioned(): Promise<VersionedScholarScoutData> {
    try {
      const { get } = await import('@vercel/blob');
      const blob = await get(this.pathname, {
        access: 'private',
        token: this.token,
        useCache: false,
      });

      if (!blob) {
        return { data: createInitialData(), version: null };
      }

      if (blob.statusCode !== 200) {
        throw new ScholarScoutDataStoreReadError('unavailable');
      }

      if (!blob.stream) {
        throw new ScholarScoutDataStoreReadError('invalid-data');
      }

      const body = await readStreamText(blob.stream);
      return {
        data: parseStoredScholarScoutData(JSON.parse(body)),
        version: blob.blob.etag,
      };
    } catch (error) {
      if (error instanceof ScholarScoutDataStoreReadError) {
        throw error;
      }

      throw new ScholarScoutDataStoreReadError(
        error instanceof SyntaxError
          ? 'invalid-data'
          : isTimeoutError(error)
            ? 'timeout'
            : 'unavailable',
      );
    }
  }

  async write(data: ScholarScoutData) {
    const current = await this.readVersioned();
    const result = await this.writeVersioned(data, current.version);
    if (result.status === 'conflict') throw new PersistenceConflictError();
  }

  async writeVersioned(
    data: ScholarScoutData,
    expectedVersion: string | null,
  ): Promise<ConditionalWriteResult> {
    const blobModule = await import('@vercel/blob');
    try {
      const result = await blobModule.put(
        this.pathname,
        JSON.stringify(normalizeScholarScoutData(data), null, 2),
        {
          access: 'private',
          allowOverwrite: expectedVersion !== null,
          ...(expectedVersion === null ? {} : { ifMatch: expectedVersion }),
          cacheControlMaxAge: 60,
          contentType: 'application/json',
          token: this.token,
        },
      );
      return { status: 'applied', version: result.etag };
    } catch (error) {
      if (
        error instanceof blobModule.BlobPreconditionFailedError ||
        (error instanceof Error && /already exists/i.test(error.message))
      ) {
        return { status: 'conflict' };
      }
      throw error;
    }
  }
}

let activeDataStore: ScholarScoutDataStore | null = null;

export function getDataStoreAdapterName() {
  return process.env.SCHOLARSCOUT_DATA_ADAPTER ?? 'json';
}

export function getAccountRoleForEmail(email: string): AccountRole {
  const staffEmails = splitEnvList(process.env.SCHOLARSCOUT_STAFF_EMAILS);
  return staffEmails.includes(normalizeEmail(email)) ? 'staff' : 'student';
}

export function getDataStoreConfigurationSummary() {
  const adapter = getDataStoreAdapterName();

  if (adapter === 'json') {
    return {
      adapter,
      backingStore: dataFilePath,
      isDurable: false,
      isConfigured: true,
      issues: [
        'JSON storage is useful for local development, but production should use Vercel Blob, HTTP, a database, or a CMS.',
      ],
    };
  }

  if (adapter === 'http') {
    const serviceUrl = process.env.SCHOLARSCOUT_DATA_SERVICE_URL;
    return {
      adapter,
      backingStore: serviceUrl ?? 'Not configured',
      isDurable: Boolean(serviceUrl),
      isConfigured: Boolean(serviceUrl),
      issues: serviceUrl
        ? []
        : [
            'SCHOLARSCOUT_DATA_SERVICE_URL is required for the HTTP data adapter.',
          ],
    };
  }

  if (adapter === 'vercel-blob') {
    const token =
      process.env.SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN ??
      process.env.BLOB_READ_WRITE_TOKEN;
    return {
      adapter,
      backingStore:
        process.env.SCHOLARSCOUT_BLOB_DATA_PATH ?? 'scholarscout/data.json',
      isDurable: Boolean(token),
      isConfigured: Boolean(token),
      issues: token
        ? []
        : [
            'BLOB_READ_WRITE_TOKEN or SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN is required for the Vercel Blob data adapter.',
          ],
    };
  }

  return {
    adapter,
    backingStore: 'Unsupported adapter',
    isDurable: false,
    isConfigured: false,
    issues: [
      `Unsupported ScholarScout data adapter "${adapter}".`,
    ],
  };
}

export async function getScholarScoutDataStoreStatus(): Promise<ScholarScoutDataStoreStatus> {
  const configuration = getDataStoreConfigurationSummary();

  if (!configuration.isConfigured) {
    return {
      ...configuration,
      counts: emptyDataCounts(),
      backupRetention: getRestoreBackupRetentionStatus(INITIAL_DATA),
    };
  }

  const data = await readScholarScoutData();

  return {
    ...configuration,
    counts: getDataCounts(data),
    backupRetention: getRestoreBackupRetentionStatus(data),
  };
}

export function validateScholarScoutDataImport(
  input: unknown,
): ScholarScoutDataImportValidation {
  const data = getImportDataCandidate(input);
  const errors: string[] = [];

  if (!isPlainObject(data)) {
    return {
      isValid: false,
      errors: ['Snapshot must be a ScholarScout data object.'],
      counts: emptyDataCounts(),
    };
  }

  if (!Array.isArray(data.users)) {
    errors.push('Snapshot users must be an array.');
  } else {
    data.users.forEach((user, index) => {
      if (!isStoredUser(user)) {
        errors.push(`User ${index + 1} is missing required account fields.`);
      }
    });
  }

  if (!isRecord(data.onboardingProfiles)) {
    errors.push('Snapshot onboarding profiles must be an object.');
  }

  if (!isRecord(data.shortlists)) {
    errors.push('Snapshot shortlists must be an object.');
  } else {
    Object.entries(data.shortlists).forEach(([userId, shortlist]) => {
      if (
        !Array.isArray(shortlist) ||
        !shortlist.every((programmeId) => typeof programmeId === 'string')
      ) {
        errors.push(`Shortlist for ${userId} must be an array of programme ids.`);
      }
    });
  }

  if (
    'shortlistPlans' in data &&
    data.shortlistPlans !== undefined &&
    !isRecord(data.shortlistPlans)
  ) {
    errors.push('Snapshot shortlist plans must be an object when present.');
  } else if (isRecord(data.shortlistPlans)) {
    Object.entries(data.shortlistPlans).forEach(([userId, plans]) => {
      if (!isRecord(plans)) {
        errors.push(`Shortlist plans for ${userId} must be an object.`);
        return;
      }

      Object.entries(plans).forEach(([programmeId, plan]) => {
        if (!isShortlistProgrammePlan(plan)) {
          errors.push(
            `Shortlist plan for ${userId}/${programmeId} is missing required fields.`,
          );
        }
      });
    });
  }

  if ('campusNotes' in data && data.campusNotes !== undefined && !Array.isArray(data.campusNotes)) {
    errors.push('Campus notes must be an array when present.');
  } else if (Array.isArray(data.campusNotes)) {
    data.campusNotes.forEach((note, index) => {
      if (!isCampusNote(note)) errors.push(`Campus note ${index + 1} is missing required fields.`);
    });
  }

  if ('uploaderInboxRequests' in data && data.uploaderInboxRequests !== undefined && !Array.isArray(data.uploaderInboxRequests)) {
    errors.push('Uploader inbox requests must be an array when present.');
  } else if (Array.isArray(data.uploaderInboxRequests)) {
    data.uploaderInboxRequests.forEach((inboxRequest, index) => {
      if (!isUploaderInboxRequest(inboxRequest)) errors.push(`Uploader inbox request ${index + 1} is missing required fields.`);
    });
  }

  if (
    'peerConnectionRequests' in data &&
    data.peerConnectionRequests !== undefined &&
    !Array.isArray(data.peerConnectionRequests)
  ) {
    errors.push('Peer connection requests must be an array when present.');
  } else if (Array.isArray(data.peerConnectionRequests)) {
    data.peerConnectionRequests.forEach((request, index) => {
      if (!isPeerConnectionRequest(request)) {
        errors.push(`Peer connection request ${index + 1} is missing required fields.`);
      }
    });
  }

  if (!Array.isArray(data.programmeRecords)) {
    errors.push('Snapshot programme records must be an array.');
  } else {
    data.programmeRecords.forEach((programme, index) => {
      const validationErrors = isPlainObject(programme)
        ? validateProgrammeDraft(programme as Partial<Programme>)
        : ['Programme record must be an object.'];

      if (validationErrors.length > 0) {
        errors.push(
          `Programme record ${index + 1} needs review: ${validationErrors[0]}`,
        );
      }
    });
  }

  if (
    'outcomeMetricRecords' in data &&
    data.outcomeMetricRecords !== undefined &&
    !Array.isArray(data.outcomeMetricRecords)
  ) {
    errors.push('Outcome metric records must be an array when present.');
  } else if (Array.isArray(data.outcomeMetricRecords)) {
    data.outcomeMetricRecords.forEach((record, index) => {
      if (!isOutcomeMetricRecord(record)) {
        errors.push(`Outcome metric record ${index + 1} is missing required fields.`);
      }
    });
  }

  if (!Array.isArray(data.auditEvents)) {
    errors.push('Snapshot audit events must be an array.');
  } else {
    data.auditEvents.forEach((event, index) => {
      if (!isAuditEvent(event)) {
        errors.push(`Audit event ${index + 1} is missing required fields.`);
      }
    });
  }

  if (
    'restoreBackups' in data &&
    data.restoreBackups !== undefined &&
    !Array.isArray(data.restoreBackups)
  ) {
    errors.push('Snapshot restore backups must be an array when present.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    counts: errors.length === 0
      ? getDataCounts(data as unknown as ScholarScoutData)
      : getPartialDataCounts(data),
  };
}

export class ScholarScoutDataRestoreError extends Error {
  constructor(readonly validation: ScholarScoutDataImportValidation) {
    super(validation.errors[0] ?? 'Snapshot could not be restored.');
  }
}

export async function restoreScholarScoutDataFromImport(input: {
  actorUserId: string;
  snapshot: unknown;
  reason?: string;
}): Promise<ScholarScoutDataRestoreResult> {
  const validation = validateScholarScoutDataImport(input.snapshot);

  if (!validation.isValid) {
    throw new ScholarScoutDataRestoreError(validation);
  }

  const restoreData = normalizeImportData(input.snapshot);

  if (!restoreData) {
    throw new ScholarScoutDataRestoreError({
      isValid: false,
      errors: ['Snapshot must be a ScholarScout data object.'],
      counts: emptyDataCounts(),
    });
  }

  const currentData = await readScholarScoutData();
  const restoredAt = new Date().toISOString();
  const backup: ScholarScoutDataBackup = {
    id: randomUUID(),
    createdAt: restoredAt,
    actorUserId: input.actorUserId,
    reason: input.reason?.trim() || 'Manual staff restore',
    counts: getDataCounts(currentData),
    data: {
      ...currentData,
      restoreBackups: [],
    },
  };
  const restoredData: ScholarScoutData = {
    ...restoreData,
    restoreBackups: [
      backup,
      ...(restoreData.restoreBackups ?? []).slice(0, MAX_RESTORE_BACKUPS - 1),
    ],
    auditEvents: [
      ...restoreData.auditEvents,
      createAuditEvent(
        input.actorUserId,
        'restore',
        'data',
        backup.id,
        restoredAt,
      ),
    ],
  };

  await writeScholarScoutData(restoredData);

  return {
    backupId: backup.id,
    restoredAt,
    counts: getDataCounts(restoredData),
  };
}

export async function restoreScholarScoutDataFromBackup(input: {
  actorUserId: string;
  backupId: string;
  reason?: string;
}): Promise<ScholarScoutDataRestoreResult | null> {
  const currentData = await readScholarScoutData();
  const sourceBackup = (currentData.restoreBackups ?? []).find(
    (candidate) => candidate.id === input.backupId,
  );

  if (!sourceBackup) {
    return null;
  }

  const validation = validateScholarScoutDataImport(sourceBackup.data);

  if (!validation.isValid) {
    throw new ScholarScoutDataRestoreError(validation);
  }

  const restoredAt = new Date().toISOString();
  const backup: ScholarScoutDataBackup = {
    id: randomUUID(),
    createdAt: restoredAt,
    actorUserId: input.actorUserId,
    reason:
      input.reason?.trim() ||
      `Backup restore before restoring ${sourceBackup.id}`,
    counts: getDataCounts(currentData),
    data: {
      ...currentData,
      restoreBackups: [],
    },
  };
  const restoredData: ScholarScoutData = {
    ...sourceBackup.data,
    restoreBackups: [
      backup,
      ...(currentData.restoreBackups ?? []).filter(
        (candidate) => candidate.id !== sourceBackup.id,
      ),
    ].slice(0, MAX_RESTORE_BACKUPS),
    auditEvents: [
      ...sourceBackup.data.auditEvents,
      createAuditEvent(
        input.actorUserId,
        'restore-backup',
        'data',
        sourceBackup.id,
        restoredAt,
      ),
    ],
  };

  await writeScholarScoutData(restoredData);

  return {
    backupId: backup.id,
    sourceBackupId: sourceBackup.id,
    restoredAt,
    counts: getDataCounts(restoredData),
  };
}

export async function getScholarScoutRestoreBackups(): Promise<
  ScholarScoutDataBackupSummary[]
> {
  const data = await readScholarScoutData();

  return (data.restoreBackups ?? [])
    .map((backup) => summarizeRestoreBackup(backup, data))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getScholarScoutRestoreBackupPlan(
  backupId: string,
): Promise<ScholarScoutDataRestorePlan | null> {
  const data = await readScholarScoutData();
  const backup = (data.restoreBackups ?? []).find(
    (candidate) => candidate.id === backupId,
  );

  if (!backup) {
    return null;
  }

  const currentCounts = getDataCounts(data);
  const restoredCounts = getDataCounts(backup.data);

  return {
    backup: summarizeRestoreBackup(backup, data),
    rows: dataCountLabels.map((item) => ({
      key: item.key,
      label: item.label,
      currentCount: currentCounts[item.key],
      restoredCount: restoredCounts[item.key],
      delta: restoredCounts[item.key] - currentCounts[item.key],
    })),
  };
}

export function getScholarScoutDataStore() {
  if (activeDataStore) {
    return activeDataStore;
  }

  const adapterName = getDataStoreAdapterName();

  if (adapterName === 'json') {
    activeDataStore = new JsonScholarScoutDataStore(dataFilePath);
    return activeDataStore;
  }

  if (adapterName === 'http') {
    const serviceUrl = process.env.SCHOLARSCOUT_DATA_SERVICE_URL;

    if (!serviceUrl) {
      throw new Error(
        'SCHOLARSCOUT_DATA_SERVICE_URL is required when SCHOLARSCOUT_DATA_ADAPTER=http.',
      );
    }

    activeDataStore = new HttpScholarScoutDataStore(
      serviceUrl,
      process.env.SCHOLARSCOUT_DATA_SERVICE_TOKEN,
    );
    return activeDataStore;
  }

  if (adapterName === 'vercel-blob') {
    const token =
      process.env.SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN ??
      process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      throw new Error(
        'BLOB_READ_WRITE_TOKEN or SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN is required when SCHOLARSCOUT_DATA_ADAPTER=vercel-blob.',
      );
    }

    activeDataStore = new VercelBlobScholarScoutDataStore(
      process.env.SCHOLARSCOUT_BLOB_DATA_PATH ?? 'scholarscout/data.json',
      token,
    );
    return activeDataStore;
  }

  throw new Error(
    `Unsupported ScholarScout data adapter "${adapterName}". Configure SCHOLARSCOUT_DATA_ADAPTER=json, SCHOLARSCOUT_DATA_ADAPTER=http, or SCHOLARSCOUT_DATA_ADAPTER=vercel-blob.`,
  );
}

export function setScholarScoutDataStoreForTests(
  dataStore: ScholarScoutDataStore | null,
) {
  activeDataStore = dataStore;
}

export async function readScholarScoutData() {
  return normalizeScholarScoutData(await getScholarScoutDataStore().read());
}

export async function readVersionedScholarScoutData(): Promise<VersionedScholarScoutData> {
  const store = getScholarScoutDataStore();
  if (store.readVersioned) {
    const versioned = await store.readVersioned();
    return { data: normalizeScholarScoutData(versioned.data), version: versioned.version };
  }
  const data = normalizeScholarScoutData(await store.read());
  return { data, version: hashScholarScoutData(data) };
}

export async function writeVersionedScholarScoutData(
  data: ScholarScoutData,
  expectedVersion: string | null,
): Promise<ConditionalWriteResult> {
  const store = getScholarScoutDataStore();
  if (store.writeVersioned) {
    return store.writeVersioned(normalizeScholarScoutData(data), expectedVersion);
  }
  await store.write(normalizeScholarScoutData(data));
  return { status: 'applied', version: hashScholarScoutData(data) };
}

export type ScholarScoutDataStoreReadFailureCategory =
  | 'unavailable'
  | 'timeout'
  | 'invalid-data';

export class ScholarScoutDataStoreReadError extends Error {
  constructor(readonly category: ScholarScoutDataStoreReadFailureCategory) {
    super('ScholarScout stored data could not be read safely.');
    this.name = 'ScholarScoutDataStoreReadError';
  }
}

export async function writeScholarScoutData(data: ScholarScoutData) {
  await getScholarScoutDataStore().write(normalizeScholarScoutData(data));
}

/** Hashes an opaque, high-entropy guest credential before it is used as a storage lookup. */
export function hashGuestCredential(credential: string): string {
  return createHash('sha256').update(credential).digest('hex');
}

/** Registers a server-issued guest lifecycle without retaining its raw browser credential. */
export async function registerGuestLifecycle(input: {
  guestId?: string;
  credentialHash: string;
  quotaWindowId?: string;
  now?: Date;
}): Promise<GuestLifecycleRecord> {
  const now = input.now ?? new Date();
  const guestId = input.guestId ?? randomUUID();
  const lifecycle: GuestLifecycleRecord = {
    id: guestId,
    credentialHash: input.credentialHash,
    quotaWindowId: input.quotaWindowId ?? guestId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const { applyOperationalReplacement, OPERATIONAL_MUTATION_POLICIES } = await import(
    '@/lib/server/operational-records'
  );
  return applyOperationalReplacement(
    OPERATIONAL_MUTATION_POLICIES.guestLifecycleRegistration,
    (data) => {
      if (data.guestLifecycles?.some((guest) => guest.id === guestId)) {
        throw new Error('Guest lifecycle already exists.');
      }
      data.guestLifecycles = [...(data.guestLifecycles ?? []), lifecycle];
      return lifecycle;
    },
  );
}

/** Returns an unmigrated guest lifecycle only when its trusted credential and expiry remain valid. */
export async function getActiveGuestLifecycleByCredentialHash(
  credentialHash: string,
  now = new Date(),
): Promise<GuestLifecycleRecord | null> {
  const data = await readScholarScoutData();
  const lifecycle = data.guestLifecycles?.find(
    (guest) => guest.credentialHash === credentialHash,
  );

  if (
    !lifecycle ||
    lifecycle.migratedAt ||
    new Date(lifecycle.expiresAt).getTime() <= now.getTime()
  ) {
    return null;
  }

  return lifecycle;
}

/** Returns the active migrated guest quota window for an account, if one still applies. */
export async function getGuestQuotaBindingForAccount(
  accountId: string,
  now = new Date(),
): Promise<string | null> {
  const data = await readScholarScoutData();
  const binding = data.guestQuotaBindings?.[accountId];

  if (!binding || new Date(binding.expiresAt).getTime() <= now.getTime()) {
    return null;
  }

  return binding.guestWindowId;
}

export async function createUser(input: {
  email: string;
  name: string;
  password: string;
  role: AccountRole;
}) {
  const email = normalizeEmail(input.email);

  const user: StoredUser = {
    id: randomUUID(),
    email,
    name: input.name.trim() || email.split('@')[0],
    role: input.role,
    passwordHash: await hashPassword(input.password),
    createdAt: new Date().toISOString(),
  };

  const { createStudentAccountRecord } = await import(
    '@/lib/server/student-records'
  );
  return createStudentAccountRecord(user);
}

export async function findOrCreateOAuthUser(input: {
  email: string;
  name?: string | null;
}) {
  const email = normalizeEmail(input.email);

  const user: StoredUser = {
    id: randomUUID(),
    email,
    name: input.name?.trim() || email.split('@')[0],
    role: getAccountRoleForEmail(email),
    passwordHash: 'oauth',
    createdAt: new Date().toISOString(),
  };

  const { findOrCreateOAuthStudentRecord } = await import(
    '@/lib/server/student-records'
  );
  return findOrCreateOAuthStudentRecord(user);
}

export async function verifyUserCredentials(
  email: string,
  password: string,
): Promise<CredentialVerificationResult> {
  const data = await readScholarScoutData();
  const user = data.users.find(
    (candidate) => candidate.email === normalizeEmail(email),
  );

  if (!user) {
    return { status: 'unknown-account', user: null };
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    return { status: 'incorrect-password', user: null };
  }

  return { status: 'verified', user };
}

/** Issues an opaque credential-only handoff that NextAuth may consume exactly once. */
export function issueCredentialGrant(input: {
  email: string;
  ip: string;
  user: StoredUser;
  now?: Date;
}): string {
  const now = input.now?.getTime() ?? Date.now();
  const grant = randomBytes(32).toString('base64url');

  pruneExpiredCredentialGrants(now);
  credentialGrants.set(grant, {
    email: normalizeEmail(input.email),
    ip: input.ip,
    expiresAt: now + CREDENTIAL_GRANT_TTL_MS,
    user: input.user,
  });

  return grant;
}

/** Atomically consumes a short-lived server grant without accepting raw credentials. */
export function consumeCredentialGrant(grant: string): StoredUser | null {
  const now = Date.now();
  pruneExpiredCredentialGrants(now);
  const storedGrant = credentialGrants.get(grant);
  credentialGrants.delete(grant);

  if (!storedGrant || storedGrant.expiresAt <= now) {
    return null;
  }

  return storedGrant.user;
}

export async function getUserById(userId: string) {
  const data = await readScholarScoutData();
  return data.users.find((user) => user.id === userId) ?? null;
}

export async function saveOnboardingProfile(
  userId: string,
  profile: OnboardingData,
) {
  const { replaceStudentOnboardingProfile } = await import(
    '@/lib/server/student-records'
  );
  await replaceStudentOnboardingProfile(userId, profile);
}

export async function getOnboardingProfile(userId: string) {
  const data = await readScholarScoutData();
  return data.onboardingProfiles[userId] ?? null;
}

export async function saveShortlist(userId: string, programmeIds: string[]) {
  const { replaceStudentShortlistIds } = await import(
    '@/lib/server/student-records'
  );
  await replaceStudentShortlistIds(userId, programmeIds);
}

export async function getShortlist(userId: string) {
  const data = await readScholarScoutData();
  return data.shortlists[userId] ?? [];
}

export async function saveShortlistPlans(
  userId: string,
  plans: ShortlistPlanMap,
) {
  const { replaceStudentShortlistPlans } = await import(
    '@/lib/server/student-records'
  );
  await replaceStudentShortlistPlans(userId, plans);
}

export async function saveShortlistState(
  userId: string,
  programmeIds: string[],
  plans: ShortlistPlanMap,
) {
  const { replaceStudentShortlistState } = await import(
    '@/lib/server/student-records'
  );
  await replaceStudentShortlistState(userId, programmeIds, plans);
}

export async function getShortlistPlans(userId: string) {
  const data = await readScholarScoutData();
  return pruneStoredShortlistPlans(
    data.shortlistPlans?.[userId] ?? {},
    data.shortlists[userId] ?? [],
  );
}

export {
  deleteProgrammeRecord,
  ProgrammeRevisionConflictError,
  saveProgrammeRecord,
} from '@/lib/server/programme-records';

export async function getProgrammeRecords() {
  const data = await readScholarScoutData();
  return data.programmeRecords;
}

export async function getOutcomeMetricRecords() {
  const data = await readScholarScoutData();
  return data.outcomeMetricRecords ?? [];
}

export async function createPeerConnectionRequest(
  requesterId: string,
  input: CreatePeerConnectionRequest,
) {
  const errors = validatePeerConnectionRequest(input);
  if (errors.length > 0) {
    throw new Error(errors[0]);
  }

  const request: PeerConnectionRequest = {
    id: randomUUID(),
    requester_id: requesterId,
    peer_guide_username: input.peer_guide_username.trim(),
    program_id: input.program_id.trim(),
    topic: input.topic.trim(),
    question: input.question.trim(),
    status: 'pending',
    created_at: new Date().toISOString(),
  };
  const audit = createAuditEvent(requesterId, 'request-peer-connection', 'data', request.id);
  const { applyOperationalReplacement, OPERATIONAL_MUTATION_POLICIES } = await import(
    '@/lib/server/operational-records'
  );
  return applyOperationalReplacement(OPERATIONAL_MUTATION_POLICIES.communityMutation, (data) => {
    data.peerConnectionRequests = [request, ...(data.peerConnectionRequests ?? [])];
    data.auditEvents.push(audit);
    return request;
  });
}

export async function getPeerConnectionRequests(requesterId: string) {
  const data = await readScholarScoutData();
  return (data.peerConnectionRequests ?? []).filter(
    (request) => request.requester_id === requesterId,
  );
}

export async function getCampusNotes(schoolSlug: string, uploaderUsername?: string) {
  const data = await readScholarScoutData();
  return (data.campusNotes ?? [])
    .filter((note) => note.school_slug === schoolSlug && (!uploaderUsername || note.uploader_username === uploaderUsername))
    .sort((left, right) => right.created_at.localeCompare(left.created_at));
}

export async function createCampusNote(
  authorId: string,
  input: Omit<CampusNote, 'id' | 'author_id' | 'created_at'>,
) {
  const errors = validateCampusNote(input);
  if (errors.length) throw new Error(errors[0]);
  const note: CampusNote = { ...input, body: input.body.trim(), id: randomUUID(), author_id: authorId, created_at: new Date().toISOString() };
  const audit = createAuditEvent(authorId, 'post-campus-note', 'data', note.id);
  const { applyOperationalReplacement, OPERATIONAL_MUTATION_POLICIES } = await import(
    '@/lib/server/operational-records'
  );
  return applyOperationalReplacement(OPERATIONAL_MUTATION_POLICIES.communityMutation, (data) => {
    data.campusNotes = [note, ...(data.campusNotes ?? [])];
    data.auditEvents.push(audit);
    return note;
  });
}

export async function createUploaderInboxRequest(
  senderId: string,
  input: Pick<UploaderInboxRequest, 'uploader_username' | 'program_id' | 'body'>,
) {
  const errors = validateUploaderInboxRequest(input);
  if (errors.length) throw new Error(errors[0]);
  const inboxRequest: UploaderInboxRequest = { ...input, body: input.body.trim(), id: randomUUID(), sender_id: senderId, status: 'pending', created_at: new Date().toISOString() };
  const audit = createAuditEvent(senderId, 'request-uploader-inbox', 'data', inboxRequest.id);
  const { applyOperationalReplacement, OPERATIONAL_MUTATION_POLICIES } = await import(
    '@/lib/server/operational-records'
  );
  return applyOperationalReplacement(OPERATIONAL_MUTATION_POLICIES.communityMutation, (data) => {
    data.uploaderInboxRequests = [inboxRequest, ...(data.uploaderInboxRequests ?? [])];
    data.auditEvents.push(audit);
    return inboxRequest;
  });
}

/**
 * Replaces outcome evidence as a deliberate staff data operation. This persists
 * source-linked rows only; ranking remains guarded by outcome-profiles.ts.
 */
export async function saveOutcomeMetricRecords(
  userId: string,
  records: OutcomeMetricRecord[],
) {
  const errors = records.flatMap((record, index) =>
    validateOutcomeMetricRecord(record).map(
      (error) => `Outcome metric record ${index + 1}: ${error}`,
    ),
  );
  if (errors.length > 0) {
    throw new Error(errors[0]);
  }

  const audit = createAuditEvent(userId, 'replace-outcome-metrics', 'data', 'outcome-metrics');
  const { applyOperationalReplacement, OPERATIONAL_MUTATION_POLICIES } = await import(
    '@/lib/server/operational-records'
  );
  return applyOperationalReplacement(
    OPERATIONAL_MUTATION_POLICIES.outcomeMetricsReplacement,
    (data) => {
      data.outcomeMetricRecords = records;
      data.auditEvents.push(audit);
      return data.outcomeMetricRecords;
    },
  );
}

export async function getProgrammeAuditEvents(): Promise<ProgrammeAuditEvent[]> {
  const data = await readScholarScoutData();
  const usersById = new Map(data.users.map((user) => [user.id, user]));

  return data.auditEvents
    .filter((event) => event.entityType === 'programme')
    .map((event) => ({
      ...event,
      actorLabel: usersById.get(event.userId)?.name ?? 'Staff account',
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function appendPrivilegedOperationAudit(input: {
  actorId: string;
  action: string;
  route: string;
  outcome: PrivilegedOperationAuditEvent['outcome'];
}): Promise<void> {
  const event: PrivilegedOperationAuditEvent = {
    id: randomUUID(),
    actorId: input.actorId,
    action: input.action,
    route: input.route,
    outcome: input.outcome,
    createdAt: new Date().toISOString(),
  };
  const { appendOperationalRecord, OPERATIONAL_MUTATION_POLICIES } = await import(
    '@/lib/server/operational-records'
  );
  await appendOperationalRecord({
    policy: OPERATIONAL_MUTATION_POLICIES.privilegedAuditAppend,
    collection: 'privilegedOperationAuditEvents',
    record: event,
  });
}

export async function getPrivilegedOperationAuditEvents(): Promise<
  PrivilegedOperationAuditEvent[]
> {
  const data = await readScholarScoutData();
  return [...(data.privilegedOperationAuditEvents ?? [])].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export function createAuditEvent(
  userId: string,
  action: string,
  entityType: AuditEvent['entityType'],
  entityId: string,
  createdAt = new Date().toISOString(),
): AuditEvent {
  return {
    id: randomUUID(),
    userId,
    action,
    entityType,
    entityId,
    createdAt,
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function splitEnvList(value: string | undefined) {
  return (value ?? '')
    .split(',')
    .map((item) => normalizeEmail(item))
    .filter(Boolean);
}

function getDataCounts(data: ScholarScoutData) {
  return {
    users: data.users.length,
    onboardingProfiles: Object.keys(data.onboardingProfiles).length,
    shortlists: Object.keys(data.shortlists).length,
    programmeRecords: data.programmeRecords.length,
    auditEvents: data.auditEvents.length,
  };
}

export function getRestoreBackupRetentionStatus(
  data: ScholarScoutData,
): ScholarScoutBackupRetentionStatus {
  const backups = data.restoreBackups ?? [];
  const issues: string[] = [];

  if (backups.length > MAX_RESTORE_BACKUPS) {
    issues.push(
      `Restore backup history retains ${backups.length} backups; policy keeps ${MAX_RESTORE_BACKUPS}.`,
    );
  }

  const nestedBackupIds = backups
    .filter((backup) => (backup.data.restoreBackups ?? []).length > 0)
    .map((backup) => backup.id);

  if (nestedBackupIds.length > 0) {
    issues.push(
      `Restore backups should not contain nested backup history: ${nestedBackupIds.join(', ')}.`,
    );
  }

  const duplicateIds = getDuplicateValues(backups.map((backup) => backup.id));

  if (duplicateIds.length > 0) {
    issues.push(
      `Restore backup ids should be unique: ${duplicateIds.join(', ')}.`,
    );
  }

  return {
    retainedBackups: backups.length,
    maxRetainedBackups: MAX_RESTORE_BACKUPS,
    isWithinPolicy: issues.length === 0,
    issues,
  };
}

function getDuplicateValues(values: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  values.forEach((value) => {
    if (seen.has(value)) {
      duplicates.add(value);
      return;
    }

    seen.add(value);
  });

  return Array.from(duplicates);
}

const dataCountLabels: Array<{
  key: keyof ScholarScoutDataStoreStatus['counts'];
  label: string;
}> = [
  { key: 'users', label: 'Users' },
  { key: 'onboardingProfiles', label: 'Profiles' },
  { key: 'shortlists', label: 'Shortlists' },
  { key: 'programmeRecords', label: 'Programmes' },
  { key: 'auditEvents', label: 'Audit events' },
];

function summarizeRestoreBackup(
  backup: ScholarScoutDataBackup,
  currentData: ScholarScoutData,
): ScholarScoutDataBackupSummary {
  const usersById = new Map(currentData.users.map((user) => [user.id, user]));

  return {
    id: backup.id,
    createdAt: backup.createdAt,
    actorUserId: backup.actorUserId,
    actorLabel: usersById.get(backup.actorUserId)?.name ?? 'Staff account',
    reason: backup.reason,
    counts: backup.counts,
  };
}

function emptyDataCounts() {
  return {
    users: 0,
    onboardingProfiles: 0,
    shortlists: 0,
    programmeRecords: 0,
    auditEvents: 0,
  };
}

function getPartialDataCounts(data: Record<string, unknown>) {
  return {
    users: Array.isArray(data.users) ? data.users.length : 0,
    onboardingProfiles: isRecord(data.onboardingProfiles)
      ? Object.keys(data.onboardingProfiles).length
      : 0,
    shortlists: isRecord(data.shortlists)
      ? Object.keys(data.shortlists).length
      : 0,
    programmeRecords: Array.isArray(data.programmeRecords)
      ? data.programmeRecords.length
      : 0,
    auditEvents: Array.isArray(data.auditEvents) ? data.auditEvents.length : 0,
  };
}

function getImportDataCandidate(input: unknown) {
  if (isPlainObject(input) && 'data' in input) {
    return input.data;
  }

  return input;
}

function normalizeImportData(input: unknown): ScholarScoutData | null {
  const data = getImportDataCandidate(input);

  if (!isPlainObject(data)) {
    return null;
  }

  return {
    users: data.users as StoredUser[],
    onboardingProfiles: data.onboardingProfiles as Record<string, OnboardingData>,
    shortlists: data.shortlists as Record<string, string[]>,
    shortlistPlans: isRecord(data.shortlistPlans)
      ? (data.shortlistPlans as Record<string, ShortlistPlanMap>)
      : {},
    programmeRecords: data.programmeRecords as Programme[],
    outcomeMetricRecords: Array.isArray(data.outcomeMetricRecords)
      ? (data.outcomeMetricRecords as OutcomeMetricRecord[])
      : [],
    peerConnectionRequests: Array.isArray(data.peerConnectionRequests)
      ? (data.peerConnectionRequests as PeerConnectionRequest[])
      : [],
    campusNotes: Array.isArray(data.campusNotes) ? (data.campusNotes as CampusNote[]) : [],
    uploaderInboxRequests: Array.isArray(data.uploaderInboxRequests)
      ? (data.uploaderInboxRequests as UploaderInboxRequest[])
      : [],
    auditEvents: data.auditEvents as AuditEvent[],
    restoreBackups: Array.isArray(data.restoreBackups)
      ? (data.restoreBackups as ScholarScoutDataBackup[])
      : [],
    guestLifecycles: Array.isArray(data.guestLifecycles)
      ? (data.guestLifecycles as GuestLifecycleRecord[])
      : [],
    guestQuotaBindings: isRecord(data.guestQuotaBindings)
      ? (data.guestQuotaBindings as Record<string, GuestQuotaBinding>)
      : {},
    guestMigrationAuditRecords: Array.isArray(data.guestMigrationAuditRecords)
      ? (data.guestMigrationAuditRecords as GuestMigrationAuditRecord[])
      : [],
    privilegedOperationAuditEvents: Array.isArray(data.privilegedOperationAuditEvents)
      ? (data.privilegedOperationAuditEvents as PrivilegedOperationAuditEvent[])
      : [],
  };
}

function normalizeScholarScoutData(data: ScholarScoutData): ScholarScoutData {
  return {
    ...INITIAL_DATA,
    ...data,
    guestLifecycles: Array.isArray(data.guestLifecycles)
      ? data.guestLifecycles.filter(isGuestLifecycleRecord)
      : [],
    guestQuotaBindings: normalizeGuestQuotaBindings(data.guestQuotaBindings),
    guestMigrationAuditRecords: Array.isArray(data.guestMigrationAuditRecords)
      ? data.guestMigrationAuditRecords.filter(isGuestMigrationAuditRecord)
      : [],
    privilegedOperationAuditEvents: Array.isArray(data.privilegedOperationAuditEvents)
      ? data.privilegedOperationAuditEvents.filter(isPrivilegedOperationAuditEvent)
      : [],
    recoveryLifecycleEvents: Array.isArray(data.recoveryLifecycleEvents)
      ? data.recoveryLifecycleEvents.filter(isRecoveryLifecycleEvent)
      : [],
    recoveryPlanOutcomes: Array.isArray(data.recoveryPlanOutcomes)
      ? data.recoveryPlanOutcomes.filter(isRecoveryPlanOutcome)
      : [],
  };
}

function isRecoveryLifecycleEvent(value: unknown): value is RecoveryLifecycleEvent {
  if (!isPlainObject(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.actorId === 'string' &&
    (value.action === 'apply-recovery-plan' ||
      value.action === 'release-incident-hold' ||
      value.action === 'prune-recovery-backup') &&
    value.category === 'recovery' &&
    isValidTimestamp(value.timestamp) &&
    (value.outcome === 'succeeded' || value.outcome === 'failed-no-write')
  );
}

function isRecoveryPlanOutcome(value: unknown): value is RecoveryPlanOutcome {
  if (!isPlainObject(value)) return false;
  return (
    typeof value.planId === 'string' &&
    typeof value.actorId === 'string' &&
    typeof value.sourceId === 'string' &&
    typeof value.backupId === 'string' &&
    typeof value.incidentId === 'string' &&
    isValidTimestamp(value.appliedAt) &&
    value.outcome === 'succeeded'
  );
}

function parseStoredScholarScoutData(input: unknown): ScholarScoutData {
  const validation = validateScholarScoutDataImport(input);

  if (!validation.isValid || !isPlainObject(input)) {
    throw new ScholarScoutDataStoreReadError('invalid-data');
  }

  return normalizeScholarScoutData(input as unknown as ScholarScoutData);
}

function createInitialData(): ScholarScoutData {
  return JSON.parse(JSON.stringify(INITIAL_DATA)) as ScholarScoutData;
}

function isFileNotFoundError(error: unknown): boolean {
  return (
    isPlainObject(error) &&
    'code' in error &&
    error.code === 'ENOENT'
  );
}

function isTimeoutError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'AbortError' || error.name === 'TimeoutError')
  );
}

function normalizeGuestQuotaBindings(
  bindings: Record<string, GuestQuotaBinding> | undefined,
): Record<string, GuestQuotaBinding> {
  return Object.fromEntries(
    Object.entries(bindings ?? {}).filter(([, binding]) =>
      isGuestQuotaBinding(binding),
    ),
  );
}

function isGuestLifecycleRecord(value: unknown): value is GuestLifecycleRecord {
  if (!isPlainObject(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.credentialHash === 'string' &&
    typeof value.quotaWindowId === 'string' &&
    isValidTimestamp(value.createdAt) &&
    isValidTimestamp(value.expiresAt) &&
    (value.migratedAt === undefined || isValidTimestamp(value.migratedAt)) &&
    (value.migratedToAccountId === undefined || typeof value.migratedToAccountId === 'string')
  );
}

function isGuestQuotaBinding(value: unknown): value is GuestQuotaBinding {
  if (!isPlainObject(value)) return false;

  return (
    typeof value.guestId === 'string' &&
    typeof value.guestWindowId === 'string' &&
    isValidTimestamp(value.createdAt) &&
    isValidTimestamp(value.expiresAt)
  );
}

function isGuestMigrationAuditRecord(
  value: unknown,
): value is GuestMigrationAuditRecord {
  if (!isPlainObject(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.guestId === 'string' &&
    typeof value.accountId === 'string' &&
    isValidTimestamp(value.migratedAt) &&
    Array.isArray(value.transferredCollections) &&
    value.transferredCollections.every((collection) => typeof collection === 'string')
  );
}

function isPrivilegedOperationAuditEvent(
  value: unknown,
): value is PrivilegedOperationAuditEvent {
  if (!isPlainObject(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.actorId === 'string' &&
    typeof value.action === 'string' &&
    typeof value.route === 'string' &&
    (value.outcome === 'allowed' || value.outcome === 'denied') &&
    isValidTimestamp(value.createdAt)
  );
}

function isValidTimestamp(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value);
}

function isStoredUser(value: unknown): value is StoredUser {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.email === 'string' &&
    typeof value.name === 'string' &&
    (value.role === 'student' || value.role === 'staff') &&
    typeof value.passwordHash === 'string' &&
    typeof value.createdAt === 'string'
  );
}

function isAuditEvent(value: unknown): value is AuditEvent {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.userId === 'string' &&
    typeof value.action === 'string' &&
    (value.entityType === 'onboarding' ||
      value.entityType === 'shortlist' ||
      value.entityType === 'programme' ||
      value.entityType === 'data') &&
    typeof value.entityId === 'string' &&
    typeof value.createdAt === 'string'
  );
}

function isOutcomeMetricRecord(value: unknown): value is OutcomeMetricRecord {
  if (!isPlainObject(value)) {
    return false;
  }

  if (
    typeof value.institution_id !== 'string' ||
    (value.program_CIP !== null && typeof value.program_CIP !== 'string') ||
    typeof value.metric_name !== 'string' ||
    (value.value !== null && typeof value.value !== 'number') ||
    (value.cohort_size !== null && typeof value.cohort_size !== 'number') ||
    typeof value.cohort_definition !== 'string' ||
    typeof value.as_of_date !== 'string' ||
    typeof value.source_url !== 'string' ||
    typeof value.source_type !== 'string' ||
    typeof value.confidence !== 'string' ||
    (value.suppression_reason !== null && typeof value.suppression_reason !== 'string')
  ) {
    return false;
  }

  return validateOutcomeMetricRecord(value as unknown as OutcomeMetricRecord).length === 0;
}

function isPeerConnectionRequest(value: unknown): value is PeerConnectionRequest {
  if (!isPlainObject(value)) return false;
  if (
    typeof value.id !== 'string' ||
    typeof value.requester_id !== 'string' ||
    typeof value.peer_guide_username !== 'string' ||
    typeof value.program_id !== 'string' ||
    typeof value.topic !== 'string' ||
    typeof value.question !== 'string' ||
    typeof value.created_at !== 'string' ||
    (value.status !== 'pending' && value.status !== 'accepted' && value.status !== 'declined' && value.status !== 'closed')
  ) {
    return false;
  }
  return validatePeerConnectionRequest({
    peer_guide_username: value.peer_guide_username,
    program_id: value.program_id,
    topic: value.topic,
    question: value.question,
  }).length === 0;
}

function isCampusNote(value: unknown): value is CampusNote {
  if (!isPlainObject(value) || typeof value.id !== 'string' || typeof value.author_id !== 'string' || typeof value.school_slug !== 'string' || (value.uploader_username !== null && typeof value.uploader_username !== 'string') || (value.program_id !== null && typeof value.program_id !== 'string') || typeof value.body !== 'string' || typeof value.created_at !== 'string') return false;
  return validateCampusNote({ school_slug: value.school_slug, uploader_username: value.uploader_username as string | null, program_id: value.program_id as string | null, body: value.body }).length === 0;
}

function isUploaderInboxRequest(value: unknown): value is UploaderInboxRequest {
  if (!isPlainObject(value) || typeof value.id !== 'string' || typeof value.sender_id !== 'string' || typeof value.uploader_username !== 'string' || typeof value.program_id !== 'string' || typeof value.body !== 'string' || typeof value.created_at !== 'string' || (value.status !== 'pending' && value.status !== 'accepted' && value.status !== 'declined' && value.status !== 'closed')) return false;
  return validateUploaderInboxRequest({ uploader_username: value.uploader_username, program_id: value.program_id, body: value.body }).length === 0;
}

function normalizeStoredShortlistPlans(plans: ShortlistPlanMap) {
  return Object.entries(plans).reduce<ShortlistPlanMap>(
    (normalized, [programmeId, plan]) => {
      if (isShortlistProgrammePlan(plan)) {
        normalized[programmeId] = {
          status: plan.status,
          note: plan.note.slice(0, 500),
        };
      }

      return normalized;
    },
    {},
  );
}

function pruneStoredShortlistPlans(
  plans: ShortlistPlanMap,
  programmeIds: string[],
) {
  const allowedIds = new Set(programmeIds);

  return Object.entries(normalizeStoredShortlistPlans(plans)).reduce<ShortlistPlanMap>(
    (pruned, [programmeId, plan]) => {
      if (allowedIds.has(programmeId)) {
        pruned[programmeId] = plan;
      }

      return pruned;
    },
    {},
  );
}

function isShortlistProgrammePlan(
  value: unknown,
): value is ShortlistProgrammePlan {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    (value.status === 'considering' ||
      value.status === 'contacted' ||
      value.status === 'visit-planned' ||
      value.status === 'ready-to-apply') &&
    typeof value.note === 'string'
  );
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomUUID();
  const hash = (await derivePasswordKey(password, salt)).toString('hex');
  return `${salt}:${hash}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(':');

  if (!salt || !hash) {
    return false;
  }

  const candidate = Buffer.from(
    (await derivePasswordKey(password, salt)).toString('hex'),
  );
  const expected = Buffer.from(hash);

  return (
    candidate.length === expected.length && timingSafeEqual(candidate, expected)
  );
}

function derivePasswordKey(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (error, key) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(key);
    });
  });
}

function pruneExpiredCredentialGrants(now: number): void {
  credentialGrants.forEach((value, grant) => {
    if (value.expiresAt <= now) {
      credentialGrants.delete(grant);
    }
  });
}

async function readStreamText(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let text = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      return text + decoder.decode();
    }

    text += decoder.decode(value, { stream: true });
  }
}

function hashStoredDocument(value: string): string {
  return `"${createHash('sha256').update(value).digest('hex')}"`;
}

function hashScholarScoutData(data: ScholarScoutData): string {
  return hashStoredDocument(JSON.stringify(normalizeScholarScoutData(data), null, 2));
}

function normalizeStoreReadError(error: unknown): ScholarScoutDataStoreReadError {
  if (error instanceof ScholarScoutDataStoreReadError) return error;
  return new ScholarScoutDataStoreReadError(
    error instanceof SyntaxError
      ? 'invalid-data'
      : isTimeoutError(error)
        ? 'timeout'
        : 'unavailable',
  );
}

async function acquireJsonStoreLock(lockPath: string) {
  const deadline = Date.now() + 1_000;
  while (true) {
    try {
      return await open(lockPath, 'wx');
    } catch (error) {
      if (
        !error ||
        typeof error !== 'object' ||
        !('code' in error) ||
        error.code !== 'EEXIST'
      ) {
        throw error;
      }
      if (Date.now() >= deadline) {
        throw new Error('ScholarScout JSON data store is unavailable because another writer holds its lock.');
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }
}
