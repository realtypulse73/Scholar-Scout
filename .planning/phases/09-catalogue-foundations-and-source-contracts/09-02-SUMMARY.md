---
phase: 09-catalogue-foundations-and-source-contracts
plan: 02
subsystem: catalogue-fixtures
tags: [typescript, jest, catalogue, regional-scope, source-metadata, coverage]
requires:
  - plan: 09-01
    provides: Controlled catalogue types, freshness policy, and matrix validation.
provides:
  - Frozen six-area boundary and local-focus source records.
  - Explicit ordered 36-cell regional pathway coverage baseline.
affects: [09-03-field-evidence, phase-10-reviewed-imports]
tech-stack:
  added: []
  patterns: [static typed fixture, literal provenance tests, controlled matrix derivation]
key-files:
  created:
    - apps/web/lib/catalogue-fixtures.ts
    - apps/web/__tests__/lib/catalogue-fixtures.test.ts
  modified: []
decisions:
  - Keep every boundary and civic-anchor source date structurally explicit as unavailable when the frozen roster does not publish an ISO calendar date.
  - Keep all Phase 9 coverage cells not-yet-verified and source-less until Phase 10 reviewed imports.
metrics:
  duration: 13min
  completed: 2026-09-22
  tasks_completed: 2
  files_created: 2
status: complete
---

# Phase 09 Plan 02: Catalogue Fixtures Summary

**Frozen six-area boundary and civic-anchor provenance with an explicit, ordered 36-cell not-yet-verified coverage baseline.**

## Performance

- **Duration:** 13 min
- **Completed:** 2026-09-22
- **Tasks:** 2/2
- **Files created:** 2

## Accomplishments

- Added six immutable regional records using the frozen July 2023 OMB CBSA release for the five U.S. areas and the separate STATIN KMA authority for Greater Kingston, Jamaica.
- Preserved every mandated civic address, source URL, `2026-09-22` check date, ten-mile straight-line focus, and Kingston `boundaryId: null` distinction.
- Added all 36 controlled region/pathway pairs in declared order, with every cell explicitly `not-yet-verified` and no provider inventory or availability claim.
- Added literal fixture regression tests for provenance, anchors, injected-clock boundary freshness, complete matrix ordering, and invalid coverage mutations.

## Task Commits

1. **Task 1: Freeze six source-bearing regional records** — `b644f66` (RED), `6617d55` (GREEN)
2. **Task 2: Publish the complete explicit coverage matrix** — `1f5c8ea` (RED), `3a1be86` (GREEN)

## Verification

- `pnpm --filter @scholar-scout/web run test -- catalogue-fixtures` — passed (6 tests).
- `pnpm --filter @scholar-scout/web run typecheck` — passed.
- `pnpm --filter @scholar-scout/web run lint` — passed.
- `pnpm --filter @scholar-scout/web run test --runInBand` — passed.

The commands reported the pre-existing Node 20 versus Node 24 engine warning and the existing multiple-lockfile Next.js warning; neither changed the completed fixture work or caused a quality-check failure.

## Decisions Made

- Use the frozen source roster only; no current Census lookup, runtime scraping, or provider aggregation is introduced.
- Retain a required `sourceDate` object for every source record. The frozen roster supplies no exact ISO calendar publication date for these pages, so each record explicitly uses the unavailable variant instead of inventing one.
- Keep boundary metadata separate from local-focus metadata so civic ten-mile anchors cannot be read as the official metro boundary.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The legacy `STATE.md` format remains incompatible with `state.advance-plan` and `state.update-progress`; the dedicated metric, decision, session, roadmap, and requirements handlers completed normally. This is the same pre-existing planning-state limitation recorded by Plan 09-01.

## Self-Check: PASSED

- Confirmed `apps/web/lib/catalogue-fixtures.ts` and `apps/web/__tests__/lib/catalogue-fixtures.test.ts` exist.
- Confirmed all four task commits (`b644f66`, `6617d55`, `1f5c8ea`, and `3a1be86`) are present in repository history.
