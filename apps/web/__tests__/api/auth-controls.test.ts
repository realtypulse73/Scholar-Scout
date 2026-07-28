/** @jest-environment node */

import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import {
  GUEST_ACTOR_COOKIE_NAME,
  clearGuestActorCookie,
  resolveStudentActor,
} from '@/lib/server/student-actor';
import {
  readScholarScoutData,
  setScholarScoutDataStoreForTests,
  type ScholarScoutData,
  type ScholarScoutDataStore,
} from '@/lib/server/data-store';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
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

describe('student actor controls', () => {
  const getSessionMock = jest.mocked(getServerSession);
  const cookiesMock = jest.mocked(cookies);
  const cookieStore = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(() => {
    getSessionMock.mockReset();
    cookiesMock.mockReset();
    cookieStore.get.mockReset();
    cookieStore.set.mockReset();
    cookiesMock.mockResolvedValue(cookieStore as never);
  });

  afterEach(() => {
    setScholarScoutDataStoreForTests(null);
  });

  it('uses only the current session id for an account actor', async () => {
    getSessionMock.mockResolvedValue({
      user: { id: 'account-one', email: 'staff@example.com' },
    } as never);
    cookieStore.get.mockReturnValue({ value: 'browser-selected-guest' });

    await expect(resolveStudentActor({ allowGuest: true })).resolves.toEqual({
      kind: 'account',
      accountId: 'account-one',
      storageKey: 'account:account-one',
    });
    expect(cookieStore.get).not.toHaveBeenCalled();
  });

  it('issues and validates a random secure seven-day guest cookie without staff capability', async () => {
    const store = new MemoryDataStore();
    setScholarScoutDataStoreForTests(store);
    getSessionMock.mockResolvedValue(null);
    cookieStore.get.mockReturnValue(undefined);

    const actor = await resolveStudentActor({ allowGuest: true });

    expect(actor).toMatchObject({
      kind: 'guest',
      storageKey: expect.stringMatching(/^guest:/),
    });
    expect(actor).not.toHaveProperty('staff');
    expect(cookieStore.set).toHaveBeenCalledWith(
      GUEST_ACTOR_COOKIE_NAME,
      expect.stringMatching(/^[A-Za-z0-9_-]{40,}$/),
      {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      },
    );

    const issuedCredential = cookieStore.set.mock.calls[0][1] as string;
    const storedData = await readScholarScoutData();
    expect(storedData.guestLifecycles).toEqual([
      expect.objectContaining({
        credentialHash: expect.any(String),
      }),
    ]);
    expect(JSON.stringify(storedData)).not.toContain(issuedCredential);

    cookieStore.get.mockReturnValue({ value: issuedCredential });
    await expect(resolveStudentActor({ allowGuest: false })).resolves.toEqual(actor);
  });

  it('does not issue a guest actor when route policy forbids it and clears only the trusted guest cookie', async () => {
    getSessionMock.mockResolvedValue(null);
    cookieStore.get.mockReturnValue(undefined);

    await expect(resolveStudentActor({ allowGuest: false })).resolves.toBeNull();
    expect(cookieStore.set).not.toHaveBeenCalled();

    await clearGuestActorCookie();
    expect(cookieStore.set).toHaveBeenCalledWith(GUEST_ACTOR_COOKIE_NAME, '', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  });
});
