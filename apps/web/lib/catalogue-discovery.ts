import {
  CATALOGUE_PATHWAYS,
  getFreshnessStatus,
  type CatalogueCardFact,
  type CatalogueDelivery,
  type CataloguePathway,
  type FactEvidence,
  type FactStatus,
  type SourceMetadata,
} from '@/lib/catalogue-contract';
import { catalogueCoverage, catalogueRegions } from '@/lib/catalogue-fixtures';
import type { CatalogueRegionId, CoverageState } from '@/lib/catalogue-contract';
import type { CataloguePublishedRecord } from '@/lib/catalogue-publication';

const DEFAULT_METRO: CatalogueRegionId = 'greater-houston';
const DELIVERY_VALUES: readonly CatalogueDelivery[] = ['in-person', 'online', 'hybrid'];
const STATUS_VALUES: readonly FactStatus[] = ['current', 'needs-confirmation', 'unknown', 'conflicting'];

export interface CatalogueDiscoveryFilters {
  metro: CatalogueRegionId;
  pathway: CataloguePathway | 'all';
  delivery: CatalogueDelivery | 'all';
  status: FactStatus | 'all';
  q: string;
  page: number;
}

export interface CatalogueDiscoveryFact<Value> {
  value: Value | null;
  state: FactStatus;
  evidence: FactEvidence;
}

export interface CatalogueDiscoveryItem {
  id: string;
  providerTitle: string;
  regionId: CatalogueRegionId;
  regionLabel: string;
  pathway: CataloguePathway | null;
  place: CatalogueDiscoveryFact<string>;
  delivery: CatalogueDiscoveryFact<CatalogueDelivery>;
  facts: {
    skillTaught: CatalogueDiscoveryFact<string>;
    trainingPayer: CatalogueDiscoveryFact<string>;
    costOrTuition: CatalogueDiscoveryFact<string | number>;
    duration: CatalogueDiscoveryFact<string>;
  };
  factState: FactStatus;
  source: { label: string; date: string | null; state: 'current' | 'needs-confirmation' | 'unknown' };
  officialVerificationUrl: string;
  mediaState: 'reserved-for-rights-review';
}

export interface CatalogueDiscoveryCoverage {
  pathway: CataloguePathway;
  state: CoverageState;
  reviewedAt: string;
}

export interface CatalogueDiscoveryModel {
  filters: CatalogueDiscoveryFilters;
  region: (typeof catalogueRegions)[number];
  items: CatalogueDiscoveryItem[];
  coverage: CatalogueDiscoveryCoverage[];
  emptyState: 'none' | 'reviewed-snapshot-empty' | 'filters-empty' | 'coverage-not-yet-verified';
  resetHref: string;
  canonicalHref: string;
  sortSummary: string;
}

type QueryParams = Record<string, string | string[] | undefined>;

/** Parses only explicit visitor controls; unknown query values never affect discovery. */
export function parseCatalogueDiscoveryFilters(params: QueryParams = {}): CatalogueDiscoveryFilters {
  const metro = readOne(params.metro);
  const pathway = readOne(params.pathway);
  const delivery = readOne(params.delivery);
  const status = readOne(params.status);
  const query = readOne(params.q);
  return {
    metro: isRegionId(metro) ? metro : DEFAULT_METRO,
    pathway: pathway === 'all' || isPathway(pathway) ? pathway : 'all',
    delivery: delivery === 'all' || isDelivery(delivery) ? delivery : 'all',
    status: status === 'all' || isFactStatus(status) ? status : 'all',
    q: typeof query === 'string' ? query.trim().slice(0, 120) : '',
    page: parsePage(readOne(params.page)),
  };
}

/** Serializes a controlled public model without copying untrusted URL keys. */
export function buildCatalogueDiscoveryHref(filters: CatalogueDiscoveryFilters): string {
  const query = new URLSearchParams({ metro: filters.metro });
  if (filters.pathway !== 'all') query.set('pathway', filters.pathway);
  if (filters.delivery !== 'all') query.set('delivery', filters.delivery);
  if (filters.status !== 'all') query.set('status', filters.status);
  if (filters.q) query.set('q', filters.q);
  if (filters.page > 1) query.set('page', String(filters.page));
  return `/programmes?${query.toString()}`;
}

