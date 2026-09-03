import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertFixtureEnvironment,
  createFixtureDirectory,
  createOwnedServerEnvironment,
  getChildStopInvocation,
  getPnpmInvocation,
  normalizePlaywrightArgs,
} from './run-e2e-fixture.mjs';

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

test('preserves Windows command resolution for the owned server process', () => {
  const environment = createOwnedServerEnvironment({
    dataFile: '/tmp/scholarscout-data.json',
    fixtureId: 'fixture',
    capability: 'capability',
  }, {
    PATH: '/test/bin',
    SYSTEMROOT: 'C:\\Windows',
    USERPROFILE: 'C:\\Users\\student',
    LOCALAPPDATA: 'C:\\Users\\student\\AppData\\Local',
    PATHEXT: '.COM;.EXE;.BAT;.CMD',
  });

  assert.equal(environment.PATH, '/test/bin');
  assert.equal(environment.SYSTEMROOT, 'C:\\Windows');
  assert.equal(environment.USERPROFILE, 'C:\\Users\\student');
  assert.equal(environment.LOCALAPPDATA, 'C:\\Users\\student\\AppData\\Local');
  assert.equal(environment.PATHEXT, '.COM;.EXE;.BAT;.CMD');
  assert.deepEqual(getPnpmInvocation(['--version'], {
    platform: 'linux',
    execPath: '/node/bin/node',
  }), { command: 'pnpm', args: ['--version'] });
  assert.deepEqual(getPnpmInvocation(['--version'], {
    platform: 'win32',
    execPath: 'C:\\node\\node.exe',
  }), {
    command: 'C:\\node\\node.exe',
    args: ['C:\\node\\node_modules\\corepack\\dist\\pnpm.js', '--version'],
  });
  assert.deepEqual(getChildStopInvocation(42, { platform: 'win32' }), {
    command: 'taskkill',
    args: ['/pid', '42', '/t', '/f'],
  });
  assert.equal(getChildStopInvocation(42, { platform: 'linux' }), null);
});

test('maps the owned runner spec flag to Playwright positional file syntax', () => {
  assert.deepEqual(normalizePlaywrightArgs([
    '--spec', 'apps/web/e2e/student-release-journey.spec.ts', '--project', 'chromium',
  ]), ['apps/web/e2e/student-release-journey.spec.ts', '--project', 'chromium']);
  assert.throws(() => normalizePlaywrightArgs(['--spec']), /requires a test path/);
});
