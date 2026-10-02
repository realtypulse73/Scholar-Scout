'use client';

import { useEffect, useState } from 'react';

interface ReviewItem {
  id: string;
  status: 'Ready for review' | 'Action needed' | 'Approved for release';
  revision: number;
  programmeId: string;
  signerName: string;
  attestedAt: string;
  creatorAuthority: true;
  recognisablePeopleConsent: true;
  videoUploaded: boolean;
  posterUploaded: boolean;
}

export default function ContributorMediaReviewManager() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void loadQueue();
  }, []);

  async function loadQueue(): Promise<void> {
    const response = await fetch('/api/admin/contributor-media/review');
    const body = await response.json() as { items?: ReviewItem[]; error?: string };
    if (!response.ok) {
      setMessage(body.error ?? 'Private review queue is unavailable.');
      return;
    }
    setItems(body.items ?? []);
  }

  async function decide(item: ReviewItem, decision: 'approve' | 'action-needed'): Promise<void> {
    const response = await fetch('/api/admin/contributor-media/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId: item.id, expectedRevision: item.revision, decision }),
    });
    if (!response.ok) {
      setMessage('This private review changed. Reload before deciding.');
      return;
    }
    setMessage(decision === 'approve' ? 'Approved for release eligibility. Publication remains a separate administrator action.' : 'Marked Action needed.');
    await loadQueue();
  }

  return (
    <section className="mt-8 rounded-card border border-ink-200 bg-white p-5" aria-labelledby="contributor-media-review-heading">
      <h2 id="contributor-media-review-heading" className="text-xl font-semibold">Private contributor media review</h2>
      <p className="mt-2 text-sm text-ink-700">A Houston Tillotson association is a factual selected-school association only. It is not official affiliation, endorsement, attendance, placement, or an outcome claim.</p>
      {message ? <p className="mt-3 text-sm" role="status">{message}</p> : null}
      {items.length === 0 ? <p className="mt-3 text-sm text-ink-700">No current private packages need review.</p> : (
        <ul className="mt-4 space-y-4">
          {items.map((item) => <li key={item.id} className="rounded border border-ink-200 p-4">
            <p className="font-semibold">Programme: {item.programmeId}</p>
            <p className="text-sm text-ink-700">Attested by {item.signerName} on {item.attestedAt}. Creator authority: confirmed. Recognisable-person consent: confirmed.</p>
            <p className="text-sm text-ink-700">Package inspection receipt: video {item.videoUploaded ? 'received' : 'missing'}; poster {item.posterUploaded ? 'received' : 'missing'}.</p>
            <div className="mt-3 flex gap-3">
              <button type="button" className="rounded bg-brand-700 px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-brand-500" onClick={() => void decide(item, 'approve')}>Approve for release</button>
              <button type="button" className="rounded border border-ink-300 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500" onClick={() => void decide(item, 'action-needed')}>Request action needed</button>
            </div>
          </li>)}
        </ul>
      )}
    </section>
  );
}
