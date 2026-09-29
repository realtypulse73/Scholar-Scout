import {
  createContributorInvitation,
  getContributorPrivateStatus,
  validateContributorAttestation,
} from '@/lib/contributor-media';

describe('contributor media domain contracts', () => {
  it('normalizes a valid adult attestation without exposing its signer publicly', () => {
    const result = validateContributorAttestation({
      adultAffirmed: true,
      signerName: '  Zoë Contributor  ',
      creatorAuthority: true,
      recognisablePeopleConsent: true,
    });

    expect(result).toEqual({
      ok: true,
      value: {
        adultAffirmed: true,
        signerName: 'Zoë Contributor',
        creatorAuthority: true,
        recognisablePeopleConsent: true,
      },
    });
  });

  it('rejects blank, malformed, and under-age declarations', () => {
    expect(validateContributorAttestation({
      adultAffirmed: false,
      signerName: 'Student',
      creatorAuthority: true,
      recognisablePeopleConsent: true,
    }).ok).toBe(false);
    expect(validateContributorAttestation({
      adultAffirmed: true,
      signerName: '   ',
      creatorAuthority: true,
      recognisablePeopleConsent: true,
    }).ok).toBe(false);
    expect(validateContributorAttestation({
      adultAffirmed: true,
      signerName: 'Student <script>',
      creatorAuthority: true,
      recognisablePeopleConsent: true,
    }).ok).toBe(false);
  });

  it('creates one active 14-day invitation and projects only a redacted private status', () => {
    const invitation = createContributorInvitation({
      accountId: 'student-1',
      createdByStaffId: 'editor-1',
      now: new Date('2026-09-29T00:00:00.000Z'),
    });

    expect(invitation.accountId).toBe('student-1');
    expect(invitation.expiresAt).toBe('2026-10-13T00:00:00.000Z');
    expect(getContributorPrivateStatus({
      accountId: 'student-1',
      invitation,
      submission: {
        id: 'submission-1',
        accountId: 'student-1',
        status: 'Draft',
        signerName: 'Private Signer',
        creatorAuthority: true,
        recognisablePeopleConsent: true,
        attestedAt: '2026-09-29T00:00:00.000Z',
        createdAt: '2026-09-29T00:00:00.000Z',
        updatedAt: '2026-09-29T00:00:00.000Z',
      },
    })).toEqual({ status: 'Draft' });
  });

  it('never projects a private status when the invitation belongs to another account', () => {
    const invitation = createContributorInvitation({
      accountId: 'student-1',
      createdByStaffId: 'editor-1',
      now: new Date('2026-09-29T00:00:00.000Z'),
    });

    expect(getContributorPrivateStatus({
      accountId: 'student-2',
      invitation,
      submission: {
        id: 'submission-2',
        accountId: 'student-2',
        status: 'Draft',
        signerName: 'Private Signer',
        creatorAuthority: true,
        recognisablePeopleConsent: true,
        attestedAt: '2026-09-29T00:00:00.000Z',
        createdAt: '2026-09-29T00:00:00.000Z',
        updatedAt: '2026-09-29T00:00:00.000Z',
      },
    })).toBeNull();
  });

  it('rejects overlong Unicode-normalized signer values without accepting an alternative attestation shape', () => {
    expect(validateContributorAttestation({
      adultAffirmed: true,
      signerName: 'A'.repeat(121),
      creatorAuthority: true,
      recognisablePeopleConsent: true,
    }).ok).toBe(false);
    expect(validateContributorAttestation({
      adultAffirmed: true,
      signerName: 'Student One',
      creatorAuthority: true,
      recognisablePeopleConsent: true,
      other: true,
    }).ok).toBe(false);
  });
});
