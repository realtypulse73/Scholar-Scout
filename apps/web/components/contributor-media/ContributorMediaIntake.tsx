'use client';

import { useState, type FormEvent } from 'react';
import { uploadPresigned } from '@vercel/blob/client';
import {
  CONTRIBUTOR_POSTER_MAX_BYTES,
  CONTRIBUTOR_VIDEO_MAX_BYTES,
  type ContributorAttestation,
  type ContributorPrivateStatus,
} from '@/lib/contributor-media';

interface ContributorMediaIntakeProps {
  programmes: { id: string; name: string }[];
  initialStatus: ContributorPrivateStatus | null;
}

export default function ContributorMediaIntake({ programmes, initialStatus }: ContributorMediaIntakeProps) {
  const [status, setStatus] = useState(initialStatus);

  if (!status) {
    return <ContributorAttestationForm onSubmission={setStatus} />;
  }

  return <ContributorMediaUploader programmes={programmes} initialStatus={status} />;
}

function ContributorAttestationForm({ onSubmission }: { onSubmission: (submission: ContributorPrivateStatus) => void }) {
  const [signerName, setSignerName] = useState('');
  const [adultAffirmed, setAdultAffirmed] = useState(false);
  const [creatorAuthority, setCreatorAuthority] = useState(false);
  const [recognisablePeopleConsent, setRecognisablePeopleConsent] = useState(false);
  const [message, setMessage] = useState('Complete the adult attestation before preparing your private upload.');
  const [submitting, setSubmitting] = useState(false);

  async function submitAttestation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedSignerName = signerName.trim();
    if (!adultAffirmed || !normalizedSignerName || !creatorAuthority || !recognisablePeopleConsent) {
      setMessage('Action needed: complete every attestation field before continuing.');
      return;
    }
    const attestation: ContributorAttestation = {
      adultAffirmed: true,
      signerName: normalizedSignerName,
      creatorAuthority: true,
      recognisablePeopleConsent: true,
    };

    setSubmitting(true);
    setMessage('Creating your private contributor draft.');
    try {
      const response = await fetch('/api/contributor-media/attestation', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(attestation),
      });
      const body = await response.json() as { submission?: ContributorPrivateStatus; error?: string };
      if (!response.ok || !body.submission) throw new Error(body.error ?? 'We could not create your private contributor draft.');
      onSubmission(body.submission);
    } catch (error) {
      setMessage(error instanceof Error ? `Action needed: ${error.message}` : 'Action needed: try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return <form className="mt-6 space-y-5" onSubmit={submitAttestation}>
    <p className="rounded-xl border border-border bg-ink-50 p-4 text-sm text-ink-700" aria-live="polite">{message}</p>
    <label className="block text-sm font-semibold" htmlFor="contributor-signer-name">Signer name
      <input
        id="contributor-signer-name"
        className="mt-2 w-full rounded-lg border border-border p-3 focus:outline-none focus:ring-2 focus:ring-brand-600"
        value={signerName}
        onChange={(event) => setSignerName(event.target.value)}
        required
      />
    </label>
    <label className="flex items-start gap-3 text-sm text-ink-700" htmlFor="contributor-adult-affirmed">
      <input className="mt-1 h-4 w-4 shrink-0" id="contributor-adult-affirmed" checked={adultAffirmed} onChange={(event) => setAdultAffirmed(event.target.checked)} required type="checkbox" />
      <span className="min-w-0 leading-6">I am 18 or older.</span>
    </label>
    <label className="flex items-start gap-3 text-sm text-ink-700" htmlFor="contributor-creator-authority">
      <input className="mt-1 h-4 w-4 shrink-0" id="contributor-creator-authority" checked={creatorAuthority} onChange={(event) => setCreatorAuthority(event.target.checked)} required type="checkbox" />
      <span className="min-w-0 leading-6">I created this material or have the authority to submit it.</span>
    </label>
    <label className="flex items-start gap-3 text-sm text-ink-700" htmlFor="contributor-recognisable-people-consent">
      <input className="mt-1 h-4 w-4 shrink-0" id="contributor-recognisable-people-consent" checked={recognisablePeopleConsent} onChange={(event) => setRecognisablePeopleConsent(event.target.checked)} required type="checkbox" />
      <span className="min-w-0 leading-6">I have consent from every recognisable person in this material.</span>
    </label>
    <button className="min-h-11 rounded-lg bg-brand-700 px-5 py-3 font-semibold text-white focus:outline-none focus:ring-2 focus:ring-brand-600 disabled:opacity-60" disabled={submitting} type="submit">{submitting ? 'Creating private draft…' : 'Continue to private upload'}</button>
  </form>;
}

function ContributorMediaUploader({
  programmes,
  initialStatus,
}: {
  programmes: { id: string; name: string }[];
  initialStatus: ContributorPrivateStatus;
}) {
  const [programmeId, setProgrammeId] = useState('');
  const [video, setVideo] = useState<File | null>(null);
  const [poster, setPoster] = useState<File | null>(null);
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState('Choose one MP4 video and one JPEG or PNG poster. Server inspection decides review readiness.');
  const [submitting, setSubmitting] = useState(false);

  async function removeSubmission() {
    setSubmitting(true);
    setMessage('Removing your private submission.');
    try {
      const response = await fetch('/api/contributor-media/remove', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ expectedRevision: status.revision }),
      });
      const body = await response.json() as { submission?: ContributorPrivateStatus; error?: string };
      if (!response.ok || !body.submission) throw new Error(body.error ?? 'We could not remove your submission.');
      setStatus(body.submission);
      setMessage('Removed. A new invitation, submission, and review are required for future content.');
    } catch (error) {
      setMessage(error instanceof Error ? `Action needed: ${error.message}` : 'Action needed: try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function reinspectSubmission() {
    setSubmitting(true);
    setMessage('Rechecking your existing private package. No files will be uploaded.');
    try {
      const response = await fetch('/api/contributor-media/reinspect', { method: 'POST' });
      const body = await response.json() as { submission?: ContributorPrivateStatus; error?: string };
      if (!response.ok || !body.submission) throw new Error(body.error ?? 'We could not recheck your private package.');
      setStatus(body.submission);
      setMessage(body.submission.status === 'Ready for review'
        ? 'Ready for review. Your existing private package passed server inspection.'
        : 'Action needed: server inspection could not confirm the existing package. No files were uploaded.');
    } catch (error) {
      setMessage(error instanceof Error ? `Action needed: ${error.message}` : 'Action needed: try again.');
    } finally {
      setSubmitting(false);
    }
  }

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
      const payloadBase = {
        uploadId: uploadBody.capability.uploadId,
        expectedRevision: uploadBody.capability.revision,
      };
      await uploadPresigned(`contributor-media/${uploadBody.capability.uploadId}/video.mp4`, video, {
        access: 'private', handleUploadUrl: '/api/contributor-media/upload',
        clientPayload: JSON.stringify({ ...payloadBase, kind: 'video' }),
      });
      await uploadPresigned(`contributor-media/${uploadBody.capability.uploadId}/poster.png`, poster, {
        access: 'private', handleUploadUrl: '/api/contributor-media/upload',
        clientPayload: JSON.stringify({ ...payloadBase, kind: 'poster' }),
      });
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
    {status.status === 'Removed' ? null : <>
    <label className="block text-sm font-semibold" htmlFor="contributor-programme">Programme
      <select id="contributor-programme" className="mt-2 w-full rounded-lg border border-border p-3 focus:outline-none focus:ring-2 focus:ring-brand-600" value={programmeId} onChange={(event) => setProgrammeId(event.target.value)} required>
        <option value="">Choose a current programme</option>
        {programmes.map((programme) => <option key={programme.id} value={programme.id}>{programme.name}</option>)}
      </select>
    </label>
    <label className="block text-sm font-semibold" htmlFor="contributor-video">Original MP4 video (up to 25 MiB)
      <input
        id="contributor-video"
        aria-describedby="contributor-video-selection"
        className="mt-2 block w-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
        type="file"
        accept="video/mp4"
        onChange={(event) => setVideo(event.target.files?.[0] ?? null)}
      />
    </label>
    <p id="contributor-video-selection" className="text-sm text-ink-700" aria-live="polite">
      {video ? `Video selected: ${video.name}` : 'No video selected yet.'}
    </p>
    <label className="block text-sm font-semibold" htmlFor="contributor-poster">JPEG or PNG poster (up to 5 MiB)
      <input
        id="contributor-poster"
        aria-describedby="contributor-poster-selection"
        className="mt-2 block w-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
        type="file"
        accept="image/jpeg,image/png"
        onChange={(event) => setPoster(event.target.files?.[0] ?? null)}
      />
    </label>
    <p id="contributor-poster-selection" className="text-sm text-ink-700" aria-live="polite">
      {poster ? `Poster selected: ${poster.name}` : 'No poster selected yet.'}
    </p>
    {status.status === 'Action needed' ? <button className="min-h-11 rounded-lg border border-brand-700 px-5 py-3 font-semibold text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 disabled:opacity-60" disabled={submitting} onClick={reinspectSubmission} type="button">{submitting ? 'Rechecking private package…' : 'Recheck existing private package'}</button> : null}
    <button className="min-h-11 rounded-lg bg-brand-700 px-5 py-3 font-semibold text-white focus:outline-none focus:ring-2 focus:ring-brand-600 disabled:opacity-60" disabled={submitting} type="submit">{submitting ? 'Checking private package…' : 'Prepare private upload'}</button>
    <button className="min-h-11 rounded-lg border border-danger-600 px-5 py-3 font-semibold text-danger-700 focus:outline-none focus:ring-2 focus:ring-brand-600 disabled:opacity-60" disabled={submitting} onClick={removeSubmission} type="button">{submitting ? 'Removing submission…' : 'Remove my submission'}</button>
    </>}
  </form>;
}

function validateFiles(programmeId: string, video: File | null, poster: File | null): string | null {
  if (!programmeId || !video || !poster) return 'Action needed: choose a programme, one video, and one poster.';
  if (video.type !== 'video/mp4' || video.size > CONTRIBUTOR_VIDEO_MAX_BYTES) return 'Action needed: use one MP4 video up to 25 MiB.';
  if (!['image/jpeg', 'image/png'].includes(poster.type) || poster.size > CONTRIBUTOR_POSTER_MAX_BYTES) return 'Action needed: use one JPEG or PNG poster up to 5 MiB.';
  return null;
}
