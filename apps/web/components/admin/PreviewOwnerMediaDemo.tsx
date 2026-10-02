'use client';

import { useEffect, useState } from 'react';

type Availability = 'loading' | 'available' | 'unavailable';
type SubmissionState = 'idle' | 'pending' | 'ready' | 'conflict' | 'unavailable';

/** Owner-only entry point for the server-authorized Preview test-media exception. */
export default function PreviewOwnerMediaDemo() {
  const [availability, setAvailability] = useState<Availability>('loading');
  const [submissionState, setSubmissionState] = useState<SubmissionState>('idle');

  useEffect(() => {
    let active = true;
    void fetch('/api/admin/contributor-media/preview-demo')
      .then(async (response) => {
        const body = response.ok ? await response.json() as { available?: unknown } : null;
        if (active) setAvailability(body?.available === true ? 'available' : 'unavailable');
      })
      .catch(() => {
        if (active) setAvailability('unavailable');
      });
    return () => { active = false; };
  }, []);

  async function createInvitation(): Promise<void> {
    setSubmissionState('pending');
    try {
      const response = await fetch('/api/admin/contributor-media/preview-demo', {
        method: 'POST',
      });
      if (response.ok) {
        setSubmissionState('ready');
      } else if (response.status === 409) {
        setSubmissionState('conflict');
      } else {
        setSubmissionState('unavailable');
      }
    } catch {
      setSubmissionState('unavailable');
    }
  }

  if (availability !== 'available') return null;

  return (
    <section className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-5" aria-labelledby="preview-owner-media-demo-heading">
      <h2 id="preview-owner-media-demo-heading" className="text-lg font-semibold text-ink-900">
        Preview-only original test media
      </h2>
      <p className="mt-2 text-sm text-ink-700">
        This is a Preview-only exception for original test media. It does not enable student uploads or suggest provider endorsement.
      </p>
      <p className="mt-2 text-sm text-ink-700">
        Normal contributor media still requires independent review and publication.
      </p>
      <button
        type="button"
        className="mt-4 rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
        onClick={createInvitation}
        disabled={submissionState === 'pending' || submissionState === 'ready'}
      >
        {submissionState === 'pending' ? 'Creating invitation…' : 'Create my Preview invitation'}
      </button>
      <p className="mt-3 text-sm text-ink-700" aria-live="polite">
        {submissionState === 'ready' && 'Your private Preview invitation is ready. Continue through the normal contributor workflow.'}
        {submissionState === 'conflict' && 'The invitation changed. Reload and try again.'}
        {submissionState === 'unavailable' && 'This Preview demo is unavailable. Reload and try again.'}
      </p>
    </section>
  );
}
