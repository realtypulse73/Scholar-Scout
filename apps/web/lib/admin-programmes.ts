import type {
  Interest,
  SupportNeed,
} from '@/lib/onboarding-types';
import {
  PROGRAMME_PATHWAY_LABELS,
  type Programme,
  type ProgrammePathway,
  type ProgrammeSourceCheck,
  type ProgrammeSourceConfidence,
  type ProgrammePublicationStatus,
} from '@/lib/programmes';

export const ADMIN_PROGRAMMES_STORAGE_KEY = 'scholarscout.admin.programmes';

export type ProgrammeDraft = Programme;

export interface ProgrammeAuditSummary {
  id: string;
  action: string;
  entityId: string;
  actorLabel: string;
  createdAt: string;
}

export interface ProgrammeConflictComparison {
  key: ProgrammeConflictField;
  label: string;
  currentValue: string;
  attemptedValue: string;
}

export interface ProgrammeListDiffItem {
  value: string;
  status: 'added' | 'removed' | 'unchanged';
}

export interface ProgrammeListDiff {
  key: 'highlights' | 'nextSteps';
  label: string;
  items: ProgrammeListDiffItem[];
}

export interface ProgrammeListItemMergeSelection {
  list: ProgrammeListDiff['key'];
  value: string;
  status: Extract<ProgrammeListDiffItem['status'], 'added' | 'removed'>;
}

export interface ProgrammeGuidanceMergeInput {
  overview: string;
  highlights: string[];
  nextSteps: string[];
}

export type ProgrammeConflictField =
  | 'name'
  | 'school'
  | 'location'
  | 'delivery'
  | 'pathway'
  | 'publicationStatus'
  | 'annualTuition'
  | 'acceptanceRate'
  | 'duration'
  | 'credential'
  | 'overview'
  | 'reviewAssignee'
  | 'sourceName'
  | 'sourceConfidence'
  | 'sourceChecks'
  | 'highlights'
  | 'nextSteps';

