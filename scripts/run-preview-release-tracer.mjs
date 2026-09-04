import { request as requestHttps } from 'node:https';

import { runFixtureLifecycle } from './e2e-fixture-lifecycle.mjs';
import {
  createPreviewContextOptions,
  createPreviewSteadyStateHeaders,
  getVerifiedPreviewMetadata,
  scrubPreviewTracerOutcome,
  VERCEL_BYPASS_COOKIE_HEADER,
} from './preview-deployment-protection.mjs';

const FIXTURE_CAPABILITY_NAME = 'SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY';
const CANDIDATE_COMMIT_NAME = 'SCHOLARSCOUT_PREVIEW_CANDIDATE_COMMIT';
const RECOMMENDATIONS_HYDRATION_TIMEOUT_MS = 10_000;

function getFixtureCapability(environment) {
  const capability = environment[FIXTURE_CAPABILITY_NAME];
  if (typeof capability !== 'string' || !capability) {
    throw new Error('A runner-only fixture capability is required before tracer traffic.');
  }
  return capability;
}

function getCandidateCommit(environment, candidateCommit) {
  const value = candidateCommit ?? environment[CANDIDATE_COMMIT_NAME];
  if (typeof value !== 'string' || !/^[0-9a-f]{40}$/i.test(value)) {
    throw new Error('A candidate commit is required before tracer traffic.');
  }
  return value;
}

function requestPreview(baseUrl, method, path, headers) {
  return new Promise((resolve, reject) => {
    const request = requestHttps(new URL(path, baseUrl), {
      method,
      headers,
    }, (response) => {
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
          reject(new Error('Protected Preview lifecycle returned an invalid response.'));
        }
      });
    });
    request.once('error', reject);
    request.setTimeout(30_000, () => request.destroy(new Error('Protected Preview lifecycle timed out.')));
    request.end();
  });
}

function createLifecycleRequest({ metadata, contextOptions, request }) {
  const lifecycleHeaders = { ...contextOptions.extraHTTPHeaders };
  delete lifecycleHeaders[VERCEL_BYPASS_COOKIE_HEADER];

  return async (method, path, options) => request(method, path, {
    ...options,
    headers: {
      ...lifecycleHeaders,
      ...options.headers,
    },
  });
}

async function runStudentReleaseJourney({ page, expect }) {
  const bootstrap = await page.request.get('/api/account/onboarding');
  expect(bootstrap.ok()).toBe(true);
  await expect(bootstrap.json()).resolves.toEqual({ profile: null });

  await page.goto('/programmes');
  await expect(page.getByRole('heading', { name: 'Programmes worth exploring' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Programme results' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Generated Technology Pathway' }).first()).toBeVisible();

  const shortlistButton = page.getByRole('button', { name: 'Save to shortlist' }).first();
  await shortlistButton.click();
  await expect(page.getByRole('button', { name: 'Saved to shortlist' }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Saved to shortlist' }).first()).toBeVisible();

  await page.goto('/onboarding');
  await page.getByRole('button', { name: 'Technology' }).click();
  await page.getByRole('button', { name: 'Online degree' }).click();
  await page.getByRole('button', { name: 'Continue to next step' }).click();
  await page.getByRole('button', { name: '3.0 – 3.4' }).click();
  await page.getByRole('button', { name: 'In-State' }).click();
  await page.getByRole('button', { name: 'Continue to next step' }).click();
  await page.getByRole('button', { name: /balanced/i }).click();
  await page.getByRole('button', { name: 'Career counseling' }).click();
  await page.getByRole('button', { name: 'Continue to next step' }).click();
  await page.getByRole('button', { name: 'Save my pathway profile' }).click();
  await expect(page.getByRole('heading', { name: "You're all set! 🎉" })).toBeVisible();

  const profileResponse = await page.request.get('/api/account/onboarding');
  expect(profileResponse.ok()).toBe(true);
  await expect(profileResponse.json()).resolves.toEqual({ profile: expect.any(Object) });

  await page.goto('/recommendations');
  // This standalone runner does not load playwright.config.ts. Preserve its
  // configured wait for the client-hydrated recommendation context explicitly.
  await expect(page.getByRole('heading', { name: 'Your best next move' })).toBeVisible({
    timeout: RECOMMENDATIONS_HYDRATION_TIMEOUT_MS,
  });
  await expect(
    page.getByRole('heading', { name: 'Generated Technology Pathway' }).first(),
  ).toBeVisible({ timeout: RECOMMENDATIONS_HYDRATION_TIMEOUT_MS });

  await page.goto('/simulate');
  await page.getByRole('button', {
    name: 'Inspect the labeled electrical panel and lockout area first.',
  }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', {
    name: 'Remove the damaged cord, tag it out, and route a safer temporary line.',
  }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', {
    name: 'Solving real physical problems with tools and skill.',
  }).click();
  await page.getByRole('button', { name: 'Finish simulation' }).click();
  await expect(page.getByText('Simulation complete')).toBeVisible();
}

/**
 * Runs the fixed server fixture lifecycle before any browser navigation. This
 * programmatic invocation keeps the Vercel bypass and lifecycle capability out
 * of child arguments and child environments.
 */
export async function runPreviewReleaseTracer({
  candidateCommit,
  environment = process.env,
  request = (method, path, options) => requestPreview(
    environment.SCHOLARSCOUT_PREVIEW_URL,
    method,
    path,
    options.headers,
  ),
  browser,
  runStudentJourney,
} = {}) {
  const expectedCommit = getCandidateCommit(environment, candidateCommit);
  const metadata = getVerifiedPreviewMetadata(environment, expectedCommit);
  const contextOptions = createPreviewContextOptions(metadata, environment);
  const capability = getFixtureCapability(environment);

  if (!browser || typeof browser.newContext !== 'function') {
    throw new Error('A protected browser runner is required before tracer traffic.');
  }
  if (typeof runStudentJourney !== 'function') {
    throw new Error('The existing student release journey is required before tracer traffic.');
  }

  const lifecycleRequest = createLifecycleRequest({ metadata, contextOptions, request });
  let context;
  try {
    await runFixtureLifecycle({
      baseUrl: metadata.url,
      capability,
      request: lifecycleRequest,
      run: async () => {
        context = await browser.newContext({
          baseURL: contextOptions.baseURL,
          extraHTTPHeaders: contextOptions.extraHTTPHeaders,
          ignoreHTTPSErrors: contextOptions.ignoreHTTPSErrors,
        });
        const page = await context.newPage();
        await page.goto('/');
        await context.setExtraHTTPHeaders(
          createPreviewSteadyStateHeaders(contextOptions),
        );
        try {
          await runStudentJourney({ page, context, metadata });
        } catch {
          throw new Error('Student journey failed.');
        }
      },
    });
  } finally {
    await context?.close();
  }

  return scrubPreviewTracerOutcome({ category: 'passed', metadata });
}

async function runFromEnvironment() {
  const { chromium, expect } = await import('@playwright/test');
  const browser = await chromium.launch({ headless: true });
  try {
    return await runPreviewReleaseTracer({
      browser,
      runStudentJourney: (args) => runStudentReleaseJourney({ ...args, expect }),
    });
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && process.argv[1].endsWith('run-preview-release-tracer.mjs')) {
  runFromEnvironment().then((outcome) => {
    console.log(JSON.stringify(outcome));
  }).catch(() => {
    console.error('Protected Preview tracer failed.');
    process.exitCode = 1;
  });
}
