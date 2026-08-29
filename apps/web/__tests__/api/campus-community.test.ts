/** @jest-environment node */

import { getServerSession } from 'next-auth';
import { GET, POST } from '@/app/api/campus-notes/route';
import {
  createCampusNote,
  getCampusNotes,
} from '@/lib/server/data-store';
import { reserveCommunitySubmission } from '@/lib/server/rate-limit';

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/auth', () => ({ authOptions: {} }));
jest.mock('@/lib/platform', () => ({ creatorProfiles: [] }));
jest.mock('@/lib/server/data-store', () => ({
  createCampusNote: jest.fn(),
  getCampusNotes: jest.fn(),
}));
jest.mock('@/lib/server/rate-limit', () => ({
  reserveCommunitySubmission: jest.fn(),
}));

const storedNote = {
  id: 'note-1',
  author_id: 'student-private-id',
  school_slug: 'buffalo-state',
  uploader_username: null,
  program_id: null,
  body: 'Can anyone share what the first semester feels like?',
  created_at: '2026-08-29T12:00:00.000Z',
};

describe('campus community API safety boundary', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(getServerSession).mockResolvedValue({
      user: { id: 'student-session-id' },
    } as never);
    jest.mocked(reserveCommunitySubmission).mockResolvedValue({
      status: 'allowed',
      allowed: true,
      resetAt: new Date('2026-08-29T13:00:00.000Z'),
      retryAfterSeconds: 0,
    });
  });

  it('maps public reads to an author-safe DTO', async () => {
    jest.mocked(getCampusNotes).mockResolvedValue([storedNote] as never);

    const response = await GET(new Request('http://localhost/api/campus-notes?school=buffalo-state'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.notes).toEqual([expect.objectContaining({ id: 'note-1', body: storedNote.body })]);
    expect(JSON.stringify(body)).not.toMatch(/author_id|student-private-id|sender_id/i);
  });

  it('reserves session-keyed capacity before storing a valid safe note', async () => {
    jest.mocked(createCampusNote).mockResolvedValue(storedNote as never);

    const response = await POST(new Request('http://localhost/api/campus-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        school_slug: 'buffalo-state',
        uploader_username: null,
        program_id: null,
        body: storedNote.body,
        author_id: 'browser-supplied-id',
      }),
    }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(reserveCommunitySubmission).toHaveBeenCalledWith('student-session-id');
    expect(createCampusNote).toHaveBeenCalledWith(
      'student-session-id',
      expect.not.objectContaining({ author_id: expect.anything() }),
    );
    expect(JSON.stringify(body)).not.toMatch(/author_id|student-private-id|sender_id/i);
  });

  it.each([
    '',
    '   ',
    'x'.repeat(501),
    'Email me at student@example.org',
    'Call 716-555-0100',
  ])('rejects unsafe note input before reserving or writing: %p', async (body) => {
    const response = await POST(new Request('http://localhost/api/campus-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        school_slug: 'buffalo-state',
        uploader_username: null,
        program_id: null,
        body,
      }),
    }));

    expect(response.status).toBe(400);
    expect(reserveCommunitySubmission).not.toHaveBeenCalled();
    expect(createCampusNote).not.toHaveBeenCalled();
  });

  it.each([
    ['denied', 429],
    ['unavailable', 503],
  ] as const)('does not persist when the shared reservation is %s', async (status, expectedStatus) => {
    jest.mocked(reserveCommunitySubmission).mockResolvedValue({
      status,
      allowed: false,
      resetAt: status === 'denied' ? new Date('2026-08-29T13:00:00.000Z') : null,
      retryAfterSeconds: status === 'denied' ? 30 : null,
    } as never);

    const response = await POST(new Request('http://localhost/api/campus-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        school_slug: 'buffalo-state',
        uploader_username: null,
        program_id: null,
        body: storedNote.body,
      }),
    }));

    expect(response.status).toBe(expectedStatus);
    expect(createCampusNote).not.toHaveBeenCalled();
  });
});
