/** @jest-environment node */

import {
  GET,
  POST,
} from '@/app/api/account/qualifications/route';

jest.mock('../../lib/server/student-actor', () => ({
  resolveStudentActor: jest.fn(),
}));

jest.mock('../../lib/server/data-store', () => ({
  PersistenceConflictError: class PersistenceConflictError extends Error {},
  getQualificationRecord: jest.fn(),
  saveQualificationRecord: jest.fn(),
}));

const record = {
  structured: ['degree'],
  note: 'Completed an associate degree.',
  keywords: ['information technology'],
};

describe('account qualification routes', () => {
  const resolveStudentActorMock = jest.requireMock(
    '../../lib/server/student-actor',
  ).resolveStudentActor as jest.Mock;
  const getQualificationRecordMock = jest.requireMock(
    '../../lib/server/data-store',
  ).getQualificationRecord as jest.Mock;
  const saveQualificationRecordMock = jest.requireMock(
    '../../lib/server/data-store',
  ).saveQualificationRecord as jest.Mock;

  beforeEach(() => jest.resetAllMocks());

  it('uses the session-derived account key and rejects client ownership', async () => {
    const account = {
      kind: 'account' as const,
      accountId: 'student-one',
      storageKey: 'account:student-one',
    };
    resolveStudentActorMock.mockResolvedValue(account);
    getQualificationRecordMock.mockResolvedValue(record);

    const getResponse = await GET();
    const postResponse = await POST(
      new Request('https://scholar-scout.test/api/account/qualifications', {
        method: 'POST',
        body: JSON.stringify(record),
      }),
    );
    const forgedResponse = await POST(
      new Request('https://scholar-scout.test/api/account/qualifications', {
        method: 'POST',
        body: JSON.stringify({ ...record, storageKey: 'account:student-two' }),
      }),
    );

    await expect(getResponse.json()).resolves.toEqual({ record });
    expect(postResponse.status).toBe(200);
    expect(forgedResponse.status).toBe(400);
    expect(resolveStudentActorMock).toHaveBeenCalledWith({ allowGuest: false });
    expect(getQualificationRecordMock).toHaveBeenCalledWith(account.storageKey);
    expect(saveQualificationRecordMock).toHaveBeenCalledWith(account.storageKey, record);
  });
});
