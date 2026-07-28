/** @jest-environment node */

import * as feedEventsRoute from '@/app/api/feed-events/route';
import * as referralsRoute from '@/app/api/referrals/route';
import * as shareRoute from '@/app/api/share/route';
import * as assignRoute from '@/app/api/ab-testing/assign/route';

jest.mock('../../lib/server/student-actor', () => ({
  resolveStudentActor: jest.fn(),
}));

jest.mock('../../lib/server/platform-store', () => ({
  appendAnalyticsEvent: jest.fn(),
  appendFeedInteraction: jest.fn(),
  createReferral: jest.fn(),
  readPlatformData: jest.fn(),
  trackShare: jest.fn(),
}));

jest.mock('../../lib/platform', () => ({
  assignVariant: jest.fn(),
  feedItems: [
    {
      id: 'feed-health-day',
      durationSeconds: 48,
    },
  ],
}));

const accountActor = {
  kind: 'account' as const,
  accountId: 'student-one',
  storageKey: 'account:student-one',
};

describe('engagement route ownership', () => {
  const resolveStudentActorMock = jest.requireMock(
    '../../lib/server/student-actor',
  ).resolveStudentActor as jest.Mock;
  const appendAnalyticsEventMock = jest.requireMock(
    '../../lib/server/platform-store',
  ).appendAnalyticsEvent as jest.Mock;
  const appendFeedInteractionMock = jest.requireMock(
    '../../lib/server/platform-store',
  ).appendFeedInteraction as jest.Mock;
  const createReferralMock = jest.requireMock(
    '../../lib/server/platform-store',
  ).createReferral as jest.Mock;
  const readPlatformDataMock = jest.requireMock(
    '../../lib/server/platform-store',
  ).readPlatformData as jest.Mock;
  const trackShareMock = jest.requireMock(
    '../../lib/server/platform-store',
  ).trackShare as jest.Mock;
  const assignVariantMock = jest.requireMock('../../lib/platform')
    .assignVariant as jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
    resolveStudentActorMock.mockResolvedValue(accountActor);
  });

  it('lists and creates referrals only for the resolved actor', async () => {
    readPlatformDataMock.mockResolvedValue({
      referralRecords: [
        { id: 'own', referrer: accountActor.storageKey },
        { id: 'foreign', referrer: 'account:student-two' },
      ],
    });
    createReferralMock.mockResolvedValue({ id: 'referral', code: 'own-code' });
    appendAnalyticsEventMock.mockResolvedValue({ id: 'event' });

    const getResponse = await referralsRoute.GET();
    const postResponse = await referralsRoute.POST(
      new Request('https://scholar-scout.test/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );

    expect(getResponse.status).toBe(200);
    expect(await getResponse.json()).toEqual({
      referrals: [{ id: 'own', referrer: accountActor.storageKey }],
    });
    expect(postResponse.status).toBe(200);
    expect(createReferralMock).toHaveBeenCalledWith(accountActor.storageKey);
    expect(appendAnalyticsEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        area: 'referral',
        userKey: accountActor.storageKey,
      }),
    );
  });

  it('uses only the resolved actor and bounded feed event input', async () => {
    appendFeedInteractionMock.mockResolvedValue({ id: 'interaction' });
    appendAnalyticsEventMock.mockResolvedValue({ id: 'event' });

    const response = await feedEventsRoute.POST(
      new Request('https://scholar-scout.test/api/feed-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedItemId: 'feed-health-day',
          eventType: 'watch',
          watchSeconds: 24,
        }),
      }),
    );
    const forgedIdentity = await feedEventsRoute.POST(
      new Request('https://scholar-scout.test/api/feed-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userKey: 'account:student-two',
          feedItemId: 'feed-health-day',
          eventType: 'watch',
          watchSeconds: 24,
        }),
      }),
    );
    const malformed = await feedEventsRoute.POST(
      new Request('https://scholar-scout.test/api/feed-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedItemId: 'unknown-feed',
          eventType: 'watch',
          watchSeconds: -1,
          metadata: { forged: true },
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(appendFeedInteractionMock).toHaveBeenCalledWith({
      userKey: accountActor.storageKey,
      feedItemId: 'feed-health-day',
      watchSeconds: 24,
      skipped: false,
    });
    expect(appendAnalyticsEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ userKey: accountActor.storageKey }),
    );
    expect(forgedIdentity.status).toBe(400);
    expect(malformed.status).toBe(400);
  });
});
