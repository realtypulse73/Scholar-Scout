import {
  createCoverageKey,
  getFreshnessStatus,
  isWithinLocalFocus,
  validateCatalogueRegion,
  validateCoverageMatrix,
  type CatalogueCoverage,
  type CatalogueRegion,
} from '@/lib/catalogue-contract';

const region: CatalogueRegion = {
  id: 'greater-kingston-jamaica',
  label: 'Greater Kingston, Jamaica',
  officialBoundary: {
    authority: 'statin-kingston-metropolitan-area',
    boundaryId: null,
    boundaryVersion: 'STATIN KMA communities and population',
    sourceLabel: 'STATIN Kingston Metropolitan Area',
    sourceUrl: 'https://statinja.gov.jm/maps/kmacommunitiesandpopulation.html',
    sourceDate: { state: 'unavailable', value: null },
    checkedAt: '2026-09-22',
  },
  localFocus: {
    authority: 'Kingston and St. Andrew Municipal Corporation',
    anchorLabel: 'Kingston and St. Andrew Municipal Corporation',
    latitude: 17.9714,
    longitude: -76.7921,
    radiusMiles: 10,
    sourceLabel: 'KSAMC contact details',
    sourceUrl: 'https://www.ksamc.gov.jm/contact-us',
    sourceDate: { state: 'documented', value: '2026-09-22' },
    checkedAt: '2026-09-22',
  },
};

const coverage: CatalogueCoverage = {
  regionId: region.id,
  pathway: 'university',
  state: 'not-yet-verified',
  reviewedAt: '2026-09-22',
};

describe('catalogue contract', () => {
  it('proves one source-dated region-to-coverage path without treating an unavailable boundary date as current', () => {
    expect(validateCatalogueRegion(region)).toEqual([]);
    expect(createCoverageKey(coverage.regionId, coverage.pathway)).toBe(
      'greater-kingston-jamaica:university',
    );
    expect(validateCoverageMatrix([region], [coverage])).toHaveLength(5);
    expect(getFreshnessStatus(region.officialBoundary, 'boundary', new Date('2026-09-22')))
      .toBe('unknown');
  });

  it('accepts a location at the documented local-focus anchor', () => {
    expect(isWithinLocalFocus(region.localFocus, {
      latitude: region.localFocus.latitude,
      longitude: region.localFocus.longitude,
    })).toBe(true);
  });
});
