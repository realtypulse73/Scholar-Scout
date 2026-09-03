---
phase: 05-school-community-and-wny-release-slice
plan: 02
subsystem: moderation
tags: [nextjs, react, staff-authorization, community-safety, jest]
requires:
  - phase: 05-01
    provides: Pending-review persistence operations and public-safe note lifecycle
provides:
  - Fresh-staff moderation API and server-gated queue page
  - Accessible pending-review restore/remove workflow with conflict recovery
affects: [community-ui, release-validation]
tech-stack:
  added: []
  patterns: [fresh authorization before sensitive storage, client queue removes only confirmed resolutions]
key-files:
  created:
    - apps/web/app/api/admin/community-moderation/route.ts
    - apps/web/app/admin/community-moderation/page.tsx
    - apps/web/components/admin/CommunityModerationQueue.tsx
  modified:
    - apps/web/__tests__/api/community-moderation.test.ts
    - apps/web/__tests__/components/community-release.test.tsx
key-decisions:
  - "Keep the moderation queue on a dedicated fresh-staff server route rather than extending programme administration."
  - "Use only the bounded pending-review operations and retain conflicted rows locally for retry."
patterns-established:
  - "Staff moderation: authorize before parsing or storage access, then consume staff-safe DTOs only."
  - "Destructive queue action: confirmation defaults to cancel, resolution locks one row, and success removes only that row."
requirements-completed: [PROD-03]
coverage:
  - id: D1
    description: Fresh staff authorization protects moderation reads and restore/remove state transitions.
    requirement: PROD-03
    verification:
      - kind: integration
        ref: apps/web/__tests__/api/community-moderation.test.ts#community moderation API
        status: pass
    human_judgment: false
  - id: D2
    description: Staff can safely resolve pending notes through an accessible queue with retry handling.
    requirement: PROD-03
    verification:
      - kind: automated_ui
        ref: apps/web/__tests__/components/community-release.test.tsx#CommunityModerationQueue
        status: pass
    human_judgment: true
    rationale: Visual layout and keyboard experience require release review in addition to component assertions.
duration: 30min
completed: 2026-08-29
status: complete
---

# Phase 5 Plan 02: Fresh-Staff Moderation Queue Summary

**A dedicated staff-only moderation route and accessible pending-review queue now restore or permanently remove reported notes without exposing author or reporter identity.**

## Performance

- **Duration:** 30 min
- **Completed:** 2026-08-29T13:58:09-04:00
- **Tasks:** 2/2
- **Files modified:** 5

## Accomplishments

- Added a fresh-staff API boundary that denies before parsing or reading records and resolves only through the bounded pending-review operations.
- Added a server-gated `/admin/community-moderation` screen separate from programme administration.
- Delivered safe, responsive queue states for populated, empty, busy, conflict, and failed resolutions, including confirmation and focus management.
- Passed the full discovered Jest suite through approved lib/api/components partitions: 46 suites and 298 tests.

## Task Commits

1. **Task 1: Add fresh-staff moderation read and resolution contracts** — `4356c4f` (test), `826195d` (feat)
2. **Task 2: Deliver the accessible focused moderation queue** — `e184e86` (test), `54a6023` (feat)

## Files Created/Modified

- `apps/web/app/api/admin/community-moderation/route.ts` — Fresh staff read/resolve contracts with stable invalid and conflict responses.
- `apps/web/app/admin/community-moderation/page.tsx` — Non-disclosing server gate and staff-safe queue data handoff.
- `apps/web/components/admin/CommunityModerationQueue.tsx` — Accessible queue, confirmation dialog, focus handling, and retry states.
- `apps/web/__tests__/api/community-moderation.test.ts` — Authorization ordering, DTO safety, transition, and conflict coverage.
- `apps/web/__tests__/components/community-release.test.tsx` — Queue action, confirmation, empty, and retry coverage.

## Verification

- `pnpm --filter @scholar-scout/web test --runInBand -- community-release community-moderation` — 2 suites, 10 tests passed.
- `pnpm --filter @scholar-scout/web test --runInBand -- __tests__/lib` — 23 suites, 164 tests passed.
- `pnpm --filter @scholar-scout/web test --runInBand -- __tests__/api` — 12 suites, 80 tests passed.
- `pnpm --filter @scholar-scout/web test --runInBand -- __tests__/components` — 11 suites, 54 tests passed.
- `pnpm --filter @scholar-scout/web run typecheck` — passed.
- `pnpm --filter @scholar-scout/web run lint` — passed.

## Decisions Made

- Kept moderation separate from `ProgrammeAdminManager` so sensitive community actions remain focused and server-gated.
- A successful resolution removes only its own row; a conflict or failure retains the row and announces retry guidance.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Test environment] Supplied the browser fetch mock explicitly in the queue test.**
- **Found during:** Task 2
- **Issue:** The jsdom test runtime did not provide a fetch function for the client queue.
- **Fix:** Initialized a typed fetch mock in the component test before asserting success and conflict behavior.
- **Files modified:** `apps/web/__tests__/components/community-release.test.tsx`
- **Verification:** Focused component and API suites passed.
- **Committed in:** `54a6023`

**Total deviations:** 1 auto-fixed (Rule 1).

## Issues Encountered

The all-at-once Jest host invocation did not emit a final result or JSON report. The approved equivalent gate ran every discovered conventional partition under the pinned Node 20/Corepack pnpm runtime; all 46 suites and 298 tests passed.

## User Setup Required

None - no external service configuration required.

## Self-Check: PASSED

- All five planned source/test files exist.
- Task commits `4356c4f`, `826195d`, `e184e86`, and `54a6023` exist.

## Next Phase Readiness

The protected moderation queue is ready for the Wave 2 inbox-extension plan. No product work from Plan 05-05 was started here.