export function slugifyProgrammeId(name: string, school: string) {
  const base = `${school}-${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return base || `programme-${Date.now()}`;
}

export function splitCsv(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseProgrammeDrafts(value: string | null) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter(isProgrammeDraft)
      : [];
  } catch {
    return [];
  }
}

export function serializeProgrammeDrafts(programmes: ProgrammeDraft[]) {
  return JSON.stringify(programmes, null, 2);
}

export function mergeProgrammeDrafts(
  baseProgrammes: Programme[],
  drafts: ProgrammeDraft[],
) {
  const draftIds = new Set(drafts.map((draft) => draft.id));

  return [
    ...drafts,
    ...baseProgrammes.filter((programme) => !draftIds.has(programme.id)),
  ];
}

export function getPublishedProgrammeRecords(records: ProgrammeDraft[]) {
  return records.filter(
    (record) => (record.publicationStatus ?? 'published') === 'published',
  );
}

export function getRecentProgrammeAuditEvents(
  events: ProgrammeAuditSummary[],
  limit = 6,
) {
  return [...events]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export function getProgrammeAuditActionLabel(action: string) {
  if (action === 'create') {
    return 'Created';
  }

  if (action === 'update') {
    return 'Updated';
  }

  if (action === 'delete') {
    return 'Deleted';
  }

  return 'Changed';
}

export function getProgrammeConflictComparisons(
  currentRecord: ProgrammeDraft,
  attemptedRecord: ProgrammeDraft,
): ProgrammeConflictComparison[] {
  const comparisons = [
    compareText('name', 'Programme', currentRecord.name, attemptedRecord.name),
    compareText('school', 'School', currentRecord.school, attemptedRecord.school),
    compareText(
      'location',
      'Location',
      formatLocation(currentRecord),
      formatLocation(attemptedRecord),
    ),
    compareText('delivery', 'Delivery', currentRecord.delivery, attemptedRecord.delivery),
    compareText(
      'pathway',
      'Pathway',
      PROGRAMME_PATHWAY_LABELS[currentRecord.pathway],
      PROGRAMME_PATHWAY_LABELS[attemptedRecord.pathway],
    ),
    compareText(
      'publicationStatus',
      'Status',
      publicationStatusLabels[currentRecord.publicationStatus ?? 'draft'],
      publicationStatusLabels[attemptedRecord.publicationStatus ?? 'draft'],
    ),
    compareText(
      'annualTuition',
      'Tuition',
      formatCurrency(currentRecord.annualTuition),
      formatCurrency(attemptedRecord.annualTuition),
    ),
    compareText(
      'acceptanceRate',
      'Entry flexibility',
      `${currentRecord.acceptanceRate}%`,
      `${attemptedRecord.acceptanceRate}%`,
    ),
    compareText('duration', 'Duration', currentRecord.duration, attemptedRecord.duration),
    compareText('credential', 'Credential', currentRecord.credential, attemptedRecord.credential),
    compareText(
      'reviewAssignee',
      'Reviewer',
      currentRecord.reviewAssignee ?? '',
      attemptedRecord.reviewAssignee ?? '',
    ),
    compareText(
      'sourceName',
      'Source',
      currentRecord.sourceName ?? '',
      attemptedRecord.sourceName ?? '',
    ),
    compareText(
      'sourceConfidence',
      'Source confidence',
      sourceConfidenceLabels[currentRecord.sourceConfidence ?? 'unverified'],
      sourceConfidenceLabels[attemptedRecord.sourceConfidence ?? 'unverified'],
    ),
    compareText(
      'sourceChecks',
      'Source checks',
      formatSourceChecks(currentRecord.sourceChecks ?? []),
      formatSourceChecks(attemptedRecord.sourceChecks ?? []),
    ),
  ];

  return comparisons.filter(
    (comparison): comparison is ProgrammeConflictComparison =>
      Boolean(comparison),
  );
}

export function getProgrammeListDiffs(
  currentRecord: ProgrammeDraft,
  attemptedRecord: ProgrammeDraft,
): ProgrammeListDiff[] {
  const diffs: ProgrammeListDiff[] = [
    {
      key: 'highlights',
      label: 'Highlights',
      items: diffProgrammeListItems(
        currentRecord.highlights,
        attemptedRecord.highlights,
      ),
    },
    {
      key: 'nextSteps',
      label: 'Next steps',
      items: diffProgrammeListItems(
        currentRecord.nextSteps,
        attemptedRecord.nextSteps,
      ),
    },
  ];

  return diffs.filter((diff) =>
    diff.items.some((item) => item.status !== 'unchanged'),
  );
}

export function getProgrammeListDiffSummary(diff: ProgrammeListDiff) {
  const added = diff.items.filter((item) => item.status === 'added').length;
  const removed = diff.items.filter((item) => item.status === 'removed').length;
  const unchanged = diff.items.filter((item) => item.status === 'unchanged').length;
  const parts = [
    added ? `${added} added` : '',
    removed ? `${removed} removed` : '',
    unchanged ? `${unchanged} unchanged` : '',
  ].filter(Boolean);

  return parts.join(', ') || 'No changes';
}

export function mergeProgrammeConflictFields(
  currentRecord: ProgrammeDraft,
  attemptedRecord: ProgrammeDraft,
  fieldsFromCurrent: ProgrammeConflictField[],
) {
  const fieldSet = new Set(fieldsFromCurrent);
  const merged = { ...attemptedRecord };

  if (fieldSet.has('name')) {
    merged.name = currentRecord.name;
  }

  if (fieldSet.has('school')) {
    merged.school = currentRecord.school;
  }

  if (fieldSet.has('location')) {
    merged.city = currentRecord.city;
    merged.state = currentRecord.state;
  }

  if (fieldSet.has('delivery')) {
    merged.delivery = currentRecord.delivery;
  }

  if (fieldSet.has('pathway')) {
    merged.pathway = currentRecord.pathway;
  }

  if (fieldSet.has('publicationStatus')) {
    merged.publicationStatus = currentRecord.publicationStatus;
  }

  if (fieldSet.has('annualTuition')) {
    merged.annualTuition = currentRecord.annualTuition;
  }

  if (fieldSet.has('acceptanceRate')) {
    merged.acceptanceRate = currentRecord.acceptanceRate;
  }

  if (fieldSet.has('duration')) {
    merged.duration = currentRecord.duration;
  }

  if (fieldSet.has('credential')) {
    merged.credential = currentRecord.credential;
  }

  if (fieldSet.has('overview')) {
    merged.overview = currentRecord.overview;
  }

  if (fieldSet.has('reviewAssignee')) {
    merged.reviewAssignee = currentRecord.reviewAssignee;
  }

  if (fieldSet.has('sourceName')) {
    merged.sourceName = currentRecord.sourceName;
  }

  if (fieldSet.has('sourceConfidence')) {
    merged.sourceConfidence = currentRecord.sourceConfidence;
  }

  if (fieldSet.has('sourceChecks')) {
    merged.sourceChecks = currentRecord.sourceChecks;
  }

  if (fieldSet.has('highlights')) {
    merged.highlights = currentRecord.highlights;
  }

  if (fieldSet.has('nextSteps')) {
    merged.nextSteps = currentRecord.nextSteps;
  }

  return {
    ...merged,
    revision: currentRecord.revision ?? attemptedRecord.revision ?? 0,
  };
}

export function mergeProgrammeGuidanceEdits(
  currentRecord: ProgrammeDraft,
  attemptedRecord: ProgrammeDraft,
  guidance: ProgrammeGuidanceMergeInput,
) {
  return {
    ...attemptedRecord,
    overview: guidance.overview.trim(),
    highlights: normalizeListValues(guidance.highlights),
    nextSteps: normalizeListValues(guidance.nextSteps),
    revision: currentRecord.revision ?? attemptedRecord.revision ?? 0,
  };
}

export function mergeProgrammeListDiffItems(
  currentRecord: ProgrammeDraft,
  attemptedRecord: ProgrammeDraft,
  selections: ProgrammeListItemMergeSelection[],
) {
  return {
    ...attemptedRecord,
    highlights: mergeListValues(
      currentRecord.highlights,
      attemptedRecord.highlights,
      selections.filter((selection) => selection.list === 'highlights'),
    ),
    nextSteps: mergeListValues(
      currentRecord.nextSteps,
      attemptedRecord.nextSteps,
      selections.filter((selection) => selection.list === 'nextSteps'),
    ),
    revision: currentRecord.revision ?? attemptedRecord.revision ?? 0,
  };
}

export function upsertProgrammeDraft(
  drafts: ProgrammeDraft[],
  nextDraft: ProgrammeDraft,
) {
  const existingIndex = drafts.findIndex((draft) => draft.id === nextDraft.id);

  if (existingIndex === -1) {
    return [nextDraft, ...drafts];
  }

  return drafts.map((draft, index) =>
    index === existingIndex ? nextDraft : draft,
  );
}

export function removeProgrammeDraft(drafts: ProgrammeDraft[], id: string) {
  return drafts.filter((draft) => draft.id !== id);
}

export function createProgrammeDraft(): ProgrammeDraft {
  return {
    id: '',
    name: '',
    school: '',
    city: '',
    state: '',
    delivery: 'Campus',
    pathway: '2-year-community-college',
    interests: [],
    support: [],
    annualTuition: 0,
    acceptanceRate: 100,
    matchScore: 70,
    duration: '',
    overview: '',
    credential: '',
    highlights: [],
    nextSteps: [],
    publicationStatus: 'draft',
    sourceName: '',
    sourceUrl: '',
    sourceConfidence: 'unverified',
    sourceNotes: '',
    sourceChecks: [],
    lastVerifiedAt: '',
    reviewAssignee: '',
    reviewNotes: '',
    revision: 0,
  };
}

export function prepareProgrammeDraft(draft: ProgrammeDraft) {
  return {
    ...draft,
    id: draft.id || slugifyProgrammeId(draft.name, draft.school),
    name: draft.name.trim(),
    school: draft.school.trim(),
    city: draft.city.trim(),
    state: draft.state.trim().toUpperCase(),
    duration: draft.duration.trim(),
    credential: draft.credential.trim(),
    overview: draft.overview.trim(),
    publicationStatus: draft.publicationStatus ?? 'draft',
    sourceName: draft.sourceName?.trim() ?? '',
    sourceUrl: draft.sourceUrl?.trim() ?? '',
    sourceConfidence: draft.sourceConfidence ?? 'unverified',
    sourceNotes: draft.sourceNotes?.trim() ?? '',
    sourceChecks: normalizeSourceChecks(draft.sourceChecks ?? []),
    lastVerifiedAt: draft.lastVerifiedAt?.trim() ?? '',
    reviewAssignee: draft.reviewAssignee?.trim() ?? '',
    reviewNotes: draft.reviewNotes?.trim() ?? '',
    revision: draft.revision ?? 0,
    annualTuition: Math.max(0, Math.round(draft.annualTuition)),
    acceptanceRate: clampPercent(draft.acceptanceRate),
    matchScore: clampPercent(draft.matchScore),
    highlights: draft.highlights.map((item) => item.trim()).filter(Boolean),
    nextSteps: draft.nextSteps.map((item) => item.trim()).filter(Boolean),
  };
}

export function validateProgrammeDraft(draft: Partial<ProgrammeDraft>) {
  const errors: string[] = [];
  const name = textValue(draft.name);
  const school = textValue(draft.school);
  const city = textValue(draft.city);
  const state = textValue(draft.state);
  const duration = textValue(draft.duration);
  const credential = textValue(draft.credential);
  const overview = textValue(draft.overview);
  const sourceName = textValue(draft.sourceName);
  const sourceUrl = textValue(draft.sourceUrl);
  const sourceNotes = textValue(draft.sourceNotes);
  const lastVerifiedAt = textValue(draft.lastVerifiedAt);
  const reviewAssignee = textValue(draft.reviewAssignee);
  const interests = draft.interests ?? [];
  const support = draft.support ?? [];
  const sourceChecks = draft.sourceChecks ?? [];
  const highlights = draft.highlights ?? [];
  const nextSteps = draft.nextSteps ?? [];

  if (!name.trim()) {
    errors.push('Programme name is required.');
  }

  if (!school.trim()) {
    errors.push('School is required.');
  }

  if (!city.trim()) {
    errors.push('City is required.');
  }

  if (!state.trim()) {
    errors.push('State is required.');
  }

  if (!draft.delivery || !deliveryOptions.includes(draft.delivery)) {
    errors.push('Delivery must be Campus, Hybrid, or Online.');
  }

  if (!draft.pathway || !pathwayOptions.includes(draft.pathway)) {
    errors.push('Pathway must be a supported programme pathway.');
  }

  if (
    !draft.publicationStatus ||
    !publicationStatusOptions.includes(draft.publicationStatus)
  ) {
    errors.push('Status must be Draft, In review, or Published.');
  }

  if (draft.publicationStatus === 'published' && !sourceName.trim()) {
    errors.push('Published records need a source name.');
  }

  if (draft.publicationStatus === 'published' && !lastVerifiedAt.trim()) {
    errors.push('Published records need a verification date.');
  }

  if (
    draft.publicationStatus === 'published' &&
    draft.sourceConfidence !== 'verified'
  ) {
    errors.push('Published records need verified source confidence.');
  }

  if (draft.publicationStatus === 'in-review' && !reviewAssignee.trim()) {
    errors.push('In review records need an assigned reviewer.');
  }

  if (
    !draft.sourceConfidence ||
    !sourceConfidenceOptions.includes(draft.sourceConfidence)
  ) {
    errors.push('Source confidence must be Unverified, Needs review, or Verified.');
  }

  if (
    !Array.isArray(sourceChecks) ||
    !sourceChecks.every((item) => sourceCheckOptions.includes(item))
  ) {
    errors.push('Source checks must use supported ScholarScout options.');
  }

  if (
    draft.sourceConfidence === 'verified' &&
    !sourceNotes.trim()
  ) {
    errors.push('Verified source confidence needs evidence notes.');
  }

  if (draft.publicationStatus === 'published') {
    const missingChecks = getMissingSourceCheckLabels(sourceChecks);

    if (missingChecks.length > 0) {
      errors.push(
        `Published records need verified source checks for ${missingChecks.join(', ')}.`,
      );
    }
  }

  if (sourceUrl && !isHttpUrl(sourceUrl)) {
    errors.push('Source URL must start with http:// or https://.');
  }

  if (!Array.isArray(interests) || !interests.every((interest) => interestOptions.includes(interest))) {
    errors.push('Interest areas must use supported ScholarScout options.');
  }

  if (!Array.isArray(support) || !support.every((item) => supportOptions.includes(item))) {
    errors.push('Support services must use supported ScholarScout options.');
  }

  if (!Number.isFinite(draft.annualTuition) || Number(draft.annualTuition) < 0) {
    errors.push('Annual tuition must be zero or higher.');
  }

  if (!isPercent(draft.acceptanceRate)) {
    errors.push('Entry flexibility must be between 0 and 100.');
  }

  if (!isPercent(draft.matchScore)) {
    errors.push('Fit score must be between 0 and 100.');
  }

  if (!duration.trim()) {
    errors.push('Duration is required.');
  }

  if (!credential.trim()) {
    errors.push('Credential is required.');
  }

  if (!overview.trim()) {
    errors.push('Overview is required.');
  }

  if (!Array.isArray(highlights) || highlights.length === 0) {
    errors.push('Add at least one comparison highlight.');
  }

  if (!Array.isArray(nextSteps) || nextSteps.length === 0) {
    errors.push('Add at least one practical next step.');
  }

  return errors;
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function isPercent(value: unknown) {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100
  );
}

function textValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function compareText(
  key: ProgrammeConflictField,
  label: string,
  currentValue: string,
  attemptedValue: string,
) {
  const current = currentValue || 'Not set';
  const attempted = attemptedValue || 'Not set';

  if (current === attempted) {
    return null;
  }

  return {
    key,
    label,
    currentValue: current,
    attemptedValue: attempted,
  };
}

function formatLocation(programme: ProgrammeDraft) {
  return `${programme.city}, ${programme.state}`;
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString()}`;
}

