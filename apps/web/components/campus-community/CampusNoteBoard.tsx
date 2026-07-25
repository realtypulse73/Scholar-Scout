'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Button from '@/components/ui/Button';
import type { CampusNote } from '@/lib/campus-community';

interface CampusNoteBoardProps {
  schoolSlug: string;
  uploaderUsername?: string;
  programId?: string;
}

export default function CampusNoteBoard({ schoolSlug, uploaderUsername, programId }: CampusNoteBoardProps) {
  const { data: session } = useSession();
  const [notes, setNotes] = useState<CampusNote[]>([]);
  const [body, setBody] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const search = new URLSearchParams({ school: schoolSlug });
    if (uploaderUsername) search.set('uploader', uploaderUsername);
    void fetch(`/api/campus-notes?${search.toString()}`)
      .then((response) => response.ok ? response.json() as Promise<{ notes: CampusNote[] }> : { notes: [] })
      .then((data) => setNotes(data.notes));
  }, [schoolSlug]);

  async function postNote() {
    setStatus('');
    const response = await fetch('/api/campus-notes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school_slug: schoolSlug, uploader_username: uploaderUsername ?? null, program_id: programId ?? null, body }),
    });
    const data = (await response.json()) as { note?: CampusNote; error?: string };
    if (!response.ok) {
      setStatus(data.error ?? 'Unable to post your note.');
      return;
    }
    const createdNote = data.note;
    if (createdNote) setNotes((current) => [createdNote, ...current]);
    setBody('');
    setStatus('Your note is live on this school locker.');
  }

  return (
    <section className="rounded-card border border-ink-200 bg-white p-5 shadow-card">
      <p className="text-xs font-bold uppercase text-brand-700">Campus note board</p>
      <h2 className="mt-2 text-2xl font-extrabold text-ink-900">{uploaderUsername ? 'Leave a note for this uploader' : 'Ask the student community'}</h2>
      <p className="mt-2 text-sm leading-6 text-ink-600">{uploaderUsername ? 'Leave a public note or question for this student uploader.' : 'Leave a public question or note for the students posting from this school.'} Notes are visible to the community; do not share personal contact details.</p>
      {session ? (
        <div className="mt-4">
          <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={500} rows={4} placeholder="What do you want to know about the campus or program?" className="w-full rounded-card border border-ink-300 p-3 text-sm text-ink-900" />
          <Button className="mt-3" onClick={() => void postNote()} disabled={!body.trim()}>Post note</Button>
        </div>
      ) : (
        <Link href="/auth/sign-in" className="mt-4 inline-flex min-h-10 items-center justify-center rounded-card border border-brand-600 bg-brand-600 px-4 text-sm font-semibold text-white">Sign in to leave a note</Link>
      )}
      {status ? <p className="mt-3 text-sm font-semibold text-brand-700" role="status">{status}</p> : null}
      <div className="mt-5 space-y-3">
        {notes.length ? notes.map((note) => (
          <article key={note.id} className="rounded-card border border-ink-200 bg-ink-50 p-3">
            <p className="text-sm leading-6 text-ink-800">{note.body}</p>
            <p className="mt-2 text-xs font-semibold text-ink-500">ScholarScout community member · {new Date(note.created_at).toLocaleDateString()}</p>
          </article>
        )) : <p className="rounded-card bg-ink-50 p-4 text-sm leading-6 text-ink-600">Be the first to start the conversation about this school.</p>}
      </div>
    </section>
  );
}
