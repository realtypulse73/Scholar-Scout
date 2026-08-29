import {
  applyRecoveryPlan,
  createSignedRecoveryEnvelope,
  DataRecoveryUnavailableError,
  issueRecoveryPlan,
  pruneRecoveryBackups,
  readAdminDataCapabilities,
  releaseRecoveryIncidentHold,
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

  it('applies a fresh plan once with a pre-change backup and minimal lifecycle audit', async () => {
    const currentData: ScholarScoutData = {
      ...emptyData,
      shortlists: { 'student-current': ['programme-current'] },
    };
    const targetData: ScholarScoutData = {
      ...emptyData,
      shortlists: { 'student-restored': ['programme-restored'] },
    };
    const envelope = createSignedRecoveryEnvelope({
      data: targetData,
      sourceId: 'import-apply-1',
      now,
      signing,
    });
    const { token } = issueRecoveryPlan({
      actorId: 'staff-1',
      envelope,
      currentData,
      now,
      signing,
      planId: () => 'plan-apply-1',
    });
    let stored = currentData;
    const write = jest.fn(async (data: ScholarScoutData) => {
      stored = data;
    });
    const dependencies = {
      read: jest.fn(async () => stored),
      write,
      now: () => new Date('2026-08-28T14:05:00.000Z'),
      signing,
      backupId: () => 'backup-prechange-1',
      auditId: () => 'audit-apply-1',
      incidentId: () => 'incident-apply-1',
    };

    const result = await applyRecoveryPlan({
      actorId: 'staff-1',
      envelope,
      token,
      reason: 'Recover from verified incident',
      confirmation: 'RESTORE SCHOLARSCOUT DATA',
    }, dependencies);

    expect(write).toHaveBeenCalledTimes(1);
    expect(stored.shortlists).toEqual(targetData.shortlists);
    expect(stored.restoreBackups).toEqual([
      expect.objectContaining({
        id: 'backup-prechange-1',
        data: expect.objectContaining({
          shortlists: currentData.shortlists,
          restoreBackups: [],
        }),
        incidentHold: expect.objectContaining({
          incidentId: 'incident-apply-1',
          status: 'unresolved',
        }),
      }),
    ]);
    expect(stored.recoveryLifecycleEvents).toEqual([
      expect.objectContaining({
        id: 'audit-apply-1',
        actorId: 'staff-1',
        action: 'apply-recovery-plan',
        planId: 'plan-apply-1',
        incidentId: 'incident-apply-1',
        outcome: 'succeeded',
      }),
    ]);
    expect(JSON.stringify(stored.recoveryLifecycleEvents)).not.toContain('student-');

    await expect(
      applyRecoveryPlan({
        actorId: 'staff-1',
        envelope,
        token,
        reason: 'Recover from verified incident',
        confirmation: 'RESTORE SCHOLARSCOUT DATA',
      }, dependencies),
    ).resolves.toEqual(result);
    expect(write).toHaveBeenCalledTimes(1);
  });

  it('rejects an adapter-version race without writing recovery success evidence', async () => {
    const currentData: ScholarScoutData = {
      ...emptyData,
      shortlists: { 'student-current': ['programme-current'] },
    };
    const concurrentData: ScholarScoutData = {
      ...currentData,
      shortlists: { 'student-current': ['programme-concurrent'] },
    };
    const envelope = createSignedRecoveryEnvelope({
      data: {
        ...emptyData,
        shortlists: { 'student-restored': ['programme-restored'] },
      },
      sourceId: 'import-race-1',
      now,
      signing,
    });
    const { token } = issueRecoveryPlan({
      actorId: 'staff-1',
      envelope,
      currentData,
      now,
      signing,
      planId: () => 'plan-race-1',
    });
    let stored = currentData;
    const write = jest.fn();
    const writeVersioned = jest.fn(async (
      _data: ScholarScoutData,
      expectedVersion: string | null,
    ) => {
      expect(expectedVersion).toBe('provider-version-1');
      stored = concurrentData;
      return { status: 'conflict' as const };
    });

    await expect(applyRecoveryPlan({
      actorId: 'staff-1',
      envelope,
      token,
      reason: 'Recover from verified incident',
      confirmation: 'RESTORE SCHOLARSCOUT DATA',
    }, {
      readVersioned: async () => ({
        data: currentData,
        version: 'provider-version-1',
      }),
      write,
      writeVersioned,
      now: () => new Date('2026-08-28T14:05:00.000Z'),
      signing,
      backupId: () => 'backup-race-1',
      auditId: () => 'audit-race-1',
      incidentId: () => 'incident-race-1',
    })).rejects.toThrow('recovery-state-changed');

    expect(writeVersioned).toHaveBeenCalledTimes(1);
    expect(write).not.toHaveBeenCalled();
    expect(stored).toEqual(concurrentData);
    expect(stored.restoreBackups).toBeUndefined();
    expect(stored.recoveryLifecycleEvents).toBeUndefined();
    expect(stored.recoveryPlanOutcomes).toBeUndefined();
    expect(JSON.stringify(envelope)).not.toContain('provider-version-1');
    expect(JSON.stringify(token)).not.toContain('provider-version-1');
  });

  it('rejects invalid confirmation, stale state, expiry equality, and actor changes without writes', async () => {
    const envelope = createSignedRecoveryEnvelope({
      data: emptyData,
      sourceId: 'import-reject-1',
      now,
      signing,
    });
    const { token } = issueRecoveryPlan({
      actorId: 'staff-1',
      envelope,
      currentData: emptyData,
      now,
      signing,
      planId: () => 'plan-reject-1',
    });
    const write = jest.fn();

    await expect(applyRecoveryPlan({
      actorId: 'staff-1', envelope, token, reason: ' ', confirmation: 'RESTORE SCHOLARSCOUT DATA',
    }, { read: async () => emptyData, write, now: () => now, signing })).rejects.toThrow('invalid-recovery-reason');
    await expect(applyRecoveryPlan({
      actorId: 'staff-2', envelope, token, reason: 'Valid reason', confirmation: 'RESTORE SCHOLARSCOUT DATA',
    }, { read: async () => emptyData, write, now: () => now, signing })).rejects.toThrow('recovery-plan-mismatch');
    await expect(applyRecoveryPlan({
      actorId: 'staff-1', envelope, token, reason: 'Valid reason', confirmation: 'RESTORE SCHOLARSCOUT DATA',
    }, { read: async () => ({ ...emptyData, shortlists: { changed: [] } }), write, now: () => now, signing })).rejects.toThrow('recovery-state-changed');
    await expect(applyRecoveryPlan({
      actorId: 'staff-1', envelope, token, reason: 'Valid reason', confirmation: 'RESTORE SCHOLARSCOUT DATA',
    }, { read: async () => emptyData, write, now: () => new Date(token.claims.expiresAt), signing })).rejects.toThrow('recovery-plan-expired');
    expect(write).not.toHaveBeenCalled();
  });

  it('retains ten fresh backups newest-first, expires equality, preserves holds, and rejects duplicates', () => {
    const backup = (id: string, createdAt: string, held = false) => ({
      id,
      createdAt,
      actorUserId: 'staff-1',
      reason: 'Fixture',
      counts: { users: 0, onboardingProfiles: 0, shortlists: 0, programmeRecords: 0, auditEvents: 0 },
      data: emptyData,
      ...(held ? { incidentHold: { incidentId: `incident-${id}`, status: 'unresolved' as const, createdAt } } : {}),
    });
    const backups = [
      backup('held-old', '2026-01-01T00:00:00.000Z', true),
      backup('expired-equality', '2026-07-29T14:00:00.000Z'),
      ...Array.from({ length: 12 }, (_, index) =>
        backup(`fresh-${String(index).padStart(2, '0')}`, '2026-08-27T14:00:00.000Z'),
      ),
    ];
    const retained = pruneRecoveryBackups(backups, now);

    expect(retained).toHaveLength(11);
    expect(retained[0].id).toBe('fresh-11');
    expect(retained[9].id).toBe('fresh-02');
    expect(retained[10].id).toBe('held-old');
    expect(retained.map((item) => item.id)).not.toContain('expired-equality');
    expect(() => pruneRecoveryBackups([backups[0], backups[0]], now)).toThrow('duplicate-recovery-backup-id');
  });

  it('releases an incident hold only after fresh authorization and audits the one write', async () => {
    const held = pruneRecoveryBackups([{
      id: 'held-1', createdAt: now.toISOString(), actorUserId: 'staff-1', reason: 'Incident',
      counts: { users: 0, onboardingProfiles: 0, shortlists: 0, programmeRecords: 0, auditEvents: 0 },
      data: emptyData,
      incidentHold: { incidentId: 'incident-held-1', status: 'unresolved' as const, createdAt: now.toISOString() },
    }], now);
    let stored: ScholarScoutData = { ...emptyData, restoreBackups: held };
    const write = jest.fn(async (data: ScholarScoutData) => { stored = data; });

    await expect(releaseRecoveryIncidentHold({
      actorId: 'staff-2', authorized: false, backupId: 'held-1', incidentId: 'incident-held-1', reason: 'Resolved safely',
    }, { read: async () => stored, write, now: () => now })).rejects.toThrow('recovery-authorization-required');
    await releaseRecoveryIncidentHold({
      actorId: 'staff-2', authorized: true, backupId: 'held-1', incidentId: 'incident-held-1', reason: 'Resolved safely',
    }, { read: async () => stored, write, now: () => now, auditId: () => 'audit-release-1' });

    expect(write).toHaveBeenCalledTimes(1);
    expect(stored.restoreBackups?.[0].incidentHold).toMatchObject({ status: 'resolved', resolvedBy: 'staff-2' });
    expect(stored.recoveryLifecycleEvents?.[0]).toMatchObject({
      id: 'audit-release-1', action: 'release-incident-hold', incidentId: 'incident-held-1', outcome: 'succeeded',
    });
  });

  it('leaves an incident hold unresolved when its conditional write conflicts', async () => {
    const heldData: ScholarScoutData = {
      ...emptyData,
      restoreBackups: [{
        id: 'held-race-1',
        actorUserId: 'staff-1',
        reason: 'Investigate',
        createdAt: now.toISOString(),
        counts: { users: 0, onboardingProfiles: 0, shortlists: 0, programmeRecords: 0, auditEvents: 0 },
        data: emptyData,
        incidentHold: {
          incidentId: 'incident-held-race-1',
          status: 'unresolved',
          createdAt: now.toISOString(),
        },
      }],
    };
    const writeVersioned = jest.fn(async () => ({ status: 'conflict' as const }));

    await expect(releaseRecoveryIncidentHold({
      actorId: 'staff-2',
      authorized: true,
      backupId: 'held-race-1',
      incidentId: 'incident-held-race-1',
      reason: 'Incident reviewed',
    }, {
      readVersioned: async () => ({ data: heldData, version: 'provider-hold-1' }),
      writeVersioned,
      now: () => now,
      auditId: () => 'audit-release-race-1',
    })).rejects.toThrow('recovery-state-changed');

    expect(writeVersioned).toHaveBeenCalledWith(
      expect.any(Object),
      'provider-hold-1',
    );
    expect(heldData.restoreBackups?.[0].incidentHold?.status).toBe('unresolved');
    expect(heldData.recoveryLifecycleEvents).toBeUndefined();
  });
});
