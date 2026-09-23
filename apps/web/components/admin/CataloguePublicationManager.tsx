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

interface WeeklyPreview {
  eligibility: {
    periodKey: string;
    withinWindow: boolean;
    alreadyPublished: boolean;
    eligible: boolean;
  };
  selected: Array<{ id: string; revision: number }>;
  quarantined: Array<{ id: string; revision: number; correctionCodes: string[] }>;
  mediaFallbackIds: string[];
}

interface SnapshotHistoryEntry {
  actor: string;
  capability: Capability;
  action: string;
  timestamp: string;
  outcome: string;
  version: number;
  kind: 'weekly' | 'emergency' | 'restore';
  periodKey?: string;
  reason?: string;
  correctionStatus: string;
  reviewStatus: string;
  lineage: {
    snapshotId: string;
    priorSnapshotId: string | null;
    restoredFromSnapshotId: string | null;
    contentDigest: string;
  };
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
  const [claimChoice, setClaimChoice] = useState<'current' | 'attempted'>('current');
  const [conflictReason, setConflictReason] = useState('');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [weeklyPreview, setWeeklyPreview] = useState<WeeklyPreview | null>(null);
  const [snapshotHistory, setSnapshotHistory] = useState<SnapshotHistoryEntry[]>([]);
  const [recoveryCandidateId, setRecoveryCandidateId] = useState('');
  const [recoveryCandidateText, setRecoveryCandidateText] = useState('');
  const [emergencyReason, setEmergencyReason] = useState('');
  const [restoreSnapshotId, setRestoreSnapshotId] = useState('');
  const [restoreReason, setRestoreReason] = useState('');

