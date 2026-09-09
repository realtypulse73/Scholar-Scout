const BYPASS_ENV = 'SCHOLARSCOUT_VERCEL_BYPASS';

/**
 * Validates that runner metadata names the exact Preview candidate before traffic.
 */
export function validatePreviewDeployment(metadata, candidateCommit) {
  if (
    !metadata ||
    metadata.environment !== 'preview' ||
    typeof candidateCommit !== 'string' ||
    candidateCommit.length === 0 ||
    metadata.commit !== candidateCommit ||
    typeof metadata.url !== 'string'
  ) {
    throw new Error('Preview tracer requires metadata for the selected Preview candidate.');
  }

  let target;
  try {
    target = new URL(metadata.url);
  } catch {
    throw new Error('Preview tracer requires a valid HTTPS Preview URL.');
  }
  if (target.protocol !== 'https:' || target.username || target.password || target.search || target.hash) {
    throw new Error('Preview tracer requires a clean HTTPS Preview URL.');
  }
  return target.toString().replace(/\/$/, '');
}

/**
 * Returns transient browser/context transport; it never logs or persists the secret.
 */
export function createProtectedPreviewContextOptions({ metadata, candidateCommit, env = process.env }) {
  const baseURL = validatePreviewDeployment(metadata, candidateCommit);
  const bypass = normalizeRunnerHeaderValue(env[BYPASS_ENV]);
  if (!bypass) {
    throw new Error('Preview tracer requires runner-only protection material.');
  }
  return {
    baseURL,
    extraHTTPHeaders: {
      'x-vercel-protection-bypass': bypass,
      'x-vercel-set-bypass-cookie': 'true',
    },
  };
}

/**
 * GitHub and provider secret CLIs can preserve a final line ending when a
 * runner-only header value is copied from a handoff file. Normalize that
 * boundary whitespace before use, without ever exposing the value.
 */
function normalizeRunnerHeaderValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}
