#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import http from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const nodeBin = process.execPath;
const isWindows = process.platform === 'win32';

test('production env checker returns JSON without secret values', async () => {
  const result = await runNode(['scripts/production-env-check.mjs', '--json'], {
    NEXTAUTH_URL: 'https://scholarscout.example.org',
    NEXTAUTH_SECRET: 'secret-value-that-should-not-appear-12345',
    SCHOLARSCOUT_STAFF_EMAILS: 'staff@example.org',
    SCHOLARSCOUT_HEALTH_TOKEN: 'health-token-that-should-not-appear',
    GOOGLE_CLIENT_ID: 'google-client-id',
    GOOGLE_CLIENT_SECRET: 'google-secret-that-should-not-appear',
    SCHOLARSCOUT_DATA_ADAPTER: 'vercel-blob',
    SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN:
      'blob-token-that-should-not-appear',
    SCHOLARSCOUT_SMOKE_EXPECTED_ADAPTER: 'vercel-blob',
  });

  assert.equal(result.code, 0, result.stderr);
  const body = JSON.parse(result.stdout);

  assert.equal(body.summary.failures, 0);
  assert.match(result.stdout, /"status": "pass"/);
  assert.doesNotMatch(result.stdout, /secret-value-that-should-not-appear/);
  assert.doesNotMatch(result.stdout, /google-secret-that-should-not-appear/);
  assert.doesNotMatch(result.stdout, /blob-token-that-should-not-appear/);
});

test('production env checker fails local JSON adapter for production', async () => {
  const result = await runNode(['scripts/production-env-check.mjs', '--json'], {
    NEXTAUTH_URL: 'https://scholarscout.example.org',
    NEXTAUTH_SECRET: 'abcdefghijklmnopqrstuvwxyz1234567890',
    SCHOLARSCOUT_STAFF_EMAILS: 'staff@example.org',
    SCHOLARSCOUT_HEALTH_TOKEN: 'health-token-1234567890',
    GOOGLE_CLIENT_ID: 'google-client-id',
    GOOGLE_CLIENT_SECRET: 'google-client-secret',
    SCHOLARSCOUT_DATA_ADAPTER: 'json',
  });

  assert.equal(result.code, 1);
  const body = JSON.parse(result.stdout);

  assert.equal(body.summary.failures, 1);
  assert.match(result.stdout, /JSON storage is for local development/);
});

test('production env checker rejects non-local HTTP production URL', async () => {
  const result = await runNode(['scripts/production-env-check.mjs', '--json'], {
    NEXTAUTH_URL: 'http://scholarscout.example.org',
    NEXTAUTH_SECRET: 'abcdefghijklmnopqrstuvwxyz1234567890',
    SCHOLARSCOUT_STAFF_EMAILS: 'staff@example.org',
    SCHOLARSCOUT_HEALTH_TOKEN: 'health-token-1234567890',
    GOOGLE_CLIENT_ID: 'google-client-id',
    GOOGLE_CLIENT_SECRET: 'google-client-secret',
    SCHOLARSCOUT_DATA_ADAPTER: 'vercel-blob',
    SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN: 'blob-token-1234567890',
  });

  assert.equal(result.code, 1);
  assert.match(result.stdout, /Production URLs should use HTTPS/);
});

test('production env checker can load values from an env file', async () => {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'scholarscout-env-'));
  const envPath = path.join(tempDir, '.env.prelaunch.local');
  await writeFile(
    envPath,
    [
      'NEXTAUTH_URL=http://localhost:3000',
      'NEXTAUTH_SECRET=abcdefghijklmnopqrstuvwxyz1234567890',
      'SCHOLARSCOUT_STAFF_EMAILS=staff@example.org',
      'SCHOLARSCOUT_HEALTH_TOKEN=health-token-1234567890',
      'SCHOLARSCOUT_ALLOW_CREDENTIALS_ONLY_PRODUCTION=true',
      'SCHOLARSCOUT_DATA_ADAPTER=http',
      'SCHOLARSCOUT_DATA_SERVICE_URL=http://localhost:4010/scholarscout',
      'SCHOLARSCOUT_DATA_SERVICE_TOKEN=service-token-123456',
      'SCHOLARSCOUT_SMOKE_EXPECTED_ADAPTER=http',
    ].join('\n'),
  );

  const result = await runNode([
    'scripts/production-env-check.mjs',
    '--json',
    '--env-file',
    envPath,
  ]);

  assert.equal(result.code, 0, result.stderr);
  const body = JSON.parse(result.stdout);

  assert.equal(body.summary.failures, 0);
  assert.ok(
    body.checks.some(
      (check) =>
        check.name === 'Production OAuth coverage' &&
        check.status === 'warn',
    ),
  );
});

