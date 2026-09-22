import {
  CATALOGUE_PATHWAYS,
  CATALOGUE_REGION_IDS,
  getFreshnessStatus,
  validateCatalogueRegion,
  validateCoverageMatrix,
  type CatalogueCoverage,
} from '@/lib/catalogue-contract';
import {
  catalogueCoverage,
  catalogueRegions,
} from '@/lib/catalogue-fixtures';

const censusBoundaryUrl = 'https://www.census.gov/geographies/reference-maps/2023/geo/cbsa.html';
const checkedAt = '2026-09-22';

const expectedRegions = [
  {
    id: 'greater-houston',
    label: 'Greater Houston',
    boundaryId: '26420',
    anchorLabel: 'City of Houston City Hall — 901 Bagby, Houston, TX 77002',
    anchorUrl: 'https://houstontx.gov/contactus/',
  },
  {
    id: 'greater-chicago',
    label: 'Greater Chicago',
    boundaryId: '16980',
    anchorLabel: 'Chicago City Hall — 121 N LaSalle Street, Chicago, IL 60602',
    anchorUrl: 'https://311.chicago.gov/',
  },
  {
    id: 'greater-buffalo',
    label: 'Greater Buffalo',
    boundaryId: '15380',
    anchorLabel: 'Buffalo City Hall — 65 Niagara Square, Buffalo, NY 14202',
    anchorUrl: 'https://www.buffalony.gov/m/directory/department?did=114',
  },
  {
    id: 'greater-atlanta',
    label: 'Greater Atlanta',
    boundaryId: '12060',
    anchorLabel: 'Atlanta City Hall Annex — 55 Trinity Avenue SW, Atlanta, GA 30303',
    anchorUrl: 'https://www.atlantaga.gov/residents/city-hall',
  },
  {
    id: 'greater-new-orleans',
    label: 'Greater New Orleans',
    boundaryId: '35380',
    anchorLabel: 'New Orleans City Hall — 1300 Perdido Street, New Orleans, LA 70112',
    anchorUrl: 'https://nola.gov/contact-us/',
  },
] as const;

describe('catalogue regional fixtures', () => {
  it('freezes the six approved source-bearing regions in controlled order', () => {
    expect(catalogueRegions.map((region) => region.id)).toEqual(CATALOGUE_REGION_IDS);
    expect(catalogueRegions).toHaveLength(6);

    for (const expected of expectedRegions) {
      const region = catalogueRegions.find((candidate) => candidate.id === expected.id);

      expect(region).toMatchObject({
        id: expected.id,
        label: expected.label,
        officialBoundary: {
          authority: 'us-census-omb-cbsa',
          boundaryId: expected.boundaryId,
          boundaryVersion: 'OMB July 2023 delineation',
          sourceUrl: censusBoundaryUrl,
          sourceDate: { state: 'unavailable', value: null },
          checkedAt,
        },
        localFocus: {
          anchorLabel: expected.anchorLabel,
          sourceUrl: expected.anchorUrl,
          sourceDate: { state: 'unavailable', value: null },
          checkedAt,
          radiusMiles: 10,
        },
      });
      expect(region?.officialBoundary).not.toBe(region?.localFocus);
      expect(validateCatalogueRegion(region!)).toEqual([]);
    }
  });

  it('keeps Kingston under STATIN KMA authority without a U.S. CBSA identifier', () => {
    const kingston = catalogueRegions.find((region) => region.id === 'greater-kingston-jamaica');

    expect(kingston).toMatchObject({
      id: 'greater-kingston-jamaica',
      label: 'Greater Kingston, Jamaica',
      officialBoundary: {
        authority: 'statin-kingston-metropolitan-area',
        boundaryId: null,
        boundaryVersion: 'STATIN KMA communities and population',
        sourceUrl: 'https://statinja.gov.jm/maps/kmacommunitiesandpopulation.html',
        sourceDate: { state: 'unavailable', value: null },
        checkedAt,
      },
      localFocus: {
        anchorLabel: 'Kingston & St. Andrew Municipal Corporation — 24 Church Street, Kingston, Jamaica',
        sourceUrl: 'https://www.ksamc.gov.jm/contact-us',
        sourceDate: { state: 'unavailable', value: null },
        checkedAt,
        radiusMiles: 10,
      },
    });
    expect(validateCatalogueRegion(kingston!)).toEqual([]);
  });

  it('keeps an out-of-policy boundary source date non-current under an injected clock', () => {
    const region = catalogueRegions[0];
    const staleBoundary = {
      ...region.officialBoundary,
      sourceDate: { state: 'documented' as const, value: '2023-09-22' },
    };

    expect(getFreshnessStatus(staleBoundary, 'boundary', new Date('2025-09-24T00:00:00.000Z'))).toBe('needs-confirmation');
  });
});

describe('catalogue coverage fixtures', () => {
  it('publishes all 36 controlled pairs in region/pathway order as not-yet-verified', () => {
    const expectedKeys = CATALOGUE_REGION_IDS.flatMap((regionId) => (
      CATALOGUE_PATHWAYS.map((pathway) => `${regionId}:${pathway}`)
    ));

    expect(catalogueCoverage).toHaveLength(36);
    expect(catalogueCoverage.map((row) => `${row.regionId}:${row.pathway}`)).toEqual(expectedKeys);
    expect(catalogueCoverage.every((row) => row.state === 'not-yet-verified' && row.reviewedAt === checkedAt)).toBe(true);
    expect(validateCoverageMatrix(catalogueRegions, catalogueCoverage)).toEqual([]);
  });

  it('keeps all six Greater Kingston pathways explicit without a provider inventory', () => {
    const kingstonCoverage = catalogueCoverage.filter((row) => row.regionId === 'greater-kingston-jamaica');

    expect(kingstonCoverage).toHaveLength(6);
    expect(kingstonCoverage.map((row) => row.pathway)).toEqual(CATALOGUE_PATHWAYS);
    expect(kingstonCoverage.every((row) => row.state === 'not-yet-verified' && row.sourceUrl === undefined)).toBe(true);
  });

  it('detects deleted, duplicated, and unsupported coverage cells', () => {
    const deleted = catalogueCoverage.slice(1);
    const duplicate = [...catalogueCoverage, catalogueCoverage[0]];
    const unknown = [
      ...catalogueCoverage,
      {
        regionId: 'not-a-region',
        pathway: 'university',
        state: 'not-yet-verified',
        reviewedAt: checkedAt,
      } as unknown as CatalogueCoverage,
    ];

    expect(validateCoverageMatrix(catalogueRegions, deleted)).toContain('Missing catalogue coverage: greater-houston:university.');
    expect(validateCoverageMatrix(catalogueRegions, duplicate)).toContain('Duplicate catalogue coverage: greater-houston:university.');
    expect(validateCoverageMatrix(catalogueRegions, unknown)).toContain('Unsupported coverage region: not-a-region.');
  });
});
