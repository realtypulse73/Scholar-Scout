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

  it('denies anonymous and guest actors without reading or writing a record', async () => {
    resolveStudentActorMock.mockResolvedValueOnce(null).mockResolvedValueOnce({
      kind: 'guest',
      guestId: 'guest-one',
      storageKey: 'guest:guest-one',
    });

    const anonymousResponse = await GET();
    const guestResponse = await POST(
      new Request('https://scholar-scout.test/api/account/qualifications', {
        method: 'POST',
        body: JSON.stringify(record),
      }),
    );

    expect(anonymousResponse.status).toBe(401);
    expect(guestResponse.status).toBe(401);
    expect(getQualificationRecordMock).not.toHaveBeenCalled();
    expect(saveQualificationRecordMock).not.toHaveBeenCalled();
  });

  it('returns a safe conflict response without replacing the account record', async () => {
    const { PersistenceConflictError } = jest.requireMock(
      '../../lib/server/data-store',
    );
    resolveStudentActorMock.mockResolvedValue({
      kind: 'account',
      accountId: 'student-one',
      storageKey: 'account:student-one',
    });
    saveQualificationRecordMock.mockRejectedValue(new PersistenceConflictError());

    const response = await POST(
      new Request('https://scholar-scout.test/api/account/qualifications', {
        method: 'POST',
        body: JSON.stringify(record),
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: 'Student data changed. Reload and try again.',
      category: 'conflict',
      action: 'reload',
    });
  });

  it('rejects oversized payloads before persistence', async () => {
    resolveStudentActorMock.mockResolvedValue({
      kind: 'account',
      accountId: 'student-one',
      storageKey: 'account:student-one',
    });

    const response = await POST(
      new Request('https://scholar-scout.test/api/account/qualifications', {
        method: 'POST',
        body: JSON.stringify({ ...record, note: 'x'.repeat(5_000) }),
      }),
    );

    expect(response.status).toBe(413);
    expect(saveQualificationRecordMock).not.toHaveBeenCalled();
  });
});
