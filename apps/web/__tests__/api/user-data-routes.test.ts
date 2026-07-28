/** @jest-environment node */

import * as analyticsEventsRoute from '@/app/api/analytics/events/route';
import { GET as getMemoryRoute, POST as postMemoryRoute } from '@/app/api/memory/route';
import {
  GET as getSimulationResultsRoute,
  POST as postSimulationResultsRoute,
} from '@/app/api/simulations/results/route';

jest.mock('../../lib/server/student-actor', () => ({
  resolveStudentActor: jest.fn(),
}));

jest.mock('../../lib/server/platform-store', () => ({
  appendAnalyticsEvent: jest.fn(),
  getMemory: jest.fn(),
  getRecommendationsForUser: jest.fn(),
  readPlatformData: jest.fn(),
  saveSimulationResult: jest.fn(),
  updateMemory: jest.fn(),
}));

const accountActor = {
  kind: 'account' as const,
  accountId: 'student-one',
  storageKey: 'account:student-one',
};

describe('user data route ownership', () => {
  const resolveStudentActorMock = jest.requireMock(
    '../../lib/server/student-actor',
  ).resolveStudentActor as jest.Mock;
  const getMemoryMock = jest.requireMock(
    '../../lib/server/platform-store',
  ).getMemory as jest.Mock;
  const updateMemoryMock = jest.requireMock(
    '../../lib/server/platform-store',
  ).updateMemory as jest.Mock;
  const readPlatformDataMock = jest.requireMock(
    '../../lib/server/platform-store',
  ).readPlatformData as jest.Mock;
  const saveSimulationResultMock = jest.requireMock(
    '../../lib/server/platform-store',
  ).saveSimulationResult as jest.Mock;
  const getRecommendationsForUserMock = jest.requireMock(
    '../../lib/server/platform-store',
  ).getRecommendationsForUser as jest.Mock;
  const appendAnalyticsEventMock = jest.requireMock(
    '../../lib/server/platform-store',
  ).appendAnalyticsEvent as jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
    resolveStudentActorMock.mockResolvedValue(accountActor);
  });

  it('uses only the resolved actor key for memory reads and writes', async () => {
    getMemoryMock.mockResolvedValue({ id: 'memory', userKey: accountActor.storageKey } as never);
    updateMemoryMock.mockResolvedValue({ id: 'memory', userKey: accountActor.storageKey } as never);

    const getResponse = await getMemoryRoute(
      new Request('https://scholar-scout.test/api/memory?userKey=account:student-two'),
    );
    const postResponse = await postMemoryRoute(
      new Request('https://scholar-scout.test/api/memory', {
        method: 'POST',
      }),
    );

    expect(getResponse.status).toBe(200);
    expect(postResponse.status).toBe(200);
    expect(getMemoryMock).toHaveBeenCalledWith(accountActor.storageKey);
    expect(updateMemoryMock).toHaveBeenCalledWith(accountActor.storageKey);
    expect(getMemoryMock).not.toHaveBeenCalledWith('account:student-two');
    expect(updateMemoryMock).not.toHaveBeenCalledWith('account:student-two');
  });

  it('uses only the resolved actor key for simulation reads and result writes', async () => {
    readPlatformDataMock.mockResolvedValue({
      simulationResults: [
        { id: 'own', userKey: accountActor.storageKey },
        { id: 'foreign', userKey: 'account:student-two' },
      ],
    } as never);
    saveSimulationResultMock.mockResolvedValue({
      id: 'result',
      clarityScore: 75,
    } as never);
    getRecommendationsForUserMock.mockResolvedValue([]);
    appendAnalyticsEventMock.mockResolvedValue({ id: 'event' } as never);

    const getResponse = await getSimulationResultsRoute(
      new Request('https://scholar-scout.test/api/simulations/results?userKey=account:student-two'),
    );
    const postResponse = await postSimulationResultsRoute(
      new Request('https://scholar-scout.test/api/simulations/results', {
        method: 'POST',
        body: JSON.stringify({
          simulationId: 'career-fit-lab',
          answers: [
            { scenarioId: 'daily-work', choiceId: 'people-care' },
            { scenarioId: 'pressure', choiceId: 'mentor' },
          ],
        }),
      }),
    );

    await expect(getResponse.json()).resolves.toEqual({
      results: [{ id: 'own', userKey: accountActor.storageKey }],
    });
    expect(postResponse.status).toBe(200);
    expect(saveSimulationResultMock).toHaveBeenCalledWith(
      expect.objectContaining({ userKey: accountActor.storageKey }),
    );
    expect(getRecommendationsForUserMock).toHaveBeenCalledWith(accountActor.storageKey);
    expect(appendAnalyticsEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ userKey: accountActor.storageKey }),
    );
    expect(saveSimulationResultMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ userKey: 'account:student-two' }),
    );
  });

  it('rejects invalid simulation identifiers and answers before store writes', async () => {
    const invalidSimulation = await postSimulationResultsRoute(
      new Request('https://scholar-scout.test/api/simulations/results', {
        method: 'POST',
        body: JSON.stringify({ simulationId: 'unknown', answers: [] }),
      }),
    );
    const invalidAnswer = await postSimulationResultsRoute(
      new Request('https://scholar-scout.test/api/simulations/results', {
        method: 'POST',
        body: JSON.stringify({
          simulationId: 'career-fit-lab',
          answers: [{ scenarioId: 'daily-work', choiceId: 'unknown' }],
        }),
      }),
    );
    const suppliedIdentity = await postSimulationResultsRoute(
      new Request('https://scholar-scout.test/api/simulations/results', {
        method: 'POST',
        body: JSON.stringify({
          userKey: 'account:student-two',
          simulationId: 'career-fit-lab',
          answers: [],
        }),
      }),
    );

    expect(invalidSimulation.status).toBe(400);
    expect(invalidAnswer.status).toBe(400);
    expect(suppliedIdentity.status).toBe(400);
    expect(saveSimulationResultMock).not.toHaveBeenCalled();
    expect(getRecommendationsForUserMock).not.toHaveBeenCalled();
    expect(appendAnalyticsEventMock).not.toHaveBeenCalled();
  });

  it('stores bounded analytics events only for the resolved actor and exposes no global GET', async () => {
    appendAnalyticsEventMock.mockResolvedValue({
      id: 'event',
      userKey: accountActor.storageKey,
    } as never);

    const response = await analyticsEventsRoute.POST(
      new Request('https://scholar-scout.test/api/analytics/events', {
        method: 'POST',
        body: JSON.stringify({
          area: 'simulation',
          name: 'simulation_completed',
          metadata: { clarityScore: 75 },
        }),
      }),
    );
    const suppliedIdentity = await analyticsEventsRoute.POST(
      new Request('https://scholar-scout.test/api/analytics/events', {
        method: 'POST',
        body: JSON.stringify({
          area: 'simulation',
          name: 'simulation_completed',
          userKey: 'account:student-two',
        }),
      }),
    );
    const invalidMetadata = await analyticsEventsRoute.POST(
      new Request('https://scholar-scout.test/api/analytics/events', {
        method: 'POST',
        body: JSON.stringify({
          area: 'unknown',
          name: 'x'.repeat(65),
          metadata: { nested: { value: 'not-a-scalar' } },
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(appendAnalyticsEventMock).toHaveBeenCalledWith({
      area: 'simulation',
      name: 'simulation_completed',
      userKey: accountActor.storageKey,
      metadata: { clarityScore: 75 },
    });
    expect(suppliedIdentity.status).toBe(400);
    expect(invalidMetadata.status).toBe(400);
    expect(analyticsEventsRoute.GET).toBeUndefined();
    expect(appendAnalyticsEventMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ userKey: 'account:student-two' }),
    );
  });
});
