import assert from 'node:assert/strict';
import test from 'node:test';

import { assertFixtureEnvironment, createFixtureDirectory } from './run-e2e-fixture.mjs';

test('rejects unsafe externally selected fixture targets before spawning', () => {
  assert.throws(() => assertFixtureEnvironment({ VERCEL_ENV: 'production' }));
  assert.throws(() => assertFixtureEnvironment({ SCHOLARSCOUT_E2E_BASE_URL: 'https://example.com' }));
  assert.throws(() => assertFixtureEnvironment({ SCHOLARSCOUT_DATA_FILE: '/tmp/data.json' }));
  assert.throws(() => assertFixtureEnvironment({ SCHOLARSCOUT_DATA_ADAPTER: 'http' }));
  assert.doesNotThrow(() => assertFixtureEnvironment({}));
});

test('creates one data file path inside its generated temporary directory', async () => {
  const fixture = await createFixtureDirectory();
  try {
    assert.match(fixture.directory, /scholarscout-e2e-/);
    assert.equal(fixture.dataFile.startsWith(fixture.directory), true);
    assert.equal(fixture.dataFile.endsWith('scholarscout-data.json'), true);
  } finally {
    await fixture.cleanup();
  }
});