test('production smoke JSON passes expected provider and health checks', async () => {
  await withSmokeServer(async (baseUrl) => {
    const result = await runNode(['scripts/production-smoke.mjs', '--json'], {
      SCHOLARSCOUT_SMOKE_BASE_URL: baseUrl,
      SCHOLARSCOUT_SMOKE_HEALTH_TOKEN: 'health-token',
      SCHOLARSCOUT_SMOKE_EXPECTED_ADAPTER: 'vercel-blob',
      SCHOLARSCOUT_SMOKE_EXPECTED_PROVIDERS: 'google,github',
    });

    assert.equal(result.code, 0, result.stderr);
    const body = JSON.parse(result.stdout);

    assert.equal(body.summary.failed, 0);
    assert.ok(
      body.checks.some(
        (check) =>
          check.name === 'expected auth providers' &&
          check.status === 'passed',
      ),
    );
    assert.ok(
      body.checks.some(
        (check) =>
          check.name === 'data health freshness' &&
          check.status === 'passed',
      ),
    );
  });
});

test('production smoke fails missing expected providers', async () => {
  await withSmokeServer(async (baseUrl) => {
    const result = await runNode(['scripts/production-smoke.mjs', '--json'], {
      SCHOLARSCOUT_SMOKE_BASE_URL: baseUrl,
      SCHOLARSCOUT_SMOKE_HEALTH_TOKEN: 'health-token',
      SCHOLARSCOUT_SMOKE_EXPECTED_ADAPTER: 'vercel-blob',
      SCHOLARSCOUT_SMOKE_EXPECTED_PROVIDERS: 'google,github,azure-ad',
    });

    assert.equal(result.code, 1);
    const body = JSON.parse(result.stdout);

    assert.ok(body.summary.failed > 0);
    assert.match(result.stdout, /missing azure-ad/);
  });
});

test('production smoke JSON reports network failures without crashing', async () => {
  const result = await runNode(['scripts/production-smoke.mjs', '--json'], {
    SCHOLARSCOUT_SMOKE_BASE_URL: 'http://127.0.0.1:9',
    SCHOLARSCOUT_SMOKE_TIMEOUT_MS: '250',
  });

  assert.equal(result.code, 1);
  const body = JSON.parse(result.stdout);

  assert.ok(body.summary.failed > 0);
  assert.match(result.stdout, /request failed|request timed out/);
});

test('production smoke retries transient request failures', async () => {
  let homeRequests = 0;

  await withSmokeServer(
    async (baseUrl) => {
      const result = await runNode(['scripts/production-smoke.mjs', '--json'], {
        SCHOLARSCOUT_SMOKE_BASE_URL: baseUrl,
        SCHOLARSCOUT_SMOKE_HEALTH_TOKEN: 'health-token',
        SCHOLARSCOUT_SMOKE_EXPECTED_ADAPTER: 'vercel-blob',
        SCHOLARSCOUT_SMOKE_EXPECTED_PROVIDERS: 'google,github',
        SCHOLARSCOUT_SMOKE_RETRIES: '1',
      });

      assert.equal(result.code, 0, result.stderr);
      const body = JSON.parse(result.stdout);
      const homeCheck = body.checks.find((check) => check.name === 'home page');

      assert.equal(homeRequests, 2);
      assert.match(homeCheck.detail, /after 2 attempts/);
    },
    {
      beforeRoute(request, response) {
        if (request.url === '/' && homeRequests === 0) {
          homeRequests += 1;
          response.destroy();
          return true;
        }

        if (request.url === '/') {
          homeRequests += 1;
        }

        return false;
      },
    },
  );
});

test('production smoke can fail slow endpoint latency', async () => {
  await withSmokeServer(
    async (baseUrl) => {
      const result = await runNode(['scripts/production-smoke.mjs', '--json'], {
        SCHOLARSCOUT_SMOKE_BASE_URL: baseUrl,
        SCHOLARSCOUT_SMOKE_HEALTH_TOKEN: 'health-token',
        SCHOLARSCOUT_SMOKE_EXPECTED_ADAPTER: 'vercel-blob',
        SCHOLARSCOUT_SMOKE_EXPECTED_PROVIDERS: 'google,github',
        SCHOLARSCOUT_SMOKE_MAX_LATENCY_MS: '1',
      });

      assert.equal(result.code, 1);
      const body = JSON.parse(result.stdout);

      assert.ok(
        body.checks.some(
          (check) =>
            check.name.endsWith('latency') &&
            check.status === 'failed',
        ),
      );
    },
    {
      routeDelayMs: 15,
    },
  );
});

