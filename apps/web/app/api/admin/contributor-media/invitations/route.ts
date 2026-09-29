import { NextResponse } from 'next/server';
import { isExactObject, parseJsonRequest } from '@/lib/api-request';
import { grantContributorMediaInvitation } from '@/lib/server/contributor-media';
import { requireActiveStaff } from '@/lib/server/active-staff';

const MAX_INVITATION_REQUEST_BYTES = 1024;

export async function POST(request: Request) {
  const authorization = await requireActiveStaff({
    action: 'contributor-media:invite',
    route: '/api/admin/contributor-media/invitations',
    capability: 'editor',
  });
  if (!authorization.ok) return authorization.response;

  const body = await parseJsonRequest(request, {
    maxBytes: MAX_INVITATION_REQUEST_BYTES,
    validate: parseInvitationRequest,
  });
  if (!body.ok) {
    return NextResponse.json(
      { error: 'Invalid contributor invitation.' },
      { status: body.error === 'body-too-large' ? 413 : 400 },
    );
  }

  const result = await grantContributorMediaInvitation({
    accountId: body.value.accountId,
    staffId: authorization.actor.id,
  });
  if (result.status === 'conflict') {
    return NextResponse.json(
      { error: 'Contributor invitations changed. Reload and try again.', category: 'conflict', action: 'reload' },
      { status: 409 },
    );
  }
  if (result.value.status === 'unknown-account') {
    return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  }

  return NextResponse.json({
    invitation: {
      accountId: result.value.invitation.accountId,
      expiresAt: result.value.invitation.expiresAt,
    },
  });
}

function parseInvitationRequest(value: unknown): { accountId: string } | null {
  if (!isExactObject(value, ['accountId']) || typeof value.accountId !== 'string') return null;
  const accountId = value.accountId.trim();
  return accountId && accountId.length <= 200 ? { accountId } : null;
}
