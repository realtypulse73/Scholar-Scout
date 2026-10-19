/** @jest-environment node */

import { GET, POST } from '@/app/api/admin/contributor-media/preview-demo/route';
import { GET as getLink, POST as postLink } from '@/app/api/admin/contributor-media/preview-demo/link/route';
import { requireActiveStaff } from '@/lib/server/active-staff';
import {
  getPreviewOwnerMediaReconciliation,
  grantContributorMediaInvitation,
  reconcilePreviewOwnerMedia,
} from '@/lib/server/contributor-media';
import { isPreviewOwnerMediaDemoActor } from '@/lib/server/preview-owner-media-demo';

jest.mock('@/lib/server/active-staff', () => ({ requireActiveStaff: jest.fn() }));
jest.mock('@/lib/server/contributor-media', () => ({
  grantContributorMediaInvitation: jest.fn(),
  getPreviewOwnerMediaReconciliation: jest.fn(),
  reconcilePreviewOwnerMedia: jest.fn(),
}));
jest.mock('@/lib/server/preview-owner-media-demo', () => ({ isPreviewOwnerMediaDemoActor: jest.fn() }));

const owner = {
  id: 'owner-1',
  email: 'owner@example.com',
  capabilities: new Set(['editor', 'reviewer', 'administrator'] as const),
};

describe('Preview owner media demo route', () => {
  beforeEach(() => {
    jest.mocked(requireActiveStaff).mockResolvedValue({ ok: true, actor: owner } as never);
    jest.mocked(isPreviewOwnerMediaDemoActor).mockReturnValue(true);
    jest.mocked(grantContributorMediaInvitation).mockResolvedValue({
      status: 'applied',
      value: { status: 'granted', invitation: { accountId: owner.id } },
    } as never);
    jest.mocked(getPreviewOwnerMediaReconciliation).mockResolvedValue({
      submissionId: 'submission-1', expectedRevision: 3, programmeId: 'legacy-programme-id',
      candidates: [{ id: 'candidate-htu', title: 'Houston Tillotson University' }],
    });
    jest.mocked(reconcilePreviewOwnerMedia).mockResolvedValue({
      status: 'applied',
      value: { status: 'linked', submission: { status: 'Ready for review', revision: 4 } },
    } as never);
  });

  afterEach(() => jest.resetAllMocks());

  it('exposes only server-derived availability to the configured owner', async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ available: true });
    expect(requireActiveStaff).toHaveBeenCalledWith(expect.objectContaining({ capability: 'administrator' }));
    expect(isPreviewOwnerMediaDemoActor).toHaveBeenCalledWith(owner);
  });

  it('derives the self-invitation from the trusted actor and ignores browser-provided properties', async () => {
    const response = await POST(new Request('http://localhost/api/admin/contributor-media/preview-demo', {
      method: 'POST',
      body: JSON.stringify({ accountId: 'different-account', demo: false, asset: 'private-object-key' }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'ready' });
    expect(grantContributorMediaInvitation).toHaveBeenCalledWith({ accountId: owner.id, staffId: owner.id });
  });

  it('returns generic absence and leaves invitations unchanged when policy is not enabled', async () => {
    jest.mocked(isPreviewOwnerMediaDemoActor).mockReturnValue(false);

    const response = await POST(new Request('http://localhost/api/admin/contributor-media/preview-demo', { method: 'POST' }));

    expect(response.status).toBe(404);
    expect(grantContributorMediaInvitation).not.toHaveBeenCalled();
  });

  it('exposes a candidate selection only to the configured owner and derives reconciliation from the trusted actor', async () => {
    const response = await getLink();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      reconciliation: expect.objectContaining({ submissionId: 'submission-1' }),
    });
    expect(getPreviewOwnerMediaReconciliation).toHaveBeenCalledWith(owner);

    const linked = await postLink(new Request('http://localhost/api/admin/contributor-media/preview-demo/link', {
      method: 'POST',
      body: JSON.stringify({ submissionId: 'submission-1', expectedRevision: 3, candidateId: 'candidate-htu' }),
    }));

    expect(linked.status).toBe(200);
    expect(reconcilePreviewOwnerMedia).toHaveBeenCalledWith({
      actor: owner,
      submissionId: 'submission-1',
      expectedRevision: 3,
      candidateId: 'candidate-htu',
    });
  });
});
