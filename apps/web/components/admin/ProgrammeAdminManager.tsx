'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Card, Input } from '@/components/ui';
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

interface DataCounts {
  users: number;
  onboardingProfiles: number;
  shortlists: number;
  programmeRecords: number;
  auditEvents: number;
}

interface DataOperationCapability {
  id: 'status' | 'backup-list' | 'import-validate';
  available: true;
  allowedAction: 'view' | 'validate';
  reason: 'available';
  retryable: false;
}

interface DataCapabilities {
  health: 'healthy';
  adapter: string;
  lastVerifiedAt: string;
  counts: DataCounts;
  operations: DataOperationCapability[];
}

interface DataFailure {
  category: string;
  incidentId: string;
  retryable: boolean;
}

type CapabilityState =
  | { state: 'loading' }
  | { state: 'ready'; value: DataCapabilities }
  | { state: 'refreshing'; value: DataCapabilities }
  | { state: 'last-known'; value: DataCapabilities; failure: DataFailure }
  | { state: 'unavailable'; failure: DataFailure };

interface RecoveryPlanToken {
  claims: {
    planId: string;
    sourceId: string;
    sourceDigest: string;
    currentDataDigest: string;
    issuedAt: string;
    expiresAt: string;
  };
  signature: string;
}

interface DataRestoreResult {
  ok: boolean;
  backupId?: string;
  appliedAt?: string;
  incidentId?: string;
  planId?: string;
  counts?: DataCounts;
  error?: string;
  retryable?: boolean;
}

interface DataRestoreBackup {
  id: string;
  createdAt: string;
  actorUserId: string;
  reason: string;
  counts: DataCounts;
  incidentHold?: {
    incidentId: string;
    status: 'unresolved' | 'resolved';
    createdAt: string;
    resolvedAt?: string;
    reason?: string;
  };
}

interface DataRestorePlanRow {
  key: keyof DataCounts;
  label: string;
  currentCount: number;
  restoredCount: number;
  delta: number;
}

interface DataRestorePlan {
  planId: string;
  sourceId: string;
  expiresAt: string;
  rows: DataRestorePlanRow[];
}

