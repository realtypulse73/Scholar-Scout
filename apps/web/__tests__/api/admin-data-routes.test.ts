/**
 * @jest-environment node
 */

import { getServerSession } from 'next-auth';
import { GET as listBackups } from '@/app/api/admin/data/backups/route';
import { POST as validateImport } from '@/app/api/admin/data/import/validate/route';
import { POST as restoreImport } from '@/app/api/admin/data/import/restore/route';
import { GET as dataStatus } from '@/app/api/admin/data/status/route';
import { GET as dataHealth } from '@/app/api/admin/data/health/route';
import { GET as dataCapabilities } from '@/app/api/admin/data/capabilities/route';
import { GET as planBackupRestore } from '@/app/api/admin/data/backups/[id]/plan/route';
import { POST as restoreBackup } from '@/app/api/admin/data/backups/[id]/restore/route';
import { POST as releaseBackupHold } from '@/app/api/admin/data/backups/[id]/hold/release/route';
import {
  getPrivilegedOperationAuditEvents,
  SCHOLARSCOUT_RESTORE_CONFIRMATION,
  setScholarScoutDataStoreForTests,
  type ScholarScoutData,
  type ScholarScoutDataStore,
} from '@/lib/server/data-store';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

const initialData: ScholarScoutData = {
  users: [],
  onboardingProfiles: {},
  shortlists: {},
  programmeRecords: [],
  auditEvents: [],
};

class MemoryDataStore implements ScholarScoutDataStore {
  data = cloneData(initialData);
  readCount = 0;
  writeCount = 0;

  async read() {
    this.readCount += 1;
    return cloneData(this.data);
  }

  async write(data: ScholarScoutData) {
    this.writeCount += 1;
    this.data = cloneData(data);
  }
}

