---
phase: 09-catalogue-foundations-and-source-contracts
verified: 2026-09-22T23:53:46Z
status: gaps_found
score: 5/6 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "The great-circle helper returns a deterministic numeric distance for every valid latitude/longitude pair, so the documented local-focus inclusion check is reproducible."
    status: failed
    reason: "The Haversine intermediate is not clamped to [0, 1]. Valid near-antipodal coordinates make Math.sqrt(1 - haversine) NaN, violating calculateGreatCircleMiles()'s number | null contract."
    artifacts:
      - path: "apps/web/lib/catalogue-contract.ts"
        issue: "Lines 520-524 calculate the central angle from an unclamped Haversine value."
      - path: "apps/web/__tests__/lib/catalogue-contract.test.ts"
        issue: "No near-antipodal regression exercises the public helper."
    missing:
      - "Clamp the Haversine value before both square-root calculations."
      - "Add a regression proving valid near-antipodal inputs return a finite distance."
---

# Phase 9: Catalogue Foundations and Source Contracts Verification Report

**Phase Goal:** Establish a deterministic, source-first catalogue foundation for the six approved regional areas that represents trustworthy facts and visible uncertainty without inventing availability or coverage.
**Verified:** 2026-09-22T23:53:46Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Six approved areas have explicit, frozen official boundaries, authority, source/check metadata, a distinct ten-mile civic local focus, and coverage state for every pathway. | ✓ VERIFIED | `catalogueRegions` declares all six areas; `catalogueCoverage` derives 36 ordered explicit cells. Focused fixture tests prove the roster and matrix. |
| 2 | The six required pathway classes are controlled vocabulary rather than inferred inventory. | ✓ VERIFIED | `CATALOGUE_PATHWAYS` contains the exact six IDs and fixture coverage contains every region/pathway pair. |
| 3 | Material facts have attributable source, dates, state, and verification action; the four factual states remain distinct. | ✓ VERIFIED | `FactEvidence` and `validateFactEvidence` require each field and fixed-clock regressions cover current, needs-confirmation, unknown, and conflicting evidence. |
| 4 | Missing, stale, conflicting, and unverified information cannot become confirmed availability, fit, salary, placement, or outcome claims. | ✓ VERIFIED | Explicit `not-yet-verified` discriminator rejects source/evidence fields; non-current source dates and invalid clocks fail closed; scope scan found no routes, fetches, inventory, ranking, or sensitive fields. |
| 5 | Wage context, if represented, is dated occupation-and-area context, not a provider offer or personal forecast. | ✓ VERIFIED | `OccupationAreaWageContext` requires independent evidence and the fixed informational-only label; focused tests reject omitted/invalid evidence and prohibited output fields. |
| 6 | The great-circle local-focus check is deterministic for every valid coordinate pair. | ✗ FAILED | Directly invoking `calculateGreatCircleMiles` with the final-review near-antipodal coordinates returned `NaN`; the implementation at line 522 uses an unclamped Haversine value. |

**Score:** 5/6 truths verified (0 present, behavior-unverified)

## Locked Decision Coverage

| Decision | Status | Codebase evidence |
| --- | --- | --- |
| D-01: official boundary and ten-mile local focus are separate | ✓ VERIFIED | Separate `OfficialBoundary` / `LocalFocus` contracts and six frozen records. |
| D-02: employer-paid training is factual and no employment promise is inferred | ✓ VERIFIED | `EmployerTrainingFacts` constrains payer, evidence, and commitment states. |
| D-03: all six pathway classes remain controlled and visible | ✓ VERIFIED | Exact six-pathway constant and a complete explicit matrix; no rank/filter code was added. |
| D-04: uncertain facts carry neutral actionable provenance | ✓ VERIFIED | Non-current evidence states require a verification action; tests retain `needs-confirmation`, `unknown`, and `conflicting`. |
| D-05: coverage never implies unreviewed local inventory | ✓ VERIFIED | All 36 fixture rows are source-free `not-yet-verified`; verified rows require current attributable evidence. UI ordering is deliberately deferred to Phase 11. |
| D-06: 183-day operational and 731-day boundary policies are deterministic | ✓ VERIFIED | Exported policy and fixed-clock threshold tests. |
| D-07: re-entry/participation-policy claims are absent | ✓ VERIFIED | Contract/fixtures contain no such fields; no sensitive/referral input, storage, or route was added. |
| D-08: first-view facts are sourced or visibly unresolved and non-sensitive | ✓ VERIFIED | `CatalogueOpportunityCardFacts` validates the required factual fields and derived status. |

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `apps/web/lib/catalogue-contract.ts` | Pure vocabulary, provenance, evidence, freshness, coverage, wage, and card contracts | ⚠️ PARTIAL | Exists, substantive, imported by fixtures/tests, and receives real fixture data; its unclamped great-circle calculation fails a valid-coordinate edge case. |
| `apps/web/lib/catalogue-fixtures.ts` | Frozen six-area regional roster and 36-cell baseline | ✓ VERIFIED | Deep-freezes nested data; generates all six-by-six explicit `not-yet-verified` cells from controlled constants. |
| `apps/web/__tests__/lib/catalogue-contract.test.ts` | Contract regressions | ⚠️ PARTIAL | 76 contract tests pass in the focused suite, but no test covers the final-review near-antipodal input. |
| `apps/web/__tests__/lib/catalogue-fixtures.test.ts` | Fixture/matrix regressions | ✓ VERIFIED | 7 tests pass; verifies literal roster, 36-cell order, deep freeze, and distinct source-date objects. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `catalogue-fixtures.ts` | `catalogue-contract.ts` | imported controlled constants/types | ✓ WIRED | Independent key-link check reports the expected import pattern. |
| fixture regions/coverage | `validateCatalogueRegion` / `validateCoverageMatrix` | focused fixture tests | ✓ WIRED | The frozen roster and all 36 baseline cells validate under an injected clock. |
| evidence/card/wage contracts | later reviewed-import boundary | named pure validators | ✓ WIRED | Exports are substantive and key-link check found `validateFactEvidence` / `getFreshnessStatus`; Phase 10 will consume them. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `catalogue-fixtures.ts` | `catalogueRegions` | Frozen reviewed source roster | Six declared regions with official/civic provenance | ✓ FLOWING |
| `catalogue-fixtures.ts` | `catalogueCoverage` | Controlled region × pathway constants | 36 explicit `not-yet-verified` baseline records | ✓ FLOWING |

