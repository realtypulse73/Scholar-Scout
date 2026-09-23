'use client';

import { ChangeEvent, useEffect, useState } from 'react';

type Capability = 'editor' | 'reviewer' | 'administrator';
type ChecklistStatus = 'passed' | 'needs-correction' | 'fallback';

interface CandidateSummary {
  id: string;
  title: string;
  lifecycle: 'draft' | 'approved' | 'quarantined';
  revision: number;
  correctionCodes: string[];
  reviewStatus: string;
  creatorId: string;
  reviewerId: string | null;
  checklist: {
    summary: Array<{ category: string; status: ChecklistStatus }>;
    passMeaning: string;
  };
  audit: Array<{
    actor: string;
    capability: string;
    action: string;
    timestamp: string;
    outcome: string;
    reason?: string;
    correctionCodes: string[];
    reviewStatus: string;
    candidateRevision: number;
  }>;
}

interface ConflictDto {
  candidateId: string;
  currentRevision: number | null;
  attemptedRevision: number;
  current: { title: string; claimBoundary: string; regionId: string } | null;
  attempted: { title: string; claimBoundary: string; regionId: string };
  mergeChoices: ['current', 'attempted'];
}

const checklistLabels: Record<string, string> = {
  source: 'source',
  'material-evidence': 'material evidence',
  freshness: 'freshness',
  'claim-boundary': 'claim boundary',
  'regional-boundary': 'regional boundary',
  'media-rights': 'media rights',
};

