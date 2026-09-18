#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { loadEnvFileFromArgs } from './env-file.mjs';

const SAFE_RECORD_FIELDS = new Set(['candidateCommit', 'target', 'artifact', 'recordedAt', 'command', 'commands', 'outcome', 'errorCategory', 'failedCommand', 'failedTest', 'failureDetail']);
const REQUIRED_RELEASE_LANES = ['candidate-quality', 'high-risk', 'local-browser', 'preview-browser', 'preview-outage'];
const REQUIRED_LOCAL_RELEASE_LANES = ['candidate-quality', 'high-risk', 'local-browser'];
const CANDIDATE_QUALITY_COMMANDS = [
  ['pnpm', ['install', '--frozen-lockfile', '--ignore-scripts']],
  ['pnpm', ['test']],
  ['pnpm', ['run', 'lint']],
  ['pnpm', ['run', 'typecheck']],
  ['pnpm', ['run', 'build']],
];
const HIGH_RISK_COMMANDS = [
  ['pnpm', ['--filter', '@scholar-scout/web', 'test', '--runInBand', '__tests__/api/advisor-chat.test.ts', '__tests__/api/account-guest-routes.test.ts', '__tests__/api/campus-notes.test.ts', '__tests__/api/peer-connections.test.ts']],
  ['pnpm', ['--filter', '@scholar-scout/codex-webhook-runner', 'test']],
  ['pnpm', ['--filter', '@scholar-scout/http-data-service', 'test']],
  ['pnpm', ['test:production-tooling']],
];
const LOCAL_BROWSER_COMMAND = [process.execPath, ['scripts/run-e2e-fixture.mjs', '--spec', 'apps/web/e2e/student-release-journey.spec.ts', '--project', 'chromium']];

export function validateReleaseRecord(record, lane, candidateCommit) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return false;
  if (!REQUIRED_RELEASE_LANES.includes(lane)) return false;
  if (record.candidateCommit !== candidateCommit || record.outcome !== 'passed') return false;
  return Object.keys(record).every((field) => SAFE_RECORD_FIELDS.has(field));
}

export function aggregateReleaseRecords(records, candidateCommit) {
  return REQUIRED_RELEASE_LANES.every((lane) => validateReleaseRecord(records[lane], lane, candidateCommit));
}