test('production report summary renders env and smoke JSON as Markdown', async () => {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'scholarscout-report-'));
  const envReportPath = path.join(tempDir, 'env.json');
  const smokeReportPath = path.join(tempDir, 'smoke.json');

  await writeFile(
    envReportPath,
    JSON.stringify({
      summary: { passed: 2, warnings: 1, failures: 1 },
      checks: [
        { name: 'NEXTAUTH_URL', status: 'pass', detail: 'Set.' },
        { name: 'GitHub OAuth', status: 'warn', detail: 'Disabled.' },
        { name: 'Data adapter', status: 'fail', detail: 'Unsupported.' },
      ],
    }),
  );
  await writeFile(
    smokeReportPath,
    JSON.stringify({
      summary: { passed: 3, skipped: 1, failed: 1 },
      checks: [
        { name: 'home page', status: 'passed', detail: '200' },
        { name: 'staff data export', status: 'skipped', detail: 'No cookie.' },
        { name: 'expected auth providers', status: 'failed', detail: 'missing google' },
      ],
    }),
  );

  const result = await runNode([
    'scripts/production-report-summary.mjs',
    '--env-report',
    envReportPath,
    '--smoke-report',
    smokeReportPath,
  ]);

  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /# ScholarScout Production Report/);
  assert.match(result.stdout, /## Production Env Readiness/);
  assert.match(result.stdout, /Fail: Data adapter - Unsupported./);
  assert.match(result.stdout, /Skipped: staff data export - No cookie./);
});

test('prelaunch rehearsal writes readiness artifacts and summary', async () => {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'scholarscout-rehearsal-'));
  const result = await runNode(
    [
      'scripts/prelaunch-rehearsal.mjs',
      '--output-dir',
      tempDir,
      '--skip-smoke',
      '--skip-tooling-tests',
    ],
    {
      NEXTAUTH_URL: 'https://scholarscout.example.org',
      NEXTAUTH_SECRET: 'abcdefghijklmnopqrstuvwxyz1234567890',
      SCHOLARSCOUT_STAFF_EMAILS: 'staff@example.org',
      SCHOLARSCOUT_HEALTH_TOKEN: 'health-token-1234567890',
      GOOGLE_CLIENT_ID: 'google-client-id',
      GOOGLE_CLIENT_SECRET: 'google-client-secret',
      SCHOLARSCOUT_DATA_ADAPTER: 'vercel-blob',
      SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN: 'blob-token-1234567890',
      SCHOLARSCOUT_SMOKE_EXPECTED_ADAPTER: 'vercel-blob',
    },
  );

  assert.equal(result.code, 0, result.stderr);

  const envReport = JSON.parse(
    await readFile(path.join(tempDir, 'production-env-readiness.json'), 'utf8'),
  );
  const summary = await readFile(
    path.join(tempDir, 'prelaunch-summary.md'),
    'utf8',
  );

  assert.equal(envReport.summary.failures, 0);
  assert.match(summary, /# ScholarScout Prelaunch Rehearsal/);
  assert.match(summary, /Production smoke/);
  assert.match(summary, /skipped/);
});

test('prelaunch rehearsal can load readiness values from an env file', async () => {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'scholarscout-rehearsal-env-'));
  const outputDir = path.join(tempDir, 'reports');
  const envPath = path.join(tempDir, '.env.prelaunch.local');
  await writeFile(
    envPath,
    [
      'NEXTAUTH_URL=http://localhost:3000',
      'NEXTAUTH_SECRET=abcdefghijklmnopqrstuvwxyz1234567890',
      'SCHOLARSCOUT_STAFF_EMAILS=staff@example.org',
      'SCHOLARSCOUT_HEALTH_TOKEN=health-token-1234567890',
      'SCHOLARSCOUT_ALLOW_CREDENTIALS_ONLY_PRODUCTION=true',
      'SCHOLARSCOUT_DATA_ADAPTER=http',
      'SCHOLARSCOUT_DATA_SERVICE_URL=http://localhost:4010/scholarscout',
      'SCHOLARSCOUT_DATA_SERVICE_TOKEN=service-token-123456',
      'SCHOLARSCOUT_SMOKE_EXPECTED_ADAPTER=http',
    ].join('\n'),
  );

  const result = await runNode([
    'scripts/prelaunch-rehearsal.mjs',
    '--output-dir',
    outputDir,
    '--skip-smoke',
    '--skip-tooling-tests',
    '--env-file',
    envPath,
  ]);

  assert.equal(result.code, 0, result.stderr);
  const envReport = JSON.parse(
    await readFile(path.join(outputDir, 'production-env-readiness.json'), 'utf8'),
  );

  assert.equal(envReport.summary.failures, 0);
});

