import 'server-only';

import type { ActiveStaffActor } from '@/lib/server/active-staff';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REQUIRED_CAPABILITIES = ['editor', 'reviewer', 'administrator'] as const;

export type PreviewOwnerMediaDemoEnvironment = Readonly<Record<string, string | undefined>>;

/** Returns true only for the exact server-only Preview runtime configuration. */
export function isPreviewOwnerMediaDemoRuntime(
  environment: PreviewOwnerMediaDemoEnvironment = process.env,
): boolean {
  return environment.VERCEL === '1'
    && environment.VERCEL_ENV === 'preview'
    && environment.SCHOLARSCOUT_PREVIEW_OWNER_MEDIA_DEMO === 'true'
    && normalizeSingleEmail(environment.SCHOLARSCOUT_PREVIEW_OWNER_MEDIA_DEMO_OWNER_EMAIL) !== null;
}

/**
 * Authorizes the narrowly configured owner-only demo exception. This server-only
 * check deliberately fails closed unless the trusted actor and Vercel Preview
 * runtime exactly match the bounded production configuration.
 */
export function isPreviewOwnerMediaDemoActor(
  actor: ActiveStaffActor,
  environment: PreviewOwnerMediaDemoEnvironment = process.env,
): boolean {
  if (
    !isPreviewOwnerMediaDemoRuntime(environment)
    || !isStableActorId(actor.id)
    || !(actor.capabilities instanceof Set)
    || !REQUIRED_CAPABILITIES.every((capability) => actor.capabilities!.has(capability))
  ) {
    return false;
  }

  const configuredOwnerEmail = normalizeSingleEmail(
    environment.SCHOLARSCOUT_PREVIEW_OWNER_MEDIA_DEMO_OWNER_EMAIL,
  );
  const trustedActorEmail = normalizeSingleEmail(actor.email);

  return configuredOwnerEmail !== null
    && trustedActorEmail !== null
    && configuredOwnerEmail === trustedActorEmail;
}

function normalizeSingleEmail(value: string | undefined): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return EMAIL_PATTERN.test(normalized) ? normalized : null;
}

function isStableActorId(value: string): boolean {
  return /^[a-zA-Z0-9:_-]{1,160}$/.test(value);
}