function diffProgrammeListItems(
  currentValues: string[],
  attemptedValues: string[],
): ProgrammeListDiffItem[] {
  const normalizedCurrent = normalizeListValues(currentValues);
  const normalizedAttempted = normalizeListValues(attemptedValues);
  const currentLookup = new Map(
    normalizedCurrent.map((value) => [normalizeListKey(value), value]),
  );
  const attemptedLookup = new Map(
    normalizedAttempted.map((value) => [normalizeListKey(value), value]),
  );
  const allKeys = Array.from(
    new Set([...currentLookup.keys(), ...attemptedLookup.keys()]),
  );

  return allKeys.map((key) => {
    const current = currentLookup.get(key);
    const attempted = attemptedLookup.get(key);

    if (current && attempted) {
      return { value: attempted, status: 'unchanged' };
    }

    if (attempted) {
      return { value: attempted, status: 'added' };
    }

    return { value: current ?? key, status: 'removed' };
  });
}

function normalizeListValues(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean);
}

function normalizeListKey(value: string) {
  return value.trim().toLowerCase();
}

function mergeListValues(
  currentValues: string[],
  attemptedValues: string[],
  selections: ProgrammeListItemMergeSelection[],
) {
  const selectedAdded = new Set(
    selections
      .filter((selection) => selection.status === 'added')
      .map((selection) => normalizeListKey(selection.value)),
  );
  const selectedRemoved = new Set(
    selections
      .filter((selection) => selection.status === 'removed')
      .map((selection) => normalizeListKey(selection.value)),
  );
  const attempted = normalizeListValues(attemptedValues).filter(
    (value) => !selectedAdded.has(normalizeListKey(value)),
  );
  const attemptedKeys = new Set(attempted.map((value) => normalizeListKey(value)));
  const restored = normalizeListValues(currentValues).filter((value) => {
    const key = normalizeListKey(value);
    return selectedRemoved.has(key) && !attemptedKeys.has(key);
  });

  return [...attempted, ...restored];
}

