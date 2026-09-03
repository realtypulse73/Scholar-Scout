'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export interface CommunityModerationRecord {
  noteId: string;
  schoolSlug: string;
  uploaderUsername: string | null;
  programId: string | null;
  excerpt: string;
  reportedAt: string;
}

interface CommunityModerationQueueProps {
  initialRecords: CommunityModerationRecord[];
}

type ResolutionAction = 'restore' | 'remove';

const ACTION_COPY: Record<ResolutionAction, {
  action: string;
  confirm: string;
  busy: string;
  success: string;
}> = {
  restore: {
    action: 'Restore to community',
    confirm: 'Restore to community: This makes the note visible to the community again. Restore note?',
    busy: 'Restoring note...',
    success: 'Note restored to the community.',
  },
  remove: {
    action: 'Remove permanently',
    confirm: 'Remove permanently: This removes the note from the community and cannot be undone. Remove note?',
    busy: 'Removing note...',
    success: 'Note removed from the community.',
  },
};

export default function CommunityModerationQueue({
  initialRecords,
}: CommunityModerationQueueProps) {
  const [records, setRecords] = useState(initialRecords);
  const [pendingAction, setPendingAction] = useState<{
    record: CommunityModerationRecord;
    action: ResolutionAction;
    trigger: HTMLButtonElement;
  } | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const closeConfirmation = useCallback(() => {
    const trigger = pendingAction?.trigger;
    setPendingAction(null);
    requestAnimationFrame(() => trigger?.focus());
  }, [pendingAction]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && pendingAction) {
        closeConfirmation();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeConfirmation, pendingAction]);

  function openConfirmation(
    record: CommunityModerationRecord,
    action: ResolutionAction,
    trigger: HTMLButtonElement,
  ) {
    setPendingAction({ record, action, trigger });
  }

  async function resolvePendingNote() {
    if (!pendingAction) return;

    const { action, record } = pendingAction;
    setResolvingId(record.noteId);
    setStatus(ACTION_COPY[action].busy);

    try {
      const response = await fetch('/api/admin/community-moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: record.noteId, action }),
      });
      const body = (await response.json()) as { error?: string; ok?: boolean };

      if (!response.ok || !body.ok) {
        setStatus(body.error ?? 'We couldn’t resolve this note. Refresh the queue and try again.');
        return;
      }

      setRecords((current) => current.filter((candidate) => candidate.noteId !== record.noteId));
      setPendingAction(null);
      setStatus(ACTION_COPY[action].success);
      requestAnimationFrame(() => headingRef.current?.focus());
    } catch {
      setStatus('We couldn’t resolve this note. Refresh the queue and try again.');
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <section aria-labelledby="community-moderation-heading">
      <p className="text-sm font-semibold text-brand-700">Authorized staff workspace</p>
      <h1 ref={headingRef} id="community-moderation-heading" tabIndex={-1} className="mt-2 text-3xl font-semibold text-ink-900">
        Community moderation
      </h1>
      <p className="mt-2 text-base leading-6 text-ink-600">
        Review reported community notes while keeping reporter, author, and contact details private.
      </p>

      {status ? (
        <p className="mt-4 text-sm font-semibold text-ink-700" role="status">
          {status}
        </p>
      ) : null}

      <div className="mt-6 space-y-4" aria-busy={resolvingId ? 'true' : undefined}>
        {records.length === 0 ? (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-ink-900">No notes need review</h2>
            <p className="mt-2 text-base leading-6 text-ink-600">
              Reported notes will appear here for a restore or removal decision.
            </p>
          </Card>
        ) : records.map((record) => {
          const isResolving = resolvingId === record.noteId;
          return (
            <Card key={record.noteId} className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold text-ink-900">Reported community note</h2>
                  <p className="mt-2 break-words text-base leading-6 text-ink-700">
                    {record.excerpt}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-ink-600">
                    School: {record.schoolSlug} · Reported {formatReportedAt(record.reportedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:min-w-52">
                  <Button
                    variant="secondary"
                    disabled={isResolving}
                    onClick={(event) => openConfirmation(record, 'restore', event.currentTarget)}
                  >
                    Restore to community
                  </Button>
                  <Button
                    variant="danger"
                    disabled={isResolving}
                    onClick={(event) => openConfirmation(record, 'remove', event.currentTarget)}
                  >
                    Remove permanently
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {pendingAction ? (
        <div
          aria-labelledby="community-moderation-confirmation"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-5"
          onKeyDown={trapDialogFocus}
          role="dialog"
        >
          <Card className={`w-full max-w-lg p-6 ${pendingAction.action === 'remove' ? 'border-danger-600 bg-danger-50' : ''}`}>
            <h2 id="community-moderation-confirmation" className="text-xl font-semibold text-ink-900">
              {ACTION_COPY[pendingAction.action].action}
            </h2>
            <p className="mt-3 text-base leading-6 text-ink-700">
              {ACTION_COPY[pendingAction.action].confirm}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button autoFocus variant="secondary" onClick={closeConfirmation}>
                Cancel
              </Button>
              <Button
                variant={pendingAction.action === 'remove' ? 'danger' : 'primary'}
                onClick={() => void resolvePendingNote()}
              >
                {pendingAction.action === 'restore' ? 'Restore note' : 'Remove note'}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </section>
  );
}

function formatReportedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'recently' : date.toLocaleDateString();
}

function trapDialogFocus(event: React.KeyboardEvent<HTMLDivElement>) {
  if (event.key !== 'Tab') return;

  const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
    'button:not([disabled])',
  ));
  const first = controls[0];
  const last = controls.at(-1);
  if (!first || !last) return;

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
