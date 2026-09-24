import {
  buildCatalogueDetailHref,
  buildCatalogueDiscoveryModel,
  parseCatalogueDiscoveryFilters,
} from '@/lib/catalogue-discovery';
import type { CataloguePublishedRecord } from '@/lib/catalogue-publication';

const record = (id: string, title = id): CataloguePublishedRecord => ({
  id,
  revision: 1,
  title,
  regionId: 'greater-houston',
  region: {
    id: 'greater-houston', label: 'Greater Houston',
    officialBoundary: { authority: 'us-census-omb-cbsa', boundaryId: '26420', boundaryVersion: '2023', sourceLabel: 'Boundary source', sourceUrl: 'https://example.edu/boundary', sourceDate: { state: 'documented', value: '2026-09-01' }, checkedAt: '2026-09-20' },
    localFocus: { authority: 'City', anchorLabel: 'City Hall', latitude: 29.76, longitude: -95.36, radiusMiles: 10, sourceLabel: 'City source', sourceUrl: 'https://example.edu/city', sourceDate: { state: 'documented', value: '2026-09-01' }, checkedAt: '2026-09-20' },
  },
  source: { sourceLabel: 'Official programme source', sourceUrl: 'https://example.edu/programme', sourceDate: { state: 'documented', value: '2026-09-20' }, checkedAt: '2026-09-20' },
  facts: { location: fact('Houston, Texas'), pathway: fact('trade-career-school'), skillTaught: fact('Welding'), trainingPayer: fact('Student'), costOrTuition: fact('$500'), duration: fact('12 weeks'), delivery: fact('in-person') },
  claimBoundary: 'Factual programme details from the official source.', mediaFallback: false,
});

function fact<T>(value: T) {
  return { value, evidence: { status: 'current' as const, authority: 'provider-official' as const, sourceLabel: 'Official programme source', sourceUrl: 'https://example.edu/programme', sourceDate: { state: 'documented' as const, value: '2026-09-20' }, reviewedAt: '2026-09-20', verificationAction: 'Verify on the official programme page.' } };
}

describe('catalogue discovery model', () => {
  it('maps stored public records only with factual source evidence and stable public order', () => {
    const model = buildCatalogueDiscoveryModel({ records: [record('catalogue:z'), record('catalogue:a')], searchParams: { metro: 'greater-houston' }, now: new Date('2026-09-23T00:00:00.000Z') });
    expect(model.items.map((item) => item.id)).toEqual(['catalogue:a', 'catalogue:z']);
    expect(model.items[0]).toMatchObject({ providerTitle: 'catalogue:a', regionId: 'greater-houston', pathway: 'trade-career-school', officialVerificationUrl: 'https://example.edu/programme', mediaState: 'reserved-for-rights-review', source: { label: 'Official programme source', state: 'current' } });
    expect(model.items[0].facts.skillTaught).toMatchObject({ value: 'Welding', state: 'current' });
  });

  it('derives at most three neutral factual reasons from reviewed public facts with their original evidence', () => {
    const reviewed = record('catalogue:reasons');
    reviewed.facts.skillTaught = {
      value: 'Welding',
      evidence: {
        ...fact('Welding').evidence,
        status: 'needs-confirmation',
        verificationAction: 'Confirm welding training directly with the provider.',
      },
    };
    reviewed.facts.delivery = {
      value: 'hybrid',
      evidence: {
        ...fact('hybrid').evidence,
        status: 'unknown',
        verificationAction: 'Ask the provider how hybrid delivery works.',
      },
    };

    const [item] = buildCatalogueDiscoveryModel({
      records: [reviewed],
      searchParams: { metro: 'greater-houston' },
    }).items;

    expect(item.reasonsToConsider).toEqual([
      expect.objectContaining({
        label: 'Skill taught',
        value: 'Welding',
        state: 'needs-confirmation',
        evidence: expect.objectContaining({
          sourceLabel: 'Official programme source',
          verificationAction: 'Confirm welding training directly with the provider.',
        }),
      }),
      expect.objectContaining({
        label: 'Delivery',
        value: 'hybrid',
        state: 'unknown',
        evidence: expect.objectContaining({
          sourceLabel: 'Official programme source',
          verificationAction: 'Ask the provider how hybrid delivery works.',
        }),
      }),
      expect.objectContaining({ label: 'Training payer', value: 'Student' }),
    ]);
    expect(item.reasonsToConsider).toHaveLength(3);
    expect(item.reasonsToConsider.map((reason) => reason.label)).not.toContain('Cost or tuition');
  });

  it('keeps reasons empty when the reviewed public record has no reason-eligible values', () => {
    const unavailable = record('catalogue:unavailable');
    unavailable.facts.skillTaught = { value: null, evidence: fact('unused').evidence };
    unavailable.facts.delivery = { value: null, evidence: fact('unused').evidence };
    unavailable.facts.trainingPayer = { value: null, evidence: fact('unused').evidence };

    const [item] = buildCatalogueDiscoveryModel({
      records: [unavailable],
      searchParams: { metro: 'greater-houston' },
    }).items;

    expect(item.reasonsToConsider).toEqual([]);
  });

  it('only accepts controlled filter keys and values', () => {
    expect(parseCatalogueDiscoveryFilters({ metro: 'not-a-place', pathway: 'unknown', delivery: 'teleport', status: 'bad', q: ['one', 'two'], page: '0', profile: 'private', score: '99' })).toEqual({ metro: 'greater-houston', pathway: 'all', delivery: 'all', status: 'all', q: '', page: 1 });
  });

  it('keeps all pathway coverage visible and explains both snapshot and filter empty states', () => {
    const empty = buildCatalogueDiscoveryModel({ records: [], searchParams: { metro: 'greater-houston' } });
    expect(empty.coverage).toHaveLength(6);
    expect(empty.emptyState).toBe('reviewed-snapshot-empty');
    const filtered = buildCatalogueDiscoveryModel({ records: [record('catalogue:a')], searchParams: { metro: 'greater-houston', pathway: 'university' } });
    expect(filtered.items).toEqual([]);
    expect(filtered.emptyState).toBe('filters-empty');
    expect(filtered.resetHref).toBe('/programmes?metro=greater-houston');
  });

  it('builds a canonical detail return link from controlled filters only', () => {
    const filters = parseCatalogueDiscoveryFilters({
      metro: 'greater-houston', pathway: 'trade-career-school', q: 'welding', profile: 'ignored',
    });
    expect(buildCatalogueDetailHref('catalogue:one', filters)).toBe(
      '/programmes/catalogue%3Aone?metro=greater-houston&pathway=trade-career-school&q=welding',
    );
  });
});
