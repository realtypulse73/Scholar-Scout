import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  classifyFixtureLifecycleFailure,
  createLifecycleRequest,
  FixtureLifecycleError,
  runFixtureLifecycle,
} from './e2e-fixture-lifecycle.mjs';
import {
  createLifecycleProtectionHeaders,
  createProtectedPreviewContextOptions,
} from './preview-deployment-protection.mjs';
import { attestPreviewDeployment as attestGithubPreviewDeployment } from './preview-deployment-attestation.mjs';

const CANDIDATE_COMMIT_ENV = 'SCHOLARSCOUT_CANDIDATE_COMMIT';
const PREVIEW_OUTAGE_URL_ENV = 'SCHOLARSCOUT_PREVIEW_OUTAGE_URL';

const CAPABILITY_ENV = 'SCHOLARSCOUT_E2E_OUTAGE_FIXTURE_CAPABILITY';
export function createPreviewOutageMetadata(url, candidateCommit) {
  const normalizedUrl = typeof url === 'string' ? url.trim().replace(/\/$/, '') : '';
  if (!normalizedUrl) {
    throw new Error('Preview outage rehearsal requires an outage Preview URL workflow input.');
  }
  return { environment: 'preview', url: normalizedUrl, commit: candidateCommit };
}
const DEPLOYMENTS_TOKEN_ENV = 'SCHOLARSCOUT_GITHUB_DEPLOYMENTS_TOKEN';
const WORKFLOW_TOKEN_ENV = 'GITHUB_TOKEN';
const GITHUB_OWNER = 'realtypulse73';
const GITHUB_REPOSITORY = 'Scholar-Scout';

function getCapability(env) {
  const capability = env[CAPABILITY_ENV];
  if (typeof capability !== 'string' || capability.length === 0) {
    throw new Error('Preview outage rehearsal requires a runner-owned lifecycle capability.');
  }
  return capability;
}

function getDeploymentReadToken(env) {
  const dedicatedToken = env[DEPLOYMENTS_TOKEN_ENV];
  return typeof dedicatedToken === 'string' && dedicatedToken.length > 0
    ? dedicatedToken
    : env[WORKFLOW_TOKEN_ENV];
}

export async function runPreviewOutageRehearsal({
  candidateCommit,
  previewUrl,
  metadata,
  env = process.env,
  attestPreviewDeployment = attestGithubPreviewDeployment,
  fetchImpl = fetch,
  createLifecycle = createLifecycleRequest,
} = {}) {
  let attestation;
  try {
    attestation = await attestPreviewDeployment({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPOSITORY,
      candidateCommit,
      submittedUrl: previewUrl ?? metadata?.url,
      githubToken: getDeploymentReadToken(env),
    });
  } catch {
    return {
      candidateCommit,
      outcome: 'failed',
      errorCategory: 'preview-attestation-failed',
    };
  }
  const options = createProtectedPreviewContextOptions({ attestation, candidateCommit, env });
  const directProtectionHeaders = createLifecycleProtectionHeaders(options.extraHTTPHeaders);
  const lifecycle = createLifecycle(
    options.baseURL,
    getCapability(env),
    directProtectionHeaders,
  );

  try {
    return await runFixtureLifecycle({
      request: lifecycle,
      run: async () => {
        const response = await fetchImpl(new URL('/api/campus-notes', options.baseURL), {
          method: 'POST',
          headers: directProtectionHeaders,
        });
        const body = await response.text();
        if (response.status !== 503 || /token|cookie|fixture|storage|student/i.test(body)) {
          return {
            candidateCommit,
            target: options.baseURL,
            outcome: 'failed',
            errorCategory: 'outage-proof-failed',
          };
        }
        return { candidateCommit, target: options.baseURL, outcome: 'passed' };
      },
    });
  } catch (error) {
    if (!(error instanceof FixtureLifecycleError)) {
      return {
        candidateCommit,
        target: options.baseURL,
        outcome: 'failed',
        errorCategory: 'outage-transport-failed',
      };
    }
    return {
      candidateCommit,
      target: options.baseURL,
      outcome: 'failed',
      errorCategory: classifyFixtureLifecycleFailure(error),
    };
  }
}

async function runCli() {
  const outputFlag = process.argv.indexOf('--output');
  const outputPath = outputFlag >= 0 ? process.argv[outputFlag + 1] : '';
  const candidateCommit = process.env[CANDIDATE_COMMIT_ENV] ?? process.env.GITHUB_SHA;
  if (!outputPath || !candidateCommit) {
    throw new Error('Preview outage rehearsal requires a candidate commit and output path.');
  }
  const record = {
    ...(await runPreviewOutageRehearsal({
      candidateCommit,
      previewUrl: createPreviewOutageMetadata(
        process.env[PREVIEW_OUTAGE_URL_ENV] ?? process.env.SCHOLARSCOUT_OUTAGE_PREVIEW_URL,
        candidateCommit,
      ).url,
    })),
    recordedAt: new Date().toISOString(),
  };
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(record, null, 2)}\n`);
  process.stdout.write(`Preview outage rehearsal record: ${JSON.stringify(record)}\n`);
  if (record.outcome !== 'passed') process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli().catch(() => { process.exitCode = 1; });
}
