import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { request as requestHttps } from 'node:https';

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

export function createOwnedServerEnvironment({
  dataFile,
  fixtureId,
  capability,
}, environment = process.env) {
  const childEnvironment = {
    PATH: environment.PATH,
    NODE_ENV: 'development',
    SCHOLARSCOUT_DATA_ADAPTER: 'json',
    SCHOLARSCOUT_DATA_FILE: dataFile,
    SCHOLARSCOUT_E2E_FIXTURE_ENABLED: 'true',
    SCHOLARSCOUT_E2E_FIXTURE_ID: fixtureId,
    SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY: capability,
  };

  for (const name of [
    'SYSTEMROOT',
    'ComSpec',
    'PATHEXT',
    'TEMP',
    'TMP',
    'USERPROFILE',
    'APPDATA',
    'LOCALAPPDATA',
  ]) {
    if (environment[name]) {
      childEnvironment[name] = environment[name];
    }
  }

  return childEnvironment;
}

export function getPnpmInvocation(args, {
  platform = process.platform,
  execPath = process.execPath,
} = {}) {
  if (platform !== 'win32') {
    return { command: 'pnpm', args };
  }

  return {
    command: execPath,
    args: [join(dirname(execPath), 'node_modules', 'corepack', 'dist', 'pnpm.js'), ...args],
  };
}

export function getChildStopInvocation(pid, { platform = process.platform } = {}) {
  if (platform === 'win32') {
    return { command: 'taskkill', args: ['/pid', String(pid), '/t', '/f'] };
  }
  return null;
}

/**
 * Keep the wrapper's stable --spec contract while passing a positional test file
 * to Playwright, which does not expose a --spec CLI option.
 */
export function normalizePlaywrightArgs(args) {
  const normalized = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] !== '--spec') {
      normalized.push(args[index]);
      continue;
    }
    const spec = args[index + 1];
    if (!spec || spec.startsWith('-')) {
      throw new Error('The owned E2E runner requires a test path after --spec.');
    }
    normalized.push(spec);
    index += 1;
  }
  return normalized;
}

function createRequest(baseUrl) {
  return async (method, path, options) => {
    const response = await requestOwnedHttps(baseUrl, path, {
      method,
      headers: options.headers,
      body: options.body,
    });
    return response.ok ? response.body : { ok: false, phase: 'denied' };
  };
}

function requestOwnedHttps(baseUrl, path, {
  method = 'GET',
  headers,
  body,
  parseJson = true,
  timeoutMs = 30_000,
} = {}) {
  return new Promise((resolve, reject) => {
    const request = requestHttps(new URL(path, baseUrl), {
      method,
      headers,
      rejectUnauthorized: false,
    }, (response) => {
      let payload = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { payload += chunk; });
      response.once('error', reject);
      response.once('end', () => {
        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
          if (!parseJson) {
            resolve({ ok: true, body: null });
            return;
          }
          try {
            resolve({ ok: true, body: JSON.parse(payload) });
          } catch {
            reject(new Error('Owned E2E server returned an invalid response.'));
          }
          return;
        }
        resolve({ ok: false, body: null });
      });
    });
    request.once('error', reject);
    request.setTimeout(timeoutMs, () => request.destroy(new Error('Owned E2E server request timed out.')));
    if (body) request.write(body);
    request.end();
  });
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
      const response = await requestOwnedHttps(baseUrl, '/', {
        parseJson: false,
        timeoutMs: 1_000,
      });
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
  const termination = getChildStopInvocation(child.pid);
  if (termination) {
    await new Promise((resolve) => {
      const taskkill = spawn(termination.command, termination.args, { stdio: 'ignore' });
      taskkill.once('error', () => {
        child.kill('SIGTERM');
        resolve();
      });
      taskkill.once('exit', resolve);
    });
    return;
  }
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
    const serverInvocation = getPnpmInvocation([
      '--filter', '@scholar-scout/web', 'exec', 'next', 'dev',
      '--experimental-https', '--port', String(port),
    ]);
    child = spawnChild(serverInvocation.command, serverInvocation.args, {
      stdio: 'inherit',
      env: createOwnedServerEnvironment({
        dataFile: fixture.dataFile,
        fixtureId,
        capability,
      }),
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
        const playwrightInvocation = getPnpmInvocation([
          '--filter', '@scholar-scout/web', 'exec', 'playwright', 'test',
          '--config', '../../playwright.config.ts',
          ...normalizePlaywrightArgs(args),
        ]);
        const playwright = spawnChild(playwrightInvocation.command, playwrightInvocation.args, {
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
