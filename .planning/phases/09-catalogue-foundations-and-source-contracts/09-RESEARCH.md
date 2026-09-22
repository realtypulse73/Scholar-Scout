# Phase 9: Catalogue Foundations and Source Contracts - Research

**Researched:** 2026-09-22  
**Domain:** Deterministic opportunity-catalogue contracts, geographic scope, and field-level provenance  
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Local coverage and pathway inventory
- **D-01:** Define the local-coverage focus around the downtown area of each of the six approved regional areas, using a ten-mile radius. The catalogue must prioritize two- and four-year colleges, technical schools, trade certificates, and employer-paid training, while also including major universities.
- **D-02:** Model employer-paid training as a distinct pathway category, separate from certificate and technical-school programmes. It must show the taught skill and provider-published trainee pay. If a job after training is not explicitly guaranteed, the record must plainly say so and must not imply a salary or employment promise.
- **D-03:** Retain all approved pathway classes as browseable. A later phase may rank them using only voluntary, ordinary qualifications such as a GED, credits, licence, or work experience; it must not hide options or make an eligibility, admission, enlistment, funding, salary, placement, or outcome determination.

### Evidence, uncertainty, and freshness
- **D-04:** A government-confirmed programme may appear when its provider website is unclear or outdated, but it must have a neutral caution marker such as `Confirm details`, a visible source, and a visible date. That marker communicates uncertainty without judging programme quality.
- **D-05:** Present verified local choices first. When more unverified listings exist, present them in a clearly separated load-more area. Sparse categories may still be shown, but every verification state must be unmistakable.
- **D-06:** Permit regional-boundary definitions to be up to two years old. Require source review within six months for fast-changing facts such as programme cost, requirements, trainee pay, availability, and participation policies. — **Reversibility:** costly — changing the policy later requires reclassifying snapshot evidence and test fixtures.
- **D-07:** Require an official source before showing either a re-entry support or a participation restriction. When a policy is unclear or unpublished, show a neutral instruction to ask the provider directly rather than inventing or inferring a conclusion.

### Decision-focused record information
- **D-08:** The catalogue record contract must support first-view facts that help an ordinary person decide what to explore: location, pathway type, skill taught, training payer, cost or tuition, verification status, duration, and in-person/online/hybrid delivery. Sensitive support selections remain outside cards and ranking.

### the agent's Discretion
- Choose the deterministic technical representation for each downtown anchor and the ten-mile boundary calculation, provided it is documented and does not replace the six official regional-boundary records.
- Define controlled vocabulary names and fixture shape consistent with existing TypeScript conventions, provided the six approved pathway classes and visible evidence states are preserved.

### Deferred Ideas (OUT OF SCOPE)
- **Phase 12:** Rank all visible options using only voluntarily supplied ordinary qualifications. A GED and missing test/GPA information can affect a requirements-to-verify explanation, but never make a final eligibility decision or suppress an option.
- **Phase 14:** Offer an optional, private, local-only support question for people affected by the criminal justice system. It must not change ranking or be disclosed to providers.
- **Phase 14:** Add neutral military-information pathways for skills such as drones or engineering using official sources and local human contacts. They must avoid recruitment pressure, eligibility determinations, and personal pay promises.
- **Visual-system follow-up:** Each Scholar Scout life-transition scene should change the depicted person's clothing between before and after frames, with attire suited to the new learning or work setting rather than repeating the same outfit.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REG-01 | Six selected metros expose their exact official boundary, authority, source, and date. | `CatalogueRegion` separates an official boundary record from the downtown ten-mile local-focus record. |
| REG-02 | Every selected metro retains all six pathway classes. | A complete `CatalogueCoverage` matrix is keyed by every region/pathway pair. |
| REG-03 | Each metro/pathway has an honest coverage state. | `verified` and `not-yet-verified` are explicit values; missing matrix cells are validation errors. |
| EVID-01 | Every material fact is attributable, dated, stateful, and actionable. | Field-level `FactEvidence` requires source authority, source/review date, factual status, and a verification action. |
| EVID-02 | Current, Needs confirmation, Unknown, and Conflicting facts remain distinct. | A pure freshness classifier determines the public state from a supplied clock and policy window. |
| EVID-05 | Wage context is dated and not a promise. | `OccupationAreaWageContext` is a separate, source-linked informational record, never a provider or student outcome field. |
</phase_requirements>

