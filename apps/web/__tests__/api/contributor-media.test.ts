/** @jest-environment node */

import { POST as createInvitation } from '@/app/api/admin/contributor-media/invitations/route';
import { POST as attest } from '@/app/api/contributor-media/attestation/route';
import { getServerSession } from 'next-auth';
import {
  setScholarScoutDataStoreForTests,
  type ScholarScoutData,
  type ScholarScoutDataStore,
} from '@/lib/server/data-store';

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/auth', () => ({ authOptions: {} }), { virtual: true });

class MemoryDataStore implements ScholarScoutDataStore {
  data: ScholarScoutData = {
    users: [],
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

  beforeEach(() => {
    setScholarScoutDataStoreForTests(new MemoryDataStore());
    process.env.SCHOLARSCOUT_STAFF_EMAILS = 'editor@example.com';
    process.env.SCHOLARSCOUT_CATALOGUE_STAFF_CAPABILITIES = JSON.stringify({
      'editor@example.com': ['editor'],
    });
    jest.mocked(getServerSession).mockResolvedValue({
      user: { id: 'editor-1', email: 'editor@example.com' },
    } as never);
  });

  afterEach(() => {
    setScholarScoutDataStoreForTests(null);
    jest.mocked(getServerSession).mockReset();
    restoreEnvironment('SCHOLARSCOUT_STAFF_EMAILS', originalStaffEmails);
    restoreEnvironment('SCHOLARSCOUT_CATALOGUE_STAFF_CAPABILITIES', originalCapabilities);
  });

  it('allows an editor to invite a known account without accepting staff authority from the body', async () => {
    const response = await createInvitation(new Request('http://localhost/api/admin/contributor-media/invitations', {
      method: 'POST',
      body: JSON.stringify({ accountId: 'student-1', staffId: 'forged-staff' }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ invitation: expect.objectContaining({ accountId: 'student-1' }) });
  });

  it('allows only the invited account to create an adult-attested private Draft', async () => {
    await createInvitation(new Request('http://localhost/api/admin/contributor-media/invitations', {
      method: 'POST', body: JSON.stringify({ accountId: 'student-1' }),
    }));
    jest.mocked(getServerSession).mockResolvedValue({
      user: { id: 'student-1', email: 'student@example.com' },
    } as never);

    const response = await attest(new Request('http://localhost/api/contributor-media/attestation', {
      method: 'POST',
      body: JSON.stringify({
        adultAffirmed: true,
        signerName: 'Student One',
        creatorAuthority: true,
        recognisablePeopleConsent: true,
        accountId: 'other-account',
      }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ submission: { status: 'Draft' } });
  });

  it('does not reveal any private contributor fields to unauthenticated or uninvited accounts', async () => {
    jest.mocked(getServerSession).mockResolvedValue(null as never);
    const response = await attest(new Request('http://localhost/api/contributor-media/attestation', {
      method: 'POST', body: JSON.stringify({}),
    }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });
});

function restoreEnvironment(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}
