---
phase: 06-end-to-end-hardening-and-release-readiness
plan: 02
subsystem: testing
tags: [e2e, fixture, nextjs, https, governed-catalogue]
requires:
  - phase: 05-school-community-and-wny-release-slice
    provides: protected persistence and release-quality boundaries
provides:
  - Owned HTTPS Next launcher with an isolated JSON fixture directory
  - Capability-gated, server-owned programme lifecycle through the governed catalogue
affects: [phase-06-browser-journey, ci, preview-rehearsal]
tech-stack:
  added: []
  patterns: [server-owned fixture selection, capability-gated no-body lifecycle transport]
key-files:
  created:
    - scripts/run-e2e-fixture.mjs
    - scripts/e2e-fixture-lifecycle.mjs
    - apps/web/app/api/internal/e2e-fixture/route.ts
    - apps/web/lib/server/e2e-programme-fixture.ts
  modified:
    - apps/web/lib/server/programme-records.ts
key-decisions:
  - "Fixture programme selection is derived exclusively inside the Next runtime and bypasses seed merging in fixture mode."
  - "The supervisor retains the per-run capability and fixture identifier; browser execution receives only the HTTPS base URL."
patterns-established:
  - "E2E lifecycle operations use fixed no-body POST, GET, and DELETE requests with one Authorization capability."
requirements-completed: [OPS-04, PROD-04]
coverage:
  - id: D1
    description: "Owned launcher rejects production or externally selected data targets and creates its JSON file inside one temporary directory."
    requirement: OPS-04
    verification:
      - kind: integration
        ref: "node --test scripts/run-e2e-fixture.test.mjs scripts/e2e-fixture-lifecycle.test.mjs"
        status: pass
    human_judgment: false
  - id: D2
    description: "Internal route creates, verifies, and removes generated programmes only through the governed catalogue boundary."
    requirement: PROD-04
    verification:
      - kind: integration
        ref: "apps/web/__tests__/app/api/internal/e2e-fixture/route.test.ts and apps/web/__tests__/lib/server/e2e-programme-fixture.test.ts"
        status: pass
    human_judgment: false
duration: 28min
completed: 2026-09-01
status: complete
---

# Phase 6 Plan 02: Owned E2E Fixture Lifecycle Summary

**An isolated HTTPS Next launcher now provisions a capability-gated, governed generated-programme catalogue with exact cleanup.**

## Performance

- **Duration:** 28 min
- **Completed:** 2026-09-01T22:37:40Z
- **Tasks:** 2/2
- **Files modified:** 9

## Accomplishments

- Added a disposable, non-production JSON fixture launcher that rejects external targets and runs one owned HTTPS Next process.
- Added fixed no-body lifecycle transport that keeps the capability and fixture identifier out of browser inputs.
- Added deterministic generated programme creation, verification, and cleanup through `saveProgrammeRecord`, `getGovernedProgrammes`, and `deleteProgrammeRecord`.
- Prevented fixture mode from falling through to ordinary seed catalogue records.

## Task Commits

1. **Task 1: Launch one disposable HTTPS application process for one browser run** - `5313bb5` (test), `9d7fb65` (feat)
2. **Task 2: Make the launcher the exclusive local and CI browser entry point** - `9d7fb65` (feat)

## Files Created/Modified

- `scripts/run-e2e-fixture.mjs` - Owns the temporary directory, child process, capability, and browser command boundary.
- `scripts/e2e-fixture-lifecycle.mjs` - Performs fixed create/verify/cleanup transport with idempotent cleanup.
- `apps/web/app/api/internal/e2e-fixture/route.ts` - Denies browser-shaped, caller-selected, production, and unauthorised lifecycle access.
- `apps/web/lib/server/e2e-programme-fixture.ts` - Defines and governs deterministic generated records.
- `apps/web/lib/server/programme-records.ts` - Returns fixture records alone when fixture mode is active.

## Decisions Made

- Fixture record IDs are server-derived from a unique process-local fixture ID; callers cannot nominate a record set, source, storage target, or lifecycle phase.
- The launcher passes only `PLAYWRIGHT_BASE_URL` to the browser process, while the per-run capability remains confined to supervisor/server transport.

## Verification

- `node --test scripts/run-e2e-fixture.test.mjs scripts/e2e-fixture-lifecycle.test.mjs` — passed (4 tests).
- `pnpm --filter @scholar-scout/web test --runInBand __tests__/app/api/internal/e2e-fixture/route.test.ts __tests__/lib/server/e2e-programme-fixture.test.ts` — passed (5 tests).
- `pnpm --filter @scholar-scout/web run lint` — passed.
- `pnpm --filter @scholar-scout/web run typecheck` — passed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Used the Node Jest environment for the internal route test.**
- **Found during:** Task 1
- **Issue:** The default jsdom environment did not provide Next's server `Request` primitive while importing the route.
- **Fix:** Marked the route suite with `@jest-environment node`.
- **Files modified:** `apps/web/__tests__/app/api/internal/e2e-fixture/route.test.ts`
- **Verification:** Targeted route suite passed.
- **Committed in:** `5313bb5`

**Total deviations:** 1 auto-fixed (Rule 1)

## Issues Encountered

- The workspace sandbox initially blocked Node runtime resolution and exposed an incompatible global Pnpm. Verification was rerun through the approved pinned runtime and passed.

## Known Stubs

None.

## Next Phase Readiness

Plan 06-03 can use `scripts/run-e2e-fixture.mjs` as the only local/CI browser launcher and rely on its protected server lifecycle.

## Self-Check: PASSED

- Confirmed the nine plan-owned implementation and test files exist.
- Confirmed commits `5313bb5` and `9d7fb65` exist on `worktree-agent-phase6`.
