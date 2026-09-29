import 'server-only';

import { randomUUID } from 'node:crypto';
import {
  createContributorInvitation,
  createEmptyContributorMediaState,
  getActiveContributorInvitation,
  getContributorPrivateStatus,
  type ContributorAttestation,
  type ContributorMediaInvitation,
  type ContributorMediaState,
  type ContributorMediaSubmission,
  type ContributorPrivateStatus,
} from '@/lib/contributor-media';
import { commitConditionalMutation, type ConditionalMutationResult } from '@/lib/server/persistence-operations';
import type { AccountStudentActor } from '@/lib/server/student-actor';

export type GrantInvitationResult =
  | { status: 'granted' | 'existing'; invitation: ContributorMediaInvitation }
  | { status: 'unknown-account' }

export type CreateContributorDraftResult =
  | { status: 'created' | 'existing'; submission: ContributorPrivateStatus }
  | { status: 'forbidden' }
  | { status: 'conflict' };

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
        ? { status: 'existing', submission: { status: existing.status } }
        : { status: 'conflict' };
    }

    const timestamp = now.toISOString();
    const submission: ContributorMediaSubmission = {
      id: randomUUID(),
      accountId: input.actor.accountId,
      status: 'Draft',
      signerName: input.attestation.signerName,
      creatorAuthority: true,
      recognisablePeopleConsent: true,
      attestedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    state.submissions.push(submission);
    return { status: 'created', submission: { status: 'Draft' } };
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

function ensureContributorMediaState(data: { contributorMediaState?: ContributorMediaState }): ContributorMediaState {
  if (!data.contributorMediaState) {
    data.contributorMediaState = createEmptyContributorMediaState();
  }
  return data.contributorMediaState;
}