These are intentionally static Phase 9 foundations. There is no provider inventory, route, client fetch, live aggregation, persistence, or UI in scope; later phases own reviewed imports and discovery.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Contract and fixture regression suite | `pnpm --filter @scholar-scout/web run test -- __tests__/lib/catalogue-contract.test.ts __tests__/lib/catalogue-fixtures.test.ts --runInBand` | 2 suites, 83 tests passed | ✓ PASS |
| Great-circle final-review edge case | workspace `ts-node` invocation of `calculateGreatCircleMiles` with `(-11.18571800391112, 139.73174389513332)` and `(11.18571800391112, -40.26825610486668)` | `NaN` | ✗ FAIL |
| TypeScript | `pnpm --filter @scholar-scout/web run typecheck` | exit 0 | ✓ PASS |
| Lint | `pnpm --filter @scholar-scout/web run lint` | exit 0 | ✓ PASS |
| Full web Jest suite | `pnpm --filter @scholar-scout/web run test --runInBand` | exit 0 | ✓ PASS |

The commands emitted the existing Node 20 versus required Node 24 engine warning and Next.js multiple-lockfile warning. Neither caused a failed quality command. The passing suite does not disprove the geometry failure because it lacks the near-antipodal regression.

### Requirements Coverage

| Requirement | Source Plans | Status | Evidence |
| --- | --- | --- | --- |
| REG-01 | 09-01, 02, 04–09 | ✓ SATISFIED | Exact controlled regions, authority/ID provenance, distinct official/local records, frozen six-area roster, and provenance-admitting coverage validation. |
| REG-02 | 09-01, 02, 04–07, 09 | ✓ SATISFIED | Exact six pathway constants and 36 deterministic region/pathway cells; no suppression or discovery filter introduced. |
| REG-03 | 09-01, 02, 04–09 | ✓ SATISFIED | Every fixture pair is explicit `not-yet-verified`; verified rows require current attributable evidence and valid region provenance. |
| EVID-01 | 09-01, 03–09 | ✓ SATISFIED | Field-level authority/source/date/status/action validation, chronology checks, runtime-shape guards, and fail-closed invalid-clock handling. |
| EVID-02 | 09-01, 03–07 | ✓ SATISFIED | Fixed-clock 183/731-day behavior and explicit current/needs-confirmation/unknown/conflicting states. |
| EVID-05 | 09-03, 04 | ✓ SATISFIED | Dated `OccupationAreaWageContext` with a fixed context-only label and no offer/forecast fields. |

No Phase 9 requirement is orphaned: all six are declared across the plans and traced to substantive contract/fixture behavior.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- |
| `apps/web/lib/catalogue-contract.ts` | 522 | Unclamped Haversine value | 🛑 BLOCKER | Valid coordinates can produce `NaN`, contrary to the public numeric-distance contract. |

The phase-owned source/test files contain no `TBD`, `FIXME`, `XXX`, placeholder, empty implementation, live-fetch, persistence, route, ranking, sensitive-referral, or provider-inventory intrusion. Git history for the phase-owned files contains only the planned contract, fixture, regression, provenance, chronology, and clock-guard changes.

### Human Verification Required After Gap Closure

The phase validation contract retains one manual release prerequisite: compare each frozen boundary/anchor source and any future real provider, wage, pay, support, or policy claim against its cited authority before publication. This phase deliberately ships no provider inventory or real wage/pay facts, so that review belongs before Phase 10 publishes a record.

### Gaps Summary

The source-first catalogue contracts, frozen six-area fixtures, explicit 36-cell coverage baseline, evidence/freshness rules, claim-safety restrictions, and Phase 9 scope boundary are implemented and tested. However, the public great-circle helper fails for valid near-antipodal coordinates because floating-point rounding is not bounded before a square root. This is a must-have contract failure and prevents a `passed` verdict despite green focused and full suites.

Repair `calculateGreatCircleMiles` by clamping `haversine` to `[0, 1]` before computing `centralAngle`, then add the reproduced input as a regression. Re-run verification afterward.

---

_Verified: 2026-09-22T23:53:46Z_
_Verifier: the agent (gsd-verifier)_
