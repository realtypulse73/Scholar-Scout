#!/usr/bin/env node

import { request as requestHttps } from 'node:https';

import {
  createPreviewContextOptions,
  createPreviewSteadyStateHeaders,
  getVerifiedPreviewMetadata,
  VERCEL_BYPASS_COOKIE_HEADER,
} from './preview-deployment-protection.mjs';

const PROTOCOL = 'lifecycle-v1';
const LIFECYCLE_PATH = '/api/internal/e2e-fixture';

export async function runPreviewOutageTracer({
  browser,
  expect,
  environment = process.env,
  request = requestPreview,
}) {
  const candidateCommit = environment.SCHOLARSCOUT_PREVIEW_CANDIDATE_COMMIT;
  const metadata = getVerifiedPreviewMetadata(environment, candidateCommit);
  const contextOptions = createPreviewContextOptions(metadata, environment);
  const capability = requireValue(environment.SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY);
  const email = requireValue(environment.SCHOLARSCOUT_E2E_STUDENT_EMAIL);
  const password = requireValue(environment.SCHOLARSCOUT_E2E_STUDENT_PASSWORD);
  const fixtureId = requireValue(environment.SCHOLARSCOUT_E2E_FIXTURE_ID);
  if (!email.endsWith('@example.test') || password.length < 12) {
    throw new Error('Outage student credentials must be generated test-only values.');
  }
  const lifecycleHeaders = { ...contextOptions.extraHTTPHeaders };
  delete lifecycleHeaders[VERCEL_BYPASS_COOKIE_HEADER];
  const lifecycleRequest = (method) => request(
    metadata.url,
    method,
    LIFECYCLE_PATH,
    {
      ...lifecycleHeaders,
      'content-length': '0',
      'x-scholarscout-e2e-fixture-capability': capability,
      'x-scholarscout-e2e-fixture-protocol': PROTOCOL,
    },
  );
  let context;
  let outcome;

  try {
    const created = await lifecycleRequest('POST');
    if (!created.ok || created.phase !== 'verified') {
      throw new Error('Outage fixture creation failed.');
    }

    context = await browser.newContext(contextOptions);
    const page = await context.newPage();
    await page.goto('/');
    await context.setExtraHTTPHeaders(createPreviewSteadyStateHeaders(contextOptions));

    await page.goto('/auth/sign-up');
    await page.getByLabel('Name').fill('Generated Preview Student');
    await page.getByLabel('Student email address').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Create your student account' }).click();
    await expect(page).toHaveURL(/\/profile$/);

    const noteBody = `Generated outage note ${fixtureId}`;
    const inboxBody = `Generated outage inbox ${fixtureId}`;
    const note = await page.request.post('/api/campus-notes', {
      data: {
        school_slug: 'north-valley-college',
        uploader_username: null,
        program_id: null,
        body: noteBody,
      },
    });
    if (note.status() !== 503) throw new Error('Outage note was not denied.');
    const noteResult = await note.json();
    if (noteResult.error !== 'Community submissions are temporarily unavailable.') {
      throw new Error('Outage note response was not safe.');
    }

    const inbox = await page.request.post('/api/peer-connections', {
      data: {
        uploader_username: 'maya-health',
        program_id: 'north-valley-health',
        body: inboxBody,
      },
    });
    if (inbox.status() !== 503) throw new Error('Outage inbox was not denied.');
    const inboxResult = await inbox.json();
    if (inboxResult.error !== 'Inbox requests are temporarily unavailable. Please try again later.') {
      throw new Error('Outage inbox response was not safe.');
    }

    const noWrite = await lifecycleRequest('PUT');
    if (!noWrite.ok || noWrite.phase !== 'no-write') {
      throw new Error('Outage no-write proof failed.');
    }

    outcome = {
      category: 'passed',
      candidateCommit,
      deploymentId: metadata.deploymentId,
      cleanup: 'passed',
    };
  } finally {
    try {
      const cleaned = await lifecycleRequest('DELETE');
      if (!cleaned.ok || cleaned.phase !== 'cleaned') {
        throw new Error('Outage fixture cleanup failed.');
      }
    } finally {
      await context?.close();
    }
  }

  return outcome;
}

function requestPreview(baseUrl, method, requestPath, headers) {
  return new Promise((resolve, reject) => {
    const request = requestHttps(new URL(requestPath, baseUrl), { method, headers }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.once('error', reject);
      response.once('end', () => {
        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
          resolve({ ok: false, phase: 'denied' });
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error('Outage lifecycle returned an invalid response.'));
        }
      });
    });
    request.once('error', reject);
    request.setTimeout(30_000, () => request.destroy(new Error('Outage lifecycle timed out.')));
    request.end();
  });
}

function requireValue(value) {
  if (typeof value !== 'string' || !value) {
    throw new Error('Required outage runner configuration is unavailable.');
  }
  return value;
}

async function main() {
  const { chromium, expect } = await import('@playwright/test');
  const browser = await chromium.launch({ headless: true });
  try {
    console.log(JSON.stringify(await runPreviewOutageTracer({ browser, expect })));
  } finally {
    await browser.close();
  }
}

if (process.argv[1]?.endsWith('run-preview-outage-tracer.mjs')) {
  main().catch(() => {
    console.error('Protected Preview outage tracer failed.');
    process.exitCode = 1;
  });
}
