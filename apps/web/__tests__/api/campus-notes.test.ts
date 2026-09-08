/** @jest-environment node */

import { POST } from '@/app/api/campus-notes/route';

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/auth', () => ({ authOptions: {} }));
jest.mock('@/lib/server/data-store', () => ({ createCampusNote: jest.fn(), getCampusNotes: jest.fn() }));

const getServerSessionMock = jest.requireMock('next-auth').getServerSession as jest.Mock;
const createCampusNoteMock = jest.requireMock('@/lib/server/data-store').createCampusNote as jest.Mock;

describe('campus note submission outage boundary', () => {
  const originalVercelEnvironment = process.env.VERCEL_ENV;
  const originalOutage = process.env.SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE;

  beforeEach(() => {
    jest.resetAllMocks();
    getServerSessionMock.mockResolvedValue({ user: { id: 'student-one' } });
    delete process.env.VERCEL_ENV;
    delete process.env.SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE;
  });

  afterEach(() => {
    if (originalVercelEnvironment === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = originalVercelEnvironment;
    if (originalOutage === undefined) delete process.env.SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE;
    else process.env.SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE = originalOutage;
  });

  it('fails closed before creating a note for the Preview-only provider outage rehearsal', async () => {
    process.env.VERCEL_ENV = 'preview';
    process.env.SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE = '1';

    const response = await POST(new Request('https://scholar-scout.test/api/campus-notes', {
      method: 'POST',
      body: JSON.stringify({ school_slug: 'north-valley-college', uploader_username: null, program_id: null, body: 'Can anyone share a study tip?' }),
    }));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: 'Community submissions are not available right now. Please try again shortly.',
    });
    expect(createCampusNoteMock).not.toHaveBeenCalled();
  });

  it('does not activate the Preview-only outage switch outside Preview', async () => {
    process.env.VERCEL_ENV = 'production';
    process.env.SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE = '1';
    createCampusNoteMock.mockResolvedValue({ id: 'note-one' });

    const response = await POST(new Request('https://scholar-scout.test/api/campus-notes', {
      method: 'POST',
      body: JSON.stringify({ school_slug: 'north-valley-college', uploader_username: null, program_id: null, body: 'Can anyone share a study tip?' }),
    }));

    expect(response.status).toBe(201);
    expect(createCampusNoteMock).toHaveBeenCalledWith('student-one', expect.any(Object));
  });
});
