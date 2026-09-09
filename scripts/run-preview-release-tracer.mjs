import { chromium } from '@playwright/test';

import {
  createLifecycleRequest as createFixtureLifecycleRequest,
  runFixtureLifecycle,
} from './e2e-fixture-lifecycle.mjs';
import { createProtectedPreviewContextOptions } from './preview-deployment-protection.mjs';
import { runStudentReleaseJourney } from './student-release-journey.mjs';

const CAPABILITY_ENV = 'SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY';

function getLifecycleCapability(env) {
  const capability = env[CAPABILITY_ENV];
  if (typeof capability !== 'string' || capability.length === 0) {
    throw new Error('Preview tracer requires a runner-owned fixture lifecycle capability.');
  }
  return capability;
}

function createSafeOutcome(outcome, baseURL, candidateCommit, errorCategory) {
  return {
    outcome,
    target: baseURL,
    candidateCommit,
    ...(errorCategory ? { errorCategory } : {}),
  };
}

async function createProtectedBrowser(options) {
  const browser = await chromium.launch();
  const context = await browser.newContext(options);
  const page = await context.newPage();
  return {
    page,
    close: async () => {
      await context.close();
      await browser.close();
    },
  };
}

/**
 * Executes the journey inside the runner process so Vercel protection stays in memory.
 */
export async function runPreviewReleaseTracer({
  candidateCommit,
  metadata,
  env = process.env,
  createLifecycleRequest = createFixtureLifecycleRequest,
  createBrowser = createProtectedBrowser,
  runStudentSpec = ({ browser }) => runStudentReleaseJourney(browser.page),
} = {}) {
  const protectedOptions = createProtectedPreviewContextOptions({
    metadata,
    candidateCommit,
    env,
  });
  const capability = getLifecycleCapability(env);
  const request = createLifecycleRequest(
    protectedOptions.baseURL,
    capability,
    protectedOptions.extraHTTPHeaders,
  );
  let browser;

  return runFixtureLifecycle({
    request,
    run: async () => {
      try {
        browser = await createBrowser({
          ...protectedOptions,
          ignoreHTTPSErrors: false,
        });
        await runStudentSpec({
          browser,
          baseURL: protectedOptions.baseURL,
          childEnv: {},
          diagnostics: { trace: 'off', screenshot: 'off', video: 'off' },
        });
        return createSafeOutcome('passed', protectedOptions.baseURL, candidateCommit);
      } catch {
        return createSafeOutcome(
          'failed',
          protectedOptions.baseURL,
          candidateCommit,
          'student-tracer-failed',
        );
      } finally {
        await browser?.close();
      }
    },
  });
}
