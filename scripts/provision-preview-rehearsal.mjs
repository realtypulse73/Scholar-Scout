#!/usr/bin/env node

import { randomBytes, randomUUID } from 'node:crypto';
import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function provisionPreviewRehearsal({
  localFile = '.env.preview-rehearsal.local',
  reportFile = 'reports/preview-rehearsal-provisioning.md',
  force = false,
} = {}) {
  const resolvedLocalFile = path.resolve(localFile || '.env.preview-rehearsal.local');
  const resolvedReportFile = path.resolve(reportFile || 'reports/preview-rehearsal-provisioning.md');

  if (!force && await exists(resolvedLocalFile)) {
    throw new Error(`Preview rehearsal handoff already exists at ${resolvedLocalFile}. Re-run with --force to replace it.`);
  }

  const baselineFixtureId = randomUUID();
  const outageFixtureId = randomUUID();
  const baselineCapability = token(32);
  const outageCapability = token(32);

  await mkdir(path.dirname(resolvedLocalFile), { recursive: true });
  await mkdir(path.dirname(resolvedReportFile), { recursive: true });
  await writeFile(resolvedLocalFile, [
    '# One-time ScholarScout Preview rehearsal handoff.',
    '# Generated locally. Do not commit, print, or paste this file.',
    '# Delete it after the successful rehearsal and secret rotation.',
    '',
    '# Baseline protected Preview only',
    `BASELINE_SCHOLARSCOUT_E2E_FIXTURE_ID=${baselineFixtureId}`,
    `BASELINE_SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY=${baselineCapability}`,
    '',
    '# Separate one-off outage Preview only',
    `OUTAGE_SCHOLARSCOUT_E2E_FIXTURE_ID=${outageFixtureId}`,
    `OUTAGE_SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY=${outageCapability}`,
    '',
  ].join('\n'));
  await writeFile(resolvedReportFile, [
    '# ScholarScout Preview Rehearsal Provisioning',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Secret Handoff',
    '',
    `- Local one-time handoff: \`${path.relative(process.cwd(), resolvedLocalFile)}\``,
    '- The handoff contains two distinct lifecycle scopes: baseline and outage.',
    '- Its values are intentionally omitted from this report and all workflow artifacts.',
    '',
    '## Authorized Deployment Controls',
    '',
    '1. For the baseline protected Preview, set `SCHOLARSCOUT_E2E_FIXTURE=true`, then map the baseline fixture ID and capability from the local handoff to `SCHOLARSCOUT_E2E_FIXTURE_ID` and `SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY` for that one deployment only.',
    '2. For the separate outage Preview, set the same fixture enablement with the outage fixture ID and capability, plus `SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE=1`, for that one deployment only.',
    '3. In GitHub Actions repository secrets, map the baseline capability to `SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY` and the outage capability to `SCHOLARSCOUT_E2E_OUTAGE_FIXTURE_CAPABILITY`.',
    '4. Add Vercel protection bypass and scrubbed candidate-bound Preview metadata separately. Do not place bypass material in this handoff.',
    '5. Delete this local handoff after the rehearsal and rotate both capabilities. Do not use either value for production, aliases, or later Preview deployments.',
    '',
  ].join('\n'));

  return { localFile: resolvedLocalFile, reportFile: resolvedReportFile };
}

function parseArgs(args) {
  const options = { localFile: '', reportFile: '', force: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--force') options.force = true;
    else if (arg === '--local-file') options.localFile = args[++index] ?? '';
    else if (arg === '--report-file') options.reportFile = args[++index] ?? '';
    else throw new Error('Preview rehearsal provisioning accepts only --local-file, --report-file, and --force.');
  }
  return options;
}

function token(bytes) {
  return randomBytes(bytes).toString('base64url');
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options = parseArgs(process.argv.slice(2));
  provisionPreviewRehearsal(options).then(({ localFile, reportFile }) => {
    console.log(`Generated one-time Preview rehearsal handoff: ${localFile}`);
    console.log(`Generated scrubbed provisioning report: ${reportFile}`);
  }).catch((error) => {
    process.exitCode = 1;
    console.error(error.message);
  });
}
