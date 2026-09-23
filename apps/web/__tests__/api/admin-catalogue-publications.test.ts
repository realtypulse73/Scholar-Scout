/** @jest-environment node */

import { GET, POST } from '@/app/api/admin/catalogue-publications/route';
import { getServerSession } from 'next-auth';
import {
  setScholarScoutDataStoreForTests,
  type ScholarScoutData,
  type ScholarScoutDataStore,
} from '@/lib/server/data-store';

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/auth', () => ({ authOptions: {} }), { virtual: true });

const candidate = {
  id: 'catalogue:sample-training',
  title: 'Sample workforce training',
  regionId: 'greater-houston',
};

describe('admin catalogue publication staging API', () => {
  const originalStaffEmails = process.env.SCHOLARSCOUT_STAFF_EMAILS;
  const originalCapabilities = process.env.SCHOLARSCOUT_CATALOGUE_STAFF_CAPABILITIES;

  beforeEach(() => {
    setScholarScoutDataStoreForTests(new MemoryDataStore());
    jest.mocked(getServerSession).mockResolvedValue({
      user: { id: 'staff-1', email: 'editor@example.com' },
    } as never);
    process.env.SCHOLARSCOUT_STAFF_EMAILS = 'editor@example.com';
  });

  afterEach(() => {
    setScholarScoutDataStoreForTests(null);
    restoreEnvironment('SCHOLARSCOUT_STAFF_EMAILS', originalStaffEmails);
    restoreEnvironment('SCHOLARSCOUT_CATALOGUE_STAFF_CAPABILITIES', originalCapabilities);
  });

  it.each([
    ['editor only', ['editor']],
    ['reviewer and editor', ['reviewer', 'editor']],
    ['administrator and editor', ['administrator', 'editor']],
  ])('stages a private candidate for an active %s actor', async (_, capabilities) => {
    process.env.SCHOLARSCOUT_CATALOGUE_STAFF_CAPABILITIES = JSON.stringify({
      'editor@example.com': capabilities,
    });

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
  });

  it('denies an inactive actor before body parsing or staging', async () => {
    const json = jest.fn();
    process.env.SCHOLARSCOUT_CATALOGUE_STAFF_CAPABILITIES = JSON.stringify({
      'editor@example.com': ['reviewer'],
    });

    const response = await POST({ json } as unknown as Request);

    expect(response.status).toBe(403);
    expect(json).not.toHaveBeenCalled();
  });

  it('keeps an incomplete candidate private with ordered correction codes', async () => {
    process.env.SCHOLARSCOUT_CATALOGUE_STAFF_CAPABILITIES = JSON.stringify({
      'editor@example.com': ['editor'],
    });

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
        checklist: {
          correctionCodes: ['source', 'material-evidence', 'freshness', 'claim-boundary', 'regional-boundary'],
        },
      },
    });
  });

  it('returns only redacted candidate history to an authorized staff caller', async () => {
    process.env.SCHOLARSCOUT_CATALOGUE_STAFF_CAPABILITIES = JSON.stringify({
      'editor@example.com': ['editor', 'reviewer'],
    });
    await POST(new Request('http://localhost/api/admin/catalogue-publications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stage', candidate }),
    }));

    const response = await GET(new Request(
      `http://localhost/api/admin/catalogue-publications?candidateId=${candidate.id}`,
    ));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      history: {
        candidate: {
          id: candidate.id,
          checklist: {
            summary: expect.arrayContaining([
              expect.objectContaining({ category: 'source' }),
              expect.objectContaining({ category: 'media-rights' }),
            ]),
            passMeaning: 'A pass means editorial completeness, not verified real-world provider truth.',
          },
        },
      },
    });
  });

  it('returns a safe candidate-intake DTO without raw candidate fields or configuration', async () => {
    process.env.SCHOLARSCOUT_CATALOGUE_STAFF_CAPABILITIES = JSON.stringify({
      'editor@example.com': ['editor'],
    });
    await POST(new Request('http://localhost/api/admin/catalogue-publications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stage', candidate: { ...candidate, claimBoundary: 'Private notes must not be returned.' } }),
    }));

    const response = await GET(new Request(
      'http://localhost/api/admin/catalogue-publications?view=candidate-intake',
    ));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      capabilities: ['editor'],
      candidates: [expect.objectContaining({ id: candidate.id, title: candidate.title })],
    });
    expect(JSON.stringify(body)).not.toContain('Private notes must not be returned.');
    expect(JSON.stringify(body)).not.toContain('SCHOLARSCOUT_CATALOGUE_STAFF_CAPABILITIES');
  });

  it('denies history before parsing caller-controlled query details', async () => {
    jest.mocked(getServerSession).mockResolvedValue(null as never);

    const response = await GET({ url: 'not a valid URL' } as unknown as Request);

    expect(response.status).toBe(403);
  });

  it('denies preview publication before parsing the request body when the actor lacks administrator capability', async () => {
    const json = jest.fn();
    process.env.SCHOLARSCOUT_CATALOGUE_STAFF_CAPABILITIES = JSON.stringify({
      'editor@example.com': ['editor'],
    });

    const response = await POST({
      url: 'http://localhost/api/admin/catalogue-publications?action=preview-weekly',
      json,
    } as unknown as Request);

    expect(response.status).toBe(403);
    expect(json).not.toHaveBeenCalled();
  });

  it.each([
    ['conflict resolution', 'resolve-conflict', ['reviewer']],
    ['emergency correction', 'emergency-correction', ['editor']],
    ['snapshot restore', 'restore-snapshot', ['reviewer']],
  ])('checks exact capability for %s before parsing the request', async (_, action, capabilities) => {
    const json = jest.fn();
    process.env.SCHOLARSCOUT_CATALOGUE_STAFF_CAPABILITIES = JSON.stringify({
      'editor@example.com': capabilities,
    });

    const response = await POST({
      url: `http://localhost/api/admin/catalogue-publications?action=${action}`,
      json,
    } as unknown as Request);

    expect(response.status).toBe(403);
    expect(json).not.toHaveBeenCalled();
  });
});

class MemoryDataStore implements ScholarScoutDataStore {
  private data: ScholarScoutData = {
    users: [],
    onboardingProfiles: {},
    shortlists: {},
    programmeRecords: [],
    auditEvents: [],
  };
  private version = 'memory-0';

  async read() { return cloneData(this.data); }
  async write(data: ScholarScoutData) { this.data = cloneData(data); }
  async readVersioned() { return { data: cloneData(this.data), version: this.version }; }
  async writeVersioned(data: ScholarScoutData, expectedVersion: string | null) {
    if (expectedVersion !== this.version) return { status: 'conflict' as const };
    this.data = cloneData(data);
    this.version = `memory-${Number(this.version.split('-')[1]) + 1}`;
    return { status: 'applied' as const, version: this.version };
  }
}

function cloneData(data: ScholarScoutData): ScholarScoutData {
  return JSON.parse(JSON.stringify(data)) as ScholarScoutData;
}

function restoreEnvironment(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
