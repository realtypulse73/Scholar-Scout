import 'server-only';

import { randomUUID } from 'node:crypto';
import { get } from '@vercel/blob';
import mediaInfoFactory from 'mediainfo.js';
import {
  validateContributorMediaPackage,
  validateInspectedContributorVideo,
  createContributorInvitation,
  createEmptyContributorMediaState,
  getActiveContributorInvitation,
  getContributorPrivateStatus,
  type ContributorAttestation,
  type ContributorMediaInvitation,
  type ContributorMediaReviewItem,
  type ContributorMediaState,
  type ContributorMediaSubmission,
  type ContributorPrivateStatus,
} from '@/lib/contributor-media';
import { commitConditionalMutation, type ConditionalMutationResult } from '@/lib/server/persistence-operations';
import type { AccountStudentActor } from '@/lib/server/student-actor';
import type { ActiveStaffActor } from '@/lib/server/active-staff';

export type GrantInvitationResult =
  | { status: 'granted' | 'existing'; invitation: ContributorMediaInvitation }
  | { status: 'unknown-account' }

export type CreateContributorDraftResult =
  | { status: 'created' | 'existing'; submission: ContributorPrivateStatus }
  | { status: 'forbidden' }
  | { status: 'conflict' };

export type IssueContributorMediaUploadResult =
  | { status: 'issued'; capability: { uploadId: string; status: 'Draft'; revision: number } }
  | { status: 'forbidden' | 'invalid-programme' | 'conflict' };

export type CompleteContributorMediaUploadResult =
  | { status: 'ready'; submission: ContributorPrivateStatus }
  | { status: 'action-needed'; submission: ContributorPrivateStatus }
  | { status: 'forbidden' | 'conflict' };

export type ReviewContributorMediaResult =
  | { status: 'approved' | 'action-needed' | 'existing'; submission: ContributorPrivateStatus }
  | { status: 'forbidden' }
  | { status: 'conflict' }
  | { status: 'invalid-link' };

export async function grantContributorMediaInvitation(input: {
  accountId: string;
  staffId: string;
  now?: Date;
}): Promise<ConditionalMutationResult<GrantInvitationResult>> {
  const now = input.now ?? new Date();
  return commitConditionalMutation((data) => {
    if (!data.users.some((user) => user.id === input.accountId)) {
      return { status: 'unknown-account' };
    }

    const state = ensureContributorMediaState(data);
    const existing = getActiveContributorInvitation(state, input.accountId, now);
    if (existing) return { status: 'existing', invitation: existing };

    const invitation = createContributorInvitation({
      accountId: input.accountId,
      createdByStaffId: input.staffId,
      now,
      id: randomUUID(),
    });
    state.invitations.push(invitation);
    return { status: 'granted', invitation };
  });
}

export async function createContributorMediaDraft(input: {
  actor: AccountStudentActor;
  attestation: ContributorAttestation;
  now?: Date;
}): Promise<ConditionalMutationResult<CreateContributorDraftResult>> {
  const now = input.now ?? new Date();
  return commitConditionalMutation((data) => {
    const state = ensureContributorMediaState(data);
    const invitation = getActiveContributorInvitation(state, input.actor.accountId, now);
    if (!invitation) return { status: 'forbidden' };

    const existing = state.submissions.find((submission) => submission.accountId === input.actor.accountId) ?? null;
    if (existing) {
      const matches = existing.signerName === input.attestation.signerName
        && existing.creatorAuthority === input.attestation.creatorAuthority
        && existing.recognisablePeopleConsent === input.attestation.recognisablePeopleConsent;
      return matches
        ? { status: 'existing', submission: { status: existing.status, revision: existing.revision ?? 1 } }
        : { status: 'conflict' };
    }

    const timestamp = now.toISOString();
    const submission: ContributorMediaSubmission = {
      id: randomUUID(),
      accountId: input.actor.accountId,
      status: 'Draft',
      signerName: input.attestation.signerName,
      creatorAuthority: true as const,
      recognisablePeopleConsent: true as const,
      attestedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
      revision: 1,
    };
    state.submissions.push(submission);
    return { status: 'created', submission: { status: 'Draft', revision: 1 } };
  });
}

