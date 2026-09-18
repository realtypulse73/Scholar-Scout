import 'server-only';

const FIXTURE_ID_PATTERN = /^[a-z0-9-]{16,128}$/i;

export function isE2eFixtureEnabled(): boolean {
  return (
    process.env.SCHOLARSCOUT_E2E_FIXTURE === 'true' &&
    process.env.VERCEL_ENV !== 'production'
  );
}

export function getConfiguredE2eFixtureId(): string | null {
  const fixtureId = process.env.SCHOLARSCOUT_E2E_FIXTURE_ID;

  return isE2eFixtureEnabled() && fixtureId && FIXTURE_ID_PATTERN.test(fixtureId)
    ? fixtureId
    : null;
}
