import { appendFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * GitHub commit statuses bind one Vercel deployment ID to the candidate. The
 * project-scoped Vercel tokens then read only that deployment through Vercel's
 * deployment API, avoiding a team-wide list or a CLI-specific access issue.
 */
export async function discoverRehearsalPreviewDeployments({
  candidateCommit,
  baselineHostPrefix,
  outageHostPrefix,
  baselineProject,
  outageProject,
  vercelScope,
  baselineToken,
  outageToken,
  githubRepository,
  githubToken,
  getCommitStatuses = getGitHubCommitStatuses,
  getDeployment = getReadyVercelDeployment,
} = {}) {
  if (!isFullSha(candidateCommit)) throw new Error('Rehearsal deployment discovery requires a full candidate commit.');
  if (!isHostPrefix(baselineHostPrefix) || !isHostPrefix(outageHostPrefix) || baselineHostPrefix === outageHostPrefix) {
    throw new Error('Rehearsal deployment discovery requires two distinct Vercel host prefixes.');
  }
  if (!isProjectName(baselineProject) || !isProjectName(outageProject) || baselineProject === outageProject || !isScope(vercelScope)) {
    throw new Error('Rehearsal deployment discovery requires two Vercel projects and a scope.');
  }
  if (!isToken(baselineToken) || !isToken(outageToken)) {
    throw new Error('Rehearsal deployment discovery requires a separate Vercel token for each rehearsal project.');
  }
  if (!isRepository(githubRepository) || !isToken(githubToken)) {
    throw new Error('Rehearsal deployment discovery requires GitHub status access for the candidate commit.');
  }

  const statuses = await getCommitStatuses({ candidateCommit, githubRepository, githubToken });
  const baselineDeploymentId = selectReadyVercelDeploymentId(statuses, vercelScope, baselineProject);
  const outageDeploymentId = selectReadyVercelDeploymentId(statuses, vercelScope, outageProject);
  const [baselineOutput, outageOutput] = await Promise.all([
    getDeployment({ deploymentId: baselineDeploymentId, project: baselineProject, vercelScope, accessToken: baselineToken }),
    getDeployment({ deploymentId: outageDeploymentId, project: outageProject, vercelScope, accessToken: outageToken }),
  ]);
  const baselineUrl = selectReadyDeploymentUrl(baselineOutput, baselineHostPrefix);
  const outageUrl = selectReadyDeploymentUrl(outageOutput, outageHostPrefix);
  if (baselineUrl === outageUrl) throw new Error('Rehearsal deployment URLs must be distinct.');
  return { baselineUrl, outageUrl };
}

async function getGitHubCommitStatuses({ candidateCommit, githubRepository, githubToken }) {
  const response = await fetch(
    `https://api.github.com/repos/${githubRepository}/commits/${candidateCommit}/status`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${githubToken}`,
        'User-Agent': 'ScholarScout-Rehearsal',
      },
    },
  );
  if (!response.ok) throw new Error('Rehearsal deployment discovery could not read candidate GitHub statuses.');
  const payload = await response.json();
  if (!payload || !Array.isArray(payload.statuses)) {
    throw new Error('Rehearsal deployment discovery received invalid candidate GitHub statuses.');
  }
  return payload.statuses;
}

async function getReadyVercelDeployment({ deploymentId, project, vercelScope, accessToken }) {
  const endpoint = new URL(`https://api.vercel.com/v13/deployments/${deploymentId}`);
  endpoint.searchParams.set('slug', vercelScope);
  const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) {
    throw new Error(`Vercel deployment discovery could not read ${project} candidate deployment (HTTP ${response.status}).`);
  }
  const deployment = await response.json();
  if (!deployment || deployment.id !== deploymentId || deployment.readyState !== 'READY' || deployment.target !== null || typeof deployment.url !== 'string') {
    throw new Error(`Vercel deployment discovery received an invalid ${project} candidate deployment.`);
  }
  return `https://${deployment.url}\n`;
}

export function selectReadyVercelDeploymentId(statuses, scope, project) {
  if (!Array.isArray(statuses) || !isScope(scope) || !isProjectName(project)) {
    throw new Error('Candidate Vercel status records are invalid.');
  }
  const expectedContext = `Vercel – ${project}`;
  const matches = statuses.filter((status) =>
    status && status.context === expectedContext && status.state === 'success',
  );
  if (matches.length !== 1) {
    throw new Error(`No single successful candidate Vercel status exists for ${project}.`);
  }
  const targetUrl = typeof matches[0].target_url === 'string' ? matches[0].target_url : '';
  try {
    const url = new URL(targetUrl);
    const expectedPath = `/${scope}/${project}/`;
    const deploymentId = url.pathname.startsWith(expectedPath)
      ? url.pathname.slice(expectedPath.length)
      : '';
    if (url.protocol !== 'https:' || url.hostname !== 'vercel.com' || !/^[A-Za-z0-9]{20,64}$/.test(deploymentId)) {
      throw new Error('invalid deployment status target');
    }
    return deploymentId;
  } catch {
    throw new Error(`Candidate Vercel status does not identify one deployment for ${project}.`);
  }
}

export function selectReadyDeploymentUrl(output, hostPrefix) {
  if (typeof output !== 'string' || !isHostPrefix(hostPrefix)) throw new Error('Vercel deployment output is invalid.');
  const urls = new Set();
  for (const value of output.match(/https:\/\/[^\s]+\.vercel\.app\/?/g) ?? []) {
    const normalized = normalizeExpectedUrl(value, hostPrefix);
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
function isScope(value) { return typeof value === 'string' && /^[a-z0-9-]{3,100}$/i.test(value); }
function isRepository(value) { return typeof value === 'string' && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value); }
function isToken(value) { return typeof value === 'string' && value.trim().length >= 20; }

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const discovered = await discoverRehearsalPreviewDeployments({
    ...args,
    baselineToken: process.env.SCHOLARSCOUT_VERCEL_BASELINE_TOKEN,
    outageToken: process.env.SCHOLARSCOUT_VERCEL_OUTAGE_TOKEN,
    githubRepository: process.env.GITHUB_REPOSITORY,
    githubToken: process.env.GITHUB_TOKEN,
  });
  const output = `${JSON.stringify(discovered, null, 2)}\n`;
  if (args.output) await writeFile(path.resolve(args.output), output);
  if (args.githubEnv) await appendFile(path.resolve(args.githubEnv), `SCHOLARSCOUT_PREVIEW_URL=${discovered.baselineUrl}\nSCHOLARSCOUT_PREVIEW_OUTAGE_URL=${discovered.outageUrl}\n`);
  process.stdout.write(output);
}

function parseArgs(values) {
  const args = { candidateCommit: '', baselineHostPrefix: '', outageHostPrefix: '', baselineProject: '', outageProject: '', vercelScope: '', output: '', githubEnv: '' };
  const map = { '--candidate-commit': 'candidateCommit', '--baseline-host-prefix': 'baselineHostPrefix', '--outage-host-prefix': 'outageHostPrefix', '--baseline-project': 'baselineProject', '--outage-project': 'outageProject', '--vercel-scope': 'vercelScope', '--output': 'output', '--github-env': 'githubEnv' };
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
