'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  EMPTY_QUALIFICATION_RECORD,
  QUALIFICATION_KINDS,
  type QualificationKind,
  type QualificationRecord,
} from '@/lib/qualification-record';

const labels: Record<QualificationKind, string> = {
  'diploma-credits': 'Diploma or credits',
  degree: 'Degree',
  licence: 'Licence or certification',
  'prior-work': 'Prior work experience',
  'voluntary-military-history': 'Voluntary military history',
};

interface QualificationRecordFormProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function QualificationRecordForm({ onClose, onSuccess }: QualificationRecordFormProps) {
  const [record, setRecord] = useState<QualificationRecord>(EMPTY_QUALIFICATION_RECORD);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('Loading your private qualifications.');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [canReload, setCanReload] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/account/qualifications');
      if (!response.ok) throw new Error('load-failed');
      const body = (await response.json()) as { record?: QualificationRecord | null };
      setRecord(body.record ?? EMPTY_QUALIFICATION_RECORD);
      setCanReload(false);
      setStatus(hasSavedQualification(body.record) ? 'Private qualifications loaded.' : 'No qualifications saved yet.');
    } catch {
      setError('We could not load your qualifications. Please try again.');
      setStatus('Qualifications are unavailable.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleStructured(kind: QualificationKind) {
    setRecord((current) => ({
      ...current,
      structured: current.structured.includes(kind)
        ? current.structured.filter((item) => item !== kind)
        : [...current.structured, kind],
    }));
    setError(null);
    setCanReload(false);
  }

  function addKeyword() {
    const next = keyword.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
    if (!next || next.length > 40 || record.keywords.includes(next) || record.keywords.length >= 12) {
      setError('Add a unique keyword of 40 characters or fewer.');
      return;
    }
    setRecord((current) => ({ ...current, keywords: [...current.keywords, next] }));
    setKeyword('');
    setError(null);
    setCanReload(false);
  }

  async function save(nextRecord = record, action: 'save' | 'clear' = 'save') {
    setError(null);
    setStatus(action === 'clear' ? 'Clearing qualifications.' : 'Saving qualifications.');
    try {
      const response = await fetch('/api/account/qualifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextRecord),
      });
      if (response.status === 409) {
        setError('Your account changed elsewhere. Reload before saving; your draft is still here.');
        setCanReload(true);
        setStatus(action === 'clear' ? 'Clear needs your review.' : 'Save needs your review.');
        return;
      }
      if (!response.ok) throw new Error('save-failed');
      setRecord(nextRecord);
      setCanReload(false);
      setStatus(action === 'clear' ? 'Qualifications cleared.' : 'Qualifications saved.');
      onSuccess?.();
      onClose?.();
    } catch {
      setError(action === 'clear'
        ? 'We could not clear your qualifications. Please try again.'
        : 'We could not save your qualifications. Please try again.');
      setStatus(action === 'clear' ? 'Qualifications were not cleared.' : 'Qualifications were not saved.');
    }
  }

  async function confirmClear() {
    setShowClearConfirmation(false);
    await save(EMPTY_QUALIFICATION_RECORD, 'clear');
  }

  return (
    <section aria-labelledby="qualification-heading" className="min-w-0 rounded-card border border-ink-200 bg-white p-5">
      <h2 id="qualification-heading" className="text-xl font-semibold text-ink-900">Your qualifications</h2>
      <p className="mt-2 text-sm leading-6 text-ink-600">Private to your account. These details highlight published requirements to verify; they do not decide eligibility.</p>
      <p role="status" aria-live="polite" className="mt-3 text-sm text-ink-700">{status}</p>
      {error ? <p id="qualification-error" role="alert" className="mt-3 text-sm font-semibold text-danger-700">{error}</p> : null}
      {isLoading ? <div aria-hidden="true" className="mt-5 min-h-24 rounded-card border border-ink-200 bg-ink-50" /> : null}
      {!isLoading ? <>
      <fieldset className="mt-5 min-w-0">
        <legend className="font-semibold text-ink-900">Structured qualifications</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {QUALIFICATION_KINDS.map((kind) => (
            <label key={kind} className="flex min-h-touch items-center gap-3 rounded-card border border-ink-200 px-3 py-2 text-sm text-ink-800">
              <input type="checkbox" checked={record.structured.includes(kind)} onChange={() => toggleStructured(kind)} />
              {labels[kind]}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="mt-5 block text-sm font-semibold text-ink-900" htmlFor="qualification-note">Private note <span className="font-normal text-ink-600">({record.note.length}/500)</span></label>
      <p id="qualification-note-help" className="mt-1 text-sm text-ink-600">Keep this short. It stays in your account and is not shared in explanations.</p>
      <textarea id="qualification-note" aria-describedby={error ? 'qualification-note-help qualification-error' : 'qualification-note-help'} value={record.note} maxLength={500} onChange={(event) => { setRecord((current) => ({ ...current, note: event.target.value })); setError(null); setCanReload(false); }} className="mt-2 min-h-28 w-full rounded-card border border-ink-300 p-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" />
      <div className="mt-5">
        <label htmlFor="qualification-keyword" className="block text-sm font-semibold text-ink-900">Student-confirmed keywords</label>
        <div className="mt-2 flex flex-wrap gap-2">
          <input id="qualification-keyword" value={keyword} maxLength={40} onChange={(event) => setKeyword(event.target.value)} className="min-w-0 flex-1 rounded-card border border-ink-300 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" />
          <button type="button" onClick={addKeyword} className="min-h-touch rounded-card border border-ink-300 px-4 text-sm font-semibold text-ink-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Add keyword</button>
        </div>
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Added keywords">
          {record.keywords.map((item) => <li key={item} className="flex min-h-touch items-center gap-2 rounded-full bg-ink-100 px-3 text-sm break-words"><span>{item}</span><button type="button" aria-label={`Remove keyword ${item}`} onClick={() => { setRecord((current) => ({ ...current, keywords: current.keywords.filter((keywordItem) => keywordItem !== item) })); setError(null); setCanReload(false); }} className="min-h-touch px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Remove</button></li>)}
        </ul>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={() => void save()} className="min-h-touch rounded-card border border-brand-600 bg-brand-600 px-4 text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Save qualifications</button>
        {onClose ? <button type="button" onClick={onClose} className="min-h-touch rounded-card border border-ink-300 px-4 text-sm font-semibold text-ink-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Close qualifications</button> : null}
        <button type="button" onClick={() => setShowClearConfirmation(true)} className="min-h-touch rounded-card border border-danger-300 px-4 text-sm font-semibold text-danger-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Clear saved qualifications</button>
        {canReload ? <button type="button" onClick={() => void load()} className="min-h-touch rounded-card border border-ink-300 px-4 text-sm font-semibold text-ink-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Reload saved qualifications</button> : null}
      </div>
      {showClearConfirmation ? <div role="dialog" aria-modal="true" aria-labelledby="clear-qualification-heading" className="mt-5 rounded-card border border-danger-300 bg-danger-50 p-4">
        <h3 id="clear-qualification-heading" className="font-semibold text-ink-900">Clear saved qualifications</h3>
        <p className="mt-2 text-sm leading-6 text-ink-700">This removes the structured choices, note, and keywords saved in your account.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={() => setShowClearConfirmation(false)} className="min-h-touch rounded-card border border-ink-300 px-4 text-sm font-semibold text-ink-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Keep qualifications</button>
          <button type="button" onClick={() => void confirmClear()} className="min-h-touch rounded-card border border-danger-600 bg-danger-600 px-4 text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Clear qualifications</button>
        </div>
      </div> : null}
      </> : null}
    </section>
  );
}

function hasSavedQualification(record: QualificationRecord | null | undefined): boolean {
  return Boolean(record && (record.structured.length > 0 || record.note || record.keywords.length > 0));
}
