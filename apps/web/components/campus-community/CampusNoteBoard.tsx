'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Button from '@/components/ui/Button';
import type { PublicCampusNote } from '@/lib/campus-community';

interface CampusNoteBoardProps {
  schoolSlug: string;
  uploaderUsername?: string;
  programId?: string;
}

const SHARED_LIMIT_HELPER = 'Notes and inbox requests share a limit of five submissions per hour.';
const CONTACT_HELPER = 'Do not include phone numbers, email addresses, social handles, or sensitive personal information.';

export default function CampusNoteBoard({ schoolSlug, uploaderUsername, programId }: CampusNoteBoardProps) {
  const { data: session } = useSession();
  const [notes, setNotes] = useState<PublicCampusNote[]>([]);
  const [body, setBody] = useState('');
  const [status, setStatus] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [reportingNote, setReportingNote] = useState<PublicCampusNote | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const reportButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const search = new URLSearchParams({ school: schoolSlug });
    if (uploaderUsername) search.set('uploader', uploaderUsername);
    void fetch(`/api/campus-notes?${search.toString()}`)
      .then((response) => response.ok ? response.json() as Promise<{ notes: PublicCampusNote[] }> : { notes: [] })
      .then((data) => setNotes(data.notes))
      .catch(() => setStatus('We couldn’t load public notes. Refresh the page to try again.'));
  }, [schoolSlug, uploaderUsername]);

  async function postNote() {
    setStatus('');
    setIsPosting(true);
    try {
      const response = await fetch('/api/campus-notes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ school_slug: schoolSlug, uploader_username: uploaderUsername ?? null, program_id: programId ?? null, body }),
      });
      const data = (await response.json()) as { note?: PublicCampusNote; error?: string };
      if (!response.ok) {
        setStatus(data.error ?? 'We couldn’t send your message. Check your connection and try again.');
        return;
      }
      const createdNote = data.note;
      if (createdNote) setNotes((current) => [createdNote, ...current]);
      setBody('');
      setStatus('Your note is live on this school locker.');
    } catch {
      setStatus('We couldn’t send your message. Check your connection and try again.');
    } finally {
      setIsPosting(false);
    }
  }

  async function confirmReport() {
    if (!reportingNote) return;
    setIsReporting(true);
    setStatus('');
    try {
      const response = await fetch(`/api/campus-notes/${reportingNote.id}/report`, { method: 'POST' });
      const data = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        setStatus(data.error ?? 'We couldn’t report this note. Please try again.');
        setReportingNote(null);
        requestAnimationFrame(() => reportButtonRef.current?.focus());
        return;
      }
      setNotes((current) => current.filter((note) => note.id !== reportingNote.id));
      setReportingNote(null);
      setStatus(data.message ?? 'Thanks for reporting this note. It is hidden from the community while staff review it.');
    } catch {
      setStatus('We couldn’t report this note. Please try again.');
      setReportingNote(null);
      requestAnimationFrame(() => reportButtonRef.current?.focus());
    } finally {
      setIsReporting(false);
    }
  }

  return (
    <section className="rounded-card border border-ink-200 bg-white p-5 shadow-card" aria-busy={isPosting || isReporting}>
      <p className="text-sm font-semibold uppercase text-brand-700">Campus note board</p>
      <h2 className="mt-2 text-xl font-semibold text-ink-900">{uploaderUsername ? 'Leave a note for this uploader' : 'Ask the student community'}</h2>
      <p className="mt-2 text-sm leading-6 text-ink-600">{uploaderUsername ? 'Leave a public note or question for this student uploader.' : 'Leave a public question or note for the students posting from this school.'}</p>
      {session ? (
        <div className="mt-4" aria-busy={isPosting}>
          <label className="block text-sm font-semibold text-ink-800" htmlFor="campus-note">Your public note</label>
          <textarea id="campus-note" value={body} onChange={(event) => setBody(event.target.value)} maxLength={500} rows={4} placeholder="What do you want to know about the campus or program?" className="mt-2 w-full break-words rounded-card border border-ink-300 p-3 text-sm text-ink-900" aria-describedby="campus-note-guidance" />
          <div id="campus-note-guidance" className="mt-2 space-y-1 text-sm leading-5 text-ink-600">
            <p>{SHARED_LIMIT_HELPER}</p>
            <p>{CONTACT_HELPER}</p>
          </div>
          <Button className="mt-3" onClick={() => void postNote()} disabled={!body.trim() || isPosting}>{isPosting ? 'Posting note...' : 'Post note'}</Button>
        </div>
      ) : (
        <Link href="/auth/sign-in" className="mt-4 inline-flex min-h-touch items-center justify-center rounded-card border border-brand-600 bg-brand-600 px-4 text-sm font-semibold text-white">Sign in to leave a note</Link>
      )}
      {status ? <p className="mt-3 text-sm font-semibold text-brand-700" role="status">{status}</p> : null}
      <div className="mt-5 space-y-3" aria-live="polite">
        {notes.length ? notes.map((note) => (
          <article key={note.id} className="rounded-card border border-ink-200 bg-ink-50 p-3">
            <p className="break-words text-sm leading-6 text-ink-800">{note.body}</p>
            <p className="mt-2 text-sm font-semibold text-ink-500">ScholarScout community member · {new Date(note.created_at).toLocaleDateString()}</p>
            <button ref={reportButtonRef} type="button" className="mt-2 min-h-touch rounded-card px-0 text-sm font-semibold text-ink-600 transition-colors hover:bg-ink-100 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2" onClick={() => setReportingNote(note)}>Report this note</button>
          </article>
        )) : <div className="rounded-card bg-ink-50 p-4"><h3 className="text-xl font-semibold text-ink-900">Start the conversation</h3><p className="mt-2 text-sm leading-6 text-ink-600">Be the first to ask a question or share a helpful campus perspective. Keep personal contact details out of public notes.</p></div>}
      </div>
      {reportingNote ? (
        <div role="dialog" aria-modal="true" aria-labelledby="report-note-title" className="mt-4 rounded-card border border-ink-300 bg-white p-4 shadow-panel">
          <h3 id="report-note-title" className="text-xl font-semibold text-ink-900">Report this note</h3>
          <p className="mt-2 text-sm leading-6 text-ink-600">This will hide the note from the community while staff review it.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setReportingNote(null)} disabled={isReporting}>Cancel</Button>
            <Button onClick={() => void confirmReport()} disabled={isReporting}>{isReporting ? 'Reporting note...' : 'Confirm report'}</Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
