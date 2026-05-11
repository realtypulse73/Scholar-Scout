#!/usr/bin/env node

import { readFile } from 'node:fs/promises';

const args = parseArgs(process.argv.slice(2));

if (args.help || (!args.envReport && !args.smokeReport)) {
  printHelp();
  process.exit(args.help ? 0 : 1);
}

const sections = [];

if (args.envReport) {
  sections.push(
    renderReportSection(
      'Production Env Readiness',
      await readJson(args.envReport),
      {
        passLabel: 'passed',
        warnLabel: 'warnings',
        failLabel: 'failures',
        statusMap: {
          pass: 'Pass',
          warn: 'Warn',
          fail: 'Fail',
        },
      },
    ),
  );
}

if (args.smokeReport) {
  sections.push(
    renderReportSection('Production Smoke', await readJson(args.smokeReport), {
      passLabel: 'passed',
      warnLabel: 'skipped',
      failLabel: 'failed',
      statusMap: {
        passed: 'Pass',
        skipped: 'Skipped',
        failed: 'Fail',
      },
    }),
  );
}

console.log(`# ScholarScout Production Report\n\n${sections.join('\n\n')}`);

function renderReportSection(title, report, options) {
  const summary = report.summary ?? {};
  const checks = Array.isArray(report.checks) ? report.checks : [];
  const blocking = checks.filter((check) =>
    ['fail', 'failed'].includes(check.status),
  );
  const caution = checks.filter((check) =>
    ['warn', 'skipped'].includes(check.status),
  );

  return [
    `## ${title}`,
    '',
    `Summary: ${summary[options.passLabel] ?? 0} passed, ${summary[options.warnLabel] ?? 0} ${options.warnLabel}, ${summary[options.failLabel] ?? 0} ${options.failLabel}.`,
    '',
    renderCheckList('Blocking Items', blocking, options.statusMap),
    '',
    renderCheckList('Warnings And Skips', caution, options.statusMap),
  ].join('\n');
}

function renderCheckList(title, checks, statusMap) {
  if (checks.length === 0) {
    return `### ${title}\n\nNone.`;
  }

  return [
    `### ${title}`,
    '',
    ...checks.map((check) => {
      const status = statusMap[check.status] ?? check.status;
      const detail = check.detail ? ` - ${check.detail}` : '';
      return `- ${status}: ${check.name}${detail}`;
    }),
  ].join('\n');
}

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Could not read JSON report at ${filePath}: ${error.message}`);
  }
}

function parseArgs(values) {
  const parsed = {
    envReport: '',
    smokeReport: '',
    help: false,
  };

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];

    if (value === '--env-report') {
      parsed.envReport = values[index + 1] ?? '';
      index += 1;
    } else if (value === '--smoke-report') {
      parsed.smokeReport = values[index + 1] ?? '';
      index += 1;
    } else if (value === '--help' || value === '-h') {
      parsed.help = true;
    }
  }

  return parsed;
}

function printHelp() {
  console.log(`Usage: node scripts/production-report-summary.mjs [options]

Options:
  --env-report PATH     JSON report from npm run check:production-env -- --json
  --smoke-report PATH   JSON report from npm run smoke:production -- --json
  --help                Show this help text
`);
}
