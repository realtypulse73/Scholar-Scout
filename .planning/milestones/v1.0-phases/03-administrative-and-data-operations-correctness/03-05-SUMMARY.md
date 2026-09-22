---
phase: 03-administrative-and-data-operations-correctness
plan: 05
subsystem: admin-data-recovery-ui
tags: [nextjs, react, accessibility, recovery, operations]
requires:
  - phase: 03-04
    provides: signed import validation, actor-bound recovery plans, and dedicated signing readiness
provides:
  - Capability-driven fail-closed data-operations UI sourced only from server-advertised actions
  - Accessible count-only backup/import preview and exact destructive confirmation flow
  - Responsive retention history, operational alerts, focus management, and live results
affects: [03-06, admin-programmes, recovery-operations, accessibility]
tech-stack:
  added: []
  patterns: [discriminated capability state, last-known read-only fallback, progressive signed-plan confirmation, focused live feedback]
key-files:
  created: []
  modified:
    - apps/web/components/admin/ProgrammeAdminManager.tsx
    - apps/web/__tests__/components/ProgrammeAdminManager.test.tsx
key-decisions:
  - "Use the capability endpoint as the sole client operation inventory and disable every mutation whenever the latest capability read is not fresh."
  - "Keep backup restore and signed import in one progressive plan-token flow with count-only preview, reason, and exact typed confirmation."
requirements-completed: [OPS-02, OPS-03, DATA-03]
coverage:
  - deliverable: Capability-driven fail-closed health and backup history
    verification:
      - kind: test
        ref: apps/web/__tests__/components/ProgrammeAdminManager.test.tsx#ProgrammeAdminManager-recovery-state-contract
        status: pass
      - kind: command
        ref: pnpm --filter @scholar-scout/web run typecheck
        status: pass
    human_judgment: false
  - deliverable: Signed count-only preview and exact recovery apply interactions
    verification:
      - kind: test
        ref: apps/web/__tests__/components/ProgrammeAdminManager.test.tsx#signed-recovery-flow
        status: pass
      - kind: test
        ref: apps/web/__tests__/api/admin-data-routes.test.ts
        status: pass
    human_judgment: false
  - deliverable: Responsive visual and assistive interaction backstops
    verification: []
    human_judgment: true
    rationale: User explicitly approved the 320px, 768px, and 1280px long-text and keyboard/live-announcement review checkpoint.
duration: 35min
completed: 2026-08-28
status: complete
---

# Phase 3 Plan 5: Capability-Driven Recovery UI Summary

**Server-advertised recovery capabilities now drive a fail-closed, accessible staff interface with signed count-only previews, exact confirmation, and truthful operational outcomes.**

## Performance

- **Duration:** 35 min
- **Completed:** 2026-08-28
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- Replaced the client-owned status/export surface with a discriminated server-capability state that distinguishes loading, verified, refreshing, last-known, and unavailable results.
- Preserved last verified counts as read-only after refresh failure, focused safe operational alerts, exposed complete support identifiers, and disabled all mutation controls until a fresh successful read.
- Rendered newest-first recovery backups with retention-hold metadata and no delete action, while omitting backup/import sections the server did not advertise.
- Connected backup restore and signed import to the current short-lived plan-token APIs with count-only impact tables, non-mutating validation copy, exact confirmation, duplicate-submit prevention, and conflict/expiry recovery focus.
- Received explicit human approval for the required 320px, 768px, and 1280px long-text, keyboard, focus, and live-announcement visual backstops.

## Task Commits

1. **Task 1 RED: Capability recovery UI contracts** - `0daa4f4`
2. **Task 1 GREEN: Capability-driven recovery status** - `a54e696`
3. **Task 2 RED: Recovery interaction contracts** - `7d01d21`
4. **Task 2 GREEN: Accessible signed recovery flow** - `d9df735`
5. **Task 3: Human visual and assistive verification** - approved 2026-08-28

## Files Created/Modified

- `apps/web/components/admin/ProgrammeAdminManager.tsx` - Capability state machine, retained read-only status, backup/import planning, exact confirmation, accessible focus, live outcomes, and responsive long-text handling.
- `apps/web/__tests__/components/ProgrammeAdminManager.test.tsx` - Server-capability, unavailable/last-known, retention, signed preview/apply, duplicate submission, conflict focus, and retryable failure coverage.

## Decisions Made

- The browser renders only operations present in the latest server capability response; it does not retain a parallel endpoint inventory or show unsupported export controls.
- A failed refresh preserves prior counts only as explicitly labeled last-known data and locks every mutation until a fresh capability read succeeds.
- Backup restore and import share one signed-plan interaction model so raw import data reaches validation only and Apply sends only the staged plan token, reason, and exact phrase.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated legacy restore requests to the signed plan-token route contracts**
- **Found during:** Task 2
- **Issue:** The existing UI posted reason/confirmation without the server-issued plan token and posted a second raw snapshot during import Apply.
- **Fix:** Retained the authoritative token from preview/validation and sent the exact staged Apply DTO required by Plans 03-03 and 03-04.
- **Files modified:** `apps/web/components/admin/ProgrammeAdminManager.tsx`
- **Verification:** Component request assertions and the admin route suite passed.
- **Commit:** `d9df735`

**Total deviations:** 1 auto-fixed bug. **Impact:** The UI now conforms to the already-approved recovery API without architectural expansion.

## Issues Encountered

- The shell defaulted to Node 24 and pnpm 11, while the repository requires Node 20 and pnpm 10.34.5. Verification used the provisioned repository-compatible Node 20/Corepack runtime.

## Human Verification

- The user explicitly approved the blocking visual/accessibility checkpoint on 2026-08-28.
- Approved scope: 320px, 768px, and 1280px layouts; long operator reasons, incident IDs, backup IDs, and digests; internal-only table overflow; keyboard focus; and single operation-specific live feedback.

## Verification

- Focused component and admin data route suites: 2 suites and 21 tests passed after checkpoint approval.
- Strict TypeScript: passed.
- ESLint with zero warnings: passed.
- Stub scan: no TODO, FIXME, placeholder, coming-soon, or UI-flow empty-value stubs found in the two modified files.

## Self-Check: PASSED

- Both modified files exist.
- All four required RED/GREEN task commits exist in git history.
- Task acceptance criteria and plan-level automated verification passed.
- The blocking visual and assistive checkpoint received explicit user approval.
- No plan-owned changes remain uncommitted before metadata closeout.

## Next Phase Readiness

- Plan 03-06 can add adapter evidence, operational documentation, and final Phase 3 verification over the completed recovery API and UI.
- Phase 3 is 5 of 6 plans complete with no blocker from Plan 03-05.

---
*Phase: 03-administrative-and-data-operations-correctness*
*Completed: 2026-08-28*
