/** @jest-environment node */

import { NextResponse } from 'next/server';

const metrics = {
  feedInteractions: 1,
  simulationsCompleted: 2,
  referrals: 3,
  shares: 4,
  analyticsEvents: 5,
  memoryRecords: 6,
  boostedContent: 1,
  removedContent: 0,
  decisions: [],
};

describe('decision boundary', () => {
  let getDecisions: () => Promise<Response>;
  let AdminOpsPage: () => Promise<unknown>;
  let AdminFeedPage: () => Promise<unknown>;
  let requireActiveStaffMock: jest.SpyInstance;
  let getPlatformMetricsMock: jest.Mock;
  let runAndStoreDecisionsMock: jest.Mock;
  let notFoundMock: jest.Mock;

  beforeEach(async () => {
    jest.resetModules();
    jest.doMock('../../lib/server/active-staff', () => ({
      requireActiveStaff: jest.fn(),
    }));
    jest.doMock('../../lib/server/platform-store', () => ({
      getPlatformMetrics: jest.fn(),
      runAndStoreDecisions: jest.fn(),
    }));
    jest.doMock('next/navigation', () => ({
      notFound: jest.fn(() => {
        throw new Error('NEXT_NOT_FOUND');
      }),
    }));

    const activeStaff = require('../../lib/server/active-staff');
    const platformStore = require('../../lib/server/platform-store');
    const navigation = require('next/navigation');

    requireActiveStaffMock = activeStaff.requireActiveStaff;
    getPlatformMetricsMock = platformStore.getPlatformMetrics;
    runAndStoreDecisionsMock = platformStore.runAndStoreDecisions;
    notFoundMock = navigation.notFound;

    ({ GET: getDecisions } = require('../../app/api/decisions/route'));
    ({ default: AdminOpsPage } = require('../../app/admin/ops/page'));
    ({ default: AdminFeedPage } = require('../../app/admin/feed/page'));
    runAndStoreDecisionsMock.mockResolvedValue([]);
  });

  it('returns a safe disabled response without running or exposing decisions', async () => {
    const response = await getDecisions();

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Not found' });
    expect(runAndStoreDecisionsMock).not.toHaveBeenCalled();
    expect(getPlatformMetricsMock).not.toHaveBeenCalled();
  });

  it.each([
    ['removed staff member'],
    ['unauthenticated request'],
    ['malformed allowlist'],
  ])(
    'denies %s before either dashboard reads or mutates global metrics',
    async () => {
      requireActiveStaffMock.mockResolvedValue({
        ok: false,
        response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      });

      await expect(AdminOpsPage()).rejects.toThrow('NEXT_NOT_FOUND');
      await expect(AdminFeedPage()).rejects.toThrow('NEXT_NOT_FOUND');

      expect(getPlatformMetricsMock).not.toHaveBeenCalled();
      expect(runAndStoreDecisionsMock).not.toHaveBeenCalled();
      expect(notFoundMock).toHaveBeenCalledTimes(2);
    },
  );

  it('shows both dashboards only after current active-staff authorization', async () => {
    const events: string[] = [];
    requireActiveStaffMock.mockImplementation(async () => {
      events.push('authorized');
      return { ok: true, actor: { id: 'staff-account' } };
    });
    getPlatformMetricsMock.mockImplementation(async () => {
      events.push('metrics');
      return metrics;
    });

    await expect(AdminOpsPage()).resolves.toBeDefined();
    await expect(AdminFeedPage()).resolves.toBeDefined();

    expect(requireActiveStaffMock).toHaveBeenNthCalledWith(1, {
      action: 'view-operations-metrics',
      route: '/admin/ops',
    });
    expect(requireActiveStaffMock).toHaveBeenNthCalledWith(2, {
      action: 'view-feed-metrics',
      route: '/admin/feed',
    });
    expect(events).toEqual(['authorized', 'metrics', 'authorized', 'metrics']);
    expect(runAndStoreDecisionsMock).not.toHaveBeenCalled();
  });
});