export default function CataloguePublicationManager() {
  const [candidates, setCandidates] = useState<CandidateSummary[]>([]);
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [importText, setImportText] = useState('');
  const [status, setStatus] = useState('Loading private catalogue candidates…');
  const [conflict, setConflict] = useState<ConflictDto | null>(null);
  const [attemptedTitle, setAttemptedTitle] = useState('');
  const [attemptedClaimBoundary, setAttemptedClaimBoundary] = useState('');
  const [titleChoice, setTitleChoice] = useState<'current' | 'attempted'>('current');
  const claimChoice: 'current' | 'attempted' = 'current';
  const [conflictReason, setConflictReason] = useState('');

  const canEdit = capabilities.includes('editor');
  const canReview = capabilities.includes('reviewer');

  async function loadCandidates() {
    const response = await fetch('/api/admin/catalogue-publications?view=candidate-intake');
    const body = await response.json() as {
      capabilities?: Capability[];
      candidates?: CandidateSummary[];
      error?: string;
    };
    if (!response.ok) {
      setStatus(body.error ?? 'Unable to load private catalogue candidates.');
      return;
    }
    setCapabilities(body.capabilities ?? []);
    setCandidates(body.candidates ?? []);
    setStatus('Private catalogue candidates loaded.');
  }

  useEffect(() => {
    void loadCandidates();
  }, []);

  async function sendAction(action: string, body: Record<string, unknown>) {
    const response = await fetch(`/api/admin/catalogue-publications?action=${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await response.json() as { error?: string; conflict?: ConflictDto; status?: string };
    if (response.status === 409 && result.conflict) {
      setConflict(result.conflict);
      setAttemptedTitle(result.conflict.attempted.title);
      setAttemptedClaimBoundary(result.conflict.attempted.claimBoundary);
      setStatus('This candidate changed. Compare both values before choosing what to keep.');
      return;
    }
    if (!response.ok) {
      setStatus(result.error ?? 'The catalogue action could not be completed.');
      return;
    }
    setStatus('Catalogue action saved.');
    setConflict(null);
    await loadCandidates();
  }

  async function importCandidates() {
    if (!importText.trim()) {
      setStatus('Paste a structured import file before staging it.');
      return;
    }
    let envelope: unknown;
    try {
      envelope = JSON.parse(importText);
    } catch {
      setStatus('The import file must be valid JSON.');
      return;
    }
    const response = await fetch('/api/admin/catalogue-publications/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope),
    });
    const result = await response.json() as { error?: string };
    setStatus(response.ok ? 'Private import staged for correction or review.' : result.error ?? 'The import was not staged.');
    if (response.ok) {
      setImportText('');
      await loadCandidates();
    }
  }

  async function readImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportText(await file.text());
    setStatus(`Loaded ${file.name}. Review it before staging.`);
  }

  async function resolveConflict() {
    if (!conflict) return;
    const retainsOlderTitle = titleChoice === 'attempted' && attemptedTitle !== conflict.current?.title;
    const retainsOlderClaim = claimChoice === 'attempted'
      && attemptedClaimBoundary !== conflict.current?.claimBoundary;
    if ((retainsOlderTitle || retainsOlderClaim) && conflictReason.trim().length < 8) {
      setStatus('Explain why the older value should be retained before resolving this conflict.');
      return;
    }
    await sendAction('resolve-conflict', {
      candidateId: conflict.candidateId,
      expectedRevision: conflict.currentRevision,
      attempted: { title: attemptedTitle, claimBoundary: attemptedClaimBoundary },
      choices: { title: titleChoice, claimBoundary: claimChoice },
      reason: conflictReason,
    });
  }

  return (
    <section className="space-y-6" aria-labelledby="catalogue-publication-title">
      <header className="rounded-card border border-silver-200 bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">Staff catalogue workflow</p>
        <h1 id="catalogue-publication-title" className="mt-2 text-3xl font-semibold text-ink-900">Private intake and review</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-700">
          Candidates stay private until an authorized release. A passing checklist means editorial
          completeness, not verified real-world provider truth.
        </p>
      </header>

      <p role="status" aria-live="polite" className="rounded-card bg-ink-50 px-4 py-3 text-sm text-ink-700">
        {status}
      </p>

      {canEdit ? (
        <section className="rounded-card border border-silver-200 bg-white p-6" aria-labelledby="catalogue-intake-title">
          <h2 id="catalogue-intake-title" className="text-xl font-semibold text-ink-900">Structured candidate intake</h2>
          <p className="mt-2 text-sm text-ink-600">Paste a one-to-25 record JSON file, or load one from your computer. It is staged privately.</p>
          <label className="mt-4 block text-sm font-semibold text-ink-800" htmlFor="catalogue-import">Import JSON</label>
          <textarea id="catalogue-import" value={importText} onChange={(event) => setImportText(event.target.value)} className="mt-2 min-h-40 w-full rounded-card border border-silver-300 p-3 font-mono text-xs text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus" />
          <div className="mt-3 flex flex-wrap gap-3">
            <label className="inline-flex min-h-touch cursor-pointer items-center rounded-card border border-silver-300 px-4 text-sm font-semibold text-ink-800">
              Load JSON file
              <input className="sr-only" type="file" accept="application/json,.json" onChange={readImportFile} />
            </label>
            <button type="button" onClick={() => void importCandidates()} className="min-h-touch rounded-card bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Stage private import</button>
          </div>
        </section>
      ) : null}

      <section className="space-y-4" aria-label="Private catalogue candidates">
        {candidates.map((candidate) => (
          <article key={candidate.id} className="rounded-card border border-silver-200 bg-white p-6 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-ink-900">{candidate.title}</h2>
                <p className="mt-1 text-sm text-ink-600">{candidate.id} · revision {candidate.revision} · {candidate.lifecycle}</p>
              </div>
              <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-700">{candidate.reviewStatus}</span>
            </div>
            <p className="mt-3 text-sm text-ink-700">Creator: {candidate.creatorId}. Reviewer: {candidate.reviewerId ?? 'Independent review pending'}.</p>
            {candidate.correctionCodes.length > 0 ? <p className="mt-2 text-sm font-semibold text-warning-700">Needs correction: {candidate.correctionCodes.join(', ')}</p> : null}
            <ul className="mt-4 grid gap-2 sm:grid-cols-2" aria-label={`${candidate.title} checklist`}>
              {candidate.checklist.summary.map((item) => <li key={item.category} className="rounded-card bg-ink-50 px-3 py-2 text-sm text-ink-800"><span className="font-semibold">{checklistLabels[item.category] ?? item.category}</span>: {item.status}</li>)}
            </ul>
            <p className="mt-3 text-xs leading-5 text-ink-600">{candidate.checklist.passMeaning}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {canEdit ? <button type="button" onClick={() => void sendAction('submit', { candidateId: candidate.id, expectedRevision: candidate.revision })} className="min-h-touch rounded-card border border-brand-700 px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Submit for review</button> : null}
              {canReview ? <button type="button" onClick={() => void sendAction('review', { candidateId: candidate.id, expectedRevision: candidate.revision })} className="min-h-touch rounded-card bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Approve candidate</button> : null}
              {canEdit ? <button type="button" onClick={() => { setConflict({ candidateId: candidate.id, currentRevision: candidate.revision, attemptedRevision: candidate.revision - 1, current: { title: candidate.title, claimBoundary: '', regionId: '' }, attempted: { title: candidate.title, claimBoundary: '', regionId: '' }, mergeChoices: ['current', 'attempted'] }); setAttemptedTitle(candidate.title); setAttemptedClaimBoundary(''); }} className="min-h-touch rounded-card border border-silver-400 px-4 text-sm font-semibold text-ink-800 hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Resolve conflict</button> : null}
            </div>
            <details className="mt-5 rounded-card bg-ink-50 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-ink-800">Safe candidate audit</summary>
              <ul className="mt-3 space-y-2 text-xs text-ink-700">{candidate.audit.map((event, index) => <li key={`${event.timestamp}-${index}`}>{event.timestamp}: {event.action} by {event.capability}; {event.outcome}{event.reason ? ` — ${event.reason}` : ''}</li>)}</ul>
            </details>
          </article>
        ))}
      </section>

      {conflict ? (
        <section className="rounded-card border-2 border-warning-500 bg-warning-50 p-6" aria-labelledby="catalogue-conflict-title">
          <h2 id="catalogue-conflict-title" className="text-xl font-semibold text-ink-900">Resolve candidate conflict</h2>
          <p className="mt-2 text-sm text-ink-700">Compare the current and attempted values. Keeping an older attempted value requires an audit reason.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-semibold text-ink-800">Current title<input readOnly value={conflict.current?.title ?? 'No current candidate'} className="mt-1 w-full rounded-card border border-silver-300 bg-white p-2 text-sm" /></label>
            <label className="block text-sm font-semibold text-ink-800">Attempted title<input value={attemptedTitle} onChange={(event) => setAttemptedTitle(event.target.value)} className="mt-1 w-full rounded-card border border-silver-300 bg-white p-2 text-sm" /></label>
          </div>
          <div className="mt-3 flex flex-wrap gap-3"><button type="button" onClick={() => setTitleChoice('current')} className="min-h-touch rounded-card border border-silver-400 px-3 text-sm font-semibold text-ink-800">Keep current title</button><button type="button" onClick={() => setTitleChoice('attempted')} className="min-h-touch rounded-card border border-silver-400 px-3 text-sm font-semibold text-ink-800">Keep attempted title</button></div>
          <label className="mt-4 block text-sm font-semibold text-ink-800" htmlFor="catalogue-conflict-reason">Reason when retaining an older value<textarea id="catalogue-conflict-reason" value={conflictReason} onChange={(event) => setConflictReason(event.target.value)} className="mt-1 min-h-24 w-full rounded-card border border-silver-300 bg-white p-2 text-sm" /></label>
          <button type="button" onClick={() => void resolveConflict()} className="mt-4 min-h-touch rounded-card bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Save conflict decision</button>
        </section>
      ) : null}
    </section>
  );
}
