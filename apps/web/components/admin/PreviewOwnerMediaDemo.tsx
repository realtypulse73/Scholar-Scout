'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Availability = 'loading' | 'available' | 'unavailable';
type SubmissionState = 'idle' | 'pending' | 'ready' | 'conflict' | 'unavailable';

interface PreviewReconciliation {
  submissionId: string;
  expectedRevision: number;
  programmeId: string;
  candidates: Array<{ id: string; title: string }>;
}

/** Owner-only entry point for the server-authorized Preview test-media exception. */
export default function PreviewOwnerMediaDemo() {
  const [availability, setAvailability] = useState<Availability>('loading');
  const [submissionState, setSubmissionState] = useState<SubmissionState>('idle');
  const [reconciliation, setReconciliation] = useState<PreviewReconciliation | null>(null);
  const [candidateId, setCandidateId] = useState('');
  const [linkState, setLinkState] = useState<SubmissionState>('idle');

  useEffect(() => {
    let active = true;
    void fetch('/api/admin/contributor-media/preview-demo')
      .then(async (response) => {
        const body = response.ok ? await response.json() as { available?: unknown } : null;
        if (!active || body?.available !== true) {
          if (active) setAvailability('unavailable');
          return;
        }
        setAvailability('available');
        void fetch('/api/admin/contributor-media/preview-demo/link')
          .then(async (linkResponse) => {
            const linkBody = linkResponse.ok
              ? await linkResponse.json() as { reconciliation?: PreviewReconciliation | null }
              : null;
            if (active) setReconciliation(linkBody?.reconciliation ?? null);
          })
          .catch(() => {
            if (active) setReconciliation(null);
          });
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

  async function linkPackage(): Promise<void> {
    if (!reconciliation || !candidateId) return;
    setLinkState('pending');
    try {
      const response = await fetch('/api/admin/contributor-media/preview-demo/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: reconciliation.submissionId,
          expectedRevision: reconciliation.expectedRevision,
          candidateId,
        }),
      });
      if (response.ok) {
        setLinkState('ready');
        setReconciliation(null);
        window.dispatchEvent(new Event('scholarscout:contributor-media-reconciled'));
      } else if (response.status === 409) {
        setLinkState('conflict');
      } else {
        setLinkState('unavailable');
      }
    } catch {
      setLinkState('unavailable');
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
        {submissionState === 'ready' && 'Your private Preview invitation is ready.'}
        {submissionState === 'conflict' && 'The invitation changed. Reload and try again.'}
        {submissionState === 'unavailable' && 'This Preview demo is unavailable. Reload and try again.'}
      </p>
      {submissionState === 'ready' ? (
        <Link
          href="/contribute/media?fresh=1"
          className="mt-3 inline-flex min-h-10 items-center rounded-md border border-brand-700 px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          Start a fresh private Preview draft
        </Link>
      ) : null}
      {reconciliation ? (
        <section className="mt-5 rounded-md border border-amber-400 bg-white p-4" aria-labelledby="preview-owner-reconciliation-heading">
          <h3 id="preview-owner-reconciliation-heading" className="font-semibold text-ink-900">
            Link an existing private package for review
          </h3>
          <p className="mt-2 text-sm text-ink-700">
            Select the matching approved catalogue record. This Preview-only repair keeps the package private and does not publish media.
          </p>
          <label className="mt-3 block text-sm font-semibold text-ink-800" htmlFor="preview-owner-candidate">
            Approved catalogue record
          </label>
          <select
            id="preview-owner-candidate"
            className="mt-1 w-full rounded-md border border-ink-300 bg-white px-3 py-2 text-sm"
            value={candidateId}
            onChange={(event) => setCandidateId(event.target.value)}
          >
            <option value="">Select the matching record</option>
            {reconciliation.candidates.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>{candidate.title} ({candidate.id})</option>
            ))}
          </select>
          <button
            type="button"
            className="mt-3 rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={linkPackage}
            disabled={!candidateId || linkState === 'pending' || linkState === 'ready'}
          >
            {linkState === 'pending' ? 'Linking package…' : 'Link private package for review'}
          </button>
          <p className="mt-3 text-sm text-ink-700" aria-live="polite">
            {linkState === 'conflict' && 'The private package changed. Reload and try again.'}
            {linkState === 'unavailable' && 'The private package could not be linked. Reload and try again.'}
          </p>
        </section>
      ) : null}
      {linkState === 'ready' ? (
        <p className="mt-3 text-sm text-ink-700" role="status">
          Private package linked. It is now available in Private contributor media review.
        </p>
      ) : null}
    </section>
  );
}
