---
phase: 09-catalogue-foundations-and-source-contracts
reviewed: 2026-09-22T22:45:21Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - apps/web/lib/catalogue-contract.ts
  - apps/web/lib/catalogue-fixtures.ts
  - apps/web/__tests__/lib/catalogue-contract.test.ts
  - apps/web/__tests__/lib/catalogue-fixtures.test.ts
findings:
  critical: 1
  warning: 1
  info: 0
  total: 2
status: issues_found
---

# Phase 09: Final Code Review Report

**Reviewed:** 2026-09-22T22:45:21Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

The 09-06 repairs close the two prior critical findings: public source/region validators now return stable errors for malformed roots and nested objects, and explicit unknown coverage rejects own `evidence` and `sourceUrl` properties. The focused contract and fixture suites pass (74 tests), as do web typecheck and lint.

One import-integrity blocker remains: coverage rows are checked against the global region vocabulary but not against the supplied region matrix, so a row can claim a controlled region that is absent from the imported region list. Source metadata also permits an impossible review date before its documented source date.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Coverage can target a controlled region absent from the imported matrix

**File:** `apps/web/lib/catalogue-contract.ts:550-562, 572-625`

**Issue:** `validateCoverageMatrix` builds `regionIds` from the supplied region list, but validates each coverage row's `regionId` only against the global `CATALOGUE_REGION_IDS` vocabulary. A complete Chicago matrix plus a verified or not-yet-verified Houston row therefore returns no error even if no Houston region record was supplied. This lets a snapshot introduce coverage for a region whose boundary/provenance record was omitted or rejected, bypassing the intended region-to-coverage import boundary.

**Fix:** Reject each row whose controlled `regionId` is not in `regionIds` (for example, `Coverage region is not declared: ${regionId}.`) before accepting the row. Add regressions for both verified and not-yet-verified extra rows beside an otherwise valid partial matrix.

## Warnings

### WR-01: Source metadata accepts a review date before the documented source existed

**File:** `apps/web/lib/catalogue-contract.ts:226-246`

**Issue:** `validateSourceMetadata` confirms that `sourceDate` and `checkedAt` are independently valid calendar dates, but never compares them. A documented `sourceDate: 2026-09-22` with `checkedAt: 2026-09-21` is accepted, allowing an impossible provenance-review chronology into future imports.

**Fix:** When the source date is documented and both dates parse, reject `checkedAt < sourceDate` with a deterministic error such as `Checked date cannot precede the documented source date.` Add a fixed-value regression case; preserve the allowed explicit-unavailable source-date state.

---

_Reviewed: 2026-09-22T22:45:21Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
