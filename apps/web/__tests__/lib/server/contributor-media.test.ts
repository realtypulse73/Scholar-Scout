/** @jest-environment node */

import {
  authorizeContributorMediaDirectUpload,
} from '@/lib/server/contributor-media';
import {
  setScholarScoutDataStoreForTests,
  type ScholarScoutData,
  type ScholarScoutDataStore,
} from '@/lib/server/data-store';
import type { AccountStudentActor } from '@/lib/server/student-actor';

const NOW = new Date('2026-10-02T12:00:00.000Z');
const owner: AccountStudentActor = {
  kind: 'account',
  accountId: 'owner-1',
  storageKey: 'account:owner-1',
};

class MemoryDataStore implements ScholarScoutDataStore {
  data: ScholarScoutData = {
    users: [],
    onboardingProfiles: {},
    shortlists: {},
    programmeRecords: [],
    auditEvents: [],
    contributorMediaState: {
      invitations: [{
        id: 'invitation-1',
        accountId: owner.accountId,
        createdByStaffId: 'editor-1',
        status: 'active',
        createdAt: '2026-10-01T12:00:00.000Z',
        expiresAt: '2026-10-16T12:00:00.000Z',
      }],
      submissions: [{
        id: 'submission-1',
        accountId: owner.accountId,
        status: 'Draft',
        signerName: 'Owner One',
        creatorAuthority: true,
        recognisablePeopleConsent: true,
        attestedAt: '2026-10-01T12:00:00.000Z',
        createdAt: '2026-10-01T12:00:00.000Z',
        updatedAt: '2026-10-01T12:00:00.000Z',
        revision: 3,
        mediaPackage: {
          id: 'package-1',
          programmeId: 'programme-1',
          videoObjectKey: 'contributor-media/package-1/video.mp4',
          posterObjectKey: 'contributor-media/package-1/poster.png',
          videoUploaded: false,
          posterUploaded: false,
        },
      }],
    },
  };

  async read(): Promise<ScholarScoutData> { return structuredClone(this.data); }
  async write(data: ScholarScoutData): Promise<void> { this.data = structuredClone(data); }
}

describe('contributor direct upload authorization', () => {
  let store: MemoryDataStore;

  beforeEach(() => {
    store = new MemoryDataStore();
    setScholarScoutDataStoreForTests(store);
  });

  afterEach(() => setScholarScoutDataStoreForTests(null));

  it('authorizes only the current invited Draft owner at the issued revision', async () => {
    await expect(authorizeContributorMediaDirectUpload({
      actor: owner,
      uploadId: 'package-1',
      expectedRevision: 3,
      kind: 'video',
      now: NOW,
    })).resolves.toEqual({
      status: 'authorized',
      revision: 3,
      pathname: 'contributor-media/package-1/video.mp4',
    });
  });

  it.each([
    ['an uninvited actor', (data: ScholarScoutData) => { data.contributorMediaState!.invitations = []; }],
    ['a different actor', (data: ScholarScoutData) => { data.contributorMediaState!.submissions[0].accountId = 'peer-1'; }],
    ['a removed package', (data: ScholarScoutData) => { data.contributorMediaState!.submissions[0].status = 'Removed'; }],
    ['a stale revision', (data: ScholarScoutData) => { data.contributorMediaState!.submissions[0].revision = 4; }],
  ])('denies %s before a private path can be used', async (_label, change) => {
    change(store.data);

    await expect(authorizeContributorMediaDirectUpload({
      actor: owner,
      uploadId: 'package-1',
      expectedRevision: 3,
      kind: 'poster',
      now: NOW,
    })).resolves.toEqual({ status: 'denied' });
  });

  it('denies an unknown opaque package ID', async () => {
    await expect(authorizeContributorMediaDirectUpload({
      actor: owner,
      uploadId: 'unknown-package',
      expectedRevision: 3,
      kind: 'video',
      now: NOW,
    })).resolves.toEqual({ status: 'denied' });
  });
});
