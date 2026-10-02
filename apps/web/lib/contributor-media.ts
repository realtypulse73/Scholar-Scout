export const CONTRIBUTOR_INVITATION_TTL_MS = 14 * 24 * 60 * 60 * 1_000;
const MAX_SIGNER_NAME_LENGTH = 120;
const SIGNER_NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u;

export type ContributorInvitationStatus = 'active' | 'disabled' | 'withdrawn';
export const CONTRIBUTOR_VIDEO_MAX_BYTES = 25 * 1024 * 1024;
export const CONTRIBUTOR_POSTER_MAX_BYTES = 5 * 1024 * 1024;
export const CONTRIBUTOR_VIDEO_MAX_DURATION_MS = 30_000;

export type ContributorSubmissionStatus = 'Draft' | 'Ready for review' | 'Action needed' | 'Approved for release';
export type ContributorMediaFileKind = 'video' | 'poster';

export interface ContributorMediaFile {
  kind: ContributorMediaFileKind;
  contentType: string;
  size: number;
}

export interface ContributorMediaPackageRequest {
  programmeId: string;
  expectedRevision: number;
  files: ContributorMediaFile[];
}

export interface ContributorPrivateMediaPackage {
  id: string;
  programmeId: string;
  videoObjectKey: string;
  posterObjectKey: string;
  videoUploaded: boolean;
  posterUploaded: boolean;
}

export interface ContributorMediaInvitation {
  id: string;
  accountId: string;
  createdByStaffId: string;
  status: ContributorInvitationStatus;
  createdAt: string;
  expiresAt: string;
}

export interface ContributorMediaSubmission {
  id: string;
  accountId: string;
  status: ContributorSubmissionStatus;
  signerName: string;
  creatorAuthority: true;
  recognisablePeopleConsent: true;
  attestedAt: string;
  createdAt: string;
  updatedAt: string;
  revision?: number;
  mediaPackage?: ContributorPrivateMediaPackage;
  reviewerId?: string;
  reviewedAt?: string;
  releaseCandidateId?: string;
  releaseCandidateRevision?: number;
}

export interface ContributorMediaState {
  invitations: ContributorMediaInvitation[];
  submissions: ContributorMediaSubmission[];
}

export interface ContributorAttestation {
  adultAffirmed: true;
  signerName: string;
  creatorAuthority: true;
  recognisablePeopleConsent: true;
}

export type ContributorAttestationValidation =
  | { ok: true; value: ContributorAttestation }
  | { ok: false; error: 'adult-required' | 'invalid-signer' | 'authority-required' | 'recognisable-people-consent-required' };

export interface ContributorPrivateStatus {
  status: ContributorSubmissionStatus;
  revision: number;
}

/** Private reviewer-only evidence. This DTO must never cross a learner-facing route. */
export interface ContributorMediaReviewItem {
  id: string;
  accountId: string;
  status: 'Ready for review' | 'Action needed' | 'Approved for release';
  revision: number;
  programmeId: string;
  signerName: string;
  attestedAt: string;
  creatorAuthority: true;
  recognisablePeopleConsent: true;
  videoUploaded: boolean;
  posterUploaded: boolean;
}

export function createEmptyContributorMediaState(): ContributorMediaState {
  return { invitations: [], submissions: [] };
}

export function createContributorInvitation(input: {
  accountId: string;
  createdByStaffId: string;
  now: Date;
  id?: string;
}): ContributorMediaInvitation {
  const createdAt = input.now.toISOString();
  return {
    id: input.id ?? `invitation-${input.accountId}-${input.now.getTime()}`,
    accountId: input.accountId,
    createdByStaffId: input.createdByStaffId,
    status: 'active',
    createdAt,
    expiresAt: new Date(input.now.getTime() + CONTRIBUTOR_INVITATION_TTL_MS).toISOString(),
  };
}

export function validateContributorAttestation(input: unknown): ContributorAttestationValidation {
  if (!isExactAttestation(input)) return { ok: false, error: 'adult-required' };
  if (input.adultAffirmed !== true) return { ok: false, error: 'adult-required' };
  if (input.creatorAuthority !== true) return { ok: false, error: 'authority-required' };
  if (input.recognisablePeopleConsent !== true) return { ok: false, error: 'recognisable-people-consent-required' };

  const signerName = normalizeSignerName(input.signerName);
  if (signerName === null) return { ok: false, error: 'invalid-signer' };

  return {
    ok: true,
    value: {
      adultAffirmed: true,
      signerName,
      creatorAuthority: true,
      recognisablePeopleConsent: true,
    },
  };
}

export function getActiveContributorInvitation(
  state: ContributorMediaState,
  accountId: string,
  now: Date,
): ContributorMediaInvitation | null {
  return state.invitations.find((invitation) => (
    invitation.accountId === accountId
    && invitation.status === 'active'
    && invitation.expiresAt > now.toISOString()
  )) ?? null;
}

export function getContributorPrivateStatus(input: {
  accountId: string;
  invitation: ContributorMediaInvitation | null;
  submission: ContributorMediaSubmission | null;
}): ContributorPrivateStatus | null {
  if (
    !input.invitation
    || !input.submission
    || input.invitation.accountId !== input.accountId
    || input.submission.accountId !== input.accountId
  ) {
    return null;
  }
  return { status: input.submission.status, revision: input.submission.revision ?? 1 };
}