function formatSourceChecks(values: ProgrammeSourceCheck[]) {
  const checks = normalizeSourceChecks(values);

  if (checks.length === 0) {
    return 'Not set';
  }

  return checks.map((check) => sourceCheckLabels[check]).join(', ');
}

function normalizeSourceChecks(values: ProgrammeSourceCheck[]) {
  return Array.from(
    new Set(values.filter((value) => sourceCheckOptions.includes(value))),
  );
}

function isProgrammeDraft(value: unknown): value is ProgrammeDraft {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const draft = value as Partial<ProgrammeDraft>;

  return Boolean(
    draft.id &&
      draft.name &&
      draft.school &&
      draft.city &&
      draft.state &&
      draft.delivery &&
      draft.pathway &&
      Array.isArray(draft.interests) &&
      Array.isArray(draft.support) &&
      Array.isArray(draft.highlights) &&
      Array.isArray(draft.nextSteps),
  );
}

export const deliveryOptions: Programme['delivery'][] = [
  'Campus',
  'Hybrid',
  'Online',
];

export const pathwayOptions: ProgrammePathway[] = [
  '4-year-university',
  '2-year-community-college',
  'trade-vocational',
  'certificate-program',
  'apprenticeship',
  'online-degree',
];

export const publicationStatusOptions: ProgrammePublicationStatus[] = [
  'draft',
  'in-review',
  'published',
];

