import {
  createSignedRecoveryEnvelope,
  DataRecoveryUnavailableError,
  issueRecoveryPlan,
  readAdminDataCapabilities,
  validateRecoveryEnvelope,
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
        evidenceSink: (event) => {
          events.push(event);
        },
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

describe('signed recovery envelopes and bound plans', () => {
  const signing = {
    currentKeyId: 'recovery-2026-08',
    currentSecret: 'a'.repeat(64),
    previousKeyId: 'recovery-2026-07',
    previousSecret: 'b'.repeat(64),
  };
  const now = new Date('2026-08-28T14:00:00.000Z');

  it('signs canonical envelopes with the current key and validates exact input', () => {
    const envelope = createSignedRecoveryEnvelope({
      data: emptyData,
      sourceId: 'backup-safe-1',
      now,
      signing,
    });

    expect(envelope).toMatchObject({
      version: 1,
      keyId: signing.currentKeyId,
      source: {
        id: 'backup-safe-1',
        createdAt: now.toISOString(),
      },
    });
    expect(validateRecoveryEnvelope(envelope, { now, signing })).toEqual(envelope);
    expect(() =>
      validateRecoveryEnvelope({ ...envelope, unexpected: true }, { now, signing }),
    ).toThrow('invalid-recovery-envelope');
    expect(() =>
      validateRecoveryEnvelope(
        { ...envelope, data: { ...emptyData, users: [{}] } },
        { now, signing },
      ),
    ).toThrow('invalid-recovery-envelope');
  });

  it('accepts the configured previous key but rejects unknown or removed keys', () => {
    const previousEnvelope = createSignedRecoveryEnvelope({
      data: emptyData,
      sourceId: 'backup-previous',
      now,
      signing: {
        currentKeyId: signing.previousKeyId,
        currentSecret: signing.previousSecret,
      },
    });

    expect(
      validateRecoveryEnvelope(previousEnvelope, { now, signing }).keyId,
    ).toBe(signing.previousKeyId);
    expect(() =>
      validateRecoveryEnvelope(previousEnvelope, {
        now,
        signing: {
          currentKeyId: signing.currentKeyId,
          currentSecret: signing.currentSecret,
        },
      }),
    ).toThrow('unknown-recovery-key');
  });

  it('rejects tampering, stale/future packages, missing signing material, and oversized input', () => {
    const envelope = createSignedRecoveryEnvelope({
      data: emptyData,
      sourceId: 'backup-safe-2',
      now,
      signing,
    });

    expect(() =>
      validateRecoveryEnvelope({ ...envelope, digest: '0'.repeat(64) }, { now, signing }),
    ).toThrow('invalid-recovery-digest');
    expect(() =>
      validateRecoveryEnvelope(
        {
          ...envelope,
          source: { ...envelope.source, createdAt: '2026-08-28T14:01:00.000Z' },
        },
        { now, signing },
      ),
    ).toThrow('invalid-recovery-timestamp');
    expect(() =>
      validateRecoveryEnvelope(
        { ...envelope, source: { ...envelope.source, createdAt: '2026-07-29T14:00:00.000Z' } },
        { now, signing },
      ),
    ).toThrow('expired-recovery-envelope');
    expect(() =>
      createSignedRecoveryEnvelope({
        data: emptyData,
        sourceId: 'backup-no-key',
        now,
        signing: { currentKeyId: '', currentSecret: '' },
      }),
    ).toThrow('recovery-signing-unavailable');
    expect(() =>
      validateRecoveryEnvelope('x'.repeat(5 * 1024 * 1024 + 1), { now, signing }),
    ).toThrow('recovery-envelope-too-large');
  });

  it('issues a count-only ten-minute plan bound to actor, source, and current state', () => {
    const envelope = createSignedRecoveryEnvelope({
      data: { ...emptyData, shortlists: { 'student-1': ['programme-1'] } },
      sourceId: 'import-safe-1',
      now,
      signing,
    });
    const plan = issueRecoveryPlan({
      actorId: 'staff-1',
      envelope,
      currentData: emptyData,
      now,
      signing,
      planId: () => 'plan-safe-1',
    });

    expect(plan.preview).toEqual({
      planId: 'plan-safe-1',
      sourceId: 'import-safe-1',
      expiresAt: '2026-08-28T14:10:00.000Z',
      rows: expect.arrayContaining([
        {
          key: 'shortlists',
          label: 'Shortlists',
          currentCount: 0,
          restoredCount: 1,
          delta: 1,
        },
      ]),
    });
    expect(JSON.stringify(plan.preview)).not.toContain('student-1');
    expect(plan.token.claims).toMatchObject({
      actorId: 'staff-1',
      sourceId: 'import-safe-1',
      sourceDigest: envelope.digest,
      expiresAt: '2026-08-28T14:10:00.000Z',
    });
  });
});
