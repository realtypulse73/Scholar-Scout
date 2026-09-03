/** @jest-environment node */

import { getServerSession } from 'next-auth';
import { GET, POST } from '@/app/api/campus-notes/route';
import { POST as reportNote } from '@/app/api/campus-notes/[id]/report/route';
import { POST as createPeerConnection } from '@/app/api/peer-connections/route';
import {
  createCampusNote,
  createUploaderInboxRequest,
  getCampusNotes,
} from '@/lib/server/data-store';
import { reserveCommunitySubmission } from '@/lib/server/rate-limit';
import { reportCampusNoteForReview } from '@/lib/server/operational-records';

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/auth', () => ({ authOptions: {} }));
jest.mock('@/lib/platform', () => ({
  creatorProfiles: [{
    username: 'maya-health',
    programmeId: 'north-valley-health',
    inboxEnabled: true,
  }],
}));
jest.mock('@/lib/server/data-store', () => ({
  createCampusNote: jest.fn(),
  createUploaderInboxRequest: jest.fn(),
  getCampusNotes: jest.fn(),
  PersistenceConflictError: class PersistenceConflictError extends Error {},
}));
jest.mock('@/lib/server/rate-limit', () => ({
  reserveCommunitySubmission: jest.fn(),
}));
jest.mock('@/lib/server/operational-records', () => ({
  reportCampusNoteForReview: jest.fn(),
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

const storedInboxRequest = {
  id: 'inbox-1',
  sender_id: 'student-private-id',
  uploader_username: 'maya-health',
  program_id: 'north-valley-health',
  body: 'What helped you choose this programme?',
  status: 'pending',
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
    jest.mocked(reportCampusNoteForReview).mockResolvedValue({ status: 'reported' });
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

  it('reserves session-keyed shared capacity before creating an inbox request and returns a public DTO', async () => {
    jest.mocked(createUploaderInboxRequest).mockResolvedValue(storedInboxRequest as never);

    const response = await createPeerConnection(new Request('http://localhost/api/peer-connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...storedInboxRequest,
        sender_id: 'browser-supplied-id',
      }),
    }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(reserveCommunitySubmission).toHaveBeenCalledWith('student-session-id');
    expect(createUploaderInboxRequest).toHaveBeenCalledWith(
      'student-session-id',
      expect.not.objectContaining({ sender_id: expect.anything() }),
    );
    expect(body.request).toEqual({
      id: 'inbox-1',
      uploader_username: 'maya-health',
      program_id: 'north-valley-health',
      body: storedInboxRequest.body,
      status: 'pending',
      created_at: storedInboxRequest.created_at,
    });
    expect(JSON.stringify(body)).not.toMatch(/sender_id|student-private-id|contact/i);
  });

  it.each([
    ['denied', 429],
    ['unavailable', 503],
  ] as const)('does not create an inbox request when the shared reservation is %s', async (status, expectedStatus) => {
    jest.mocked(reserveCommunitySubmission).mockResolvedValue({
      status,
      allowed: false,
      resetAt: status === 'denied' ? new Date('2026-08-29T13:00:00.000Z') : null,
      retryAfterSeconds: status === 'denied' ? 30 : null,
    } as never);

    const response = await createPeerConnection(new Request('http://localhost/api/peer-connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploader_username: 'maya-health',
        program_id: 'north-valley-health',
        body: storedInboxRequest.body,
      }),
    }));

    expect(response.status).toBe(expectedStatus);
    expect(createUploaderInboxRequest).not.toHaveBeenCalled();
  });

  it('rejects invalid inbox input before consuming a reservation or creating a request', async () => {
    const response = await createPeerConnection(new Request('http://localhost/api/peer-connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploader_username: 'maya-health',
        program_id: 'north-valley-health',
        body: 'Email me at student@example.org',
      }),
    }));

    expect(response.status).toBe(400);
    expect(reserveCommunitySubmission).not.toHaveBeenCalled();
    expect(createUploaderInboxRequest).not.toHaveBeenCalled();
  });

  it('does not expose internal inbox write failures to the browser', async () => {
    jest.mocked(createUploaderInboxRequest).mockRejectedValue(
      new Error('Missing SCHOLARSCOUT_DATA_SERVICE_TOKEN for the http adapter'),
    );

    const response = await createPeerConnection(new Request('http://localhost/api/peer-connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploader_username: 'maya-health',
        program_id: 'north-valley-health',
        body: storedInboxRequest.body,
      }),
    }));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: 'Inbox requests are temporarily unavailable. Please try again later.',
    });
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

  it('derives a report actor solely from the session and gives duplicate-safe private confirmation', async () => {
    const response = await reportNote(
      new Request('http://localhost/api/campus-notes/note-1/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reporterId: 'browser-supplied-id', role: 'staff', decision: 'remove' }),
      }),
      { params: Promise.resolve({ id: 'note-1' }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(reportCampusNoteForReview).toHaveBeenCalledWith({
      noteId: 'note-1',
      reporterId: 'student-session-id',
    });
    expect(body).toEqual({
      ok: true,
      message: 'Thanks. This note is no longer shown publicly while it is reviewed.',
    });
  });

  it('does not confirm a report when the moderation transition conflicts', async () => {
    jest.mocked(reportCampusNoteForReview).mockResolvedValue({ status: 'conflict' });

    const response = await reportNote(
      new Request('http://localhost/api/campus-notes/note-1/report', { method: 'POST' }),
      { params: Promise.resolve({ id: 'note-1' }) },
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: 'This note changed before it could be reported. Refresh and try again.',
    });
  });

  it('requires a signed-in session before reporting', async () => {
    jest.mocked(getServerSession).mockResolvedValue(null);

    const response = await reportNote(
      new Request('http://localhost/api/campus-notes/note-1/report', { method: 'POST' }),
      { params: Promise.resolve({ id: 'note-1' }) },
    );

    expect(response.status).toBe(401);
    expect(reportCampusNoteForReview).not.toHaveBeenCalled();
  });
});