describe('admin data API routes', () => {
  const getSessionMock = jest.mocked(getServerSession);
  const originalHealthToken = process.env.SCHOLARSCOUT_HEALTH_TOKEN;
  const originalStaffEmails = process.env.SCHOLARSCOUT_STAFF_EMAILS;
  const originalRecoveryKeyId = process.env.SCHOLARSCOUT_RECOVERY_SIGNING_KEY_ID;
  const originalRecoverySecret = process.env.SCHOLARSCOUT_RECOVERY_SIGNING_SECRET;
  const originalDataAdapter = process.env.SCHOLARSCOUT_DATA_ADAPTER;

  afterEach(() => {
    setScholarScoutDataStoreForTests(null);
    getSessionMock.mockReset();
    restoreEnv('SCHOLARSCOUT_HEALTH_TOKEN', originalHealthToken);
    restoreEnv('SCHOLARSCOUT_STAFF_EMAILS', originalStaffEmails);
    restoreEnv('SCHOLARSCOUT_RECOVERY_SIGNING_KEY_ID', originalRecoveryKeyId);
    restoreEnv('SCHOLARSCOUT_RECOVERY_SIGNING_SECRET', originalRecoverySecret);
    restoreEnv('SCHOLARSCOUT_DATA_ADAPTER', originalDataAdapter);
  });

  it('checks the live staff allowlist and audits data backup and import decisions', async () => {
    const store = new MemoryDataStore();
    store.data = dataWithBackup();
    setScholarScoutDataStoreForTests(store);
    getSessionMock.mockResolvedValue(staffSession());

    process.env.SCHOLARSCOUT_STAFF_EMAILS = 'staff@example.com';
    await expectStatus(listBackups(), 200);
    await expectStatus(validateImport(jsonRequest(validSnapshot())), 200);
    await expectStatus(
      restoreImport(
        jsonRequest({
          snapshot: validSnapshot(),
          confirmation: 'restore',
        }),
      ),
      400,
    );

    process.env.SCHOLARSCOUT_STAFF_EMAILS = 'removed@example.com';
    await expectStatus(listBackups(), 403);
    await expectStatus(validateImport(jsonRequest(validSnapshot())), 403);
    await expectStatus(
      restoreImport(
        jsonRequest({
          snapshot: validSnapshot(),
          confirmation: SCHOLARSCOUT_RESTORE_CONFIRMATION,
        }),
      ),
      403,
    );

    process.env.SCHOLARSCOUT_STAFF_EMAILS = 'not-an-email';
    await expectStatus(listBackups(), 403);
    delete process.env.SCHOLARSCOUT_STAFF_EMAILS;
    await expectStatus(validateImport(jsonRequest(validSnapshot())), 403);

    await expect(getPrivilegedOperationAuditEvents()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actorId: 'staff-1',
          action: 'list-data-backups',
          route: '/api/admin/data/backups',
          outcome: 'allowed',
        }),
        expect.objectContaining({
          actorId: 'staff-1',
          action: 'validate-data-import',
          route: '/api/admin/data/import/validate',
          outcome: 'denied',
        }),
        expect.objectContaining({
          actorId: 'staff-1',
          action: 'restore-data-import',
          route: '/api/admin/data/import/restore',
          outcome: 'denied',
        }),
      ]),
    );
  });

  it('requires staff sessions for import validation, backup planning, and backup restore', async () => {
    getSessionMock.mockResolvedValue(null);

    await expectStatus(validateImport(jsonRequest(validSnapshot())), 403);
    await expectStatus(planBackupRestore(new Request('http://test.local'), routeContext('backup-1')), 403);
    await expectStatus(
      restoreBackup(jsonRequest({ confirmation: SCHOLARSCOUT_RESTORE_CONFIRMATION }), routeContext('backup-1')),
      403,
    );
  });

  it('validates import snapshots and reports invalid JSON practically', async () => {
    process.env.SCHOLARSCOUT_STAFF_EMAILS = 'staff@example.com';
    getSessionMock.mockResolvedValue(staffSession());

    const invalidJsonResponse = await validateImport(
      new Request('http://test.local', {
        method: 'POST',
        body: '{',
      }),
    );
    await expect(jsonBody(invalidJsonResponse)).resolves.toMatchObject({
      isValid: false,
      errors: ['Snapshot must be valid JSON.'],
    });
    expect(invalidJsonResponse.status).toBe(400);

    const validResponse = await validateImport(jsonRequest(validSnapshot()));
    await expect(jsonBody(validResponse)).resolves.toMatchObject({
      isValid: true,
      counts: {
        users: 1,
        onboardingProfiles: 0,
        shortlists: 0,
        programmeRecords: 0,
        auditEvents: 0,
      },
    });
    expect(validResponse.status).toBe(200);
  });

  it('requires confirmation before import restore writes data', async () => {
    const store = new MemoryDataStore();
    setScholarScoutDataStoreForTests(store);
    process.env.SCHOLARSCOUT_STAFF_EMAILS = 'staff@example.com';
    getSessionMock.mockResolvedValue(staffSession());

    const response = await restoreImport(
      jsonRequest({
        snapshot: validSnapshot(),
        confirmation: 'restore',
      }),
    );

    expect(response.status).toBe(400);
    const restoreBody = await jsonBody(response);
    expect(restoreBody).toMatchObject({
      error: expect.stringContaining(SCHOLARSCOUT_RESTORE_CONFIRMATION),
    });
    expect(store.data.users).toHaveLength(0);
  });

  it('checks the live staff allowlist and audits status and backup restore decisions', async () => {
    const store = new MemoryDataStore();
    store.data = dataWithBackup();
    setScholarScoutDataStoreForTests(store);
    getSessionMock.mockResolvedValue(staffSession());

    process.env.SCHOLARSCOUT_STAFF_EMAILS = 'staff@example.com';
    process.env.SCHOLARSCOUT_DATA_ADAPTER = 'json';
    process.env.SCHOLARSCOUT_RECOVERY_SIGNING_KEY_ID = 'route-key';
    process.env.SCHOLARSCOUT_RECOVERY_SIGNING_SECRET = 'route-test-secret-that-is-at-least-32-bytes';
    await expectStatus(dataStatus(), 200);
    await expectStatus(
      planBackupRestore(new Request('http://test.local'), routeContext('backup-1')),
      200,
    );
    await expectStatus(
      restoreBackup(
        jsonRequest({ confirmation: 'restore' }),
        routeContext('backup-1'),
      ),
      400,
    );

    process.env.SCHOLARSCOUT_STAFF_EMAILS = 'removed@example.com';
    await expectStatus(dataStatus(), 403);
    await expectStatus(
      planBackupRestore(new Request('http://test.local'), routeContext('backup-1')),
      403,
    );
    await expectStatus(
      restoreBackup(
        jsonRequest({ confirmation: SCHOLARSCOUT_RESTORE_CONFIRMATION }),
        routeContext('backup-1'),
      ),
      403,
    );

    process.env.SCHOLARSCOUT_STAFF_EMAILS = 'not-an-email';
    await expectStatus(dataStatus(), 403);
    delete process.env.SCHOLARSCOUT_STAFF_EMAILS;
    await expectStatus(
      planBackupRestore(new Request('http://test.local'), routeContext('backup-1')),
      403,
    );

    await expect(getPrivilegedOperationAuditEvents()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actorId: 'staff-1',
          action: 'view-data-status',
          route: '/api/admin/data/status',
          outcome: 'allowed',
        }),
        expect.objectContaining({
          actorId: 'staff-1',
          action: 'plan-backup-restore',
          route: '/api/admin/data/backups/[id]/plan',
          outcome: 'denied',
        }),
        expect.objectContaining({
          actorId: 'staff-1',
          action: 'restore-backup',
          route: '/api/admin/data/backups/[id]/restore',
          outcome: 'denied',
        }),
      ]),
    );
  });

  it('lists safe newest-first backup summaries and creates a count-only bound plan', async () => {
    const store = new MemoryDataStore();
    store.data = dataWithBackup();
    store.data.restoreBackups = [
      ...store.data.restoreBackups!,
      {
        ...store.data.restoreBackups![0],
        id: 'backup-2',
        createdAt: '2026-05-06T00:00:00.000Z',
        data: {
          ...validSnapshot(),
          users: [
            ...validSnapshot().users,
            {
              ...validSnapshot().users[0],
              id: 'restored-user-2',
              email: 'second@example.com',
            },
          ],
        },
      },
    ];
    setScholarScoutDataStoreForTests(store);
    process.env.SCHOLARSCOUT_STAFF_EMAILS = 'staff@example.com';
    process.env.SCHOLARSCOUT_RECOVERY_SIGNING_KEY_ID = 'route-key';
    process.env.SCHOLARSCOUT_RECOVERY_SIGNING_SECRET = 'route-test-secret-that-is-at-least-32-bytes';
    getSessionMock.mockResolvedValue(staffSession());

    const listResponse = await listBackups();
    const listBody = await jsonBody(listResponse) as { backups: Array<Record<string, unknown>> };
    expect(listResponse.status).toBe(200);
    expect(listBody.backups.map((backup) => backup.id)).toEqual(['backup-2', 'backup-1']);
    expect(JSON.stringify(listBody)).not.toContain('restored@example.com');
    expect(JSON.stringify(listBody)).not.toContain('passwordHash');

    const missingResponse = await planBackupRestore(
      new Request('http://test.local'),
      routeContext('missing-backup'),
    );
    expect(missingResponse.status).toBe(404);

    const response = await planBackupRestore(
      new Request('http://test.local'),
      routeContext('backup-1'),
    );

    expect(response.status).toBe(200);
    const responseBody = await jsonBody(response);
    expect(responseBody).toMatchObject({
      plan: {
        sourceId: 'backup-1',
        expiresAt: expect.any(String),
        rows: expect.arrayContaining([
          {
            key: 'users',
            label: 'Users',
            currentCount: 2,
            restoredCount: 1,
            delta: -1,
          },
        ]),
      },
      planToken: {
        claims: {
          actorId: 'staff-1',
          sourceId: 'backup-1',
        },
        signature: expect.any(String),
      },
    });
    expect(store.writeCount).toBe(3);
  });

  it('distinguishes a healthy empty backup list from an unavailable read', async () => {
    const store = new MemoryDataStore();
    setScholarScoutDataStoreForTests(store);
    process.env.SCHOLARSCOUT_STAFF_EMAILS = 'staff@example.com';
    getSessionMock.mockResolvedValue(staffSession());

    const emptyResponse = await listBackups();
    await expect(jsonBody(emptyResponse)).resolves.toEqual({ backups: [], empty: true });

    jest.spyOn(store, 'read')
      .mockResolvedValueOnce(cloneData(store.data))
      .mockRejectedValueOnce(new Error('private-provider.example token=secret'));
    const unavailableResponse = await listBackups();
    const unavailableBody = await jsonBody(unavailableResponse);
    expect(unavailableResponse.status).toBe(503);
    expect(unavailableBody).toEqual({
      error: 'data-service-unavailable',
      category: 'storage-unavailable',
      incidentId: expect.any(String),
      retryable: true,
    });
    expect(JSON.stringify(unavailableBody)).not.toContain('private-provider');
    expect(store.writeCount).toBe(2);
  });

  it('applies only an exact bound backup plan and writes recovery data once', async () => {
    const store = new MemoryDataStore();
    store.data = dataWithBackup();
    setScholarScoutDataStoreForTests(store);
    process.env.SCHOLARSCOUT_STAFF_EMAILS = 'staff@example.com';
    process.env.SCHOLARSCOUT_RECOVERY_SIGNING_KEY_ID = 'route-key';
    process.env.SCHOLARSCOUT_RECOVERY_SIGNING_SECRET = 'route-test-secret-that-is-at-least-32-bytes';
    getSessionMock.mockResolvedValue(staffSession());

    const planResponse = await planBackupRestore(
      new Request('http://test.local'),
      routeContext('backup-1'),
    );
    const planBody = await jsonBody(planResponse) as { planToken: unknown };
    const writesAfterPlan = store.writeCount;
    const confirmationResponse = await restoreBackup(
      jsonRequest({
        planToken: planBody.planToken,
        confirmation: 'restore',
        reason: 'Route test restore',
      }),
      routeContext('backup-1'),
    );
    expect(confirmationResponse.status).toBe(400);
    expect(store.data.users).toHaveLength(2);
    expect(store.writeCount).toBe(writesAfterPlan + 1);

    const extraFieldResponse = await restoreBackup(
      jsonRequest({
        planToken: planBody.planToken,
        confirmation: 'RESTORE SCHOLARSCOUT DATA',
        reason: 'Route test restore',
        snapshot: validSnapshot(),
      }),
      routeContext('backup-1'),
    );
    expect(extraFieldResponse.status).toBe(400);

    const response = await restoreBackup(
      jsonRequest({
        planToken: planBody.planToken,
        confirmation: 'RESTORE SCHOLARSCOUT DATA',
        reason: 'Route test restore',
      }),
      routeContext('backup-1'),
    );

    expect(response.status).toBe(200);
    const applyBody = await jsonBody(response);
    expect(applyBody).toMatchObject({
      ok: true,
      planId: expect.any(String),
      sourceId: 'backup-1',
      backupId: expect.any(String),
      incidentId: expect.any(String),
      counts: {
        users: 1,
        onboardingProfiles: 0,
        shortlists: 0,
        programmeRecords: 0,
        auditEvents: 0,
      },
    });
    expect(store.data.users).toEqual([
      expect.objectContaining({ id: 'restored-user' }),
    ]);
    expect(store.data.restoreBackups?.[0]).toMatchObject({
      actorUserId: 'staff-1',
      reason: 'Route test restore',
      incidentHold: {
        status: 'unresolved',
        incidentId: expect.any(String),
      },
    });
    expect(store.data.recoveryLifecycleEvents?.[0]).toMatchObject({
      action: 'apply-recovery-plan',
      sourceId: 'backup-1',
      outcome: 'succeeded',
    });
    expect(JSON.stringify(applyBody)).not.toContain('restored@example.com');
  });

  it('releases only the named active incident hold through the operator route', async () => {
    const store = new MemoryDataStore();
    store.data = dataWithBackup();
    store.data.restoreBackups![0].incidentHold = {
      incidentId: 'incident-1',
      status: 'unresolved',
      createdAt: '2026-05-05T00:00:00.000Z',
    };
    setScholarScoutDataStoreForTests(store);
    process.env.SCHOLARSCOUT_STAFF_EMAILS = 'staff@example.com';
    getSessionMock.mockResolvedValue(staffSession());

    const invalid = await releaseBackupHold(
      jsonRequest({ incidentId: 'incident-1', reason: 'Resolved', extra: true }),
      routeContext('backup-1'),
    );
    expect(invalid.status).toBe(400);
    expect(store.data.restoreBackups![0].incidentHold?.status).toBe('unresolved');

    const mismatch = await releaseBackupHold(
      jsonRequest({ incidentId: 'incident-other', reason: 'Resolved' }),
      routeContext('backup-1'),
    );
    expect(mismatch.status).toBe(409);

    const response = await releaseBackupHold(
      jsonRequest({ incidentId: 'incident-1', reason: ' Incident reviewed ' }),
      routeContext('backup-1'),
    );
    const body = await jsonBody(response);
    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      backupId: 'backup-1',
      incidentId: 'incident-1',
      resolvedAt: expect.any(String),
      auditId: expect.any(String),
    });
    expect(store.data.restoreBackups![0].incidentHold).toMatchObject({
      status: 'resolved',
      resolvedBy: 'staff-1',
      reason: 'Incident reviewed',
    });
    expect(store.data.recoveryLifecycleEvents?.at(-1)).toMatchObject({
      actorId: 'staff-1',
      action: 'release-incident-hold',
      backupId: 'backup-1',
      incidentId: 'incident-1',
      outcome: 'succeeded',
    });
    expect(JSON.stringify(body)).not.toContain('restored@example.com');
  });

  it('keeps incident-hold release absent from advertised capabilities', async () => {
    const store = new MemoryDataStore();
    setScholarScoutDataStoreForTests(store);
    process.env.SCHOLARSCOUT_STAFF_EMAILS = 'staff@example.com';
    getSessionMock.mockResolvedValue(staffSession());

    const response = await dataCapabilities();
    const body = await jsonBody(response) as { operations: Array<{ id: string }> };
    expect(response.status).toBe(200);
    expect(body.operations.map((operation) => operation.id)).not.toContain('hold-release');
  });

  it('protects service-token data health and returns data status', async () => {
    const store = new MemoryDataStore();
    store.data = dataWithBackup();
    setScholarScoutDataStoreForTests(store);
    process.env.SCHOLARSCOUT_HEALTH_TOKEN = 'health-token';

    await expectStatus(dataHealth(new Request('http://test.local')), 403);
    await expectStatus(
      dataHealth(
        new Request('http://test.local', {
          headers: { Authorization: 'Bearer wrong-token' },
        }),
      ),
      403,
    );

    const response = await dataHealth(
      new Request('http://test.local', {
        headers: { Authorization: 'Bearer health-token' },
      }),
    );

    expect(response.status).toBe(200);
    await expect(jsonBody(response)).resolves.toMatchObject({
      checkedAt: expect.any(String),
      adapter: 'json',
      counts: {
        users: 2,
        onboardingProfiles: 0,
        shortlists: 0,
        programmeRecords: 0,
        auditEvents: 0,
      },
      backupRetention: {
        retainedBackups: 1,
        maxRetainedBackups: 5,
        isWithinPolicy: true,
      },
    });

    delete process.env.SCHOLARSCOUT_HEALTH_TOKEN;
    await expectStatus(dataHealth(new Request('http://test.local')), 503);
  });

  it('returns fresh staff-authorized capabilities without exposing provider errors', async () => {
    const store = new MemoryDataStore();
    const read = jest
      .spyOn(store, 'read')
      .mockResolvedValueOnce(cloneData(store.data))
      .mockRejectedValueOnce(new Error('private-provider.example token=secret'));
    setScholarScoutDataStoreForTests(store);
    process.env.SCHOLARSCOUT_STAFF_EMAILS = 'staff@example.com';
    getSessionMock.mockResolvedValue(staffSession());

    const response = await dataCapabilities();
    const body = await jsonBody(response);

    expect(response.status).toBe(503);
    expect(body).toEqual({
      error: 'data-service-unavailable',
      category: 'storage-unavailable',
      incidentId: expect.any(String),
      retryable: true,
    });
    expect(JSON.stringify(body)).not.toContain('private-provider');
    expect(read).toHaveBeenCalledTimes(2);
  });
});

