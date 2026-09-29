export const CONTRIBUTOR_INVITATION_TTL_MS = 14 * 24 * 60 * 60 * 1_000;
const MAX_SIGNER_NAME_LENGTH = 120;
const SIGNER_NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u;

export type ContributorInvitationStatus = 'active' | 'disabled' | 'withdrawn';
export type ContributorSubmissionStatus = 'Draft';

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
  if (!input.invitation || !input.submission || input.submission.accountId !== input.accountId) {
    return null;
  }
  return { status: input.submission.status };
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
    && input.status === 'Draft'
    && normalizeSignerName(input.signerName) === input.signerName
    && input.creatorAuthority === true
    && input.recognisablePeopleConsent === true
    && isTimestamp(input.attestedAt)
    && isTimestamp(input.createdAt)
    && isTimestamp(input.updatedAt);
}

function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