test('environment provisioning writes local env and external checklist', async () => {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'scholarscout-provision-'));
  const localFile = path.join(tempDir, '.env.prelaunch.local');
  const reportFile = path.join(tempDir, 'environment-provisioning.md');
  const result = await runNode([
    'scripts/provision-environment.mjs',
    '--local-file',
    localFile,
    '--report-file',
    reportFile,
    '--staff-email',
    'advisor@example.org',
  ]);

  assert.equal(result.code, 0, result.stderr);

  const localEnv = await readFile(localFile, 'utf8');
  const report = await readFile(reportFile, 'utf8');

  assert.match(localEnv, /NEXTAUTH_SECRET=.{32,}/);
  assert.match(localEnv, /SCHOLARSCOUT_STAFF_EMAILS=advisor@example.org/);
  assert.match(localEnv, /SCHOLARSCOUT_ALLOW_CREDENTIALS_ONLY_PRODUCTION=true/);
  assert.match(report, /Production Values Still Needed/);
  assert.match(report, /OAuth app credentials/);
});

test('production value provisioning writes generated secrets and provider checklist', async () => {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'scholarscout-prod-values-'));
  const envFile = path.join(tempDir, '.env.production.local');
  const reportFile = path.join(tempDir, 'provider-setup.md');
  const result = await runNode([
    'scripts/provision-production-values.mjs',
    '--local-file',
    envFile,
    '--report-file',
    reportFile,
    '--production-url',
    'https://scholarscout.example.org',
    '--staff-emails',
    'advisor@example.org',
  ]);

  assert.equal(result.code, 0, result.stderr);

  const env = await readFile(envFile, 'utf8');
  const report = await readFile(reportFile, 'utf8');

  assert.match(env, /NEXTAUTH_URL=https:\/\/scholarscout\.example\.org/);
  assert.match(env, /NEXTAUTH_SECRET=.{32,}/);
  assert.match(env, /SCHOLARSCOUT_HEALTH_TOKEN=.{16,}/);
  assert.match(env, /SCHOLARSCOUT_STAFF_EMAILS=advisor@example.org/);
  assert.match(report, /GitHub Actions Secrets To Add/);
  assert.match(report, /api\/auth\/callback\/google/);
});

test('portable npm PowerShell wrapper accepts direct npm arguments', { skip: !isWindows }, async () => {
  const result = await runCommand(
    'powershell',
    [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      'scripts\\npm-portable.ps1',
      '--version',
    ],
  );

  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /\d+\.\d+\.\d+/);
});

function runNode(args, env = {}) {
  return runCommand(nodeBin, args, env);
}

function runCommand(command, args, env = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ...env,
      },
    });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

async function withSmokeServer(callback, options = {}) {
  const server = http.createServer(async (request, response) => {
    if (options.beforeRoute?.(request, response)) {
      return;
    }

    if (options.routeDelayMs) {
      await new Promise((resolve) => {
        setTimeout(resolve, options.routeDelayMs);
      });
    }

    if (['/', '/programmes', '/auth/sign-in'].includes(request.url)) {
      send(response, 200, 'ok', 'text/html');
      return;
    }

    if (request.url === '/api/auth/providers') {
      sendJson(response, 200, {
        google: { id: 'google' },
        github: { id: 'github' },
      });
      return;
    }

    if (request.url === '/api/admin/data/status') {
      sendJson(response, 403, { error: 'Forbidden' });
      return;
    }

    if (request.url === '/api/admin/data/health') {
      if (request.headers.authorization !== 'Bearer health-token') {
        sendJson(response, 403, { error: 'Forbidden' });
        return;
      }

      sendJson(response, 200, {
        checkedAt: new Date().toISOString(),
        adapter: 'vercel-blob',
        isDurable: true,
        issues: [],
        backupRetention: {
          retainedBackups: 1,
          maxRetainedBackups: 5,
          isWithinPolicy: true,
          issues: [],
        },
        counts: {
          users: 1,
          onboardingProfiles: 1,
          shortlists: 1,
          programmeRecords: 1,
          auditEvents: 1,
        },
      });
      return;
    }

    if (request.url === '/api/admin/data/backups/smoke/restore') {
      sendJson(response, 403, { error: 'Forbidden' });
      return;
    }

    send(response, 404, 'missing', 'text/plain');
  });

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const { port } = server.address();

  try {
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => {
      server.close(resolve);
    });
  }
}

function sendJson(response, status, body) {
  send(response, status, JSON.stringify(body), 'application/json');
}

function send(response, status, body, contentType) {
  response.writeHead(status, { 'Content-Type': contentType });
  response.end(body);
}
