import 'server-only';

import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import {
  getDataStoreConfigurationSummary,
  readScholarScoutData,
  ScholarScoutDataStoreReadError,
  validateScholarScoutDataImport,
  writeScholarScoutData,
  type RecoveryLifecycleEvent,
  type ScholarScoutData,
  type ScholarScoutDataBackup,
  type RecoveryPlanOutcome,
} from '@/lib/server/data-store';

export const RECOVERY_ENVELOPE_MAX_BYTES = 5 * 1024 * 1024;
export const RECOVERY_PLAN_LIFETIME_MS = 10 * 60 * 1_000;
export const RECOVERY_PACKAGE_GRACE_MS = 30 * 24 * 60 * 60 * 1_000;
const RECOVERY_MAX_DEPTH = 32;
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export interface RecoverySigningConfiguration {
  currentKeyId: string;
  currentSecret: string;
  previousKeyId?: string;
  previousSecret?: string;
}

export interface SignedRecoveryEnvelope {
  version: 1;
  keyId: string;
  source: {
    id: string;
    createdAt: string;
  };
  data: ScholarScoutData;
  digest: string;
  signature: string;
}

export interface RecoveryPlanClaims {
  version: 1;
  keyId: string;
  planId: string;
  actorId: string;
  sourceId: string;
  sourceDigest: string;
  currentDataDigest: string;
  issuedAt: string;
  expiresAt: string;
}

export interface SignedRecoveryPlanToken {
  claims: RecoveryPlanClaims;
  signature: string;
}

export interface RecoveryPlanPreview {
  planId: string;
  sourceId: string;
  expiresAt: string;
  rows: Array<{
    key: keyof AdminDataCapabilities['counts'];
    label: string;
    currentCount: number;
    restoredCount: number;
    delta: number;
  }>;
}

export type DataRecoveryFailureCategory =
  | 'storage-unavailable'
  | 'storage-timeout'
  | 'invalid-stored-data';

export interface DataRecoveryFailure {
  category: DataRecoveryFailureCategory;
  incidentId: string;
  retryable: true;
}

export interface OperationalEvidenceEvent {
  actorId: string;
  action: 'read-data-capabilities' | 'apply-recovery-plan' | 'release-incident-hold';
  category: DataRecoveryFailureCategory;
  incidentId: string;
  timestamp: string;
  outcome: 'failed-no-write';
}

export const RECOVERY_BACKUP_MAX_COUNT = 10;
export const RECOVERY_BACKUP_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1_000;
export const RECOVERY_CONFIRMATION_PHRASE = 'RESTORE SCHOLARSCOUT DATA';
const RECOVERY_REASON_MAX_LENGTH = 500;

interface RecoveryMutationDependencies {
  read?: () => Promise<ScholarScoutData>;
  write?: (data: ScholarScoutData) => Promise<void>;
  now?: () => Date;
  signing?: RecoverySigningConfiguration;
  backupId?: () => string;
  auditId?: () => string;
  incidentId?: () => string;
  evidenceSink?: OperationalEvidenceSink;
}

export interface RecoveryApplyResult extends RecoveryPlanOutcome {
  counts: AdminDataCapabilities['counts'];
}

export type OperationalEvidenceSink = (
  event: OperationalEvidenceEvent,
) => void | Promise<void>;

export interface AdminDataOperationCapability {
  id: 'status' | 'backup-list' | 'import-validate';
  available: true;
  allowedAction: 'view' | 'validate';
  reason: 'available';
  retryable: false;
}

export interface AdminDataCapabilities {
  health: 'healthy';
  adapter: string;
  lastVerifiedAt: string;
  counts: {
    users: number;
    onboardingProfiles: number;
    shortlists: number;
    programmeRecords: number;
    auditEvents: number;
  };
  operations: AdminDataOperationCapability[];
}

export class DataRecoveryUnavailableError extends Error {
  constructor(readonly failure: DataRecoveryFailure) {
    super('ScholarScout data operations are unavailable.');
    this.name = 'DataRecoveryUnavailableError';
  }
}

interface ReadCapabilitiesDependencies {
  actorId: string;
  read?: () => Promise<ScholarScoutData>;
  configuration?: typeof getDataStoreConfigurationSummary;
  now?: () => Date;
  incidentId?: () => string;
  evidenceSink?: OperationalEvidenceSink;
}

