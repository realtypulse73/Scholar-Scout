import 'server-only';

import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/auth';
import {
  appendPrivilegedOperationAudit,
  getPrivilegedOperationAuditEvents,
} from '@/lib/server/data-store';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ActiveStaffActor {
  id: string;
}

export type ActiveStaffAuthorization =
  | { ok: true; actor: ActiveStaffActor }
  | { ok: false; response: NextResponse };

/** Requires a current, strictly configured staff allowlist match before a privileged action. */
export async function requireActiveStaff(input: {
  action: string;
  route: string;
}): Promise<ActiveStaffAuthorization> {
  const session = await getServerSession(authOptions);
  const actorId = session?.user?.id?.trim() || 'anonymous';
  const email = session?.user?.email;
  const allowedEmails = parseActiveStaffEmails(
    process.env.SCHOLARSCOUT_STAFF_EMAILS,
  );
  const isAllowed =
    actorId !== 'anonymous' &&
    typeof email === 'string' &&
    allowedEmails !== null &&
    allowedEmails.has(normalizeEmail(email));

  await appendPrivilegedOperationAudit({
    actorId,
    action: input.action,
    route: input.route,
    outcome: isAllowed ? 'allowed' : 'denied',
  });

  if (!isAllowed) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { ok: true, actor: { id: actorId } };
}

export { getPrivilegedOperationAuditEvents };

function parseActiveStaffEmails(value: string | undefined): Set<string> | null {
  if (!value || !value.trim()) {
    return null;
  }

  const emails = value.split(',').map((item) => normalizeEmail(item));
  if (emails.some((email) => !EMAIL_PATTERN.test(email))) {
    return null;
  }

  const allowedEmails = new Set(emails);
  return allowedEmails.size === emails.length ? allowedEmails : null;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
