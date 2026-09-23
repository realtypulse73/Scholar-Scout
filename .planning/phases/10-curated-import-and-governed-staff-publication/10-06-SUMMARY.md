---
phase: 10-curated-import-and-governed-staff-publication
plan: 06
subsystem: catalogue-publication
tags: [nextjs, typescript, jest, recovery, conflict-resolution, staff-console]
requires:
  - phase: 10-05
    provides: release, recovery, and audit console controls
provides:
  - coherent recovered catalogue-publication state validation before persistence
  - bounded real stale-import comparisons in the staff conflict console
affects: [phase-11, catalogue-discovery, catalogue-admin]
tech-stack:
  added: []
  patterns: [semantic recovery validation, canonical snapshot digest, bounded stale conflict DTO]
key-files:
  modified:
    - apps/web/lib/catalogue-publication.ts
    - apps/web/lib/server/catalogue-publications.ts
    - apps/web/app/api/admin/catalogue-publications/import/route.ts
    - apps/web/components/admin/CataloguePublicationManager.tsx
    - apps/web/__tests__/lib/catalogue-publication.test.ts
    - apps/web/__tests__/lib/data-store.test.ts
    - apps/web/__tests__/lib/server/catalogue-publications.test.ts
    - apps/web/__tests__/api/admin-catalogue-publications.test.ts
    - apps/web/__tests__/components/CataloguePublicationManager.test.tsx
key-decisions:
  - "Only a one-record stale upsert exposes a bounded comparison; multi-record imports remain atomic and non-retrying."
  - "Recovered snapshots and manifests must match canonical public-record digests and retained earlier-only lineage before becoming authoritative."
  - "The browser renders only server-returned conflict values and keeps them read-only; the server remains the final audit-reason gate."
metrics:
  tasks: 2
  files: 9
status: complete
---

# Phase 10 Plan 06: Recovery and Stale-Conflict Gap Closure Summary

**Phase 10 recovery now rejects incoherent publication state before persistence, and a real stale private import opens a safe, resolvable staff comparison rather than a fabricated UI scenario.**

## Accomplishments

- Added a one-record stale-import result that returns only candidate ID, revisions, title, claim boundary, region ID, and the two permitted merge choices. It performs no mutation or retry.
- Wired the authorized import route and staff console to consume that 409 response. Both compared fields are read-only and independently selectable; an older choice requires a reason in the browser and at the server boundary.
- Removed the synthetic conflict launcher so the console cannot invent current or attempted values.
- Replaced shallow publication-state validation with candidate/checklist coherence, canonical public-record digest, snapshot/manifest pairing, earlier-only lineage, unique identity/sequence, and active-snapshot checks.
- Added recovery coverage proving a rejected malformed snapshot cannot replace the existing learner-visible snapshot.

## Task Commits

1. **Task 1: Carry one stale private import into the real staff conflict screen** — `103df25` (RED tests), `04b5352` (implementation)
2. **Task 2: Reject incoherent recovered catalogue-publication state before public recovery** — `d5c430c` (RED tests), `72cea41` (implementation)

## Verification

- Focused Phase 10 matrix: **89 tests passed** across pure contract, data-store recovery, server lifecycle, API route, and component suites.
- `corepack pnpm --filter @scholar-scout/web run typecheck` — passed.
- `corepack pnpm --filter @scholar-scout/web run lint` — passed with zero warnings.
- Full web Jest suite was invoked through the workspace-local Jest executable with `--runInBand`; it completed successfully. The workspace retains the inherited multiple-lockfile warning.

## Deviations from Plan

None - plan executed as written.

## TDD Gate Compliance

- RED commits `103df25` and `d5c430c` recorded the two safety gaps before their production implementations.
- GREEN commits `04b5352` and `72cea41` complete the corresponding behavior.

## Known Stubs

None.

## Threat Flags

None. The change retains authorization-before-parsing, does not add provider fetching, and exposes no raw import, secret, learner, or configuration fields.

## Self-Check: PASSED

- Confirmed all modified contracts, server/route/UI links, and focused tests exist.
- Confirmed commits `103df25`, `04b5352`, `d5c430c`, and `72cea41` exist.
