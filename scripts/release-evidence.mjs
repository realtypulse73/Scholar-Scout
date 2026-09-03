#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const CANDIDATE_QUALITY_COMMANDS = [
  'pnpm install --frozen-lockfile --ignore-scripts',
  'pnpm test',
  'pnpm run lint',
  'pnpm run typecheck',
  'pnpm run build',
];

export const HIGH_RISK_COMMANDS = [
  'pnpm --filter @scholar-scout/web test --runInBand __tests__/api/advisor-chat.test.ts __tests__/api/account-guest-routes.test.ts',
  'pnpm --filter @scholar-scout/web test --runInBand __tests__/api/campus-notes.test.ts __tests__/api/peer-connections.test.ts',
  'pnpm --filter @scholar-scout/codex-webhook-runner test',
  'pnpm --filter @scholar-scout/http-data-service test',
];

export const LOCAL_BROWSER_COMMAND =
  'node scripts/run-e2e-fixture.mjs --spec apps/web/e2e/student-release-journey.spec.ts --project chromium';
export const LOCAL_BROWSER_SETUP_COMMAND = 'pnpm exec playwright install chromium';

const REQUIRED_KINDS = [
  'candidate-quality',
  'high-risk',
  'local-browser',
  'preview-browser',
  'preview-outage',
];

const RECORD_KEYS = {
  'candidate-quality': ['candidateCommit', 'commands', 'kind', 'result', 'utc'],
  'high-risk': ['candidateCommit', 'commands', 'kind', 'result', 'utc'],
  'local-browser': ['candidateCommit', 'command', 'kind', 'result', 'utc'],
  'preview-browser': [
    'artifactUrl',
    'candidateCommit',
    'deploymentId',
    'kind',
    'result',
    'safeCategory',
    'utc',
  ],
  'preview-outage': [
    'artifactUrl',
    'baseDeploymentId',
    'candidateCommit',
    'cleanup',
    'deploymentId',
    'kind',
    'result',
    'restored',
    'safeCategory',
    'utc',
  ],
};

export async function runLocalReleaseEvidence({
  candidateCommit,
  outputDir,
  runCommand = runShellCommand,
  now = () => new Date().toISOString(),
}) {
  assertCandidateCommit(candidateCommit);
  await mkdir(outputDir, { recursive: true });

  const quality = await runLane({
    kind: 'candidate-quality',
    candidateCommit,
    commands: CANDIDATE_QUALITY_COMMANDS,
    runCommand,
    now,
  });
  await writeRecord(outputDir, quality);
  assertPassed(quality);

  const highRisk = await runLane({
    kind: 'high-risk',
    candidateCommit,
    commands: HIGH_RISK_COMMANDS,
    runCommand,
    now,
  });
  await writeRecord(outputDir, highRisk);
  assertPassed(highRisk);

  const browserSetup = await runCommand(LOCAL_BROWSER_SETUP_COMMAND);
  if (browserSetup.code !== 0) {
    throw new Error('Local browser setup failed.');
  }

  const localBrowser = await runLane({
    kind: 'local-browser',
    candidateCommit,
    commands: [LOCAL_BROWSER_COMMAND],
    runCommand,
    now,
  });
  const localBrowserRecord = {
    kind: localBrowser.kind,
    candidateCommit: localBrowser.candidateCommit,
    utc: localBrowser.utc,
    command: LOCAL_BROWSER_COMMAND,
    result: localBrowser.result,
  };
  await writeRecord(outputDir, localBrowserRecord);
  assertPassed(localBrowserRecord);

  return [quality, highRisk, localBrowserRecord];
}

export function validateReleaseEvidence(candidateCommit, records) {
  assertCandidateCommit(candidateCommit);
  if (!Array.isArray(records) || records.length !== REQUIRED_KINDS.length) {
    throw new Error('Release evidence is incomplete.');
  }

  const byKind = new Map(records.map((record) => [record?.kind, record]));
  if (byKind.size !== REQUIRED_KINDS.length) {
    throw new Error('Release evidence lanes must be distinct.');
  }

  for (const kind of REQUIRED_KINDS) {
    const record = byKind.get(kind);
    validateRecord(kind, candidateCommit, record);
  }

  return {
    category: 'passed',
    candidateCommit,
    lanes: [...REQUIRED_KINDS],
  };
}

export async function readReleaseEvidence(outputDir) {
  return Promise.all(
    REQUIRED_KINDS.map(async (kind) => JSON.parse(
      await readFile(path.join(outputDir, `${kind}.json`), 'utf8'),
    )),
  );
}

