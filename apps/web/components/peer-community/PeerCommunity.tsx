'use client';

import { useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import { Badge, Button } from '@/components/ui';
import type { CampusUploaderMatch } from '@/lib/peer-guides';

interface PeerCommunityProps {
  matches: CampusUploaderMatch[];
  signedIn: boolean;
}

export default function PeerCommunity({ matches, signedIn }: PeerCommunityProps) {
  const [selected, setSelected] = useState<CampusUploaderMatch | null>(null);
  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState('');
  const [isSending, setIsSending] = useState(false);

  async function requestConnection() {
    if (!selected) return;
    setIsSending(true);
    setStatus('');

    try {
      const response = await fetch('/api/peer-connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploader_username: selected.uploaderUsername,
          program_id: selected.programme.id,
          body: question,
        }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? 'Unable to send your request.');

      setStatus('Inbox request sent. The uploader can accept it if they want to continue the conversation.');
      setQuestion('');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to send your request.');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-8">
      <section
        className="overflow-hidden rounded-card border border-brand-200 bg-brand-700 p-6 text-white shadow-card sm:p-10"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(29, 78, 216, 0.94), rgba(67, 56, 202, 0.82)), url('/images/scholar-scout-transition-v1.png')",
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
          <Badge tone="success" className="bg-white/15 text-white">Campus conversations</Badge>
        <h1 className="mt-5 max-w-3xl text-[32px] font-semibold leading-tight">
          Hear what campus is really like—from the students posting about it.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-white/90">
          Explore a school locker, follow the students sharing their experience, and ask the question that matters before you apply. Uploaders choose whether to open their inbox.
        </p>
        <div className="mt-7 flex flex-wrap gap-3 text-sm font-semibold text-white/95">
          <span className="rounded-full bg-white/15 px-3 py-2">Student-uploaded perspectives</span>
          <span className="rounded-full bg-white/15 px-3 py-2">School locker notes</span>
          <span className="rounded-full bg-white/15 px-3 py-2">Opt-in inboxes</span>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <Badge tone="brand">Campus uploaders</Badge>
          <h2 className="mt-3 text-xl font-semibold text-ink-900">Ask the students creating the feed</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">
            Uploaders appear from programs aligned with the pathway and interests you selected. This is not an admissions decision—always verify program requirements directly.
          </p>

          {matches.length ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {matches.map((match) => (
                <Card key={match.uploaderUsername} className="flex flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-success-700">Student uploader</p>
                      <h3 className="mt-2 text-xl font-semibold text-ink-900">{match.uploader.displayName}</h3>
                      <p className="mt-1 text-sm font-semibold text-ink-600">{match.uploader.currentStage}</p>
                    </div>
                    <Badge tone="brand">{match.programme.name}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-ink-600">{match.uploader.bio}</p>
                  <p className="mt-3 text-xs font-semibold leading-5 text-brand-700">{match.reasons[0]}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {match.uploader.conversationTopics.map((item) => <Badge key={item}>{item}</Badge>)}
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <Link href={`/schools/${match.uploader.schoolSlug}`} className="inline-flex min-h-touch items-center justify-center rounded-card border border-ink-300 px-3 text-sm font-semibold text-ink-700">School locker</Link>
                    {match.uploader.inboxEnabled ? (
                      <Button onClick={() => setSelected(match)}>Inbox {match.uploader.displayName.split(' ')[0]}</Button>
                    ) : (
                      <Link href={`/schools/${match.uploader.schoolSlug}`} className="inline-flex min-h-touch items-center justify-center rounded-card border border-brand-600 bg-brand-600 px-3 text-sm font-semibold text-white">Leave a note</Link>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="mt-5 p-6">
              <h3 className="text-xl font-semibold text-ink-900">Set up your pathway profile to find campus uploaders</h3>
              <p className="mt-2 text-sm leading-6 text-ink-600">Tell us your interests and preferred path. We’ll show public student uploaders with compatible programmes; this is not an admissions decision.</p>
              <Link href={signedIn ? '/onboarding' : '/auth/sign-in'} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-card border border-brand-600 bg-brand-600 px-4 text-sm font-semibold text-white">{signedIn ? 'Complete onboarding' : 'Sign in to begin'}</Link>
            </Card>
          )}
        </div>

        <aside>
          <Card className="sticky top-5 p-5">
            <Badge tone="success">Uploader inbox</Badge>
            {selected ? (
              <div className="mt-4" aria-busy={isSending}>
                <h2 className="text-xl font-semibold text-ink-900">Message {selected.uploader.displayName}</h2>
                <p className="mt-2 text-sm leading-6 text-ink-600">About {selected.programme.name} at {selected.uploader.school}.</p>
                <label className="mt-5 block text-sm font-semibold text-ink-800" htmlFor="peer-question">Your question</label>
                <textarea id="peer-question" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={500} rows={5} placeholder="What would you have wanted to know before starting?" className="mt-2 w-full break-words rounded-card border border-ink-300 p-3 text-sm text-ink-900" aria-describedby="peer-question-guidance" />
                <div id="peer-question-guidance" className="mt-2 space-y-1 text-sm leading-5 text-ink-600"><p>Notes and inbox requests share a limit of five submissions per hour.</p><p>Do not include phone numbers, email addresses, social handles, or sensitive personal information.</p></div>
                <Button className="mt-5 w-full" onClick={() => void requestConnection()} disabled={!question.trim() || isSending}>{isSending ? 'Sending request...' : 'Send inbox request'}</Button>
                {status ? <p className="mt-3 text-sm font-semibold leading-6 text-brand-700" role="status">{status}</p> : null}
              </div>
            ) : (
              <div className="mt-4">
                <h2 className="text-xl font-semibold text-ink-900">A better first question</h2>
                <p className="mt-2 text-sm leading-6 text-ink-600">Pick an uploader to ask about their first term, workload, cost questions, supports, or what they would do differently.</p>
              </div>
            )}
          </Card>
        </aside>
      </section>
    </div>
  );
}
