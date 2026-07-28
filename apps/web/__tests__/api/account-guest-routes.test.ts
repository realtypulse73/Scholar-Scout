/** @jest-environment node */

import {
  GET as getOnboarding,
  POST as postOnboarding,
} from '@/app/api/account/onboarding/route';

jest.mock('../../lib/server/student-actor', () => ({
  resolveStudentActor: jest.fn(),
}));

jest.mock('../../lib/server/data-store', () => ({
  getOnboardingProfile: jest.fn(),
  saveOnboardingProfile: jest.fn(),
  getShortlist: jest.fn(),
  getShortlistPlans: jest.fn(),
  saveShortlist: jest.fn(),
  saveShortlistPlans: jest.fn(),
}));

const completeProfile = {
  gpaBand: '3.0-3.4',
  interests: ['technology'],
  locationPreference: 'in-state',
  pathwayPreference: '4-year-university',
  affordabilitySensitivity: 3,
  supportNeeds: ['financial-aid'],
};

describe('account guest routes', () => {
  const resolveStudentActorMock = jest.requireMock(
    '../../lib/server/student-actor',
  ).resolveStudentActor as jest.Mock;
  const getOnboardingProfileMock = jest.requireMock(
    '../../lib/server/data-store',
  ).getOnboardingProfile as jest.Mock;
  const saveOnboardingProfileMock = jest.requireMock(
    '../../lib/server/data-store',
  ).saveOnboardingProfile as jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('uses a resolved opaque guest key for only that guest onboarding profile', async () => {
    const guestOne = {
      kind: 'guest' as const,
      guestId: 'guest-one',
      guestWindowId: 'window-one',
      storageKey: 'guest:guest-one',
    };
    const guestTwo = {
      kind: 'guest' as const,
      guestId: 'guest-two',
      guestWindowId: 'window-two',
      storageKey: 'guest:guest-two',
    };

    resolveStudentActorMock.mockResolvedValueOnce(guestOne);
    getOnboardingProfileMock.mockResolvedValueOnce(completeProfile);
    resolveStudentActorMock.mockResolvedValueOnce(guestTwo);
    getOnboardingProfileMock.mockResolvedValueOnce(null);

    const firstResponse = await getOnboarding();
    const secondResponse = await getOnboarding();

    await expect(firstResponse.json()).resolves.toEqual({ profile: completeProfile });
    await expect(secondResponse.json()).resolves.toEqual({ profile: null });
    expect(getOnboardingProfileMock).toHaveBeenNthCalledWith(1, guestOne.storageKey);
    expect(getOnboardingProfileMock).toHaveBeenNthCalledWith(2, guestTwo.storageKey);
  });

  it('writes only complete bounded profiles through the resolved actor key', async () => {
    const account = {
      kind: 'account' as const,
      accountId: 'student-one',
      storageKey: 'account:student-one',
    };
    resolveStudentActorMock.mockResolvedValue(account);

    const accepted = await postOnboarding(
      new Request('https://scholar-scout.test/api/account/onboarding', {
        method: 'POST',
        body: JSON.stringify(completeProfile),
      }),
    );
    const selectedIdentity = await postOnboarding(
      new Request('https://scholar-scout.test/api/account/onboarding', {
        method: 'POST',
        body: JSON.stringify({ ...completeProfile, accountId: 'student-two' }),
      }),
    );
    const invalidProfile = await postOnboarding(
      new Request('https://scholar-scout.test/api/account/onboarding', {
        method: 'POST',
        body: JSON.stringify({ ...completeProfile, interests: ['unknown'] }),
      }),
    );
    const malformed = await postOnboarding(
      new Request('https://scholar-scout.test/api/account/onboarding', {
        method: 'POST',
        body: '{',
      }),
    );
    const oversized = await postOnboarding(
      new Request('https://scholar-scout.test/api/account/onboarding', {
        method: 'POST',
        headers: { 'content-length': '5000' },
        body: JSON.stringify(completeProfile),
      }),
    );

    expect(accepted.status).toBe(200);
    expect(selectedIdentity.status).toBe(400);
    expect(invalidProfile.status).toBe(400);
    expect(malformed.status).toBe(400);
    expect(oversized.status).toBe(413);
    expect(saveOnboardingProfileMock).toHaveBeenCalledTimes(1);
    expect(saveOnboardingProfileMock).toHaveBeenCalledWith(account.storageKey, completeProfile);
  });

  it('reads migrated profile through the account actor and rejects the invalidated guest', async () => {
    const account = {
      kind: 'account' as const,
      accountId: 'student-one',
      storageKey: 'account:student-one',
    };
    resolveStudentActorMock.mockResolvedValueOnce(account);
    getOnboardingProfileMock.mockResolvedValueOnce(completeProfile);
    resolveStudentActorMock.mockResolvedValueOnce(null);

    const migratedResponse = await getOnboarding();
    const invalidatedGuestResponse = await getOnboarding();

    await expect(migratedResponse.json()).resolves.toEqual({ profile: completeProfile });
    expect(invalidatedGuestResponse.status).toBe(401);
    expect(getOnboardingProfileMock).toHaveBeenCalledWith(account.storageKey);
  });
});
