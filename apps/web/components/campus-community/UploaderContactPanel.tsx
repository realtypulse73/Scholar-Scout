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

  if (!inboxEnabled) {
    return <p className="mt-2 text-sm leading-6 text-ink-600">This uploader has not enabled private inbox requests. You can still leave a public note below.</p>;
  }

  async function requestInbox() {
    setStatus('');
    const response = await fetch('/api/peer-connections', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploader_username: username, program_id: programId, body }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setStatus(data.error ?? 'Unable to send inbox request.');
      return;
    }
    setBody('');
    setStatus('Inbox request sent. The uploader decides whether to continue the conversation.');
  }

  return (
    <div className="mt-3">
      <p className="text-sm leading-6 text-ink-600">This uploader accepts private inbox requests from prospective students.</p>
      <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={500} rows={4} placeholder="What would you like to know about the program or campus?" className="mt-3 w-full rounded-card border border-ink-300 p-3 text-sm text-ink-900" />
      <p className="mt-2 text-xs leading-5 text-ink-500">Do not include phone numbers, email addresses, social handles, or sensitive personal details in your first request.</p>
      <Button className="mt-3 w-full" onClick={() => void requestInbox()} disabled={!body.trim()}>Request inbox conversation</Button>
      {status ? <p className="mt-3 text-sm font-semibold leading-6 text-brand-700" role="status">{status}</p> : null}
    </div>
  );
}
