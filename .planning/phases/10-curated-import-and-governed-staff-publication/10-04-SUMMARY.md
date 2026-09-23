---
phase: 10-curated-import-and-governed-staff-publication
plan: 04
subsystem: catalogue-publication
tags: [nextjs, typescript, jest, staff-console, conflict-resolution, recovery]
requires:
  - phase: 10-03
    provides: checked private candidates, retained release manifests, and active snapshot state
provides:
  - deliberate stale-candidate comparison and reasoned conflict reconciliation
  - reviewer emergency snapshot corrections and administrator append-only restoration
  - focused staff intake and review console backed by redacted operational DTOs
affects: [10-05, catalogue-release, catalogue-admin]
tech-stack:
  added: []
  patterns: [safe conflict DTO, reasoned overwrite audit, append-only restore, capability-specific staff UI]
key-files:
  created:
    - apps/web/app/admin/catalogue-publications/page.tsx
    - apps/web/components/admin/CataloguePublicationManager.tsx
    - apps/web/__tests__/components/CataloguePublicationManager.test.tsx
  modified:
    - apps/web/lib/catalogue-publication.ts
    - apps/web/lib/server/catalogue-publications.ts
    - apps/web/app/api/admin/catalogue-publications/route.ts
    - apps/web/__tests__/lib/server/catalogue-publications.test.ts
    - apps/web/__tests__/api/admin-catalogue-publications.test.ts
key-decisions:
  - "Conflict comparisons expose only candidate ID, revision, title, claim boundary, and region ID; no raw import or learner data is returned."
  - "An older attempted title or claim boundary requires an 8-to-500-character audit reason before it can replace a newer stored value."
  - "Emergency corrections and restores append new snapshots and manifests; historic active snapshots are never mutated in place."
metrics:
  duration: 1h 5m
  completed: 2026-09-23
  tasks: 2
  files: 8
status: complete
---

# Phase 10 Plan 04: Staff Conflict and Recovery Console Summary

**Authorized staff can now stage and review private catalogue candidates in a focused, accessible console, reconcile stale edits deliberately, create checked emergency snapshots, and restore retained snapshots without erasing history.**

## Accomplishments

- Added safe stale-candidate conflict comparison and a reason-required resolution flow for deliberately retaining an older title or claim boundary.
- Added reviewer-only emergency corrections that rerun the checklist and create a reasoned, append-only emergency snapshot.
- Added administrator-only restoration that copies a retained target into a new `restore` snapshot and manifest instead of moving the active pointer backward.
- Added `/admin/catalogue-publications`, with structured private intake, checklist/correction states, independent review controls, safe audit evidence, and keyboard-operable conflict resolution.

## Task Commits

1. **Task 1: Add conflict reconciliation, emergency release, and restore commands** — `5727d6f` (RED test), `b58734a` (implementation)
2. **Task 2: Provide a focused, accessible intake, review, and conflict console** — `1a87453`

## Verification

- Focused server/API/component Jest coverage: 31 tests passed.
- `corepack pnpm --filter @scholar-scout/web run typecheck` — passed.
- `corepack pnpm --filter @scholar-scout/web run lint` — passed.
- Full web Jest suite was invoked through the workspace-local Jest executable with `--runInBand` and exited successfully; this environment emitted only the inherited multi-lockfile warning rather than its normal aggregate report.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed an unused weekly-release local that blocked zero-warning linting**
- **Found during:** Task 1 verification
- **Issue:** The existing release flow kept an unused `final` local after selection validation.
- **Fix:** Removed the dead local without changing the existing selection behavior.
- **Files modified:** `apps/web/lib/server/catalogue-publications.ts`
- **Verification:** Typecheck and lint pass.
- **Committed in:** `b58734a`

**Total deviations:** 1 auto-fixed (Rule 1).

## Known Stubs

None. The console intentionally does not include weekly release, emergency, restore, snapshot-history, or manifest controls; Plan 10-05 owns that separate release/recovery view.

## Self-Check: PASSED

- Confirmed the new staff page, component, component test, server commands, protected route, and API/server tests exist.
- Confirmed commits `5727d6f`, `b58734a`, and `1a87453` exist.
