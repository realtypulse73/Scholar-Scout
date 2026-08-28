import {
  get,
  put,
  type GetBlobResult,
  type PutBlobResult,
} from '@vercel/blob';
import { ReadableStream } from 'stream/web';
import { TextEncoder } from 'util';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  findOrCreateOAuthUser,
  hashGuestCredential,
  getAccountRoleForEmail,
  getDataStoreConfigurationSummary,
  getScholarScoutDataStore,
  getScholarScoutDataStoreStatus,
  JsonScholarScoutDataStore,
  getScholarScoutRestoreBackupPlan,
  getScholarScoutRestoreBackups,
  getRestoreBackupRetentionStatus,
  getShortlistPlans,
  readScholarScoutData,
  restoreScholarScoutDataFromBackup,
  restoreScholarScoutDataFromImport,
  saveProgrammeRecord,
  saveShortlist,
  saveShortlistPlans,
  setScholarScoutDataStoreForTests,
  ScholarScoutDataStoreReadError,
  registerGuestLifecycle,
  validateScholarScoutDataImport,
  writeScholarScoutData,
  type ScholarScoutData,
  type ScholarScoutDataStore,
} from '@/lib/server/data-store';
import {
  migrateGuestOwnedRecords,
  type PlatformData,
} from '@/lib/server/platform-store';
import { programmes } from '@/lib/programmes';

