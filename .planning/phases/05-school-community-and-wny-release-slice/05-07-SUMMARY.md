---
phase: 05-school-community-and-wny-release-slice
plan: 07
subsystem: WNY discovery source data
tags: [wny, source-links, regression-test]
dependency_graph:
  requires: [05-06]
  provides: [G-05-1 source record correction]
  affects: [WNY Preview source anchors]
tech_stack:
  added: []
  patterns: [production-dataset regression assertion]
key_files:
  created: []
  modified:
    - apps/web/lib/western-new-york.ts
    - apps/web/__tests__/lib/western-new-york.test.ts
decisions:
  - Replaced only SUNY Erie source fields with the supplied ecc.edu destinations.
metrics:
  duration: not-recorded
  completed_date: 2026-08-29
status: blocked
---

# Phase 5 Plan 07: SUNY Erie Source Repair Summary

The real SUNY Erie WNY record now uses the verified ecc.edu official, admissions-hub, and application destinations, with a regression test that prevents those fields or its review date from drifting.

## Completed Work

- Changed only the `suny-erie` record's `officialUrl`, `mediaUrl`, `admissions.admissionsUrl`, contextual admissions source URL, and `sourceCheckedOn` value.
- Added a production-dataset Jest assertion for all corrected values, including the contextual admissions source.
- Task commit: `913adc7` (`fix(05-07): repair SUNY Erie source destinations`).

## Verification

- `pnpm --filter @scholar-scout/web test --runInBand -- western-new-york` — passed (1 suite, 3 tests).
- `pnpm --filter @scholar-scout/web run lint` — passed.
- `pnpm --filter @scholar-scout/web run typecheck` — passed.

## Deviations from Plan

None in the scoped source-data task.

## Blocker

The mandated Preview precondition was not met in this executor because no reachable Git-integrated Vercel Preview session was available. The correction and test were committed as `913adc7`; Preview UAT could not be rerun or newly claimed. `05-UAT.md` records that limitation while preserving earlier historical evidence.

## Self-Check: PASSED

- `apps/web/lib/western-new-york.ts` contains the three supplied ecc.edu destination values and the repaired review date.
- `apps/web/__tests__/lib/western-new-york.test.ts` imports and checks the real `WESTERN_NEW_YORK_INSTITUTIONS` SUNY Erie record.
