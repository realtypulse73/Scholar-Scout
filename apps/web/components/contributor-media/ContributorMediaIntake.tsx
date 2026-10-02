'use client';

import { useState, type FormEvent } from 'react';
import {
  CONTRIBUTOR_POSTER_MAX_BYTES,
  CONTRIBUTOR_VIDEO_MAX_BYTES,
  type ContributorPrivateStatus,
} from '@/lib/contributor-media';

interface ContributorMediaIntakeProps {
  programmes: { id: string; name: string }[];
  initialStatus: ContributorPrivateStatus;
}

export default function ContributorMediaIntake({ programmes, initialStatus }: ContributorMediaIntakeProps) {
  const [programmeId, setProgrammeId] = useState('');
  const [video, setVideo] = useState<File | null>(null);
  const [poster, setPoster] = useState<File | null>(null);
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState('Choose one MP4 video and one JPEG or PNG poster. Server inspection decides review readiness.');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateFiles(programmeId, video, poster);
    if (error || !video || !poster) {
      setMessage(error ?? 'Action needed: choose a programme, one video, and one poster.');
      return;
    }
    setSubmitting(true);
    setMessage('Preparing your private upload.');
    try {
      const uploadResponse = await fetch('/api/contributor-media/upload', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          programmeId, expectedRevision: status.revision,
          files: [
            { kind: 'video', contentType: video.type, size: video.size },
            { kind: 'poster', contentType: poster.type, size: poster.size },
          ],
        }),
      });
      const uploadBody = await uploadResponse.json() as { capability?: { uploadId: string; revision: number }; error?: string };
      if (!uploadResponse.ok || !uploadBody.capability) throw new Error(uploadBody.error ?? 'We could not prepare your private upload.');
      setMessage('Your upload is in progress. Keep this page open until it completes.');
      const completionResponse = await fetch('/api/contributor-media/complete', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ uploadId: uploadBody.capability.uploadId, expectedRevision: uploadBody.capability.revision }),
      });
      const completionBody = await completionResponse.json() as { submission?: ContributorPrivateStatus; error?: string };
      if (!completionResponse.ok || !completionBody.submission) throw new Error(completionBody.error ?? 'We could not check your private package.');
      setStatus(completionBody.submission);
      setMessage(completionBody.submission.status === 'Ready for review'
        ? 'Ready for review. Your private package has been received.'
        : 'Action needed: check your files and try again. Server inspection could not confirm the package.');
    } catch (error) {
      setMessage(error instanceof Error ? `Action needed: ${error.message}` : 'Action needed: try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return <form className="mt-6 space-y-5" onSubmit={submit}>
    <p className="rounded-xl border border-border bg-ink-50 p-4 text-sm text-ink-700" aria-live="polite">Current private status: <strong>{status.status}</strong>. {message}</p>
    <label className="block text-sm font-semibold" htmlFor="contributor-programme">Programme
      <select id="contributor-programme" className="mt-2 w-full rounded-lg border border-border p-3 focus:outline-none focus:ring-2 focus:ring-brand-600" value={programmeId} onChange={(event) => setProgrammeId(event.target.value)} required>
        <option value="">Choose a current programme</option>
        {programmes.map((programme) => <option key={programme.id} value={programme.id}>{programme.name}</option>)}
      </select>
    </label>
    <label className="block text-sm font-semibold" htmlFor="contributor-video">Original MP4 video (up to 25 MiB)
      <input id="contributor-video" className="mt-2 block w-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-600" type="file" accept="video/mp4" onChange={(event) => setVideo(event.target.files?.[0] ?? null)} required />
    </label>
    <label className="block text-sm font-semibold" htmlFor="contributor-poster">JPEG or PNG poster (up to 5 MiB)
      <input id="contributor-poster" className="mt-2 block w-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-600" type="file" accept="image/jpeg,image/png" onChange={(event) => setPoster(event.target.files?.[0] ?? null)} required />
    </label>
    <button className="min-h-11 rounded-lg bg-brand-700 px-5 py-3 font-semibold text-white focus:outline-none focus:ring-2 focus:ring-brand-600 disabled:opacity-60" disabled={submitting} type="submit">{submitting ? 'Checking private package…' : 'Prepare private upload'}</button>
  </form>;
}

function validateFiles(programmeId: string, video: File | null, poster: File | null): string | null {
  if (!programmeId || !video || !poster) return 'Action needed: choose a programme, one video, and one poster.';
  if (video.type !== 'video/mp4' || video.size > CONTRIBUTOR_VIDEO_MAX_BYTES) return 'Action needed: use one MP4 video up to 25 MiB.';
  if (!['image/jpeg', 'image/png'].includes(poster.type) || poster.size > CONTRIBUTOR_POSTER_MAX_BYTES) return 'Action needed: use one JPEG or PNG poster up to 5 MiB.';
  return null;
}