async function runLane({ kind, candidateCommit, commands, runCommand, now }) {
  for (const command of commands) {
    const result = await runCommand(command);
    if (result.code !== 0) {
      return {
        kind,
        candidateCommit,
        utc: now(),
        commands: [...commands],
        result: 'failed',
      };
    }
  }

  return {
    kind,
    candidateCommit,
    utc: now(),
    commands: [...commands],
    result: 'passed',
  };
}

function validateRecord(kind, candidateCommit, record) {
  if (!record || record.kind !== kind || record.candidateCommit !== candidateCommit) {
    throw new Error(`Release evidence mismatch for ${kind}.`);
  }
  if (record.result !== 'passed' || !isUtc(record.utc)) {
    throw new Error(`Release evidence did not pass for ${kind}.`);
  }
  if (Object.keys(record).sort().join(',') !== RECORD_KEYS[kind].sort().join(',')) {
    throw new Error(`Release evidence contains unapproved fields for ${kind}.`);
  }

  if (kind === 'candidate-quality' && !sameCommands(record.commands, CANDIDATE_QUALITY_COMMANDS)) {
    throw new Error('Candidate quality commands are missing or out of order.');
  }
  if (kind === 'high-risk' && !sameCommands(record.commands, HIGH_RISK_COMMANDS)) {
    throw new Error('High-risk commands are missing or out of order.');
  }
  if (kind === 'local-browser' && record.command !== LOCAL_BROWSER_COMMAND) {
    throw new Error('Local browser evidence used an unapproved command.');
  }
  if (kind === 'preview-browser') {
    validatePreviewFields(record);
  }
  if (kind === 'preview-outage') {
    validatePreviewFields(record);
    if (
      record.restored !== true ||
      record.cleanup !== 'passed' ||
      !isDeploymentId(record.baseDeploymentId) ||
      record.baseDeploymentId === record.deploymentId
    ) {
      throw new Error('Preview outage cleanup or restoration is unverified.');
    }
  }
}

function validatePreviewFields(record) {
  if (
    record.safeCategory !== 'passed' ||
    !isDeploymentId(record.deploymentId) ||
    !isApprovedArtifactUrl(record.artifactUrl)
  ) {
    throw new Error(`Preview evidence is invalid for ${record.kind}.`);
  }
}

function assertCandidateCommit(value) {
  if (typeof value !== 'string' || !/^[0-9a-f]{40}$/i.test(value)) {
    throw new Error('A 40-character candidate commit is required.');
  }
}

function assertPassed(record) {
  if (record.result !== 'passed') {
    throw new Error(`${record.kind} evidence failed.`);
  }
}

function sameCommands(actual, expected) {
  return Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((command, index) => command === expected[index]);
}

function isUtc(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function isDeploymentId(value) {
  return typeof value === 'string' && /^dpl_[A-Za-z0-9_-]+$/.test(value);
}

function isApprovedArtifactUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' &&
      ['github.com', 'vercel.com'].includes(url.hostname);
  } catch {
    return false;
  }
}

async function writeRecord(outputDir, record) {
  await writeFile(
    path.join(outputDir, `${record.kind}.json`),
    `${JSON.stringify(record)}\n`,
    { mode: 0o600 },
  );
}

function runShellCommand(command) {
  return new Promise((resolve) => {
    const child = spawn(command, [], {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'inherit',
      // Every command comes from an immutable constant above; no user input is
      // interpolated into the shell command.
      shell: true,
    });
    child.once('close', (code) => resolve({ code: code ?? 1 }));
    child.once('error', () => resolve({ code: 1 }));
  });
}

async function main() {
  const values = process.argv.slice(2);
  const candidateCommit = readArg(values, '--candidate-commit');
  const outputDir = path.resolve(readArg(values, '--output-dir') || 'reports/prelaunch-rehearsal/release-evidence');

  if (values.includes('--local-only')) {
    await runLocalReleaseEvidence({ candidateCommit, outputDir });
    return;
  }
  if (values.includes('--aggregate')) {
    const outcome = validateReleaseEvidence(
      candidateCommit,
      await readReleaseEvidence(outputDir),
    );
    await writeFile(path.join(outputDir, 'release-gate.json'), `${JSON.stringify(outcome)}\n`);
    console.log(JSON.stringify(outcome));
    return;
  }
  throw new Error('Choose --local-only or --aggregate for release evidence.');
}

function readArg(values, name) {
  const index = values.indexOf(name);
  return index >= 0 ? values[index + 1] ?? '' : '';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => {
    console.error('Release evidence failed.');
    process.exitCode = 1;
  });
}
