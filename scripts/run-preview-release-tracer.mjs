import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  classifyFixtureLifecycleFailure,
  createLifecycleRequest as createFixtureLifecycleRequest,
  FixtureLifecycleError,
  runFixtureLifecycle,
} from './e2e-fixture-lifecycle.mjs';
import {
  createLifecycleProtectionHeaders,
  createProtectedPreviewContextOptions,
} from './preview-deployment-protection.mjs';
import { attestPreviewDeployment as attestGithubPreviewDeployment } from './preview-deployment-attestation.mjs';
import { runStudentReleaseJourney } from './student-release-journey.mjs';

const CAPABILITY_ENV = 'SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY';
const DEPLOYMENTS_TOKEN_ENV = 'SCHOLARSCOUT_GITHUB_DEPLOYMENTS_TOKEN';
const GITHUB_OWNER = 'realtypulse73';
const GITHUB_REPOSITORY = 'Scholar-Scout';

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
  previewUrl,
  env = process.env,
  attestPreviewDeployment = attestGithubPreviewDeployment,
  createLifecycleRequest = createFixtureLifecycleRequest,
  createBrowser = createProtectedBrowser,
  runStudentSpec = ({ browser }) => runStudentReleaseJourney(browser.page),
} = {}) {
  let attestation;
  try {
    attestation = await attestPreviewDeployment({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPOSITORY,
      candidateCommit,
      submittedUrl: previewUrl,
      githubToken: env[DEPLOYMENTS_TOKEN_ENV],
    });
  } catch {
    return createSafeOutcome('failed', undefined, candidateCommit, 'preview-attestation-failed');
  }
  const protectedOptions = createProtectedPreviewContextOptions({
    attestation,
    candidateCommit,
    env,
  });
  const capability = getLifecycleCapability(env);
  const request = createLifecycleRequest(
    protectedOptions.baseURL,
    capability,
    createLifecycleProtectionHeaders(protectedOptions.extraHTTPHeaders),
  );
  let browser;

  try {
    return await runFixtureLifecycle({
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
  } catch (error) {
    if (!(error instanceof FixtureLifecycleError)) throw error;
    return createSafeOutcome(
      'failed',
      protectedOptions.baseURL,
      candidateCommit,
      classifyFixtureLifecycleFailure(error),
    );
  }
}

async function runCli() {
  const outputFlag = process.argv.indexOf('--output');
  const outputPath = outputFlag >= 0 ? process.argv[outputFlag + 1] : '';
  const candidateCommit = process.env.GITHUB_SHA;
  const previewUrl = process.env.SCHOLARSCOUT_BASELINE_PREVIEW_URL;
  if (!outputPath || !candidateCommit || !previewUrl) {
    throw new Error('Preview tracer requires a candidate commit, Preview URL, and output path.');
  }
  const outcome = await runPreviewReleaseTracer({
    candidateCommit,
    previewUrl,
  });
  const record = { ...outcome, recordedAt: new Date().toISOString() };
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(record, null, 2)}\n`);
  if (record.outcome !== 'passed') process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli().catch(() => { process.exitCode = 1; });
}
