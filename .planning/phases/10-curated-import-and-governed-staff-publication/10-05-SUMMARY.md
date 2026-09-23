---
phase: 10-curated-import-and-governed-staff-publication
plan: 05
subsystem: catalogue-publication
tags: [nextjs, typescript, jest, staff-console, release, recovery, audit]
requires:
  - phase: 10-04
    provides: private intake, independent review, conflict resolution, emergency correction, and append-only restore commands
provides:
  - capability-gated staff weekly release preview and explicit publish controls
  - capability-gated emergency correction and append-only restore controls
  - redacted release history with manifest lineage and stored-snapshot regression coverage
affects: [phase-11, catalogue-discovery, catalogue-admin]
tech-stack:
  added: []
  patterns: [server-derived release eligibility, non-mutating preview, capability-gated recovery, redacted DTO history]
key-files:
  created:
    - .planning/phases/10-curated-import-and-governed-staff-publication/10-05-SUMMARY.md
  modified:
    - apps/web/app/admin/catalogue-publications/page.tsx
    - apps/web/components/admin/CataloguePublicationManager.tsx
    - apps/web/__tests__/api/admin-catalogue-publications.test.ts
    - apps/web/__tests__/components/CataloguePublicationManager.test.tsx
    - apps/web/__tests__/lib/server/catalogue-publications.test.ts
    - docs/curated-catalogue-publication-runbook.md
key-decisions:
  - "Weekly preview remains non-mutating and publish always performs a fresh server-side eligibility recheck."
  - "Emergency correction is reviewer-gated and distinct from the normal weekly schedule; restore is administrator-gated and append-only."
  - "Staff snapshot history displays only release evidence and manifest lineage, never candidate/import/learner/provider-private data or secrets."
metrics:
  duration: 38m
  completed: 2026-09-23
  tasks: 2
  files: 6
status: complete
---

# Phase 10 Plan 05: Release Recovery and Audit Closure Summary

**Staff can now preview and explicitly publish a server-governed weekly catalogue snapshot, perform only their authorized recovery actions, and inspect redacted immutable release history.**

## Accomplishments

- Added a focused release/recovery/audit console to the existing private catalogue workflow.
- Made weekly preview explicitly non-mutating and displayed server-derived New York release-window and ISO-week eligibility, deterministic selection order, quarantines, and factual media fallbacks.
- Added reviewer-only emergency correction and administrator-only restore forms, with reason feedback and append-only outcomes.
- Added redacted snapshot history with actor, capability, outcome, version, release kind, correction/review status, and manifest lineage.
- Expanded the staff runbook with capability configuration, intake limits, checklist/review, weekly release, emergency correction, restore, conflict recovery, redaction, and stored-snapshot read-boundary procedures.
- Added regression coverage for role-sensitive recovery controls, redacted history, and no-provider-network public snapshot reads.

## Task Commits

1. **Task 1: Add the focused release, recovery, and audit console slice** — `fbdfbd0` (`feat`)
2. **Task 2: Close the lifecycle regression matrix and finalize safe operating instructions** — `7106d70` (`test`)

## Verification

- Focused Phase 10 matrix: 85 tests passed across pure contract, server lifecycle, API route, component, and data-store suites.
- `tsc --project tsconfig.json --pretty false` — passed.
- `eslint . --ext .ts,.tsx --max-warnings=0` — passed.
- Full web Jest suite with `--runInBand` — exited successfully; this checkout reports the inherited multiple-lockfile warning without its normal aggregate test summary.

## Deviations from Plan

None - plan executed as written.

## Known Stubs

None.

## Threat Flags

None. The console uses existing staff-only routes and server-side capability checks; it introduces no new external endpoint or provider-network dependency.

## Self-Check: PASSED

- Confirmed the staff page, release/recovery component, route tests, component tests, lifecycle tests, and runbook updates exist.
- Confirmed commits `fbdfbd0` and `7106d70` exist.
