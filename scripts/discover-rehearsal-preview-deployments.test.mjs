import assert from 'node:assert/strict';
import test from 'node:test';

import { discoverRehearsalPreviewDeployments } from './discover-rehearsal-preview-deployments.mjs';

const sha = 'a'.repeat(40);
const token = 'test-token';

function githubMock({ baseline = true, outage = true } = {}) {
  return async (url) => {
    if (url.includes('/deployments?')) return response([{ id: 1, sha, environment: 'Preview', creator: { login: 'vercel[bot]' } }, { id: 2, sha, environment: 'Preview', creator: { login: 'vercel[bot]' } }]);
    if (url.includes('/1/statuses')) return response(baseline ? [{ state: 'success', environment: 'Preview', environment_url: 'https://scholar-scout-rehearsal-baseline-abc-team.vercel.app/' }] : []);
    if (url.includes('/2/statuses')) return response(outage ? [{ state: 'success', environment: 'Preview', environment_url: 'https://scholar-scout-rehearsal-outage-def-team.vercel.app/' }] : []);
    throw new Error(`Unexpected request: ${url}`);
  };
}

function response(value) { return { ok: true, json: async () => value }; }

test('discovers one candidate-bound baseline and outage Vercel Preview URL', async () => {
  await assert.doesNotReject(async () => assert.deepEqual(await discoverRehearsalPreviewDeployments({
    owner: 'realtypulse73', repo: 'Scholar-Scout', candidateCommit: sha, githubToken: token,
    baselineHostPrefix: 'scholar-scout-rehearsal-baseline-', outageHostPrefix: 'scholar-scout-rehearsal-outage-', fetchImpl: githubMock(),
  }), {
    baselineUrl: 'https://scholar-scout-rehearsal-baseline-abc-team.vercel.app',
    outageUrl: 'https://scholar-scout-rehearsal-outage-def-team.vercel.app',
  }));
});

test('fails closed when either candidate-bound rehearsal deployment is missing', async () => {
  await assert.rejects(() => discoverRehearsalPreviewDeployments({
    owner: 'realtypulse73', repo: 'Scholar-Scout', candidateCommit: sha, githubToken: token,
    baselineHostPrefix: 'scholar-scout-rehearsal-baseline-', outageHostPrefix: 'scholar-scout-rehearsal-outage-', fetchImpl: githubMock({ outage: false }),
  }), /No ready rehearsal Preview deployment/);
});
