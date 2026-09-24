'use client';

import { useEffect, useState } from 'react';
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

export default function QualificationRecordForm() {
  const [record, setRecord] = useState<QualificationRecord>(EMPTY_QUALIFICATION_RECORD);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('Loading your private qualifications.');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/account/qualifications');
        if (!response.ok) throw new Error('load-failed');
        const body = (await response.json()) as { record?: QualificationRecord | null };
        setRecord(body.record ?? EMPTY_QUALIFICATION_RECORD);
        setStatus(body.record ? 'Private qualifications loaded.' : 'No qualifications saved yet.');
      } catch {
        setError('We could not load your qualifications. Please try again.');
        setStatus('Qualifications are unavailable.');
      }
    }
    void load();
  }, []);

  function toggleStructured(kind: QualificationKind) {
    setRecord((current) => ({
      ...current,
      structured: current.structured.includes(kind)
        ? current.structured.filter((item) => item !== kind)
        : [...current.structured, kind],
    }));
    setError(null);
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
  }

  async function save(nextRecord = record) {
    setError(null);
    setStatus('Saving qualifications.');
    try {
      const response = await fetch('/api/account/qualifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextRecord),
      });
      if (response.status === 409) {
        setError('Your account changed elsewhere. Reload before saving; your draft is still here.');
        setStatus('Save needs your review.');
        return;
      }
      if (!response.ok) throw new Error('save-failed');
      setRecord(nextRecord);
      setStatus('Qualifications saved.');
    } catch {
      setError('We could not save your qualifications. Please try again.');
      setStatus('Qualifications were not saved.');
    }
  }

  return (
    <section aria-labelledby="qualification-heading" className="min-w-0 rounded-card border border-ink-200 bg-white p-5">
      <h2 id="qualification-heading" className="text-xl font-semibold text-ink-900">Your qualifications</h2>
      <p className="mt-2 text-sm leading-6 text-ink-600">Private to your account. These details highlight published requirements to verify; they do not decide eligibility.</p>
      <p role="status" aria-live="polite" className="mt-3 text-sm text-ink-700">{status}</p>
      {error ? <p role="alert" className="mt-3 text-sm font-semibold text-danger-700">{error}</p> : null}
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
      <textarea id="qualification-note" aria-describedby="qualification-note-help" value={record.note} maxLength={500} onChange={(event) => setRecord((current) => ({ ...current, note: event.target.value }))} className="mt-2 min-h-28 w-full rounded-card border border-ink-300 p-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" />
      <div className="mt-5">
        <label htmlFor="qualification-keyword" className="block text-sm font-semibold text-ink-900">Student-confirmed keywords</label>
        <div className="mt-2 flex flex-wrap gap-2">
          <input id="qualification-keyword" value={keyword} maxLength={40} onChange={(event) => setKeyword(event.target.value)} className="min-w-0 flex-1 rounded-card border border-ink-300 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" />
          <button type="button" onClick={addKeyword} className="min-h-touch rounded-card border border-ink-300 px-4 text-sm font-semibold text-ink-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Add keyword</button>
        </div>
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Added keywords">
          {record.keywords.map((item) => <li key={item} className="flex min-h-touch items-center gap-2 rounded-full bg-ink-100 px-3 text-sm break-words"><span>{item}</span><button type="button" aria-label={`Remove keyword ${item}`} onClick={() => setRecord((current) => ({ ...current, keywords: current.keywords.filter((keywordItem) => keywordItem !== item) }))}>Remove</button></li>)}
        </ul>
      </div>
      <button type="button" onClick={() => void save()} className="mt-6 min-h-touch rounded-card border border-brand-600 bg-brand-600 px-4 text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Save qualifications</button>
    </section>
  );
}
