---
phase: 09-catalogue-foundations-and-source-contracts
reviewed: 2026-09-22T21:28:28Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - apps/web/lib/catalogue-contract.ts
  - apps/web/lib/catalogue-fixtures.ts
  - apps/web/__tests__/lib/catalogue-contract.test.ts
  - apps/web/__tests__/lib/catalogue-fixtures.test.ts
findings:
  critical: 4
  warning: 3
  info: 0
  total: 7
status: issues_found
---

# Phase 09: Code Review Report

**Reviewed:** 2026-09-22T21:28:28Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

The Phase 09 scope remains domain-only and does not introduce scraping, persistence, discovery UI, or sensitive-data fields. The focused Jest suites (27 tests), TypeScript check, and lint all pass. However, the core validators accept forged or impossible provenance as valid input, allow a verified coverage assertion without any evidence, and throw on malformed imported fact values. These are source-governance failures on the intended Phase 10 import/publication boundary and must be corrected before publication work builds on this contract.

## Critical Issues

### CR-01: Region validation does not bind official authority or boundary ID to the declared region

**File:** `apps/web/lib/catalogue-contract.ts:385`

**Issue:** `validateCatalogueRegion` checks only that an ID and an authority are independently in their allowed unions (lines 385-400). It accepts, for example, `greater-houston` with the STATIN authority and `boundaryId: null`, or Greater Kingston with a U.S. CBSA ID. This violates the binding regional-source contract and allows a forged authority/boundary relationship to pass the fixture/import gate.

**Fix:** Define an internal authoritative mapping keyed by `CatalogueRegionId`, then require the matching authority and null/non-null boundary-ID rule (and, where appropriate, the declared CBSA ID) in `validateCatalogueRegion`. Add negative tests for a U.S. region with STATIN/null and Kingston with a CBSA ID.

### CR-02: Fact evidence accepts impossible source/review chronology as current

**File:** `apps/web/lib/catalogue-contract.ts:241`

**Issue:** A `current` fact with source date `2026-09-22` and review date `2020-01-01` returns no errors: the validator only rejects a future review date and only evaluates the source date freshness at lines 250-263. A reviewer therefore appears to have validated a source six years before it existed. It also accepts a future documented source date whenever the claimed status is non-current. Both cases contradict the planned requirement to reject future dates and preserve meaningful source/review provenance.

**Fix:** With the injected clock, reject every documented source date after `now`; for documented dates, reject a `reviewedAt` before the source date. Keep unavailable source dates limited to explicit non-current states. Add fixed-clock regression cases for review-before-source and future source dates in both current and unresolved evidence.

### CR-03: A coverage row can claim `verified` with no attributable source

**File:** `apps/web/lib/catalogue-contract.ts:149`

**Issue:** `CatalogueCoverage.sourceUrl` is optional, and `validateCoverageMatrix` only validates it when supplied (lines 502-510). Consequently, a complete matrix of `state: 'verified'` rows with no source URL passes validation. This directly defeats the honest-coverage and field-level attribution guarantees: a public reader could be told that an area/pathway is verified with no evidence or verification action.

**Fix:** Make coverage a discriminated union: `not-yet-verified` may omit evidence, while `verified` must carry source metadata/evidence and a direct verification action. Validate its source/review dates with an injected clock, and add a regression test rejecting verified rows without required evidence.

### CR-04: Text-fact validation throws instead of rejecting malformed imported data

**File:** `apps/web/lib/catalogue-contract.ts:567`

**Issue:** `validateSourcedTextFact` calls `fact?.value?.trim()` without checking that `value` is a string. A runtime payload such as `{ value: 42, evidence: validEvidence }` causes `validateOccupationAreaWageContext` (and the employer-training validator) to throw `fact?.value?.trim is not a function`, rather than return a recoverable validation error. This is unsafe at the planned untrusted import boundary and can turn one malformed row into a failed import/request.

**Fix:** Guard the value explicitly, e.g. `if (typeof fact?.value !== 'string' || !fact.value.trim())`, and retain the existing error-return contract. Add runtime-shaped negative tests with number, object, and array values.

## Warnings

### WR-01: An "unresolved" card fact may carry an arbitrary non-null material value

**File:** `apps/web/lib/catalogue-contract.ts:596`

**Issue:** `isUnresolvedCatalogueCardFact` identifies an unresolved fact solely by the presence of `state`; the validation branch never enforces the declared `value: null` invariant. Thus `{ value: 'Unverified raw assertion', state: 'unknown', evidence: validUnknownEvidence }` validates successfully. This lets an unsupported material assertion enter a card under the unresolved branch.

**Fix:** Require `fact.value === null` in the unresolved branch and reject any additional material value. Add a test for a non-null unresolved value and for a missing/invalid state.

### WR-02: Definitive employment-commitment states accept unknown evidence

**File:** `apps/web/lib/catalogue-contract.ts:288`

**Issue:** `no-published-guarantee` and `published-provider-statement` are accepted regardless of `employmentCommitmentEvidence.status`. For example, `no-published-guarantee` paired with unavailable-date `unknown` evidence passes validation, turning absence of verified evidence into a definitive employment statement.

**Fix:** Require definitive commitment states to have appropriately current or needs-confirmation evidence, and require `unknown`/`conflicting` evidence to map to the corresponding non-definitive state. Add mismatch tests for each controlled commitment state.

### WR-03: The advertised frozen fixture data is shallowly mutable and shares one date object

**File:** `apps/web/lib/catalogue-fixtures.ts:12`

**Issue:** `catalogueRegions` is only a readonly array; its nested records remain mutable. In addition, every `sourceDate` points to the same `UNAVAILABLE_SOURCE_DATE` object. A consumer can mutate one nested date/source record and silently change multiple supposedly frozen provenance records for the process.

**Fix:** Export deeply readonly fixture types and deep-freeze the fixture objects (or construct independent immutable source-date values per record). Add a regression test that attempted mutations cannot alter another region's source metadata.

---

_Reviewed: 2026-09-22T21:28:28Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
