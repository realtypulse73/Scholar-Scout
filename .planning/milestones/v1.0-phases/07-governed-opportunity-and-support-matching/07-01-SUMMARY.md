---
phase: 07-governed-opportunity-and-support-matching
plan: 01
subsystem: catalogue-governance
tags: [typescript, nextjs, jest, programme-evidence, staff-admin]
requires:
  - phase: 06-end-to-end-hardening-and-release-readiness
    provides: Protected staff programme-record mutation and Jest quality gates.
provides:
  - Field-level programme evidence with documented, unknown, stale, and conflicting states.
  - Safe normalization of legacy programme facts and support listings at the governed catalogue boundary.
  - Staff controls and server validation for attributable material and support evidence.
affects: [opportunity-matching, recommendation-explanations, sensitive-referrals]
tech-stack:
  added: []
  patterns:
    - Normalize legacy evidence to unknown rather than promoting unverified data.
    - Require public attribution and verification guidance before a field is documented.
key-files:
  created:
    - .planning/phases/07-governed-opportunity-and-support-matching/07-01-SUMMARY.md
  modified:
    - apps/web/lib/programmes.ts
    - apps/web/lib/server/programme-records.ts
    - apps/web/lib/admin-programmes.ts
    - apps/web/components/admin/ProgrammeAdminManager.tsx
    - apps/web/__tests__/lib/admin-programmes.test.ts
    - apps/web/__tests__/components/ProgrammeAdminManager.test.tsx
    - apps/web/__tests__/api/admin-programmes.test.ts
key-decisions:
  - "Legacy programme records normalize to explicit unknown evidence with verification guidance."
  - "Only documented field evidence with a public source label, URL, and verification guidance may represent a staff claim as documented."
patterns-established:
  - "Catalogue readers use normalizeProgrammeForGovernance through mergeProgrammes."
  - "Evidence editor fields are bounded to source checks and supports selected for the programme."
requirements-completed: []
coverage:
  - id: D1
    description: Staff-published material facts and ordinary supports retain attributable documented evidence.
    verification:
      - kind: unit
        ref: apps/web/__tests__/lib/admin-programmes.test.ts#keeps documented material facts and ordinary supports attributable at the catalogue boundary
        status: pass
      - kind: integration
        ref: apps/web/__tests__/api/admin-programmes.test.ts#rejects undocumented staff publication evidence before saving a record
        status: pass
    human_judgment: false
  - id: D2
    description: Legacy programme records remain readable with explicit unknown evidence and verification guidance.
    verification:
      - kind: unit
        ref: apps/web/__tests__/lib/admin-programmes.test.ts#keeps legacy programme facts and supports visible as unknown evidence
        status: pass
    human_judgment: false
  - id: D3
    description: Staff can edit bounded evidence-state and attribution fields for material facts and selected supports.
    verification:
      - kind: automated_ui
        ref: apps/web/__tests__/components/ProgrammeAdminManager.test.tsx#lets staff enter bounded attributable evidence for material facts and listed supports
        status: pass
    human_judgment: false
duration: 48min
completed: 2026-09-21
status: complete
---

# Phase 07 Plan 01: Governed Programme Evidence Boundary Summary

**The governed catalogue now carries field-level source evidence, safely marks legacy information unknown, and gives staff a bounded way to publish attributable programme facts and supports.**

## Performance

- **Duration:** 48 min
- **Completed:** 2026-09-21
- **Tasks:** 2/2
- **Files modified:** 7

## Accomplishments

- Added finite documented, unknown, stale, and conflicting evidence states for material facts and programme support bundles.
- Normalized every governed catalogue result so legacy facts remain visible as unknown and tell students to verify directly.
- Rejected staff attempts to mark evidence documented without a public label, URL, and verification guidance.
- Added accessible staff fields for source attribution, optional verification dates, guidance, and bounded evidence states.

## Task Commits

1. **Task 1: Prove one staff-published documented support through the governed catalogue boundary**
   - `7c0f304` — test(07-01): add failing programme evidence coverage
   - `f88164f` — feat(07-01): govern programme evidence
2. **Task 2: Preserve legacy programme visibility and complete staff evidence editing**
   - `fd46dcf` — test(07-01): cover staff programme evidence inputs
   - `1da30c1` — feat(07-01): add staff evidence editor

## Verification

- `corepack pnpm --filter @scholar-scout/web test --runInBand __tests__/components/ProgrammeAdminManager.test.tsx __tests__/lib/admin-programmes.test.ts __tests__/api/admin-programmes.test.ts` — passed, 37 tests.
- `corepack pnpm --filter @scholar-scout/web run lint` — passed.
- `corepack pnpm --filter @scholar-scout/web run typecheck` — passed.

## Decisions Made

- New documented claims need field-level public attribution; record-level confidence cannot substitute for it.
- The governed catalogue deliberately normalizes missing legacy evidence to unknown instead of hiding programmes or guessing support availability.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical validation] Added a focused staff-editor component test.**
- **Found during:** Task 2
- **Issue:** The plan required staff evidence editing but listed only library/API tests, leaving its accessible controls unproven.
- **Fix:** Added a focused Jest component test for the evidence editor's bounded controls.
- **Files modified:** `apps/web/__tests__/components/ProgrammeAdminManager.test.tsx`
- **Verification:** Focused component, library, and API suites passed.
- **Committed in:** `fd46dcf`, `1da30c1`

**Total deviations:** 1 auto-fixed (Rule 2).
**Impact on plan:** Added required UI verification without changing product scope.

## Issues Encountered

- The plan's documented Jest invocation had an extra argument separator and did not run the selected tests. Used the repository-approved `pnpm test --runInBand <workspace-relative paths>` form recorded in project state; the focused suites then ran and passed.

## Next Phase Readiness

Plan 02 can consume `programmeEvidence` without treating any legacy programme support as confirmed or adding sensitive information to the ordinary recommendation profile.

## Self-Check: PASSED

- Confirmed all seven listed implementation/test files exist.
- Confirmed commits `7c0f304`, `f88164f`, `fd46dcf`, and `1da30c1` exist in Git history.

