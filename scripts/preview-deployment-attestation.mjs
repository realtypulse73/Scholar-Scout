export const MAX_STATUS_AGE_MS = 900000;

const DEPLOYMENTS_PER_PAGE = 100;
const MAX_PAGES = 10;
const APPROVED_CREATOR_LOGIN = 'vercel[bot]';
const APPROVED_CREATOR_TYPE = 'Bot';
const APPROVED_REHEARSAL_ENVIRONMENTS = new Set([
  'Preview – scholar-scout-rehearsal-baseline',
  'Preview – scholar-scout-rehearsal-outage',
]);
const ATTESTATION_ERROR = 'Preview deployment attestation failed.';

/**
 * Independently binds a requested Preview URL to one fresh, successful Vercel
 * GitHub Deployment status for the exact candidate commit.
 */
export async function attestPreviewDeployment({
  owner,
  repo,
  candidateCommit,
  submittedUrl,
  expectedEnvironment,
  githubToken,
  fetchImpl = fetch,
  nowUtcMs = Date.now(),
} = {}) {
  const normalizedSubmittedUrl = normalizeHttpsUrl(submittedUrl);
  if (
    !isRepositoryPart(owner) ||
    !isRepositoryPart(repo) ||
    !isFullSha(candidateCommit) ||
    !normalizedSubmittedUrl ||
    !isApprovedRehearsalEnvironment(expectedEnvironment) ||
    typeof githubToken !== 'string' ||
    githubToken.trim().length === 0 ||
    typeof nowUtcMs !== 'number' ||
    !Number.isFinite(nowUtcMs)
  ) {
    throwAttestationError();
  }

  const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;
  const deployments = await readPaginated({
    endpointForPage: (page) => `${baseUrl}/deployments?per_page=${DEPLOYMENTS_PER_PAGE}&page=${page}`,
    fetchImpl,
    githubToken,
  });

  const matchingDeployments = deployments.filter((deployment) => (
    deployment &&
    deployment.sha === candidateCommit &&
    deployment.environment === expectedEnvironment &&
    deployment.creator?.login === APPROVED_CREATOR_LOGIN &&
    deployment.creator?.type === APPROVED_CREATOR_TYPE &&
    Number.isInteger(deployment.id)
  ));

  const freshCandidates = [];
  for (const deployment of matchingDeployments) {
    const statuses = await readPaginated({
      endpointForPage: (page) => (
        `${baseUrl}/deployments/${deployment.id}/statuses?per_page=${DEPLOYMENTS_PER_PAGE}&page=${page}`
      ),
      fetchImpl,
      githubToken,
    });
    const newestFreshStatusAtMs = findNewestFreshMatchingStatus({
      statuses,
      normalizedSubmittedUrl,
      expectedEnvironment,
      nowUtcMs,
    });
    if (newestFreshStatusAtMs !== null) {
      freshCandidates.push({ id: deployment.id, statusAtMs: newestFreshStatusAtMs });
    }
  }

  if (freshCandidates.length === 0) throwAttestationError();

  freshCandidates.sort((left, right) => right.statusAtMs - left.statusAtMs);
  if (
    freshCandidates.length > 1 &&
    freshCandidates[0].statusAtMs === freshCandidates[1].statusAtMs
  ) {
    throwAttestationError();
  }

  return {
    environment: 'preview',
    url: normalizedSubmittedUrl,
    commit: candidateCommit,
  };
}

function findNewestFreshMatchingStatus({
  statuses,
  normalizedSubmittedUrl,
  expectedEnvironment,
  nowUtcMs,
}) {
  let newestFreshStatusAtMs = null;

  for (const status of statuses) {
    if (
      !status ||
      status.state !== 'success' ||
      status.environment !== expectedEnvironment ||
      normalizeHttpsUrl(status.environment_url) !== normalizedSubmittedUrl
    ) {
      continue;
    }

    const createdAtMs = parseStatusTimestamp(status.created_at);
    if (createdAtMs === null || createdAtMs > nowUtcMs) throwAttestationError();
    if (nowUtcMs - createdAtMs > MAX_STATUS_AGE_MS) continue;

    if (newestFreshStatusAtMs === null || createdAtMs > newestFreshStatusAtMs) {
      newestFreshStatusAtMs = createdAtMs;
    }
  }

  return newestFreshStatusAtMs;
}

async function readPaginated({ endpointForPage, fetchImpl, githubToken }) {
  const records = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const response = await fetchImpl(endpointForPage(page), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github+json',
      },
    });
    if (!response?.ok) throwAttestationError();

    let pageRecords;
    try {
      pageRecords = await response.json();
    } catch {
      throwAttestationError();
    }
    if (!Array.isArray(pageRecords)) throwAttestationError();

    records.push(...pageRecords);
    if (pageRecords.length < DEPLOYMENTS_PER_PAGE) return records;
  }

  throwAttestationError();
}

function normalizeHttpsUrl(value) {
  if (typeof value !== 'string') return null;

  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
      return null;
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

function parseStatusTimestamp(value) {
  if (typeof value !== 'string') return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function isFullSha(value) {
  return typeof value === 'string' && /^[a-f0-9]{40}$/i.test(value);
}

function isRepositoryPart(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_.-]+$/.test(value);
}

function isApprovedRehearsalEnvironment(value) {
  return typeof value === 'string' && APPROVED_REHEARSAL_ENVIRONMENTS.has(value);
}

function throwAttestationError() {
  throw new Error(ATTESTATION_ERROR);
}
