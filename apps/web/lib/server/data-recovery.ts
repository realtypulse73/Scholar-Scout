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
  type ScholarScoutData,
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
  action: 'read-data-capabilities';
  category: DataRecoveryFailureCategory;
  incidentId: string;
  timestamp: string;
  outcome: 'failed-no-write';
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
    source: parsed.source,
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
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && Object.keys(value).every((key) => keys.includes(key));
}

function isSafeId(value: unknown): value is string {
  return typeof value === 'string' && SAFE_ID_PATTERN.test(value);
}

function isValidDate(value: Date): boolean {
  return Number.isFinite(value.getTime());
}
