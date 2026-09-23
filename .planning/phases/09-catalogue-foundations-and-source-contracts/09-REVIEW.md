---
phase: 09-catalogue-foundations-and-source-contracts
reviewed: 2026-09-23T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - apps/web/lib/catalogue-contract.ts
  - apps/web/lib/catalogue-fixtures.ts
  - apps/web/__tests__/lib/catalogue-contract.test.ts
  - apps/web/__tests__/lib/catalogue-fixtures.test.ts
findings:
  critical: 0
  warning: 1
  info: 0
  total: 1
status: issues_found
---

# Phase 09: Final Code Review Report

**Reviewed:** 2026-09-23T00:00:00Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Reviewed the four Phase 09 contract, fixture, and focused-test files. The prior invalid-injected-clock blocker is fixed: each public validator now fails closed before evaluating source freshness, coverage, or facts. Provenance admission checks remain in place, and the focused Jest suites pass (83 tests).

No blockers remain. One numerical edge case can make the public great-circle helper return `NaN` for valid near-antipodal coordinates.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: Great-circle helper can return `NaN` for valid antipodal coordinates

**Classification:** WARNING

**File:** `apps/web/lib/catalogue-contract.ts:520-524`
**Issue:** The Haversine intermediate is not clamped to its mathematical range of `[0, 1]` before `Math.sqrt(1 - haversine)`. Floating-point rounding can make it `1.0000000000000002` for valid near-antipodal coordinates (for example, `(-11.18571800391112, 139.73174389513332)` to `(11.18571800391112, -40.26825610486668)`), so the helper returns `NaN` instead of a numeric distance. This violates its `number | null` contract for valid inputs and can surprise future consumers beyond the current ten-mile check.

**Fix:** Clamp the Haversine value before calculating the central angle and add a near-antipodal regression.

```ts
const boundedHaversine = Math.min(1, Math.max(0, haversine));
const centralAngle = 2 * Math.atan2(
  Math.sqrt(boundedHaversine),
  Math.sqrt(1 - boundedHaversine),
);
```

---

_Reviewed: 2026-09-23T00:00:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
