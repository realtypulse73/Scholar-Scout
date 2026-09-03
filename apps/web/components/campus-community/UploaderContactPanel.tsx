'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

interface UploaderContactPanelProps {
  username: string;
  programId: string;
  inboxEnabled: boolean;
}

export default function UploaderContactPanel({ username, programId, inboxEnabled }: UploaderContactPanelProps) {
  const [body, setBody] = useState('');
  const [status, setStatus] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!inboxEnabled) {
    return <p className="mt-2 text-sm leading-6 text-ink-600">This uploader has not enabled private inbox requests. You can still leave a public note below.</p>;
  }

  async function requestInbox() {
    setStatus('');
    setIsSending(true);
    try {
      const response = await fetch('/api/peer-connections', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploader_username: username, program_id: programId, body }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setStatus(data.error ?? 'We couldn’t send your message. Check your connection and try again.');
        return;
      }
      setBody('');
      setStatus('Inbox request sent. The uploader decides whether to continue the conversation.');
    } catch {
      setStatus('We couldn’t send your message. Check your connection and try again.');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="mt-3" aria-busy={isSending}>
      <p className="text-sm leading-6 text-ink-600">This uploader accepts private inbox requests from prospective students.</p>
      <label className="mt-3 block text-sm font-semibold text-ink-800" htmlFor={`inbox-${username}`}>Your inbox request</label>
      <textarea id={`inbox-${username}`} value={body} onChange={(event) => setBody(event.target.value)} maxLength={500} rows={4} placeholder="What would you like to know about the program or campus?" className="mt-2 w-full break-words rounded-card border border-ink-300 p-3 text-sm text-ink-900" aria-describedby={`inbox-guidance-${username}`} />
      <div id={`inbox-guidance-${username}`} className="mt-2 space-y-1 text-sm leading-5 text-ink-600"><p>Notes and inbox requests share a limit of five submissions per hour.</p><p>Do not include phone numbers, email addresses, social handles, or sensitive personal information.</p></div>
      <Button className="mt-3 w-full" onClick={() => void requestInbox()} disabled={!body.trim() || isSending}>{isSending ? 'Sending request...' : 'Send inbox request'}</Button>
      {status ? <p className="mt-3 text-sm font-semibold leading-6 text-brand-700" role="status">{status}</p> : null}
    </div>
  );
}
