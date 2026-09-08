import { randomBytes, randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createLifecycleRequest, runFixtureLifecycle } from './e2e-fixture-lifecycle.mjs';

export function parseLauncherOptions(args) {
  const options = { spec: undefined, project: undefined };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if ((argument === '--spec' || argument === '--project') && args[index + 1]) {
      options[argument.slice(2)] = args[index + 1];
      index += 1;
      continue;
    }
    throw new Error('E2E fixture launcher accepts only --spec and --project.');
  }
  return options;
}

export function validateE2eFixtureEnvironment(env = process.env) {
  if (env.VERCEL_ENV === 'production' || env.SCHOLARSCOUT_E2E_BASE_URL || env.SCHOLARSCOUT_DATA_FILE || (env.SCHOLARSCOUT_DATA_ADAPTER && env.SCHOLARSCOUT_DATA_ADAPTER !== 'json')) {
    throw new Error('E2E fixture runner accepts only its owned non-production JSON target.');
  }
}

export async function runE2eFixture({ runPlaywright, spawnChild = spawn, fetchImpl = fetch } = {}) {
  validateE2eFixtureEnvironment();
  const directory = await mkdtemp(path.join(tmpdir(), 'scholarscout-e2e-'));
  const dataFile = path.join(directory, 'scholarscout-data.json');
  const fixtureId = randomUUID();
  const capability = randomBytes(32).toString('base64url');
  const port = 4300 + Math.floor(Math.random() * 1000);
  let child;
  let cleanupLifecycle = async () => undefined;
  let terminalError;
  const stop = async () => {
    await cleanupLifecycle();
    if (child && !child.killed) child.kill('SIGTERM');
  };
  const handleSignal = () => stop().finally(() => process.exitCode = 130);
  process.once('SIGINT', handleSignal);
  process.once('SIGTERM', handleSignal);
  try {
    child = spawnChild('pnpm', ['--filter', '@scholar-scout/web', 'exec', 'next', 'dev', '--experimental-https', '--port', String(port)], {
      cwd: process.cwd(),
      env: {
        PATH: process.env.PATH,
        SCHOLARSCOUT_DATA_ADAPTER: 'json',
        SCHOLARSCOUT_DATA_FILE: dataFile,
        SCHOLARSCOUT_E2E_FIXTURE: 'true',
        SCHOLARSCOUT_E2E_FIXTURE_ID: fixtureId,
        SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY: capability,
      },
    });
    child.once('error', (error) => { terminalError = error; });
    child.once('exit', (code) => {
      if (code && !child.killed) terminalError = new Error('Owned E2E application process exited unexpectedly.');
    });
    const baseUrl = `https://127.0.0.1:${port}`;
    const request = createLifecycleRequest(baseUrl, capability);
    await waitForReady(baseUrl, fetchImpl);
    if (terminalError) throw terminalError;
    await runFixtureLifecycle({
      request,
      onCleanupReady: (cleanup) => { cleanupLifecycle = cleanup; },
      run: () => runPlaywright({ baseUrl, labels: ['E2E Applied Health Pathway', 'E2E Technology Certificate'] }),
    });
  } finally {
    process.removeListener('SIGINT', handleSignal);
    process.removeListener('SIGTERM', handleSignal);
    await stop();
    await rm(directory, { recursive: true, force: true });
  }
}

export function createPlaywrightRunner(options, spawnProcess = spawn) {
  return ({ baseUrl }) => new Promise((resolve, reject) => {
    const args = ['exec', 'playwright', 'test'];
    if (options.spec) args.push(options.spec);
    if (options.project) args.push('--project', options.project);
    const child = spawnProcess('pnpm', args, {
      cwd: process.cwd(),
      env: { PATH: process.env.PATH, SCHOLARSCOUT_E2E_BASE_URL: baseUrl },
      stdio: 'inherit',
    });
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error('Browser test runner failed.')));
  });
}

async function waitForReady(baseUrl, fetchImpl) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetchImpl(`${baseUrl}/programmes`, { dispatcher: undefined });
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Owned E2E application process did not become ready.');
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  const options = parseLauncherOptions(process.argv.slice(2));
  runE2eFixture({ runPlaywright: createPlaywrightRunner(options) }).catch((error) => {
    process.exitCode = 1;
    console.error(error.message);
  });
}
