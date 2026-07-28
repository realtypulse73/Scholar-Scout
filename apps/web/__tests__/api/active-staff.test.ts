/** @jest-environment node */

import { getServerSession } from 'next-auth';
import {
  DELETE as deleteProgramme,
  GET as getProgrammes,
  POST as saveProgramme,
} from '@/app/api/admin/programmes/route';
import { GET as getShortlist } from '@/app/api/account/shortlist/route';
import {
  getPrivilegedOperationAuditEvents,
  requireActiveStaff,
} from '@/lib/server/active-staff';
import {
  setScholarScoutDataStoreForTests,
  type ScholarScoutData,
  type ScholarScoutDataStore,
} from '@/lib/server/data-store';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/auth', () => ({
  authOptions: {},
}), { virtual: true });

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

describe('active staff authorization', () => {
  const getSessionMock = jest.mocked(getServerSession);
  const originalStaffEmails = process.env.SCHOLARSCOUT_STAFF_EMAILS;

  beforeEach(() => {
    getSessionMock.mockReset();
    setScholarScoutDataStoreForTests(new MemoryDataStore());
    getSessionMock.mockResolvedValue({
      user: {
        id: 'staff-account',
        email: 'Staff@Example.com',
        role: 'staff',
      },
    } as never);
  });

  afterEach(() => {
    setScholarScoutDataStoreForTests(null);

    if (originalStaffEmails === undefined) {
      delete process.env.SCHOLARSCOUT_STAFF_EMAILS;
    } else {
      process.env.SCHOLARSCOUT_STAFF_EMAILS = originalStaffEmails;
    }
  });

  it('checks the current strict allowlist on every request instead of a stale JWT role', async () => {
    process.env.SCHOLARSCOUT_STAFF_EMAILS = 'staff@example.com';

    await expect(
      requireActiveStaff({
        action: 'programme:read',
        route: '/api/admin/programmes',
      }),
    ).resolves.toMatchObject({ ok: true, actor: { id: 'staff-account' } });

    process.env.SCHOLARSCOUT_STAFF_EMAILS = 'other@example.com';

    const revoked = await requireActiveStaff({
      action: 'programme:read',
      route: '/api/admin/programmes',
    });

    expect(revoked.ok).toBe(false);
    if (!revoked.ok) {
      expect(revoked.response.status).toBe(403);
      await expect(revoked.response.json()).resolves.toEqual({ error: 'Forbidden' });
    }
  });

  it.each([
    undefined,
    ' ',
    'staff@example.com, STAFF@example.com',
    'not-an-email',
  ])('fails closed for an invalid allowlist', async (allowlist) => {
    if (allowlist === undefined) {
      delete process.env.SCHOLARSCOUT_STAFF_EMAILS;
    } else {
      process.env.SCHOLARSCOUT_STAFF_EMAILS = allowlist;
    }

    const result = await requireActiveStaff({
      action: 'programme:read',
      route: '/api/admin/programmes',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(403);
    }
  });

  it('records only privacy-minimal authorization audit metadata', async () => {
    process.env.SCHOLARSCOUT_STAFF_EMAILS = 'other@example.com';

    await requireActiveStaff({
      action: 'programme:write',
      route: '/api/admin/programmes',
    });

    await expect(getPrivilegedOperationAuditEvents()).resolves.toEqual([
      expect.objectContaining({
        actorId: 'staff-account',
        action: 'programme:write',
        route: '/api/admin/programmes',
        outcome: 'denied',
        createdAt: expect.any(String),
      }),
    ]);
    const [audit] = await getPrivilegedOperationAuditEvents();
    expect(Object.keys(audit).sort()).toEqual([
      'action',
      'actorId',
      'createdAt',
      'id',
      'outcome',
      'route',
    ]);
    expect(JSON.stringify(audit)).not.toContain('Staff@Example.com');
  });

  it('rejects every programme operation for a removed staff member while preserving student access', async () => {
    process.env.SCHOLARSCOUT_STAFF_EMAILS = 'other@example.com';

    const [getResponse, postResponse, deleteResponse, shortlistResponse] =
      await Promise.all([
        getProgrammes(),
        saveProgramme(
          new Request('http://localhost/api/admin/programmes', {
            method: 'POST',
            body: JSON.stringify({ untrusted: 'body' }),
          }),
        ),
        deleteProgramme(
          new Request('http://localhost/api/admin/programmes?id=programme-one', {
            method: 'DELETE',
          }),
        ),
        getShortlist(),
      ]);

    expect(getResponse.status).toBe(403);
    expect(postResponse.status).toBe(403);
    expect(deleteResponse.status).toBe(403);
    expect(shortlistResponse.status).toBe(200);
    await expect(getPrivilegedOperationAuditEvents()).resolves.toHaveLength(3);
  });
});
