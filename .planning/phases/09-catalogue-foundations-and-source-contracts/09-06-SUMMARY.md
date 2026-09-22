---
phase: 09-catalogue-foundations-and-source-contracts
plan: 06
subsystem: catalogue-domain-contract
tags: [typescript, jest, catalogue, import-boundary, validation, evidence]
requires:
  - plan: 09-05
    provides: Injected-clock chronology validation and malformed matrix-entry guards.
provides:
  - Non-throwing public source and region validators for unknown parsed-import shapes.
  - Runtime rejection of own evidence and source URL fields on explicit unknown coverage rows.
affects: [phase-10-reviewed-imports, catalogue-publication, source-governance]
tech-stack:
  added: []
  patterns: [RED-GREEN validator regression, non-array record guards, own-property coverage discrimination]
key-files:
  created:
    - .planning/phases/09-catalogue-foundations-and-source-contracts/09-06-SUMMARY.md
  modified:
    - apps/web/lib/catalogue-contract.ts
    - apps/web/__tests__/lib/catalogue-contract.test.ts
    - .planning/phases/09-catalogue-foundations-and-source-contracts/09-VALIDATION.md
decisions:
  - "Treat public source and region validators as unknown-shaped parsed-import boundaries before any member access."
  - "Reject own provenance properties on not-yet-verified coverage regardless of their runtime value, including undefined."
metrics:
  duration: 25min
  completed: 2026-09-22
  tasks_completed: 3
  files_modified: 3
status: complete
---

# Phase 09 Plan 06: Catalogue Import Guard Repair Summary

**Public catalogue import validators now safely reject malformed nested shapes and prevent source-bearing provenance from entering explicit unknown-coverage cells.**

## Performance

- **Duration:** 25 min
- **Completed:** 2026-09-22T22:40:22Z
- **Tasks:** 3/3
- **Files modified:** 3

## Accomplishments

- Added RED-first fixed-clock regressions covering undefined, null, primitive, and array source and region roots; missing or malformed official-boundary and local-focus metadata; and own `evidence`/`sourceUrl` fields on `not-yet-verified` coverage.
- Widened the public source and region validation boundaries to `unknown`, returning deterministic root or nested-object errors before property reads.
- Enforced the runtime coverage discriminator with own-property checks, including `evidence: undefined` and `sourceUrl: undefined`, without changing verified-evidence validation or frozen fixture data.
- Recorded CR-01/CR-02 coverage and the final quality gate in the Phase 09 validation map.

## Task Commits

1. **Task 1: Add RED public-import regressions for nested shapes and unverified-row evidence** — `1bdad0d` (RED)
2. **Task 2: Guard public source/region inputs and enforce the coverage discriminator at runtime** — `6443d76` (GREEN), `9e17a46` (Rule 1 type-guard correction)
3. **Task 3: Record final repair coverage and run the complete Phase 09 quality gate** — `143ae3d`

## Verification

- `pnpm --filter @scholar-scout/web run test -- __tests__/lib/catalogue-contract.test.ts --runInBand` — passed (67 tests).
- `pnpm --filter @scholar-scout/web run test -- __tests__/lib/catalogue-fixtures.test.ts --runInBand` — passed (7 tests).
- `pnpm --filter @scholar-scout/web run typecheck` — passed.
- `pnpm --filter @scholar-scout/web run lint` — passed.
- `pnpm --filter @scholar-scout/web run test --runInBand` — passed.

The checks emitted the existing Node 20 versus Node 24 engine warning and Next.js multiple-lockfile warning; neither affected verification, fixtures, dependencies, or configuration.

## Decisions Made

- Public validator parameters accept unknown parsed values and use non-array record guards before reading nested source, boundary, or local-focus fields.
- Explicit unknown coverage cannot own `evidence` or `sourceUrl`; a value of `undefined` does not bypass that boundary.
- The six frozen regional fixtures, ordered 36-cell baseline, D-08 card boundary, controlled vocabulary, source roster, and freshness policies remain unchanged.

## TDD Gate Compliance

- RED commit `1bdad0d` added 20 regression failures tied only to CR-01 and CR-02.
- GREEN commit `6443d76`, followed by the scoped type-guard correction `9e17a46`, makes all focused cases pass.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected private type guards after the complete quality gate found TypeScript errors.**

- **Found during:** Task 3 typecheck.
- **Issue:** The new public-boundary guards passed focused Jest but the private source-date and coordinate predicates still declared typed-only inputs, preventing the unknown-shaped boundary path from compiling safely.
- **Fix:** Made both predicates accept unknown records and narrow their properties before validation.
- **Files modified:** `apps/web/lib/catalogue-contract.ts`
- **Commit:** `9e17a46`

## Known Stubs

None.

## State Update Note

Pre-existing concurrent edits to `.planning/STATE.md`, `.planning/ROADMAP.md`, and `.planning/config.json` were preserved and deliberately not modified or staged by this plan.

## Self-Check

PASSED

- Confirmed the owned production module, test suite, validation map, and summary exist in the assigned worktree.
- Confirmed the RED, GREEN, Rule 1 correction, and validation-map commits (`1bdad0d`, `6443d76`, `9e17a46`, and `143ae3d`) exist in repository history.
