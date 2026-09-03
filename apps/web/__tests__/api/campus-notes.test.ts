/** @jest-environment node */

import { getServerSession } from 'next-auth';
import { POST } from '@/app/api/campus-notes/route';
import { createCampusNote } from '@/lib/server/data-store';
import { setAtomicReservationLimiterForTests } from '@/lib/server/rate-limit';

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/auth', () => ({ authOptions: {} }));
jest.mock('@/lib/platform', () => ({ creatorProfiles: [] }));
jest.mock('@/lib/server/data-store', () => ({ createCampusNote: jest.fn() }));

const originalEnvironment = {
  outage: process.env.SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE,
  vercel: process.env.VERCEL_ENV,
};

function campusNoteRequest(): Request {
  return new Request('https://scholar-scout.test/api/campus-notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      school_slug: 'buffalo-state',
      uploader_username: null,
      program_id: null,
      body: 'What helped you find your first campus resources?',
    }),
  });
}

describe('campus-note Preview community outage boundary', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(getServerSession).mockResolvedValue({ user: { id: 'student-session-id' } } as never);
    setAtomicReservationLimiterForTests({
      reserve: jest.fn().mockResolvedValue({
        allowed: true,
        resetAt: new Date('2026-09-01T00:00:00.000Z'),
        retryAfterSeconds: 0,
      }),
    });
  });

  afterEach(() => {
    setAtomicReservationLimiterForTests(null);
    if (originalEnvironment.vercel === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = originalEnvironment.vercel;
    if (originalEnvironment.outage === undefined) delete process.env.SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE;
    else process.env.SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE = originalEnvironment.outage;
  });

  it('returns the safe Preview outage category before a campus-note write', async () => {
    process.env.VERCEL_ENV = 'preview';
    process.env.SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE = '1';

    const response = await POST(campusNoteRequest());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({ error: 'Community submissions are temporarily unavailable.' });
    expect(JSON.stringify(body)).not.toMatch(/limit|provider|remaining|upstash/i);
    expect(createCampusNote).not.toHaveBeenCalled();
  });

  it('ignores the isolated outage switch outside Preview', async () => {
    process.env.VERCEL_ENV = 'development';
    process.env.SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE = '1';
    jest.mocked(createCampusNote).mockResolvedValue({
      id: 'note-1', author_id: 'student-session-id', school_slug: 'buffalo-state',
      uploader_username: null, program_id: null, body: 'What helped you find your first campus resources?',
      created_at: '2026-09-01T00:00:00.000Z',
    } as never);

    const response = await POST(campusNoteRequest());

    expect(response.status).toBe(201);
    expect(createCampusNote).toHaveBeenCalledWith('student-session-id', expect.any(Object));
  });
});