/** Issues one server-owned quarantine package; object keys never leave this server module. */
export async function issueContributorMediaUpload(input: {
  actor: AccountStudentActor;
  request: unknown;
  now?: Date;
}): Promise<ConditionalMutationResult<IssueContributorMediaUploadResult>> {
  const parsed = validateContributorMediaPackage(input.request);
  if (!parsed.ok) return { status: 'applied', value: { status: 'invalid-programme' } };
  const programmeId = await resolveCanonicalProgrammeId(parsed.value.programmeId);
  if (!programmeId) return { status: 'applied', value: { status: 'invalid-programme' } };
  const now = input.now ?? new Date();
  return commitConditionalMutation((data) => {
    const state = ensureContributorMediaState(data);
    if (!getActiveContributorInvitation(state, input.actor.accountId, now)) return { status: 'forbidden' };
    const submission = state.submissions.find((item) => item.accountId === input.actor.accountId);
    if (!submission || submission.status !== 'Draft' || (submission.revision ?? 1) !== parsed.value.expectedRevision) {
      return { status: 'conflict' };
    }
    const mediaPackage = submission.mediaPackage ?? createPrivateMediaPackage(programmeId);
    if (mediaPackage.programmeId !== programmeId) return { status: 'conflict' };
    submission.mediaPackage = mediaPackage;
    submission.updatedAt = now.toISOString();
    return {
      status: 'issued',
      capability: { uploadId: mediaPackage.id, status: 'Draft', revision: submission.revision ?? 1 },
    };
  });
}

/** Callback-only seam: marks an object received without exposing its private key. */
export async function recordContributorMediaObject(input: {
  uploadId: string;
  kind: 'video' | 'poster';
  contentType: string;
  size: number;
}): Promise<void> {
  const parsed = validateContributorMediaPackage({
    programmeId: 'callback', expectedRevision: 1,
    files: input.kind === 'video'
      ? [{ kind: 'video', contentType: input.contentType, size: input.size }, { kind: 'poster', contentType: 'image/png', size: 1 }]
      : [{ kind: 'video', contentType: 'video/mp4', size: 1 }, { kind: 'poster', contentType: input.contentType, size: input.size }],
  });
  if (!parsed.ok) return;
  await commitConditionalMutation((data) => {
    const state = ensureContributorMediaState(data);
    const submission = state.submissions.find((item) => item.mediaPackage?.id === input.uploadId);
    if (!submission?.mediaPackage) return;
    if (input.kind === 'video') submission.mediaPackage.videoUploaded = true;
    else submission.mediaPackage.posterUploaded = true;
  });
}

export async function completeContributorMediaUpload(input: {
  actor: AccountStudentActor;
  uploadId: string;
  expectedRevision: number;
  now?: Date;
}): Promise<ConditionalMutationResult<CompleteContributorMediaUploadResult>> {
  const now = input.now ?? new Date();
  const inspection = await inspectCurrentPrivatePackage(input.actor.accountId, input.uploadId, input.expectedRevision);
  return commitConditionalMutation((data) => {
    const state = ensureContributorMediaState(data);
    if (!getActiveContributorInvitation(state, input.actor.accountId, now)) return { status: 'forbidden' };
    const submission = state.submissions.find((item) => item.accountId === input.actor.accountId);
    if (!submission || (submission.revision ?? 1) !== input.expectedRevision || submission.mediaPackage?.id !== input.uploadId) {
      return { status: 'conflict' };
    }
    const ready = submission.mediaPackage.videoUploaded && submission.mediaPackage.posterUploaded && inspection.ok;
    submission.status = ready ? 'Ready for review' : 'Action needed';
    submission.updatedAt = now.toISOString();
    const privateStatus = { status: submission.status, revision: submission.revision ?? 1 } as ContributorPrivateStatus;
    return ready ? { status: 'ready', submission: privateStatus } : { status: 'action-needed', submission: privateStatus };
  });
}