const defaultEvidenceSink: OperationalEvidenceSink = (event) => {
  console.warn('ScholarScout data operation failed', event);
};

/** Performs one fresh validated read and returns only server-owned operations. */
export async function readAdminDataCapabilities({
  actorId,
  read = readScholarScoutData,
  configuration = getDataStoreConfigurationSummary,
  now = () => new Date(),
  incidentId = randomUUID,
  evidenceSink = defaultEvidenceSink,
}: ReadCapabilitiesDependencies): Promise<AdminDataCapabilities> {
  const configuredAdapter = configuration();

  try {
    if (!configuredAdapter.isConfigured) {
      throw new ScholarScoutDataStoreReadError('unavailable');
    }

    const data = await read();

    return {
      health: 'healthy',
      adapter: configuredAdapter.adapter,
      lastVerifiedAt: now().toISOString(),
      counts: {
        users: data.users.length,
        onboardingProfiles: Object.keys(data.onboardingProfiles).length,
        shortlists: Object.keys(data.shortlists).length,
        programmeRecords: data.programmeRecords.length,
        auditEvents: data.auditEvents.length,
      },
      operations: [
        {
          id: 'status',
          available: true,
          allowedAction: 'view',
          reason: 'available',
          retryable: false,
        },
        {
          id: 'backup-list',
          available: true,
          allowedAction: 'view',
          reason: 'available',
          retryable: false,
        },
        {
          id: 'import-validate',
          available: true,
          allowedAction: 'validate',
          reason: 'available',
          retryable: false,
        },
      ],
    };
  } catch (error) {
    const failure: DataRecoveryFailure = {
      category: getSafeFailureCategory(error),
      incidentId: incidentId(),
      retryable: true,
    };
    await evidenceSink({
      actorId,
      action: 'read-data-capabilities',
      category: failure.category,
      incidentId: failure.incidentId,
      timestamp: now().toISOString(),
      outcome: 'failed-no-write',
    });
    throw new DataRecoveryUnavailableError(failure);
  }
}

function getSafeFailureCategory(error: unknown): DataRecoveryFailureCategory {
  if (error instanceof ScholarScoutDataStoreReadError) {
    if (error.category === 'timeout') {
      return 'storage-timeout';
    }

    if (error.category === 'invalid-data') {
      return 'invalid-stored-data';
    }
  }

  return 'storage-unavailable';
}

/** Creates a bounded, versioned recovery package signed only by the current key. */
export function createSignedRecoveryEnvelope(input: {
  data: ScholarScoutData;
  sourceId: string;
  now?: Date;
  signing?: RecoverySigningConfiguration;
}): SignedRecoveryEnvelope {
  const signing = requireCurrentSigning(input.signing ?? getRecoverySigningConfiguration());
  const now = input.now ?? new Date();

  if (!isSafeId(input.sourceId) || !isValidDate(now)) {
    throw new Error('invalid-recovery-envelope');
  }

  assertValidRecoveryData(input.data);
  const digest = recoveryDataDigest(input.data);
  const unsigned = {
    version: 1 as const,
    keyId: signing.currentKeyId,
    source: { id: input.sourceId, createdAt: now.toISOString() },
    data: input.data,
    digest,
  };
  const signature = signCanonical(unsigned, signing.currentSecret);
  const envelope = { ...unsigned, signature };
  assertByteLimit(envelope);
  return envelope;
}

