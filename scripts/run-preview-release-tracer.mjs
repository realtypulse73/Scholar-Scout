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
import {
  runStudentReleaseJourney,
  STUDENT_RELEASE_JOURNEY_TIMEOUT_MS,
  StudentReleaseJourneyError,
} from './student-release-journey.mjs';
import { attestPreviewDeployment as attestGithubPreviewDeployment } from './preview-deployment-attestation.mjs';

const CAPABILITY_ENV = 'SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY';
const CANDIDATE_COMMIT_ENV = 'SCHOLARSCOUT_CANDIDATE_COMMIT';
const PREVIEW_URL_ENV = 'SCHOLARSCOUT_PREVIEW_URL';
const DEPLOYMENTS_TOKEN_ENV = 'SCHOLARSCOUT_GITHUB_DEPLOYMENTS_TOKEN';
const WORKFLOW_TOKEN_ENV = 'GITHUB_TOKEN';
const GITHUB_OWNER = 'realtypulse73';
const GITHUB_REPOSITORY = 'Scholar-Scout';
const BASELINE_REHEARSAL_ENVIRONMENT = 'Preview – scholar-scout-rehearsal-baseline';

function getLifecycleCapability(env) {
  const capability = env[CAPABILITY_ENV];
  if (typeof capability !== 'string' || capability.length === 0) {
    throw new Error('Preview tracer requires a runner-owned fixture lifecycle capability.');
  }
  return capability;
}

function getDeploymentReadToken(env) {
  const dedicatedToken = env[DEPLOYMENTS_TOKEN_ENV];
  return typeof dedicatedToken === 'string' && dedicatedToken.length > 0
    ? dedicatedToken
    : env[WORKFLOW_TOKEN_ENV];
}

function createSafeOutcome(outcome, baseURL, candidateCommit, errorCategory) {
  return {
    outcome,
    target: baseURL,
    candidateCommit,
    ...(errorCategory ? { errorCategory } : {}),
  };
}

function classifyStudentTracerFailure(error) {
  if (error instanceof StudentReleaseJourneyError) {
    const causeMessage = error.cause instanceof Error ? error.cause.message : '';
    return `student-${error.stage}-${causeMessage.includes('Timeout') ? 'timeout' : 'failed'}`;
  }
  const message = error instanceof Error ? error.message : '';
  if (message.includes('did not start with an empty profile')) {
    return 'student-profile-not-empty';
  }
  if (message.includes('did not expose the governed programme')) {
    return 'student-programme-not-visible';
  }
  if (message.includes('profile did not persist')) {
    return 'student-onboarding-not-persisted';
  }
  if (message.includes('Timeout')) {
    return 'student-journey-timeout';
  }
  return 'student-tracer-failed';
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
  metadata,
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
      submittedUrl: previewUrl ?? metadata?.url,
      expectedEnvironment: BASELINE_REHEARSAL_ENVIRONMENT,
      githubToken: getDeploymentReadToken(env),
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
            timeoutMs: STUDENT_RELEASE_JOURNEY_TIMEOUT_MS,
          });
          return createSafeOutcome('passed', protectedOptions.baseURL, candidateCommit);
        } catch (error) {
          return createSafeOutcome(
            'failed',
            protectedOptions.baseURL,
            candidateCommit,
            classifyStudentTracerFailure(error),
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

export function createPreviewMetadata(url, candidateCommit) {
  const normalizedUrl = typeof url === 'string' ? url.trim().replace(/\/$/, '') : '';
  if (!normalizedUrl) {
    throw new Error('Preview tracer requires a Preview URL workflow input.');
  }
  return { environment: 'preview', url: normalizedUrl, commit: candidateCommit };
}

function classifyCliConfigurationFailure(error) {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('Preview URL workflow input')) {
    return 'preview-url-invalid';
  }
  if (message.includes('runner-only protection material')) {
    return 'preview-bypass-invalid';
  }
  if (message.includes('runner-owned fixture lifecycle capability')) {
    return 'preview-capability-invalid';
  }
  return 'preview-runner-configuration-invalid';
}

async function runCli() {
  const outputFlag = process.argv.indexOf('--output');
  const outputPath = outputFlag >= 0 ? process.argv[outputFlag + 1] : '';
  const candidateCommit = process.env[CANDIDATE_COMMIT_ENV] ?? process.env.GITHUB_SHA;
  if (!outputPath || !candidateCommit) {
    throw new Error('Preview tracer requires a candidate commit and an output path.');
  }
  let outcome;
  try {
    outcome = await runPreviewReleaseTracer({
      candidateCommit,
      previewUrl: createPreviewMetadata(
        process.env[PREVIEW_URL_ENV] ?? process.env.SCHOLARSCOUT_BASELINE_PREVIEW_URL,
        candidateCommit,
      ).url,
    });
  } catch (error) {
    outcome = createSafeOutcome(
      'failed',
      process.env.NEXTAUTH_URL ?? '',
      candidateCommit,
      classifyCliConfigurationFailure(error),
    );
  }
  const record = { ...outcome, recordedAt: new Date().toISOString() };
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(record, null, 2)}\n`);
  // The record contains only the scrubbed release-evidence fields, so it is
  // safe to surface the failure category in an Actions log for triage.
  process.stdout.write(`Preview release tracer record: ${JSON.stringify(record)}\n`);
  if (record.outcome !== 'passed') process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli().catch(() => { process.exitCode = 1; });
}