## Summary

Phase 9 should add a new, pure TypeScript catalogue contract and six-area fixture module; it should not repurpose the legacy `Programme.matchScore`, add a database, write to the shared `ScholarScoutData` document, or fetch providers at learner request time. The existing `Programme` shape has useful evidence seams, but it also holds legacy `acceptanceRate`, `matchScore`, and broad programme values that cannot safely represent the v1.1 source-first public record. [VERIFIED: repository source `apps/web/lib/programmes.ts`, `apps/web/lib/server/data-store.ts`]

The six regions need two related but different records: an official regional-boundary record for honest scope disclosure and a fixed downtown coordinate plus a ten-mile focus for local opportunity classification. The five U.S. records use the frozen July 2023 Census/OMB CBSA release; Greater Kingston retains the Statistical Institute of Jamaica KMA authority and has no U.S. CBSA code. [CITED: https://www.census.gov/geographies/reference-maps/2023/geo/cbsa.html] [CITED: https://statinja.gov.jm/maps/kmacommunitiesandpopulation.html]

**Primary recommendation:** Create a static `catalogue-contract.ts` plus `catalogue-fixtures.ts`, validate all six-by-six coverage cells and all evidence fields in unit tests, and leave live ingestion, staff publication, ranking, referrals, military content, and public discovery to their assigned later phases.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Region, pathway, coverage, and source vocabulary | Domain library | — | These are deterministic rules reusable by later server and browser surfaces. |
| Freshness/status classification | Domain library | Frontend Server | A pure rule makes all future surfaces consistent; server readers later select approved snapshots. |
| Curated representative fixtures | Domain library / static source | Frontend Server | Phase 9 only proves the contract; no request needs an upstream source. |
| Public catalogue reading | Frontend Server | Browser | Later pages must read governed data, never retrieve provider content directly. [VERIFIED: repository source `apps/web/lib/server/programme-records.ts`] |
| Staff publication and source intake | API / Backend | Database / Storage | Deliberately deferred to Phase 10; it must use governed writes rather than Phase 9 fixtures. |

## Project Constraints (from AGENTS.md)

- Retain Next.js 15, React 18, TypeScript, NextAuth, and Vercel; avoid platform churn.
- Preserve in-progress work and use incremental, tested migration boundaries; do not overwrite unrelated changes.
- Keep strict TypeScript, named library exports, `@/` imports in web code, two-space/single-quote style, and `*.test.ts`/`*.test.tsx` Jest tests.
- Keep server-only access under `apps/web/lib/server/`; routes authenticate and validate early; browser code must not reach persistence adapters directly.
- Run the web lint command for web changes; use the GSD workflow for edits.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | existing `5.x` | Exact unions, source/evidence records, pure validators | Existing strict project convention makes unsupported facts fail at compile/test time. [VERIFIED: repository `apps/web/package.json`] |
| Next.js | existing `15.5.15` | Future server-read catalogue surfaces | The established App Router stays unchanged in this foundation phase. [VERIFIED: repository `apps/web/package.json`] |
| Jest | existing `30.3.0` | Contract, freshness, matrix, and legacy-compatibility tests | Existing `next/jest` test setup covers pure library tests. [VERIFIED: repository `apps/web/package.json`, `apps/web/jest.config.ts`] |
| Node.js | existing `24.x` | Local validation and test runtime | Project engines pin Node 24; this phase adds no runtime service. [VERIFIED: repository `package.json`] |

### Supporting

| Tool | Purpose | When to Use |
|------|---------|-------------|
| Existing `Programme` governance normalizer | Keeps old programmes visible with unknown evidence. | Use only as a compatibility boundary; do not treat old records as Phase 9 verified records. [VERIFIED: repository `apps/web/lib/programmes.ts`] |
| Existing governed programme reader | Merges published staff records with seed records. | Integrate later through a deliberate mapper after Phase 10 publication work. [VERIFIED: repository `apps/web/lib/server/programme-records.ts`] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Static typed fixtures | New database/CMS/search service | Adds migration, access, concurrency, operational, and source-review scope before the six-area contract is proven. |
| Pure radius rule | Mapping/geospatial package | A fixed ten-mile great-circle calculation is small, deterministic, and needs no map rendering in this phase. [ASSUMED] |
| Field-level evidence | Provider-level “verified” badge | One provider can have current identity data while tuition, terms, pay, or availability are stale. [VERIFIED: project requirement EVID-01] |

**Installation:** None. This phase must install no packages.

## Package Legitimacy Audit

No external packages are installed or recommended in Phase 9; package verification is not applicable.

## Architecture Patterns

### System Architecture Diagram

```text
official boundary / provider / government source
                 |
                 v
       source record + checked/review dates
                 |
                 v
  catalogue-contract validators and freshness classifier
        |                 |                    |
        v                 v                    v
  six region records   36 coverage cells   fact/wage evidence
        \                 |                    /
         \----------------v-------------------/
                          |
                          v
              deterministic Phase 9 fixtures
                          |
                          v
     Phase 10 reviewed snapshot -> later governed server reader
                          |
                          v
          later public discovery (never live upstream fetch)
```

### Recommended Project Structure

```text
apps/web/
├── lib/
│   ├── catalogue-contract.ts       # unions, evidence types, pure validators/classifiers
│   ├── catalogue-fixtures.ts       # six regions, complete coverage matrix, safe representative data
│   └── programmes.ts               # unchanged legacy programme model / later explicit bridge only
└── __tests__/lib/
    ├── catalogue-contract.test.ts  # state, dates, source, no-guarantee invariants
    └── catalogue-fixtures.test.ts  # six regions, full matrix, scope/distance fixtures
```

### Pattern 1: Two-layer geographic scope

**What:** Store `officialBoundary` and `localFocus` separately. `officialBoundary` is the transparent regional definition. `localFocus` has a documented downtown anchor, its own source/check date, and `radiusMiles: 10`; it is a local-selection aid, not a replacement metro boundary.

**When to use:** Every region and every future provider location classification.

```typescript
export type SourceDate =
  | { state: 'documented'; value: string }
  | { state: 'unavailable'; value: null };

export interface SourceMetadata {
  sourceLabel: string;
  sourceUrl: string;
  sourceDate: SourceDate;
  checkedAt: string;
}

export interface CatalogueRegion {
  id: CatalogueRegionId;
  label: string;
  officialBoundary: {
    authority: 'us-census-omb-cbsa' | 'statin-kingston-metropolitan-area';
    boundaryId: string | null;
    boundaryVersion: string;
  } & SourceMetadata;
  localFocus: {
    anchorLabel: string;
    latitude: number;
    longitude: number;
    radiusMiles: 10;
  } & SourceMetadata;
}
```

The U.S. CBSA codes are Houston `26420`, Chicago `16980`, Buffalo `15380`, Atlanta `12060`, and New Orleans `35380`. The committed fixture must use the frozen **July 2023 OMB delineation** release, not a moving current lookup. [CITED: https://www.census.gov/geographies/reference-maps/2023/geo/cbsa.html]

### Frozen Phase 9 geographic source roster (resolved 2026-09-22)

Phase 9 uses a fixed product reference point for the requested ten-mile local-focus calculation. It is not asserted to be an official downtown boundary or a provider-availability statement. Each reference point is the cited government city-hall or municipal address, normalized once into a stored decimal latitude/longitude in the static fixture; the cited address and the stored coordinate make the calculation repeatable without runtime geocoding.

| Region | Official regional-boundary source | Fixed local-focus reference point and source |
|---|---|---|
| Greater Houston | U.S. Census July 2023 OMB CBSA map, CBSA `26420` — https://www.census.gov/geographies/reference-maps/2023/geo/cbsa.html | City of Houston City Hall, 901 Bagby, Houston, TX 77002 — https://houstontx.gov/contactus/ |
| Greater Chicago | U.S. Census July 2023 OMB CBSA map, CBSA `16980` — https://www.census.gov/geographies/reference-maps/2023/geo/cbsa.html | Chicago City Hall, 121 N LaSalle Street, Chicago, IL 60602 — https://311.chicago.gov/ |
| Greater Buffalo | U.S. Census July 2023 OMB CBSA map, CBSA `15380` — https://www.census.gov/geographies/reference-maps/2023/geo/cbsa.html | Buffalo City Hall, 65 Niagara Square, Buffalo, NY 14202 — https://www.buffalony.gov/m/directory/department?did=114 |
| Greater Atlanta | U.S. Census July 2023 OMB CBSA map, CBSA `12060` — https://www.census.gov/geographies/reference-maps/2023/geo/cbsa.html | Atlanta City Hall Annex, 55 Trinity Avenue SW, Atlanta, GA 30303 — https://www.atlantaga.gov/residents/city-hall |
| Greater New Orleans | U.S. Census July 2023 OMB CBSA map, CBSA `35380` — https://www.census.gov/geographies/reference-maps/2023/geo/cbsa.html | New Orleans City Hall, 1300 Perdido Street, New Orleans, LA 70112 — https://nola.gov/contact-us/ |
| Greater Kingston, Jamaica | STATIN Kingston Metropolitan Area (Kingston plus the suburban section of St. Andrew); no CBSA — https://statinja.gov.jm/maps/kmacommunitiesandpopulation.html | Kingston & St. Andrew Municipal Corporation, 24 Church Street, Kingston, Jamaica — https://www.ksamc.gov.jm/contact-us |

Implementation must freeze `boundaryVersion: 'OMB July 2023 delineation'` for the five U.S. records and `boundaryVersion: 'STATIN KMA communities and population'` for Kingston. All six boundary and local-focus `checkedAt` dates are `2026-09-22`. The fixed local-focus radius is exactly ten straight-line miles; it is not a travel-time or commute claim.

### Pattern 2: Complete coverage matrix, never inferred coverage

**What:** Export exactly one `CatalogueCoverage` row for all 36 region/pathway combinations. Use `not-yet-verified` until a reviewed source-supported opportunity exists; do not use an absent row, a metro name, or a national listing as proof of local coverage.

**When to use:** Phase 9 fixtures and future snapshot validation.

```typescript
export type CataloguePathway =
  | 'university'
  | 'community-college'
  | 'trade-career-school'
  | 'registered-apprenticeship'
  | 'employer-linked-training'
  | 'military-information';

export interface CatalogueCoverage {
  regionId: CatalogueRegionId;
  pathway: CataloguePathway;
  state: 'verified' | 'not-yet-verified';
  reviewedAt: string;
  sourceUrl?: string;
}
```

### Pattern 3: Per-fact evidence and deterministic freshness

**What:** Model material values as independently sourced facts. `sourceDate` is a required tagged field: its documented variant has a validated ISO calendar date, while its unavailable variant is structurally present and forces the fact to remain non-current/unresolved. A source URL alone is not a current fact. `current` requires valid source metadata, review date, direct verification action, and a six-month review window for operational facts; regional boundaries use the separate two-year window.

**When to use:** Tuition, cost, entry requirements, duration, delivery, location, trainee pay, availability, participation policies, and wage context.

```typescript
export type FactStatus =
  | 'current'
  | 'needs-confirmation'
  | 'unknown'
  | 'conflicting';

export type SourceDate =
  | { state: 'documented'; value: string }
  | { state: 'unavailable'; value: null };

export interface FactEvidence {
  status: FactStatus;
  authority: 'provider-official' | 'employer-official' | 'government-official' | 'workforce-authority';
  sourceLabel: string;
  sourceUrl: string;
  sourceDate: SourceDate;
  reviewedAt: string;
  verificationAction: string;
}

export interface SourcedFact<Value> {
  value?: Value;
  evidence: FactEvidence;
}
```

Use an injected `now` in `getFactStatus` rather than `new Date()` inside validators so six-month and two-year boundary tests are repeatable. The current legacy evidence states (`documented`, `unknown`, `stale`, `conflicting`) must map explicitly rather than being relabeled as current. [VERIFIED: repository `apps/web/lib/programmes.ts`]

### Pattern 4: Employer-paid training is an explicit factual shape

**What:** Employer-linked training must have `trainingPayer: 'employer'`, a taught skill fact, a provider-published trainee-pay fact, and a source-backed employment-commitment disclosure. Its declaration must never become a salary forecast, eligibility verdict, or placement promise.

**When to use:** Only `employer-linked-training` records.

```typescript
export interface EmployerTrainingFacts {
  taughtSkill: string;
  trainingPayer: 'employer';
  traineePay: FactEvidence;
  employmentCommitment: 'no-published-guarantee' | 'published-provider-statement' | 'unknown';
  employmentCommitmentEvidence: FactEvidence;
}
```

Government apprenticeship material can corroborate an apprenticeship record but its Job Finder aggregates multiple data sources; retain its registered-occupation/partner tag and direct verification action, not a job guarantee. [CITED: https://www.apprenticeship.gov/apprenticeship-job-finder]

### Anti-Patterns to Avoid

- **Replacing `Programme` globally:** Existing pages rely on its fields and normalization. Add the new contract alongside it and bridge deliberately in a later publication/discovery plan. [VERIFIED: repository `apps/web/lib/programmes.ts`, `apps/web/lib/server/programme-records.ts`]
- **One source-confidence badge:** It cannot make all facts attributable or fresh.
- **An empty coverage cell:** It silently reads as accidental absence; use `not-yet-verified` explicitly.
- **Runtime lookup or scraping:** A student request must never depend on a provider site. [VERIFIED: project requirement EVID-04]
- **Coordinates without provenance:** A ten-mile distance is only reproducible if the chosen downtown anchor and check date are stored.
- **Text-scanning claims to detect guarantees:** Use typed factual disclosures and mandatory source evidence; free-text heuristics cannot safely prove a non-claim. [ASSUMED]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|
| Live provider discovery | Browser/server scraper or runtime aggregator | Reviewed static records and later governed publication | Availability, rights, source, and repeatability must not vary per learner request. |
| Eligibility/outcome inference | A qualification or “fit” decision in the catalogue layer | Published fact plus verification action | Product policy prohibits admission, job, pay, or outcome decisions. |
| Provider-quality score | “Verified school” score | Field-level status/source/date | Verification describes evidence, not programme quality. |
| Broad geospatial platform | GIS service or map UI | A documented fixed anchor + pure ten-mile classification | This phase needs a deterministic data boundary, not maps or routing. [ASSUMED] |

**Key insight:** A trustworthy first catalogue is a small set of explicit facts and explicit unknowns—not a broad directory that pretends every provider or path is current.

## Common Pitfalls

### Pitfall 1: Treating a metro boundary as the ten-mile search area
**What goes wrong:** A page says both “Greater Houston” and “within ten miles of downtown” without exposing which describes the regional boundary versus local focus.  
**How to avoid:** Persist both records with independent sources/dates and name them separately in later UI.

### Pitfall 2: Letting a government source silently upgrade a fast-changing provider fact
**What goes wrong:** An institution appears in IPEDS or another government source and its tuition, admissions, or availability look current.  
**How to avoid:** IPEDS is annual and has provisional/final release distinctions; only display provider-operational facts as `current` when reviewed within six months, otherwise use `needs-confirmation`. [CITED: https://nces.ed.gov/ipeds/use-the-data/timing-of-ipeds-data-collection] [CITED: https://nces.ed.gov/ipeds/use-the-data/download-access-database]

### Pitfall 3: Inventing a Kingston CBSA or provider inventory
**What goes wrong:** A U.S. source code or unverified local programme is fabricated for consistency.  
**How to avoid:** Keep STATIN KMA as its own authority, use no CBSA field for it, and begin its coverage cells as `not-yet-verified` until reviewed Jamaican sources exist. [CITED: https://statinja.gov.jm/maps/kmacommunitiesandpopulation.html]

### Pitfall 4: Collapsing `needs-confirmation`, `unknown`, and `conflicting`
**What goes wrong:** A stale/contested figure gains the visual weight of a verified fact.  
**How to avoid:** Exhaustive union switches and direct unit assertions must retain all four states.

### Pitfall 5: Misrepresenting paid training
**What goes wrong:** A trainee-pay rate becomes an implied future salary or guaranteed placement.  
**How to avoid:** Store the exact payer/pay evidence separately from a source-backed `no-published-guarantee` disclosure and prohibit rank/outcome fields in this module.

## Code Examples

### Freshness classifier

```typescript
const OPERATIONAL_FACT_REVIEW_DAYS = 183;
const BOUNDARY_REVIEW_DAYS = 731;

export function getFreshnessStatus(
  reviewedAt: string | undefined,
  maxAgeDays: number,
  now: Date,
): FactStatus {
  if (!reviewedAt || Number.isNaN(Date.parse(reviewedAt))) {
    return 'unknown';
  }

  const ageDays = (now.getTime() - Date.parse(reviewedAt)) / 86_400_000;
  return ageDays <= maxAgeDays ? 'current' : 'needs-confirmation';
}
```

This is a project-specific pure-function pattern, aligned with the current programme evidence normalizer. [VERIFIED: repository `apps/web/lib/programmes.ts`] The 183/731 values represent the locked six-month/two-year policy; use tests at the exact thresholds.

### Matrix validation

```typescript
export function validateCoverageMatrix(
  regions: CatalogueRegion[],
  coverage: CatalogueCoverage[],
): string[] {
  const expected = new Set(
    regions.flatMap((region) =>
      CATALOGUE_PATHWAYS.map((pathway) => `${region.id}:${pathway}`),
    ),
  );
  const actual = new Set(coverage.map((item) => `${item.regionId}:${item.pathway}`));

  return [...expected].filter((key) => !actual.has(key));
}
```

The fixture test should fail if this returns any missing cell or if it finds an unknown region/pathway key.

## State of the Art

| Old Approach | Current Phase 9 Approach | Impact |
|--------------|--------------------------|--------|
| One programme-level source confidence | One record per material fact with source/date/status/action | A student can see exactly what needs confirmation. |
| Generic local/online filter | Official regional scope plus documented ten-mile local focus | Geography is reproducible without pretending the two zones are the same. |
| General programme pathways | Six v1.1 classes including separate employer-linked training and military-information | Paid training and factual military information are not hidden inside unrelated classes. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | A simple great-circle calculation is sufficient for the deterministic ten-mile classification before routing/map features exist. | Standard Stack / Don't Hand-Roll | It measures straight-line distance, not travel distance; the catalogue must label it as a local focus rather than a commute promise. |
| A2 | Exact downtown anchor coordinates are normalized once from the frozen civic reference-point roster and stored with its government source URL/check date. | Frozen Phase 9 geographic source roster | An undocumented anchor would make the local-focus label irreproducible. |
| A3 | The asserted `no-published-guarantee` disclosure can be modeled as a controlled factual state rather than inferred from prose. | Architecture Patterns | A source may be too ambiguous and require `unknown` plus a verification action. |

## Open Questions — RESOLVED

1. **Initial verified opportunity rows — RESOLVED**
   - Resolution: Phase 9 ships all 36 metro/pathway coverage cells as explicit `not-yet-verified` records. It ships no verified opportunity rows or provider inventory.
   - Ownership: Phase 10 exclusively owns reviewed, verified opportunity imports and governed publication after source/claim validation.

The geographic-source and release decisions are resolved above. The executor must not select different URLs, versions, anchors, or a moving current Census source during implementation.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Typecheck/tests | ✓ | `24.x` project requirement | — |
| pnpm | Workspace test commands | ✓ | `10.34.5` project requirement | — |
| External provider API | Phase 9 | Not required | — | Static reviewed fixtures |

No external service, API key, package installation, or production deployment is required for Phase 9.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30.3.0 with `next/jest` |
| Config file | `apps/web/jest.config.ts` |
| Fast target-unit command | `pnpm --filter @scholar-scout/web run test -- __tests__/lib/catalogue-contract.test.ts --runInBand` (substitute `catalogue-fixtures.test.ts` for fixture tasks) |
| Full suite command | `pnpm --filter @scholar-scout/web run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| REG-01 | Exactly six region records have authority/source/version/date; Kingston has no CBSA; local focus is ten miles. | unit | fixture target-unit command | created by 09-02-01 after 09-01 contract |
| REG-02 | Every region contains all six controlled pathways. | unit | fixture target-unit command | created by 09-02-01/02 |
| REG-03 | Matrix is complete and all 36 Phase 9 cells remain explicit `not-yet-verified`. | unit | fixture target-unit command | created by 09-02-01/02 |
| EVID-01 | A material fact requires source, authority, required structured source/review dates, status, and verification action. | unit | contract target-unit command | created by 09-01-01; extended by 09-03 |
| EVID-02 | Current/needs-confirmation/unknown/conflicting stay distinct at six-month boundaries. | unit | contract target-unit command | created by 09-01-01/02; extended by 09-03-01 |
| EVID-05 | Wage context requires dated source and never includes a personal/provider promise field. | unit | contract target-unit command | extended by 09-03-02 |

### Sampling Rate

- **Per task commit:** the one-file target Jest command named above, before beginning the next task.
- **Per wave merge:** `pnpm --filter @scholar-scout/web run lint` and full web Jest suite.
- **Phase gate:** lint, typecheck, full Jest suite, and a manual review that fixtures contain no invented provider, pay, support, restriction, or local-office claims.

### Test-Creation Order

- [ ] Plan 09-01 Task 1 creates the contract module and focused test as the red-to-green tracer.
- [ ] Plan 09-02 Task 1 creates the fixture module and focused test only after Plan 09-01 exports its metadata/freshness interface.
- [ ] Plan 09-03 extends the contract suite after Plan 09-01, independently of Plan 09-02.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Phase 9 adds no endpoint or staff operation. |
| V3 Session Management | No | Phase 9 has no learner/session data. |
| V4 Access Control | Yes, by boundary | Do not expose a mutation/import route; Phase 10 must use the existing active-staff pattern. |
| V5 Input Validation | Yes | Strict unions, source URL/date validation, coverage-matrix validation, and deterministic fixture tests. |
| V6 Cryptography | No | No secret, credential, or encryption operation is introduced. |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unsupported fact appears verified | Tampering / Integrity | Require field-level evidence and downgrade old/missing reviews. |
| Provider page changes or disappears | Availability / Integrity | No learner runtime fetch; retain reviewed snapshot plus direct verification action. |
| Misleading employer-pay or job claim | Spoofing / Integrity | Separate trainee-pay source from no-guarantee/unknown disclosure; never include outcome ranking. |
| Untrusted source URL used as authority | Spoofing | Validate URL protocol and authority type separately; only approved reviewed records may later publish. |
| Sensitive circumstance leaks into catalogue | Information disclosure | No sensitive fields in Phase 9 contract, fixture, query, or ranking function. |

## Sources

### Primary (MEDIUM confidence)
- [Census July 2023 CBSA map](https://www.census.gov/geographies/reference-maps/2023/geo/cbsa.html) — frozen July 2023 OMB delineation release for all five U.S. CBSA records.
- [Statistical Institute of Jamaica KMA record](https://statinja.gov.jm/maps/kmacommunitiesandpopulation.html) — Kingston and suburban St. Andrew KMA authority.
- [City of Houston contact record](https://houstontx.gov/contactus/) — 901 Bagby civic reference point.
- [City of Chicago 311 record](https://311.chicago.gov/) — 121 N LaSalle Street civic reference point.
- [City of Buffalo City Hall record](https://www.buffalony.gov/m/directory/department?did=114) — 65 Niagara Square civic reference point.
- [City of Atlanta City Hall record](https://www.atlantaga.gov/residents/city-hall) — 55 Trinity Avenue SW civic reference point.
- [City of New Orleans contact record](https://nola.gov/contact-us/) — 1300 Perdido Street civic reference point.
- [KSAMC contact record](https://www.ksamc.gov.jm/contact-us) — 24 Church Street civic reference point.
- [NCES IPEDS release-cycle guidance](https://nces.ed.gov/ipeds/use-the-data/timing-of-ipeds-data-collection) — annual collection and data-year/release timing.
- [Apprenticeship.gov Job Finder](https://www.apprenticeship.gov/apprenticeship-job-finder) — government apprenticeship listing context and its multiple-source labels.

### Internal (HIGH confidence)
- `09-CONTEXT.md` — locked Phase 9 product decisions.
- `apps/web/lib/programmes.ts`, `apps/web/lib/admin-programmes.ts`, and `apps/web/lib/server/programme-records.ts` — current types, validation, normalization, and governed read seams.
- `docs/product-recommendation-governance.md` — no eligibility/outcome inference and source-first explanatory boundary.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new stack; repository manifests/configuration confirm the tools.
- Architecture: HIGH — current programme governance and persistence seams were read directly.
- External boundary/source facts: HIGH — the exact July 2023 Census/OMB and STATIN sources, six civic reference sources, versions, and checked date are frozen in the Phase 9 source roster.
- Pitfalls: HIGH — directly derived from locked requirements and existing legacy data constraints.

**Research date:** 2026-09-22  
**Valid until:** 2026-10-22 for current source links; boundary fixture validity is governed by the locked two-year maximum and operational-fact validity by the locked six-month maximum.