function staffSession() {
  return {
    user: {
      id: 'staff-1',
      email: 'staff@example.com',
      role: 'staff',
    },
  };
}

function validSnapshot(): ScholarScoutData {
  return {
    users: [
      {
        id: 'restored-user',
        email: 'restored@example.com',
        name: 'Restored User',
        role: 'staff',
        passwordHash: 'oauth',
        createdAt: '2026-05-06T00:00:00.000Z',
      },
    ],
    onboardingProfiles: {},
    shortlists: {},
    programmeRecords: [],
    auditEvents: [],
  };
}

function dataWithBackup(): ScholarScoutData {
  const currentStaff = {
    id: 'staff-1',
    email: 'staff@example.com',
    name: 'Staff User',
    role: 'staff' as const,
    passwordHash: 'oauth',
    createdAt: '2026-05-06T00:00:00.000Z',
  };

  return {
    users: [
      currentStaff,
      {
        id: 'student-1',
        email: 'student@example.com',
        name: 'Student User',
        role: 'student',
        passwordHash: 'hash',
        createdAt: '2026-05-06T00:00:00.000Z',
      },
    ],
    onboardingProfiles: {},
    shortlists: {},
    programmeRecords: [],
    auditEvents: [],
    restoreBackups: [
      {
        id: 'backup-1',
        actorUserId: 'staff-1',
        reason: 'Known good data',
        createdAt: '2026-05-05T00:00:00.000Z',
        counts: {
          users: 1,
          onboardingProfiles: 0,
          shortlists: 0,
          programmeRecords: 0,
          auditEvents: 0,
        },
        data: validSnapshot(),
      },
    ],
  };
}

function jsonRequest(body: unknown) {
  return new Request('http://test.local', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function routeContext(id: string) {
  return {
    params: Promise.resolve({ id }),
  };
}

async function expectStatus(
  value: Response | Promise<Response>,
  status: number,
) {
  const response = await value;
  expect(response.status).toBe(status);
}

async function jsonBody(response: Response) {
  return response.json() as Promise<unknown>;
}

function cloneData(data: ScholarScoutData) {
  return JSON.parse(JSON.stringify(data)) as ScholarScoutData;
}

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}
