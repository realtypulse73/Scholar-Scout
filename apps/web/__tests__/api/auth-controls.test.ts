/** @jest-environment node */

import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { POST as migrateGuest } from '@/app/api/account/guest-migration/route';
import { POST as exchangeCredentials } from '@/app/api/auth/credentials/route';
import { authOptions } from '@/auth';
import {
  GUEST_ACTOR_COOKIE_NAME,
  clearGuestActorCookie,
  resolveStudentActor,
} from '@/lib/server/student-actor';
import {
  hashGuestCredential,
  readScholarScoutData,
  registerGuestLifecycle,
  createUser,
  setScholarScoutDataStoreForTests,
  type ScholarScoutData,
  type ScholarScoutDataStore,
} from '@/lib/server/data-store';
import {
  setAtomicReservationLimiterForTests,
  type AtomicReservationLimiter,
} from '@/lib/server/rate-limit';

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

  it('rejects unauthenticated migration without reading a browser-selected identity', async () => {
    getSessionMock.mockResolvedValue(null);

    const response = await migrateGuest();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
    expect(cookieStore.get).not.toHaveBeenCalled();
  });

  it('migrates only the cookie-resolved guest once and returns stable success after invalidation', async () => {
    const store = new MemoryDataStore();
    const guestId = 'guest-route';
    const guestCredential = 'trusted-guest-cookie';
    const guestKey = `guest:${guestId}`;
    setScholarScoutDataStoreForTests(store);
    store.data.onboardingProfiles[guestKey] = {
      gpaBand: '3.5-4.0',
      interests: ['healthcare'],
      locationPreference: 'in-state',
      pathwayPreference: '4-year-university',
      affordabilitySensitivity: 3,
      supportNeeds: [],
    };
    await registerGuestLifecycle({
      guestId,
      credentialHash: hashGuestCredential(guestCredential),
      now: new Date(Date.now() - 60_000),
    });
    getSessionMock.mockResolvedValue({ user: { id: 'account-route' } } as never);
    cookieStore.get.mockReturnValue({ value: guestCredential });

    const firstResponse = await migrateGuest();

    expect(firstResponse.status).toBe(200);
    await expect(firstResponse.json()).resolves.toEqual({
      ok: true,
      migrated: true,
    });
    expect(store.data.onboardingProfiles).toEqual({
      'account-route': expect.objectContaining({ interests: ['healthcare'] }),
    });
    expect(cookieStore.set).toHaveBeenCalledWith(GUEST_ACTOR_COOKIE_NAME, '', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    cookieStore.get.mockReturnValue(undefined);
    cookieStore.set.mockClear();
    const retryResponse = await migrateGuest();

    expect(retryResponse.status).toBe(200);
    await expect(retryResponse.json()).resolves.toEqual({
      ok: true,
      migrated: false,
    });
    expect(cookieStore.set).not.toHaveBeenCalled();
    await expect(readScholarScoutData()).resolves.toMatchObject({
      guestQuotaBindings: {
        'account-route': expect.objectContaining({ guestId }),
      },
    });
  });
});

describe('credential exchange controls', () => {
  const credentialProvider = authOptions.providers?.[0] as {
    options: {
      authorize: (credentials: Record<string, string> | undefined) => Promise<unknown>;
    };
  };

  beforeEach(() => {
    setScholarScoutDataStoreForTests(new MemoryDataStore());
  });

  afterEach(() => {
    setAtomicReservationLimiterForTests(null);
    setScholarScoutDataStoreForTests(null);
  });

  it('reserves five attempts before lookup and returns reset-aware 429 before the sixth KDF', async () => {
    const limiter = createFixedWindowLimiter(5);
    setAtomicReservationLimiterForTests(limiter);

    for (let index = 0; index < 5; index += 1) {
      const response = await exchangeCredentials(createCredentialsRequest());
      expect(response.status).toBe(401);
    }

    const response = await exchangeCredentials(createCredentialsRequest());

    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('900');
    await expect(response.json()).resolves.toEqual({
      error: 'rate-limited',
      resetAt: '2026-07-28T12:15:00.000Z',
    });
    expect(limiter.reserve).toHaveBeenCalledTimes(6);
  });

  it('fails closed before account lookup when the trusted Vercel IP or limiter is unavailable', async () => {
    setAtomicReservationLimiterForTests(null);

    const unavailableLimiter = await exchangeCredentials(createCredentialsRequest());
    expect(unavailableLimiter.status).toBe(503);

    const missingTrustedIp = await exchangeCredentials(
      new Request('http://localhost/api/auth/credentials', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.4' },
        body: JSON.stringify({ email: 'student@example.com', password: 'not-the-password' }),
      }),
    );
    expect(missingTrustedIp.status).toBe(503);
  });

  it('issues a single-use grant after asynchronous verification and rejects raw credential callbacks', async () => {
    const limiter = createFixedWindowLimiter(5);
    setAtomicReservationLimiterForTests(limiter);
    await createUser({
      email: 'student@example.com',
      name: 'Student',
      password: 'secure-password',
      role: 'student',
    });

    const response = await exchangeCredentials(
      createCredentialsRequest({ password: 'secure-password' }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { grant: string };

    await expect(
      credentialProvider.options.authorize({ grant: body.grant }),
    ).resolves.toMatchObject({ email: 'student@example.com' });
    await expect(
      credentialProvider.options.authorize({ grant: body.grant }),
    ).resolves.toBeNull();
    await expect(
      credentialProvider.options.authorize({
        email: 'student@example.com',
        password: 'secure-password',
      }),
    ).resolves.toBeNull();
  });
});

function createCredentialsRequest(input?: { password?: string }): Request {
  return new Request('http://localhost/api/auth/credentials', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-vercel-forwarded-for': '203.0.113.7',
    },
    body: JSON.stringify({
      email: 'student@example.com',
      password: input?.password ?? 'not-the-password',
    }),
  });
}

function createFixedWindowLimiter(limit: number): AtomicReservationLimiter {
  let count = 0;

  return {
    reserve: jest.fn(async () => {
      count += 1;
      return {
        allowed: count <= limit,
        resetAt: new Date('2026-07-28T12:15:00.000Z'),
        retryAfterSeconds: 900,
      };
    }),
  };
}
