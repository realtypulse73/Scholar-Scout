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
import { runStudentReleaseJourney } from './student-release-journey.mjs';

const CAPABILITY_ENV = 'SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY';
const CANDIDATE_COMMIT_ENV = 'SCHOLARSCOUT_CANDIDATE_COMMIT';

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

function parseRunnerMetadata(value) {
  try {
    const metadata = JSON.parse(value ?? '');
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      throw new Error();
    }
    return metadata;
  } catch {
    throw new Error('Preview tracer requires scrubbed Preview deployment metadata.');
  }
}

function classifyCliConfigurationFailure(error) {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('scrubbed Preview deployment metadata')) {
    return 'preview-metadata-invalid';
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
      metadata: parseRunnerMetadata(process.env.SCHOLARSCOUT_PREVIEW_METADATA),
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
