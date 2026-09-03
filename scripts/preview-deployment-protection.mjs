const PREVIEW_HOST_SUFFIX = '.vercel.app';

export const VERCEL_BYPASS_HEADER = 'x-vercel-protection-bypass';
export const VERCEL_BYPASS_COOKIE_HEADER = 'x-vercel-set-bypass-cookie';

function isExactCandidateCommit(value, candidateCommit) {
  return typeof value === 'string'
    && /^[0-9a-f]{40}$/i.test(value)
    && value === candidateCommit;
}

function isProtectedPreviewUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && url.hostname.endsWith(PREVIEW_HOST_SUFFIX)
      && url.hostname.includes('-git-')
      && !url.username
      && !url.password
      && !url.search
      && !url.hash
      && (url.pathname === '/' || url.pathname === '');
  } catch {
    return false;
  }
}

/**
 * Reads only the runner's candidate-bound Preview metadata. A generic error
 * avoids turning a malformed URL or deployment identifier into diagnostics.
 */
export function getVerifiedPreviewMetadata(environment, candidateCommit) {
  const metadata = {
    environment: environment.VERCEL_ENV,
    url: environment.SCHOLARSCOUT_PREVIEW_URL,
    deploymentId: environment.SCHOLARSCOUT_PREVIEW_DEPLOYMENT_ID,
    commitSha: environment.SCHOLARSCOUT_PREVIEW_COMMIT_SHA,
  };

  if (metadata.environment !== 'preview'
    || !isProtectedPreviewUrl(metadata.url)
    || typeof metadata.deploymentId !== 'string'
    || !metadata.deploymentId
    || !isExactCandidateCommit(metadata.commitSha, candidateCommit)) {
    throw new Error('A verified candidate Preview is required before tracer traffic.');
  }

  return metadata;
}

/**
 * Returns only in-memory browser-context options. The caller must not put this
 * value in a child command, environment, report, or generated artifact.
 */
export function createPreviewContextOptions(metadata, environment) {
  const bypass = environment.SCHOLARSCOUT_VERCEL_PROTECTION_BYPASS;
  if (typeof bypass !== 'string' || !bypass) {
    throw new Error('Preview protection material is required before browser creation.');
  }

  return {
    baseURL: metadata.url,
    extraHTTPHeaders: {
      [VERCEL_BYPASS_HEADER]: bypass,
      [VERCEL_BYPASS_COOKIE_HEADER]: 'true',
    },
    ignoreHTTPSErrors: false,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  };
}

/**
 * Keeps ordinary page and API traffic authenticated after the context has
 * received its bypass cookie, without repeating Vercel's redirecting cookie
 * bootstrap instruction.
 */
export function createPreviewSteadyStateHeaders(contextOptions) {
  const headers = { ...contextOptions.extraHTTPHeaders };
  delete headers[VERCEL_BYPASS_COOKIE_HEADER];
  return headers;
}

/**
 * Candidate-bound evidence intentionally excludes URLs, raw errors, cookies,
 * request headers, capabilities, fixture data, and browser diagnostics.
 */
export function scrubPreviewTracerOutcome({ category, metadata }) {
  return {
    category,
    candidateCommit: metadata.commitSha,
    deploymentId: metadata.deploymentId,
  };
}
