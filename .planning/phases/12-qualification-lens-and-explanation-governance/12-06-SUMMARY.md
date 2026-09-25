---
phase: 12-qualification-lens-and-explanation-governance
plan: 06
subsystem: qualification-lens
tags: [nextjs, react, nextauth, qualification-record, jest]
requires:
  - phase: 12-01
    provides: private account qualification records and account actor storage keys
  - phase: 12-02
    provides: source-backed, non-predictive qualification lens model
  - phase: 12-03
    provides: Programmes qualification editor and all-visible ordering control
  - phase: 12-05
    provides: shared detail and comparison qualification explanations
provides:
  - trusted shared qualification-record lookup keys on every learner surface
  - server-lens refresh only after accepted embedded qualification persistence
affects: [phase-12-verification, phase-13]
tech-stack:
  added: []
  patterns: [server-derived account namespace, success-only App Router refresh]
key-files:
  created:
    - apps/web/__tests__/app/programmes/page.test.tsx
    - apps/web/__tests__/app/shortlist/page.test.tsx
  modified:
    - apps/web/lib/server/student-actor.ts
    - apps/web/app/programmes/page.tsx
    - apps/web/app/programmes/[id]/page.tsx
    - apps/web/app/shortlist/page.tsx
    - apps/web/components/catalogue/CatalogueDiscoveryOverview.tsx
    - apps/web/components/qualifications/QualificationRecordForm.tsx
key-decisions:
  - "Learner qualification lookups share the account:<id> constructor and derive IDs only from the trusted server session."
  - "The Programmes overview refreshes only after the account route accepts a save or clear; conflicts and failed writes retain the draft."
patterns-established:
  - "Private qualification notes never cross into learner-surface lens inputs or router state."
requirements-completed: [MATCH-01, MATCH-02, MATCH-03, MATCH-04]
coverage:
  - id: D1
    description: Signed-in learners receive only their own source-backed qualification explanation on Programmes, detail, and shortlist.
    requirement: MATCH-01
    verification:
      - kind: integration
        ref: "__tests__/app/programmes/page.test.tsx; __tests__/app/programmes/[id]/page.test.tsx; __tests__/app/shortlist/page.test.tsx"
        status: pass
    human_judgment: false
  - id: D2
    description: A successful embedded save or clear refreshes the Programmes server lens and returns focus, while failed writes retain the editor draft.
    requirement: MATCH-01
    verification:
      - kind: automated_ui
        ref: "__tests__/components/QualificationRecordForm.test.tsx; __tests__/components/CatalogueDiscoveryOverview.test.tsx"
        status: pass
    human_judgment: true
    rationale: "An authenticated browser check is still needed to independently confirm dynamic refresh and assistive-technology behavior."
duration: 45min
completed: 2026-09-25
status: complete
---

# Phase 12 Plan 06: Qualification Lens Wiring Repair Summary

**Trusted account-key composition now brings a saved private qualification record to all three learner surfaces, with a success-only Programmes refresh that never transports private notes.**

## Performance

- **Duration:** 45min
- **Completed:** 2026-09-25
- **Tasks:** 3/3
- **Files modified:** 12

## Accomplishments

- Added one server-only `account:<id>` key constructor and used it for Programmes, programme detail, and shortlist qualification reads.
- Added signed-in, guest, and foreign-account regressions proving private notes do not reach the factual lens.
- Refreshed the Programmes server lens only after a successful qualification save or confirmed clear, preserving the draft for conflict and non-OK responses.

## Task Commits

1. **Task 1: Reach a saved account qualification from Programmes through one trusted storage-key seam** — `bea7da4` (test), `c6d3c22` (feat)
2. **Task 2: Compose the active account record on detail and saved-comparison pages** — `1147777` (feat)
3. **Task 3: Refresh the embedded Programmes lens only after successful qualification persistence** — `6b67069` (feat)
4. **Verification repair: provide the App Router test context** — `9adcee3` (test)

## Verification

- PASS — `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/api/auth-controls.test.ts __tests__/app/programmes/page.test.tsx`
- PASS — `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/app/programmes/[id]/page.test.tsx __tests__/app/shortlist/page.test.tsx`
- PASS — `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/components/QualificationRecordForm.test.tsx __tests__/components/CatalogueDiscoveryOverview.test.tsx`
- PASS — `corepack pnpm --filter @scholar-scout/web run typecheck`
- PASS — `corepack pnpm --filter @scholar-scout/web run lint`
- PASS — `corepack pnpm --filter @scholar-scout/web test --runInBand`

## Files Created/Modified

- `apps/web/lib/server/student-actor.ts` — exposes the trusted account storage-key constructor.
- `apps/web/app/programmes/page.tsx` — reads the current account’s persisted qualification record.
- `apps/web/app/programmes/[id]/page.tsx` — composes the current account’s note-free detail lens.
- `apps/web/app/shortlist/page.tsx` — composes the current account’s note-free saved-comparison lens.
- `apps/web/components/catalogue/CatalogueDiscoveryOverview.tsx` — refreshes after accepted persistence before focus restoration.
- `apps/web/components/qualifications/QualificationRecordForm.tsx` — emits a success callback only after an accepted POST.

## Decisions Made

- Use the existing server-derived `account:<id>` namespace as the only qualification-record lookup key; no request, URL, prop, or client state may select it.
- Keep private notes outside both learner explanation inputs and App Router navigation state.
- Treat refresh as a presentation response to a successful persistence result, never as a response to a failed or conflicted write.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking test infrastructure] Added an App Router mock to the Programmes server-page test.**
- **Found during:** Final full-suite verification.
- **Issue:** The newly required `useRouter` hook correctly required App Router context, but the pre-existing page test did not supply it.
- **Fix:** Mocked the refresh-only router contract in that test.
- **Files modified:** `apps/web/__tests__/app/programmes/page.test.tsx`
- **Verification:** Focused page test and the final full Jest suite pass.
- **Committed in:** `9adcee3`

**TDD record:** Task 1’s intentionally failing RED tests were explicitly approved and committed. Tasks 2 and 3 produced expected RED failures before implementation; their tests were kept with the respective GREEN commits after the commit guard did not authorize separate intentionally failing-test commits.

## Issues Encountered

The first full run exposed only the missing App Router mock described above. It was test-environment plumbing rather than a product failure and was repaired without expanding application scope.

## User Setup Required

None — no external configuration, secrets, or deployment change is required.

## Next Phase Readiness

The gap-closure implementation and its complete automated suite are ready for an independent Phase 12 re-verification. This plan does **not** claim that Phase 12 is complete; the independent verifier must update the prior `gaps_found` report before Phase 13 depends on this work.

## Self-Check: PASSED

- Confirmed all 12 plan-owned source/test files and this summary exist.
- Confirmed task commits `bea7da4`, `c6d3c22`, `1147777`, `6b67069`, and `9adcee3` exist in Git history.

---
*Phase: 12-qualification-lens-and-explanation-governance*
*Plan completed: 2026-09-25*
