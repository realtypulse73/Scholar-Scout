---
phase: 12-qualification-lens-and-explanation-governance
plan: 01
subsystem: account qualification privacy and persistence
tags: [nextjs, react, typescript, jest, account-data, privacy, conditional-write]
requires:
  - phase: 11-choice-preserving-six-area-discovery
    provides: reviewed-snapshot discovery boundaries and student-controlled choice patterns
provides:
  - Account-only bounded qualification records with exact input validation
  - Private qualification route, persistence seam, and accessible Account editor
  - Regression coverage for ownership, conflicts, privacy, legacy normalization, and guest-migration separation
affects: [12-02, 12-03, qualification-lens, catalogue-explanations]
tech-stack:
  added: []
  patterns:
    - Exact private-record parsing with server-derived account ownership
    - Confirmed destructive clear with a retained-draft conflict recovery affordance
key-files:
  created:
    - apps/web/lib/qualification-record.ts
    - apps/web/app/api/account/qualifications/route.ts
    - apps/web/components/qualifications/QualificationRecordForm.tsx
    - apps/web/__tests__/components/QualificationRecordForm.test.tsx
  modified:
    - apps/web/lib/server/data-store.ts
    - apps/web/lib/server/student-records.ts
    - apps/web/components/profile/ProfileDashboard.tsx
    - apps/web/__tests__/api/account-qualification-routes.test.ts
    - apps/web/__tests__/lib/qualification-record.test.ts
    - apps/web/__tests__/lib/student-records.test.ts
key-decisions:
  - "Reject duplicate normalized keywords rather than silently collapsing repeated student input."
  - "Treat an all-empty saved qualification record as the documented Account empty state."
  - "Require explicit in-context confirmation before replacing a saved record with the approved empty record."
patterns-established:
  - "Private account data uses exact payload parsing, server-derived storage keys, generic audit metadata, and no guest-migration allowlist entry."
  - "Recoverable conditional-write conflicts preserve the visible draft and expose an explicit reload action."
requirements-completed: [MATCH-01, MATCH-04]
coverage:
  - id: D1
    description: Account-only private qualification record accepts only the approved structured choices, note, and confirmed keywords.
    requirement: MATCH-01
    verification:
      - kind: unit
        ref: apps/web/__tests__/lib/qualification-record.test.ts#qualification record contract
        status: pass
      - kind: integration
        ref: apps/web/__tests__/api/account-qualification-routes.test.ts#account qualification routes
        status: pass
    human_judgment: false
  - id: D2
    description: Legacy documents, account slices, audits, and guest migration retain the qualification privacy boundary.
    requirement: MATCH-04
    verification:
      - kind: unit
        ref: apps/web/__tests__/lib/student-records.test.ts#bounded student records
        status: pass
    human_judgment: false
  - id: D3
    description: Account form supports manual keywords, confirmed clear, failed-clear guidance, and draft-preserving conflicts.
    requirement: MATCH-01
    verification:
      - kind: automated_ui
        ref: apps/web/__tests__/components/QualificationRecordForm.test.tsx#QualificationRecordForm
        status: pass
    human_judgment: false
metrics:
  duration: 1h 10m
  completed: 2026-09-24
status: complete
---

# Phase 12 Plan 01: Private Qualification Account Record Summary

**A signed-in student can privately save, reload, edit, and deliberately clear one bounded qualification record without sharing it with guest migration, onboarding, or operational audit content.**

## Performance

- **Duration:** 1h 10m
- **Completed:** 2026-09-24
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- Restored and completed the account-only qualification parser, legacy-safe `qualificationProfiles` collection, conditional persistence helper, API route, and Account entry point.
- Enforced exact bounded input: only the five approved qualification kinds, a 500-character private note, and up to 12 explicit 40-character keywords are accepted; duplicate normalized keywords and prohibited fields are rejected.
- Added account, route, persistence, migration, and component regressions for safe ownership, generic audits, clear confirmation, failed clear, and draft-preserving conflicts.

## Task Commits

1. **Task 1: Save one private structured qualification through the signed-in Account path**
   - `8695c07` — test(12-01): add failing qualification account tests
   - `809d58b` — feat(12-01): save private account qualifications