export function aggregateLocalReleaseRecords(records, candidateCommit) {
  return REQUIRED_LOCAL_RELEASE_LANES.every((lane) => validateReleaseRecord(records[lane], lane, candidateCommit));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  loadEnvFileFromArgs(process.argv.slice(2));
  const outputDir = path.resolve(args.outputDir || 'reports/prelaunch-rehearsal');
  await mkdir(outputDir, { recursive: true });

  if (args.releaseGate) {
    const candidateCommit = args.candidateCommit || process.env.GITHUB_SHA;
    if (!candidateCommit) throw new Error('Release rehearsal requires an explicit candidate commit.');
    const records = args.aggregateOnly
      ? {
          'candidate-quality': await loadRequiredRecord(path.join(outputDir, 'candidate-quality.json'), 'candidate-quality', candidateCommit),
          'high-risk': await loadRequiredRecord(path.join(outputDir, 'high-risk.json'), 'high-risk', candidateCommit),
          'local-browser': await loadRequiredRecord(path.join(outputDir, 'local-browser.json'), 'local-browser', candidateCommit),
        }
      : {};
    if (!args.aggregateOnly) {
      records['candidate-quality'] = await runReleaseLane('candidate-quality', candidateCommit, CANDIDATE_QUALITY_COMMANDS, outputDir);
      if (records['candidate-quality'].outcome === 'passed') records['high-risk'] = await runReleaseLane('high-risk', candidateCommit, HIGH_RISK_COMMANDS, outputDir);
      if (records['high-risk']?.outcome === 'passed') records['local-browser'] = await runReleaseLane('local-browser', candidateCommit, [LOCAL_BROWSER_COMMAND], outputDir);
    }
    if (args.localOnly) {
      if (!aggregateLocalReleaseRecords(records, candidateCommit)) {
        throw new Error('Local candidate rehearsal is incomplete: every required local lane must pass.');
      }
      return;
    }
    records['preview-browser'] = await loadRequiredRecord(args.previewBrowserRecord, 'preview-browser', candidateCommit);
    records['preview-outage'] = await loadRequiredRecord(args.previewOutageRecord, 'preview-outage', candidateCommit);
    await writeFile(path.join(outputDir, 'release-records.json'), `${JSON.stringify(records, null, 2)}\n`);
    if (!aggregateReleaseRecords(records, candidateCommit)) throw new Error('Release rehearsal is incomplete: every candidate-bound lane must pass independently.');
    await writeFile(path.join(outputDir, 'prelaunch-summary.md'), buildReleaseSummary(records));
    return;
  }

  const steps = [];
  const envReportPath = path.join(outputDir, 'production-env-readiness.json');
  const smokeReportPath = path.join(outputDir, 'production-smoke-report.json');
  const toolingLogPath = path.join(outputDir, 'production-tooling-test.txt');
  steps.push(await runStep({ name: 'Production env readiness', command: process.execPath, args: childArgs(['scripts/production-env-check.mjs', '--json'], args), outputPath: envReportPath }));
  if (!args.skipToolingTests) steps.push(await runStep({ name: 'Production tooling tests', command: process.execPath, args: ['--test', 'scripts/test-production-tooling.mjs'], outputPath: toolingLogPath }));
  else steps.push({ name: 'Production tooling tests', status: 'skipped' });
  if (!args.skipSmoke && hasSmokeTarget()) steps.push(await runStep({ name: 'Production smoke', command: process.execPath, args: childArgs(['scripts/production-smoke.mjs', '--json'], args), outputPath: smokeReportPath }));
  else steps.push({ name: 'Production smoke', status: 'skipped', detail: args.skipSmoke ? 'Skipped by --skip-smoke.' : 'Set SCHOLARSCOUT_SMOKE_BASE_URL or NEXTAUTH_URL to run smoke checks.' });
  await writeFile(path.join(outputDir, 'prelaunch-summary.md'), buildLegacySummary(steps));
  if (steps.some((step) => step.status === 'failed')) process.exitCode = 1;
}

async function runReleaseLane(lane, candidateCommit, commands, outputDir) {
  const recordedAt = new Date().toISOString();
  const commandList = commands.map(formatCommand);
  const record = { candidateCommit, recordedAt, commands: commandList, outcome: 'passed' };
  for (const [command, commandArgs] of commands) {
    const result = await runCommand(command, commandArgs);
    if (result.code !== 0) {
      record.outcome = 'failed';
      record.errorCategory = 'command-failed';
      record.failedCommand = formatCommand([command, commandArgs]);
      const failedTest = parseFailedTestName(result.stdout);
      if (failedTest) record.failedTest = failedTest;
      const failureDetail = parseSafeFailureDetail(`${result.stdout}\n${result.stderr}`);
      if (failureDetail) record.failureDetail = failureDetail;
      break;
    }
  }
  if (commandList.length === 1) record.command = commandList[0];
  await writeFile(path.join(outputDir, `${lane}.json`), `${JSON.stringify(record, null, 2)}\n`);
  return record;
}

async function loadRequiredRecord(recordPath, lane, candidateCommit) {
  if (!recordPath) return undefined;
  try { const record = JSON.parse(await readFile(recordPath, 'utf8')); return validateReleaseRecord(record, lane, candidateCommit) ? record : undefined; } catch { return undefined; }
}

