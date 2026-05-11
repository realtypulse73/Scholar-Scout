'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge, Card } from '@/components/ui';
import {
  INTEREST_LABELS,
  SUPPORT_NEED_LABELS,
} from '@/lib/onboarding-types';
import {
  PROGRAMME_PATHWAY_LABELS,
  type Programme,
} from '@/lib/programmes';
import {
  ADMIN_PROGRAMMES_STORAGE_KEY,
  createProgrammeDraft,
  getProgrammeConflictComparisons,
  deliveryOptions,
  getProgrammeAuditActionLabel,
  getProgrammeReviewReadiness,
  getProgrammeListDiffs,
  getProgrammeListDiffSummary,
  getProgrammeRevisionLabel,
  getRecentProgrammeAuditEvents,
  interestOptions,
  mergeProgrammeConflictFields,
  mergeProgrammeGuidanceEdits,
  mergeProgrammeListDiffItems,
  mergeProgrammeDrafts,
  parseProgrammeDrafts,
  pathwayOptions,
  prepareProgrammeDraft,
  publicationStatusLabels,
  publicationStatusOptions,
  removeProgrammeDraft,
  serializeProgrammeDrafts,
  sourceCheckLabels,
  sourceCheckOptions,
  sourceConfidenceLabels,
  sourceConfidenceOptions,
  splitCsv,
  supportOptions,
  upsertProgrammeDraft,
  validateProgrammeDraft,
  type ProgrammeAuditSummary,
  type ProgrammeConflictField,
  type ProgrammeDraft,
  type ProgrammeGuidanceMergeInput,
  type ProgrammeListItemMergeSelection,
} from '@/lib/admin-programmes';

interface ProgrammeAdminManagerProps {
  baseProgrammes: Programme[];
}

interface ProgrammeConflictState {
  attemptedRecord: ProgrammeDraft;
  currentRecord: ProgrammeDraft;
  currentRevision: number;
}

interface DataStoreStatus {
  adapter: string;
  backingStore: string;
  isDurable: boolean;
  isConfigured: boolean;
  issues: string[];
  backupRetention: {
    retainedBackups: number;
    maxRetainedBackups: number;
    isWithinPolicy: boolean;
    issues: string[];
  };
  counts: {
    users: number;
    onboardingProfiles: number;
    shortlists: number;
    programmeRecords: number;
    auditEvents: number;
  };
}

interface DataImportValidation {
  isValid: boolean;
  errors: string[];
  counts?: DataStoreStatus['counts'];
}

interface DataRestoreResult {
  ok: boolean;
  backupId?: string;
  restoredAt?: string;
  counts?: DataStoreStatus['counts'];
  error?: string;
  validation?: DataImportValidation;
}

interface DataRestoreBackup {
  id: string;
  createdAt: string;
  actorUserId: string;
  actorLabel: string;
  reason: string;
  counts: DataStoreStatus['counts'];
}

interface DataRestorePlanRow {
  key: keyof DataStoreStatus['counts'];
  label: string;
  currentCount: number;
  restoredCount: number;
  delta: number;
}

interface DataRestorePlan {
  backup: DataRestoreBackup;
  rows: DataRestorePlanRow[];
}

const RESTORE_CONFIRMATION = 'RESTORE SCHOLARSCOUT DATA';