2. **Task 2: Close private-record persistence and input-boundary regressions**
   - `65094d1` — test(12-01): cover qualification privacy boundaries
   - `104ffe0` — fix(12-01): reject duplicate qualification keywords
3. **Task 3: Finish the accessible private-form states and destructive clear flow**
   - `774bf7d` — test(12-01): add private qualification form regressions
   - `8c439d0` — feat(12-01): complete private qualification clear flow

## Files Created/Modified

- `apps/web/lib/qualification-record.ts` — exact private qualification parser and normalizer.
- `apps/web/lib/server/data-store.ts` and `apps/web/lib/server/student-records.ts` — legacy-compatible account collection and single-attempt conditional write seam.
- `apps/web/app/api/account/qualifications/route.ts` — account-only GET/POST endpoint with safe ownership and conflict responses.
- `apps/web/components/qualifications/QualificationRecordForm.tsx` — native-control editor with live status, manual keyword controls, clear confirmation, failed-clear feedback, and reload after conflict.
- `apps/web/components/profile/ProfileDashboard.tsx` — Account entry point for the private editor.
- `apps/web/__tests__/lib/qualification-record.test.ts`, `apps/web/__tests__/lib/student-records.test.ts`, `apps/web/__tests__/api/account-qualification-routes.test.ts`, and `apps/web/__tests__/components/QualificationRecordForm.test.tsx` — privacy, compatibility, API, and accessible-interaction coverage.

## Verification

- `corepack pnpm --filter @scholar-scout/web test -- --runInBand qualification-record account-qualification-routes` — passed: 2 suites, 3 tests.
- `corepack pnpm --filter @scholar-scout/web test -- --runInBand qualification-record account-qualification-routes student-records` — passed: 3 suites, 15 tests.
- `corepack pnpm --filter @scholar-scout/web test -- --runInBand QualificationRecordForm` — passed: 1 suite, 4 tests.
- `corepack pnpm --filter @scholar-scout/web run typecheck` — passed.
- `corepack pnpm --filter @scholar-scout/web run lint` — passed.
- `corepack pnpm --filter @scholar-scout/web test --runInBand` — passed using the project-standard direct flag form.

## Decisions Made

- Reject duplicate normalized keywords so the persisted record reflects one deliberate student choice per keyword.
- Keep an all-empty stored record visibly distinct as “No qualifications saved yet.”
- Make clear a deliberately confirmed account action; a failed clear leaves the displayed record intact.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Corrected the full-suite Jest invocation**
- **Found during:** Wave-end verification.
- **Issue:** The plan's extra `--` forwarded a literal test-name filter, yielding “No tests found.”
- **Fix:** Used the repository's established `corepack pnpm --filter @scholar-scout/web test --runInBand` form.
- **Files modified:** None.
- **Verification:** The corrected full-suite command completed successfully.

**2. [Rule 3 - Blocking] Reconciled legacy state tracking after the standard advance command could not parse it**
- **Found during:** Completion tracking.
- **Issue:** `state.advance-plan` could not parse the older “5 plans ready” position text in `STATE.md`.
- **Fix:** Used the working metric/session handlers, then updated the current Phase 12 position and Roadmap plan row to the completed 12-01 state.
- **Files modified:** `.planning/STATE.md`, `.planning/ROADMAP.md`.
- **Verification:** The Roadmap reports 1/5 executed and State names 12-02 as the next plan.

**Total deviations:** 2 auto-fixed (2 blocking execution/tracking corrections).
**Impact on plan:** No product scope changed; both corrections restore the repository's documented test and sequential-planning behavior.

## Known Stubs

None.

## Issues Encountered

- The existing parser silently deduplicated normalized keywords, which contradicted the planned exact-input boundary. The repair now rejects duplicates before persistence.

## User Setup Required

None — no external service configuration is required.

## Next Phase Readiness

The private, account-only qualification input boundary is ready for Phase 12 catalogue evidence and explanation work. Later plans must continue to consume only this bounded record and reviewed catalogue facts.

## Self-Check: PASSED

- Confirmed the summary exists and all six Task 1–3 commits are reachable in Git history.
- Confirmed no whitespace errors in this plan's changes.

---
*Phase: 12-qualification-lens-and-explanation-governance*
*Completed: 2026-09-24*
