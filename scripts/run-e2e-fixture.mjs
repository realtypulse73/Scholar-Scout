import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';

import { runFixtureLifecycle } from './e2e-fixture-lifecycle.mjs';

const FIXTURE_PREFIX = 'scholarscout-e2e-';

export function assertFixtureEnvironment(environment = process.env) {
  if (environment.VERCEL_ENV === 'production') {
    throw new Error('The E2E fixture cannot run in production.');
  }
  for (const name of [
    'SCHOLARSCOUT_E2E_BASE_URL',
    'SCHOLARSCOUT_DATA_FILE',
    'SCHOLARSCOUT_DATA_SERVICE_URL',
    'SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN',
    'BLOB_READ_WRITE_TOKEN',
  ]) {
    if (environment[name]) throw new Error(`Unsafe E2E target setting: ${name}`);
  }
  if (environment.SCHOLARSCOUT_DATA_ADAPTER && environment.SCHOLARSCOUT_DATA_ADAPTER !== 'json') {
    throw new Error('The E2E fixture requires the JSON adapter.');
  }
}

export async function createFixtureDirectory() {
  const directory = await mkdtemp(join(tmpdir(), FIXTURE_PREFIX));
  return {
    directory,
    dataFile: join(directory, 'scholarscout-data.json'),
    cleanup: async () => rm(directory, { recursive: true, force: true }),
  };
}

function createRequest(baseUrl) {
  return async (method, path, options) => {
    const response = await fetch(new URL(path, baseUrl), {
      method,
      headers: options.headers,
      body: options.body,
    });
    if (!response.ok) return { ok: false, phase: 'denied' };
    return response.json();
  };
}

async function getFreePort() {
  const { createServer } = await import('node:net');
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close((error) => error ? reject(error) : resolve(address.port));
    });
  });
}

async function waitForReady(baseUrl, child) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error('Owned E2E server exited before readiness.');
    try {
      const response = await fetch(baseUrl, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) return;
    } catch {
      // The owned process is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Owned E2E server did not become ready.');
}

async function stopChild(child) {
  if (!child || child.exitCode !== null) return;
  child.kill('SIGTERM');
  await new Promise((resolve) => child.once('exit', resolve));
}

export async function runOwnedE2eFixture({ args = process.argv.slice(2), spawnChild = spawn } = {}) {
  assertFixtureEnvironment();
  const fixture = await createFixtureDirectory();
  const port = await getFreePort();
  const capability = randomBytes(32).toString('base64url');
  const fixtureId = randomUUID();
  const baseUrl = `https://127.0.0.1:${port}`;
  let child;
  let stopping = false;
  let cleanupFixture = async () => {};
  let removeSignalHandlers = () => {};

  const stop = async () => {
    if (stopping) return;
    stopping = true;
    await stopChild(child);
  };

  try {
    child = spawnChild('pnpm', [
      '--filter', '@scholar-scout/web', 'exec', 'next', 'dev',
      '--experimental-https', '--port', String(port),
    ], {
      stdio: 'inherit',
      env: {
        PATH: process.env.PATH,
        NODE_ENV: 'development',
        SCHOLARSCOUT_DATA_ADAPTER: 'json',
        SCHOLARSCOUT_DATA_FILE: fixture.dataFile,
        SCHOLARSCOUT_E2E_FIXTURE_ENABLED: 'true',
        SCHOLARSCOUT_E2E_FIXTURE_ID: fixtureId,
        SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY: capability,
      },
    });
    const childFailure = new Promise((_, reject) => {
      child.once('error', () => reject(new Error('Owned E2E server failed to start.')));
      child.once('exit', (code) => {
        if (!stopping && code !== 0) {
          cleanupFixture().catch(() => undefined);
          reject(new Error('Owned E2E server exited unexpectedly.'));
        }
      });
    });
    void childFailure.catch(() => undefined);
    const onSignal = () => {
      cleanupFixture().catch(() => undefined).finally(() => stop().finally(() => {
        process.exitCode = 1;
      }));
    };
    const onInterrupt = () => onSignal();
    const onTerminate = () => onSignal();
    process.once('SIGINT', onInterrupt);
    process.once('SIGTERM', onTerminate);
    removeSignalHandlers = () => {
      process.removeListener('SIGINT', onInterrupt);
      process.removeListener('SIGTERM', onTerminate);
    };
    await Promise.race([waitForReady(baseUrl, child), childFailure]);
    return await runFixtureLifecycle({
      baseUrl,
      capability,
      request: createRequest(baseUrl),
      onCleanup: (cleanup) => { cleanupFixture = cleanup; },
      run: async () => new Promise((resolve, reject) => {
        const playwright = spawnChild('pnpm', [
          '--filter', '@scholar-scout/web', 'exec', 'playwright', 'test', ...args,
        ], {
          stdio: 'inherit',
          env: { PATH: process.env.PATH, PLAYWRIGHT_BASE_URL: baseUrl },
        });
        playwright.once('error', reject);
        playwright.once('exit', (code) => code === 0
          ? resolve({ category: 'passed' })
          : reject(new Error('Browser journey failed.')));
      }),
    });
  } finally {
    removeSignalHandlers();
    await stop();
    await fixture.cleanup();
  }
}

if (process.argv[1] && process.argv[1].endsWith('run-e2e-fixture.mjs')) {
  runOwnedE2eFixture().catch((error) => {
    console.error(error instanceof Error ? error.message : 'E2E fixture failed.');
    process.exitCode = 1;
  });
}
