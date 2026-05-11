#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { loadEnvFileFromArgs } from './env-file.mjs';

const args = parseArgs(process.argv.slice(2));
loadEnvFileFromArgs(process.argv.slice(2));
const outputDir = path.resolve(args.outputDir || 'reports/prelaunch-rehearsal');
const envReportPath = path.join(outputDir, 'production-env-readiness.json');
const smokeReportPath = path.join(outputDir, 'production-smoke-report.json');
const toolingLogPath = path.join(outputDir, 'production-tooling-test.txt');
const summaryPath = path.join(outputDir, 'prelaunch-summary.md');
const steps = [];

await mkdir(outputDir, { recursive: true });

steps.push(
  await runStep({
    name: 'Production env readiness',
    command: process.execPath,
    args: childArgs(['scripts/production-env-check.mjs', '--json']),
    outputPath: envReportPath,
  }),
);

if (!args.skipToolingTests) {
  steps.push(
    await runStep({
      name: 'Production tooling tests',
      command: process.execPath,
      args: ['--test', 'scripts/test-production-tooling.mjs'],
      outputPath: toolingLogPath,
    }),
  );
} else {
  steps.push({ name: 'Production tooling tests', status: 'skipped' });
}

if (!args.skipSmoke && hasSmokeTarget()) {
  steps.push(
    await runStep({
      name: 'Production smoke',
      command: process.execPath,
      args: childArgs(['scripts/production-smoke.mjs', '--json']),
      outputPath: smokeReportPath,
    }),
  );
} else {
  steps.push({
    name: 'Production smoke',
    status: 'skipped',
    detail: args.skipSmoke
      ? 'Skipped by --skip-smoke.'
      : 'Set SCHOLARSCOUT_SMOKE_BASE_URL or NEXTAUTH_URL to run smoke checks.',
  });
}

const summary = await buildSummary();
await writeFile(summaryPath, summary);

steps.forEach((step) => {
  const marker =
    step.status === 'passed' ? 'PASS' : step.status === 'skipped' ? 'SKIP' : 'FAIL';
  console.log(`${marker} ${step.name}${step.detail ? ` - ${step.detail}` : ''}`);
});
console.log(`Prelaunch rehearsal summary: ${summaryPath}`);

if (steps.some((step) => step.status === 'failed')) {
  process.exitCode = 1;
}

async function runStep(input) {
  const result = await runCommand(input.command, input.args);
  await writeFile(input.outputPath, result.stdout || result.stderr);

  return {
    name: input.name,
    status: result.code === 0 ? 'passed' : 'failed',
    detail: input.outputPath,
  };
}

async function buildSummary() {
  const reportArgs = ['scripts/production-report-summary.mjs'];

  if (steps.some((step) => step.name === 'Production env readiness')) {
    reportArgs.push('--env-report', envReportPath);
  }

  if (
    steps.some(
      (step) => step.name === 'Production smoke' && step.status !== 'skipped',
    )
  ) {
    reportArgs.push('--smoke-report', smokeReportPath);
  }

  const report = await runCommand(process.execPath, reportArgs);
  const stepList = steps
    .map((step) => `- ${step.status}: ${step.name}${step.detail ? ` (${step.detail})` : ''}`)
    .join('\n');

  return [
    '# ScholarScout Prelaunch Rehearsal',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Steps',
    '',
    stepList,
    '',
    report.stdout || report.stderr,
  ].join('\n');
}

function runCommand(command, commandArgs) {
  return new Promise((resolve) => {
    const child = spawn(command, commandArgs, {
      cwd: process.cwd(),
      env: process.env,
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

function hasSmokeTarget() {
  return Boolean(
    process.env.SCHOLARSCOUT_SMOKE_BASE_URL || process.env.NEXTAUTH_URL,
  );
}

function parseArgs(values) {
  const parsed = {
    outputDir: '',
    skipSmoke: false,
    skipToolingTests: false,
    envFile: '',
  };

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];

    if (value === '--output-dir') {
      parsed.outputDir = values[index + 1] ?? '';
      index += 1;
    } else if (value === '--skip-smoke') {
      parsed.skipSmoke = true;
    } else if (value === '--skip-tooling-tests') {
      parsed.skipToolingTests = true;
    } else if (value === '--env-file') {
      parsed.envFile = values[index + 1] ?? '';
      index += 1;
    }
  }

  return parsed;
}

function childArgs(values) {
  if (!args.envFile) {
    return values;
  }

  return [...values, '--env-file', args.envFile];
}
