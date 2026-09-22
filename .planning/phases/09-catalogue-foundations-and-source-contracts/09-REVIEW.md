---
phase: 09-catalogue-foundations-and-source-contracts
reviewed: 2026-09-22T22:20:20Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - apps/web/lib/catalogue-contract.ts
  - apps/web/lib/catalogue-fixtures.ts
  - apps/web/__tests__/lib/catalogue-contract.test.ts
  - apps/web/__tests__/lib/catalogue-fixtures.test.ts
findings:
  critical: 2
  warning: 0
  info: 0
  total: 2
status: issues_found
---

# Phase 09: Final Code Review Report

**Reviewed:** 2026-09-22T22:20:20Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

The 09-05 repairs resolve the prior re-review findings: verified-coverage dates are now checked against the injected clock and evidence chronology, and malformed unresolved-card evidence plus null, primitive, and array matrix entries now return stable errors. The scoped Jest suites pass (53 tests).

Two import-boundary blockers remain. Public region/source validation still throws for malformed nested metadata, and the runtime coverage validator accepts evidence-bearing `not-yet-verified` rows even though that state is meant to contain only the explicit unknown-coverage assertion. These must be fixed before Phase 10 relies on this contract for snapshot imports.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Public region and source validators throw on malformed nested import values

**File:** `apps/web/lib/catalogue-contract.ts:226-239, 425-465`

**Issue:** `validateSourceMetadata` guards only `sourceLabel`; it then dereferences `metadata.sourceUrl`, `metadata.sourceDate`, and `metadata.checkedAt`. `validateCatalogueRegion` similarly dereferences `region.id`, `region.officialBoundary.authority`, and `region.localFocus.authority` before proving the containing values are objects. Thus a parsed snapshot such as `validateCatalogueRegion({ id: 'greater-houston', officialBoundary: null, localFocus: null } as unknown as CatalogueRegion)` throws instead of returning import errors. Calling the exported `validateSourceMetadata(null as unknown as SourceMetadata)` also throws. The 09-05 matrix guards do not protect consumers that invoke these public validators directly for Phase 10 source-record validation.

**Fix:** Accept `unknown` at each public validation boundary and use `isRecord` guards for the root object and nested boundary/local-focus/metadata objects before reading properties. Return stable errors such as `Catalogue region must be an object.`, `Official boundary must be an object.`, and `Source metadata must be an object.` Add null, primitive, array, and missing-nested-object regression tests that assert no throw.

### CR-02: Unverified coverage rows can smuggle evidence fields through the runtime validator

**File:** `apps/web/lib/catalogue-contract.ts:158-165, 575-598`

**Issue:** The discriminated TypeScript type prohibits `evidence` and `sourceUrl` on `not-yet-verified` rows, but `validateCoverageMatrix` validates those fields only when `row.state === 'verified'`. JSON imports bypass TypeScript, so a row with `state: 'not-yet-verified'` and arbitrary `evidence` or `sourceUrl` passes validation. This violates the contract's explicit no-inventory/no-availability baseline and permits unsupported provenance or availability-shaped data to enter a supposedly unverified cell.

**Fix:** In the `not-yet-verified` branch, reject own `evidence` and `sourceUrl` properties (and any other coverage-claim fields the import schema prohibits) with a stable key-qualified error. Add runtime-shaped import tests proving that unverified rows with each forbidden field fail while the frozen 36-cell baseline remains valid.

---

_Reviewed: 2026-09-22T22:20:20Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
