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

The six regions need two related but different records: an official regional-boundary record for honest scope disclosure and a fixed downtown coordinate plus a ten-mile focus for local opportunity classification. The five U.S. records use current Census/OMB CBSA sources; Greater Kingston must retain the Statistical Institute of Jamaica KMA authority and has no U.S. CBSA code. [CITED: https://www.census.gov/programs-surveys/metro-micro/about/delineation-files.html] [CITED: https://statinja.gov.jm/maps/kmacommunitiesandpopulation.html]

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
export interface CatalogueRegion {
  id: CatalogueRegionId;
  label: string;
  officialBoundary: {
    authority: 'us-census-omb-cbsa' | 'statin-kingston-metropolitan-area';
    boundaryId?: string;
    sourceUrl: string;
    boundaryVersion: string;
    checkedAt: string;
  };
  localFocus: {
    anchorLabel: string;
    latitude: number;
    longitude: number;
    radiusMiles: 10;
    sourceUrl: string;
    checkedAt: string;
  };
}
```

The U.S. CBSA codes supported by current Census material are Houston `26420`, Chicago `16980`, Buffalo `15380`, Atlanta `12060`, and New Orleans `35380`; verify the exact frozen release URL/version in the committed fixture. [CITED: https://tigerweb.geo.census.gov/tigerwebmain/Files/acs26/tigerweb_acs26_metro_cbsa_us.html] [CITED: https://tigerweb.geo.census.gov/tigerwebmain/Files/bas26/tigerweb_bas26_metro_cbsa_us.html]

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

**What:** Model material values as independently sourced facts. A source URL alone is not a current fact. `current` requires a valid source, review date, direct verification action, and a six-month review window for operational facts; regional boundaries use the separate two-year window.

**When to use:** Tuition, cost, entry requirements, duration, delivery, location, trainee pay, availability, participation policies, and wage context.

```typescript
export type FactStatus =
  | 'current'
  | 'needs-confirmation'
  | 'unknown'
  | 'conflicting';

export interface FactEvidence {
  status: FactStatus;
  authority: 'provider-official' | 'employer-official' | 'government-official' | 'workforce-authority';
  sourceLabel: string;
  sourceUrl: string;
  sourceDate?: string;
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
| A2 | Exact downtown anchor coordinates can be documented from an appropriate official municipal/geographic source during implementation. | Architecture Patterns | An undocumented anchor would make the local-focus label irreproducible. |
| A3 | The asserted `no-published-guarantee` disclosure can be modeled as a controlled factual state rather than inferred from prose. | Architecture Patterns | A source may be too ambiguous and require `unknown` plus a verification action. |

## Open Questions

1. **Downtown anchor source for each area**
   - What we know: The product requires a documented downtown ten-mile focus.
   - Recommendation: Record exact coordinates, source URL/label, and checked date in the six fixtures; use `unknown` coverage rather than classifying a provider if its location is not sourceable.
2. **Initial verified opportunity rows**
   - What we know: This phase must not invent Jamaican or U.S. provider availability.
   - Recommendation: Ship the six-region/36-cell contract with `not-yet-verified` where a reviewed record is absent; Phase 10 owns reviewed imports/publication.
3. **Boundary release freeze**
   - What we know: Census publishes dated delineation resources and its current material identifies the five U.S. CBSA codes.
   - Recommendation: Store the exact chosen Census/TIGER release URL and current check date in the fixture, then test the two-year maximum.

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
| Quick run command | `pnpm --filter @scholar-scout/web run test -- catalogue-contract catalogue-fixtures` |
| Full suite command | `pnpm --filter @scholar-scout/web run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| REG-01 | Exactly six region records have authority/source/version/date; Kingston has no CBSA; local focus is ten miles. | unit | web Jest command | ❌ Wave 0 |
| REG-02 | Every region contains all six controlled pathways. | unit | web Jest command | ❌ Wave 0 |
| REG-03 | Matrix is complete and explicit `not-yet-verified` never upgrades itself. | unit | web Jest command | ❌ Wave 0 |
| EVID-01 | A material fact requires source, authority, date, status, and verification action. | unit | web Jest command | ❌ Wave 0 |
| EVID-02 | Current/needs-confirmation/unknown/conflicting stay distinct at six-month boundaries. | unit | web Jest command | ❌ Wave 0 |
| EVID-05 | Wage context requires dated source and never includes a personal/provider promise field. | unit | web Jest command | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** targeted Jest command plus `pnpm --filter @scholar-scout/web run typecheck`.
- **Per wave merge:** `pnpm --filter @scholar-scout/web run lint` and full web Jest suite.
- **Phase gate:** lint, typecheck, full Jest suite, and a manual review that fixtures contain no invented provider, pay, support, restriction, or local-office claims.

### Wave 0 Gaps

- [ ] `apps/web/__tests__/lib/catalogue-contract.test.ts`
- [ ] `apps/web/__tests__/lib/catalogue-fixtures.test.ts`
- [ ] `apps/web/lib/catalogue-contract.ts`
- [ ] `apps/web/lib/catalogue-fixtures.ts`

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
- [U.S. Census metropolitan delineation files](https://www.census.gov/programs-surveys/metro-micro/about/delineation-files.html) — OMB/Census delineation authority and dated releases.
- [Census current CBSA geography](https://tigerweb.geo.census.gov/tigerwebmain/Files/acs26/tigerweb_acs26_metro_cbsa_us.html) — current names/codes for the five U.S. areas.
- [Statistical Institute of Jamaica KMA record](https://statinja.gov.jm/maps/kmacommunitiesandpopulation.html) — Kingston and suburban St. Andrew KMA authority.
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
- External boundary/source facts: MEDIUM — official sources were checked through web search and must be frozen with exact fixture URLs/dates at implementation time.
- Pitfalls: HIGH — directly derived from locked requirements and existing legacy data constraints.

**Research date:** 2026-09-22  
**Valid until:** 2026-10-22 for current source links; boundary fixture validity is governed by the locked two-year maximum and operational-fact validity by the locked six-month maximum.
