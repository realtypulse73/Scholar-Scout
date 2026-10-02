import {
  createContributorMediaPublicProjection,
  createContributorInvitation,
  getContributorPrivateStatus,
  isContributorMediaState,
  validateContributorMediaPackage,
  validateInspectedContributorVideo,
  validateContributorAttestation,
} from '@/lib/contributor-media';

describe('contributor media domain contracts', () => {
  it('creates a fixed anonymous learner projection from only an opaque public ID', () => {
    const projection = createContributorMediaPublicProjection('public-media-opaque-id');

    expect(projection).toEqual({
      publicId: 'public-media-opaque-id',
      mediaRoute: '/api/catalogue-media/public-media-opaque-id',
      label: 'Student-contributed perspective',
      nonEndorsement: 'This student-contributed perspective does not represent school endorsement.',
    });
    expect(JSON.stringify(projection)).not.toMatch(/account|signer|attest|blob|object|review|audit/i);
  });

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
    })).toEqual({ status: 'Draft', revision: 1 });
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

  it('accepts exactly one bounded MP4 and JPEG/PNG poster package', () => {
    expect(validateContributorMediaPackage({
      programmeId: 'programme-1',
      expectedRevision: 1,
      files: [
        { kind: 'video', contentType: 'video/mp4', size: 25 * 1024 * 1024 },
        { kind: 'poster', contentType: 'image/jpeg', size: 5 * 1024 * 1024 },
      ],
    })).toEqual({
      ok: true,
      value: {
        programmeId: 'programme-1',
        expectedRevision: 1,
        files: [
          { kind: 'video', contentType: 'video/mp4', size: 25 * 1024 * 1024 },
          { kind: 'poster', contentType: 'image/jpeg', size: 5 * 1024 * 1024 },
        ],
      },
    });
  });

  it('fails closed for invalid package counts, MIME claims, byte limits, and inspected duration', () => {
    expect(validateContributorMediaPackage({
      programmeId: 'programme-1', expectedRevision: 1, files: [],
    }).ok).toBe(false);
    expect(validateContributorMediaPackage({
      programmeId: 'programme-1',
      expectedRevision: 1,
      files: [
        { kind: 'video', contentType: 'video/quicktime', size: 100 },
        { kind: 'poster', contentType: 'image/png', size: 100 },
      ],
    }).ok).toBe(false);
    expect(validateContributorMediaPackage({
      programmeId: 'programme-1',
      expectedRevision: 1,
      files: [
        { kind: 'video', contentType: 'video/mp4', size: 25 * 1024 * 1024 + 1 },
        { kind: 'poster', contentType: 'image/png', size: 100 },
      ],
    }).ok).toBe(false);
    expect(validateInspectedContributorVideo({
      contentType: 'video/mp4', durationMs: 30_000,
    })).toEqual({ ok: true });
    expect(validateInspectedContributorVideo({
      contentType: 'video/mp4', durationMs: 30_001,
    })).toEqual({ ok: false, error: 'invalid-video' });
    expect(validateInspectedContributorVideo(null)).toEqual({ ok: false, error: 'invalid-video' });
  });
});

describe('reviewed contributor media lifecycle', () => {
  it('accepts a private approved submission with review identity while preserving it as private state', () => {
    expect(isContributorMediaState({
      invitations: [],
      submissions: [{
        id: 'submission-1',
        accountId: 'contributor-1',
        status: 'Approved for release',
        signerName: 'Taylor Contributor',
        creatorAuthority: true,
        recognisablePeopleConsent: true,
        attestedAt: '2026-10-02T12:00:00.000Z',
        createdAt: '2026-10-02T12:00:00.000Z',
        updatedAt: '2026-10-02T12:00:00.000Z',
        revision: 2,
        reviewerId: 'reviewer-1',
        reviewedAt: '2026-10-02T12:00:00.000Z',
        releaseCandidateId: 'programme-1',
        releaseCandidateRevision: 3,
      }],
    })).toBe(true);
  });

  it('accepts only the bounded approval modes and keeps the Preview demo projection anonymous', () => {
    const previewProjection = createContributorMediaPublicProjection(
      'public-media-opaque-id',
      'preview-owner-demo',
    );
    expect(previewProjection).toEqual({
      publicId: 'public-media-opaque-id',
      mediaRoute: '/api/catalogue-media/public-media-opaque-id',
      label: 'Preview demo: Student-contributed perspective',
      nonEndorsement: 'This student-contributed perspective does not represent school endorsement.',
    });
    expect(JSON.stringify(previewProjection)).not.toMatch(/account|signer|attest|blob|object|review|audit|provider|rank|analytics/i);

    expect(isContributorMediaState({
      invitations: [],
      submissions: [{
        id: 'submission-preview', accountId: 'owner-1', status: 'Approved for release', signerName: 'Preview Owner',
        creatorAuthority: true, recognisablePeopleConsent: true,
        attestedAt: '2026-10-02T12:00:00.000Z', createdAt: '2026-10-02T12:00:00.000Z', updatedAt: '2026-10-02T12:00:00.000Z',
        revision: 2, reviewerId: 'owner-1', reviewedAt: '2026-10-02T12:00:00.000Z',
        releaseCandidateId: 'programme-1', releaseCandidateRevision: 3,
        approvalMode: 'preview-owner-demo',
      }],
    })).toBe(true);
    expect(isContributorMediaState({
      invitations: [],
      submissions: [{
        id: 'submission-invalid', accountId: 'owner-1', status: 'Approved for release', signerName: 'Preview Owner',
        creatorAuthority: true, recognisablePeopleConsent: true,
        attestedAt: '2026-10-02T12:00:00.000Z', createdAt: '2026-10-02T12:00:00.000Z', updatedAt: '2026-10-02T12:00:00.000Z',
        revision: 2, reviewerId: 'owner-1', reviewedAt: '2026-10-02T12:00:00.000Z',
        releaseCandidateId: 'programme-1', releaseCandidateRevision: 3,
        approvalMode: 'unbounded-exception',
      }],
    })).toBe(false);
  });
});
