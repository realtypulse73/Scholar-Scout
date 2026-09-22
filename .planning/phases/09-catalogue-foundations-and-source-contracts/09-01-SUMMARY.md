---
phase: 09-catalogue-foundations-and-source-contracts
plan: 01
subsystem: catalogue-domain-contract
tags: [typescript, jest, catalogue, evidence, freshness, geography]
requires:
  - phase: v1.0-governed-catalogue
    provides: Legacy Programme boundary retained unchanged by this isolated contract.
provides:
  - Pure six-region and six-pathway catalogue vocabulary.
  - Source metadata, fixed-clock freshness, local-focus, and explicit coverage validation.
affects: [09-02-catalogue-fixtures, 09-03-field-evidence, phase-10-publication]
tech-stack:
  added: []
  patterns: [pure named TypeScript validators, injected-clock freshness, ordered explicit coverage matrix]
key-files:
  created:
    - apps/web/lib/catalogue-contract.ts
    - apps/web/__tests__/lib/catalogue-contract.test.ts
  modified: []
key-decisions:
  - "Keep official boundaries and ten-mile local-focus anchors structurally distinct."
  - "Treat unavailable, malformed, future, and stale source dates as non-current under an injected clock."
  - "Require explicit coverage cells and derive missing-pair errors from controlled declaration order."
patterns-established:
  - "Pure catalogue validators return deterministic string arrays for expected invalid input."
  - "Local-focus distance is straight-line geographic scope, never commute time or a boundary replacement."
requirements-completed: [REG-01, REG-02, REG-03, EVID-01, EVID-02]
coverage:
  - id: D1
    description: Six-area source, boundary, local-focus, and freshness contract.
    requirement: REG-01
    verification:
      - kind: unit
        ref: apps/web/__tests__/lib/catalogue-contract.test.ts#catalogue contract
        status: pass
      - kind: other
        ref: pnpm --filter @scholar-scout/web run typecheck
        status: pass
    human_judgment: false
  - id: D2
    description: Controlled pathway vocabulary and explicit deterministic coverage validation.
    requirement: REG-02
    verification:
      - kind: unit
        ref: apps/web/__tests__/lib/catalogue-contract.test.ts#returns deterministic validation errors for empty, duplicate, unsupported, and missing coverage cells
        status: pass
    human_judgment: false
  - id: D3
    description: Honest verified and not-yet-verified coverage state contract.
    requirement: REG-03
    verification:
      - kind: unit
        ref: apps/web/__tests__/lib/catalogue-contract.test.ts#proves one source-dated region-to-coverage path
        status: pass
    human_judgment: false
duration: 41min
completed: 2026-09-22
status: complete
---

# Phase 09 Plan 01: Catalogue Contract Summary

**Pure six-region catalogue contract with attributable source dates, fixed-clock freshness, ten-mile geographic scope, and explicit pathway coverage validation.**

## Performance

- **Duration:** 41 min
- **Started:** 2026-09-22T20:15:00Z
- **Completed:** 2026-09-22T20:56:02Z
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments

- Added separate controlled vocabulary for the six approved regions and six browseable pathway classes without changing the legacy `Programme` module.
- Added mandatory source metadata, inspectable official-boundary/local-focus models, injected-clock 183/731-day freshness, and an inclusive great-circle ten-mile check.
- Added deterministic validation for source records and coverage matrices, including empty input, duplicates, unsupported values, and missing expected pairs.

## Task Commits

1. **Task 1: Prove one source-dated region-to-coverage path end to end** — `db92e0d` (test), `257309e` (feat)
2. **Task 2: Make boundary freshness and coverage failures explicit** — `8704d2b` (test), `2a91053` (test)

## Files Created/Modified

- `apps/web/lib/catalogue-contract.ts` — pure controlled catalogue vocabulary, source/date validation, freshness, distance, and coverage rules.
- `apps/web/__tests__/lib/catalogue-contract.test.ts` — source-dated tracer and deterministic boundary/matrix regression tests.

## Decisions Made

- Keep `OfficialBoundary` and `LocalFocus` separate so a documented ten-mile anchor cannot be mistaken for the official regional scope.
- Use the declared earth-radius constant and unrounded numeric comparison for local-focus membership.
- Derive expected coverage pairs in exported controlled order instead of trusting caller order or inferring availability from absent data.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added the missing great-circle angle conversion helper.**
- **Found during:** Task 1
- **Issue:** The initial distance helper referenced an undefined `toRadians` function.
- **Fix:** Added the private conversion helper and reran the focused contract suite.
- **Files modified:** `apps/web/lib/catalogue-contract.ts`
- **Verification:** `pnpm --filter @scholar-scout/web run test -- catalogue-contract`
- **Committed in:** `257309e`

---

**Total deviations:** 1 auto-fixed (Rule 1)
**Impact on plan:** The correction was required for the planned local-focus behavior and introduced no scope expansion.

## Issues Encountered

- The exact-boundary test fixture was a microscopic amount outside the radius after decimal conversion. The fixture was corrected to a precomputed in-radius coordinate; production distance comparison remains full precision and unrounded.
- The local runtime reports Node 20 while the workspace declares Node 24. Focused Jest, TypeScript, and lint verification all passed; no runtime or dependency configuration was changed.
- `state.advance-plan` could not parse this legacy `STATE.md` layout. Metric, decision, session, roadmap, and requirements updates completed through their dedicated handlers.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 09-02 can import the stable source metadata, region, pathway, coverage, and freshness interfaces to define its six static fixtures and complete 36-cell matrix.
- No provider inventory, live source lookup, ranking, persistence, routes, or sensitive data was introduced.

## Self-Check: PASSED

- Confirmed both owned implementation/test files and this summary exist in the worktree.
- Confirmed all four task-level commits are present in repository history.

---
*Phase: 09-catalogue-foundations-and-source-contracts*
*Completed: 2026-09-22*
