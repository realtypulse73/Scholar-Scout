#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import http from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  CANDIDATE_QUALITY_COMMANDS,
  HIGH_RISK_COMMANDS,
  LOCAL_BROWSER_COMMAND,
  LOCAL_BROWSER_SETUP_COMMAND,
  runLocalReleaseEvidence,
  validateReleaseEvidence,
} from './release-evidence.mjs';

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

test('release evidence runs immutable quality, high-risk, and local browser lanes in order', async () => {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'scholarscout-release-evidence-'));
  const commands = [];
  const candidateCommit = 'a'.repeat(40);

  const records = await runLocalReleaseEvidence({
    candidateCommit,
    outputDir: tempDir,
    now: () => '2026-09-03T00:00:00.000Z',
    runCommand: async (command) => {
      commands.push(command);
      return { code: 0 };
    },
  });

  assert.deepEqual(commands, [
    ...CANDIDATE_QUALITY_COMMANDS,
    ...HIGH_RISK_COMMANDS,
    LOCAL_BROWSER_SETUP_COMMAND,
    LOCAL_BROWSER_COMMAND,
  ]);
  assert.deepEqual(records.map(({ kind }) => kind), [
    'candidate-quality',
    'high-risk',
    'local-browser',
  ]);
  assert.equal(records.every(({ result }) => result === 'passed'), true);
});

test('release evidence stops before later lanes after the first failed command', async () => {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'scholarscout-release-failure-'));
  const commands = [];

  await assert.rejects(
    runLocalReleaseEvidence({
      candidateCommit: 'b'.repeat(40),
      outputDir: tempDir,
      runCommand: async (command) => {
        commands.push(command);
        return { code: command === CANDIDATE_QUALITY_COMMANDS[1] ? 1 : 0 };
      },
    }),
    /candidate-quality evidence failed/i,
  );

  assert.deepEqual(commands, CANDIDATE_QUALITY_COMMANDS.slice(0, 2));
});

test('release gate requires five distinct candidate-bound scrubbed passing records', () => {
  const candidateCommit = 'c'.repeat(40);
  const utc = '2026-09-03T00:00:00.000Z';
  const records = [
    {
      kind: 'candidate-quality',
      candidateCommit,
      utc,
      commands: [...CANDIDATE_QUALITY_COMMANDS],
      result: 'passed',
    },
    {
      kind: 'high-risk',
      candidateCommit,
      utc,
      commands: [...HIGH_RISK_COMMANDS],
      result: 'passed',
    },
    {
      kind: 'local-browser',
      candidateCommit,
      utc,
      command: LOCAL_BROWSER_COMMAND,
      result: 'passed',
    },
    {
      kind: 'preview-browser',
      candidateCommit,
      utc,
      result: 'passed',
      safeCategory: 'passed',
      deploymentId: 'dpl_preview',
      artifactUrl: 'https://github.com/example/repo/actions/runs/1',
    },
    {
      kind: 'preview-outage',
      candidateCommit,
      utc,
      result: 'passed',
      safeCategory: 'passed',
      deploymentId: 'dpl_outage',
      baseDeploymentId: 'dpl_preview',
      artifactUrl: 'https://vercel.com/example/deployments/outage',
      cleanup: 'passed',
      restored: true,
    },
  ];

  assert.deepEqual(validateReleaseEvidence(candidateCommit, records), {
    category: 'passed',
    candidateCommit,
    lanes: [
      'candidate-quality',
      'high-risk',
      'local-browser',
      'preview-browser',
      'preview-outage',
    ],
  });
  assert.throws(
    () => validateReleaseEvidence(candidateCommit, records.slice(0, 4)),
    /incomplete/i,
  );
  assert.throws(
    () => validateReleaseEvidence(candidateCommit, records.map((record) => (
      record.kind === 'preview-browser' ? { ...record, result: 'failed' } : record
    ))),
    /did not pass/i,
  );
  assert.throws(
    () => validateReleaseEvidence(candidateCommit, records.map((record) => (
      record.kind === 'preview-browser' ? { ...record, cookie: 'forbidden' } : record
    ))),
    /unapproved fields/i,
  );
  assert.throws(
    () => validateReleaseEvidence('d'.repeat(40), records),
    /mismatch/i,
  );
});

test('release evidence docs keep candidate, Preview, and Production proof distinct', async () => {
  const [template, runbook] = await Promise.all([
    readFile(path.join(process.cwd(), 'docs/prelaunch-evidence-template.md'), 'utf8'),
    readFile(path.join(process.cwd(), 'docs/production-release-runbook.md'), 'utf8'),
  ]);

  for (const value of [
    'Candidate Quality',
    'Local browser journey',
    'Protected Preview browser journey',
    'Preview outage and restoration',
  ]) {
    assert.match(template, new RegExp(value, 'i'));
  }
  assert.match(runbook, /pnpm install --frozen-lockfile --ignore-scripts/);
  assert.match(runbook, /one\s+record cannot satisfy another lane/i);
  assert.match(runbook, /never replace.*Production/is);
  assert.match(runbook, /Neither lane may target\s+Production, promote a deployment, create an alias/is);
});

test('prelaunch workflow orders local proof before isolated Preview outage and cleanup', async () => {
  const workflow = await readFile(
    path.join(process.cwd(), '.github/workflows/prelaunch-rehearsal.yml'),
    'utf8',
  );

  assert.match(workflow, /candidate_commit:/);
  assert.match(workflow, /refs\/heads\/worktree-agent-/);
  assert.match(workflow, /candidate-evidence:[\s\S]*preview-evidence:/);
  assert.match(workflow, /rehearse:release-evidence[\s\S]*--local-only/);
  assert.match(workflow, /run-preview-release-tracer\.mjs/);
  assert.match(workflow, /SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE=1/);
  assert.match(workflow, /run-preview-outage-tracer\.mjs/);
  assert.match(workflow, /Prove base Preview remained restored/);
  assert.match(workflow, /SCHOLARSCOUT_E2E_PURGE_DATA_ON_CLEANUP=true/);
  assert.match(workflow, /randomBytes\(24\)/);
  assert.match(workflow, /vercel remove/);
  assert.match(workflow, /--skip-domain/);
  assert.match(workflow, /--aggregate/);
  assert.doesNotMatch(workflow, /--prod\b|vercel promote/);
  assert.doesNotMatch(
    workflow,
    /--env "?SCHOLARSCOUT_(?:VERCEL_PROTECTION_BYPASS|E2E_FIXTURE_CAPABILITY)=/,
  );
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

test('portable Corepack pnpm wrapper accepts direct pnpm arguments', { skip: !isWindows }, async () => {
  const result = await runCommand(
    'powershell',
    [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      'scripts\\pnpm-portable.ps1',
      '--version',
    ],
  );

  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /\d+\.\d+\.\d+/);
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