export default function ProgrammeAdminManager({
  baseProgrammes,
}: ProgrammeAdminManagerProps) {
  const [drafts, setDrafts] = useState<ProgrammeDraft[]>([]);
  const [currentDraft, setCurrentDraft] = useState<ProgrammeDraft>(
    createProgrammeDraft(),
  );
  const [auditEvents, setAuditEvents] = useState<ProgrammeAuditSummary[]>([]);
  const [dataStatus, setDataStatus] = useState<DataStoreStatus | null>(null);
  const [restoreBackups, setRestoreBackups] = useState<DataRestoreBackup[]>([]);
  const [restorePlan, setRestorePlan] = useState<DataRestorePlan | null>(null);
  const [restorePlanError, setRestorePlanError] = useState('');
  const [backupRestoreReason, setBackupRestoreReason] = useState('');
  const [backupRestoreConfirmation, setBackupRestoreConfirmation] =
    useState('');
  const [backupRestoreResult, setBackupRestoreResult] =
    useState<DataRestoreResult | null>(null);
  const [importSnapshot, setImportSnapshot] = useState('');
  const [importValidation, setImportValidation] =
    useState<DataImportValidation | null>(null);
  const [restoreReason, setRestoreReason] = useState('');
  const [restoreConfirmation, setRestoreConfirmation] = useState('');
  const [restoreResult, setRestoreResult] = useState<DataRestoreResult | null>(
    null,
  );
  const [message, setMessage] = useState('');
  const [conflict, setConflict] = useState<ProgrammeConflictState | null>(null);
  const mergedProgrammes = useMemo(
    () => mergeProgrammeDrafts(baseProgrammes, drafts),
    [baseProgrammes, drafts],
  );
  const exportJson = serializeProgrammeDrafts(drafts);
  const recentAuditEvents = getRecentProgrammeAuditEvents(auditEvents);

  useEffect(() => {
    async function loadDrafts() {
      const storedDrafts = parseProgrammeDrafts(
        window.localStorage.getItem(ADMIN_PROGRAMMES_STORAGE_KEY),
      );
      setDrafts(storedDrafts);

      const response = await fetch('/api/admin/programmes');
      if (response.ok) {
        const body = (await response.json()) as {
          records?: ProgrammeDraft[];
          auditEvents?: ProgrammeAuditSummary[];
        };
        const records = body.records ?? [];
        setDrafts(records);
        setAuditEvents(body.auditEvents ?? []);
        window.localStorage.setItem(
          ADMIN_PROGRAMMES_STORAGE_KEY,
          serializeProgrammeDrafts(records),
        );
      }
    }

    void loadDrafts();
  }, []);

  useEffect(() => {
    async function loadDataStatus() {
      const [statusResponse, backupsResponse] = await Promise.all([
        fetch('/api/admin/data/status'),
        fetch('/api/admin/data/backups'),
      ]);

      if (statusResponse.ok) {
        setDataStatus((await statusResponse.json()) as DataStoreStatus);
      }

      if (backupsResponse.ok) {
        const body = (await backupsResponse.json()) as {
          backups?: DataRestoreBackup[];
        };
        setRestoreBackups(body.backups ?? []);
      }
    }

    void loadDataStatus();
  }, []);

  function persist(nextDrafts: ProgrammeDraft[], nextMessage: string) {
    setDrafts(nextDrafts);
    window.localStorage.setItem(
      ADMIN_PROGRAMMES_STORAGE_KEY,
      serializeProgrammeDrafts(nextDrafts),
    );
    setMessage(nextMessage);
  }

  async function handleSave() {
    const errors = validateProgrammeDraft(currentDraft);

    if (errors.length > 0) {
      setMessage(errors[0]);
      return;
    }

    const prepared = prepareProgrammeDraft(currentDraft);
    const response = await fetch('/api/admin/programmes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prepared),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        errors?: string[];
        error?: string;
        currentRecord?: ProgrammeDraft;
        currentRevision?: number;
      } | null;

      if (response.status === 409 && body?.currentRecord) {
        const currentRecord = body.currentRecord;
        const nextDrafts = upsertProgrammeDraft(drafts, currentRecord);
        setConflict({
          attemptedRecord: prepared,
          currentRecord,
          currentRevision: body.currentRevision ?? currentRecord.revision ?? 0,
        });
        setDrafts(nextDrafts);
        window.localStorage.setItem(
          ADMIN_PROGRAMMES_STORAGE_KEY,
          serializeProgrammeDrafts(nextDrafts),
        );
        setMessage(
          body.error ??
            'This programme changed after you loaded it. Compare the latest record before saving again.',
        );
        return;
      }

      setMessage(
        body?.errors?.[0] ??
          body?.error ??
          'Sign in with a staff account to save governed programme records.',
      );
      return;
    }

    const body = (await response.json()) as { record?: ProgrammeDraft };
    const savedRecord = body.record ?? prepared;
    const nextDrafts = upsertProgrammeDraft(drafts, savedRecord);
    setConflict(null);
    persist(
      nextDrafts,
      `${savedRecord.name} saved as a governed programme record.`,
    );
    await refreshAuditEvents();
    setCurrentDraft(createProgrammeDraft());
  }

  function handleEdit(programme: Programme) {
    setCurrentDraft({ ...programme });
    setConflict(null);
    setMessage(`${programme.name} loaded for editing.`);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/programmes?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    persist(removeProgrammeDraft(drafts, id), 'Governed programme record removed.');
    await refreshAuditEvents();

    if (currentDraft.id === id) {
      setCurrentDraft(createProgrammeDraft());
    }

    if (conflict?.currentRecord.id === id) {
      setConflict(null);
    }
  }

  async function refreshAuditEvents() {
    const response = await fetch('/api/admin/programmes');
    if (!response.ok) {
      return;
    }

    const body = (await response.json()) as {
      records?: ProgrammeDraft[];
      auditEvents?: ProgrammeAuditSummary[];
    };

    if (body.records) {
      setDrafts(body.records);
      window.localStorage.setItem(
        ADMIN_PROGRAMMES_STORAGE_KEY,
        serializeProgrammeDrafts(body.records),
      );
    }

    setAuditEvents(body.auditEvents ?? []);
    await refreshDataStatus();
  }

  async function refreshDataStatus() {
    const response = await fetch('/api/admin/data/status');

    if (!response.ok) {
      return;
    }

    setDataStatus((await response.json()) as DataStoreStatus);
    await refreshRestoreBackups();
  }

  async function refreshRestoreBackups() {
    const response = await fetch('/api/admin/data/backups');

    if (!response.ok) {
      return;
    }

    const body = (await response.json()) as { backups?: DataRestoreBackup[] };
    setRestoreBackups(body.backups ?? []);
  }

  async function handlePlanBackupRestore(backupId: string) {
    setRestorePlan(null);
    setRestorePlanError('');
    setBackupRestoreResult(null);
    setBackupRestoreReason('');
    setBackupRestoreConfirmation('');

    const response = await fetch(
      `/api/admin/data/backups/${encodeURIComponent(backupId)}/plan`,
    );
    const body = (await response.json().catch(() => null)) as
      | { plan?: DataRestorePlan; error?: string }
      | null;

    if (!response.ok || !body?.plan) {
      setRestorePlanError(
        body?.error ?? 'Restore planning could not be completed.',
      );
      return;
    }

    setRestorePlan(body.plan);
  }

  async function handleRestoreBackup() {
    if (!restorePlan) {
      setBackupRestoreResult({
        ok: false,
        error: 'Preview a backup restore before running it.',
      });
      return;
    }

    setBackupRestoreResult(null);

    const response = await fetch(
      `/api/admin/data/backups/${encodeURIComponent(restorePlan.backup.id)}/restore`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmation: backupRestoreConfirmation,
          reason: backupRestoreReason,
        }),
      },
    );
    const body = (await response.json().catch(() => null)) as
      | DataRestoreResult
      | null;

    setBackupRestoreResult(
      body ?? {
        ok: false,
        error: 'Backup restore could not be completed.',
      },
    );

    if (response.ok && body?.ok) {
      setRestorePlan(null);
      setRestorePlanError('');
      setBackupRestoreReason('');
      setBackupRestoreConfirmation('');
      setMessage('ScholarScout backup restored with a new backup recorded.');
      await refreshAuditEvents();
    }
  }

  async function handleValidateImport() {
    setImportValidation(null);
    setRestoreResult(null);

    if (!importSnapshot.trim()) {
      setImportValidation({
        isValid: false,
        errors: ['Paste a ScholarScout data snapshot before validating.'],
      });
      return;
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(importSnapshot);
    } catch {
      setImportValidation({
        isValid: false,
        errors: ['Snapshot must be valid JSON.'],
      });
      return;
    }

    const response = await fetch('/api/admin/data/import/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed),
    });
    const body = (await response.json().catch(() => null)) as
      | DataImportValidation
      | null;

    setImportValidation(
      body ?? {
        isValid: false,
        errors: ['Snapshot validation could not be completed.'],
      },
    );
  }

  async function handleRestoreImport() {
    setRestoreResult(null);

    let parsed: unknown;

    try {
      parsed = JSON.parse(importSnapshot);
    } catch {
      setRestoreResult({
        ok: false,
        error: 'Snapshot must be valid JSON.',
      });
      return;
    }

    const response = await fetch('/api/admin/data/import/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        snapshot: parsed,
        confirmation: restoreConfirmation,
        reason: restoreReason,
      }),
    });
    const body = (await response.json().catch(() => null)) as
      | DataRestoreResult
      | null;

    setRestoreResult(
      body ?? {
        ok: false,
        error: 'Restore could not be completed.',
      },
    );

    if (response.ok && body?.ok) {
      setImportSnapshot('');
      setImportValidation(null);
      setRestoreConfirmation('');
      setRestoreReason('');
      setMessage('ScholarScout data snapshot restored with a backup recorded.');
      await refreshAuditEvents();
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge tone="brand" className="mb-3">
              Governed data
            </Badge>
            <h1 className="text-2xl font-extrabold text-ink-900">
              Programme editor
            </h1>
            <p className="mt-2 text-sm leading-6 text-ink-600">
              Staff changes save through protected account APIs, with local browser state as a fallback.
            </p>
          </div>
        </div>

        {message ? (
          <p className="mt-4 rounded-card bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-800">
            {message}
          </p>
        ) : null}

        {conflict ? (
          <ConflictRecoveryPanel
            conflict={conflict}
            onUseLatest={() => {
              setCurrentDraft(conflict.currentRecord);
              setConflict(null);
              setMessage(`${conflict.currentRecord.name} latest record loaded.`);
            }}
            onKeepEdits={() => {
              setCurrentDraft({
                ...conflict.attemptedRecord,
                revision: conflict.currentRevision,
              });
              setConflict(null);
              setMessage(
                'Your edits now use the latest revision. Review the fields, then save again.',
              );
            }}
            onMergeFields={(fields) => {
              setCurrentDraft(
                mergeProgrammeConflictFields(
                  conflict.currentRecord,
                  conflict.attemptedRecord,
                  fields,
                ),
              );
              setConflict(null);
              setMessage(
                'Selected latest fields were merged into your edits. Review the form, then save again.',
              );
            }}
            onMergeListItems={(selections) => {
              setCurrentDraft(
                mergeProgrammeListDiffItems(
                  conflict.currentRecord,
                  conflict.attemptedRecord,
                  selections,
                ),
              );
              setConflict(null);
              setMessage(
                'Selected guidance items were applied to your edits. Review the form, then save again.',
              );
            }}
            onMergeGuidanceEdits={(guidance) => {
              setCurrentDraft(
                mergeProgrammeGuidanceEdits(
                  conflict.currentRecord,
                  conflict.attemptedRecord,
                  guidance,
                ),
              );
              setConflict(null);
              setMessage(
                'Edited guidance was applied to the latest revision. Review the form, then save again.',
              );
            }}
            onDismiss={() => setConflict(null)}
          />
        ) : null}

        <form
          className="mt-5 space-y-4"
          onSubmit={(event) => {
              event.preventDefault();
            void handleSave();
          }}
        >
          <TextField
            label="Programme name"
            value={currentDraft.name}
            onChange={(name) => setCurrentDraft({ ...currentDraft, name })}
          />
          <TextField
            label="School"
            value={currentDraft.school}
            onChange={(school) => setCurrentDraft({ ...currentDraft, school })}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="City"
              value={currentDraft.city}
              onChange={(city) => setCurrentDraft({ ...currentDraft, city })}
            />
            <TextField
              label="State"
              value={currentDraft.state}
              onChange={(state) => setCurrentDraft({ ...currentDraft, state })}
            />
          </div>

          <SelectField
            label="Delivery"
            value={currentDraft.delivery}
            options={deliveryOptions}
            getLabel={(value) => value}
            onChange={(delivery) =>
              setCurrentDraft({ ...currentDraft, delivery })
            }
          />
          <SelectField
            label="Pathway"
            value={currentDraft.pathway}
            options={pathwayOptions}
            getLabel={(value) => PROGRAMME_PATHWAY_LABELS[value]}
            onChange={(pathway) => setCurrentDraft({ ...currentDraft, pathway })}
          />
          <SelectField
            label="Status"
            value={currentDraft.publicationStatus ?? 'draft'}
            options={publicationStatusOptions}
            getLabel={(value) => publicationStatusLabels[value]}
            onChange={(publicationStatus) =>
              setCurrentDraft({ ...currentDraft, publicationStatus })
            }
          />

          <div className="grid grid-cols-3 gap-3">
            <NumberField
              label="Tuition"
              value={currentDraft.annualTuition}
              onChange={(annualTuition) =>
                setCurrentDraft({ ...currentDraft, annualTuition })
              }
            />
            <NumberField
              label="Entry flexibility"
              value={currentDraft.acceptanceRate}
              onChange={(acceptanceRate) =>
                setCurrentDraft({ ...currentDraft, acceptanceRate })
              }
            />
            <NumberField
              label="Fit"
              value={currentDraft.matchScore}
              onChange={(matchScore) =>
                setCurrentDraft({ ...currentDraft, matchScore })
              }
            />
          </div>

          <TextField
            label="Credential"
            value={currentDraft.credential}
            onChange={(credential) =>
              setCurrentDraft({ ...currentDraft, credential })
            }
          />
          <TextField
            label="Duration"
            value={currentDraft.duration}
            onChange={(duration) =>
              setCurrentDraft({ ...currentDraft, duration })
            }
          />
          <TextAreaField
            label="Overview"
            value={currentDraft.overview}
            onChange={(overview) =>
              setCurrentDraft({ ...currentDraft, overview })
            }
          />
          <TextAreaField
            label="Highlights"
            hint="Comma-separated"
            value={currentDraft.highlights.join(', ')}
            onChange={(value) =>
              setCurrentDraft({ ...currentDraft, highlights: splitCsv(value) })
            }
          />
          <TextAreaField
            label="Next steps"
            hint="Comma-separated"
            value={currentDraft.nextSteps.join(', ')}
            onChange={(value) =>
              setCurrentDraft({ ...currentDraft, nextSteps: splitCsv(value) })
            }
          />
          <TextField
            label="Source name"
            value={currentDraft.sourceName ?? ''}
            onChange={(sourceName) =>
              setCurrentDraft({ ...currentDraft, sourceName })
            }
          />
          <TextField
            label="Source URL"
            value={currentDraft.sourceUrl ?? ''}
            onChange={(sourceUrl) =>
              setCurrentDraft({ ...currentDraft, sourceUrl })
            }
          />
          <SelectField
            label="Source confidence"
            value={currentDraft.sourceConfidence ?? 'unverified'}
            options={sourceConfidenceOptions}
            getLabel={(value) => sourceConfidenceLabels[value]}
            onChange={(sourceConfidence) =>
              setCurrentDraft({ ...currentDraft, sourceConfidence })
            }
          />
          <TextAreaField
            label="Source evidence"
            value={currentDraft.sourceNotes ?? ''}
            onChange={(sourceNotes) =>
              setCurrentDraft({ ...currentDraft, sourceNotes })
            }
          />
          <Checklist
            label="Source checks"
            values={sourceCheckOptions}
            selected={currentDraft.sourceChecks ?? []}
            getLabel={(value) => sourceCheckLabels[value]}
            onChange={(sourceChecks) =>
              setCurrentDraft({ ...currentDraft, sourceChecks })
            }
          />
          <TextField
            label="Verified date"
            value={currentDraft.lastVerifiedAt ?? ''}
            onChange={(lastVerifiedAt) =>
              setCurrentDraft({ ...currentDraft, lastVerifiedAt })
            }
          />
          <TextField
            label="Reviewer"
            value={currentDraft.reviewAssignee ?? ''}
            onChange={(reviewAssignee) =>
              setCurrentDraft({ ...currentDraft, reviewAssignee })
            }
          />
          <TextAreaField
            label="Review notes"
            value={currentDraft.reviewNotes ?? ''}
            onChange={(reviewNotes) =>
              setCurrentDraft({ ...currentDraft, reviewNotes })
            }
          />

          <Checklist
            label="Interest areas"
            values={interestOptions}
            selected={currentDraft.interests}
            getLabel={(value) => INTEREST_LABELS[value]}
            onChange={(interests) =>
              setCurrentDraft({ ...currentDraft, interests })
            }
          />
          <Checklist
            label="Support services"
            values={supportOptions}
            selected={currentDraft.support}
            getLabel={(value) => SUPPORT_NEED_LABELS[value]}
            onChange={(support) => setCurrentDraft({ ...currentDraft, support })}
          />

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              className="inline-flex min-h-touch flex-1 items-center justify-center rounded-card border border-brand-600 bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              Save record
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentDraft(createProgrammeDraft());
                setConflict(null);
                setMessage('');
              }}
              className="inline-flex min-h-touch flex-1 items-center justify-center rounded-card border border-ink-300 bg-white px-4 text-sm font-semibold text-ink-700 transition-colors hover:border-brand-400 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              Clear form
            </button>
          </div>
        </form>
      </Card>

      <div className="space-y-6">
        <Card className="p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-ink-900">
                Data operations
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink-600">
                Staff account data, programme records, and audit history are
                currently backed by {dataStatus?.adapter ?? 'the configured'} adapter.
              </p>
            </div>
            {dataStatus ? (
              <Badge tone={dataStatus.isDurable ? 'success' : 'warning'}>
                {dataStatus.isDurable ? 'Durable backing' : 'Local backing'}
              </Badge>
            ) : (
              <Badge tone="neutral">Checking</Badge>
            )}
          </div>
          {dataStatus ? (
            <div className="mt-4 space-y-4">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                <DataMetric label="Users" value={dataStatus.counts.users} />
                <DataMetric
                  label="Profiles"
                  value={dataStatus.counts.onboardingProfiles}
                />
                <DataMetric
                  label="Shortlists"
                  value={dataStatus.counts.shortlists}
                />
                <DataMetric
                  label="Programmes"
                  value={dataStatus.counts.programmeRecords}
                />
                <DataMetric label="Audit" value={dataStatus.counts.auditEvents} />
              </div>
              <div className="rounded-card border border-ink-200 bg-ink-50 p-3">
                <p className="text-xs font-bold uppercase text-ink-600">
                  Backing store
                </p>
                <p className="mt-1 break-words text-sm font-semibold text-ink-800">
                  {dataStatus.backingStore}
                </p>
              </div>
              {dataStatus.issues.length > 0 ? (
                <div className="rounded-card border border-warning-600 bg-warning-50 p-3">
                  <p className="text-sm font-extrabold text-ink-900">
                    Operations note
                  </p>
                  <p className="mt-1 text-sm leading-6 text-ink-700">
                    {dataStatus.issues[0]}
                  </p>
                </div>
              ) : null}
              <div
                className={`rounded-card border p-3 ${
                  dataStatus.backupRetention.isWithinPolicy
                    ? 'border-success-600 bg-success-50'
                    : 'border-warning-600 bg-warning-50'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-extrabold text-ink-900">
                      Backup retention
                    </p>
                    <p className="mt-1 text-sm leading-6 text-ink-700">
                      {dataStatus.backupRetention.retainedBackups} of{' '}
                      {dataStatus.backupRetention.maxRetainedBackups} restore
                      backups retained.
                    </p>
                  </div>
                  <Badge
                    tone={
                      dataStatus.backupRetention.isWithinPolicy
                        ? 'success'
                        : 'warning'
                    }
                  >
                    {dataStatus.backupRetention.isWithinPolicy
                      ? 'Within policy'
                      : 'Needs review'}
                  </Badge>
                </div>
                {dataStatus.backupRetention.issues.length > 0 ? (
                  <p className="mt-2 text-sm leading-6 text-ink-700">
                    {dataStatus.backupRetention.issues[0]}
                  </p>
                ) : null}
              </div>
              <a
                href="/api/admin/data/export"
                className="inline-flex min-h-10 w-full items-center justify-center rounded-card border border-ink-300 bg-white px-3 text-sm font-semibold text-ink-700 hover:border-brand-400 hover:text-brand-700 sm:w-auto"
              >
                Export data snapshot
              </a>
              <div className="rounded-card border border-ink-200 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-extrabold text-ink-900">
                      Restore backup history
                    </p>
                    <p className="mt-1 text-sm leading-6 text-ink-600">
                      Recent backups created before staff restores, shown without exposing snapshot contents.
                    </p>
                  </div>
                  <Badge tone="neutral">{restoreBackups.length} saved</Badge>
                </div>
                <div className="mt-3 space-y-3">
                  {restoreBackups.length > 0 ? (
                    restoreBackups.map((backup) => (
                      <article
                        key={backup.id}
                        className="rounded-card border border-ink-200 bg-ink-50 p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-extrabold text-ink-900">
                              {formatAuditDate(backup.createdAt)}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-ink-600">
                              {backup.actorLabel} - {backup.reason}
                            </p>
                          </div>
                          <Badge tone="warning">Backup</Badge>
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-5">
                          <DataMetric label="Users" value={backup.counts.users} />
                          <DataMetric
                            label="Profiles"
                            value={backup.counts.onboardingProfiles}
                          />
                          <DataMetric
                            label="Shortlists"
                            value={backup.counts.shortlists}
                          />
                          <DataMetric
                            label="Programmes"
                            value={backup.counts.programmeRecords}
                          />
                          <DataMetric
                            label="Audit"
                            value={backup.counts.auditEvents}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            void handlePlanBackupRestore(backup.id);
                          }}
                          className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-card border border-brand-600 bg-white px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50 sm:w-auto"
                        >
                          Preview restore impact
                        </button>
                      </article>
                    ))
                  ) : (
                    <p className="rounded-card border border-ink-200 p-3 text-sm text-ink-600">
                      Backup history will appear after the first confirmed restore.
                    </p>
                  )}
                </div>
                {restorePlan ? (
                  <div className="mt-4 rounded-card border border-brand-200 bg-brand-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-extrabold text-ink-900">
                          Restore impact preview
                        </p>
                        <p className="mt-1 text-sm leading-6 text-ink-700">
                          Restoring this backup would replace the current data counts with the saved backup counts.
                        </p>
                      </div>
                      <Badge tone="brand">Read-only plan</Badge>
                    </div>
                    <div className="mt-3 overflow-x-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead className="text-xs uppercase text-ink-600">
                          <tr>
                            <th className="py-2 pr-3 font-bold">Data</th>
                            <th className="py-2 pr-3 font-bold">Current</th>
                            <th className="py-2 pr-3 font-bold">After restore</th>
                            <th className="py-2 font-bold">Change</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-100">
                          {restorePlan.rows.map((row) => (
                            <tr key={row.key}>
                              <td className="py-2 pr-3 font-semibold text-ink-800">
                                {row.label}
                              </td>
                              <td className="py-2 pr-3 text-ink-700">
                                {row.currentCount}
                              </td>
                              <td className="py-2 pr-3 text-ink-700">
                                {row.restoredCount}
                              </td>
                              <td className="py-2 font-semibold text-ink-800">
                                {formatCountDelta(row.delta)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 rounded-card border border-warning-600 bg-warning-50 p-3">
                      <p className="text-sm font-extrabold text-ink-900">
                        Restore this backup
                      </p>
                      <p className="mt-1 text-sm leading-6 text-ink-700">
                        ScholarScout will back up the current data document before restoring this saved backup.
                      </p>
                      <TextField
                        label="Backup restore reason"
                        value={backupRestoreReason}
                        onChange={setBackupRestoreReason}
                      />
                      <label className="mt-3 block">
                        <span className="text-sm font-bold text-ink-800">
                          Type {RESTORE_CONFIRMATION}
                        </span>
                        <input
                          value={backupRestoreConfirmation}
                          onChange={(event) =>
                            setBackupRestoreConfirmation(event.target.value)
                          }
                          className="mt-2 min-h-touch w-full rounded-card border border-ink-200 bg-white px-3 text-sm text-ink-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          void handleRestoreBackup();
                        }}
                        disabled={
                          backupRestoreConfirmation !== RESTORE_CONFIRMATION
                        }
                        className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-card border border-danger-600 bg-danger-600 px-3 text-sm font-semibold text-white hover:bg-danger-700 disabled:border-ink-200 disabled:bg-white disabled:text-ink-300 sm:w-auto"
                      >
                        Restore previewed backup
                      </button>
                    </div>
                  </div>
                ) : null}
                {restorePlanError ? (
                  <p className="mt-3 rounded-card border border-warning-600 bg-warning-50 p-3 text-sm font-semibold text-ink-700">
                    {restorePlanError}
                  </p>
                ) : null}
                {backupRestoreResult ? (
                  <div
                    className={`mt-3 rounded-card border p-3 ${
                      backupRestoreResult.ok
                        ? 'border-success-600 bg-success-50'
                        : 'border-warning-600 bg-warning-50'
                    }`}
                  >
                    <p className="text-sm font-extrabold text-ink-900">
                      {backupRestoreResult.ok
                        ? 'Backup restored'
                        : 'Backup restore needs review'}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-ink-700">
                      {backupRestoreResult.ok
                        ? `Backup ${backupRestoreResult.backupId} was created before restore.`
                        : backupRestoreResult.error ??
                          'Backup restore could not be completed.'}
                    </p>
                  </div>
                ) : null}
              </div>
              <div className="rounded-card border border-ink-200 bg-white p-3">
                <label className="block">
                  <span className="text-sm font-extrabold text-ink-900">
                    Validate restore snapshot
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-ink-600">
                    Paste an exported ScholarScout JSON snapshot to check its
                    structure before any restore work.
                  </span>
                  <textarea
                    value={importSnapshot}
                    onChange={(event) => {
                      setImportSnapshot(event.target.value);
                      setImportValidation(null);
                      setRestoreResult(null);
                    }}
                    className="mt-3 min-h-32 w-full rounded-card border border-ink-200 bg-ink-50 px-3 py-2 font-mono text-xs text-ink-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    void handleValidateImport();
                  }}
                  className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-card border border-brand-600 bg-brand-600 px-3 text-sm font-semibold text-white hover:bg-brand-700 sm:w-auto"
                >
                  Validate snapshot
                </button>
                {importValidation ? (
                  <div
                    className={`mt-3 rounded-card border p-3 ${
                      importValidation.isValid
                        ? 'border-success-600 bg-success-50'
                        : 'border-warning-600 bg-warning-50'
                    }`}
                  >
                    <p className="text-sm font-extrabold text-ink-900">
                      {importValidation.isValid
                        ? 'Snapshot is ready for restore planning'
                        : 'Snapshot needs review'}
                    </p>
                    {importValidation.counts ? (
                      <p className="mt-1 text-sm leading-6 text-ink-700">
                        {importValidation.counts.users} users,{' '}
                        {importValidation.counts.programmeRecords} programmes,{' '}
                        {importValidation.counts.auditEvents} audit events.
                      </p>
                    ) : null}
                    {importValidation.errors.length > 0 ? (
                      <p className="mt-1 text-sm leading-6 text-ink-700">
                        {importValidation.errors[0]}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {importValidation?.isValid ? (
                  <div className="mt-4 rounded-card border border-warning-600 bg-warning-50 p-3">
                    <p className="text-sm font-extrabold text-ink-900">
                      Restore this snapshot
                    </p>
                    <p className="mt-1 text-sm leading-6 text-ink-700">
                      ScholarScout will back up the current data document before
                      replacing it with this validated snapshot.
                    </p>
                    <TextField
                      label="Restore reason"
                      value={restoreReason}
                      onChange={setRestoreReason}
                    />
                    <label className="mt-3 block">
                      <span className="text-sm font-bold text-ink-800">
                        Type {RESTORE_CONFIRMATION}
                      </span>
                      <input
                        value={restoreConfirmation}
                        onChange={(event) =>
                          setRestoreConfirmation(event.target.value)
                        }
                        className="mt-2 min-h-touch w-full rounded-card border border-ink-200 bg-white px-3 text-sm text-ink-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        void handleRestoreImport();
                      }}
                      disabled={restoreConfirmation !== RESTORE_CONFIRMATION}
                      className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-card border border-danger-600 bg-danger-600 px-3 text-sm font-semibold text-white hover:bg-danger-700 disabled:border-ink-200 disabled:bg-white disabled:text-ink-300 sm:w-auto"
                    >
                      Restore validated snapshot
                    </button>
                  </div>
                ) : null}
                {restoreResult ? (
                  <div
                    className={`mt-3 rounded-card border p-3 ${
                      restoreResult.ok
                        ? 'border-success-600 bg-success-50'
                        : 'border-warning-600 bg-warning-50'
                    }`}
                  >
                    <p className="text-sm font-extrabold text-ink-900">
                      {restoreResult.ok
                        ? 'Snapshot restored'
                        : 'Restore needs review'}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-ink-700">
                      {restoreResult.ok
                        ? `Backup ${restoreResult.backupId} was created before restore.`
                        : restoreResult.error ?? 'Restore could not be completed.'}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="mt-4 rounded-card border border-ink-200 p-3 text-sm text-ink-600">
              Data status appears here for signed-in staff accounts.
            </p>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-ink-900">
                Programme records
              </h2>
              <p className="mt-2 text-sm text-ink-600">
                {drafts.length} governed record{drafts.length === 1 ? '' : 's'} over{' '}
                {baseProgrammes.length} seed records.
              </p>
            </div>
            <Badge tone="brand">Staff API</Badge>
          </div>
          <div className="mt-5 space-y-3">
            {mergedProgrammes.map((programme) => {
              const isDraft = drafts.some((draft) => draft.id === programme.id);
              const readiness = getProgrammeReviewReadiness(programme);

              return (
                <article
                  key={programme.id}
                  className="rounded-card border border-ink-200 p-4"
                >
                  <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={isDraft ? 'brand' : 'neutral'}>
                          {isDraft ? 'Governed record' : 'Seed'}
                        </Badge>
                        {isDraft ? (
                          <Badge>
                            {
                              publicationStatusLabels[
                                programme.publicationStatus ?? 'published'
                              ]
                            }
                          </Badge>
                        ) : null}
                        {programme.reviewAssignee ? (
                          <Badge>{programme.reviewAssignee}</Badge>
                        ) : null}
                        {isDraft ? (
                          <Badge>{getProgrammeRevisionLabel(programme)}</Badge>
                        ) : null}
                        {isDraft ? (
                          <Badge tone={readiness.isReady ? 'success' : 'warning'}>
                            {readiness.isReady ? 'Ready to publish' : 'Needs source review'}
                          </Badge>
                        ) : null}
                        <Badge>{programme.delivery}</Badge>
                        <Badge>{PROGRAMME_PATHWAY_LABELS[programme.pathway]}</Badge>
                      </div>
                      <h3 className="mt-3 text-lg font-extrabold text-ink-900">
                        {programme.name || 'Untitled programme'}
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-ink-600">
                        {programme.school} - {programme.city}, {programme.state}
                      </p>
                      {programme.reviewNotes ? (
                        <p className="mt-2 text-sm leading-6 text-ink-600">
                          {programme.reviewNotes}
                        </p>
                      ) : null}
                      {isDraft && !readiness.isReady ? (
                        <p className="mt-2 text-sm leading-6 text-ink-600">
                          {readiness.issues[0]}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
                      <button
                        type="button"
                        onClick={() => handleEdit(programme)}
                        className="inline-flex min-h-10 items-center justify-center rounded-card border border-ink-300 bg-white px-4 text-sm font-semibold text-ink-700 hover:border-brand-400 hover:text-brand-700"
                      >
                        Edit
                      </button>
                      {isDraft ? (
                        <button
                          type="button"
                          onClick={() => {
                            void handleDelete(programme.id);
                          }}
                          className="inline-flex min-h-10 items-center justify-center rounded-card border border-ink-300 bg-white px-4 text-sm font-semibold text-ink-700 hover:border-danger-600 hover:text-danger-700"
                        >
                          Delete record
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-xl font-extrabold text-ink-900">Export records</h2>
          <p className="mt-2 text-sm leading-6 text-ink-600">
            This JSON mirrors the governed record shape for database or CMS migration.
          </p>
          <textarea
            readOnly
            value={exportJson}
            className="mt-4 h-52 w-full rounded-card border border-ink-200 bg-ink-50 p-3 font-mono text-xs text-ink-800"
          />
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-ink-900">
                Audit trail
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink-600">
                Recent programme changes recorded by the staff API.
              </p>
            </div>
            <Badge tone="neutral">{auditEvents.length} events</Badge>
          </div>
          <div className="mt-5 space-y-3">
            {recentAuditEvents.length > 0 ? (
              recentAuditEvents.map((event) => (
                <article
                  key={event.id}
                  className="rounded-card border border-ink-200 p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="brand">
                      {getProgrammeAuditActionLabel(event.action)}
                    </Badge>
                    <span className="text-sm font-semibold text-ink-800">
                      {event.entityId}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ink-600">
                    {event.actorLabel} - {formatAuditDate(event.createdAt)}
                  </p>
                </article>
              ))
            ) : (
              <p className="rounded-card border border-ink-200 p-3 text-sm text-ink-600">
                Programme changes will appear here after staff records are saved
                or removed.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ConflictRecoveryPanel({
  conflict,
  onUseLatest,
  onKeepEdits,
  onMergeFields,
  onMergeListItems,
  onMergeGuidanceEdits,
  onDismiss,
}: {
  conflict: ProgrammeConflictState;
  onUseLatest: () => void;
  onKeepEdits: () => void;
  onMergeFields: (fields: ProgrammeConflictField[]) => void;
  onMergeListItems: (selections: ProgrammeListItemMergeSelection[]) => void;
  onMergeGuidanceEdits: (guidance: ProgrammeGuidanceMergeInput) => void;
  onDismiss: () => void;
}) {
  const comparisons = getProgrammeConflictComparisons(
    conflict.currentRecord,
    conflict.attemptedRecord,
  );
  const listDiffs = getProgrammeListDiffs(
    conflict.currentRecord,
    conflict.attemptedRecord,
  );
  const [selectedFields, setSelectedFields] = useState<ProgrammeConflictField[]>(
    [],
  );
  const [selectedListItems, setSelectedListItems] = useState<
    ProgrammeListItemMergeSelection[]
  >([]);
  const [editableOverview, setEditableOverview] = useState(
    conflict.attemptedRecord.overview,
  );
  const [editableHighlights, setEditableHighlights] = useState(
    conflict.attemptedRecord.highlights.join(', '),
  );
  const [editableNextSteps, setEditableNextSteps] = useState(
    conflict.attemptedRecord.nextSteps.join(', '),
  );
  const overviewChanged =
    conflict.currentRecord.overview.trim() !==
    conflict.attemptedRecord.overview.trim();
  const hasGuidanceChanges = overviewChanged || listDiffs.length > 0;

  useEffect(() => {
    setEditableOverview(conflict.attemptedRecord.overview);
    setEditableHighlights(conflict.attemptedRecord.highlights.join(', '));
    setEditableNextSteps(conflict.attemptedRecord.nextSteps.join(', '));
    setSelectedFields([]);
    setSelectedListItems([]);
  }, [conflict.attemptedRecord]);

  function toggleSelectedField(field: ProgrammeConflictField) {
    setSelectedFields((current) =>
      current.includes(field)
        ? current.filter((item) => item !== field)
        : [...current, field],
    );
  }

  function toggleSelectedListItem(selection: ProgrammeListItemMergeSelection) {
    const key = getListSelectionKey(selection);
    setSelectedListItems((current) =>
      current.some((item) => getListSelectionKey(item) === key)
        ? current.filter((item) => getListSelectionKey(item) !== key)
        : [...current, selection],
    );
  }

  function isListItemSelected(selection: ProgrammeListItemMergeSelection) {
    const key = getListSelectionKey(selection);
    return selectedListItems.some((item) => getListSelectionKey(item) === key);
  }

  return (
    <div className="mt-4 rounded-card border border-warning-600 bg-warning-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-extrabold text-ink-900">
            Review latest staff changes
          </p>
          <p className="mt-1 text-xs font-semibold text-ink-600">
            Latest {getProgrammeRevisionLabel(conflict.currentRecord)}. Your edit
            was based on an older revision.
          </p>
        </div>
        <Badge tone="warning">Needs review</Badge>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead className="text-ink-600">
            <tr>
              <th className="py-2 pr-3 font-bold">Field</th>
              <th className="py-2 pr-3 font-bold">Latest record</th>
              <th className="py-2 font-bold">Your edits</th>
              <th className="py-2 pl-3 text-right font-bold">Use latest</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200">
            {comparisons.length > 0 ? (
              comparisons.map((comparison) => (
                <tr key={comparison.label}>
                  <td className="py-2 pr-3 font-semibold text-ink-700">
                    {comparison.label}
                  </td>
                  <td className="py-2 pr-3 text-ink-700">
                    {comparison.currentValue}
                  </td>
                  <td className="py-2 text-ink-700">
                    {comparison.attemptedValue}
                  </td>
                  <td className="py-2 pl-3 text-right">
                    <input
                      type="checkbox"
                      checked={selectedFields.includes(comparison.key)}
                      onChange={() => toggleSelectedField(comparison.key)}
                      className="h-4 w-4 accent-brand-600"
                      aria-label={`Use latest ${comparison.label}`}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-2 text-ink-700">
                  No comparison-ready fields changed, but the revision changed.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {listDiffs.length > 0 ? (
        <div className="mt-4 space-y-3">
          <p className="text-xs font-bold uppercase text-ink-600">
            Student-facing guidance changes
          </p>
          {listDiffs.map((diff) => (
            <div
              key={diff.key}
              className="rounded-card border border-ink-200 bg-white p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-extrabold text-ink-900">
                  {diff.label}
                </p>
                <Badge tone="neutral">{getProgrammeListDiffSummary(diff)}</Badge>
              </div>
              <ul className="mt-3 space-y-2">
                {diff.items.map((item) => {
                  const selection = isChangedListDiffItem(item)
                    ? {
                        list: diff.key,
                        value: item.value,
                        status: item.status,
                      }
                    : null;

                  return (
                    <li
                      key={`${diff.key}-${item.status}-${item.value}`}
                      className="grid gap-2 rounded-card border border-ink-100 p-2 text-sm text-ink-700 sm:grid-cols-[1fr_auto]"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={getListDiffTone(item.status)}>
                          {getListDiffLabel(item.status)}
                        </Badge>
                        <span>{item.value}</span>
                      </div>
                      {selection ? (
                        <label className="flex min-h-10 items-center gap-2 text-xs font-bold text-ink-700">
                          <input
                            type="checkbox"
                            checked={isListItemSelected(selection)}
                            onChange={() => toggleSelectedListItem(selection)}
                            className="h-4 w-4 accent-brand-600"
                            aria-label={`Use latest ${diff.label} item: ${item.value}`}
                          />
                          Use latest item
                        </label>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      ) : null}

      {hasGuidanceChanges ? (
        <div className="mt-4 rounded-card border border-ink-200 bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-extrabold text-ink-900">
              Edit guidance before applying
            </p>
            <Badge tone="neutral">Student-facing copy</Badge>
          </div>
          <div className="mt-3 space-y-3">
            {overviewChanged ? (
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase text-ink-600">
                    Latest overview
                  </p>
                  <p className="mt-2 rounded-card border border-ink-200 bg-ink-50 p-3 text-sm leading-6 text-ink-700">
                    {conflict.currentRecord.overview || 'Not set'}
                  </p>
                </div>
                <label className="block">
                  <span className="text-xs font-bold uppercase text-ink-600">
                    Your overview draft
                  </span>
                  <textarea
                    value={editableOverview}
                    onChange={(event) => setEditableOverview(event.target.value)}
                    className="mt-2 min-h-32 w-full rounded-card border border-ink-200 bg-white px-3 py-2 text-sm leading-6 text-ink-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                  />
                </label>
              </div>
            ) : null}
            {listDiffs.some((diff) => diff.key === 'highlights') ? (
              <label className="block">
                <span className="text-xs font-bold uppercase text-ink-600">
                  Highlights draft
                </span>
                <textarea
                  value={editableHighlights}
                  onChange={(event) => setEditableHighlights(event.target.value)}
                  className="mt-2 min-h-24 w-full rounded-card border border-ink-200 bg-white px-3 py-2 text-sm leading-6 text-ink-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                />
              </label>
            ) : null}
            {listDiffs.some((diff) => diff.key === 'nextSteps') ? (
              <label className="block">
                <span className="text-xs font-bold uppercase text-ink-600">
                  Next steps draft
                </span>
                <textarea
                  value={editableNextSteps}
                  onChange={(event) => setEditableNextSteps(event.target.value)}
                  className="mt-2 min-h-24 w-full rounded-card border border-ink-200 bg-white px-3 py-2 text-sm leading-6 text-ink-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                />
              </label>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onUseLatest}
          className="inline-flex min-h-10 items-center justify-center rounded-card border border-ink-300 bg-white px-3 text-sm font-semibold text-ink-700 hover:border-brand-400 hover:text-brand-700"
        >
          Use latest
        </button>
        <button
          type="button"
          onClick={onKeepEdits}
          className="inline-flex min-h-10 items-center justify-center rounded-card border border-brand-600 bg-brand-600 px-3 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Keep my edits
        </button>
        <button
          type="button"
          onClick={() => onMergeFields(selectedFields)}
          disabled={selectedFields.length === 0}
          className="inline-flex min-h-10 items-center justify-center rounded-card border border-brand-600 bg-white px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:border-ink-200 disabled:text-ink-300"
        >
          Merge selected
        </button>
        <button
          type="button"
          onClick={() => onMergeListItems(selectedListItems)}
          disabled={selectedListItems.length === 0}
          className="inline-flex min-h-10 items-center justify-center rounded-card border border-brand-600 bg-white px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:border-ink-200 disabled:text-ink-300"
        >
          Apply guidance items
        </button>
        <button
          type="button"
          onClick={() =>
            onMergeGuidanceEdits({
              overview: editableOverview,
              highlights: splitCsv(editableHighlights),
              nextSteps: splitCsv(editableNextSteps),
            })
          }
          disabled={!hasGuidanceChanges}
          className="inline-flex min-h-10 items-center justify-center rounded-card border border-brand-600 bg-white px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:border-ink-200 disabled:text-ink-300"
        >
          Apply edited guidance
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex min-h-10 items-center justify-center rounded-card border border-ink-300 bg-white px-3 text-sm font-semibold text-ink-700 hover:border-brand-400 hover:text-brand-700"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function getListSelectionKey(selection: ProgrammeListItemMergeSelection) {
  return `${selection.list}:${selection.status}:${selection.value.trim().toLowerCase()}`;
}

function isChangedListDiffItem(item: {
  status: 'added' | 'removed' | 'unchanged';
}): item is { value: string; status: 'added' | 'removed' } {
  return item.status !== 'unchanged';
}

function getListDiffLabel(status: 'added' | 'removed' | 'unchanged') {
  if (status === 'added') {
    return 'Added';
  }

  if (status === 'removed') {
    return 'Removed';
  }

  return 'Unchanged';
}

function getListDiffTone(status: 'added' | 'removed' | 'unchanged') {
  if (status === 'added') {
    return 'success';
  }

  if (status === 'removed') {
    return 'warning';
  }

  return 'neutral';
}

function formatAuditDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatCountDelta(value: number) {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}

function DataMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-card border border-ink-200 bg-white p-3">
      <p className="text-xs font-bold uppercase text-ink-600">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-ink-900">{value}</p>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-ink-800">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-touch w-full rounded-card border border-ink-200 bg-white px-3 text-sm text-ink-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-ink-800">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 min-h-touch w-full rounded-card border border-ink-200 bg-white px-3 text-sm text-ink-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
      />
    </label>
  );
}

function TextAreaField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-ink-800">{label}</span>
      {hint ? <span className="ml-2 text-xs text-ink-500">{hint}</span> : null}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-24 w-full rounded-card border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
      />
    </label>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  getLabel,
  onChange,
}: {
  label: string;
  value: T;
  options: T[];
  getLabel: (value: T) => string;
  onChange: (value: T) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-ink-800">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="mt-2 min-h-touch w-full rounded-card border border-ink-200 bg-white px-3 text-sm text-ink-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {getLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function Checklist<T extends string>({
  label,
  values,
  selected,
  getLabel,
  onChange,
}: {
  label: string;
  values: T[];
  selected: T[];
  getLabel: (value: T) => string;
  onChange: (values: T[]) => void;
}) {
  function toggle(value: T) {
    onChange(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
  }

  return (
    <fieldset>
      <legend className="text-sm font-bold text-ink-800">{label}</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {values.map((value) => (
          <label
            key={value}
            className="flex items-center gap-2 rounded-card border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700"
          >
            <input
              type="checkbox"
              checked={selected.includes(value)}
              onChange={() => toggle(value)}
              className="h-4 w-4 accent-brand-600"
            />
            {getLabel(value)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
