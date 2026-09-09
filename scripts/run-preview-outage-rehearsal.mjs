import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createLifecycleRequest,
  runFixtureLifecycle,
} from './e2e-fixture-lifecycle.mjs';
import { createProtectedPreviewContextOptions } from './preview-deployment-protection.mjs';

const CAPABILITY_ENV = 'SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY';

function parseMetadata(value) {
  try {
    const metadata = JSON.parse(value ?? '');
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) throw new Error();
    return metadata;
  } catch {
    throw new Error('Preview outage rehearsal requires scrubbed outage Preview metadata.');
  }
}

function getCapability(env) {
  const capability = env[CAPABILITY_ENV];
  if (typeof capability !== 'string' || capability.length === 0) {
    throw new Error('Preview outage rehearsal requires a runner-owned lifecycle capability.');
  }
  return capability;
}

export async function runPreviewOutageRehearsal({
  candidateCommit,
  metadata,
  env = process.env,
  fetchImpl = fetch,
  createLifecycle = createLifecycleRequest,
} = {}) {
  const options = createProtectedPreviewContextOptions({ metadata, candidateCommit, env });
  const lifecycle = createLifecycle(
    options.baseURL,
    getCapability(env),
    options.extraHTTPHeaders,
  );

  return runFixtureLifecycle({
    request: lifecycle,
    run: async () => {
      const response = await fetchImpl(new URL('/api/campus-notes', options.baseURL), {
        method: 'POST',
        headers: options.extraHTTPHeaders,
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
}

async function runCli() {
  const outputFlag = process.argv.indexOf('--output');
  const outputPath = outputFlag >= 0 ? process.argv[outputFlag + 1] : '';
  if (!outputPath || !process.env.GITHUB_SHA) {
    throw new Error('Preview outage rehearsal requires a candidate commit and output path.');
  }
  const record = {
    ...(await runPreviewOutageRehearsal({
      candidateCommit: process.env.GITHUB_SHA,
      metadata: parseMetadata(process.env.SCHOLARSCOUT_PREVIEW_OUTAGE_METADATA),
    })),
    recordedAt: new Date().toISOString(),
  };
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(record, null, 2)}\n`);
  if (record.outcome !== 'passed') process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli().catch(() => { process.exitCode = 1; });
}