/** Validates untrusted package bytes without reading or writing application state. */
export function validateRecoveryEnvelope(
  input: unknown,
  options: { now?: Date; signing?: RecoverySigningConfiguration } = {},
): SignedRecoveryEnvelope {
  if (typeof input === 'string' && Buffer.byteLength(input, 'utf8') > RECOVERY_ENVELOPE_MAX_BYTES) {
    throw new Error('recovery-envelope-too-large');
  }

  let parsed = input;
  if (typeof input === 'string') {
    try {
      parsed = JSON.parse(input);
    } catch {
      throw new Error('invalid-recovery-envelope');
    }
  }
  assertByteLimit(parsed);
  assertBoundedStructure(parsed);

  if (
    !isExactRecord(parsed, ['version', 'keyId', 'source', 'data', 'digest', 'signature']) ||
    parsed.version !== 1 ||
    typeof parsed.keyId !== 'string' ||
    !isExactRecord(parsed.source, ['id', 'createdAt']) ||
    !isSafeId(parsed.source.id) ||
    typeof parsed.source.createdAt !== 'string' ||
    typeof parsed.digest !== 'string' ||
    !/^[a-f0-9]{64}$/.test(parsed.digest) ||
    typeof parsed.signature !== 'string' ||
    !/^[a-f0-9]{64}$/.test(parsed.signature)
  ) {
    throw new Error('invalid-recovery-envelope');
  }

  const signing = requireCurrentSigning(options.signing ?? getRecoverySigningConfiguration());
  const secret = selectVerificationSecret(parsed.keyId, signing);
  const now = options.now ?? new Date();
  const createdAt = new Date(parsed.source.createdAt);
  if (!isValidDate(now) || !isValidDate(createdAt) || createdAt.getTime() > now.getTime()) {
    throw new Error('invalid-recovery-timestamp');
  }
  if (createdAt.getTime() <= now.getTime() - RECOVERY_PACKAGE_GRACE_MS) {
    throw new Error('expired-recovery-envelope');
  }

  assertValidRecoveryData(parsed.data);
  const data = parsed.data as unknown as ScholarScoutData;
  if (!safeEqual(parsed.digest, recoveryDataDigest(data))) {
    throw new Error('invalid-recovery-digest');
  }
  const unsigned = {
    version: 1 as const,
    keyId: parsed.keyId,
    source: {
      id: parsed.source.id as string,
      createdAt: parsed.source.createdAt as string,
    },
    data,
    digest: parsed.digest,
  };
  if (!safeEqual(parsed.signature, signCanonical(unsigned, secret))) {
    throw new Error('invalid-recovery-signature');
  }

  return { ...unsigned, signature: parsed.signature };
}

/** Produces a non-mutating, count-only plan tied to actor, source and current state. */
export function issueRecoveryPlan(input: {
  actorId: string;
  envelope: unknown;
  currentData: ScholarScoutData;
  now?: Date;
  signing?: RecoverySigningConfiguration;
  planId?: () => string;
}): { preview: RecoveryPlanPreview; token: SignedRecoveryPlanToken } {
  if (!isSafeId(input.actorId)) throw new Error('invalid-recovery-actor');
  const now = input.now ?? new Date();
  const signing = requireCurrentSigning(input.signing ?? getRecoverySigningConfiguration());
  const envelope = validateRecoveryEnvelope(input.envelope, { now, signing });
  assertValidRecoveryData(input.currentData);
  const planId = (input.planId ?? randomUUID)();
  if (!isSafeId(planId)) throw new Error('invalid-recovery-plan');
  const expiresAt = new Date(now.getTime() + RECOVERY_PLAN_LIFETIME_MS).toISOString();
  const claims: RecoveryPlanClaims = {
    version: 1,
    keyId: signing.currentKeyId,
    planId,
    actorId: input.actorId,
    sourceId: envelope.source.id,
    sourceDigest: envelope.digest,
    currentDataDigest: recoveryDataDigest(input.currentData),
    issuedAt: now.toISOString(),
    expiresAt,
  };
  const token = { claims, signature: signCanonical(claims, signing.currentSecret) };
  const currentCounts = getRecoveryCounts(input.currentData);
  const restoredCounts = getRecoveryCounts(envelope.data);
  const labels: Record<keyof typeof currentCounts, string> = {
    users: 'Users',
    onboardingProfiles: 'Profiles',
    shortlists: 'Shortlists',
    programmeRecords: 'Programmes',
    auditEvents: 'Audit events',
  };
  const rows = (Object.keys(labels) as Array<keyof typeof labels>).map((key) => ({
    key,
    label: labels[key],
    currentCount: currentCounts[key],
    restoredCount: restoredCounts[key],
    delta: restoredCounts[key] - currentCounts[key],
  }));
  return {
    preview: { planId, sourceId: envelope.source.id, expiresAt, rows },
    token,
  };
}

