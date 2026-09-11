/** @jest-environment node */

import { POST } from '@/app/api/peer-connections/route';

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/auth', () => ({ authOptions: {} }));
jest.mock('@/lib/server/data-store', () => ({ createUploaderInboxRequest: jest.fn() }));
jest.mock('@/lib/server/rate-limit', () => ({ reserveCommunitySubmission: jest.fn() }));

const getServerSessionMock = jest.requireMock('next-auth').getServerSession as jest.Mock;
const createUploaderInboxRequestMock = jest.requireMock('@/lib/server/data-store').createUploaderInboxRequest as jest.Mock;
const reserveCommunitySubmissionMock = jest.requireMock('@/lib/server/rate-limit')
  .reserveCommunitySubmission as jest.Mock;

describe('peer inbox submission outage boundary', () => {
  const originalVercelEnvironment = process.env.VERCEL_ENV;
  const originalOutage = process.env.SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE;

  beforeEach(() => {
    jest.resetAllMocks();
    getServerSessionMock.mockResolvedValue({ user: { id: 'student-one' } });
    reserveCommunitySubmissionMock.mockResolvedValue({ status: 'allowed' });
    delete process.env.VERCEL_ENV;
    delete process.env.SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE;
  });

  afterEach(() => {
    if (originalVercelEnvironment === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = originalVercelEnvironment;
    if (originalOutage === undefined) delete process.env.SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE;
    else process.env.SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE = originalOutage;
  });

  it('fails closed before creating an inbox request for the Preview-only provider outage rehearsal', async () => {
    process.env.VERCEL_ENV = 'preview';
    process.env.SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE = '1';
    reserveCommunitySubmissionMock.mockResolvedValue({ status: 'unavailable' });

    const response = await POST(new Request('https://scholar-scout.test/api/peer-connections', {
      method: 'POST',
      body: JSON.stringify({ uploader_username: 'maya-health', program_id: 'north-valley-health', body: 'What helped you prepare for labs?' }),
    }));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: 'Community submissions are not available right now. Please try again shortly.',
    });
    expect(createUploaderInboxRequestMock).not.toHaveBeenCalled();
  });

  it('does not activate the Preview-only outage switch outside Preview', async () => {
    process.env.VERCEL_ENV = 'development';
    process.env.SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE = '1';
    createUploaderInboxRequestMock.mockResolvedValue({ id: 'request-one' });

    const response = await POST(new Request('https://scholar-scout.test/api/peer-connections', {
      method: 'POST',
      body: JSON.stringify({ uploader_username: 'maya-health', program_id: 'north-valley-health', body: 'What helped you prepare for labs?' }),
    }));

    expect(response.status).toBe(201);
    expect(createUploaderInboxRequestMock).toHaveBeenCalledWith('student-one', expect.any(Object));
  });
});
