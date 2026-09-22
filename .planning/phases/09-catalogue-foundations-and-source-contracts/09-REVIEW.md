---
phase: 09-catalogue-foundations-and-source-contracts
reviewed: 2026-09-22T23:27:36Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - apps/web/lib/catalogue-contract.ts
  - apps/web/lib/catalogue-fixtures.ts
  - apps/web/__tests__/lib/catalogue-contract.test.ts
  - apps/web/__tests__/lib/catalogue-fixtures.test.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 09: Final Code Review Report

**Reviewed:** 2026-09-22T23:27:36Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Plan 08 closes the prior provenance-admission blocker: each object-shaped supplied region now flows through `validateCatalogueRegion`, and only error-free records can authorize coverage membership. Its forged-boundary and malformed-local-focus regressions are present. The final focused suites pass (81 tests), as do web typecheck and lint.

One import-integrity blocker remains. The injected clock is treated as optional validity information by both evidence and coverage validation. An invalid `Date` silently disables every future-date and freshness check, permitting a complete verified matrix with future evidence and coverage review dates to validate as current.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Invalid injected clock permits future evidence to validate as current

**Classification:** BLOCKER (P1)

**File:** `apps/web/lib/catalogue-contract.ts:282-302, 606-619`

**Issue:** `validateFactEvidence` and `validateCoverageMatrix` only apply future-date and current-freshness checks when `isValidDate(now)` is true. When a Phase 10 caller supplies `new Date('invalid')`, a `current` fact with `sourceDate` and `reviewedAt` in 2099 produces no evidence errors; the matrix likewise accepts future `reviewedAt` values. A complete verified matrix can therefore pass the Phase 09 import boundary and represent future, unreviewed material as current. This contradicts the fixed-clock contract that future evidence must never be current.

**Fix:** Fail closed at each public validation boundary when the supplied clock is invalid, and add a regression for a complete verified matrix and a direct current-evidence call using `new Date('invalid')`.

```ts
if (!isValidDate(now)) {
  return ['Validation clock must be a valid Date.'];
}

// validateCoverageMatrix can add the same deterministic error before
// evaluating row dates, while retaining other shape errors if desired.
```

---

_Reviewed: 2026-09-22T23:27:36Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
