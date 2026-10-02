/** @jest-environment node */

import { POST as createInvitation } from '@/app/api/admin/contributor-media/invitations/route';
import { POST as attest } from '@/app/api/contributor-media/attestation/route';
import { POST as completeMedia } from '@/app/api/contributor-media/complete/route';
import { POST as uploadMedia } from '@/app/api/contributor-media/upload/route';
import { getServerSession } from 'next-auth';
import {
  setScholarScoutDataStoreForTests,
  type ScholarScoutData,
  type ScholarScoutDataStore,
} from '@/lib/server/data-store';
import { resolveStudentActor } from '@/lib/server/student-actor';

jest.mock('@/lib/server/contributor-media', () => ({
  ...jest.requireActual('@/lib/server/contributor-media'),
  issueContributorMediaUpload: jest.fn(),
  completeContributorMediaUpload: jest.fn(),
}));

import {
  completeContributorMediaUpload,
  issueContributorMediaUpload,
} from '@/lib/server/contributor-media';

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/auth', () => ({ authOptions: {} }), { virtual: true });
jest.mock('@/lib/server/student-actor', () => ({ resolveStudentActor: jest.fn() }));

class MemoryDataStore implements ScholarScoutDataStore {
  data: ScholarScoutData = {
    users: [{
      id: 'student-1',
      name: 'Student One',
      email: 'student@example.com',
      role: 'student',
      passwordHash: 'test-only',
      createdAt: '2026-09-29T00:00:00.000Z',
    }],
    onboardingProfiles: {},
    shortlists: {},
    programmeRecords: [],
    auditEvents: [],
  };

  async read(): Promise<ScholarScoutData> {
    return structuredClone(this.data);
  }

  async write(data: ScholarScoutData): Promise<void> {
    this.data = structuredClone(data);
  }
}

