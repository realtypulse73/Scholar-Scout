import 'server-only';

import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/auth';
import {
  appendPrivilegedOperationAudit,
  getPrivilegedOperationAuditEvents,
} from '@/lib/server/data-store';
import type { CataloguePublicationCapability } from '@/lib/catalogue-publication';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ActiveStaffActor {
  id: string;
  email?: string;
  capabilities?: Set<CataloguePublicationCapability>;
}

export type ActiveStaffAuthorization =
  | { ok: true; actor: ActiveStaffActor }
  | { ok: false; response: NextResponse };

/** Requires a current, strictly configured staff allowlist match before a privileged action. */
export async function requireActiveStaff(input: {
  action: string;
  route: string;
  capability?: CataloguePublicationCapability;
}): Promise<ActiveStaffAuthorization> {
  const session = await getServerSession(authOptions);
  const actorId = session?.user?.id?.trim() || 'anonymous';
  const email = session?.user?.email;
  const allowedEmails = parseActiveStaffEmails(
    process.env.SCHOLARSCOUT_STAFF_EMAILS,
  );
  const normalizedEmail = typeof email === 'string' ? normalizeEmail(email) : '';
  const capabilities = isAllowedForEmail(
    normalizedEmail,
    process.env.SCHOLARSCOUT_CATALOGUE_STAFF_CAPABILITIES,
  );
  const isAllowed =
    actorId !== 'anonymous' &&
    typeof email === 'string' &&
    allowedEmails !== null &&
    allowedEmails.has(normalizedEmail) &&
    (!input.capability || capabilities?.has(input.capability));

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

  return {
    ok: true,
    actor: {
      id: actorId,
      email: normalizedEmail,
      capabilities: capabilities ?? new Set(),
    },
  };
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

function isAllowedForEmail(
  email: string,
  value: string | undefined,
): Set<CataloguePublicationCapability> | null {
  if (!value || !value.trim()) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

  const entries = Object.entries(parsed as Record<string, unknown>);
  const normalizedKeys = entries.map(([key]) => normalizeEmail(key));
  if (normalizedKeys.some((key) => !EMAIL_PATTERN.test(key))
    || new Set(normalizedKeys).size !== normalizedKeys.length) return null;

  const matched = entries.find(([key]) => normalizeEmail(key) === email)?.[1];
  if (!Array.isArray(matched) || matched.length === 0) return null;
  const capabilities = new Set<CataloguePublicationCapability>();
  for (const capability of matched) {
    if (capability !== 'editor' && capability !== 'reviewer' && capability !== 'administrator') {
      return null;
    }
    if (capabilities.has(capability)) return null;
    capabilities.add(capability);
  }
  return capabilities;
}
