import {
  CATALOGUE_PATHWAYS,
  CATALOGUE_REGION_IDS,
} from './catalogue-contract';
import type {
  CatalogueCoverage,
  CatalogueRegion,
  SourceDate,
} from './catalogue-contract';

const CHECKED_AT = '2026-09-22';
const UNAVAILABLE_SOURCE_DATE: SourceDate = { state: 'unavailable', value: null };

/**
 * Frozen regional scope records. Local-focus coordinates are one-time normalized
 * civic reference points for ten-mile straight-line classification, not commute
 * estimates or provider-availability claims.
 */
export const catalogueRegions: readonly CatalogueRegion[] = [
  {
    id: 'greater-houston',
    label: 'Greater Houston',
    officialBoundary: {
      authority: 'us-census-omb-cbsa',
      boundaryId: '26420',
      boundaryVersion: 'OMB July 2023 delineation',
      sourceLabel: 'U.S. Census July 2023 OMB CBSA map',
      sourceUrl: 'https://www.census.gov/geographies/reference-maps/2023/geo/cbsa.html',
      sourceDate: UNAVAILABLE_SOURCE_DATE,
      checkedAt: CHECKED_AT,
    },
    localFocus: {
      authority: 'City of Houston',
      anchorLabel: 'City of Houston City Hall — 901 Bagby, Houston, TX 77002',
      latitude: 29.760197,
      longitude: -95.370132,
      radiusMiles: 10,
      sourceLabel: 'City of Houston contact record',
      sourceUrl: 'https://houstontx.gov/contactus/',
      sourceDate: UNAVAILABLE_SOURCE_DATE,
      checkedAt: CHECKED_AT,
    },
  },
  {
    id: 'greater-chicago',
    label: 'Greater Chicago',
    officialBoundary: {
      authority: 'us-census-omb-cbsa',
      boundaryId: '16980',
      boundaryVersion: 'OMB July 2023 delineation',
      sourceLabel: 'U.S. Census July 2023 OMB CBSA map',
      sourceUrl: 'https://www.census.gov/geographies/reference-maps/2023/geo/cbsa.html',
      sourceDate: UNAVAILABLE_SOURCE_DATE,
      checkedAt: CHECKED_AT,
    },
    localFocus: {
      authority: 'City of Chicago',
      anchorLabel: 'Chicago City Hall — 121 N LaSalle Street, Chicago, IL 60602',
      latitude: 41.883184,
      longitude: -87.632467,
      radiusMiles: 10,
      sourceLabel: 'City of Chicago 311 record',
      sourceUrl: 'https://311.chicago.gov/',
      sourceDate: UNAVAILABLE_SOURCE_DATE,
      checkedAt: CHECKED_AT,
    },
  },
  {
    id: 'greater-buffalo',
    label: 'Greater Buffalo',
    officialBoundary: {
      authority: 'us-census-omb-cbsa',
      boundaryId: '15380',
      boundaryVersion: 'OMB July 2023 delineation',
      sourceLabel: 'U.S. Census July 2023 OMB CBSA map',
      sourceUrl: 'https://www.census.gov/geographies/reference-maps/2023/geo/cbsa.html',
      sourceDate: UNAVAILABLE_SOURCE_DATE,
      checkedAt: CHECKED_AT,
    },
    localFocus: {
      authority: 'City of Buffalo',
      anchorLabel: 'Buffalo City Hall — 65 Niagara Square, Buffalo, NY 14202',
      latitude: 42.88644,
      longitude: -78.87837,
      radiusMiles: 10,
      sourceLabel: 'City of Buffalo department directory',
      sourceUrl: 'https://www.buffalony.gov/m/directory/department?did=114',
      sourceDate: UNAVAILABLE_SOURCE_DATE,
      checkedAt: CHECKED_AT,
    },
  },
  {
    id: 'greater-atlanta',
    label: 'Greater Atlanta',
    officialBoundary: {
      authority: 'us-census-omb-cbsa',
      boundaryId: '12060',
      boundaryVersion: 'OMB July 2023 delineation',
      sourceLabel: 'U.S. Census July 2023 OMB CBSA map',
      sourceUrl: 'https://www.census.gov/geographies/reference-maps/2023/geo/cbsa.html',
      sourceDate: UNAVAILABLE_SOURCE_DATE,
      checkedAt: CHECKED_AT,
    },
    localFocus: {
      authority: 'City of Atlanta',
      anchorLabel: 'Atlanta City Hall Annex — 55 Trinity Avenue SW, Atlanta, GA 30303',
      latitude: 33.74899,
      longitude: -84.39009,
      radiusMiles: 10,
      sourceLabel: 'City of Atlanta City Hall record',
      sourceUrl: 'https://www.atlantaga.gov/residents/city-hall',
      sourceDate: UNAVAILABLE_SOURCE_DATE,
      checkedAt: CHECKED_AT,
    },
  },
  {
    id: 'greater-new-orleans',
    label: 'Greater New Orleans',
    officialBoundary: {
      authority: 'us-census-omb-cbsa',
      boundaryId: '35380',
      boundaryVersion: 'OMB July 2023 delineation',
      sourceLabel: 'U.S. Census July 2023 OMB CBSA map',
      sourceUrl: 'https://www.census.gov/geographies/reference-maps/2023/geo/cbsa.html',
      sourceDate: UNAVAILABLE_SOURCE_DATE,
      checkedAt: CHECKED_AT,
    },
    localFocus: {
      authority: 'City of New Orleans',
      anchorLabel: 'New Orleans City Hall — 1300 Perdido Street, New Orleans, LA 70112',
      latitude: 29.95093,
      longitude: -90.07766,
      radiusMiles: 10,
      sourceLabel: 'City of New Orleans contact record',
      sourceUrl: 'https://nola.gov/contact-us/',
      sourceDate: UNAVAILABLE_SOURCE_DATE,
      checkedAt: CHECKED_AT,
    },
  },
  {
    id: 'greater-kingston-jamaica',
    label: 'Greater Kingston, Jamaica',
    officialBoundary: {
      authority: 'statin-kingston-metropolitan-area',
      boundaryId: null,
      boundaryVersion: 'STATIN KMA communities and population',
      sourceLabel: 'Statistical Institute of Jamaica KMA record',
      sourceUrl: 'https://statinja.gov.jm/maps/kmacommunitiesandpopulation.html',
      sourceDate: UNAVAILABLE_SOURCE_DATE,
      checkedAt: CHECKED_AT,
    },
    localFocus: {
      authority: 'Kingston & St. Andrew Municipal Corporation',
      anchorLabel: 'Kingston & St. Andrew Municipal Corporation — 24 Church Street, Kingston, Jamaica',
      latitude: 17.971214,
      longitude: -76.79204,
      radiusMiles: 10,
      sourceLabel: 'Kingston & St. Andrew Municipal Corporation contact record',
      sourceUrl: 'https://www.ksamc.gov.jm/contact-us',
      sourceDate: UNAVAILABLE_SOURCE_DATE,
      checkedAt: CHECKED_AT,
    },
  },
];

/**
 * Every controlled local-coverage cell is explicitly present. Phase 9 records
 * no reviewed opportunity inventory, so each cell remains not-yet-verified.
 */
export const catalogueCoverage: readonly CatalogueCoverage[] = CATALOGUE_REGION_IDS.flatMap((regionId) => (
  CATALOGUE_PATHWAYS.map((pathway) => ({
    regionId,
    pathway,
    state: 'not-yet-verified' as const,
    reviewedAt: CHECKED_AT,
  }))
));
