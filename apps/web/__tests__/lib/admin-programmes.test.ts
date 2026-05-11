import {
  createProgrammeDraft,
  getProgrammeAuditActionLabel,
  getProgrammeConflictComparisons,
  getProgrammeListDiffs,
  getProgrammeListDiffSummary,
  getMissingSourceCheckLabels,
  getProgrammeReviewReadiness,
  getProgrammeRevisionLabel,
  mergeProgrammeConflictFields,
  mergeProgrammeGuidanceEdits,
  mergeProgrammeListDiffItems,
  getPublishedProgrammeRecords,
  getRecentProgrammeAuditEvents,
  mergeProgrammeDrafts,
  parseProgrammeDrafts,
  prepareProgrammeDraft,
  removeProgrammeDraft,
  serializeProgrammeDrafts,
  sourceCheckOptions,
  slugifyProgrammeId,
  splitCsv,
  upsertProgrammeDraft,
  validateProgrammeDraft,
} from '@/lib/admin-programmes';
import { programmes } from '@/lib/programmes';

describe('admin programme helpers', () => {
  it('creates stable slugs from school and programme names', () => {
    expect(slugifyProgrammeId('Nursing Pathway!', 'North Valley')).toBe(
      'north-valley-nursing-pathway',
    );
  });

  it('splits comma-separated content into clean values', () => {
    expect(splitCsv(' One, Two ,, Three ')).toEqual(['One', 'Two', 'Three']);
  });

  it('serializes and parses valid drafts', () => {
    const draft = {
      ...createProgrammeDraft(),
      id: 'test-programme',
      name: 'Test Programme',
      school: 'Test College',
      city: 'Denver',
      state: 'co',
    };
    const parsed = parseProgrammeDrafts(serializeProgrammeDrafts([draft]));

    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe('test-programme');
  });

  it('prepares drafts by creating ids and clamping numeric values', () => {
    const prepared = prepareProgrammeDraft({
      ...createProgrammeDraft(),
      name: 'Design Certificate',
      school: 'Metro Arts',
      city: 'Austin',
      state: 'tx',
      annualTuition: -10,
      acceptanceRate: 104,
      matchScore: -4,
      highlights: [' Studio ', ''],
      nextSteps: [' Review portfolio '],
    });

    expect(prepared.id).toBe('metro-arts-design-certificate');
    expect(prepared.state).toBe('TX');
    expect(prepared.annualTuition).toBe(0);
    expect(prepared.acceptanceRate).toBe(100);
    expect(prepared.matchScore).toBe(0);
    expect(prepared.highlights).toEqual(['Studio']);
    expect(prepared.nextSteps).toEqual(['Review portfolio']);
  });

  it('validates governed programme records before they are saved', () => {
    const draft = prepareProgrammeDraft({
      ...createProgrammeDraft(),
      name: 'Design Certificate',
      school: 'Metro Arts',
      city: 'Austin',
      state: 'tx',
      duration: '9 months',
      credential: 'Certificate',
      overview: 'A practical design certificate with portfolio support.',
      interests: ['arts'],
      support: ['career-counseling'],
      highlights: ['Portfolio coaching'],
      nextSteps: ['Compare portfolio requirements'],
    });

    expect(validateProgrammeDraft(draft)).toEqual([]);
  });

  it('requires source metadata before governed records can publish', () => {
    const draft = prepareProgrammeDraft({
      ...createProgrammeDraft(),
      publicationStatus: 'published',
      name: 'Design Certificate',
      school: 'Metro Arts',
      city: 'Austin',
      state: 'tx',
      duration: '9 months',
      credential: 'Certificate',
      overview: 'A practical design certificate with portfolio support.',
      interests: ['arts'],
      support: ['career-counseling'],
      highlights: ['Portfolio coaching'],
      nextSteps: ['Compare portfolio requirements'],
    });

    expect(validateProgrammeDraft(draft)).toEqual(
      expect.arrayContaining([
        'Published records need a source name.',
        'Published records need a verification date.',
        'Published records need verified source confidence.',
      ]),
    );
  });

  it('requires evidence notes when source confidence is verified', () => {
    const draft = prepareProgrammeDraft({
      ...createProgrammeDraft(),
      sourceConfidence: 'verified',
      name: 'Design Certificate',
      school: 'Metro Arts',
      city: 'Austin',
      state: 'tx',
      duration: '9 months',
      credential: 'Certificate',
      overview: 'A practical design certificate with portfolio support.',
      interests: ['arts'],
      support: ['career-counseling'],
      highlights: ['Portfolio coaching'],
      nextSteps: ['Compare portfolio requirements'],
    });

    expect(validateProgrammeDraft(draft)).toEqual(
      expect.arrayContaining([
        'Verified source confidence needs evidence notes.',
      ]),
    );
  });

  it('marks sourced records as ready for publishing review', () => {
    const draft = prepareProgrammeDraft({
      ...createProgrammeDraft(),
      publicationStatus: 'draft',
      sourceName: 'School catalogue',
      sourceConfidence: 'verified',
      sourceNotes: 'Checked tuition, duration, support services, and credential.',
      sourceChecks: sourceCheckOptions,
      lastVerifiedAt: '2026-05-04',
      name: 'Design Certificate',
      school: 'Metro Arts',
      city: 'Austin',
      state: 'tx',
      duration: '9 months',
      credential: 'Certificate',
      overview: 'A practical design certificate with portfolio support.',
      interests: ['arts'],
      support: ['career-counseling'],
      highlights: ['Portfolio coaching'],
      nextSteps: ['Compare portfolio requirements'],
    });

    expect(getProgrammeReviewReadiness(draft)).toEqual({
      isReady: true,
      issues: [],
    });
  });

  it('reports missing structured source checks before publishing', () => {
    const draft = prepareProgrammeDraft({
      ...createProgrammeDraft(),
      publicationStatus: 'published',
      sourceName: 'School catalogue',
      sourceConfidence: 'verified',
      sourceNotes: 'Checked source material.',
      sourceChecks: ['tuition', 'credential'],
      lastVerifiedAt: '2026-05-04',
      name: 'Design Certificate',
      school: 'Metro Arts',
      city: 'Austin',
      state: 'tx',
      duration: '9 months',
      credential: 'Certificate',
      overview: 'A practical design certificate with portfolio support.',
      interests: ['arts'],
      support: ['career-counseling'],
      highlights: ['Portfolio coaching'],
      nextSteps: ['Compare portfolio requirements'],
    });

    expect(validateProgrammeDraft(draft)).toEqual(
      expect.arrayContaining([
        'Published records need verified source checks for Duration, Delivery mode, Support services, Next steps.',
      ]),
    );
    expect(getMissingSourceCheckLabels(draft.sourceChecks)).toEqual([
      'Duration',
      'Delivery mode',
      'Support services',
      'Next steps',
    ]);
  });

  it('requires an assigned reviewer for records in review', () => {
    const draft = prepareProgrammeDraft({
      ...createProgrammeDraft(),
      publicationStatus: 'in-review',
      name: 'Design Certificate',
      school: 'Metro Arts',
      city: 'Austin',
      state: 'tx',
      duration: '9 months',
      credential: 'Certificate',
      overview: 'A practical design certificate with portfolio support.',
      interests: ['arts'],
      support: ['career-counseling'],
      highlights: ['Portfolio coaching'],
      nextSteps: ['Compare portfolio requirements'],
    });

    expect(validateProgrammeDraft(draft)).toEqual(
      expect.arrayContaining([
        'In review records need an assigned reviewer.',
      ]),
    );
  });

  it('prepares reviewer handoff fields for governed records', () => {
    const draft = prepareProgrammeDraft({
      ...createProgrammeDraft(),
      reviewAssignee: ' Advising Lead ',
      reviewNotes: ' Confirm tuition before publishing. ',
    });

    expect(draft.reviewAssignee).toBe('Advising Lead');
    expect(draft.reviewNotes).toBe('Confirm tuition before publishing.');
  });

  it('labels governed record revisions for staff conflict awareness', () => {
    expect(getProgrammeRevisionLabel({ ...programmes[0], revision: 3 })).toBe(
      'Rev 3',
    );
    expect(getProgrammeRevisionLabel(programmes[0])).toBe('Rev 0');
  });

  it('builds comparison rows for stale programme edit recovery', () => {
    const currentRecord = {
      ...programmes[0],
      name: 'Latest Health Sciences',
      annualTuition: 6200,
      revision: 4,
    };
    const attemptedRecord = {
      ...programmes[0],
      name: 'Edited Health Sciences',
      annualTuition: 5800,
      revision: 3,
    };

    expect(getProgrammeConflictComparisons(currentRecord, attemptedRecord)).toEqual(
      expect.arrayContaining([
        {
          key: 'name',
          label: 'Programme',
          currentValue: 'Latest Health Sciences',
          attemptedValue: 'Edited Health Sciences',
        },
        {
          key: 'annualTuition',
          label: 'Tuition',
          currentValue: '$6,200',
          attemptedValue: '$5,800',
        },
      ]),
    );
  });

  it('merges selected latest fields into stale programme edits', () => {
    const currentRecord = {
      ...programmes[0],
      city: 'Updated City',
      state: 'WA',
      annualTuition: 6200,
      revision: 4,
    };
    const attemptedRecord = {
      ...programmes[0],
      city: 'Draft City',
      state: 'OR',
      annualTuition: 5800,
      revision: 3,
    };

    const merged = mergeProgrammeConflictFields(currentRecord, attemptedRecord, [
      'location',
    ]);

    expect(merged.city).toBe('Updated City');
    expect(merged.state).toBe('WA');
    expect(merged.annualTuition).toBe(5800);
    expect(merged.revision).toBe(4);
  });

  it('builds list diffs for highlights and next steps', () => {
    const currentRecord = {
      ...programmes[0],
      highlights: ['Clinical observation', 'Transfer pathway'],
      nextSteps: ['Review health prerequisite courses', 'Ask about labs'],
    };
    const attemptedRecord = {
      ...programmes[0],
      highlights: ['Clinical observation', 'Peer tutoring'],
      nextSteps: ['Ask about labs', 'Compare scholarship deadlines'],
    };

    const diffs = getProgrammeListDiffs(currentRecord, attemptedRecord);

    expect(diffs).toEqual([
      {
        key: 'highlights',
        label: 'Highlights',
        items: [
          { value: 'Clinical observation', status: 'unchanged' },
          { value: 'Transfer pathway', status: 'removed' },
          { value: 'Peer tutoring', status: 'added' },
        ],
      },
      {
        key: 'nextSteps',
        label: 'Next steps',
        items: [
          { value: 'Review health prerequisite courses', status: 'removed' },
          { value: 'Ask about labs', status: 'unchanged' },
          { value: 'Compare scholarship deadlines', status: 'added' },
        ],
      },
    ]);
    expect(getProgrammeListDiffSummary(diffs[0])).toBe(
      '1 added, 1 removed, 1 unchanged',
    );
  });

  it('merges selected latest list items into stale programme edits', () => {
    const currentRecord = {
      ...programmes[0],
      highlights: ['Clinical observation', 'Transfer pathway'],
      nextSteps: ['Review prerequisites', 'Ask about labs'],
      revision: 4,
    };
    const attemptedRecord = {
      ...programmes[0],
      highlights: ['Clinical observation', 'Peer tutoring'],
      nextSteps: ['Ask about labs', 'Compare scholarship deadlines'],
      revision: 3,
    };

    const merged = mergeProgrammeListDiffItems(currentRecord, attemptedRecord, [
      {
        list: 'highlights',
        value: 'Transfer pathway',
        status: 'removed',
      },
      {
        list: 'highlights',
        value: 'Peer tutoring',
        status: 'added',
      },
      {
        list: 'nextSteps',
        value: 'Review prerequisites',
        status: 'removed',
      },
    ]);

    expect(merged.highlights).toEqual([
      'Clinical observation',
      'Transfer pathway',
    ]);
    expect(merged.nextSteps).toEqual([
      'Ask about labs',
      'Compare scholarship deadlines',
      'Review prerequisites',
    ]);
    expect(merged.revision).toBe(4);
  });

  it('applies inline guidance edits to the latest programme revision', () => {
    const currentRecord = {
      ...programmes[0],
      overview: 'Latest overview with updated cost and support details.',
      highlights: ['Latest support', 'Flexible schedule'],
      nextSteps: ['Confirm programme dates'],
      revision: 4,
    };
    const attemptedRecord = {
      ...programmes[0],
      overview: 'Draft overview.',
      highlights: [' Draft support ', ''],
      nextSteps: [' Ask about advising ', 'Compare costs'],
      revision: 3,
    };

    const merged = mergeProgrammeGuidanceEdits(currentRecord, attemptedRecord, {
      overview: ' Updated practical overview. ',
      highlights: [' Draft support ', 'Peer mentoring', ''],
      nextSteps: [' Ask about advising ', 'Compare costs'],
    });

    expect(merged.overview).toBe('Updated practical overview.');
    expect(merged.highlights).toEqual(['Draft support', 'Peer mentoring']);
    expect(merged.nextSteps).toEqual(['Ask about advising', 'Compare costs']);
    expect(merged.revision).toBe(4);
  });

  it('keeps only published governed records in public programme data', () => {
    const draft = {
      ...programmes[0],
      id: 'draft-record',
      publicationStatus: 'draft' as const,
    };
    const review = {
      ...programmes[0],
      id: 'review-record',
      publicationStatus: 'in-review' as const,
    };
    const published = {
      ...programmes[0],
      id: 'published-record',
      publicationStatus: 'published' as const,
    };

    expect(getPublishedProgrammeRecords([draft, review, published])).toEqual([
      published,
    ]);
  });

  it('orders recent programme audit events newest first', () => {
    const events = [
      {
        id: 'older',
        action: 'create',
        entityId: 'one',
        actorLabel: 'Staff account',
        createdAt: '2026-05-01T12:00:00.000Z',
      },
      {
        id: 'newer',
        action: 'update',
        entityId: 'two',
        actorLabel: 'Staff account',
        createdAt: '2026-05-02T12:00:00.000Z',
      },
    ];

    expect(getRecentProgrammeAuditEvents(events, 1)).toEqual([events[1]]);
  });

  it('labels programme audit actions for staff review', () => {
    expect(getProgrammeAuditActionLabel('create')).toBe('Created');
    expect(getProgrammeAuditActionLabel('update')).toBe('Updated');
    expect(getProgrammeAuditActionLabel('delete')).toBe('Deleted');
    expect(getProgrammeAuditActionLabel('unknown')).toBe('Changed');
  });

  it('returns practical validation errors for incomplete governed records', () => {
    const errors = validateProgrammeDraft({
      ...createProgrammeDraft(),
      annualTuition: -1,
      acceptanceRate: 120,
      matchScore: -1,
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        'Programme name is required.',
        'School is required.',
        'Annual tuition must be zero or higher.',
        'Entry flexibility must be between 0 and 100.',
        'Fit score must be between 0 and 100.',
        'Add at least one practical next step.',
      ]),
    );
  });

  it('upserts and removes local drafts', () => {
    const draft = {
      ...createProgrammeDraft(),
      id: 'draft-one',
      name: 'Draft One',
      school: 'Test College',
      city: 'Denver',
      state: 'CO',
    };
    const added = upsertProgrammeDraft([], draft);
    const updated = upsertProgrammeDraft(added, {
      ...draft,
      name: 'Updated Draft',
    });

    expect(updated).toHaveLength(1);
    expect(updated[0].name).toBe('Updated Draft');
    expect(removeProgrammeDraft(updated, 'draft-one')).toEqual([]);
  });

  it('merges drafts ahead of seed records and overrides matching ids', () => {
    const override = { ...programmes[0], name: 'Edited Local Name' };
    const merged = mergeProgrammeDrafts(programmes, [override]);

    expect(merged[0].name).toBe('Edited Local Name');
    expect(merged.filter((programme) => programme.id === override.id)).toHaveLength(1);
  });
});