/** Applies a verified recovery plan with one composed store write. */
export async function applyRecoveryPlan(
  input: {
    actorId: string;
    envelope: unknown;
    token: unknown;
    reason: string;
    confirmation: string;
  },
  dependencies: RecoveryMutationDependencies = {},
): Promise<RecoveryApplyResult> {
  const read = dependencies.read ?? readScholarScoutData;
  const write = dependencies.write ?? writeScholarScoutData;
  const now = dependencies.now?.() ?? new Date();
  const signing = requireCurrentSigning(
    dependencies.signing ?? getRecoverySigningConfiguration(),
  );
  const reason = normalizeRecoveryReason(input.reason);

  if (input.confirmation !== RECOVERY_CONFIRMATION_PHRASE) {
    throw new Error('invalid-recovery-confirmation');
  }

  try {
    const token = validateRecoveryPlanToken(input.token, signing);
    if (token.claims.actorId !== input.actorId) throw new Error('recovery-plan-mismatch');
    if (now.getTime() >= Date.parse(token.claims.expiresAt)) {
      throw new Error('recovery-plan-expired');
    }
    const envelope = validateRecoveryEnvelope(input.envelope, { now, signing });
    if (
      token.claims.sourceId !== envelope.source.id ||
      token.claims.sourceDigest !== envelope.digest
    ) {
      throw new Error('recovery-plan-mismatch');
    }

    const currentData = await read();
    const priorOutcome = (currentData.recoveryPlanOutcomes ?? []).find(
      (outcome) => outcome.planId === token.claims.planId,
    );
    if (priorOutcome) {
      if (
        priorOutcome.actorId !== input.actorId ||
        priorOutcome.sourceId !== envelope.source.id
      ) {
        throw new Error('recovery-plan-replayed');
      }
      return { ...priorOutcome, counts: getRecoveryCounts(currentData) };
    }
    if (!safeEqual(token.claims.currentDataDigest, recoveryDataDigest(currentData))) {
      throw new Error('recovery-state-changed');
    }

    const appliedAt = now.toISOString();
    const backupId = (dependencies.backupId ?? randomUUID)();
    const incidentId = (dependencies.incidentId ?? randomUUID)();
    const auditId = (dependencies.auditId ?? randomUUID)();
    if (![backupId, incidentId, auditId].every(isSafeId)) {
      throw new Error('invalid-recovery-identifier');
    }
    const backup: ScholarScoutDataBackup = {
      id: backupId,
      createdAt: appliedAt,
      actorUserId: input.actorId,
      reason,
      counts: getRecoveryCounts(currentData),
      data: { ...currentData, restoreBackups: [] },
      incidentHold: {
        incidentId,
        status: 'unresolved',
        createdAt: appliedAt,
      },
    };
    const lifecycleEvent: RecoveryLifecycleEvent = {
      id: auditId,
      actorId: input.actorId,
      action: 'apply-recovery-plan',
      category: 'recovery',
      planId: token.claims.planId,
      sourceId: envelope.source.id,
      incidentId,
      backupId,
      timestamp: appliedAt,
      outcome: 'succeeded',
    };
    const outcome: RecoveryPlanOutcome = {
      planId: token.claims.planId,
      actorId: input.actorId,
      sourceId: envelope.source.id,
      backupId,
      incidentId,
      appliedAt,
      outcome: 'succeeded',
    };
    const restoredData: ScholarScoutData = {
      ...envelope.data,
      restoreBackups: pruneRecoveryBackups(
        [backup, ...(envelope.data.restoreBackups ?? [])],
        now,
      ),
      recoveryLifecycleEvents: [
        ...(envelope.data.recoveryLifecycleEvents ?? []),
        lifecycleEvent,
      ],
      recoveryPlanOutcomes: [
        ...(envelope.data.recoveryPlanOutcomes ?? []),
        outcome,
      ],
    };
    assertValidRecoveryData(restoredData);
    await write(restoredData);
    return { ...outcome, counts: getRecoveryCounts(restoredData) };
  } catch (error) {
    const incidentId = dependencies.incidentId?.() ?? randomUUID();
    await (dependencies.evidenceSink ?? defaultEvidenceSink)({
      actorId: input.actorId,
      action: 'apply-recovery-plan',
      category: getSafeFailureCategory(error),
      incidentId,
      timestamp: now.toISOString(),
      outcome: 'failed-no-write',
    });
    throw error;
  }
}

