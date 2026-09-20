import { appendFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * GitHub records Vercel's deployment statuses against the candidate commit.
 * Reading those records avoids requiring Vercel REST API access during a
 * rehearsal while preserving an exact candidate-to-Preview URL binding.
 */
export async function discoverRehearsalPreviewDeployments({
  candidateCommit,
  baselineHostPrefix,
  outageHostPrefix,
  baselineProject,
  outageProject,
  githubRepository,
  githubToken,
  getCommitStatuses = getGitHubCommitStatuses,
  getDeploymentStatuses = getGitHubDeploymentStatuses,
} = {}) {
  if (!isFullSha(candidateCommit)) throw new Error('Rehearsal deployment discovery requires a full candidate commit.');
  if (!isHostPrefix(baselineHostPrefix) || !isHostPrefix(outageHostPrefix) || baselineHostPrefix === outageHostPrefix) {
    throw new Error('Rehearsal deployment discovery requires two distinct Vercel host prefixes.');
  }
  if (!isProjectName(baselineProject) || !isProjectName(outageProject) || baselineProject === outageProject) {
    throw new Error('Rehearsal deployment discovery requires two Vercel projects.');
  }
  if (!isRepository(githubRepository) || !isToken(githubToken)) {
    throw new Error('Rehearsal deployment discovery requires GitHub deployment-status access for the candidate commit.');
  }

  const [commitStatuses, deploymentStatuses] = await Promise.all([
    getCommitStatuses({ candidateCommit, githubRepository, githubToken }),
    getDeploymentStatuses({ candidateCommit, githubRepository, githubToken }),
  ]);
  selectReadyVercelDeploymentStatus(commitStatuses, baselineProject);
  selectReadyVercelDeploymentStatus(commitStatuses, outageProject);
  const baselineUrl = selectReadyGitHubDeploymentUrl(deploymentStatuses, candidateCommit, baselineHostPrefix);
  const outageUrl = selectReadyGitHubDeploymentUrl(deploymentStatuses, candidateCommit, outageHostPrefix);
  if (baselineUrl === outageUrl) throw new Error('Rehearsal deployment URLs must be distinct.');
  return { baselineUrl, outageUrl };
}

async function getGitHubCommitStatuses({ candidateCommit, githubRepository, githubToken }) {
  const payload = await githubRequest({
    endpoint: `/repos/${githubRepository}/commits/${candidateCommit}/status`,
    githubToken,
    failureMessage: 'Rehearsal deployment discovery could not read candidate GitHub statuses.',
  });
  if (!payload || !Array.isArray(payload.statuses)) {
    throw new Error('Rehearsal deployment discovery received invalid candidate GitHub statuses.');
  }
  return payload.statuses;
}

async function getGitHubDeploymentStatuses({ candidateCommit, githubRepository, githubToken }) {
  const deployments = await githubRequest({
    endpoint: `/repos/${githubRepository}/deployments?sha=${encodeURIComponent(candidateCommit)}&per_page=100`,
    githubToken,
    failureMessage: 'Rehearsal deployment discovery could not read candidate GitHub deployments.',
  });
  if (!Array.isArray(deployments)) {
    throw new Error('Rehearsal deployment discovery received invalid candidate GitHub deployments.');
  }
  const candidateDeployments = deployments.filter((deployment) =>
    deployment && deployment.sha === candidateCommit && Number.isInteger(deployment.id),
  );
  const statusGroups = await Promise.all(candidateDeployments.map(async (deployment) => {
    const statuses = await githubRequest({
      endpoint: `/repos/${githubRepository}/deployments/${deployment.id}/statuses?per_page=100`,
      githubToken,
      failureMessage: 'Rehearsal deployment discovery could not read candidate GitHub deployment statuses.',
    });
    if (!Array.isArray(statuses)) {
      throw new Error('Rehearsal deployment discovery received invalid candidate GitHub deployment statuses.');
    }
    return statuses.map((status) => ({ deploymentSha: deployment.sha, status }));
  }));
  return statusGroups.flat();
}

async function githubRequest({ endpoint, githubToken, failureMessage }) {
  const response = await fetch(`https://api.github.com${endpoint}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${githubToken}`,
      'User-Agent': 'ScholarScout-Rehearsal',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!response.ok) throw new Error(failureMessage);
  return response.json();
}

export function selectReadyVercelDeploymentStatus(statuses, project) {
  if (!Array.isArray(statuses) || !isProjectName(project)) {
    throw new Error('Candidate Vercel status records are invalid.');
  }
  const expectedContext = `Vercel – ${project}`;
  const matches = statuses.filter((status) =>
    status && status.context === expectedContext && status.state === 'success',
  );
  if (matches.length !== 1) {
    throw new Error(`No single successful candidate Vercel status exists for ${project}.`);
  }
  return matches[0];
}

export function selectReadyGitHubDeploymentUrl(records, candidateCommit, hostPrefix) {
  if (!Array.isArray(records) || !isFullSha(candidateCommit) || !isHostPrefix(hostPrefix)) {
    throw new Error('Candidate GitHub deployment status records are invalid.');
  }
  const urls = new Set();
  for (const record of records) {
    if (record?.deploymentSha !== candidateCommit || record.status?.state !== 'success') continue;
    const normalized = normalizeExpectedUrl(record.status.environment_url, hostPrefix);
    if (normalized) urls.add(normalized);
  }
  if (urls.size !== 1) throw new Error(`No single ready rehearsal Preview deployment exists for ${hostPrefix}.`);
  return [...urls][0];
}

function normalizeExpectedUrl(value, prefix) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.pathname !== '/' || !url.hostname.startsWith(prefix) || !url.hostname.endsWith('.vercel.app')) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function isFullSha(value) { return typeof value === 'string' && /^[a-f0-9]{40}$/i.test(value); }
function isHostPrefix(value) { return typeof value === 'string' && /^[a-z0-9-]{3,100}$/i.test(value); }
function isProjectName(value) { return typeof value === 'string' && /^[a-z0-9-]{3,100}$/i.test(value); }
function isRepository(value) { return typeof value === 'string' && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value); }
function isToken(value) { return typeof value === 'string' && value.trim().length >= 20; }

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const discovered = await discoverRehearsalPreviewDeployments({
    ...args,
    githubRepository: process.env.GITHUB_REPOSITORY,
    githubToken: process.env.GITHUB_TOKEN,
  });
  const output = `${JSON.stringify(discovered, null, 2)}\n`;
  if (args.output) await writeFile(path.resolve(args.output), output);
  if (args.githubEnv) await appendFile(path.resolve(args.githubEnv), `SCHOLARSCOUT_PREVIEW_URL=${discovered.baselineUrl}\nSCHOLARSCOUT_PREVIEW_OUTAGE_URL=${discovered.outageUrl}\n`);
  process.stdout.write(output);
}

function parseArgs(values) {
  const args = { candidateCommit: '', baselineHostPrefix: '', outageHostPrefix: '', baselineProject: '', outageProject: '', output: '', githubEnv: '' };
  const map = { '--candidate-commit': 'candidateCommit', '--baseline-host-prefix': 'baselineHostPrefix', '--outage-host-prefix': 'outageHostPrefix', '--baseline-project': 'baselineProject', '--outage-project': 'outageProject', '--output': 'output', '--github-env': 'githubEnv' };
  for (let index = 0; index < values.length; index += 1) {
    const key = values[index];
    const value = values[index + 1];
    if (!(key in map) || !value) throw new Error('Invalid rehearsal deployment discovery arguments.');
    args[map[key]] = value;
    index += 1;
  }
  return args;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
