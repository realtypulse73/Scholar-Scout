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
  const bypass = env[BYPASS_ENV];
  if (typeof bypass !== 'string' || bypass.length === 0) {
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