/** Applies deterministic retention while preserving every unresolved incident hold. */
export function pruneRecoveryBackups(
  backups: ScholarScoutDataBackup[],
  now = new Date(),
): ScholarScoutDataBackup[] {
  const ids = backups.map((backup) => backup.id);
  if (new Set(ids).size !== ids.length) throw new Error('duplicate-recovery-backup-id');
  const cutoff = now.getTime() - RECOVERY_BACKUP_MAX_AGE_MS;
  const sorted = [...backups].sort((left, right) => {
    const timeOrder = Date.parse(right.createdAt) - Date.parse(left.createdAt);
    return timeOrder || right.id.localeCompare(left.id);
  });
  const unheld = sorted
    .filter((backup) => backup.incidentHold?.status !== 'unresolved')
    .filter((backup) => Date.parse(backup.createdAt) > cutoff)
    .slice(0, RECOVERY_BACKUP_MAX_COUNT);
  const retainedIds = new Set(unheld.map((backup) => backup.id));
  sorted
    .filter((backup) => backup.incidentHold?.status === 'unresolved')
    .forEach((backup) => retainedIds.add(backup.id));
  return sorted.filter((backup) => retainedIds.has(backup.id));
}

/** Releases a matching incident hold after the caller performs fresh staff authorization. */
export async function releaseRecoveryIncidentHold(
  input: {
    actorId: string;
    authorized: boolean;
    backupId: string;
    incidentId: string;
    reason: string;
  },
  dependencies: Omit<RecoveryMutationDependencies, 'signing' | 'backupId' | 'incidentId'> = {},
): Promise<void> {
  if (!input.authorized) throw new Error('recovery-authorization-required');
  const reason = normalizeRecoveryReason(input.reason);
  const read = dependencies.read ?? readScholarScoutData;
  const write = dependencies.write ?? writeScholarScoutData;
  const now = dependencies.now?.() ?? new Date();
  const data = await read();
  const backup = (data.restoreBackups ?? []).find((item) => item.id === input.backupId);
  if (
    !backup ||
    backup.incidentHold?.incidentId !== input.incidentId ||
    backup.incidentHold.status !== 'unresolved'
  ) {
    throw new Error('recovery-incident-hold-not-found');
  }
  const auditId = (dependencies.auditId ?? randomUUID)();
  const updatedBackups = (data.restoreBackups ?? []).map((item) =>
    item.id === input.backupId
      ? {
          ...item,
          incidentHold: {
            ...item.incidentHold!,
            status: 'resolved' as const,
            resolvedAt: now.toISOString(),
            resolvedBy: input.actorId,
            reason,
          },
        }
      : item,
  );
  const event: RecoveryLifecycleEvent = {
    id: auditId,
    actorId: input.actorId,
    action: 'release-incident-hold',
    category: 'recovery',
    incidentId: input.incidentId,
    backupId: input.backupId,
    timestamp: now.toISOString(),
    outcome: 'succeeded',
  };
  await write({
    ...data,
    restoreBackups: updatedBackups,
    recoveryLifecycleEvents: [...(data.recoveryLifecycleEvents ?? []), event],
  });
}

function validateRecoveryPlanToken(
  input: unknown,
  signing: RecoverySigningConfiguration,
): SignedRecoveryPlanToken {
  if (
    !isExactRecord(input, ['claims', 'signature']) ||
    !isExactRecord(input.claims, [
      'version', 'keyId', 'planId', 'actorId', 'sourceId', 'sourceDigest',
      'currentDataDigest', 'issuedAt', 'expiresAt',
    ]) ||
    input.claims.version !== 1 ||
    ![input.claims.keyId, input.claims.planId, input.claims.actorId, input.claims.sourceId].every(isSafeId) ||
    typeof input.claims.sourceDigest !== 'string' ||
    typeof input.claims.currentDataDigest !== 'string' ||
    typeof input.claims.issuedAt !== 'string' ||
    typeof input.claims.expiresAt !== 'string' ||
    typeof input.signature !== 'string'
  ) {
    throw new Error('invalid-recovery-plan');
  }
  const claims = input.claims as unknown as RecoveryPlanClaims;
  const secret = selectVerificationSecret(claims.keyId, signing);
  if (!safeEqual(input.signature, signCanonical(claims, secret))) {
    throw new Error('invalid-recovery-plan-signature');
  }
  return { claims, signature: input.signature };
}

