---
phase: 09-catalogue-foundations-and-source-contracts
reviewed: 2026-09-22T23:06:01Z
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

**Reviewed:** 2026-09-22T23:06:01Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

The Plan 07 repairs are present and correctly close the prior findings: controlled coverage rows that name an omitted region are rejected, and a checked date before a documented source date is rejected. The focused contract and fixture suites pass (77 tests), as do web typecheck and lint.

One P1 import-integrity blocker remains. The matrix derives its declared-region set from every object-shaped region entry, rather than from entries that pass the authoritative boundary and source validation. A malformed region can therefore authorize a complete coverage matrix without the required regional provenance.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Invalid regional provenance can authorize coverage

**Classification:** BLOCKER (P1)

**File:** `apps/web/lib/catalogue-contract.ts:552-563`

**Issue:** `validateCoverageMatrix` only filters region entries with `isRecord`, then adds a controlled `id` to `regionIds` without calling `validateCatalogueRegion`. Consequently, an imported region such as `{ id: 'greater-houston' }`, which has no official boundary, source metadata, or local-focus provenance, is treated as declared. A complete six-pathway Houston coverage matrix then returns no errors, including for `verified` rows. This bypasses the exact regional-boundary/source contract and permits coverage to be presented for a region whose provenance was absent or invalid.

**Fix:** Validate each object-shaped region entry before admitting its ID to `regionIds`; preserve its validation errors and add only entries with zero `validateCatalogueRegion` errors. Add public-validator regressions using a malformed controlled region plus complete `not-yet-verified` and `verified` matrices, asserting both the regional-provenance error and `Coverage region is not declared: greater-houston.`.

```ts
const validRegions: CatalogueRegion[] = [];
for (const candidate of regionList) {
  if (!isRecord(candidate)) {
    errors.push('Catalogue region must be an object.');
    continue;
  }

  const regionErrors = validateCatalogueRegion(candidate);
  errors.push(...regionErrors);
  if (regionErrors.length === 0) validRegions.push(candidate);
}
```

---

_Reviewed: 2026-09-22T23:06:01Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