function formatCommand([command, args]) { return [command, ...args].join(' '); }
function parseFailedTestName(output) {
  const nodeTestName = output.match(/^not ok \d+ - ([^\r\n]+)/m)?.[1];
  if (nodeTestName) return nodeTestName;
  return output.match(/^\s*FAIL\s+([^\r\n]+)/m)?.[1]?.trim();
}
export function parseSafeFailureDetail(output) {
  const lifecycle = output.match(/E2E fixture (provision|verification|cleanup|transport) lifecycle request failed\./);
  if (lifecycle) return `fixture-${lifecycle[1]}`;
  const journey = output.match(/Student release journey failed during (profile-read|catalogue|onboarding(?:-(?:open|interest|pathway|next-one|gpa|location|next-two|support|next-three|save|complete|persist))?|shortlist|recommendations|simulation) \((ambiguous|blocked|timeout|failed)\)\./);
  if (journey) return `journey-${journey[1]}-${journey[2]}`;
  if (output.includes('Owned E2E application process did not become ready.')) return 'fixture-not-ready';
  if (output.includes('Browser test runner failed.')) return 'browser-runner';
  return undefined;
}
function buildReleaseSummary(records) { return ['# ScholarScout Candidate Release Rehearsal', '', `Generated: ${new Date().toISOString()}`, '', '## Required Proof Lanes', '', ...REQUIRED_RELEASE_LANES.map((lane) => `- ${records[lane]?.outcome ?? 'missing'}: ${lane}`), '', 'Records contain only candidate commit, UTC, command, pass/fail, safe category, and approved target/artifact identifiers or links. Preview evidence supplements and never replaces protected-main, production deployment, or post-deploy smoke evidence.', ''].join('\n'); }
function buildLegacySummary(steps) { return ['# ScholarScout Prelaunch Rehearsal', '', `Generated: ${new Date().toISOString()}`, '', '## Steps', '', ...steps.map((step) => `- ${step.status}: ${step.name}${step.detail ? ` (${step.detail})` : ''}`), ''].join('\n'); }
async function runStep(input) { const result = await runCommand(input.command, input.args); await writeFile(input.outputPath, result.stdout || result.stderr); return { name: input.name, status: result.code === 0 ? 'passed' : 'failed', detail: input.outputPath }; }
function runCommand(command, commandArgs) { return new Promise((resolve) => { const useWindowsPnpmLauncher = process.platform === 'win32' && command === 'pnpm'; const executable = useWindowsPnpmLauncher ? 'pnpm.cmd' : command; let child; try { child = spawn(executable, commandArgs, { cwd: process.cwd(), env: process.env, shell: useWindowsPnpmLauncher }); } catch { resolve({ code: 1, stdout: '', stderr: '' }); return; } let stdout = ''; let stderr = ''; child.stdout?.on('data', (chunk) => { stdout += chunk; }); child.stderr?.on('data', (chunk) => { stderr += chunk; }); child.on('error', () => resolve({ code: 1, stdout, stderr })); child.on('close', (code) => resolve({ code, stdout, stderr })); }); }
function hasSmokeTarget() { return Boolean(process.env.SCHOLARSCOUT_SMOKE_BASE_URL || process.env.NEXTAUTH_URL); }
function parseArgs(values) { const parsed = { outputDir: '', skipSmoke: false, skipToolingTests: false, envFile: '', releaseGate: false, localOnly: false, aggregateOnly: false, candidateCommit: '', previewBrowserRecord: '', previewOutageRecord: '' }; for (let index = 0; index < values.length; index += 1) { const value = values[index]; if (value === '--skip-smoke') parsed.skipSmoke = true; else if (value === '--skip-tooling-tests') parsed.skipToolingTests = true; else if (value === '--release-gate') parsed.releaseGate = true; else if (value === '--local-only') parsed.localOnly = true; else if (value === '--aggregate-only') parsed.aggregateOnly = true; else if (['--output-dir', '--env-file', '--candidate-commit', '--preview-browser-record', '--preview-outage-record'].includes(value)) { const key = value.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()); parsed[key] = values[index + 1] ?? ''; index += 1; } } return parsed; }
function childArgs(values, args) { return args.envFile ? [...values, '--env-file', args.envFile] : values; }

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
