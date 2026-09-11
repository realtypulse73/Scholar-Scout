/** @jest-environment node */

import { GET, POST } from '@/app/api/admin/community-moderation/route';
import { requireActiveStaff } from '@/lib/server/active-staff';
import {
  listPendingReviewCampusNotes,
  removePendingReviewCampusNote,
  restorePendingReviewCampusNote,
} from '@/lib/server/operational-records';

jest.mock('@/lib/server/active-staff', () => ({ requireActiveStaff: jest.fn() }));
jest.mock('@/lib/server/operational-records', () => ({
  listPendingReviewCampusNotes: jest.fn(),
  removePendingReviewCampusNote: jest.fn(),
  restorePendingReviewCampusNote: jest.fn(),
}));

const pendingNote = {
  noteId: 'note-1',
  schoolSlug: 'buffalo-state',
  uploaderUsername: null,
  programId: null,
  excerpt: 'A safe staff-only excerpt.',
  reportedAt: '2026-08-29T12:00:00.000Z',
};

describe('community moderation API', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(requireActiveStaff).mockResolvedValue({
      ok: true,
      actor: { id: 'staff-1' },
    });
    jest.mocked(listPendingReviewCampusNotes).mockResolvedValue([pendingNote]);
    jest.mocked(restorePendingReviewCampusNote).mockResolvedValue({ status: 'restored' });
    jest.mocked(removePendingReviewCampusNote).mockResolvedValue({ status: 'removed' });
  });

  it('denies before reading pending records', async () => {
    const denial = new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    jest.mocked(requireActiveStaff).mockResolvedValue({ ok: false, response: denial } as never);

    const response = await GET();

    expect(response.status).toBe(403);
    expect(listPendingReviewCampusNotes).not.toHaveBeenCalled();
  });

  it('authorizes before returning only the staff-safe pending DTO', async () => {
    const response = await GET();
    const body = await response.json();

    expect(requireActiveStaff).toHaveBeenCalledWith({
      action: 'community-moderation:read',
      route: '/api/admin/community-moderation',
    });
    expect(listPendingReviewCampusNotes).toHaveBeenCalledWith();
    expect(body.records).toEqual([pendingNote]);
    expect(JSON.stringify(body)).not.toMatch(/author_id|reporter_id|sender_id/i);
  });

  it.each([
    ['restore', restorePendingReviewCampusNote, 'restored'],
    ['remove', removePendingReviewCampusNote, 'removed'],
  ])('uses the named pending-review operation for %s', async (action, operation, status) => {
    const response = await POST(new Request('http://localhost/api/admin/community-moderation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId: 'note-1', action }),
    }));

    expect(response.status).toBe(200);
    expect(operation).toHaveBeenCalledWith('note-1');
    await expect(response.json()).resolves.toEqual({ ok: true, status });
  });

  it('rejects invalid actions without resolving a record', async () => {
    const response = await POST(new Request('http://localhost/api/admin/community-moderation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId: 'note-1', action: 'publish' }),
    }));

    expect(response.status).toBe(400);
    expect(restorePendingReviewCampusNote).not.toHaveBeenCalled();
    expect(removePendingReviewCampusNote).not.toHaveBeenCalled();
  });

  it('returns a retryable conflict and leaves public reads untouched by removal', async () => {
    jest.mocked(removePendingReviewCampusNote).mockResolvedValue({ status: 'conflict' });

    const response = await POST(new Request('http://localhost/api/admin/community-moderation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId: 'note-1', action: 'remove' }),
    }));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: 'This note changed before it could be resolved. Refresh the queue and try again.',
    });
  });
});