jest.mock('@vercel/blob', () => ({
  get: jest.fn(),
  put: jest.fn(),
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

function cloneData(data: ScholarScoutData) {
  return JSON.parse(JSON.stringify(data)) as ScholarScoutData;
}

describe('ScholarScout data store adapter', () => {
  const originalAdapter = process.env.SCHOLARSCOUT_DATA_ADAPTER;
  const originalServiceUrl = process.env.SCHOLARSCOUT_DATA_SERVICE_URL;
  const originalServiceToken = process.env.SCHOLARSCOUT_DATA_SERVICE_TOKEN;
  const originalBlobToken = process.env.BLOB_READ_WRITE_TOKEN;
  const originalNamedBlobToken = process.env.SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN;
  const originalBlobPath = process.env.SCHOLARSCOUT_BLOB_DATA_PATH;
  const originalStaffEmails = process.env.SCHOLARSCOUT_STAFF_EMAILS;
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    setScholarScoutDataStoreForTests(null);
    restoreEnv('SCHOLARSCOUT_DATA_ADAPTER', originalAdapter);
    restoreEnv('SCHOLARSCOUT_DATA_SERVICE_URL', originalServiceUrl);
    restoreEnv('SCHOLARSCOUT_DATA_SERVICE_TOKEN', originalServiceToken);
    restoreEnv('BLOB_READ_WRITE_TOKEN', originalBlobToken);
    restoreEnv('SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN', originalNamedBlobToken);
    restoreEnv('SCHOLARSCOUT_BLOB_DATA_PATH', originalBlobPath);
    restoreEnv('SCHOLARSCOUT_STAFF_EMAILS', originalStaffEmails);
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('saves programme records through the active adapter', async () => {
    const store = new MemoryDataStore();
    setScholarScoutDataStoreForTests(store);

    const saved = await saveProgrammeRecord('staff-1', {
      ...programmes[0],
      id: 'adapter-record',
    });

    expect(saved?.revision).toBe(1);
    expect(store.data.programmeRecords).toHaveLength(1);
    expect(store.data.auditEvents[0]).toMatchObject({
      action: 'create',
      entityType: 'programme',
      entityId: 'adapter-record',
    });
  });

  it('rejects stale programme revisions through the active adapter', async () => {
    const store = new MemoryDataStore();
    store.data.programmeRecords = [{ ...programmes[0], revision: 2 }];
    setScholarScoutDataStoreForTests(store);

    await expect(
      saveProgrammeRecord('staff-1', { ...programmes[0], revision: 1 }),
    ).rejects.toMatchObject({
      currentRevision: 2,
      currentRecord: expect.objectContaining({ id: programmes[0].id }),
    });
  });

  it('saves shortlist plans through the active adapter and prunes removed programmes', async () => {
    const store = new MemoryDataStore();
    setScholarScoutDataStoreForTests(store);

    await saveShortlist('student-1', [
      'north-valley-health',
      'metro-cybersecurity',
    ]);
    await saveShortlistPlans('student-1', {
      'north-valley-health': {
        status: 'contacted',
        note: 'Asked about clinical observation.',
      },
      'metro-cybersecurity': {
        status: 'ready-to-apply',
        note: 'Application looks short.',
      },
      missing: {
        status: 'visit-planned',
        note: 'Should be pruned.',
      },
    });

    await expect(getShortlistPlans('student-1')).resolves.toEqual({
      'metro-cybersecurity': {
        status: 'ready-to-apply',
        note: 'Application looks short.',
      },
      'north-valley-health': {
        status: 'contacted',
        note: 'Asked about clinical observation.',
      },
    });

    await saveShortlist('student-1', ['metro-cybersecurity']);

    await expect(getShortlistPlans('student-1')).resolves.toEqual({
      'metro-cybersecurity': {
        status: 'ready-to-apply',
        note: 'Application looks short.',
      },
    });
  });

  it('summarizes the active data backing and counts', async () => {
    process.env.SCHOLARSCOUT_DATA_ADAPTER = 'json';
    const store = new MemoryDataStore();
    store.data.users = [
      {
        id: 'user-1',
        email: 'student@example.com',
        name: 'Student',
        role: 'student',
        passwordHash: 'hash',
        createdAt: '2026-05-06T00:00:00.000Z',
      },
    ];
    store.data.onboardingProfiles['user-1'] = {
      gpaBand: '3.0-3.4',
      interests: ['technology'],
      locationPreference: 'online-only',
      pathwayPreference: 'online-degree',
      affordabilitySensitivity: 4,
      supportNeeds: ['career-counseling'],
    };
    store.data.shortlists['user-1'] = ['north-valley-health'];
    store.data.programmeRecords = [{ ...programmes[0], revision: 1 }];
    store.data.auditEvents = [
      {
        id: 'event-1',
        userId: 'user-1',
        action: 'save',
        entityType: 'shortlist',
        entityId: 'user-1',
        createdAt: '2026-05-06T00:00:00.000Z',
      },
    ];
    setScholarScoutDataStoreForTests(store);

    await expect(getScholarScoutDataStoreStatus()).resolves.toMatchObject({
      adapter: 'json',
      isDurable: false,
      backupRetention: {
        retainedBackups: 0,
        maxRetainedBackups: 5,
        isWithinPolicy: true,
        issues: [],
      },
      counts: {
        users: 1,
        onboardingProfiles: 1,
        shortlists: 1,
        programmeRecords: 1,
        auditEvents: 1,
      },
    });
  });

  it('requires a service URL for the HTTP data adapter', () => {
    process.env.SCHOLARSCOUT_DATA_ADAPTER = 'http';
    delete process.env.SCHOLARSCOUT_DATA_SERVICE_URL;

    expect(() => getScholarScoutDataStore()).toThrow(
      'SCHOLARSCOUT_DATA_SERVICE_URL is required',
    );
  });

  it('reads and writes through the HTTP data adapter', async () => {
    process.env.SCHOLARSCOUT_DATA_ADAPTER = 'http';
    process.env.SCHOLARSCOUT_DATA_SERVICE_URL =
      'https://data.example.test/scholarscout';
    process.env.SCHOLARSCOUT_DATA_SERVICE_TOKEN = 'test-token';
    const fetchMock = jest.fn(async (_url, init?: RequestInit) => {
      if (init?.method === 'PUT') {
        return {
          ok: true,
          status: 200,
        } as Response;
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({
          ...initialData,
          programmeRecords: [storedProgramme('service-record')],
        }),
      } as Response;
    });
    globalThis.fetch = fetchMock;

    const data = await readScholarScoutData();
    await writeScholarScoutData(data);

    expect(data.programmeRecords[0].id).toBe('service-record');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://data.example.test/scholarscout',
      expect.objectContaining({
        cache: 'no-store',
        headers: { Authorization: 'Bearer test-token' },
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'https://data.example.test/scholarscout',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('treats only HTTP 404 as verified absence and rejects invalid provider documents', async () => {
    process.env.SCHOLARSCOUT_DATA_ADAPTER = 'http';
    process.env.SCHOLARSCOUT_DATA_SERVICE_URL =
      'https://data.example.test/scholarscout';

    globalThis.fetch = jest.fn(async (): Promise<Response> => ({
      ok: false,
      status: 404,
    }) as Response);
    await expect(readScholarScoutData()).resolves.toMatchObject(initialData);

    setScholarScoutDataStoreForTests(null);
    globalThis.fetch = jest.fn(async (): Promise<Response> => ({
      ok: true,
      status: 200,
      json: async () => ({ ...initialData, users: null }),
    }) as Response);
    await expect(readScholarScoutData()).rejects.toMatchObject({
      category: 'invalid-data',
    });

    setScholarScoutDataStoreForTests(null);
    globalThis.fetch = jest.fn(async (): Promise<Response> => ({
      ok: false,
      status: 503,
    }) as Response);
    await expect(readScholarScoutData()).rejects.toBeInstanceOf(
      ScholarScoutDataStoreReadError,
    );
  });

  it('rejects malformed JSON storage instead of replacing it with empty data', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'scholarscout-store-'));
    const filePath = path.join(directory, 'data.json');
    await writeFile(filePath, '{', 'utf8');

    try {
      const store = new JsonScholarScoutDataStore(filePath);
      await expect(store.read()).rejects.toMatchObject({
        category: 'invalid-data',
      });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('requires a read-write token for the Vercel Blob data adapter', () => {
    process.env.SCHOLARSCOUT_DATA_ADAPTER = 'vercel-blob';
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN;

    expect(() => getScholarScoutDataStore()).toThrow(
      'BLOB_READ_WRITE_TOKEN or SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN is required',
    );
  });

  it('reports Vercel Blob configuration without reading when token is missing', async () => {
    process.env.SCHOLARSCOUT_DATA_ADAPTER = 'vercel-blob';
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN;

    expect(getDataStoreConfigurationSummary()).toMatchObject({
      adapter: 'vercel-blob',
      isConfigured: false,
      isDurable: false,
      issues: expect.arrayContaining([
        expect.stringContaining('BLOB_READ_WRITE_TOKEN'),
      ]),
    });
    await expect(getScholarScoutDataStoreStatus()).resolves.toMatchObject({
      counts: {
        users: 0,
        onboardingProfiles: 0,
        shortlists: 0,
        programmeRecords: 0,
        auditEvents: 0,
      },
    });
  });

  it('reads and writes through the Vercel Blob data adapter', async () => {
    process.env.SCHOLARSCOUT_DATA_ADAPTER = 'vercel-blob';
    process.env.SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN = 'blob-token';
    process.env.SCHOLARSCOUT_BLOB_DATA_PATH = 'private/scholarscout.json';
    const getMock = jest.mocked(get);
    const putMock = jest.mocked(put);

    getMock.mockResolvedValue({
      statusCode: 200,
      stream: createTextStream(
        JSON.stringify({
          ...initialData,
          programmeRecords: [storedProgramme('blob-record')],
        }),
      ),
      headers: new Headers(),
      blob: {
        url: 'https://blob.example/private/scholarscout.json',
        downloadUrl: 'https://blob.example/private/scholarscout.json',
        pathname: 'private/scholarscout.json',
        contentDisposition: 'attachment',
        cacheControl: 'max-age=60',
        uploadedAt: new Date('2026-05-06T00:00:00.000Z'),
        etag: 'etag',
        contentType: 'application/json',
        size: 10,
      },
    } as unknown as GetBlobResult);
    putMock.mockResolvedValue({
      url: 'https://blob.example/private/scholarscout.json',
      downloadUrl: 'https://blob.example/private/scholarscout.json',
      pathname: 'private/scholarscout.json',
      contentType: 'application/json',
      contentDisposition: 'attachment',
      etag: 'etag',
    } as PutBlobResult);

    const data = await readScholarScoutData();
    await writeScholarScoutData(data);

    expect(data.programmeRecords[0].id).toBe('blob-record');
    expect(getMock).toHaveBeenCalledWith('private/scholarscout.json', {
      access: 'private',
      token: 'blob-token',
      useCache: false,
    });
    expect(putMock).toHaveBeenCalledWith(
      'private/scholarscout.json',
      expect.stringContaining('blob-record'),
      expect.objectContaining({
        access: 'private',
        allowOverwrite: true,
        cacheControlMaxAge: 60,
        contentType: 'application/json',
        token: 'blob-token',
      }),
    );
  });

  it('distinguishes a missing Blob from an invalid stored Blob document', async () => {
    process.env.SCHOLARSCOUT_DATA_ADAPTER = 'vercel-blob';
    process.env.SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN = 'blob-token';
    const getMock = jest.mocked(get);

    getMock.mockResolvedValueOnce(null as unknown as GetBlobResult);
    await expect(readScholarScoutData()).resolves.toMatchObject(initialData);

    setScholarScoutDataStoreForTests(null);
    getMock.mockResolvedValueOnce({
      statusCode: 200,
      stream: createTextStream(JSON.stringify({ ...initialData, shortlists: [] })),
    } as unknown as GetBlobResult);
    await expect(readScholarScoutData()).rejects.toMatchObject({
      category: 'invalid-data',
    });
  });

  it('creates OAuth users with staff allowlist roles', async () => {
    process.env.SCHOLARSCOUT_STAFF_EMAILS =
      'staff@example.com, advising@example.com';
    const store = new MemoryDataStore();
    setScholarScoutDataStoreForTests(store);

    const user = await findOrCreateOAuthUser({
      email: ' Staff@Example.com ',
      name: 'Staff User',
    });
    const existing = await findOrCreateOAuthUser({
      email: 'staff@example.com',
      name: 'Different Name',
    });

    expect(getAccountRoleForEmail('advising@example.com')).toBe('staff');
    expect(user).toMatchObject({
      email: 'staff@example.com',
      name: 'Staff User',
      role: 'staff',
      passwordHash: 'oauth',
    });
    expect(existing.id).toBe(user.id);
    expect(store.data.users).toHaveLength(1);
  });

  it('validates exported ScholarScout data snapshots before restore planning', () => {
    const data: ScholarScoutData = {
      users: [
        {
          id: 'user-1',
          email: 'staff@example.com',
          name: 'Staff User',
          role: 'staff',
          passwordHash: 'oauth',
          createdAt: '2026-05-06T00:00:00.000Z',
        },
      ],
      onboardingProfiles: {},
      shortlists: {
        'user-1': ['north-valley-health'],
      },
      shortlistPlans: {
        'user-1': {
          'north-valley-health': {
            status: 'contacted',
            note: 'Asked about visit dates.',
          },
        },
      },
      programmeRecords: [
        {
          ...programmes[0],
          sourceName: 'College catalogue',
          sourceConfidence: 'verified',
          sourceNotes: 'Checked programme details.',
          sourceChecks: [
            'tuition',
            'credential',
            'duration',
            'delivery',
            'support',
            'next-steps',
          ],
          lastVerifiedAt: '2026-05-06',
          publicationStatus: 'published',
        },
      ],
      auditEvents: [
        {
          id: 'event-1',
          userId: 'user-1',
          action: 'create',
          entityType: 'programme',
          entityId: programmes[0].id,
          createdAt: '2026-05-06T00:00:00.000Z',
        },
      ],
    };

    expect(
      validateScholarScoutDataImport({
        exportedAt: '2026-05-06T00:00:00.000Z',
        data,
      }),
    ).toEqual({
      isValid: true,
      errors: [],
      counts: {
        users: 1,
        onboardingProfiles: 0,
        shortlists: 1,
        programmeRecords: 1,
        auditEvents: 1,
      },
    });
  });

  it('reports practical errors for invalid restore snapshots', () => {
    expect(
      validateScholarScoutDataImport({
        users: [{ email: 'missing-fields@example.com' }],
        onboardingProfiles: [],
        shortlists: { 'user-1': [42] },
        shortlistPlans: { 'user-1': { programme: { status: 'unknown' } } },
        programmeRecords: [{ name: '' }],
        auditEvents: [{}],
      }),
    ).toMatchObject({
      isValid: false,
      errors: expect.arrayContaining([
        'User 1 is missing required account fields.',
        'Snapshot onboarding profiles must be an object.',
        'Shortlist for user-1 must be an array of programme ids.',
        'Shortlist plan for user-1/programme is missing required fields.',
        expect.stringContaining('Programme record 1 needs review'),
        'Audit event 1 is missing required fields.',
      ]),
    });
  });

  it('restores valid snapshots after backing up the current document', async () => {
    const store = new MemoryDataStore();
    store.data.users = [
      {
        id: 'current-user',
        email: 'current@example.com',
        name: 'Current User',
        role: 'student',
        passwordHash: 'hash',
        createdAt: '2026-05-05T00:00:00.000Z',
      },
    ];
    setScholarScoutDataStoreForTests(store);
    const snapshot: ScholarScoutData = {
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

    const result = await restoreScholarScoutDataFromImport({
      actorUserId: 'staff-1',
      snapshot,
      reason: 'Rollback after bad import',
    });

    expect(result.counts.users).toBe(1);
    expect(store.data.users[0].id).toBe('restored-user');
    expect(store.data.restoreBackups).toHaveLength(1);
    expect(store.data.restoreBackups?.[0]).toMatchObject({
      id: result.backupId,
      actorUserId: 'staff-1',
      reason: 'Rollback after bad import',
      counts: expect.objectContaining({ users: 1 }),
      data: expect.objectContaining({
        users: [expect.objectContaining({ id: 'current-user' })],
      }),
    });
    expect(store.data.auditEvents[0]).toMatchObject({
      action: 'restore',
      entityType: 'data',
      entityId: result.backupId,
      userId: 'staff-1',
    });
  });

  it('rejects invalid restore snapshots without replacing data', async () => {
    const store = new MemoryDataStore();
    store.data.users = [
      {
        id: 'current-user',
        email: 'current@example.com',
        name: 'Current User',
        role: 'student',
        passwordHash: 'hash',
        createdAt: '2026-05-05T00:00:00.000Z',
      },
    ];
    setScholarScoutDataStoreForTests(store);

    await expect(
      restoreScholarScoutDataFromImport({
        actorUserId: 'staff-1',
        snapshot: { users: [] },
      }),
    ).rejects.toMatchObject({
      validation: expect.objectContaining({ isValid: false }),
    });

    expect(store.data.users[0].id).toBe('current-user');
    expect(store.data.restoreBackups).toBeUndefined();
  });

  it('summarizes restore backups without exposing backup documents', async () => {
    const store = new MemoryDataStore();
    store.data.users = [
      {
        id: 'staff-1',
        email: 'staff@example.com',
        name: 'Staff User',
        role: 'staff',
        passwordHash: 'oauth',
        createdAt: '2026-05-06T00:00:00.000Z',
      },
    ];
    store.data.restoreBackups = [
      {
        id: 'older-backup',
        actorUserId: 'missing-staff',
        reason: 'Earlier restore',
        createdAt: '2026-05-05T00:00:00.000Z',
        counts: {
          users: 1,
          onboardingProfiles: 0,
          shortlists: 0,
          programmeRecords: 0,
          auditEvents: 0,
        },
        data: initialData,
      },
      {
        id: 'newer-backup',
        actorUserId: 'staff-1',
        reason: 'Latest restore',
        createdAt: '2026-05-06T00:00:00.000Z',
        counts: {
          users: 2,
          onboardingProfiles: 1,
          shortlists: 1,
          programmeRecords: 3,
          auditEvents: 4,
        },
        data: initialData,
      },
    ];
    setScholarScoutDataStoreForTests(store);

    const backups = await getScholarScoutRestoreBackups();

    expect(backups).toEqual([
      {
        id: 'newer-backup',
        actorUserId: 'staff-1',
        actorLabel: 'Staff User',
        reason: 'Latest restore',
        createdAt: '2026-05-06T00:00:00.000Z',
        counts: {
          users: 2,
          onboardingProfiles: 1,
          shortlists: 1,
          programmeRecords: 3,
          auditEvents: 4,
        },
      },
      {
        id: 'older-backup',
        actorUserId: 'missing-staff',
        actorLabel: 'Staff account',
        reason: 'Earlier restore',
        createdAt: '2026-05-05T00:00:00.000Z',
        counts: {
          users: 1,
          onboardingProfiles: 0,
          shortlists: 0,
          programmeRecords: 0,
          auditEvents: 0,
        },
      },
    ]);
    expect(backups[0]).not.toHaveProperty('data');
  });

  it('checks restore backup retention policy drift', () => {
    const backups = Array.from({ length: 6 }, (_, index) => ({
      id: index === 5 ? 'backup-1' : `backup-${index + 1}`,
      actorUserId: 'staff-1',
      reason: 'Retention fixture',
      createdAt: `2026-05-0${Math.min(index + 1, 6)}T00:00:00.000Z`,
      counts: {
        users: 0,
        onboardingProfiles: 0,
        shortlists: 0,
        programmeRecords: 0,
        auditEvents: 0,
      },
      data: {
        ...initialData,
        restoreBackups:
          index === 2
            ? [
                {
                  id: 'nested-backup',
                  actorUserId: 'staff-1',
                  reason: 'Nested fixture',
                  createdAt: '2026-05-01T00:00:00.000Z',
                  counts: {
                    users: 0,
                    onboardingProfiles: 0,
                    shortlists: 0,
                    programmeRecords: 0,
                    auditEvents: 0,
                  },
                  data: initialData,
                },
              ]
            : [],
      },
    }));

    expect(
      getRestoreBackupRetentionStatus({
        ...initialData,
        restoreBackups: backups,
      }),
    ).toEqual({
      retainedBackups: 6,
      maxRetainedBackups: 5,
      isWithinPolicy: false,
      issues: [
        'Restore backup history retains 6 backups; policy keeps 5.',
        'Restore backups should not contain nested backup history: backup-3.',
        'Restore backup ids should be unique: backup-1.',
      ],
    });
  });

  it('plans backup restores with comparison-ready count deltas', async () => {
    const store = new MemoryDataStore();
    store.data.users = [
      {
        id: 'current-staff',
        email: 'current@example.com',
        name: 'Current Staff',
        role: 'staff',
        passwordHash: 'oauth',
        createdAt: '2026-05-06T00:00:00.000Z',
      },
      {
        id: 'current-student',
        email: 'student@example.com',
        name: 'Student',
        role: 'student',
        passwordHash: 'hash',
        createdAt: '2026-05-06T00:00:00.000Z',
      },
    ];
    store.data.programmeRecords = [
      { ...programmes[0], id: 'current-programme' },
      { ...programmes[1], id: 'second-programme' },
    ];
    store.data.auditEvents = [
      {
        id: 'current-event',
        userId: 'current-staff',
        action: 'restore',
        entityType: 'data',
        entityId: 'backup-1',
        createdAt: '2026-05-06T00:00:00.000Z',
      },
    ];
    store.data.restoreBackups = [
      {
        id: 'backup-1',
        actorUserId: 'current-staff',
        reason: 'Preview saved backup',
        createdAt: '2026-05-05T00:00:00.000Z',
        counts: {
          users: 1,
          onboardingProfiles: 0,
          shortlists: 0,
          programmeRecords: 1,
          auditEvents: 0,
        },
        data: {
          users: [store.data.users[0]],
          onboardingProfiles: {},
          shortlists: {},
          programmeRecords: [{ ...programmes[0], id: 'backup-programme' }],
          auditEvents: [],
        },
      },
    ];
    setScholarScoutDataStoreForTests(store);

    await expect(getScholarScoutRestoreBackupPlan('missing')).resolves.toBeNull();
    await expect(getScholarScoutRestoreBackupPlan('backup-1')).resolves.toEqual({
      backup: expect.objectContaining({
        id: 'backup-1',
        actorLabel: 'Current Staff',
        reason: 'Preview saved backup',
      }),
      rows: [
        {
          key: 'users',
          label: 'Users',
          currentCount: 2,
          restoredCount: 1,
          delta: -1,
        },
        {
          key: 'onboardingProfiles',
          label: 'Profiles',
          currentCount: 0,
          restoredCount: 0,
          delta: 0,
        },
        {
          key: 'shortlists',
          label: 'Shortlists',
          currentCount: 0,
          restoredCount: 0,
          delta: 0,
        },
        {
          key: 'programmeRecords',
          label: 'Programmes',
          currentCount: 2,
          restoredCount: 1,
          delta: -1,
        },
        {
          key: 'auditEvents',
          label: 'Audit events',
          currentCount: 1,
          restoredCount: 0,
          delta: -1,
        },
      ],
    });
  });

  it('restores a saved backup after backing up the current document', async () => {
    const store = new MemoryDataStore();
    store.data.users = [
      {
        id: 'current-staff',
        email: 'current@example.com',
        name: 'Current Staff',
        role: 'staff',
        passwordHash: 'oauth',
        createdAt: '2026-05-06T00:00:00.000Z',
      },
      {
        id: 'current-student',
        email: 'student@example.com',
        name: 'Current Student',
        role: 'student',
        passwordHash: 'hash',
        createdAt: '2026-05-06T00:00:00.000Z',
      },
    ];
    store.data.auditEvents = [
      {
        id: 'current-event',
        userId: 'current-staff',
        action: 'save',
        entityType: 'programme',
        entityId: 'current-programme',
        createdAt: '2026-05-06T00:00:00.000Z',
      },
    ];
    store.data.restoreBackups = [
      {
        id: 'backup-to-restore',
        actorUserId: 'current-staff',
        reason: 'Known good state',
        createdAt: '2026-05-05T00:00:00.000Z',
        counts: {
          users: 1,
          onboardingProfiles: 0,
          shortlists: 0,
          programmeRecords: 1,
          auditEvents: 0,
        },
        data: {
          users: [
            {
              id: 'restored-staff',
              email: 'restored@example.com',
              name: 'Restored Staff',
              role: 'staff',
              passwordHash: 'oauth',
              createdAt: '2026-05-04T00:00:00.000Z',
            },
          ],
          onboardingProfiles: {},
          shortlists: {},
          programmeRecords: [
            {
              ...programmes[0],
              id: 'restored-programme',
              publicationStatus: 'draft',
              sourceConfidence: 'unverified',
              sourceChecks: [],
            },
          ],
          auditEvents: [],
        },
      },
      {
        id: 'older-backup',
        actorUserId: 'current-staff',
        reason: 'Older state',
        createdAt: '2026-05-04T00:00:00.000Z',
        counts: {
          users: 0,
          onboardingProfiles: 0,
          shortlists: 0,
          programmeRecords: 0,
          auditEvents: 0,
        },
        data: initialData,
      },
    ];
    setScholarScoutDataStoreForTests(store);

    await expect(
      restoreScholarScoutDataFromBackup({
        actorUserId: 'current-staff',
        backupId: 'missing-backup',
      }),
    ).resolves.toBeNull();

    const result = await restoreScholarScoutDataFromBackup({
      actorUserId: 'current-staff',
      backupId: 'backup-to-restore',
      reason: 'Restore known good backup',
    });

    expect(result).toMatchObject({
      sourceBackupId: 'backup-to-restore',
      counts: {
        users: 1,
        onboardingProfiles: 0,
        shortlists: 0,
        programmeRecords: 1,
        auditEvents: 1,
      },
    });
    expect(store.data.users[0].id).toBe('restored-staff');
    expect(store.data.programmeRecords[0].id).toBe('restored-programme');
    expect(store.data.restoreBackups?.[0]).toMatchObject({
      id: result?.backupId,
      actorUserId: 'current-staff',
      reason: 'Restore known good backup',
      data: expect.objectContaining({
        users: expect.arrayContaining([
          expect.objectContaining({ id: 'current-student' }),
        ]),
      }),
    });
    expect(store.data.restoreBackups?.map((backup) => backup.id)).not.toContain(
      'backup-to-restore',
    );
    expect(store.data.restoreBackups?.map((backup) => backup.id)).toContain(
      'older-backup',
    );
    expect(store.data.auditEvents[0]).toMatchObject({
      action: 'restore-backup',
      entityType: 'data',
      entityId: 'backup-to-restore',
      userId: 'current-staff',
    });
  });
});

describe('guest lifecycle migration', () => {
  afterEach(() => {
    setScholarScoutDataStoreForTests(null);
  });

  it('stores only a hashed seven-day guest credential and migrates only allowlisted private records once', async () => {
    const store = new MemoryDataStore();
    const data = store.data as PlatformData;
    const guestId = 'guest-one';
    const guestKey = `guest:${guestId}`;
    const accountId = 'account-one';
    const now = new Date('2026-07-28T12:00:00.000Z');

    data.onboardingProfiles[guestKey] = {
      gpaBand: '3.0-3.4',
      interests: ['technology'],
      locationPreference: 'online-only',
      pathwayPreference: 'online-degree',
      affordabilitySensitivity: 4,
      supportNeeds: ['career-counseling'],
    };
    data.shortlists[guestKey] = ['metro-cybersecurity'];
    data.shortlistPlans = {
      [guestKey]: {
        'metro-cybersecurity': {
          status: 'contacted',
          note: 'Guest-owned plan.',
        },
      },
    };
    data.feedInteractions = [
      {
        id: 'feed-guest',
        userKey: guestKey,
        feedItemId: 'explore-technology',
        watchSeconds: 30,
        skipped: false,
        createdAt: now.toISOString(),
      },
    ];
    data.simulationResults = [
      {
        id: 'simulation-guest',
        userKey: guestKey,
        simulationId: 'career-values',
        score: 4,
        maxScore: 5,
        clarityScore: 3,
        boosts: ['technology'],
        feedback: ['Keep exploring.'],
        createdAt: now.toISOString(),
      },
    ];
    data.memoryRecords = [
      {
        id: 'memory-guest',
        userKey: guestKey,
        stage: 'exploring',
        summary: 'Guest activity.',
        createdAt: now.toISOString(),
      },
    ];
    data.referralRecords = [
      {
        id: 'referral-guest',
        referrer: guestKey,
        code: 'guest-code',
        converted: false,
        createdAt: now.toISOString(),
      },
    ];
    data.shareRecords = [
      {
        id: 'share-guest',
        userKey: guestKey,
        targetType: 'programme',
        targetId: 'metro-cybersecurity',
        deepLink: 'https://scholarscout.app/share/programme/metro-cybersecurity',
        createdAt: now.toISOString(),
      },
    ];
    data.analyticsEvents = [
      {
        id: 'analytics-guest',
        area: 'recommendation',
        name: 'opened',
        userKey: guestKey,
        metadata: {},
        createdAt: now.toISOString(),
      },
    ];
    data.decisionLogs = [{ id: 'decision-one' }] as never;
    data.peerConnectionRequests = [{ id: 'peer-one' }] as never;
    data.campusNotes = [{ id: 'campus-one' }] as never;
    data.uploaderInboxRequests = [{ id: 'inbox-one' }] as never;
    data.outcomeMetricRecords = [{ id: 'outcome-one' }] as never;
    data.auditEvents = [{ id: 'audit-one' }] as never;
    data.restoreBackups = [{ id: 'backup-one' }] as never;
    const excludedBefore = JSON.parse(
      JSON.stringify({
        users: data.users,
        programmeRecords: data.programmeRecords,
        outcomeMetricRecords: data.outcomeMetricRecords,
        auditEvents: data.auditEvents,
        restoreBackups: data.restoreBackups,
        decisionLogs: data.decisionLogs,
        peerConnectionRequests: data.peerConnectionRequests,
        campusNotes: data.campusNotes,
        uploaderInboxRequests: data.uploaderInboxRequests,
      }),
    );
    setScholarScoutDataStoreForTests(store);

    const rawGuestSecret = 'raw-guest-secret';
    await registerGuestLifecycle({
      guestId,
      credentialHash: hashGuestCredential(rawGuestSecret),
      quotaWindowId: 'guest-window-one',
      now,
    });

    const storedBeforeMigration = await readScholarScoutData();
    expect(JSON.stringify(storedBeforeMigration)).not.toContain(rawGuestSecret);
    expect(storedBeforeMigration.guestLifecycles).toEqual([
      expect.objectContaining({
        id: guestId,
        credentialHash: hashGuestCredential(rawGuestSecret),
        quotaWindowId: 'guest-window-one',
        expiresAt: '2026-08-04T12:00:00.000Z',
      }),
    ]);

    await expect(
      migrateGuestOwnedRecords({ guestId, accountId, now }),
    ).resolves.toMatchObject({
      migrated: true,
      guestWindowId: 'guest-window-one',
    });

    expect(store.data.onboardingProfiles).toEqual({
      [accountId]: expect.objectContaining({ interests: ['technology'] }),
    });
    expect(store.data.shortlists).toEqual({
      [accountId]: ['metro-cybersecurity'],
    });
    expect(store.data.shortlistPlans).toEqual({
      [accountId]: expect.objectContaining({ 'metro-cybersecurity': expect.any(Object) }),
    });
    const migrated = store.data as PlatformData;
    expect(migrated.feedInteractions?.[0].userKey).toBe(accountId);
    expect(migrated.simulationResults?.[0].userKey).toBe(accountId);
    expect(migrated.memoryRecords?.[0].userKey).toBe(accountId);
    expect(migrated.referralRecords?.[0].referrer).toBe(accountId);
    expect(migrated.shareRecords?.[0].userKey).toBe(accountId);
    expect(migrated.analyticsEvents?.[0].userKey).toBe(accountId);
    expect(migrated.guestQuotaBindings?.[accountId]).toMatchObject({
      guestWindowId: 'guest-window-one',
    });
    expect(migrated.guestMigrationAuditRecords).toEqual([
      expect.objectContaining({ guestId, accountId }),
    ]);
    expect({
      users: migrated.users,
      programmeRecords: migrated.programmeRecords,
      outcomeMetricRecords: migrated.outcomeMetricRecords,
      auditEvents: migrated.auditEvents,
      restoreBackups: migrated.restoreBackups,
      decisionLogs: migrated.decisionLogs,
      peerConnectionRequests: migrated.peerConnectionRequests,
      campusNotes: migrated.campusNotes,
      uploaderInboxRequests: migrated.uploaderInboxRequests,
    }).toEqual(excludedBefore);

    const afterFirstMigration = JSON.stringify(store.data);
    await expect(
      migrateGuestOwnedRecords({ guestId, accountId, now }),
    ).resolves.toMatchObject({ migrated: false, alreadyMigrated: true });
    expect(JSON.stringify(store.data)).toBe(afterFirstMigration);
  });
});

function createTextStream(value: string) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(value));
      controller.close();
    },
  });
}

function storedProgramme(id: string) {
  return {
    ...programmes[0],
    id,
    publicationStatus: 'published' as const,
    sourceName: 'Verified catalogue',
    sourceConfidence: 'verified' as const,
    sourceNotes: 'Validated adapter fixture.',
    sourceChecks: [
      'tuition',
      'credential',
      'duration',
      'delivery',
      'support',
      'next-steps',
    ] as const,
    lastVerifiedAt: '2026-08-28',
  };
}

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}
