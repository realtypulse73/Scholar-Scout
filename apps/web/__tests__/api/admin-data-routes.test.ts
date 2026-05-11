/**
 * @jest-environment node
 */

import { getServerSession } from 'next-auth';
import { POST as validateImport } from '@/app/api/admin/data/import/validate/route';
import { POST as restoreImport } from '@/app/api/admin/data/import/restore/route';
import { GET as dataHealth } from '@/app/api/admin/data/health/route';
import { GET as planBackupRestore } from '@/app/api/admin/data/backups/[id]/plan/route';
import { POST as restoreBackup } from '@/app/api/admin/data/backups/[id]/restore/route';
import {
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

  async read() {
    return cloneData(this.data);
  }

  async write(data: ScholarScoutData) {
    this.data = cloneData(data);
  }
}

describe('admin data API routes', () => {
  const getSessionMock = jest.mocked(getServerSession);
  const originalHealthToken = process.env.SCHOLARSCOUT_HEALTH_TOKEN;

  afterEach(() => {
    setScholarScoutDataStoreForTests(null);
    getSessionMock.mockReset();
    restoreEnv('SCHOLARSCOUT_HEALTH_TOKEN', originalHealthToken);
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
    getSessionMock.mockResolvedValue(staffSession());

    const response = await restoreImport(
      jsonRequest({
        snapshot: validSnapshot(),
        confirmation: 'restore',
      }),
    );

    expect(response.status).toBe(400);
    await expect(jsonBody(response)).resolves.toMatchObject({
      error: expect.stringContaining(SCHOLARSCOUT_RESTORE_CONFIRMATION),
    });
    expect(store.data.users).toHaveLength(0);
  });

  it('plans backup restores and returns not found for missing backups', async () => {
    const store = new MemoryDataStore();
    store.data = dataWithBackup();
    setScholarScoutDataStoreForTests(store);
    getSessionMock.mockResolvedValue(staffSession());

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
    await expect(jsonBody(response)).resolves.toMatchObject({
      plan: {
        backup: {
          id: 'backup-1',
          actorLabel: 'Staff User',
        },
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
    });
  });

  it('restores a backup only after confirmation', async () => {
    const store = new MemoryDataStore();
    store.data = dataWithBackup();
    setScholarScoutDataStoreForTests(store);
    getSessionMock.mockResolvedValue(staffSession());

    const confirmationResponse = await restoreBackup(
      jsonRequest({ confirmation: 'restore' }),
      routeContext('backup-1'),
    );
    expect(confirmationResponse.status).toBe(400);
    expect(store.data.users).toHaveLength(2);

    const response = await restoreBackup(
      jsonRequest({
        confirmation: SCHOLARSCOUT_RESTORE_CONFIRMATION,
        reason: 'Route test restore',
      }),
      routeContext('backup-1'),
    );

    expect(response.status).toBe(200);
    await expect(jsonBody(response)).resolves.toMatchObject({
      ok: true,
      sourceBackupId: 'backup-1',
      counts: {
        users: 1,
        onboardingProfiles: 0,
        shortlists: 0,
        programmeRecords: 0,
        auditEvents: 1,
      },
    });
    expect(store.data.users).toEqual([
      expect.objectContaining({ id: 'restored-user' }),
    ]);
    expect(store.data.restoreBackups?.[0]).toMatchObject({
      actorUserId: 'staff-1',
      reason: 'Route test restore',
    });
    expect(store.data.auditEvents[0]).toMatchObject({
      action: 'restore-backup',
      entityId: 'backup-1',
    });
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
});

function staffSession() {
  return {
    user: {
      id: 'staff-1',
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
