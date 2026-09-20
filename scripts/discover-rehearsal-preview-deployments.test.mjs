import assert from 'node:assert/strict';
import test from 'node:test';

import {
  discoverRehearsalPreviewDeployments,
  selectReadyDeploymentUrl,
  selectReadyVercelDeploymentStatus,
} from './discover-rehearsal-preview-deployments.mjs';

const sha = 'a'.repeat(40);
const githubToken = 'github-token-which-is-long-enough';
const baselineToken = 'baseline-token-which-is-long-enough';
const outageToken = 'outage-token-which-is-long-enough';
const statuses = [
  {
    context: 'Vercel – scholar-scout-rehearsal-baseline',
    state: 'success',
    target_url: 'https://vercel.com/scholar-scout/scholar-scout-rehearsal-baseline/opaque-dashboard-link',
  },
  {
    context: 'Vercel – scholar-scout-rehearsal-outage',
    state: 'success',
    target_url: 'https://vercel.com/scholar-scout/scholar-scout-rehearsal-outage/opaque-dashboard-link',
  },
];

test('discovers candidate-bound rehearsal URLs through GitHub statuses and exact Vercel project queries', async () => {
  const result = await discoverRehearsalPreviewDeployments({
    candidateCommit: sha,
    baselineHostPrefix: 'scholar-scout-rehearsal-baseline-',
    outageHostPrefix: 'scholar-scout-rehearsal-outage-',
    baselineProject: 'scholar-scout-rehearsal-baseline',
    outageProject: 'scholar-scout-rehearsal-outage',
    vercelScope: 'scholar-scout',
    baselineToken,
    outageToken,
    githubRepository: 'realtypulse73/Scholar-Scout',
    githubToken,
    getCommitStatuses: async ({ candidateCommit, githubRepository, githubToken: token }) => {
      assert.equal(candidateCommit, sha);
      assert.equal(githubRepository, 'realtypulse73/Scholar-Scout');
      assert.equal(token, githubToken);
      return statuses;
    },
    getDeployment: async ({ candidateCommit, project, accessToken }) => {
      assert.equal(candidateCommit, sha);
      assert.equal(accessToken, project === 'scholar-scout-rehearsal-baseline' ? baselineToken : outageToken);
      return project === 'scholar-scout-rehearsal-baseline'
        ? `https://scholar-scout-rehearsal-baseline-abc-team.vercel.app\n`
        : `https://scholar-scout-rehearsal-outage-def-team.vercel.app\n`;
    },
  });
  assert.deepEqual(result, {
    baselineUrl: 'https://scholar-scout-rehearsal-baseline-abc-team.vercel.app',
    outageUrl: 'https://scholar-scout-rehearsal-outage-def-team.vercel.app',
  });
});

test('requires separate Vercel tokens and candidate GitHub status access', async () => {
  const input = {
    candidateCommit: sha,
    baselineHostPrefix: 'scholar-scout-rehearsal-baseline-',
    outageHostPrefix: 'scholar-scout-rehearsal-outage-',
    baselineProject: 'scholar-scout-rehearsal-baseline',
    outageProject: 'scholar-scout-rehearsal-outage',
    vercelScope: 'scholar-scout',
    baselineToken,
    outageToken: '',
    githubRepository: 'realtypulse73/Scholar-Scout',
    githubToken,
  };
  await assert.rejects(() => discoverRehearsalPreviewDeployments(input), /separate Vercel token/);
  await assert.rejects(() => discoverRehearsalPreviewDeployments({ ...input, outageToken, githubToken: '' }), /GitHub status access/);
});

test('fails closed for missing, pending, or ambiguous candidate deployment statuses without parsing dashboard URLs', () => {
  assert.throws(() => selectReadyVercelDeploymentStatus([], 'scholar-scout-rehearsal-baseline'), /No single successful/);
  assert.throws(() => selectReadyVercelDeploymentStatus([{ ...statuses[0], state: 'pending' }], 'scholar-scout-rehearsal-baseline'), /No single successful/);
  assert.deepEqual(
    selectReadyVercelDeploymentStatus([{ ...statuses[0], target_url: 'https://example.test/opaque-link' }], 'scholar-scout-rehearsal-baseline'),
    { ...statuses[0], target_url: 'https://example.test/opaque-link' },
  );
  assert.throws(() => selectReadyVercelDeploymentStatus([statuses[0], statuses[0]], 'scholar-scout-rehearsal-baseline'), /No single successful/);
  assert.throws(() => selectReadyDeploymentUrl('', 'scholar-scout-rehearsal-baseline-'), /No single ready/);
});