export const publicationStatusLabels: Record<
  ProgrammePublicationStatus,
  string
> = {
  draft: 'Draft',
  'in-review': 'In review',
  published: 'Published',
};

export const sourceConfidenceOptions: ProgrammeSourceConfidence[] = [
  'unverified',
  'needs-review',
  'verified',
];

export const sourceConfidenceLabels: Record<ProgrammeSourceConfidence, string> = {
  unverified: 'Unverified',
  'needs-review': 'Needs review',
  verified: 'Verified',
};

export const sourceCheckOptions: ProgrammeSourceCheck[] = [
  'tuition',
  'credential',
  'duration',
  'delivery',
  'support',
  'next-steps',
];

export const sourceCheckLabels: Record<ProgrammeSourceCheck, string> = {
  tuition: 'Tuition',
  credential: 'Credential',
  duration: 'Duration',
  delivery: 'Delivery mode',
  support: 'Support services',
  'next-steps': 'Next steps',
};

export function getMissingSourceCheckLabels(
  sourceChecks: ProgrammeSourceCheck[] = [],
) {
  const selected = new Set(sourceChecks);
  return sourceCheckOptions
    .filter((check) => !selected.has(check))
    .map((check) => sourceCheckLabels[check]);
}

export const interestOptions: Interest[] = [
  'stem',
  'arts',
  'business',
  'education',
  'healthcare',
  'trades',
  'social-sciences',
  'law',
  'sports',
  'technology',
  'environment',
  'undecided',
];

export const supportOptions: SupportNeed[] = [
  'financial-aid',
  'first-gen',
  'disability-services',
  'mental-health',
  'tutoring',
  'career-counseling',
  'housing',
  'childcare',
  'language-support',
  'none',
];

export function getProgrammeRevisionLabel(programme: ProgrammeDraft) {
  return `Rev ${programme.revision ?? 0}`;
}

export function getProgrammeReviewReadiness(programme: ProgrammeDraft) {
  const issues = validateProgrammeDraft({
    ...programme,
    publicationStatus: 'published',
  });

  return {
    isReady: issues.length === 0,
    issues,
  };
}
