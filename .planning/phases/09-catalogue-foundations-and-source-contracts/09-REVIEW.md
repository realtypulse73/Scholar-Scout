---
phase: 09-catalogue-foundations-and-source-contracts
reviewed: 2026-09-22T21:55:24Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - apps/web/lib/catalogue-contract.ts
  - apps/web/lib/catalogue-fixtures.ts
  - apps/web/__tests__/lib/catalogue-contract.test.ts
  - apps/web/__tests__/lib/catalogue-fixtures.test.ts
findings:
  critical: 3
  warning: 0
  info: 0
  total: 3
status: issues_found
---

# Phase 09: Code Re-review Report

**Reviewed:** 2026-09-22T21:55:24Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

All seven prior findings have been resolved in both implementation and regression coverage: exact regional authority/ID binding (former CR-01), source/review chronology (CR-02), evidence-backed verified coverage (CR-03), malformed text values (CR-04), unresolved-card null values (WR-01), employment-state/evidence compatibility (WR-02), and deeply immutable, non-aliased fixtures (WR-03).

The focused Phase 09 Jest suites pass (43 tests), as do TypeScript and ESLint. The re-review found three new import-boundary defects: a verified coverage row can carry a future or causally impossible review date, and two public validators throw instead of returning validation errors for malformed snapshot shapes. These must be fixed before Phase 10 uses this contract to validate imports or publication.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Verified coverage accepts a future or causally impossible coverage review date

**File:** `apps/web/lib/catalogue-contract.ts:557`

**Issue:** `validateCoverageMatrix` verifies only that `row.reviewedAt` parses as an ISO date. It never compares that date to the injected `now` or to the row's source evidence. A complete six-row `verified` matrix with `reviewedAt: '2099-01-01'` and otherwise current evidence returns no errors; so does a coverage row purporting to have been reviewed before the underlying source/evidence review. This lets a forged verification audit date pass the source-governance gate.

**Fix:** Parse the coverage review date, reject a date after `now`, and for verified rows require it to be on or after the evidence review date (and source date where documented). Add fixed-clock regressions for future and review-before-evidence rows.

### CR-02: An unresolved card fact with malformed evidence throws instead of producing validation errors

**File:** `apps/web/lib/catalogue-contract.ts:679`

**Issue:** The unresolved branch directly evaluates `fact.evidence.status`. A parsed snapshot containing `{ value: null, state: 'unknown', evidence: null }` causes a `TypeError` before `validateFactEvidence` can report an invalid fact. This is the same untrusted-import failure class addressed by the former malformed-text fix, now reachable through the unresolved fact shape.

**Fix:** Verify that `evidence` is a record before reading `status`; otherwise add a deterministic evidence-required/invalid error. Only compare states after evidence passes its structural guard. Add null, primitive, and array evidence regression cases that assert the validator never throws.

### CR-03: Coverage validation crashes on malformed region or coverage array entries

**File:** `apps/web/lib/catalogue-contract.ts:526`

**Issue:** The validator assumes every array entry is an object and dereferences `region.id` and `row.regionId` (line 541) without a shape guard. A JSON snapshot such as `validateCoverageMatrix([validRegion], [null] as unknown as CatalogueCoverage[], now)` throws rather than returning a recoverable import error; a `null` region entry fails similarly. This prevents the advertised validator from safely rejecting malformed Phase 10 import data.

**Fix:** Treat list items as `unknown`, validate object shape before property access, and append stable errors such as `Catalogue coverage row must be an object.` / `Catalogue region must be an object.`. Add null, primitive, and array-entry tests to prove the function never throws.

---

_Reviewed: 2026-09-22T21:55:24Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