function normalizeRecoveryReason(reason: string): string {
  const normalized = reason?.trim();
  if (!normalized || normalized.length > RECOVERY_REASON_MAX_LENGTH) {
    throw new Error('invalid-recovery-reason');
  }
  return normalized;
}

export function recoveryDataDigest(data: ScholarScoutData): string {
  return createHash('sha256').update(canonicalSerialize(data)).digest('hex');
}

export function getRecoverySigningConfiguration(): RecoverySigningConfiguration {
  return {
    currentKeyId: process.env.SCHOLARSCOUT_RECOVERY_SIGNING_KEY_ID ?? '',
    currentSecret: process.env.SCHOLARSCOUT_RECOVERY_SIGNING_SECRET ?? '',
    previousKeyId: process.env.SCHOLARSCOUT_RECOVERY_PREVIOUS_KEY_ID,
    previousSecret: process.env.SCHOLARSCOUT_RECOVERY_PREVIOUS_SECRET,
  };
}

function requireCurrentSigning(signing: RecoverySigningConfiguration) {
  if (!isSafeId(signing.currentKeyId) || signing.currentSecret.length < 32) {
    throw new Error('recovery-signing-unavailable');
  }
  if (
    (signing.previousKeyId || signing.previousSecret) &&
    (!signing.previousKeyId || !signing.previousSecret ||
      !isSafeId(signing.previousKeyId) || signing.previousSecret.length < 32 ||
      signing.previousKeyId === signing.currentKeyId)
  ) {
    throw new Error('invalid-recovery-key-configuration');
  }
  return signing;
}

function selectVerificationSecret(keyId: string, signing: RecoverySigningConfiguration): string {
  if (keyId === signing.currentKeyId) return signing.currentSecret;
  if (keyId === signing.previousKeyId && signing.previousSecret) return signing.previousSecret;
  throw new Error('unknown-recovery-key');
}

function assertValidRecoveryData(data: unknown): asserts data is ScholarScoutData {
  const validation = validateScholarScoutDataImport(data);
  if (!validation.isValid) throw new Error('invalid-recovery-envelope');
}

function getRecoveryCounts(data: ScholarScoutData) {
  return {
    users: data.users.length,
    onboardingProfiles: Object.keys(data.onboardingProfiles).length,
    shortlists: Object.keys(data.shortlists).length,
    programmeRecords: data.programmeRecords.length,
    auditEvents: data.auditEvents.length,
  };
}

function signCanonical(value: unknown, secret: string): string {
  return createHmac('sha256', secret).update(canonicalSerialize(value)).digest('hex');
}

function canonicalSerialize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalSerialize).join(',')}]`;
  return `{${Object.keys(value as Record<string, unknown>)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalSerialize((value as Record<string, unknown>)[key])}`)
    .join(',')}}`;
}

function safeEqual(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left, 'hex');
  const rightBytes = Buffer.from(right, 'hex');
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

function assertByteLimit(value: unknown): void {
  if (Buffer.byteLength(JSON.stringify(value), 'utf8') > RECOVERY_ENVELOPE_MAX_BYTES) {
    throw new Error('recovery-envelope-too-large');
  }
}

function assertBoundedStructure(value: unknown, depth = 0): void {
  if (depth > RECOVERY_MAX_DEPTH) throw new Error('invalid-recovery-envelope');
  if (value && typeof value === 'object') {
    Object.values(value).forEach((child) => assertBoundedStructure(child, depth + 1));
  }
}

function isExactRecord(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.keys(value).length === keys.length &&
    Object.keys(value).every((key) => keys.includes(key));
}

function isSafeId(value: unknown): value is string {
  return typeof value === 'string' && SAFE_ID_PATTERN.test(value);
}

function isValidDate(value: Date): boolean {
  return Number.isFinite(value.getTime());
}
