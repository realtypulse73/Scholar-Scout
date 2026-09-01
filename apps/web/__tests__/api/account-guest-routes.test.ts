/** @jest-environment node */

import {
  GET as getOnboarding,
  POST as postOnboarding,
} from '@/app/api/account/onboarding/route';
import {
  GET as getShortlist,
  POST as postShortlist,
} from '@/app/api/account/shortlist/route';

jest.mock('../../lib/server/student-actor', () => ({
  resolveStudentActor: jest.fn(),
}));

jest.mock('../../lib/server/data-store', () => ({
  PersistenceConflictError: class PersistenceConflictError extends Error {},
  getOnboardingProfile: jest.fn(),
  saveOnboardingProfile: jest.fn(),
  getShortlist: jest.fn(),
  getShortlistPlans: jest.fn(),
  saveShortlist: jest.fn(),
  saveShortlistPlans: jest.fn(),
  saveShortlistState: jest.fn(),
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
  const getShortlistMock = jest.requireMock(
    '../../lib/server/data-store',
  ).getShortlist as jest.Mock;
  const getShortlistPlansMock = jest.requireMock(
    '../../lib/server/data-store',
  ).getShortlistPlans as jest.Mock;
  const saveShortlistMock = jest.requireMock(
    '../../lib/server/data-store',
  ).saveShortlist as jest.Mock;
  const saveShortlistPlansMock = jest.requireMock(
    '../../lib/server/data-store',
  ).saveShortlistPlans as jest.Mock;
  const saveShortlistStateMock = jest.requireMock(
    '../../lib/server/data-store',
  ).saveShortlistState as jest.Mock;

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

  it('keeps opaque guest shortlist collections isolated by their resolved actor keys', async () => {
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
    getShortlistMock.mockResolvedValueOnce(['north-valley-health']);
    getShortlistPlansMock.mockResolvedValueOnce({
      'north-valley-health': { status: 'contacted', note: 'Asked about aid.' },
    });
    resolveStudentActorMock.mockResolvedValueOnce(guestTwo);
    getShortlistMock.mockResolvedValueOnce([]);
    getShortlistPlansMock.mockResolvedValueOnce({});

    const firstResponse = await getShortlist();
    const secondResponse = await getShortlist();

    await expect(firstResponse.json()).resolves.toEqual({
      programmeIds: ['north-valley-health'],
      plans: { 'north-valley-health': { status: 'contacted', note: 'Asked about aid.' } },
    });
    await expect(secondResponse.json()).resolves.toEqual({ programmeIds: [], plans: {} });
    expect(getShortlistMock).toHaveBeenNthCalledWith(1, guestOne.storageKey);
    expect(getShortlistPlansMock).toHaveBeenNthCalledWith(2, guestTwo.storageKey);
  });

  it('accepts only bounded plans for the submitted shortlist and never accepts an owner field', async () => {
    const account = {
      kind: 'account' as const,
      accountId: 'student-one',
      storageKey: 'account:student-one',
    };
    const validBody = {
      programmeIds: ['north-valley-health'],
      plans: {
        'north-valley-health': {
          status: 'contacted',
          note: 'Asked about financial aid.',
        },
      },
    };
    resolveStudentActorMock.mockResolvedValue(account);

    const accepted = await postShortlist(
      new Request('https://scholar-scout.test/api/account/shortlist', {
        method: 'POST',
        body: JSON.stringify(validBody),
      }),
    );
    const selectedIdentity = await postShortlist(
      new Request('https://scholar-scout.test/api/account/shortlist', {
        method: 'POST',
        body: JSON.stringify({ ...validBody, guestId: 'guest-two' }),
      }),
    );
    const foreignPlan = await postShortlist(
      new Request('https://scholar-scout.test/api/account/shortlist', {
        method: 'POST',
        body: JSON.stringify({
          ...validBody,
          plans: { 'another-programme': validBody.plans['north-valley-health'] },
        }),
      }),
    );
    const invalidStatus = await postShortlist(
      new Request('https://scholar-scout.test/api/account/shortlist', {
        method: 'POST',
        body: JSON.stringify({
          ...validBody,
          plans: {
            'north-valley-health': { status: 'unknown', note: '' },
          },
        }),
      }),
    );
    const nonStringId = await postShortlist(
      new Request('https://scholar-scout.test/api/account/shortlist', {
        method: 'POST',
        body: JSON.stringify({ programmeIds: [123], plans: {} }),
      }),
    );
    const excessiveCollection = await postShortlist(
      new Request('https://scholar-scout.test/api/account/shortlist', {
        method: 'POST',
        body: JSON.stringify({
          programmeIds: Array.from({ length: 101 }, (_, index) => `programme-${index}`),
          plans: {},
        }),
      }),
    );
    const oversizedNote = await postShortlist(
      new Request('https://scholar-scout.test/api/account/shortlist', {
        method: 'POST',
        body: JSON.stringify({
          ...validBody,
          plans: {
            'north-valley-health': { status: 'considering', note: 'x'.repeat(501) },
          },
        }),
      }),
    );
    const malformed = await postShortlist(
      new Request('https://scholar-scout.test/api/account/shortlist', {
        method: 'POST',
        body: '{',
      }),
    );
    const oversized = await postShortlist(
      new Request('https://scholar-scout.test/api/account/shortlist', {
        method: 'POST',
        headers: { 'content-length': '20000' },
        body: JSON.stringify(validBody),
      }),
    );

    expect(accepted.status).toBe(200);
    expect(selectedIdentity.status).toBe(400);
    expect(foreignPlan.status).toBe(400);
    expect(invalidStatus.status).toBe(400);
    expect(nonStringId.status).toBe(400);
    expect(excessiveCollection.status).toBe(400);
    expect(oversizedNote.status).toBe(400);
    expect(malformed.status).toBe(400);
    expect(oversized.status).toBe(413);
    expect(saveShortlistStateMock).toHaveBeenCalledTimes(1);
    expect(saveShortlistStateMock).toHaveBeenCalledWith(
      account.storageKey,
      validBody.programmeIds,
      validBody.plans,
    );
    expect(saveShortlistMock).not.toHaveBeenCalled();
    expect(saveShortlistPlansMock).not.toHaveBeenCalled();
  });

  it('returns a safe reload conflict without exposing stored student state', async () => {
    const account = {
      kind: 'account' as const,
      accountId: 'student-one',
      storageKey: 'account:student-one',
    };
    const { PersistenceConflictError } = jest.requireMock(
      '../../lib/server/data-store',
    );
    resolveStudentActorMock.mockResolvedValue(account);
    saveOnboardingProfileMock.mockRejectedValueOnce(new PersistenceConflictError());
    saveShortlistStateMock.mockRejectedValueOnce(new PersistenceConflictError());

    const onboardingResponse = await postOnboarding(
      new Request('https://scholar-scout.test/api/account/onboarding', {
        method: 'POST',
        body: JSON.stringify(completeProfile),
      }),
    );
    const shortlistResponse = await postShortlist(
      new Request('https://scholar-scout.test/api/account/shortlist', {
        method: 'POST',
        body: JSON.stringify({ programmeIds: [], plans: {} }),
      }),
    );

    expect(onboardingResponse.status).toBe(409);
    expect(shortlistResponse.status).toBe(409);
    const onboardingBody = await onboardingResponse.json();
    const shortlistBody = await shortlistResponse.json();

    expect(onboardingBody).toEqual({
      error: 'Student data changed. Reload and try again.',
      category: 'conflict',
      action: 'reload',
    });
    expect(shortlistBody).toEqual({
      error: 'Student data changed. Reload and try again.',
      category: 'conflict',
      action: 'reload',
    });
    expect(JSON.stringify(onboardingBody)).not.toMatch(
      /account:student-one|guest:|student-two|profile/i,
    );
    expect(JSON.stringify(shortlistBody)).not.toMatch(
      /account:student-one|guest:|student-two|programmeIds|plans/i,
    );
  });

  it('reads migrated shortlist activity through the account and rejects the invalidated guest', async () => {
    const account = {
      kind: 'account' as const,
      accountId: 'student-one',
      storageKey: 'account:student-one',
    };
    resolveStudentActorMock.mockResolvedValueOnce(account);
    getShortlistMock.mockResolvedValueOnce(['north-valley-health']);
    getShortlistPlansMock.mockResolvedValueOnce({
      'north-valley-health': { status: 'ready-to-apply', note: 'Complete application.' },
    });
    resolveStudentActorMock.mockResolvedValueOnce(null);

    const migratedResponse = await getShortlist();
    const invalidatedGuestResponse = await getShortlist();

    await expect(migratedResponse.json()).resolves.toEqual({
      programmeIds: ['north-valley-health'],
      plans: {
        'north-valley-health': { status: 'ready-to-apply', note: 'Complete application.' },
      },
    });
    expect(invalidatedGuestResponse.status).toBe(401);
    expect(getShortlistMock).toHaveBeenCalledWith(account.storageKey);
    expect(getShortlistPlansMock).toHaveBeenCalledWith(account.storageKey);
  });
});
