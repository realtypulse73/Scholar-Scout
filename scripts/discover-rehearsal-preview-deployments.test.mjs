import assert from 'node:assert/strict';
import test from 'node:test';

import { discoverRehearsalPreviewDeployments, selectReadyDeploymentUrl } from './discover-rehearsal-preview-deployments.mjs';

const sha = 'a'.repeat(40);
const baselineToken = 'baseline-token-which-is-long-enough';
const outageToken = 'outage-token-which-is-long-enough';
const baselineOutput = 'https://scholar-scout-rehearsal-baseline-abc-team.vercel.app\nhttps://scholar-scout-rehearsal-baseline-abc-team.vercel.app\n';
const outageOutput = 'https://scholar-scout-rehearsal-outage-def-team.vercel.app\n';

test('discovers candidate-bound baseline and outage Preview URLs from official Vercel CLI output', async () => {
  const result = await discoverRehearsalPreviewDeployments({
    candidateCommit: sha,
    baselineHostPrefix: 'scholar-scout-rehearsal-baseline-',
    outageHostPrefix: 'scholar-scout-rehearsal-outage-',
    baselineProject: 'scholar-scout-rehearsal-baseline',
    outageProject: 'scholar-scout-rehearsal-outage',
    vercelScope: 'scholar-scout',
    baselineToken,
    outageToken,
    listDeployments: async ({ project, accessToken }) => {
      assert.equal(accessToken, project.endsWith('baseline') ? baselineToken : outageToken);
      return project.endsWith('baseline') ? baselineOutput : outageOutput;
    },
  });
  assert.deepEqual(result, {
    baselineUrl: 'https://scholar-scout-rehearsal-baseline-abc-team.vercel.app',
    outageUrl: 'https://scholar-scout-rehearsal-outage-def-team.vercel.app',
  });
});

test('requires separate Vercel tokens for the two project-scoped discovery calls', async () => {
  await assert.rejects(() => discoverRehearsalPreviewDeployments({
    candidateCommit: sha,
    baselineHostPrefix: 'scholar-scout-rehearsal-baseline-',
    outageHostPrefix: 'scholar-scout-rehearsal-outage-',
    baselineProject: 'scholar-scout-rehearsal-baseline',
    outageProject: 'scholar-scout-rehearsal-outage',
    vercelScope: 'scholar-scout',
    baselineToken,
    outageToken: '',
  }), /separate Vercel token/);
});

test('fails closed for absent, stale, or ambiguous Vercel output', () => {
  assert.throws(() => selectReadyDeploymentUrl('', 'scholar-scout-rehearsal-baseline-'), /No single ready rehearsal Preview deployment/);
  assert.throws(() => selectReadyDeploymentUrl('https://other-project-abc-team.vercel.app', 'scholar-scout-rehearsal-baseline-'), /No single ready rehearsal Preview deployment/);
  assert.throws(() => selectReadyDeploymentUrl(`${baselineOutput}https://scholar-scout-rehearsal-baseline-other-team.vercel.app`, 'scholar-scout-rehearsal-baseline-'), /No single ready rehearsal Preview deployment/);
});
