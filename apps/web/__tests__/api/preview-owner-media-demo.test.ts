import { GET, POST } from '@/app/api/admin/contributor-media/preview-demo/route';
import { requireActiveStaff } from '@/lib/server/active-staff';
import { grantContributorMediaInvitation } from '@/lib/server/contributor-media';
import { isPreviewOwnerMediaDemoActor } from '@/lib/server/preview-owner-media-demo';

jest.mock('@/lib/server/active-staff', () => ({ requireActiveStaff: jest.fn() }));
jest.mock('@/lib/server/contributor-media', () => ({ grantContributorMediaInvitation: jest.fn() }));
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
});
