import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';

import {
  getPnpmCommand,
  isCliEntrypoint,
  parseLauncherOptions,
  validateE2eFixtureEnvironment,
} from './run-e2e-fixture.mjs';

test('rejects production and caller-selected fixture targets', () => {
  for (const env of [
    { VERCEL_ENV: 'production' },
    { SCHOLARSCOUT_E2E_BASE_URL: 'https://example.test' },
    { SCHOLARSCOUT_DATA_FILE: 'data.json' },
    { SCHOLARSCOUT_DATA_ADAPTER: 'http' },
  ]) {
    assert.throws(() => validateE2eFixtureEnvironment(env));
  }
});

test('accepts an unset local environment', () => {
  assert.doesNotThrow(() => validateE2eFixtureEnvironment({}));
});

test('accepts only a selected browser spec and project', () => {
  assert.deepEqual(
    parseLauncherOptions(['--spec', 'apps/web/e2e/student.spec.ts', '--project', 'chromium']),
    { spec: 'apps/web/e2e/student.spec.ts', project: 'chromium' },
  );
  assert.throws(() => parseLauncherOptions(['--base-url', 'https://example.test']));
  assert.throws(() => parseLauncherOptions(['--fixture-id', 'caller-selected']));
});

test('recognizes the launcher entrypoint from a Windows path', () => {
  const scriptPath = path.resolve('scripts/run-e2e-fixture.mjs');
  const scriptUrl = new URL('./run-e2e-fixture.mjs', import.meta.url).href;

  assert.equal(isCliEntrypoint(scriptPath, scriptUrl), true);
});

test('uses the executable pnpm shim on Windows', () => {
  assert.equal(getPnpmCommand('win32'), 'pnpm.cmd');
  assert.equal(getPnpmCommand('linux'), 'pnpm');
});
