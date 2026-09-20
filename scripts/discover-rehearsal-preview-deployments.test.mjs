import assert from 'node:assert/strict';
import test from 'node:test';

import {
  discoverRehearsalPreviewDeployments,
  selectReadyGitHubDeploymentUrl,
  selectReadyVercelDeploymentStatus,
} from './discover-rehearsal-preview-deployments.mjs';

const sha = 'a'.repeat(40);
const githubToken = 'github-token-which-is-long-enough';
const statuses = [
  { context: 'Vercel – scholar-scout-rehearsal-baseline', state: 'success' },
  { context: 'Vercel – scholar-scout-rehearsal-outage', state: 'success' },
];
const deploymentStatuses = [
  {
    deploymentSha: sha,
    status: { state: 'success', environment_url: 'https://scholar-scout-rehearsal-baseline-abc-team.vercel.app/' },
  },
  {
    deploymentSha: sha,
    status: { state: 'success', environment_url: 'https://scholar-scout-rehearsal-outage-def-team.vercel.app/' },
  },
];

test('discovers exact candidate rehearsal URLs through GitHub deployment statuses', async () => {
  const result = await discoverRehearsalPreviewDeployments({
    candidateCommit: sha,
    baselineHostPrefix: 'scholar-scout-rehearsal-baseline-',
    outageHostPrefix: 'scholar-scout-rehearsal-outage-',
    baselineProject: 'scholar-scout-rehearsal-baseline',
    outageProject: 'scholar-scout-rehearsal-outage',
    githubRepository: 'realtypulse73/Scholar-Scout',
    githubToken,
    getCommitStatuses: async ({ candidateCommit, githubRepository, githubToken: token }) => {
      assert.equal(candidateCommit, sha);
      assert.equal(githubRepository, 'realtypulse73/Scholar-Scout');
      assert.equal(token, githubToken);
      return statuses;
    },
    getDeploymentStatuses: async ({ candidateCommit, githubRepository, githubToken: token }) => {
      assert.equal(candidateCommit, sha);
      assert.equal(githubRepository, 'realtypulse73/Scholar-Scout');
      assert.equal(token, githubToken);
      return deploymentStatuses;
    },
  });
  assert.deepEqual(result, {
    baselineUrl: 'https://scholar-scout-rehearsal-baseline-abc-team.vercel.app',
    outageUrl: 'https://scholar-scout-rehearsal-outage-def-team.vercel.app',
  });
});

test('requires candidate-bound GitHub deployment-status access', async () => {
  const input = {
    candidateCommit: sha,
    baselineHostPrefix: 'scholar-scout-rehearsal-baseline-',
    outageHostPrefix: 'scholar-scout-rehearsal-outage-',
    baselineProject: 'scholar-scout-rehearsal-baseline',
    outageProject: 'scholar-scout-rehearsal-outage',
    githubRepository: 'realtypulse73/Scholar-Scout',
    githubToken: '',
  };
  await assert.rejects(() => discoverRehearsalPreviewDeployments(input), /GitHub deployment-status access/);
});

test('rejects stale, pending, wrong-host, and ambiguous deployment statuses', () => {
  const baselinePrefix = 'scholar-scout-rehearsal-baseline-';
  assert.equal(
    selectReadyGitHubDeploymentUrl(deploymentStatuses, sha, baselinePrefix),
    'https://scholar-scout-rehearsal-baseline-abc-team.vercel.app',
  );
  assert.throws(
    () => selectReadyGitHubDeploymentUrl([{ ...deploymentStatuses[0], deploymentSha: 'b'.repeat(40) }], sha, baselinePrefix),
    /No single ready/,
  );
  assert.throws(
    () => selectReadyGitHubDeploymentUrl([{ ...deploymentStatuses[0], status: { ...deploymentStatuses[0].status, state: 'pending' } }], sha, baselinePrefix),
    /No single ready/,
  );
  assert.throws(
    () => selectReadyGitHubDeploymentUrl([{ ...deploymentStatuses[0], status: { ...deploymentStatuses[0].status, environment_url: 'https://example.test/' } }], sha, baselinePrefix),
    /No single ready/,
  );
  assert.throws(
    () => selectReadyGitHubDeploymentUrl([
      deploymentStatuses[0],
      { ...deploymentStatuses[0], status: { ...deploymentStatuses[0].status, environment_url: 'https://scholar-scout-rehearsal-baseline-other-team.vercel.app/' } },
    ], sha, baselinePrefix),
    /No single ready/,
  );
});

test('requires one successful candidate status for each rehearsal project', () => {
  assert.throws(() => selectReadyVercelDeploymentStatus([], 'scholar-scout-rehearsal-baseline'), /No single successful/);
  assert.throws(() => selectReadyVercelDeploymentStatus([{ ...statuses[0], state: 'pending' }], 'scholar-scout-rehearsal-baseline'), /No single successful/);
  assert.throws(() => selectReadyVercelDeploymentStatus([statuses[0], statuses[0]], 'scholar-scout-rehearsal-baseline'), /No single successful/);
});
