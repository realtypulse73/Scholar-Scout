/** @jest-environment node */

import { POST as createInvitation } from '@/app/api/admin/contributor-media/invitations/route';
import { POST as attest } from '@/app/api/contributor-media/attestation/route';
import { POST as completeMedia } from '@/app/api/contributor-media/complete/route';
import { POST as uploadMedia } from '@/app/api/contributor-media/upload/route';
import { GET as getCatalogueMedia } from '@/app/api/catalogue-media/[publicId]/route';
import { GET as getReviewQueue, POST as reviewMedia } from '@/app/api/admin/contributor-media/review/route';
import { getServerSession } from 'next-auth';
import {
  setScholarScoutDataStoreForTests,
  type ScholarScoutData,
  type ScholarScoutDataStore,
} from '@/lib/server/data-store';
import { resolveStudentActor } from '@/lib/server/student-actor';

jest.mock('@/lib/server/programme-records', () => ({ getGovernedProgrammes: jest.fn() }));

jest.mock('@/lib/server/contributor-media', () => ({
  ...jest.requireActual('@/lib/server/contributor-media'),
  issueContributorMediaUpload: jest.fn(),
  completeContributorMediaUpload: jest.fn(),
  getReleasedContributorMedia: jest.fn(),
}));

import {
  completeContributorMediaUpload,
  getReleasedContributorMedia,
  issueContributorMediaUpload,
} from '@/lib/server/contributor-media';
import { getGovernedProgrammes } from '@/lib/server/programme-records';

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
  const originalVercel = process.env.VERCEL;
  const originalVercelEnv = process.env.VERCEL_ENV;
  const originalPreviewOwnerDemo = process.env.SCHOLARSCOUT_PREVIEW_OWNER_MEDIA_DEMO;
  const originalPreviewOwnerEmail = process.env.SCHOLARSCOUT_PREVIEW_OWNER_MEDIA_DEMO_OWNER_EMAIL;
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
    jest.mocked(getGovernedProgrammes).mockResolvedValue([{ id: 'programme-1', publicationStatus: 'published' }] as never);
  });

  afterEach(() => {
    setScholarScoutDataStoreForTests(null);
    jest.mocked(getServerSession).mockReset();
    jest.mocked(resolveStudentActor).mockReset();
    jest.mocked(getGovernedProgrammes).mockReset();
    restoreEnvironment('SCHOLARSCOUT_STAFF_EMAILS', originalStaffEmails);
    restoreEnvironment('SCHOLARSCOUT_CATALOGUE_STAFF_CAPABILITIES', originalCapabilities);
    restoreEnvironment('VERCEL', originalVercel);
    restoreEnvironment('VERCEL_ENV', originalVercelEnv);
    restoreEnvironment('SCHOLARSCOUT_PREVIEW_OWNER_MEDIA_DEMO', originalPreviewOwnerDemo);
    restoreEnvironment('SCHOLARSCOUT_PREVIEW_OWNER_MEDIA_DEMO_OWNER_EMAIL', originalPreviewOwnerEmail);
  });

  it('allows an editor to invite a known account using trusted staff authority', async () => {
    const response = await createInvitation(new Request('http://localhost/api/admin/contributor-media/invitations', {
      method: 'POST',
      body: JSON.stringify({ accountId: 'student-1' }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ invitation: expect.objectContaining({ accountId: 'student-1' }) });
  });

  it('allows the exact configured Preview owner to self-invite without a browser demo switch', async () => {
    store.data.users.push({
      id: 'owner-1',
      name: 'Preview Owner',
      email: 'owner@example.com',
      role: 'staff',
      passwordHash: 'test-only',
      createdAt: '2026-10-02T00:00:00.000Z',
    });
    configurePreviewOwnerDemo();

    const response = await createInvitation(new Request('http://localhost/api/admin/contributor-media/invitations', {
      method: 'POST',
      body: JSON.stringify({ accountId: 'owner-1' }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ invitation: expect.objectContaining({ accountId: 'owner-1' }) });
    expect(store.data.contributorMediaState?.invitations[0]).toMatchObject({
      accountId: 'owner-1',
      createdByStaffId: 'owner-1',
    });
  });

  it.each([
    ['Production', { VERCEL: '1', VERCEL_ENV: 'production', SCHOLARSCOUT_PREVIEW_OWNER_MEDIA_DEMO: 'true', SCHOLARSCOUT_PREVIEW_OWNER_MEDIA_DEMO_OWNER_EMAIL: 'owner@example.com' }],
    ['local runtime', { VERCEL: undefined, VERCEL_ENV: undefined, SCHOLARSCOUT_PREVIEW_OWNER_MEDIA_DEMO: 'true', SCHOLARSCOUT_PREVIEW_OWNER_MEDIA_DEMO_OWNER_EMAIL: 'owner@example.com' }],
    ['missing opt-in', { VERCEL: '1', VERCEL_ENV: 'preview', SCHOLARSCOUT_PREVIEW_OWNER_MEDIA_DEMO: undefined, SCHOLARSCOUT_PREVIEW_OWNER_MEDIA_DEMO_OWNER_EMAIL: 'owner@example.com' }],
    ['malformed owner', { VERCEL: '1', VERCEL_ENV: 'preview', SCHOLARSCOUT_PREVIEW_OWNER_MEDIA_DEMO: 'true', SCHOLARSCOUT_PREVIEW_OWNER_MEDIA_DEMO_OWNER_EMAIL: 'owner@example.com,other@example.com' }],
  ])('denies owner self-invitation for %s configuration without mutating state', async (_label, environment) => {
    store.data.users.push({
      id: 'owner-1', name: 'Preview Owner', email: 'owner@example.com', role: 'staff', passwordHash: 'test-only', createdAt: '2026-10-02T00:00:00.000Z',
    });
    configurePreviewOwnerDemo(environment);

    const response = await createInvitation(new Request('http://localhost/api/admin/contributor-media/invitations', {
      method: 'POST', body: JSON.stringify({ accountId: 'owner-1' }),
    }));

    expect(response.status).toBe(403);
    expect(store.data.contributorMediaState?.invitations ?? []).toEqual([]);
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
    await expect(response.json()).resolves.toEqual({ submission: { status: 'Draft', revision: 1 } });
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

  it('returns one generic failure for unknown or private catalogue-media IDs', async () => {
    jest.mocked(getReleasedContributorMedia).mockResolvedValue(null);

    const response = await getCatalogueMedia(
      new Request('http://localhost/api/catalogue-media/not-a-public-id'),
      { params: Promise.resolve({ publicId: 'not-a-public-id' }) },
    );

    expect(response.status).toBe(404);
    expect(await response.text()).toBe('');
    expect(getReleasedContributorMedia).toHaveBeenCalledWith('not-a-public-id');
  });

  it('streams an authorized opaque ID without exposing a Blob URL or private metadata', async () => {
    jest.mocked(getReleasedContributorMedia).mockResolvedValue({
      stream: new ReadableStream({ start(controller) { controller.close(); } }),
      contentType: 'video/mp4',
    });

    const response = await getCatalogueMedia(
      new Request('http://localhost/api/catalogue-media/media-12345678-1234-1234-1234-123456789abc'),
      { params: Promise.resolve({ publicId: 'media-12345678-1234-1234-1234-123456789abc' }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('video/mp4');
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(JSON.stringify(Object.fromEntries(response.headers))).not.toMatch(/blob|object|signer|account/i);
  });

  it('lets only an independent reviewer approve a current private package', async () => {
    store.data.cataloguePublicationState = {
      schemaVersion: 1,
      candidates: [{
        id: 'programme-1',
        revision: 4,
        lifecycle: 'approved',
        retirementIntent: false,
        approval: { reviewerId: 'catalogue-reviewer', reviewedAt: '2026-10-02T00:00:00.000Z', revision: 4 },
      }],
      auditEvents: [],
    } as unknown as ScholarScoutData['cataloguePublicationState'];
    store.data.contributorMediaState = {
      invitations: [],
      submissions: [{
        id: 'submission-1',
        accountId: 'student-1',
        status: 'Ready for review',
        signerName: 'Student One',
        creatorAuthority: true,
        recognisablePeopleConsent: true,
        attestedAt: '2026-10-02T00:00:00.000Z',
        createdAt: '2026-10-02T00:00:00.000Z',
        updatedAt: '2026-10-02T00:00:00.000Z',
        revision: 1,
        mediaPackage: {
          id: 'package-1', programmeId: 'programme-1',
          videoObjectKey: 'contributor-media/package-1/video.mp4',
          posterObjectKey: 'contributor-media/package-1/poster.png',
          videoUploaded: true, posterUploaded: true,
        },
      }],
    };
    process.env.SCHOLARSCOUT_STAFF_EMAILS = 'reviewer@example.com';
    process.env.SCHOLARSCOUT_CATALOGUE_STAFF_CAPABILITIES = JSON.stringify({
      'reviewer@example.com': ['reviewer'],
    });
    jest.mocked(getServerSession).mockResolvedValue({
      user: { id: 'reviewer-1', email: 'reviewer@example.com' },
    } as never);

    const queue = await getReviewQueue();
    expect(queue.status).toBe(200);
    await expect(queue.json()).resolves.toEqual({
      items: [expect.objectContaining({ id: 'submission-1', signerName: 'Student One', programmeId: 'programme-1' })],
    });

    const response = await reviewMedia(new Request('http://localhost/api/admin/contributor-media/review', {
      method: 'POST',
      body: JSON.stringify({ submissionId: 'submission-1', expectedRevision: 1, decision: 'approve' }),
    }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ submission: { status: 'Approved for release', revision: 2 } });
    expect(store.data.contributorMediaState?.submissions[0]).toMatchObject({
      reviewerId: 'reviewer-1',
      releaseCandidateId: 'programme-1',
      releaseCandidateRevision: 4,
    });
  });

  it('rejects self-review before approving private evidence', async () => {
    store.data.contributorMediaState = {
      invitations: [],
      submissions: [{
        id: 'submission-self', accountId: 'reviewer-1', status: 'Ready for review', signerName: 'Reviewer One',
        creatorAuthority: true, recognisablePeopleConsent: true,
        attestedAt: '2026-10-02T00:00:00.000Z', createdAt: '2026-10-02T00:00:00.000Z', updatedAt: '2026-10-02T00:00:00.000Z', revision: 1,
        mediaPackage: { id: 'package-self', programmeId: 'programme-1', videoObjectKey: 'contributor-media/package-self/video.mp4', posterObjectKey: 'contributor-media/package-self/poster.png', videoUploaded: true, posterUploaded: true },
      }],
    };
    process.env.SCHOLARSCOUT_STAFF_EMAILS = 'reviewer@example.com';
    process.env.SCHOLARSCOUT_CATALOGUE_STAFF_CAPABILITIES = JSON.stringify({ 'reviewer@example.com': ['reviewer'] });
    jest.mocked(getServerSession).mockResolvedValue({ user: { id: 'reviewer-1', email: 'reviewer@example.com' } } as never);

    const response = await reviewMedia(new Request('http://localhost/api/admin/contributor-media/review', {
      method: 'POST', body: JSON.stringify({ submissionId: 'submission-self', expectedRevision: 1, decision: 'approve' }),
    }));
    expect(response.status).toBe(403);
    expect(store.data.contributorMediaState?.submissions[0]?.status).toBe('Ready for review');
  });

  it('allows only the exact configured Preview owner to self-approve their current package', async () => {
    store.data.cataloguePublicationState = {
      schemaVersion: 1,
      candidates: [{
        id: 'programme-1', revision: 4, lifecycle: 'approved', retirementIntent: false,
        approval: { reviewerId: 'catalogue-reviewer', reviewedAt: '2026-10-02T00:00:00.000Z', revision: 4 },
      }],
      auditEvents: [],
    } as unknown as ScholarScoutData['cataloguePublicationState'];
    store.data.contributorMediaState = {
      invitations: [],
      submissions: [{
        id: 'submission-owner', accountId: 'owner-1', status: 'Ready for review', signerName: 'Preview Owner',
        creatorAuthority: true, recognisablePeopleConsent: true,
        attestedAt: '2026-10-02T00:00:00.000Z', createdAt: '2026-10-02T00:00:00.000Z', updatedAt: '2026-10-02T00:00:00.000Z', revision: 1,
        mediaPackage: { id: 'package-owner', programmeId: 'programme-1', videoObjectKey: 'contributor-media/package-owner/video.mp4', posterObjectKey: 'contributor-media/package-owner/poster.png', videoUploaded: true, posterUploaded: true },
      }],
    };
    configurePreviewOwnerDemo();

    const response = await reviewMedia(new Request('http://localhost/api/admin/contributor-media/review', {
      method: 'POST', body: JSON.stringify({ submissionId: 'submission-owner', expectedRevision: 1, decision: 'approve' }),
    }));

    expect(response.status).toBe(200);
    expect(store.data.contributorMediaState?.submissions[0]).toMatchObject({
      status: 'Approved for release',
      reviewerId: 'owner-1',
    });
  });
});

function configurePreviewOwnerDemo(environment: Record<string, string | undefined> = {}): void {
  setEnvironment('VERCEL', environment, '1');
  setEnvironment('VERCEL_ENV', environment, 'preview');
  setEnvironment('SCHOLARSCOUT_PREVIEW_OWNER_MEDIA_DEMO', environment, 'true');
  setEnvironment('SCHOLARSCOUT_PREVIEW_OWNER_MEDIA_DEMO_OWNER_EMAIL', environment, 'owner@example.com');
  process.env.SCHOLARSCOUT_STAFF_EMAILS = 'owner@example.com';
  process.env.SCHOLARSCOUT_CATALOGUE_STAFF_CAPABILITIES = JSON.stringify({
    'owner@example.com': ['editor', 'reviewer', 'administrator'],
  });
  jest.mocked(getServerSession).mockResolvedValue({
    user: { id: 'owner-1', email: 'owner@example.com' },
  } as never);
}

function setEnvironment(
  name: string,
  environment: Record<string, string | undefined>,
  defaultValue: string,
): void {
  const value = Object.prototype.hasOwnProperty.call(environment, name)
    ? environment[name]
    : defaultValue;
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

function restoreEnvironment(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}
