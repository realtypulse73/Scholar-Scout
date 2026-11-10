import {
  getPhase13PreviewIllustrationFixtureRecords,
  isPhase13PreviewIllustrationFixtureEnabled,
  withPhase13PreviewIllustrationFixture,
} from '@/lib/server/phase13-preview-illustration-fixture';

describe('Phase 13 Preview illustration fixture', () => {
  const previewEnvironment = {
    VERCEL_ENV: 'preview',
    SCHOLARSCOUT_PHASE13_UAT_FIXTURE: 'true',
  };

  it('requires both the Preview runtime and an explicit fixture opt-in', () => {
    expect(isPhase13PreviewIllustrationFixtureEnabled(previewEnvironment)).toBe(true);
    expect(isPhase13PreviewIllustrationFixtureEnabled({
      VERCEL_ENV: 'production',
      SCHOLARSCOUT_PHASE13_UAT_FIXTURE: 'true',
    })).toBe(false);
    expect(isPhase13PreviewIllustrationFixtureEnabled({ VERCEL_ENV: 'preview' })).toBe(false);
  });

  it('provides only original, disclosed illustration records that can be replaced by normal media later', () => {
    const records = getPhase13PreviewIllustrationFixtureRecords();

    expect(records).toHaveLength(2);
    expect(records.every((record) => record.title.startsWith('Preview test fixture'))).toBe(true);
    expect(records.every((record) => record.renderableMedia?.kind === 'illustration')).toBe(true);
    expect(records.every((record) => {
      const media = record.renderableMedia;
      return media?.kind === 'illustration'
        && media.disclosure === 'AI-generated illustration — not an official campus photograph';
    })).toBe(true);
    expect(records.every((record) => record.claimBoundary.includes('not an institution'))).toBe(true);
    expect(records.every((record) => record.facts.location.evidence.authority === 'scholarscout-preview-fixture')).toBe(true);
    expect(records.every((record) => record.mediaFallback === false)).toBe(true);
  });

  it('never changes an ordinary Preview, production, or empty snapshot without the explicit opt-in', () => {
    const snapshot = { status: 'empty' as const, records: [] };

    expect(withPhase13PreviewIllustrationFixture(snapshot, { VERCEL_ENV: 'production', SCHOLARSCOUT_PHASE13_UAT_FIXTURE: 'true' })).toEqual(snapshot);
    expect(withPhase13PreviewIllustrationFixture(snapshot, { VERCEL_ENV: 'preview' })).toEqual(snapshot);
  });

  it('adds the two cards only to the opted-in Preview response and preserves existing reviewed records', () => {
    const existing = getPhase13PreviewIllustrationFixtureRecords()[0];
    const snapshot = {
      status: 'published' as const,
      snapshotId: 'reviewed-snapshot',
      version: 7,
      records: [existing],
    };

    const result = withPhase13PreviewIllustrationFixture(snapshot, previewEnvironment);

    expect(result).toMatchObject({
      status: 'published',
      snapshotId: 'reviewed-snapshot:phase13-preview-illustration-fixture',
      version: 7,
    });
    expect(result.records.map((record) => record.id)).toEqual([
      existing.id,
      'preview-fixture:applied-health-illustration',
      'preview-fixture:technology-systems-illustration',
    ]);
  });
});
