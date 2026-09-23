/** @jest-environment node */

import { POST } from '@/app/api/admin/catalogue-publications/route';
import { requireActiveStaff } from '@/lib/server/active-staff';
import { stageCatalogueCandidate } from '@/lib/server/catalogue-publications';

jest.mock('@/lib/server/active-staff', () => ({ requireActiveStaff: jest.fn() }));
jest.mock('@/lib/server/catalogue-publications', () => ({
  stageCatalogueCandidate: jest.fn(),
}));

const candidate = {
  id: 'catalogue:sample-training',
  title: 'Sample workforce training',
  regionId: 'greater-houston',
};

describe('admin catalogue publication staging API', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it.each([
    ['editor only', ['editor']],
    ['reviewer and editor', ['reviewer', 'editor']],
    ['administrator and editor', ['administrator', 'editor']],
  ])('stages a private candidate for an active %s actor', async (_, capabilities) => {
    jest.mocked(requireActiveStaff).mockResolvedValue({
      ok: true,
      actor: {
        id: 'staff-1',
        email: 'editor@example.com',
        capabilities: new Set(capabilities),
      },
    } as never);
    jest.mocked(stageCatalogueCandidate).mockResolvedValue({
      candidate: {
        ...candidate,
        lifecycle: 'draft',
        correctionCodes: [],
      },
      checklist: {
        passed: true,
        correctionCodes: [],
      },
    } as never);

    const response = await POST(new Request('http://localhost/api/admin/catalogue-publications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stage', candidate }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      candidate: expect.objectContaining({ lifecycle: 'draft' }),
    });
    expect(requireActiveStaff).toHaveBeenCalledWith({
      action: 'catalogue-publication:stage',
      route: '/api/admin/catalogue-publications',
      capability: 'editor',
    });
    expect(stageCatalogueCandidate).toHaveBeenCalledWith({
      actor: expect.objectContaining({
        id: 'staff-1',
        email: 'editor@example.com',
        capabilities: expect.any(Set),
      }),
      candidate,
    });
  });

  it('denies an inactive actor before body parsing or staging', async () => {
    const denial = new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    const json = jest.fn();
    jest.mocked(requireActiveStaff).mockResolvedValue({ ok: false, response: denial } as never);

    const response = await POST({ json } as unknown as Request);

    expect(response.status).toBe(403);
    expect(json).not.toHaveBeenCalled();
    expect(stageCatalogueCandidate).not.toHaveBeenCalled();
  });

  it('keeps an incomplete candidate private with ordered correction codes', async () => {
    jest.mocked(requireActiveStaff).mockResolvedValue({
      ok: true,
      actor: {
        id: 'staff-1',
        email: 'editor@example.com',
        capabilities: new Set(['editor']),
      },
    } as never);
    jest.mocked(stageCatalogueCandidate).mockResolvedValue({
      candidate: {
        ...candidate,
        lifecycle: 'draft',
        correctionCodes: ['source', 'material-evidence', 'freshness'],
      },
      checklist: {
        passed: false,
        correctionCodes: ['source', 'material-evidence', 'freshness'],
      },
    } as never);

    const response = await POST(new Request('http://localhost/api/admin/catalogue-publications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stage', candidate: { id: candidate.id } }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      candidate: {
        lifecycle: 'draft',
        correctionCodes: ['source', 'material-evidence', 'freshness'],
      },
    });
  });
});