/** Maps Phase 10's public snapshot into a neutral, deterministic learner view. */
export function buildCatalogueDiscoveryModel({
  records,
  searchParams,
  now = new Date(),
}: {
  records: CataloguePublishedRecord[];
  searchParams?: QueryParams;
  now?: Date;
}): CatalogueDiscoveryModel {
  const filters = parseCatalogueDiscoveryFilters(searchParams);
  const region = catalogueRegions.find((candidate) => candidate.id === filters.metro) ?? catalogueRegions[0];
  const coverage = catalogueCoverage.filter((entry) => entry.regionId === filters.metro)
    .map((entry) => ({ pathway: entry.pathway, state: entry.state, reviewedAt: entry.reviewedAt }));
  const selectedMetro = records.filter((record) => record.regionId === filters.metro)
    .map((record) => mapPublishedRecord(record, now))
    .sort((left, right) => left.id.localeCompare(right.id));
  const items = selectedMetro.filter((item) => matchesFilters(item, filters));
  const selectedCoverage = filters.pathway === 'all' ? null : coverage.find((entry) => entry.pathway === filters.pathway) ?? null;
  const isNarrowed = filters.pathway !== 'all' || filters.delivery !== 'all' || filters.status !== 'all' || Boolean(filters.q);
  const emptyState = items.length > 0 ? 'none'
    : selectedMetro.length > 0 && isNarrowed ? 'filters-empty'
      : selectedCoverage?.state === 'not-yet-verified' ? 'coverage-not-yet-verified'
        : 'reviewed-snapshot-empty';
  const resetFilters: CatalogueDiscoveryFilters = { ...filters, pathway: 'all', delivery: 'all', status: 'all', q: '', page: 1 };
  return {
    filters,
    region,
    items,
    coverage,
    emptyState,
    resetHref: buildCatalogueDiscoveryHref(resetFilters),
    canonicalHref: buildCatalogueDiscoveryHref(filters),
    sortSummary: 'Results are ordered by stable public catalogue ID after your selected filters.',
  };
}

function mapPublishedRecord(record: CataloguePublishedRecord, now: Date): CatalogueDiscoveryItem {
  const place = mapFact(record.facts.location);
  const delivery = mapFact(record.facts.delivery);
  const facts = {
    skillTaught: mapFact(record.facts.skillTaught),
    trainingPayer: mapFact(record.facts.trainingPayer),
    costOrTuition: mapFact(record.facts.costOrTuition),
    duration: mapFact(record.facts.duration),
  };
  const pathway = mapFact(record.facts.pathway).value;
  return {
    id: record.id,
    providerTitle: record.title,
    regionId: record.regionId,
    regionLabel: record.region.label,
    pathway: isPathway(pathway) ? pathway : null,
    place,
    delivery,
    facts,
    factState: aggregateFactState([place.state, delivery.state, ...Object.values(facts).map((fact) => fact.state)]),
    source: mapSource(record.source, now),
    officialVerificationUrl: record.source.sourceUrl,
    mediaState: 'reserved-for-rights-review',
  };
}

function mapFact<Value>(fact: CatalogueCardFact<Value>): CatalogueDiscoveryFact<Value> {
  return { value: fact.value ?? null, state: 'state' in fact ? fact.state : fact.evidence.status, evidence: fact.evidence };
}

function mapSource(source: SourceMetadata, now: Date): CatalogueDiscoveryItem['source'] {
  return {
    label: source.sourceLabel,
    date: source.sourceDate.state === 'documented' ? source.sourceDate.value : null,
    state: getFreshnessStatus(source, 'operational', now),
  };
}

function matchesFilters(item: CatalogueDiscoveryItem, filters: CatalogueDiscoveryFilters): boolean {
  if (filters.pathway !== 'all' && item.pathway !== filters.pathway) return false;
  if (filters.delivery !== 'all' && item.delivery.value !== filters.delivery) return false;
  if (filters.status !== 'all' && item.factState !== filters.status) return false;
  if (!filters.q) return true;
  return [item.providerTitle, item.regionLabel, item.place.value, item.facts.skillTaught.value]
    .filter((value): value is string => typeof value === 'string')
    .join(' ').toLocaleLowerCase().includes(filters.q.toLocaleLowerCase());
}

function aggregateFactState(states: FactStatus[]): FactStatus {
  if (states.includes('conflicting')) return 'conflicting';
  if (states.includes('needs-confirmation')) return 'needs-confirmation';
  if (states.includes('unknown')) return 'unknown';
  return 'current';
}

function readOne(value: string | string[] | undefined): string | undefined { return typeof value === 'string' ? value : undefined; }
function parsePage(value: string | undefined): number { const page = Number(value); return Number.isSafeInteger(page) && page > 0 ? page : 1; }
function isRegionId(value: unknown): value is CatalogueRegionId { return typeof value === 'string' && catalogueRegions.some((region) => region.id === value); }
function isPathway(value: unknown): value is CataloguePathway { return typeof value === 'string' && (CATALOGUE_PATHWAYS as readonly string[]).includes(value); }
function isDelivery(value: unknown): value is CatalogueDelivery { return typeof value === 'string' && (DELIVERY_VALUES as readonly string[]).includes(value); }
function isFactStatus(value: unknown): value is FactStatus { return typeof value === 'string' && (STATUS_VALUES as readonly string[]).includes(value); }
