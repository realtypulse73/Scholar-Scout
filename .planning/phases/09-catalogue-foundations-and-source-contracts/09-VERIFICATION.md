---
phase: 09-catalogue-foundations-and-source-contracts
verified: 2026-09-23T00:10:11Z
status: passed
score: 6/6 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 5/6
  gaps_closed:
    - "The great-circle helper returns a deterministic numeric distance for every valid latitude/longitude pair, so the documented local-focus inclusion check is reproducible."
  gaps_remaining: []
  regressions: []
---

# Phase 9: Catalogue Foundations and Source Contracts Verification Report

**Phase Goal:** Establish a deterministic, source-first catalogue foundation for the six approved regional areas that represents trustworthy facts and visible uncertainty without inventing availability or coverage.
**Verified:** 2026-09-23T00:10:11Z
**Status:** passed
**Re-verification:** Yes — after gap closure

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Six approved areas have explicit, frozen official boundaries, authority, source/check metadata, a distinct ten-mile civic local focus, and coverage state for every pathway. | ✓ VERIFIED | `catalogueRegions` holds the ordered six-area roster; `catalogueCoverage` creates all 36 controlled cells. Focused fixture tests assert the five OMB July 2023 CBSA records, the STATIN Kingston record, dates, anchors, and 36-cell order. |
| 2 | The six required pathway classes are controlled vocabulary rather than inferred inventory. | ✓ VERIFIED | `CATALOGUE_PATHWAYS` is the exact six-item union, and fixture/contract tests exercise every region/pathway pair. No discovery, filtering, provider inventory, or ranking surface was added. |
| 3 | Material facts have attributable source, dates, state, and verification action; the four factual states remain distinct. | ✓ VERIFIED | `FactEvidence` plus `validateFactEvidence` require authority, label, URL, structured source date, review date, state, and action. Fixed-clock tests exercise `current`, `needs-confirmation`, `unknown`, and `conflicting`. |
| 4 | Missing, stale, conflicting, and unverified information cannot become confirmed availability, fit, salary, placement, or outcome claims. | ✓ VERIFIED | `not-yet-verified` coverage rejects own evidence/source fields; current facts require current documented evidence; invalid/future clocks fail closed. Scope scan found no fetch, route, persistence, inventory, rank, eligibility, sensitive, forecast, or outcome implementation. |
| 5 | Wage context, if represented, is dated occupation-and-area context rather than provider evidence or a personal forecast. | ✓ VERIFIED | `OccupationAreaWageContext` validates independently sourced wage evidence and requires the fixed `Occupation-and-area wage context only — not an offer or forecast.` label; tests reject the invalid label and prohibited semantic fields. |
| 6 | The great-circle local-focus check is deterministic for every valid coordinate pair. | ✓ VERIFIED | `calculateGreatCircleMiles` validates coordinate bounds, clamps its finite Haversine intermediate to `[0, 1]` before both roots, and the public near-antipodal regression passes with a finite π-radius result. |

**Score:** 6/6 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `apps/web/lib/catalogue-contract.ts` | Pure regional, source/evidence, freshness, coverage, wage, card, and local-focus contracts | ✓ VERIFIED | Substantive pure module. It exports all plan-declared validators/constants; all Phase 09 key-link queries pass. The former Haversine defect is repaired at lines 520–526. |
| `apps/web/lib/catalogue-fixtures.ts` | Frozen six-region roster and baseline coverage | ✓ VERIFIED | Imports controlled vocabulary, deeply freezes all nested data, and generates exactly 36 explicit `not-yet-verified` cells from the six-by-six controlled matrix. |
| `apps/web/__tests__/lib/catalogue-contract.test.ts` | Public contract and edge-case regressions | ✓ VERIFIED | 77 focused tests directly invoke public validators and `calculateGreatCircleMiles`, including the exact near-antipodal reproduction. |
| `apps/web/__tests__/lib/catalogue-fixtures.test.ts` | Fixture, provenance, completeness, and immutability regressions | ✓ VERIFIED | 7 focused tests validate source records, Kingston's null CBSA ID, coverage order/completeness, and deep immutability. |
| `.planning/phases/09-catalogue-foundations-and-source-contracts/09-VALIDATION.md` | Repair traceability for Plans 05–06 | ✓ VERIFIED | Exists and is substantive; its planned test/quality-gate entries correspond to the current public validation tests. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `catalogue-fixtures.ts` | `catalogue-contract.ts` | Controlled constants/types and coverage contract imports | ✓ WIRED | Direct imports and the Phase 09 artifact verifier confirm this link for Plans 01, 02, 04, and 06. |
| frozen regions/coverage | public validators | Focused fixture tests | ✓ WIRED | `validateCatalogueRegion` and `validateCoverageMatrix` accept the six frozen records and 36 baseline cells with an injected clock. |
| evidence/card/wage validators | later reviewed-import boundary | Named pure exports | ✓ WIRED | Every Plan 03–09 key-link query is verified; the domain module exposes the intended validation boundary without prematurely adding a route or publication consumer. |
| `catalogue-contract.test.ts` | `calculateGreatCircleMiles` | Direct public near-antipodal call | ✓ WIRED | The named regression passed independently: 1/1 selected test, 76 skipped. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `catalogue-fixtures.ts` | `catalogueRegions` | Frozen declared source roster | Six distinct region records with official-boundary and local-focus provenance | ✓ FLOWING |
| `catalogue-fixtures.ts` | `catalogueCoverage` | `CATALOGUE_REGION_IDS × CATALOGUE_PATHWAYS` | 36 explicit, ordered `not-yet-verified` baseline cells | ✓ FLOWING |