interface PlannedRecovery {
  kind: 'backup' | 'import';
  plan: DataRestorePlan;
  planToken: RecoveryPlanToken | { recoveryToken: RecoveryPlanToken; encodedEnvelope: string };
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
  const [capabilityState, setCapabilityState] = useState<CapabilityState>({ state: 'loading' });
  const [restoreBackups, setRestoreBackups] = useState<DataRestoreBackup[]>([]);
  const [recoveryPlan, setRecoveryPlan] = useState<PlannedRecovery | null>(null);
  const [recoveryError, setRecoveryError] = useState<DataFailure | null>(null);
  const [recoveryReason, setRecoveryReason] = useState('');
  const [recoveryConfirmation, setRecoveryConfirmation] = useState('');
  const [recoveryResult, setRecoveryResult] = useState<DataRestoreResult | null>(null);
  const [pendingAction, setPendingAction] = useState<'refresh' | 'preview' | 'validate' | 'apply' | null>(null);
  const [importSnapshot, setImportSnapshot] = useState('');
  const alertRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLHeadingElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);
  const [message, setMessage] = useState('');
  const [conflict, setConflict] = useState<ProgrammeConflictState | null>(null);
  const mergedProgrammes = useMemo(
    () => mergeProgrammeDrafts(baseProgrammes, drafts),
    [baseProgrammes, drafts],
  );
  const exportJson = serializeProgrammeDrafts(drafts);
  const recentAuditEvents = getRecentProgrammeAuditEvents(auditEvents);
  const verifiedCapabilities = capabilityState.state === 'ready' ||
    capabilityState.state === 'refreshing' || capabilityState.state === 'last-known'
    ? capabilityState.value
    : null;
  const mutationsAllowed = capabilityState.state === 'ready';
  const hasBackupList = verifiedCapabilities?.operations.some(
    (operation) => operation.id === 'backup-list' && operation.allowedAction === 'view',
  ) ?? false;
  const hasImportValidation = verifiedCapabilities?.operations.some(
    (operation) => operation.id === 'import-validate' && operation.allowedAction === 'validate',
  ) ?? false;

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
    void refreshDataStatus();
  }, []);

  useEffect(() => {
    if (capabilityState.state === 'unavailable' || capabilityState.state === 'last-known') {
      alertRef.current?.focus();
    }
  }, [capabilityState]);

  useEffect(() => {
    if (recoveryError) alertRef.current?.focus();
  }, [recoveryError]);

  useEffect(() => {
    if (recoveryPlan) previewRef.current?.focus();
  }, [recoveryPlan]);

  useEffect(() => {
    if (recoveryResult) resultRef.current?.focus();
  }, [recoveryResult]);

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
    const previous = capabilityState.state === 'ready' || capabilityState.state === 'last-known'
      ? capabilityState.value
      : null;
    setPendingAction('refresh');
    setRecoveryError(null);
    setCapabilityState(previous ? { state: 'refreshing', value: previous } : { state: 'loading' });
    const response = await fetch('/api/admin/data/capabilities');
    const body = (await response.json().catch(() => null)) as (DataCapabilities & Partial<DataFailure>) | null;

    if (!response.ok || !body || body.health !== 'healthy') {
      const failure = {
        category: body?.category ?? 'storage-unavailable',
        incidentId: body?.incidentId ?? 'unavailable',
        retryable: body?.retryable ?? true,
      };
      setCapabilityState(previous
        ? { state: 'last-known', value: previous, failure }
        : { state: 'unavailable', failure });
      setPendingAction(null);
      return;
    }

    setCapabilityState({ state: 'ready', value: body });
    if (body.operations.some((operation) => operation.id === 'backup-list')) {
      await refreshRestoreBackups();
    } else {
      setRestoreBackups([]);
    }
    setPendingAction(null);
  }

  async function refreshRestoreBackups() {
    const response = await fetch('/api/admin/data/backups');

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as Partial<DataFailure> | null;
      setRecoveryError({
        category: body?.category ?? 'storage-unavailable',
        incidentId: body?.incidentId ?? 'unavailable',
        retryable: body?.retryable ?? true,
      });
      return;
    }

    const body = (await response.json()) as { backups?: DataRestoreBackup[] };
    setRestoreBackups(body.backups ?? []);
  }

  async function handlePlanBackupRestore(backupId: string) {
    if (pendingAction) return;
    setPendingAction('preview');
    setRecoveryPlan(null);
    setRecoveryError(null);
    setRecoveryResult(null);
    setRecoveryConfirmation('');

    const response = await fetch(
      `/api/admin/data/backups/${encodeURIComponent(backupId)}/plan`,
    );
    const body = (await response.json().catch(() => null)) as
      | { plan?: DataRestorePlan; planToken?: RecoveryPlanToken; error?: string; category?: string; incidentId?: string; retryable?: boolean }
      | null;

    if (!response.ok || !body?.plan || !body.planToken) {
      setRecoveryError({
        category: body?.category ?? body?.error ?? 'restore-preview-failed',
        incidentId: body?.incidentId ?? 'unavailable',
        retryable: body?.retryable ?? true,
      });
      setPendingAction(null);
      return;
    }

    setRecoveryPlan({ kind: 'backup', plan: body.plan, planToken: body.planToken });
    setPendingAction(null);
  }

  async function handleValidateImport() {
    if (pendingAction) return;
    setRecoveryPlan(null);
    setRecoveryResult(null);
    setRecoveryError(null);
    setRecoveryConfirmation('');

    if (!importSnapshot.trim()) {
      setRecoveryError({ category: 'Paste a recovery package before validating.', incidentId: 'input-required', retryable: true });
      return;
    }
    setPendingAction('validate');
    const response = await fetch('/api/admin/data/import/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: importSnapshot,
    });
    const body = (await response.json().catch(() => null)) as
      | { plan?: DataRestorePlan; planToken?: { recoveryToken: RecoveryPlanToken; encodedEnvelope: string }; error?: string; category?: string; incidentId?: string; retryable?: boolean }
      | null;

    if (!response.ok || !body?.plan || !body.planToken) {
      setRecoveryError({ category: body?.category ?? body?.error ?? 'invalid-recovery-package', incidentId: body?.incidentId ?? 'validation-failed', retryable: body?.retryable ?? true });
      setPendingAction(null);
      return;
    }
    setRecoveryPlan({ kind: 'import', plan: body.plan, planToken: body.planToken });
    setPendingAction(null);
  }

  async function handleApplyRecovery() {
    if (!recoveryPlan || pendingAction) return;
    setPendingAction('apply');
    setRecoveryResult(null);
    setRecoveryError(null);
    const endpoint = recoveryPlan.kind === 'backup'
      ? `/api/admin/data/backups/${encodeURIComponent(recoveryPlan.plan.sourceId)}/restore`
      : '/api/admin/data/import/restore';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planToken: recoveryPlan.planToken,
        confirmation: recoveryConfirmation,
        reason: recoveryReason,
      }),
    });
    const body = (await response.json().catch(() => null)) as DataRestoreResult | null;
    const result = body ?? { ok: false, error: 'data-service-unavailable' };
    setRecoveryResult(result);
    if (response.ok && body?.ok) {
      setRecoveryPlan(null);
      setRecoveryConfirmation('');
      setRecoveryReason('');
      if (recoveryPlan.kind === 'import') setImportSnapshot('');
      await refreshAuditEvents();
    } else if (response.status === 409 || response.status === 410) {
      setRecoveryPlan(null);
      setRecoveryConfirmation('');
    }
    setPendingAction(null);
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
        <Card className="p-5" aria-labelledby="data-operations-heading">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 id="data-operations-heading" className="text-xl font-semibold text-ink-900">
                Data operations
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink-600">
                Recovery actions come from a fresh, staff-authorized storage check.
              </p>
            </div>
            {verifiedCapabilities ? (
              <Badge tone={mutationsAllowed ? 'success' : 'warning'}>
                {mutationsAllowed ? 'Storage verified' : 'Refreshing'}
              </Badge>
            ) : (
              <Badge tone="neutral">Checking</Badge>
            )}
          </div>

          <div aria-live="polite" className="mt-4">
            {capabilityState.state === 'loading' ? (
              <p role="status" className="rounded-card border border-ink-200 bg-ink-50 p-3 text-sm text-ink-700">
                Checking data operations…
              </p>
            ) : null}
            {capabilityState.state === 'refreshing' ? (
              <p role="status" className="text-sm font-semibold text-ink-600">
                Refreshing data operations…
              </p>
            ) : null}
          </div>

          {capabilityState.state === 'unavailable' || capabilityState.state === 'last-known' ? (
            <div
              ref={alertRef}
              role="alert"
              tabIndex={-1}
              className="mt-4 rounded-card border border-danger-600 bg-danger-50 p-4 outline-none focus:ring-2 focus:ring-danger-600 focus:ring-offset-2"
            >
              <p className="text-sm font-semibold text-ink-900">
                Data operations are unavailable. No data was changed. Retry a fresh storage check.
              </p>
              <p className="mt-2 text-sm text-ink-700">
                Category: {capabilityState.failure.category}
              </p>
              <p className="mt-1 break-all font-mono text-xs text-ink-700">
                Incident ID: {capabilityState.failure.incidentId}
              </p>
              {capabilityState.failure.retryable ? (
                <Button
                  className="mt-3"
                  variant="secondary"
                  size="sm"
                  onClick={() => void refreshDataStatus()}
                  disabled={pendingAction === 'refresh'}
                >
                  Retry data operations
                </Button>
              ) : null}
            </div>
          ) : null}

          {verifiedCapabilities ? (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3 rounded-card border border-ink-200 bg-ink-50 p-4">
                <div>
                  <p className="text-sm font-semibold text-ink-900">Storage verified</p>
                  <p className="mt-1 text-xs text-ink-600">
                    {capabilityState.state === 'last-known' ? 'Last verified' : 'Verified'}{' '}
                    {formatAuditDate(verifiedCapabilities.lastVerifiedAt)}
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-ink-700">
                    {verifiedCapabilities.adapter}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void refreshDataStatus()}
                  disabled={pendingAction === 'refresh'}
                >
                  Refresh data operations
                </Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                <DataMetric label="Users" value={verifiedCapabilities.counts.users} />
                <DataMetric label="Profiles" value={verifiedCapabilities.counts.onboardingProfiles} />
                <DataMetric label="Shortlists" value={verifiedCapabilities.counts.shortlists} />
                <DataMetric label="Programmes" value={verifiedCapabilities.counts.programmeRecords} />
                <DataMetric label="Audit" value={verifiedCapabilities.counts.auditEvents} />
              </div>

              {hasBackupList ? (
                <section aria-labelledby="backup-history-heading" className="rounded-card border border-ink-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 id="backup-history-heading" className="text-base font-semibold text-ink-900">
                        Recovery backup history
                      </h3>
                      <p className="mt-1 text-sm text-ink-600">Newest retained backups, without snapshot contents.</p>
                    </div>
                    <Badge tone="neutral">{restoreBackups.length} saved</Badge>
                  </div>
                  {restoreBackups.length === 0 ? (
                    <div className="mt-3 rounded-card border border-ink-200 bg-ink-50 p-4">
                      <p className="font-semibold text-ink-900">No recovery backups yet</p>
                      <p className="mt-1 text-sm text-ink-600">
                        Recovery backups appear here after a confirmed restore or import. No action is needed.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {restoreBackups.map((backup) => (
                        <article key={backup.id} className="rounded-card border border-ink-200 bg-ink-50 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-ink-900">{formatAuditDate(backup.createdAt)}</p>
                              <p className="mt-1 break-all font-mono text-xs text-ink-700">{backup.id}</p>
                              <p className="mt-1 break-words text-sm text-ink-600">
                                {backup.actorUserId} · {backup.reason}
                              </p>
                            </div>
                            {backup.incidentHold?.status === 'unresolved' ? (
                              <Badge tone="warning">Retention hold</Badge>
                            ) : <Badge tone="neutral">Retained</Badge>}
                          </div>
                          {backup.incidentHold ? (
                            <p className="mt-2 break-all font-mono text-xs text-ink-600">
                              Incident {backup.incidentHold.incidentId}
                            </p>
                          ) : null}
                          <div className="mt-3 grid gap-2 sm:grid-cols-5">
                            <DataMetric label="Users" value={backup.counts.users} />
                            <DataMetric label="Profiles" value={backup.counts.onboardingProfiles} />
                            <DataMetric label="Shortlists" value={backup.counts.shortlists} />
                            <DataMetric label="Programmes" value={backup.counts.programmeRecords} />
                            <DataMetric label="Audit" value={backup.counts.auditEvents} />
                          </div>
                          <Button
                            className="mt-3"
                            variant="secondary"
                            size="sm"
                            disabled={!mutationsAllowed || pendingAction !== null}
                            onClick={() => void handlePlanBackupRestore(backup.id)}
                          >
                            {pendingAction === 'preview' ? 'Preparing restore preview…' : 'Preview restore impact'}
                          </Button>
                          {!mutationsAllowed ? (
                            <p className="mt-2 text-xs text-ink-600">A fresh storage check is required before previewing a restore.</p>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              ) : null}

              {hasImportValidation ? (
                <section aria-labelledby="import-heading" className="rounded-card border border-ink-200 bg-white p-4">
                  <h3 id="import-heading" className="text-base font-semibold text-ink-900">Import recovery package</h3>
                  <p id="import-help" className="mt-1 text-sm text-ink-600">
                    Server validation is authoritative and does not modify data. Paste a signed package up to 5 MiB.
                  </p>
                  <label htmlFor="recovery-package" className="mt-3 block text-sm font-semibold text-ink-800">
                    Signed recovery package
                  </label>
                  <textarea
                    id="recovery-package"
                    value={importSnapshot}
                    onChange={(event) => {
                      setImportSnapshot(event.target.value);
                      setRecoveryPlan(null);
                      setRecoveryConfirmation('');
                      setRecoveryResult(null);
                    }}
                    aria-describedby="import-help"
                    className="mt-2 min-h-32 w-full rounded-card border border-ink-200 bg-ink-50 px-3 py-2 font-mono text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                  />
                  <Button
                    className="mt-3"
                    disabled={!mutationsAllowed || pendingAction !== null}
                    onClick={() => void handleValidateImport()}
                  >
                    {pendingAction === 'validate' ? 'Validating import package…' : 'Validate import package'}
                  </Button>
                  {!mutationsAllowed ? (
                    <p className="mt-2 text-xs text-ink-600">A fresh storage check is required before validation.</p>
                  ) : null}
                </section>
              ) : null}

              {recoveryPlan ? (
                <section className="rounded-card border border-brand-200 bg-brand-50 p-4" aria-labelledby="impact-preview-heading">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3
                        ref={previewRef}
                        id="impact-preview-heading"
                        tabIndex={-1}
                        className="text-base font-semibold text-ink-900 outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        Impact preview
                      </h3>
                      {recoveryPlan.kind === 'import' ? (
                        <p className="mt-1 text-sm text-success-700">
                          Import package validated. Review the impact before applying it.
                        </p>
                      ) : null}
                    </div>
                    <Badge tone="brand">Read-only plan</Badge>
                  </div>
                  <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                    <div><dt className="font-semibold text-ink-600">Source ID</dt><dd className="break-all font-mono text-ink-800">{recoveryPlan.plan.sourceId}</dd></div>
                    <div><dt className="font-semibold text-ink-600">Plan ID</dt><dd className="break-all font-mono text-ink-800">{recoveryPlan.plan.planId}</dd></div>
                    <div><dt className="font-semibold text-ink-600">Source digest</dt><dd className="break-all font-mono text-ink-800">{getRecoveryClaims(recoveryPlan.planToken).sourceDigest}</dd></div>
                    <div><dt className="font-semibold text-ink-600">Current-data version</dt><dd className="break-all font-mono text-ink-800">{getRecoveryClaims(recoveryPlan.planToken).currentDataDigest}</dd></div>
                  </dl>
                  <p className="mt-3 text-sm text-warning-700">
                    This plan expires at {formatAuditDate(recoveryPlan.plan.expiresAt)}. Preview again if it expires.
                  </p>
                  <div className="mt-3 max-w-full overflow-x-auto rounded-card border border-brand-200 bg-white">
                    <table className="min-w-[560px] w-full text-left text-sm">
                      <thead><tr className="text-xs text-ink-600">
                        <th className="p-3 font-semibold">Data</th><th className="p-3 font-semibold">Current</th>
                        <th className="p-3 font-semibold">After restore</th><th className="p-3 font-semibold">Change</th>
                      </tr></thead>
                      <tbody className="divide-y divide-ink-100">
                        {recoveryPlan.plan.rows.map((row) => (
                          <tr key={row.key}><th scope="row" className="p-3 font-semibold text-ink-800">{row.label}</th>
                            <td className="p-3">{row.currentCount}</td><td className="p-3">{row.restoredCount}</td>
                            <td className="p-3">{formatCountDelta(row.delta)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 rounded-card border border-warning-600 bg-warning-50 p-4">
                    <p className="font-semibold text-ink-900">
                      This replaces the current Scholar Scout data as one operation. A recovery backup will be created first.
                    </p>
                    <label htmlFor="recovery-reason" className="mt-3 block text-sm font-semibold text-ink-800">Operator reason</label>
                    <Input
                      id="recovery-reason"
                      value={recoveryReason}
                      maxLength={500}
                      aria-describedby="recovery-reason-help"
                      onChange={(event) => setRecoveryReason(event.target.value)}
                    />
                    <p id="recovery-reason-help" className="mt-1 text-xs text-ink-600">Required, up to 500 characters.</p>
                    <label htmlFor="recovery-confirmation" className="mt-3 block text-sm font-semibold text-ink-800">
                      Type <span className="font-mono">{RESTORE_CONFIRMATION}</span>
                    </label>
                    <Input
                      id="recovery-confirmation"
                      className="font-mono"
                      value={recoveryConfirmation}
                      aria-describedby="recovery-confirmation-help"
                      onChange={(event) => setRecoveryConfirmation(event.target.value)}
                    />
                    <p id="recovery-confirmation-help" className="mt-1 text-xs text-ink-600">Exact phrase required.</p>
                    <Button
                      className="mt-3"
                      variant="danger"
                      disabled={!mutationsAllowed || pendingAction !== null || !recoveryReason.trim() || recoveryConfirmation !== RESTORE_CONFIRMATION}
                      onClick={() => void handleApplyRecovery()}
                    >
                      {pendingAction === 'apply' ? 'Applying restore…' : recoveryPlan.kind === 'backup' ? 'Apply restore' : 'Apply import'}
                    </Button>
                  </div>
                </section>
              ) : null}

              {recoveryError ? (
                <div ref={alertRef} role="alert" tabIndex={-1} className="rounded-card border border-danger-600 bg-danger-50 p-4 outline-none focus:ring-2 focus:ring-danger-600">
                  <p className="font-semibold text-ink-900">Recovery operation could not be completed. No data was changed.</p>
                  <p className="mt-1 text-sm text-ink-700">{recoveryError.category}</p>
                  <p className="mt-1 break-all font-mono text-xs text-ink-700">Incident ID: {recoveryError.incidentId}</p>
                </div>
              ) : null}

              {recoveryResult ? (
                <div className={`rounded-card border p-4 ${recoveryResult.ok ? 'border-success-600 bg-success-50' : 'border-danger-600 bg-danger-50'}`}>
                  <h3 ref={resultRef} tabIndex={-1} className="font-semibold text-ink-900 outline-none focus:ring-2 focus:ring-brand-500">
                    {recoveryResult.ok ? 'Recovery completed' : 'Recovery unchanged'}
                  </h3>
                  <p className="mt-1 text-sm text-ink-700">
                    {recoveryResult.ok
                      ? `Restore completed. Recovery backup ${recoveryResult.backupId} was created.`
                      : `Recovery could not be completed. No partial changes were applied. ${recoveryResult.error ?? ''}`}
                  </p>
                  {recoveryResult.incidentId ? <p className="mt-1 break-all font-mono text-xs">Incident ID: {recoveryResult.incidentId}</p> : null}
                  {recoveryResult.appliedAt ? <p className="mt-1 text-xs">Completed {formatAuditDate(recoveryResult.appliedAt)}</p> : null}
                </div>
              ) : null}
            </div>
          ) : null}
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

function getRecoveryClaims(token: PlannedRecovery['planToken']) {
  return 'recoveryToken' in token ? token.recoveryToken.claims : token.claims;
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
