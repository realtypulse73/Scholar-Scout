#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chmod, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import http from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const nodeBin = process.execPath;
const isWindows = process.platform === 'win32';

const validRecoverySigning = {
  SCHOLARSCOUT_RECOVERY_SIGNING_KEY_ID: 'current-key',
  SCHOLARSCOUT_RECOVERY_SIGNING_SECRET: 'dedicated-recovery-secret-at-least-32-bytes',
};

test('production env checker requires dedicated recovery signing material', async () => {
  const base = productionEnv();
  const missing = await runNode(['scripts/production-env-check.mjs', '--json'], {
    ...base,
    SCHOLARSCOUT_RECOVERY_SIGNING_KEY_ID: '',
    SCHOLARSCOUT_RECOVERY_SIGNING_SECRET: '',
  });
  assert.equal(missing.code, 1);
  assert.match(missing.stdout, /Recovery signing/);

  const nextAuthOnly = await runNode(['scripts/production-env-check.mjs', '--json'], {
    ...base,
    NEXTAUTH_SECRET: 'this-auth-secret-must-never-be-used-for-recovery',
    SCHOLARSCOUT_RECOVERY_SIGNING_KEY_ID: '',
    SCHOLARSCOUT_RECOVERY_SIGNING_SECRET: '',
  });
  assert.equal(nextAuthOnly.code, 1);

  const valid = await runNode(['scripts/production-env-check.mjs', '--json'], base);
  assert.equal(valid.code, 0, valid.stderr);

  const halfPrevious = await runNode(['scripts/production-env-check.mjs', '--json'], {
    ...base,
    SCHOLARSCOUT_RECOVERY_PREVIOUS_KEY_ID: 'previous-key',
    SCHOLARSCOUT_RECOVERY_PREVIOUS_SECRET: '',
  });
  assert.equal(halfPrevious.code, 1);
  assert.match(halfPrevious.stdout, /Previous recovery signing/);
});

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