These deliberately static values are the Phase 09 foundation. No live provider aggregation, runtime scraping, persistence, route, or UI data flow belongs in this phase; reviewed import and publication are explicitly Phase 10 work.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Reproduced valid near-antipodal distance | `pnpm --filter @scholar-scout/web run test -- __tests__/lib/catalogue-contract.test.ts -t "returns a finite deterministic distance for valid near-antipodal coordinates" --runInBand` | 1 selected test passed; public result is finite and π-radius-close | ✓ PASS |
| Catalogue contracts and frozen fixture matrix | `pnpm --filter @scholar-scout/web run test -- __tests__/lib/catalogue-contract.test.ts __tests__/lib/catalogue-fixtures.test.ts --runInBand` | 2 suites, 84 tests passed | ✓ PASS |
| Type safety | `pnpm --filter @scholar-scout/web run typecheck` | Exit 0 | ✓ PASS |
| Lint | `pnpm --filter @scholar-scout/web run lint` | Exit 0 | ✓ PASS |

The checks emit the existing Node 24 engine warning under local Node 20.20.2 and Next.js multiple-lockfile warning. They did not affect command exit status or the verified Phase 09 behavior.

### Probe Execution

No phase-declared or conventional `probe-*.sh` files were found. **SKIPPED (no probes declared).**

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| REG-01 | 09-01, 02, 04–10 | Exact official region boundary and distinct local focus are reproducible. | ✓ SATISFIED | Controlled six-area boundary/local-focus records, exact authority/ID checks, 731-day policy, fixed-clock tests, and repaired finite local-focus geometry. |
| REG-02 | 09-01, 02, 04–07 | All six pathway classes remain controlled and visible. | ✓ SATISFIED | Exact six-ID constant and six-by-six coverage matrix; no hide/filter logic exists in this domain-only phase. |
| REG-03 | 09-01, 02, 04–09 | Each area/pathway pair has an honest coverage state. | ✓ SATISFIED | Explicit 36-cell `not-yet-verified` baseline; verified cells require current attributable evidence and valid supplied-region provenance. |
| EVID-01 | 09-01, 03–09 | Every material fact has attributable metadata and action. | ✓ SATISFIED | Field-level evidence/card validators, deterministic runtime-shape errors, chronology checks, and invalid-clock fail-closed regressions. |
| EVID-02 | 09-01, 03–07 | Evidence states remain visibly distinct and stale/conflicting facts do not become confirmed. | ✓ SATISFIED | Fixed-clock 183/731-day threshold tests and four-state evidence/card validation. |
| EVID-05 | 09-03, 04 | Wage context is dated source-linked context, not a provider promise or forecast. | ✓ SATISFIED | Independent occupation/area wage evidence and fixed informational-only label with focused negative tests. |

No Phase 09 requirement is orphaned: all six are declared by the plans and have code/test evidence. `REQUIREMENTS.md` still displays EVID-05 as pending in its traceability table even though the implementation and tests satisfy its conditional Phase 09 contract; this is a planning-status mismatch, not an unmet codebase behavior.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| — | — | No `TBD`, `FIXME`, `XXX`, placeholder, empty implementation, console-only handler, or hardcoded user-visible empty-data stub found in Phase 09 owned code/tests. | ℹ️ Info | No anti-pattern blocker. |

## Re-verification Findings

The earlier blocker is closed. Commit `94b29fd` changes only the documented public arithmetic path and its regression: the raw Haversine value is bounded inclusively to the mathematical `[0, 1]` domain before both square roots. The independently run named regression reproduces the formerly failing coordinate pair through `calculateGreatCircleMiles` and passes. Existing ten-mile inclusion/exclusion and invalid-coordinate assertions remain unchanged and pass in the focused suite.

Disconfirmation checks found no partial must-have or misleading regression: the test uses the public helper rather than reimplementing its formula, and the clamp plus bounded finite inputs proves both square-root operands are non-negative for all valid coordinates. The scope scan also found no untested network, persistence, inventory, ranking, or sensitive-data path introduced by this phase.

---

_Verified: 2026-09-23T00:10:11Z_
_Verifier: the agent (gsd-verifier)_