describe('contributor media routes', () => {
  const originalStaffEmails = process.env.SCHOLARSCOUT_STAFF_EMAILS;
  const originalCapabilities = process.env.SCHOLARSCOUT_CATALOGUE_STAFF_CAPABILITIES;
  let store: MemoryDataStore;

  beforeEach(() => {
    store = new MemoryDataStore();
    setScholarScoutDataStoreForTests(store);
    process.env.SCHOLARSCOUT_STAFF_EMAILS = 'editor@example.com';
    process.env.SCHOLARSCOUT_CATALOGUE_STAFF_CAPABILITIES = JSON.stringify({
      'editor@example.com': ['editor'],
    });
    jest.mocked(getServerSession).mockResolvedValue({
      user: { id: 'editor-1', email: 'editor@example.com' },
    } as never);
    jest.mocked(resolveStudentActor).mockResolvedValue({
      kind: 'account',
      accountId: 'student-1',
      storageKey: 'account:student-1',
    });
  });

  afterEach(() => {
    setScholarScoutDataStoreForTests(null);
    jest.mocked(getServerSession).mockReset();
    jest.mocked(resolveStudentActor).mockReset();
    restoreEnvironment('SCHOLARSCOUT_STAFF_EMAILS', originalStaffEmails);
    restoreEnvironment('SCHOLARSCOUT_CATALOGUE_STAFF_CAPABILITIES', originalCapabilities);
  });

  it('allows an editor to invite a known account using trusted staff authority', async () => {
    const response = await createInvitation(new Request('http://localhost/api/admin/contributor-media/invitations', {
      method: 'POST',
      body: JSON.stringify({ accountId: 'student-1' }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ invitation: expect.objectContaining({ accountId: 'student-1' }) });
  });

  it('allows only the invited account to create an adult-attested private Draft', async () => {
    await createInvitation(new Request('http://localhost/api/admin/contributor-media/invitations', {
      method: 'POST', body: JSON.stringify({ accountId: 'student-1' }),
    }));
    const response = await attest(new Request('http://localhost/api/contributor-media/attestation', {
      method: 'POST',
      body: JSON.stringify({
        adultAffirmed: true,
        signerName: 'Student One',
        creatorAuthority: true,
        recognisablePeopleConsent: true,
      }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ submission: { status: 'Draft' } });
  });

  it('does not reveal any private contributor fields to unauthenticated or uninvited accounts', async () => {
    jest.mocked(resolveStudentActor).mockResolvedValue(null);
    const response = await attest(new Request('http://localhost/api/contributor-media/attestation', {
      method: 'POST', body: JSON.stringify({}),
    }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('preserves the first acknowledgement and rejects a changed acknowledgement without another Draft', async () => {
    await createInvitation(new Request('http://localhost/api/admin/contributor-media/invitations', {
      method: 'POST', body: JSON.stringify({ accountId: 'student-1' }),
    }));
    const original = {
      adultAffirmed: true,
      signerName: 'Student One',
      creatorAuthority: true,
      recognisablePeopleConsent: true,
    };
    await attest(new Request('http://localhost/api/contributor-media/attestation', {
      method: 'POST', body: JSON.stringify(original),
    }));

    const response = await attest(new Request('http://localhost/api/contributor-media/attestation', {
      method: 'POST',
      body: JSON.stringify({ ...original, signerName: 'Changed Signer' }),
    }));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ category: 'conflict', action: 'reload' });
    expect(store.data.contributorMediaState?.submissions).toHaveLength(1);
    expect(store.data.contributorMediaState?.submissions[0]?.signerName).toBe('Student One');
  });

  it('denies a disabled invitation before creating private evidence', async () => {
    await createInvitation(new Request('http://localhost/api/admin/contributor-media/invitations', {
      method: 'POST', body: JSON.stringify({ accountId: 'student-1' }),
    }));
    store.data.contributorMediaState?.invitations.forEach((invitation) => {
      invitation.status = 'disabled';
    });

    const response = await attest(new Request('http://localhost/api/contributor-media/attestation', {
      method: 'POST',
      body: JSON.stringify({
        adultAffirmed: true,
        signerName: 'Student One',
        creatorAuthority: true,
        recognisablePeopleConsent: true,
      }),
    }));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Contributor invitation required.' });
    expect(store.data.contributorMediaState?.submissions).toEqual([]);
  });

  it('returns only an opaque upload capability after server-side binding', async () => {
    jest.mocked(issueContributorMediaUpload).mockResolvedValue({
      status: 'applied',
      value: {
        status: 'issued',
        capability: { uploadId: 'opaque-upload-id', status: 'Draft', revision: 1 },
      },
    } as never);
    const response = await uploadMedia(new Request('http://localhost/api/contributor-media/upload', {
      method: 'POST',
      body: JSON.stringify({
        programmeId: 'programme-1',
        expectedRevision: 1,
        files: [
          { kind: 'video', contentType: 'video/mp4', size: 1024 },
          { kind: 'poster', contentType: 'image/png', size: 1024 },
        ],
      }),
    }));

    expect(response.status).toBe(200);
    const body = await response.json() as Record<string, unknown>;
    expect(body).toEqual({ capability: { uploadId: 'opaque-upload-id', status: 'Draft', revision: 1 } });
    expect(JSON.stringify(body)).not.toMatch(/blob|pathname|url|signer/i);
  });

  it('maps failed server inspection to Action needed without returning private object details', async () => {
    jest.mocked(completeContributorMediaUpload).mockResolvedValue({
      status: 'applied',
      value: {
        status: 'action-needed',
        submission: { status: 'Action needed', revision: 1 },
      },
    } as never);
    const response = await completeMedia(new Request('http://localhost/api/contributor-media/complete', {
      method: 'POST',
      body: JSON.stringify({ uploadId: 'opaque-upload-id', expectedRevision: 1 }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ submission: { status: 'Action needed', revision: 1 } });
  });
});

function restoreEnvironment(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}
