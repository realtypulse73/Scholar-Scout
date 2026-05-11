#!/usr/bin/env node

import { access, mkdir, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import path from 'node:path';

const args = parseArgs(process.argv.slice(2));
const envFile = path.resolve(args.localFile || '.env.production.local');
const reportFile = path.resolve(
  args.reportFile || 'reports/production-provider-setup.md',
);
const productionUrl = args.productionUrl || 'https://YOUR_DOMAIN';
const staffEmails = args.staffEmails || 'staff@example.org';

if (!args.force && (await exists(envFile))) {
  console.error(
    `Production env file already exists at ${envFile}. Re-run with --force to replace it.`,
  );
  process.exit(1);
}

await mkdir(path.dirname(envFile), { recursive: true });
await mkdir(path.dirname(reportFile), { recursive: true });

const nextAuthSecret = token(48);
const healthToken = token(32);

await writeFile(
  envFile,
  [
    '# ScholarScout production values handoff',
    '# Generated locally. Do not commit this file.',
    '# Replace placeholder values before public launch.',
    '',
    `NEXTAUTH_URL=${productionUrl}`,
    `NEXTAUTH_SECRET=${nextAuthSecret}`,
    `SCHOLARSCOUT_STAFF_EMAILS=${staffEmails}`,
    `SCHOLARSCOUT_HEALTH_TOKEN=${healthToken}`,
    '',
    '# Configure at least one OAuth provider.',
    'GOOGLE_CLIENT_ID=',
    'GOOGLE_CLIENT_SECRET=',
    'GITHUB_CLIENT_ID=',
    'GITHUB_CLIENT_SECRET=',
    '',
    '# Recommended pilot durable storage on Vercel.',
    'SCHOLARSCOUT_DATA_ADAPTER=vercel-blob',
    'SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN=',
    'SCHOLARSCOUT_BLOB_DATA_PATH=scholarscout/data.json',
    '',
    '# HTTP adapter alternative. Leave blank when using Vercel Blob.',
    'SCHOLARSCOUT_DATA_SERVICE_URL=',
    'SCHOLARSCOUT_DATA_SERVICE_TOKEN=',
    '',
    '# Smoke and monitoring secrets.',
    `SCHOLARSCOUT_SMOKE_BASE_URL=${productionUrl}`,
    `SCHOLARSCOUT_SMOKE_HEALTH_TOKEN=${healthToken}`,
    'SCHOLARSCOUT_SMOKE_EXPECTED_ADAPTER=vercel-blob',
    'SCHOLARSCOUT_SMOKE_EXPECTED_PROVIDERS=google',
    'SCHOLARSCOUT_SMOKE_MAX_HEALTH_AGE_MINUTES=5',
    'SCHOLARSCOUT_SMOKE_TIMEOUT_MS=10000',
    'SCHOLARSCOUT_SMOKE_RETRIES=1',
    'SCHOLARSCOUT_SMOKE_MAX_LATENCY_MS=',
    '',
  ].join('\n'),
);

await writeFile(
  reportFile,
  [
    '# ScholarScout Provider Hosting Setup',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Files',
    '',
    `- Local production handoff file: \`${path.relative(process.cwd(), envFile)}\``,
    '- This file is ignored by git. Do not paste it into tickets or chat.',
    '',
    '## Provider Actions',
    '',
    '1. Create or access the Vercel project and deploy ScholarScout from this repository.',
    '2. Confirm Vercel permissions with `docs/vercel-permissions-handoff.md`.',
    '3. In Vercel Project Settings, set environment variables from `.env.production.local` for Production and Preview as appropriate.',
    '4. In Vercel Storage, create a Private Blob store connected to the project and copy its read-write token into `SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN` or `BLOB_READ_WRITE_TOKEN`.',
    '5. Create a Google or GitHub OAuth client. Use `docs/google-oauth-permissions-handoff.md` for the Google access request. Use the deployed callback URL:',
    `   - Google: \`${productionUrl}/api/auth/callback/google\``,
    `   - GitHub: \`${productionUrl}/api/auth/callback/github\``,
    '6. Copy OAuth client id/secret into Vercel environment variables.',
    '7. Add GitHub Actions repository secrets for readiness, smoke, and prelaunch workflows.',
    '8. Redeploy after environment variables are set.',
    '9. Run `npm run rehearse:prelaunch -- --env-file .env.production.local` locally or trigger the Prelaunch Rehearsal workflow.',
    '',
    '## GitHub Actions Secrets To Add',
    '',
    '- `NEXTAUTH_URL`',
    '- `NEXTAUTH_SECRET`',
    '- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` or `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`',
    '- `SCHOLARSCOUT_STAFF_EMAILS`',
    '- `SCHOLARSCOUT_HEALTH_TOKEN`',
    '- `SCHOLARSCOUT_DATA_ADAPTER`',
    '- `SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN` or `BLOB_READ_WRITE_TOKEN`',
    '- `SCHOLARSCOUT_BLOB_DATA_PATH`',
    '- `SCHOLARSCOUT_SMOKE_BASE_URL`',
    '- `SCHOLARSCOUT_SMOKE_HEALTH_TOKEN`',
    '- `SCHOLARSCOUT_SMOKE_EXPECTED_ADAPTER`',
    '- `SCHOLARSCOUT_SMOKE_EXPECTED_PROVIDERS`',
    '',
  ].join('\n'),
);

console.log(`Generated production env handoff: ${envFile}`);
console.log(`Generated provider setup report: ${reportFile}`);

function parseArgs(values) {
  const parsed = {
    force: false,
    localFile: '',
    reportFile: '',
    productionUrl: '',
    staffEmails: '',
  };

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];

    if (value === '--force') {
      parsed.force = true;
    } else if (value === '--local-file') {
      parsed.localFile = values[index + 1] ?? '';
      index += 1;
    } else if (value === '--report-file') {
      parsed.reportFile = values[index + 1] ?? '';
      index += 1;
    } else if (value === '--production-url') {
      parsed.productionUrl = values[index + 1] ?? '';
      index += 1;
    } else if (value === '--staff-emails') {
      parsed.staffEmails = values[index + 1] ?? '';
      index += 1;
    }
  }

  return parsed;
}

function token(byteLength) {
  return randomBytes(byteLength).toString('base64url');
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
