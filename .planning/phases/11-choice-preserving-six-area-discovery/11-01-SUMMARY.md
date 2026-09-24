---
phase: 11-choice-preserving-six-area-discovery
plan: 01
subsystem: public-catalogue-discovery
tags: [nextjs, typescript, catalogue, public-snapshot, filters, accessibility]
requires:
  - phase: 10
    provides: reviewed stored public catalogue snapshots
provides:
  - public deterministic six-area catalogue discovery model
  - reviewed-snapshot-only programmes route with factual cards and controlled URLs
affects: [phase-11-plan-02, phase-11-plan-03, public-programmes]
tech-stack:
  added: []
  patterns: [strict-query-allowlist, stored-snapshot-boundary, stable-public-id-order]
key-files:
  created:
    - apps/web/lib/catalogue-discovery.ts
    - apps/web/components/catalogue/CatalogueDiscoveryOverview.tsx
    - apps/web/__tests__/lib/catalogue-discovery.test.ts
    - apps/web/__tests__/components/CatalogueDiscoveryOverview.test.tsx
  modified:
    - apps/web/app/programmes/page.tsx
key-decisions:
  - "Public discovery consumes only the Phase 10 stored reviewed snapshot and never a visitor profile, candidate, audit, seed, or provider request."
  - "All six pathway classes remain visible with their coverage state even when the selected snapshot has no cards."
  - "Discovery URLs accept only explicit allowlisted filters and stable public ID ordering."
metrics:
  completed: 2026-09-23
  tasks: 2
  files: 5
status: complete
---

# Phase 11 Plan 01: Public Snapshot Discovery Summary

**The public programmes page now presents only reviewed catalogue snapshot records through reversible metro and pathway controls, factual source actions, and neutral stable ordering.**

## Accomplishments

- Replaced the legacy session/profile-ranked `/programmes` route with a public read of `getPublishedCatalogueSnapshot()`.
- Added a browser-safe discovery DTO that preserves each visible fact and its evidence, source state, official verification URL, and a non-media rights-review placeholder state.
- Added native six-area controls for metro, pathway, delivery, fact state, and text search; unknown query data is ignored.
- Shows all six controlled pathway coverage cells for the selected metro, including truthful `not-yet-verified` and no-reviewed-record states.
- Gives each governed card factual save, comparison, details, and official verification actions without requiring authentication or a profile.
- Preserves canonical controlled filter state in factual detail links and provides a reset to the selected metro's unfiltered reviewed view.

## Task Commits

1. **Task 1: Prove one public reviewed opportunity from snapshot to visitor action** — `4f12381` (`test`), `608023e` (`feat`)
2. **Task 2: Add reversible six-area filtering, coverage disclosure, and neutral ordering** — `6a677dc` (`test`), `20a3da0` (`feat`)

## Verification

- Focused discovery Jest suites: **5 tests passed**.
- `corepack pnpm --filter @scholar-scout/web run typecheck` — passed.
- `corepack pnpm --filter @scholar-scout/web run lint` — passed.
- The focused Jest run reports the checkout's inherited multiple-lockfile warning only.

## Deviations from Plan

None - plan executed as written.

## Known Stubs

None. The media disclosure deliberately renders no provider or learner media until the separate rights-reviewed Phase 13 work.

## Self-Check: PASSED

- Confirmed the five planned source and test files exist in the active worktree.
- Confirmed commits `4f12381`, `608023e`, `6a677dc`, and `20a3da0` exist.
