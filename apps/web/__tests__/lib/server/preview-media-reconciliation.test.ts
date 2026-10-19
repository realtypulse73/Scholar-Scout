/** @jest-environment node */

import {
  getContributorMediaReviewQueue,
  issueContributorMediaUpload,
  reconcilePreviewOwnerMedia,
} from '@/lib/server/contributor-media';
import {
  setScholarScoutDataStoreForTests,
  type ScholarScoutData,
  type ScholarScoutDataStore,
} from '@/lib/server/data-store';
import { getGovernedProgrammes } from '@/lib/server/programme-records';

jest.mock('@/lib/server/programme-records', () => ({ getGovernedProgrammes: jest.fn() }));

const owner = {
  id: 'owner-1',
  email: 'owner@example.com',
  capabilities: new Set(['editor', 'reviewer', 'administrator'] as const),
};

class MemoryDataStore implements ScholarScoutDataStore {
  data: ScholarScoutData = {
    users: [{
      id: owner.id,
      name: 'Preview Owner',
      email: owner.email,
      role: 'staff',
      passwordHash: 'test-only',
      createdAt: '2026-10-19T12:00:00.000Z',
    }],
    onboardingProfiles: {},
    shortlists: {},
    programmeRecords: [],
    auditEvents: [],
    contributorMediaState: {
      invitations: [{
        id: 'invitation-1', accountId: owner.id, createdByStaffId: owner.id, status: 'active',
        createdAt: '2026-10-19T12:00:00.000Z', expiresAt: '2026-11-02T12:00:00.000Z',
      }],
      submissions: [{
        id: 'submission-1', accountId: owner.id, status: 'Ready for review', signerName: 'Preview Owner',
        creatorAuthority: true, recognisablePeopleConsent: true,
        attestedAt: '2026-10-19T12:00:00.000Z', createdAt: '2026-10-19T12:00:00.000Z',
        updatedAt: '2026-10-19T12:00:00.000Z', revision: 3,
        mediaPackage: {
          id: 'package-1', programmeId: 'legacy-programme-id',
          videoObjectKey: 'contributor-media/package-1/video.mp4',
          posterObjectKey: 'contributor-media/package-1/poster.png',
          videoUploaded: true, posterUploaded: true,
        },
      }],
    },
    cataloguePublicationState: {
      schemaVersion: 1,
      candidates: [{
        id: 'candidate-htu', title: 'Houston Tillotson University', revision: 2,
        lifecycle: 'approved', retirementIntent: false,
        approval: { reviewerId: 'reviewer-1', reviewedAt: '2026-10-19T12:00:00.000Z', revision: 2 },
      }],
      snapshots: [],
      auditEvents: [],
    } as unknown as ScholarScoutData['cataloguePublicationState'],
  };

  async read(): Promise<ScholarScoutData> { return structuredClone(this.data); }
  async write(data: ScholarScoutData): Promise<void> { this.data = structuredClone(data); }
}

describe('Preview contributor-media reconciliation', () => {
  const environment = ['VERCEL', 'VERCEL_ENV', 'SCHOLARSCOUT_PREVIEW_OWNER_MEDIA_DEMO', 'SCHOLARSCOUT_PREVIEW_OWNER_MEDIA_DEMO_OWNER_EMAIL'] as const;
  const originalEnvironment: Record<(typeof environment)[number], string | undefined> = {
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    SCHOLARSCOUT_PREVIEW_OWNER_MEDIA_DEMO: process.env.SCHOLARSCOUT_PREVIEW_OWNER_MEDIA_DEMO,
    SCHOLARSCOUT_PREVIEW_OWNER_MEDIA_DEMO_OWNER_EMAIL: process.env.SCHOLARSCOUT_PREVIEW_OWNER_MEDIA_DEMO_OWNER_EMAIL,
  };
  let store: MemoryDataStore;

  beforeEach(() => {
    store = new MemoryDataStore();
    setScholarScoutDataStoreForTests(store);
    process.env.VERCEL = '1';
    process.env.VERCEL_ENV = 'preview';
    process.env.SCHOLARSCOUT_PREVIEW_OWNER_MEDIA_DEMO = 'true';
    process.env.SCHOLARSCOUT_PREVIEW_OWNER_MEDIA_DEMO_OWNER_EMAIL = owner.email;
    jest.mocked(getGovernedProgrammes).mockResolvedValue([{ id: 'candidate-htu', publicationStatus: 'published' }] as never);
  });

  afterEach(() => {
    setScholarScoutDataStoreForTests(null);
    jest.resetAllMocks();
    for (const name of environment) {
      const value = originalEnvironment[name];
      if (value === undefined) delete process.env[name];
      else Reflect.set(process.env, name, value);
    }
  });

  it('links only the exact Preview owner package to a selected approved candidate and makes it reviewable', async () => {
    await expect(getContributorMediaReviewQueue()).resolves.toEqual([]);

    const result = await reconcilePreviewOwnerMedia({
      actor: owner,
      submissionId: 'submission-1',
      expectedRevision: 3,
      candidateId: 'candidate-htu',
      now: new Date('2026-10-19T13:00:00.000Z'),
    });

    expect(result).toEqual({
      status: 'applied',
      value: { status: 'linked', submission: { status: 'Ready for review', revision: 4 } },
    });
    expect(store.data.contributorMediaState?.submissions[0]).toMatchObject({
      status: 'Ready for review',
      revision: 4,
      mediaPackage: {
        programmeId: 'legacy-programme-id',
        candidateId: 'candidate-htu',
        videoObjectKey: 'contributor-media/package-1/video.mp4',
        posterObjectKey: 'contributor-media/package-1/poster.png',
      },
    });
    expect(store.data.auditEvents).toEqual([]);
    await expect(getContributorMediaReviewQueue()).resolves.toEqual([
      expect.objectContaining({ id: 'submission-1', programmeId: 'candidate-htu', revision: 4 }),
    ]);
  });

  it('does not issue a future package when a governed programme lacks an approved candidate link', async () => {
    store.data.contributorMediaState!.submissions[0] = {
      ...store.data.contributorMediaState!.submissions[0],
      status: 'Draft',
      revision: 1,
      mediaPackage: undefined,
    };
    store.data.cataloguePublicationState = {
      schemaVersion: 1,
      candidates: [],
      snapshots: [],
      auditEvents: [],
    } as unknown as ScholarScoutData['cataloguePublicationState'];
    jest.mocked(getGovernedProgrammes).mockResolvedValue([{ id: 'legacy-programme-id', publicationStatus: 'published' }] as never);

    const result = await issueContributorMediaUpload({
      actor: { kind: 'account', accountId: owner.id, storageKey: `account:${owner.id}` },
      request: {
        programmeId: 'legacy-programme-id', expectedRevision: 1,
        files: [
          { kind: 'video', contentType: 'video/mp4', size: 1024 },
          { kind: 'poster', contentType: 'image/png', size: 1024 },
        ],
      },
      now: new Date('2026-10-19T13:00:00.000Z'),
    });

    expect(result).toEqual({ status: 'applied', value: { status: 'ineligible-programme' } });
    expect(store.data.contributorMediaState?.submissions[0]?.mediaPackage).toBeUndefined();
  });
});