export async function getContributorMediaPrivateStatus(
  actor: AccountStudentActor,
  now = new Date(),
): Promise<ContributorPrivateStatus | null> {
  const { readScholarScoutData } = await import('@/lib/server/data-store');
  const state = ensureContributorMediaState(await readScholarScoutData());
  const invitation = getActiveContributorInvitation(state, actor.accountId, now);
  const submission = state.submissions.find((candidate) => candidate.accountId === actor.accountId) ?? null;
  return getContributorPrivateStatus({
    accountId: actor.accountId,
    invitation,
    submission,
  });
}

/** Reads attestation and inspection evidence only for independently authorized staff review. */
export async function getContributorMediaReviewQueue(): Promise<ContributorMediaReviewItem[]> {
  const { readScholarScoutData } = await import('@/lib/server/data-store');
  const data = await readScholarScoutData();
  const state = ensureContributorMediaState(data);
  const candidates = data.cataloguePublicationState?.candidates ?? [];
  const governedProgrammeIds = await getGovernedProgrammeIds();
  return state.submissions
    .filter((submission) => (
      submission.status === 'Ready for review'
      && submission.mediaPackage
      && isCurrentCandidate(candidates, submission.mediaPackage.programmeId)
      && governedProgrammeIds.has(submission.mediaPackage.programmeId)
    ))
    .map((submission) => ({
      id: submission.id,
      accountId: submission.accountId,
      status: submission.status as ContributorMediaReviewItem['status'],
      revision: submission.revision ?? 1,
      programmeId: submission.mediaPackage!.programmeId,
      signerName: submission.signerName,
      attestedAt: submission.attestedAt,
      creatorAuthority: true as const,
      recognisablePeopleConsent: true as const,
      videoUploaded: submission.mediaPackage!.videoUploaded,
      posterUploaded: submission.mediaPackage!.posterUploaded,
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

/** Applies one private, revision-checked reviewer decision without creating a public media projection. */
export async function reviewContributorMedia(input: {
  actor: ActiveStaffActor;
  submissionId: string;
  expectedRevision: number;
  decision: 'approve' | 'action-needed';
  now?: Date;
}): Promise<ConditionalMutationResult<ReviewContributorMediaResult>> {
  if (!(input.actor.capabilities instanceof Set) || !input.actor.capabilities.has('reviewer')) {
    return { status: 'applied', value: { status: 'forbidden' } };
  }
  if (!isContributorSubmissionId(input.submissionId) || !Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 1) {
    return { status: 'applied', value: { status: 'conflict' } };
  }
  const governedProgrammeIds = await getGovernedProgrammeIds();
  const now = input.now ?? new Date();
  return commitConditionalMutation((data) => {
    const state = ensureContributorMediaState(data);
    const submission = state.submissions.find((item) => item.id === input.submissionId);
    if (!submission || !submission.mediaPackage || submission.accountId === input.actor.id) {
      return { status: 'forbidden' };
    }
    if (!governedProgrammeIds.has(submission.mediaPackage.programmeId)) return { status: 'invalid-link' };
    const revision = submission.revision ?? 1;
    if (submission.status === 'Approved for release') {
      return submission.reviewerId === input.actor.id && revision === input.expectedRevision
        ? { status: 'existing', submission: { status: submission.status, revision } }
        : { status: 'conflict' };
    }
    if (submission.status !== 'Ready for review' || revision !== input.expectedRevision) {
      return { status: 'conflict' };
    }
    const candidate = (data.cataloguePublicationState?.candidates ?? [])
      .find((item) => item.id === submission.mediaPackage!.programmeId);
    if (!candidate || !isCurrentCandidate([candidate], submission.mediaPackage.programmeId)) {
      return { status: 'invalid-link' };
    }
    const nextRevision = revision + 1;
    submission.status = input.decision === 'approve' ? 'Approved for release' : 'Action needed';
    submission.revision = nextRevision;
    submission.updatedAt = now.toISOString();
    if (input.decision === 'approve') {
      submission.reviewerId = input.actor.id;
      submission.reviewedAt = submission.updatedAt;
      submission.releaseCandidateId = candidate.id;
      submission.releaseCandidateRevision = candidate.revision;
    }
    return {
      status: input.decision === 'approve' ? 'approved' : 'action-needed',
      submission: { status: submission.status, revision: nextRevision },
    };
  });
}

function ensureContributorMediaState(data: { contributorMediaState?: ContributorMediaState }): ContributorMediaState {
  if (!data.contributorMediaState) {
    data.contributorMediaState = createEmptyContributorMediaState();
  }
  return data.contributorMediaState;
}

function createPrivateMediaPackage(programmeId: string) {
  const id = randomUUID();
  return {
    id,
    programmeId,
    videoObjectKey: `contributor-media/${id}/video.mp4`,
    posterObjectKey: `contributor-media/${id}/poster.png`,
    videoUploaded: false,
    posterUploaded: false,
  };
}

function isCurrentCandidate(candidates: Array<{
  id: string;
  revision: number;
  lifecycle: string;
  retirementIntent?: boolean;
  approval: { revision: number } | null;
}>, programmeId: string): boolean {
  return candidates.some((candidate) => (
    candidate.id === programmeId
    && candidate.lifecycle === 'approved'
    && !candidate.retirementIntent
    && candidate.approval?.revision === candidate.revision
  ));
}

async function getGovernedProgrammeIds(): Promise<Set<string>> {
  const { getGovernedProgrammes } = await import('@/lib/server/programme-records');
  const programmes = await getGovernedProgrammes();
  return new Set(programmes
    .filter((programme) => (programme.publicationStatus ?? 'published') === 'published')
    .map((programme) => programme.id));
}

function isContributorSubmissionId(value: string): boolean {
  return /^[a-zA-Z0-9:_-]{1,160}$/.test(value);
}

async function resolveCanonicalProgrammeId(programmeId: string): Promise<string | null> {
  const { getGovernedProgrammes } = await import('@/lib/server/programme-records');
  const programmes = await getGovernedProgrammes();
  const programme = programmes.find((item) => item.id === programmeId && (item.publicationStatus ?? 'published') === 'published');
  return programme?.id ?? null;
}

async function inspectCurrentPrivatePackage(
  accountId: string,
  uploadId: string,
  expectedRevision: number,
): Promise<{ ok: boolean }> {
  const { readScholarScoutData } = await import('@/lib/server/data-store');
  const submission = (await readScholarScoutData()).contributorMediaState?.submissions
    .find((item) => item.accountId === accountId && (item.revision ?? 1) === expectedRevision
      && item.mediaPackage?.id === uploadId);
  if (!submission?.mediaPackage?.videoUploaded || !submission.mediaPackage.posterUploaded) return { ok: false };
  return inspectPrivateMediaPackage(submission.mediaPackage.videoObjectKey, submission.mediaPackage.posterObjectKey);
}

/** Uses Vercel's automatic OIDC credentials scoped to the connected private store. */
async function inspectPrivateMediaPackage(videoObjectKey: string, posterObjectKey: string): Promise<{ ok: boolean }> {
  const storeId = process.env.SCHOLARSCOUT_PRIVATE_MEDIA_STORE_ID;
  if (!storeId) return { ok: false };
  try {
    const [video, poster] = await Promise.all([
      get(videoObjectKey, { access: 'private', storeId, useCache: false }),
      get(posterObjectKey, { access: 'private', storeId, useCache: false }),
    ]);
    if (!video || !poster || video.statusCode !== 200 || poster.statusCode !== 200
      || video.blob.contentType !== 'video/mp4' || !['image/jpeg', 'image/png'].includes(poster.blob.contentType)
      || video.blob.size > 25 * 1024 * 1024 || poster.blob.size > 5 * 1024 * 1024) return { ok: false };
    const bytes = new Uint8Array(await new Response(video.stream).arrayBuffer());
    const mediaInfo = await mediaInfoFactory({ format: 'object', chunkSize: 1_048_576 });
    const result = await mediaInfo.analyzeData(bytes.byteLength, (size, offset) => bytes.slice(offset, offset + size));
    mediaInfo.close();
    const general = result.media?.track.find((track) => track['@type'] === 'General');
    const durationMs = typeof general?.Duration === 'number' ? Math.round(general.Duration) : Number.NaN;
    return validateInspectedContributorVideo({ contentType: video.blob.contentType, durationMs });
  } catch {
    return { ok: false };
  }
}
