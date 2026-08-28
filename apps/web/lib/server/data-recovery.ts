import 'server-only';

import { randomUUID } from 'node:crypto';
import {
  getDataStoreConfigurationSummary,
  readScholarScoutData,
  ScholarScoutDataStoreReadError,
  type ScholarScoutData,
} from '@/lib/server/data-store';

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