  const canEdit = capabilities.includes('editor');
  const canReview = capabilities.includes('reviewer');
  const canAdminister = capabilities.includes('administrator');

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
    setSelectedCandidateIds((current) => current.length > 0
      ? current.filter((id) => (body.candidates ?? []).some((candidate) => candidate.id === id))
      : (body.candidates ?? [])
        .filter((candidate) => candidate.lifecycle === 'approved')
        .map((candidate) => candidate.id));
    setStatus('Private catalogue candidates loaded.');
  }

  async function loadSnapshotHistory() {
    const response = await fetch('/api/admin/catalogue-publications?view=snapshot-history');
    const body = await response.json() as { history?: SnapshotHistoryEntry[]; error?: string };
    if (!response.ok) {
      setStatus(body.error ?? 'Unable to load catalogue release history.');
      return;
    }
    const history = body.history ?? [];
    setSnapshotHistory(history);
    setRestoreSnapshotId((current) => current || history[0]?.lineage.snapshotId || '');
  }

  useEffect(() => {
    void loadCandidates();
    void loadSnapshotHistory();
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
    const result = await response.json() as { error?: string; conflict?: ConflictDto };
    if (response.status === 409 && result.conflict) {
      setConflict(result.conflict);
      setAttemptedTitle(result.conflict.attempted.title);
      setAttemptedClaimBoundary(result.conflict.attempted.claimBoundary);
      setTitleChoice('current');
      setClaimChoice('current');
      setConflictReason('');
      setStatus('This candidate changed. Compare both values before choosing what to keep.');
      return;
    }
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

  function toggleReleaseCandidate(candidateId: string) {
    setSelectedCandidateIds((current) => current.includes(candidateId)
      ? current.filter((id) => id !== candidateId)
      : [...current, candidateId]);
    setWeeklyPreview(null);
  }

  async function previewWeeklyRelease() {
    const response = await fetch('/api/admin/catalogue-publications?action=preview-weekly', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateIds: selectedCandidateIds }),
    });
    const body = await response.json() as WeeklyPreview & { error?: string };
    if (!response.ok) {
      setStatus(body.error ?? 'The weekly preview is unavailable.');
      return;
    }
    setWeeklyPreview(body);
    setStatus('Preview only — nothing has been published. The server calculated this release window and ISO-week period.');
  }

  async function publishWeeklyRelease() {
    const response = await fetch('/api/admin/catalogue-publications?action=publish-weekly', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateIds: selectedCandidateIds }),
    });
    const body = await response.json() as { error?: string; manifest?: { id?: string } };
    if (!response.ok) {
      setStatus(body.error ?? 'The weekly release could not be published. Reload the preview and try again.');
      return;
    }
    setWeeklyPreview(null);
    setStatus(`Weekly release published${body.manifest?.id ? ` (${body.manifest.id})` : ''}. The server rechecked eligibility before writing.`);
    await Promise.all([loadCandidates(), loadSnapshotHistory()]);
  }

  async function publishEmergencyCorrection() {
    const selected = candidates.find((candidate) => candidate.id === recoveryCandidateId);
    if (!selected || !emergencyReason.trim() || !recoveryCandidateText.trim()) {
      setStatus('Choose a candidate, provide the corrected candidate JSON, and explain the emergency correction.');
      return;
    }
    let correctedCandidate: unknown;
    try {
      correctedCandidate = JSON.parse(recoveryCandidateText);
    } catch {
      setStatus('The emergency correction must be valid candidate JSON.');
      return;
    }
    const response = await fetch('/api/admin/catalogue-publications?action=emergency-correction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId: selected.id,
        expectedRevision: selected.revision,
        candidate: correctedCandidate,
        reason: emergencyReason,
      }),
    });
    const body = await response.json() as { error?: string; manifest?: { id?: string } };
    if (!response.ok) {
      setStatus(body.error ?? 'The emergency correction could not be released.');
      return;
    }
    setStatus(`Emergency correction published${body.manifest?.id ? ` (${body.manifest.id})` : ''}. It does not use a weekly release slot.`);
    setRecoveryCandidateText('');
    setEmergencyReason('');
    await Promise.all([loadCandidates(), loadSnapshotHistory()]);
  }

  async function restoreSnapshot() {
    if (!restoreSnapshotId || !restoreReason.trim()) {
      setStatus('Choose a retained snapshot and provide a restore reason.');
      return;
    }
    const response = await fetch('/api/admin/catalogue-publications?action=restore-snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetSnapshotId: restoreSnapshotId, reason: restoreReason }),
    });
    const body = await response.json() as { error?: string; manifest?: { id?: string } };
    if (!response.ok) {
      setStatus(body.error ?? 'The catalogue snapshot could not be restored.');
      return;
    }
    setStatus(`A new restore snapshot was published${body.manifest?.id ? ` (${body.manifest.id})` : ''}; the retained history was not overwritten.`);
    setRestoreReason('');
    await Promise.all([loadCandidates(), loadSnapshotHistory()]);
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
            </div>
            <details className="mt-5 rounded-card bg-ink-50 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-ink-800">Safe candidate audit</summary>
              <ul className="mt-3 space-y-2 text-xs text-ink-700">{candidate.audit.map((event, index) => <li key={`${event.timestamp}-${index}`}>{event.timestamp}: {event.action} by {event.capability}; {event.outcome}{event.reason ? ` — ${event.reason}` : ''}</li>)}</ul>
            </details>
          </article>
        ))}
      </section>

      {canAdminister ? (
        <section className="rounded-card border border-silver-200 bg-white p-6 shadow-soft" aria-labelledby="catalogue-release-title">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">Release and recovery</p>
          <h2 id="catalogue-release-title" className="mt-2 text-xl font-semibold text-ink-900">Weekly catalogue release</h2>
          <p className="mt-2 text-sm leading-6 text-ink-700">Preview is non-mutating. The server, not this page, decides whether it is Monday 09:00–17:00 America/New_York and whether this ISO week already has a normal release.</p>
          <fieldset className="mt-4 space-y-2">
            <legend className="text-sm font-semibold text-ink-800">Approved records for this release</legend>
            {candidates.filter((candidate) => candidate.lifecycle === 'approved').map((candidate) => (
              <label key={candidate.id} className="flex items-center gap-2 text-sm text-ink-800">
                <input type="checkbox" checked={selectedCandidateIds.includes(candidate.id)} onChange={() => toggleReleaseCandidate(candidate.id)} />
                {candidate.title} (revision {candidate.revision})
              </label>
            ))}
          </fieldset>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => void previewWeeklyRelease()} className="min-h-touch rounded-card border border-brand-700 px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Preview weekly release</button>
            <button type="button" onClick={() => void publishWeeklyRelease()} className="min-h-touch rounded-card bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Publish weekly</button>
          </div>
          {weeklyPreview ? (
            <div className="mt-5 rounded-card bg-ink-50 p-4 text-sm text-ink-800" aria-label="Weekly release preview">
              <p className="font-semibold">Preview only — nothing has been published.</p>
              <p className="mt-1">ISO-week: {weeklyPreview.eligibility.periodKey}. Window eligible: {weeklyPreview.eligibility.withinWindow ? 'yes' : 'no'}. Already published this period: {weeklyPreview.eligibility.alreadyPublished ? 'yes' : 'no'}.</p>
              <p className="mt-1">Selected stable order: {weeklyPreview.selected.map((entry) => `${entry.id} (r${entry.revision})`).join(', ') || 'none'}.</p>
              <p className="mt-1">Quarantined corrections: {weeklyPreview.quarantined.map((entry) => `${entry.id}: ${entry.correctionCodes.join(', ')}`).join('; ') || 'none'}.</p>
              <p className="mt-1">{weeklyPreview.mediaFallbackIds.length > 0 ? `Media falls back to factual text and sources for: ${weeklyPreview.mediaFallbackIds.join(', ')}.` : 'No selected record needs a media fallback.'}</p>
            </div>
          ) : null}
        </section>
      ) : null}

      {canReview ? (
        <section className="rounded-card border border-silver-200 bg-white p-6" aria-labelledby="catalogue-emergency-title">
          <h2 id="catalogue-emergency-title" className="text-xl font-semibold text-ink-900">Emergency correction</h2>
          <p className="mt-2 text-sm leading-6 text-ink-700">This creates a separately audited emergency snapshot after the same checklist. It is exempt from the normal weekly schedule, not from evidence requirements.</p>
          <label className="mt-4 block text-sm font-semibold text-ink-800" htmlFor="emergency-candidate">Approved candidate<select id="emergency-candidate" value={recoveryCandidateId} onChange={(event) => setRecoveryCandidateId(event.target.value)} className="mt-1 w-full rounded-card border border-silver-300 bg-white p-2 text-sm"><option value="">Choose a candidate</option>{candidates.filter((candidate) => candidate.lifecycle === 'approved').map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.title} (revision {candidate.revision})</option>)}</select></label>
          <label className="mt-4 block text-sm font-semibold text-ink-800" htmlFor="emergency-candidate-json">Corrected candidate JSON<textarea id="emergency-candidate-json" value={recoveryCandidateText} onChange={(event) => setRecoveryCandidateText(event.target.value)} className="mt-1 min-h-32 w-full rounded-card border border-silver-300 p-2 font-mono text-xs" /></label>
          <label className="mt-4 block text-sm font-semibold text-ink-800" htmlFor="emergency-reason">Emergency reason<textarea id="emergency-reason" value={emergencyReason} onChange={(event) => setEmergencyReason(event.target.value)} className="mt-1 min-h-20 w-full rounded-card border border-silver-300 p-2 text-sm" /></label>
          <button type="button" onClick={() => void publishEmergencyCorrection()} className="mt-4 min-h-touch rounded-card bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Emergency correction</button>
        </section>
      ) : null}

      {canAdminister ? (
        <section className="rounded-card border border-silver-200 bg-white p-6" aria-labelledby="catalogue-restore-title">
          <h2 id="catalogue-restore-title" className="text-xl font-semibold text-ink-900">Restore retained snapshot</h2>
          <p className="mt-2 text-sm leading-6 text-ink-700">Restoring adds a new snapshot from the retained version; it never rewrites an earlier manifest.</p>
          <label className="mt-4 block text-sm font-semibold text-ink-800" htmlFor="restore-snapshot">Retained snapshot<select id="restore-snapshot" value={restoreSnapshotId} onChange={(event) => setRestoreSnapshotId(event.target.value)} className="mt-1 w-full rounded-card border border-silver-300 bg-white p-2 text-sm"><option value="">Choose a retained snapshot</option>{snapshotHistory.map((entry) => <option key={entry.lineage.snapshotId} value={entry.lineage.snapshotId}>{entry.lineage.snapshotId} (version {entry.version})</option>)}</select></label>
          <label className="mt-4 block text-sm font-semibold text-ink-800" htmlFor="restore-reason">Restore reason<textarea id="restore-reason" value={restoreReason} onChange={(event) => setRestoreReason(event.target.value)} className="mt-1 min-h-20 w-full rounded-card border border-silver-300 p-2 text-sm" /></label>
          <button type="button" onClick={() => void restoreSnapshot()} className="mt-4 min-h-touch rounded-card border border-brand-700 px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Restore snapshot</button>
        </section>
      ) : null}

      <section className="rounded-card border border-silver-200 bg-white p-6" aria-labelledby="catalogue-history-title">
        <h2 id="catalogue-history-title" className="text-xl font-semibold text-ink-900">Snapshot audit history</h2>
        <p className="mt-2 text-sm text-ink-700">This view contains release evidence and manifest lineage only. It never includes candidates, imports, learner data, provider-private material, or secrets.</p>
        <ul className="mt-4 space-y-3" aria-label="Redacted snapshot history">
          {snapshotHistory.map((entry) => <li key={entry.lineage.snapshotId} className="rounded-card bg-ink-50 p-3 text-sm text-ink-800"><p className="font-semibold">{entry.lineage.snapshotId} · version {entry.version} · {entry.kind}</p><p>{entry.timestamp}: {entry.action} by {entry.capability}; {entry.outcome}. {entry.correctionStatus}; {entry.reviewStatus}.</p><p>Lineage: prior {entry.lineage.priorSnapshotId ?? 'none'}, restored from {entry.lineage.restoredFromSnapshotId ?? 'none'}, digest {entry.lineage.contentDigest}.</p>{entry.periodKey ? <p>Normal-release period: {entry.periodKey}.</p> : null}{entry.reason ? <p>Reason: {entry.reason}</p> : null}</li>)}
          {snapshotHistory.length === 0 ? <li className="text-sm text-ink-600">No release snapshots have been published yet.</li> : null}
        </ul>
      </section>

      {conflict ? (
        <section className="rounded-card border-2 border-warning-500 bg-warning-50 p-6" aria-labelledby="catalogue-conflict-title">
          <h2 id="catalogue-conflict-title" className="text-xl font-semibold text-ink-900">Resolve candidate conflict</h2>
          <p className="mt-2 text-sm text-ink-700">Compare the current and attempted values. Keeping an older attempted value requires an audit reason.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-semibold text-ink-800">Current title<input readOnly value={conflict.current?.title ?? 'No current candidate'} className="mt-1 w-full rounded-card border border-silver-300 bg-white p-2 text-sm" /></label>
            <label className="block text-sm font-semibold text-ink-800">Attempted title<input readOnly value={attemptedTitle} className="mt-1 w-full rounded-card border border-silver-300 bg-white p-2 text-sm" /></label>
          </div>
          <div className="mt-3 flex flex-wrap gap-3"><button type="button" onClick={() => setTitleChoice('current')} className="min-h-touch rounded-card border border-silver-400 px-3 text-sm font-semibold text-ink-800">Keep current title</button><button type="button" onClick={() => setTitleChoice('attempted')} className="min-h-touch rounded-card border border-silver-400 px-3 text-sm font-semibold text-ink-800">Keep attempted title</button></div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-semibold text-ink-800">Current claim boundary<input readOnly value={conflict.current?.claimBoundary ?? 'No current candidate'} className="mt-1 w-full rounded-card border border-silver-300 bg-white p-2 text-sm" /></label>
            <label className="block text-sm font-semibold text-ink-800">Attempted claim boundary<input readOnly value={attemptedClaimBoundary} className="mt-1 w-full rounded-card border border-silver-300 bg-white p-2 text-sm" /></label>
          </div>
          <div className="mt-3 flex flex-wrap gap-3"><button type="button" onClick={() => setClaimChoice('current')} className="min-h-touch rounded-card border border-silver-400 px-3 text-sm font-semibold text-ink-800">Keep current claim boundary</button><button type="button" onClick={() => setClaimChoice('attempted')} className="min-h-touch rounded-card border border-silver-400 px-3 text-sm font-semibold text-ink-800">Keep attempted claim boundary</button></div>
          <label className="mt-4 block text-sm font-semibold text-ink-800" htmlFor="catalogue-conflict-reason">Reason when retaining an older value<textarea id="catalogue-conflict-reason" value={conflictReason} onChange={(event) => setConflictReason(event.target.value)} className="mt-1 min-h-24 w-full rounded-card border border-silver-300 bg-white p-2 text-sm" /></label>
          <button type="button" onClick={() => void resolveConflict()} className="mt-4 min-h-touch rounded-card bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Save conflict decision</button>
        </section>
      ) : null}
    </section>
  );
}
