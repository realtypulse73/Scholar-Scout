import 'server-only';

const FIXTURE_ID_PATTERN = /^[a-z0-9-]{16,128}$/i;

/**
 * Rehearsal deployments are distinct, non-production Vercel projects. This
 * explicit opt-in prevents an ordinary Preview deployment from gaining access
 * to the mutable fixture lifecycle.
 */
export function isE2eRehearsalRuntime(): boolean {
  return (
    process.env.VERCEL_ENV === 'preview' &&
    process.env.SCHOLARSCOUT_REHEARSAL_MODE === 'true'
  );
}

export function isE2eFixtureEnabled(): boolean {
  return (
    process.env.SCHOLARSCOUT_E2E_FIXTURE === 'true' &&
    isE2eRehearsalRuntime()
  );
}

export function getConfiguredE2eFixtureId(): string | null {
  const fixtureId = process.env.SCHOLARSCOUT_E2E_FIXTURE_ID;

  return isE2eFixtureEnabled() && fixtureId && FIXTURE_ID_PATTERN.test(fixtureId)
    ? fixtureId
    : null;
}

/** Returns the only Blob object a rehearsal fixture may use. */
export function getE2eFixtureBlobDataPath(fixtureId: string): string {
  if (!FIXTURE_ID_PATTERN.test(fixtureId)) {
    throw new Error('E2E fixture id is invalid.');
  }
  return `scholarscout/rehearsal/${fixtureId}/data.json`;
}
