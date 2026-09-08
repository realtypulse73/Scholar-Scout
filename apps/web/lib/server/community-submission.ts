import 'server-only';

export type CommunitySubmissionReservation =
  | { status: 'allowed' }
  | { status: 'unavailable' };

/**
 * Provides a Preview-only provider outage seam for community submission checks.
 * Production and local requests must never inherit this rehearsal switch.
 */
export function reserveCommunitySubmission(): CommunitySubmissionReservation {
  if (
    process.env.VERCEL_ENV === 'preview' &&
    process.env.SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE === '1'
  ) {
    return { status: 'unavailable' };
  }

  return { status: 'allowed' };
}
