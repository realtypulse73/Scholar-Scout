---
phase: 05-school-community-and-wny-release-slice
plan: 03
subsystem: discovery-ui
tags: [nextjs, react, accessibility, western-new-york, school-lockers]
requires:
  - phase: 04
    provides: governed programme reads and conflict-safe persistence boundaries
provides:
  - Source-linked verification guidance and empty recovery states for WNY discovery
  - School-locker verification panel and known-school empty state
  - Deterministic WNY institution tie ordering with Unicode regression coverage
affects: [phase-05-plan-04, release-validation, discovery]
tech-stack:
  added: []
  patterns: [source-oriented verification copy, semantic discovery recovery states, deterministic institution tie-breaks]
key-files:
  created: []
  modified:
    - apps/web/lib/western-new-york.ts
    - apps/web/components/western-new-york/WesternNewYorkDirectory.tsx
    - apps/web/app/schools/[slug]/page.tsx
    - apps/web/__tests__/lib/western-new-york.test.ts
    - apps/web/__tests__/components/community-release.test.tsx
key-decisions:
  - "Discovery copy asks students to confirm information with institutional sources rather than claiming freshness, admission outcomes, safety, or independent verification."
  - "Known school lockers with no governed programmes remain reachable recovery states; only unknown slugs use the existing not-found path."
requirements-completed: [PROD-01]
coverage:
  - id: D1
    description: WNY discovery ranks equal-score institutions by name and presents accessible source guidance plus an empty recovery state.
    requirement: PROD-01
    verification:
      - kind: unit
        ref: apps/web/__tests__/lib/western-new-york.test.ts#sorts equal access scores by institution name
        status: pass
      - kind: automated_ui
        ref: apps/web/__tests__/components/community-release.test.tsx#discovery release surfaces
        status: pass
    human_judgment: true
    rationale: Manual release validation still checks keyboard traversal and responsive source-link wrapping.
  - id: D2
    description: Known school lockers show verification guidance and a semantic no-programmes recovery state.
    requirement: PROD-01
    verification:
      - kind: automated_ui
        ref: apps/web/__tests__/components/community-release.test.tsx#renders a known school recovery state with verification guidance when it has no programmes
        status: pass
    human_judgment: true
    rationale: Manual release validation still checks the rendered school locker alongside live governed programme data.
metrics:
  duration: 25min
  completed: 2026-08-29
status: complete
---

# Phase 5 Plan 03: WNY and School Discovery Hardening Summary

**Western New York and school-locker discovery now give source-linked verification guidance, deterministic equal-score ordering, and accessible recovery states without overstating programme evidence.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-08-29T17:49:00Z
- **Completed:** 2026-08-29T18:13:56Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Added normalized institution-name ordering when WNY access scores tie, with Unicode regression coverage.
- Replaced unsupported source-status claims with the approved verification notice, per-result source panel, labelled official links, and a WNY recovery card.
- Added the locked school-locker verification panel and a known-school, no-programmes recovery state while retaining unknown-slug 404 behavior.

## Task Commits

1. **Task 1: Release-harden Western New York source evidence and ordering** - `168e9c7` (test), `87c07aa` (feat)
2. **Task 2: Add school-locker verification and known-empty recovery** - `a157e5e` (test), `e7d7822` (test fix), `c849bd2` (feat)

## Files Created/Modified

- `apps/web/lib/western-new-york.ts` - Preserves deterministic institution-name tie-breaking after access score.
- `apps/web/components/western-new-york/WesternNewYorkDirectory.tsx` - Renders approved verification/source guidance and a nonblank empty state.
- `apps/web/app/schools/[slug]/page.tsx` - Renders the locker verification panel and known-empty programme recovery state.
- `apps/web/__tests__/lib/western-new-york.test.ts` - Covers equal-score ordering with Unicode names.
- `apps/web/__tests__/components/community-release.test.tsx` - Covers WNY and school-locker release states with accessible assertions.

## Decisions Made

- Use only source-oriented verification prompts; public copy does not state that listings are checked, current, safe, admission-ready, or independently verified.
- Treat a known locker without governed programmes as a recovery state instead of an empty list or 404.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Named mocked test components for lint compliance**
- **Found during:** Task 2
- **Issue:** New test mocks lacked display names and failed the repository's React lint rule.
- **Fix:** Replaced anonymous mocks with named mock components.
- **Files modified:** `apps/web/__tests__/components/community-release.test.tsx`
- **Verification:** Focused tests and lint pass.
- **Committed in:** `e7d7822`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Required test-only correction; no scope change.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Verification

- `pnpm --filter @scholar-scout/web test --runInBand -- __tests__/lib` — 23 suites, 166 tests passed.
- `pnpm --filter @scholar-scout/web test --runInBand -- __tests__/api` — 12 suites, 84 tests passed.
- `pnpm --filter @scholar-scout/web test --runInBand -- __tests__/components` — 11 suites, 57 tests passed.
- `pnpm --filter @scholar-scout/web run lint` — passed.
- `pnpm --filter @scholar-scout/web run typecheck` — passed.

## Self-Check: PASSED

- Confirmed each modified discovery source/test file exists and all five task commits are reachable.

## Next Phase Readiness

Plan 05-04 can consume the protected community APIs and completed discovery surfaces. Manual release validation should keyboard-check populated and empty WNY and school-locker states.

---
*Phase: 05-school-community-and-wny-release-slice*
*Completed: 2026-08-29*
