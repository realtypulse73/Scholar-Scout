import {
  DataRecoveryUnavailableError,
  readAdminDataCapabilities,
  type OperationalEvidenceEvent,
} from '@/lib/server/data-recovery';
import type { ScholarScoutData } from '@/lib/server/data-store';

const emptyData: ScholarScoutData = {
  users: [],
  onboardingProfiles: {},
  shortlists: {},
  programmeRecords: [],
  auditEvents: [],
};

describe('admin data recovery capabilities', () => {
  it('returns a fresh verified snapshot and server-owned operation capabilities', async () => {
    const read = jest.fn(async () => ({
      ...emptyData,
      users: [
        {
          id: 'student-1',
          email: 'student@example.com',
          name: 'Student',
          role: 'student' as const,
          passwordHash: 'hash',
          createdAt: '2026-08-28T12:00:00.000Z',
        },
      ],
    }));

    await expect(
      readAdminDataCapabilities({
        actorId: 'staff-1',
        read,
        now: () => new Date('2026-08-28T13:00:00.000Z'),
        configuration: () => ({
          adapter: 'http',
          backingStore: 'configured',
          isDurable: true,
          isConfigured: true,
          issues: [],
        }),
      }),
    ).resolves.toMatchObject({
      health: 'healthy',
      adapter: 'http',
      lastVerifiedAt: '2026-08-28T13:00:00.000Z',
      counts: { users: 1 },
      operations: expect.arrayContaining([
        expect.objectContaining({
          id: 'backup-list',
          available: true,
          allowedAction: 'view',
          retryable: false,
        }),
      ]),
    });
    expect(read).toHaveBeenCalledTimes(1);
  });

  it('emits privacy-minimal evidence and throws a safe retryable outage', async () => {
    const events: OperationalEvidenceEvent[] = [];
    const providerError = new Error('redis.internal.example token=secret student@example.com');

    await expect(
      readAdminDataCapabilities({
        actorId: 'staff-1',
        read: async () => {
          throw providerError;
        },
        incidentId: () => 'incident-safe-1',
        now: () => new Date('2026-08-28T13:00:00.000Z'),
        evidenceSink: (event) => events.push(event),
      }),
    ).rejects.toEqual(
      new DataRecoveryUnavailableError({
        category: 'storage-unavailable',
        incidentId: 'incident-safe-1',
        retryable: true,
      }),
    );

    expect(events).toEqual([
      {
        actorId: 'staff-1',
        action: 'read-data-capabilities',
        category: 'storage-unavailable',
        incidentId: 'incident-safe-1',
        timestamp: '2026-08-28T13:00:00.000Z',
        outcome: 'failed-no-write',
      },
    ]);
    expect(JSON.stringify(events)).not.toContain('redis.internal');
    expect(JSON.stringify(events)).not.toContain('student@example.com');
  });
});