test('production env checker defers Google for GitHub-first launch', async () => {
  const result = await runNode(['scripts/production-env-check.mjs', '--json'], {
    NEXTAUTH_URL: 'https://scholarscout.example.org',
    NEXTAUTH_SECRET: 'abcdefghijklmnopqrstuvwxyz1234567890',
    SCHOLARSCOUT_STAFF_EMAILS: 'staff@example.org',
    SCHOLARSCOUT_HEALTH_TOKEN: 'health-token-1234567890',
    GITHUB_CLIENT_ID: 'github-client-id',
    GITHUB_CLIENT_SECRET: 'github-client-secret',
    SCHOLARSCOUT_DATA_ADAPTER: 'vercel-blob',
    SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN: 'blob-token-1234567890',
    SCHOLARSCOUT_SMOKE_EXPECTED_ADAPTER: 'vercel-blob',
    SCHOLARSCOUT_SMOKE_EXPECTED_PROVIDERS: 'github',
  });

  assert.equal(result.code, 0, result.stderr);
  const body = JSON.parse(result.stdout);
  const googleCheck = body.checks.find(
    (check) => check.name === 'Google OAuth',
  );

  assert.equal(body.summary.failures, 0);
  assert.equal(googleCheck.status, 'pass');
  assert.match(googleCheck.detail, /not expected for this launch/);
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

test('production report help names the pnpm commands that generate JSON reports', async () => {
  const result = await runNode([
    'scripts/production-report-summary.mjs',
    '--help',
  ]);

  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /pnpm run check:production-env -- --json/);
  assert.match(result.stdout, /pnpm run smoke:production -- --json/);
  assert.doesNotMatch(result.stdout, /\bnpm run/);
});

test('post-deploy smoke targets the stable secret while retaining dispatch evidence', async () => {
  const workflow = await readFile(
    path.join(process.cwd(), '.github/workflows/post-deploy-smoke.yml'),
    'utf8',
  );

  assert.match(
    workflow,
    /SCHOLARSCOUT_SMOKE_BASE_URL:\s*\$\{\{ secrets\.SCHOLARSCOUT_SMOKE_BASE_URL \}\}/,
  );
  assert.doesNotMatch(
    workflow,
    /SCHOLARSCOUT_SMOKE_BASE_URL:\s*\$\{\{ github\.event\.client_payload\.url \}\}/,
  );
  assert.match(
    workflow,
    /group: scholarscout-post-deploy-smoke-\$\{\{ github\.event\.client_payload\.url \}\}/,
  );
  assert.match(
    workflow,
    /ref: \$\{\{ github\.event\.client_payload\.git\.sha \}\}/,
  );
  assert.match(
    workflow,
    /const deploymentUrl = context\.payload\.client_payload\.url;/,
  );
  assert.match(
    workflow,
    /const commitSha = context\.payload\.client_payload\.git\?\.sha \?\? context\.sha;/,
  );
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

test('release rehearsal requires distinct candidate-bound quality, high-risk, browser, and isolated Preview records', async () => {
  const rehearsal = await readFile(
    path.join(process.cwd(), 'scripts/prelaunch-rehearsal.mjs'),
    'utf8',
  );
  const workflow = await readFile(
    path.join(process.cwd(), '.github/workflows/prelaunch-rehearsal.yml'),
    'utf8',
  );

  assert.match(rehearsal, /candidate-quality/);
  assert.match(rehearsal, /high-risk/);
  assert.match(rehearsal, /local-browser/);
  assert.match(rehearsal, /preview-browser/);
  assert.match(rehearsal, /preview-outage/);
  assert.match(rehearsal, /\['pnpm', \['install', '--frozen-lockfile', '--ignore-scripts'\]\]/);
  assert.match(rehearsal, /run-e2e-fixture\.mjs/);
  assert.match(rehearsal, /data-adapter-empty/);
  assert.match(rehearsal, /CANDIDATE_QUALITY_ENV/);
  assert.match(rehearsal, /HIGH_RISK_UNSET_ENV/);
  assert.match(workflow, /run-preview-release-tracer/);
  assert.match(workflow, /preview-outage/);
  assert.match(workflow, /discover-rehearsal-preview-deployments/);
  assert.match(workflow, /SCHOLARSCOUT_REHEARSAL_BASELINE_CAPABILITY/);
  assert.match(workflow, /SCHOLARSCOUT_REHEARSAL_OUTAGE_CAPABILITY/);
  assert.match(rehearsal, /Local candidate rehearsal is incomplete/);
  assert.match(rehearsal, /aggregateLocalReleaseRecords/);
});

test('release aggregation requires two distinct Vercel rehearsal records', async () => {
  const outputDir = await mkdtemp(path.join(tmpdir(), 'scholarscout-preview-cleanup-'));
  const candidateCommit = 'candidate-commit';
  const laneRecords = {
    'candidate-quality': { candidateCommit, target: 'candidate', outcome: 'passed' },
    'high-risk': { candidateCommit, target: 'candidate', outcome: 'passed' },
    'local-browser': { candidateCommit, target: 'local', outcome: 'passed' },
    'preview-browser': { candidateCommit, target: 'https://scholar-scout-baseline-scholar-scout.vercel.app', outcome: 'passed' },
    'preview-outage': { candidateCommit, target: 'https://scholar-scout-outage-scholar-scout.vercel.app', outcome: 'passed' },
  };
  for (const [lane, record] of Object.entries(laneRecords)) {
    await writeFile(path.join(outputDir, `${lane}.json`), `${JSON.stringify(record)}\n`);
  }

  const args = [
    'scripts/prelaunch-rehearsal.mjs',
    '--release-gate',
    '--aggregate-only',
    '--candidate-commit',
    candidateCommit,
    '--output-dir',
    outputDir,
    '--preview-browser-record',
    path.join(outputDir, 'preview-browser.json'),
    '--preview-outage-record',
    path.join(outputDir, 'preview-outage.json'),
  ];

  const passed = await runNode(args);
  assert.equal(passed.code, 0, passed.stderr);

  laneRecords['preview-outage'].target = laneRecords['preview-browser'].target;
  await writeFile(path.join(outputDir, 'preview-outage.json'), `${JSON.stringify(laneRecords['preview-outage'])}\n`);
  const duplicate = await runNode(args);
  assert.equal(duplicate.code, 1);
  assert.match(duplicate.stderr, /Release rehearsal is incomplete/);
});

test('local release rehearsal records and reports a failed local lane', async () => {
  const outputDir = await mkdtemp(path.join(tmpdir(), 'scholarscout-release-lane-failure-'));
  const commandLog = path.join(outputDir, 'pnpm-commands.log');
  const launcherPath = path.join(outputDir, isWindows ? 'pnpm.cmd' : 'pnpm');
  const launcherContents = isWindows
    ? [
      '@echo off',
      'echo %*>> "%SCHOLARSCOUT_TEST_COMMAND_LOG%"',
      ':next',
      'if "%~1"=="" exit /b 0',
      'if /I "%~1"=="test" exit /b 1',
      'shift',
      'goto next',
      '',
    ].join('\r\n')
    : [
      '#!/bin/sh',
      'echo "$*" >> "$SCHOLARSCOUT_TEST_COMMAND_LOG"',
      'for arg in "$@"; do [ "$arg" = "test" ] && exit 1; done',
      'exit 0',
      '',
    ].join('\n');
  await writeFile(launcherPath, launcherContents);
  if (!isWindows) await chmod(launcherPath, 0o755);
  const result = await runNode(
    [
      'scripts/prelaunch-rehearsal.mjs',
      '--release-gate',
      '--local-only',
      '--candidate-commit',
      'candidate-commit',
      '--output-dir',
      outputDir,
    ],
    {
      PATH: outputDir,
      Path: outputDir,
      SCHOLARSCOUT_TEST_COMMAND_LOG: commandLog,
    },
  );

  assert.equal(result.code, 1);
  assert.match(result.stderr, /Local candidate rehearsal is incomplete/);
  const record = JSON.parse(
    await readFile(path.join(outputDir, 'candidate-quality.json'), 'utf8'),
  );
  assert.deepEqual(record, {
    candidateCommit: 'candidate-commit',
    recordedAt: record.recordedAt,
    commands: [
      'pnpm install --frozen-lockfile --ignore-scripts',
      'pnpm test',
      'pnpm run lint',
      'pnpm run typecheck',
      'pnpm run build:vercel',
    ],
    outcome: 'failed',
    errorCategory: 'command-failed',
    failedCommand: 'pnpm test',
  });
  assert.deepEqual(
    (await readFile(commandLog, 'utf8')).trim().split(/\r?\n/),
    [
      'install --frozen-lockfile --ignore-scripts',
      'test',
    ],
  );
  await assert.rejects(readFile(path.join(outputDir, 'high-risk.json'), 'utf8'));
  await assert.rejects(readFile(path.join(outputDir, 'local-browser.json'), 'utf8'));
});

test('prelaunch workflow orders candidate proof before independent Preview lanes and aggregation', async () => {
  const workflow = await readFile(
    path.join(process.cwd(), '.github/workflows/prelaunch-rehearsal.yml'),
    'utf8',
  );

  const chromiumInstall = workflow.indexOf('Install Chromium for browser proof');
  const localProof = workflow.indexOf('Run candidate quality, high-risk, and local browser proof');
  const previewBrowser = workflow.indexOf('Baseline rehearsal');
  const previewOutage = workflow.indexOf('Outage rehearsal and restoration proof');
  const aggregate = workflow.indexOf('Aggregate candidate release rehearsal');
  const candidateCheckout = workflow.indexOf('Verify candidate checkout');

  assert.match(workflow, /uses: actions\/checkout@v4\s+with:\s+ref: \$\{\{ inputs\.candidate_commit \}\}/);
  assert.match(workflow, /test "\$\(git rev-parse HEAD\)" = "\$\{\{ inputs\.candidate_commit \}\}"/);
  assert.ok(candidateCheckout >= 0);
  assert.ok(candidateCheckout < chromiumInstall);
  assert.ok(chromiumInstall >= 0);
  assert.match(workflow, /pnpm exec playwright install --with-deps chromium/);
  assert.ok(localProof > chromiumInstall);
  assert.ok(previewBrowser > localProof);
  assert.ok(previewOutage > previewBrowser);
  assert.ok(aggregate > previewOutage);
  assert.match(workflow, /Wait for the two isolated rehearsal deployments/);
  assert.match(workflow, /environment:\s*Preview/);
  assert.match(workflow, /SCHOLARSCOUT_REHEARSAL_BASELINE_HOST_PREFIX:\s*scholar-scout-rehearsal-baseline-/);
  assert.match(workflow, /SCHOLARSCOUT_REHEARSAL_OUTAGE_HOST_PREFIX:\s*scholar-scout-rehearsal-outage-/);
  assert.doesNotMatch(workflow, /vars\.SCHOLARSCOUT_REHEARSAL_(BASELINE|OUTAGE)_HOST_PREFIX/);
  assert.match(workflow, /Install Vercel deployment reader/);
  assert.match(workflow, /SCHOLARSCOUT_VERCEL_BASELINE_TOKEN:\s*\$\{\{ secrets\.SCHOLARSCOUT_VERCEL_BASELINE_TOKEN \}\}/);
  assert.match(workflow, /SCHOLARSCOUT_VERCEL_OUTAGE_TOKEN:\s*\$\{\{ secrets\.SCHOLARSCOUT_VERCEL_OUTAGE_TOKEN \}\}/);
  assert.doesNotMatch(workflow, /\bVERCEL_TOKEN:\s*\$\{\{ secrets\.VERCEL_TOKEN \}\}/);
  assert.match(workflow, /--baseline-project scholar-scout-rehearsal-baseline/);
  assert.match(workflow, /--outage-project scholar-scout-rehearsal-outage/);
  assert.match(workflow, /--vercel-scope scholar-scout/);
  assert.doesNotMatch(workflow, /SCHOLARSCOUT_GITHUB_DEPLOYMENTS_TOKEN|deployments:\s*read/);
  assert.doesNotMatch(workflow, /SCHOLARSCOUT_PREVIEW_METADATA|SCHOLARSCOUT_PREVIEW_OUTAGE_METADATA/);
  assert.doesNotMatch(workflow, /--prod|promote|alias/);
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
  assert.match(
    report,
    /pnpm run rehearse:prelaunch -- --skip-smoke --env-file/,
  );
  assert.doesNotMatch(report, /\bnpm run/);
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
  assert.match(
    report,
    /pnpm run rehearse:prelaunch -- --env-file .env.production.local/,
  );
  assert.doesNotMatch(report, /\bnpm run/);
});

test('portable Corepack helpers target the supported Node 24 runtime', async () => {
  const portable = await readFile(path.join(process.cwd(), 'scripts/pnpm-portable.ps1'), 'utf8');
  const activation = await readFile(path.join(process.cwd(), 'scripts/use-portable-node.ps1'), 'utf8');
  assert.match(portable, /node-v24\.21\.0-win-x64/);
  assert.match(activation, /Node\.js 24\.x/);
});

function runNode(args, env = {}) {
  return runCommand(nodeBin, args, { ...validRecoverySigning, ...env });
}

function productionEnv() {
  return {
    NEXTAUTH_URL: 'https://scholarscout.example.org',
    NEXTAUTH_SECRET: 'abcdefghijklmnopqrstuvwxyz1234567890',
    SCHOLARSCOUT_STAFF_EMAILS: 'staff@example.org',
    SCHOLARSCOUT_HEALTH_TOKEN: 'health-token-1234567890',
    GITHUB_CLIENT_ID: 'github-client-id',
    GITHUB_CLIENT_SECRET: 'github-client-secret',
    SCHOLARSCOUT_DATA_ADAPTER: 'vercel-blob',
    SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN: 'blob-token-1234567890',
    SCHOLARSCOUT_SMOKE_EXPECTED_ADAPTER: 'vercel-blob',
    SCHOLARSCOUT_SMOKE_EXPECTED_PROVIDERS: 'github',
    ...validRecoverySigning,
  };
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
