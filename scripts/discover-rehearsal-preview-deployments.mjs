import { appendFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEPLOYMENTS_PER_PAGE = 100;
const MAX_PAGES = 10;
const VERCEL_CREATOR = 'vercel[bot]';

/**
 * Finds the two Git-integrated Vercel Preview URLs for one immutable PR head.
 * The expected host prefixes are non-secret repository variables, while the
 * GitHub token is never written to the report or workflow output.
 */
export async function discoverRehearsalPreviewDeployments({
  owner,
  repo,
  candidateCommit,
  githubToken,
  baselineHostPrefix,
  outageHostPrefix,
  fetchImpl = fetch,
} = {}) {
  if (!isRepositoryPart(owner) || !isRepositoryPart(repo) || !isFullSha(candidateCommit)) {
    throw new Error('Rehearsal deployment discovery requires a repository and full candidate commit.');
  }
  if (!isHostPrefix(baselineHostPrefix) || !isHostPrefix(outageHostPrefix) || baselineHostPrefix === outageHostPrefix) {
    throw new Error('Rehearsal deployment discovery requires two distinct Vercel host prefixes.');
  }
  if (typeof githubToken !== 'string' || githubToken.trim().length === 0) {
    throw new Error('Rehearsal deployment discovery requires a GitHub deployment-read token.');
  }

  const deployments = await readDeployments({ owner, repo, githubToken, fetchImpl });
  const urls = await Promise.all([
    findFreshUrl({ deployments, owner, repo, candidateCommit, hostPrefix: baselineHostPrefix, githubToken, fetchImpl }),
    findFreshUrl({ deployments, owner, repo, candidateCommit, hostPrefix: outageHostPrefix, githubToken, fetchImpl }),
  ]);
  if (urls[0] === urls[1]) throw new Error('Rehearsal deployment URLs must be distinct.');
  return { baselineUrl: urls[0], outageUrl: urls[1] };
}

async function readDeployments({ owner, repo, githubToken, fetchImpl }) {
  const all = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const response = await fetchImpl(`https://api.github.com/repos/${owner}/${repo}/deployments?per_page=${DEPLOYMENTS_PER_PAGE}&page=${page}`, { headers: githubHeaders(githubToken) });
    if (!response.ok) throw new Error('Rehearsal deployment discovery could not read GitHub deployments.');
    const records = await response.json();
    if (!Array.isArray(records)) throw new Error('Rehearsal deployment discovery received invalid GitHub deployments.');
    all.push(...records);
    if (records.length < DEPLOYMENTS_PER_PAGE) return all;
  }
  throw new Error('Rehearsal deployment discovery exceeded its GitHub deployment search limit.');
}

async function findFreshUrl({ deployments, owner, repo, candidateCommit, hostPrefix, githubToken, fetchImpl }) {
  const matches = [];
  for (const deployment of deployments) {
    if (deployment?.sha !== candidateCommit || deployment.environment !== 'Preview' || deployment.creator?.login !== VERCEL_CREATOR || !Number.isInteger(deployment.id)) continue;
    const response = await fetchImpl(`https://api.github.com/repos/${owner}/${repo}/deployments/${deployment.id}/statuses?per_page=${DEPLOYMENTS_PER_PAGE}`, { headers: githubHeaders(githubToken) });
    if (!response.ok) throw new Error('Rehearsal deployment discovery could not read GitHub deployment statuses.');
    const statuses = await response.json();
    if (!Array.isArray(statuses)) throw new Error('Rehearsal deployment discovery received invalid GitHub deployment statuses.');
    for (const status of statuses) {
      const url = normalizeExpectedUrl(status?.environment_url, hostPrefix);
      if (status?.state === 'success' && status.environment === 'Preview' && url) matches.push(url);
    }
  }
  if (matches.length === 0) throw new Error(`No ready rehearsal Preview deployment exists for ${hostPrefix}.`);
  return matches[0];
}

function githubHeaders(token) {
  return { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' };
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

function isRepositoryPart(value) { return typeof value === 'string' && /^[A-Za-z0-9_.-]+$/.test(value); }
function isFullSha(value) { return typeof value === 'string' && /^[a-f0-9]{40}$/i.test(value); }
function isHostPrefix(value) { return typeof value === 'string' && /^[a-z0-9-]{3,100}$/i.test(value); }

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const discovered = await discoverRehearsalPreviewDeployments({
    owner: args.owner,
    repo: args.repo,
    candidateCommit: args.candidateCommit,
    githubToken: process.env.SCHOLARSCOUT_GITHUB_DEPLOYMENTS_TOKEN,
    baselineHostPrefix: args.baselineHostPrefix,
    outageHostPrefix: args.outageHostPrefix,
  });
  const output = `${JSON.stringify(discovered, null, 2)}\n`;
  if (args.output) await writeFile(path.resolve(args.output), output);
  if (args.githubEnv) await appendFile(path.resolve(args.githubEnv), `SCHOLARSCOUT_PREVIEW_URL=${discovered.baselineUrl}\nSCHOLARSCOUT_PREVIEW_OUTAGE_URL=${discovered.outageUrl}\n`);
  process.stdout.write(output);
}

function parseArgs(values) {
  const args = { owner: '', repo: '', candidateCommit: '', baselineHostPrefix: '', outageHostPrefix: '', output: '', githubEnv: '' };
  for (let index = 0; index < values.length; index += 1) {
    const key = values[index];
    const value = values[index + 1];
    const map = { '--owner': 'owner', '--repo': 'repo', '--candidate-commit': 'candidateCommit', '--baseline-host-prefix': 'baselineHostPrefix', '--outage-host-prefix': 'outageHostPrefix', '--output': 'output', '--github-env': 'githubEnv' };
    if (!(key in map) || !value) throw new Error('Invalid rehearsal deployment discovery arguments.');
    args[map[key]] = value;
    index += 1;
  }
  return args;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