export function validateContributorMediaPackage(input: unknown):
  | { ok: true; value: ContributorMediaPackageRequest }
  | { ok: false; error: 'invalid-package' } {
  if (!isRecord(input) || !isStableId(input.programmeId) || !isRevision(input.expectedRevision)
    || !Array.isArray(input.files) || input.files.length !== 2) {
    return { ok: false, error: 'invalid-package' };
  }
  const files = input.files.map(parseMediaFile);
  if (files.some((file) => file === null)) return { ok: false, error: 'invalid-package' };
  const typedFiles = files as ContributorMediaFile[];
  const video = typedFiles.filter((file) => file.kind === 'video');
  const poster = typedFiles.filter((file) => file.kind === 'poster');
  if (video.length !== 1 || poster.length !== 1 || video[0].contentType !== 'video/mp4'
    || !['image/jpeg', 'image/png'].includes(poster[0].contentType)
    || video[0].size > CONTRIBUTOR_VIDEO_MAX_BYTES || poster[0].size > CONTRIBUTOR_POSTER_MAX_BYTES) {
    return { ok: false, error: 'invalid-package' };
  }
  return {
    ok: true,
    value: { programmeId: input.programmeId, expectedRevision: input.expectedRevision, files: typedFiles },
  };
}

export function validateInspectedContributorVideo(input: unknown):
  | { ok: true }
  | { ok: false; error: 'invalid-video' } {
  const durationMs = isRecord(input) ? input.durationMs : undefined;
  if (!isRecord(input) || input.contentType !== 'video/mp4'
    || !Number.isInteger(durationMs) || typeof durationMs !== 'number' || durationMs < 0
    || durationMs > CONTRIBUTOR_VIDEO_MAX_DURATION_MS) {
    return { ok: false, error: 'invalid-video' };
  }
  return { ok: true };
}

export function isContributorMediaState(input: unknown): input is ContributorMediaState {
  if (!isRecord(input) || !Array.isArray(input.invitations) || !Array.isArray(input.submissions)) {
    return false;
  }
  return input.invitations.every(isContributorInvitation)
    && input.submissions.every(isContributorSubmission);
}

function isExactAttestation(input: unknown): input is Record<string, unknown> {
  if (!isRecord(input)) return false;
  const keys = Object.keys(input);
  return keys.length === 4 && keys.every((key) => (
    key === 'adultAffirmed'
    || key === 'signerName'
    || key === 'creatorAuthority'
    || key === 'recognisablePeopleConsent'
  ));
}

function normalizeSignerName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.normalize('NFC').trim();
  if (!normalized || normalized.length > MAX_SIGNER_NAME_LENGTH || !SIGNER_NAME_PATTERN.test(normalized)) {
    return null;
  }
  return normalized;
}

function isContributorInvitation(input: unknown): input is ContributorMediaInvitation {
  return isRecord(input)
    && typeof input.id === 'string'
    && typeof input.accountId === 'string'
    && typeof input.createdByStaffId === 'string'
    && (input.status === 'active' || input.status === 'disabled' || input.status === 'withdrawn')
    && isTimestamp(input.createdAt)
    && isTimestamp(input.expiresAt);
}

function isContributorSubmission(input: unknown): input is ContributorMediaSubmission {
  return isRecord(input)
    && typeof input.id === 'string'
    && typeof input.accountId === 'string'
    && (input.status === 'Draft' || input.status === 'Ready for review' || input.status === 'Action needed'
      || input.status === 'Approved for release')
    && normalizeSignerName(input.signerName) === input.signerName
    && input.creatorAuthority === true
    && input.recognisablePeopleConsent === true
    && isTimestamp(input.attestedAt)
    && isTimestamp(input.createdAt)
    && isTimestamp(input.updatedAt)
    && (input.revision === undefined || isRevision(input.revision))
    && (input.mediaPackage === undefined || isPrivateMediaPackage(input.mediaPackage))
    && (input.reviewerId === undefined || isStableId(input.reviewerId))
    && (input.reviewedAt === undefined || isTimestamp(input.reviewedAt))
    && (input.releaseCandidateId === undefined || isStableId(input.releaseCandidateId))
    && (input.releaseCandidateRevision === undefined || isRevision(input.releaseCandidateRevision))
    && (input.status !== 'Approved for release' || (
      isStableId(input.reviewerId)
      && isTimestamp(input.reviewedAt)
      && isStableId(input.releaseCandidateId)
      && isRevision(input.releaseCandidateRevision)
    ));
}

function parseMediaFile(input: unknown): ContributorMediaFile | null {
  const size = isRecord(input) ? input.size : undefined;
  if (!isRecord(input) || (input.kind !== 'video' && input.kind !== 'poster')
    || typeof input.contentType !== 'string' || !Number.isSafeInteger(size)
    || typeof size !== 'number' || size < 1) return null;
  return { kind: input.kind, contentType: input.contentType, size };
}

function isPrivateMediaPackage(input: unknown): input is ContributorPrivateMediaPackage {
  return isRecord(input) && isStableId(input.id) && isStableId(input.programmeId)
    && isObjectKey(input.videoObjectKey) && isObjectKey(input.posterObjectKey)
    && typeof input.videoUploaded === 'boolean' && typeof input.posterUploaded === 'boolean';
}

function isStableId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9:_-]{1,160}$/.test(value);
}

function isObjectKey(value: unknown): value is string {
  return typeof value === 'string' && /^contributor-media\/[a-zA-Z0-9_-]{1,160}\/(video|poster)\.(mp4|jpg|png)$/.test(value);
}

function isRevision(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
