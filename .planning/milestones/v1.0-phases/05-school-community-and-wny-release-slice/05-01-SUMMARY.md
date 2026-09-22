---
phase: 05-school-community-and-wny-release-slice
plan: 01
subsystem: community moderation persistence and API safety
tags: [nextauth, cas, moderation, rate-limit, jest]
requires:
  - phase: 04-incremental-durable-persistence-boundaries
    provides: versioned persistence and bounded conditional-write operations
provides:
  - Public/pending-review/removed campus-note lifecycle with keyed private reviews
  - Session-derived reporting and author-safe public read boundary
  - Bounded identity-safe DTO for the future staff moderation queue
affects: [05-02, 05-04, 05-05, community, staff-moderation]
tech-stack:
  added: []
  patterns: [status-filtered public reads, two-attempt CAS moderation transition, stable keyed review record]
key-files:
  created:
    - apps/web/app/api/campus-notes/[id]/report/route.ts
  modified:
    - apps/web/lib/server/data-store.ts
    - apps/web/lib/server/operational-records.ts
    - apps/web/lib/campus-community.ts
    - apps/web/__tests__/lib/data-store.test.ts
    - apps/web/__tests__/lib/operational-records.test.ts
    - apps/web/__tests__/api/campus-community.test.ts
key-decisions:
  - "Campus-note moderation is modeled as public, pending-review, and removed server-side state; the public DTO deliberately omits status and identity."
  - "A report is session-derived, idempotently appends one review record keyed by note ID, and returns the same private confirmation for repeated reports."
  - "Pending-review resolution uses bounded two-attempt CAS transitions; only pending-review can be restored or removed."
patterns-established:
  - "Public community reads filter persisted state before DTO mapping."
  - "Staff queue reads use an explicit safe DTO instead of serializing stored community records."
requirements-completed: [PROD-02, PROD-03]
coverage:
  - id: D1
    description: "Authenticated campus-note submission uses an account-keyed reservation and author-safe public response."
    requirement: PROD-03
    verification:
      - kind: integration
        ref: "pnpm --filter @scholar-scout/web test --runInBand -- campus-community"
        status: pass
    human_judgment: false
  - id: D2
    description: "Reported notes are hidden from public reads, have one private review item, and resolve only from pending review."
    requirement: PROD-03
    verification:
      - kind: integration
        ref: "apps/web/__tests__/lib/operational-records.test.ts#bounded operational records"
        status: pass
    human_judgment: false
  - id: D3
    description: "Legacy campus notes normalize safely while moderation state survives versioned snapshots."
    requirement: PROD-02
    verification:
      - kind: unit
        ref: "apps/web/__tests__/lib/data-store.test.ts#normalizes legacy campus notes"
        status: pass
    human_judgment: false
duration: 39min
completed: 2026-08-29
status: complete
---

# Phase 05 Plan 01: Community Safety Tracer Summary

**Authenticated campus-note submission now has a rolling reservation, author-safe public DTO, and CAS-safe moderation lifecycle with session-derived reporting.**

## Performance

- **Duration:** 39 min
- **Completed:** 2026-08-29
- **Tasks:** 2/2
- **Files modified:** 7

## Accomplishments

- Delivered the approved safety tracer for authenticated, quota-protected note creation and public reads.
- Added durable moderation state, normalized legacy notes, and a keyed private review collection.
- Added session-only reporting, immediate public hiding, bounded staff-queue data, and CAS-safe restore/remove transitions.

## Task Commits

1. **Task 1: Prove one authenticated note → shared reservation → safe DTO slice** - `bca2660` (test), `83ff092` (feat)
2. **Task 2: Add session-derived reporting and CAS-safe moderation persistence** - `a9557e6` (feat)

## Files Created/Modified

- `apps/web/app/api/campus-notes/[id]/report/route.ts` - authenticated report endpoint with non-disclosing confirmation.
- `apps/web/lib/server/data-store.ts` - persisted note statuses, review records, legacy normalization, and public filtering.
- `apps/web/lib/server/operational-records.ts` - bounded report/list/restore/remove operations and safe queue DTO.
- `apps/web/lib/campus-community.ts` - stored moderation and review types distinct from the public DTO.
- `apps/web/__tests__/lib/data-store.test.ts` - legacy and versioned moderation persistence coverage.
- `apps/web/__tests__/lib/operational-records.test.ts` - idempotency, CAS race, and transition regression fixtures.
- `apps/web/__tests__/api/campus-community.test.ts` - session-derived report route coverage.

## Decisions Made

- Moderation state is never included in public representations; public reads filter for `public` before DTO mapping.
- Reports are keyed by stable note ID, so duplicates remain private and cannot create duplicate queue items.
- Staff operations are data-store functions only in this plan; the fresh staff authorization route and UI are intentionally deferred to Plan 05-02.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Preserved existing non-community fixture records during normalization**
- **Found during:** Task 2
- **Issue:** Filtering every in-memory campus record as a valid note changed an existing migration fixture’s preservation semantics.
- **Fix:** Normalize valid notes to `public` while retaining unrelated malformed fixture records; persisted imports still validate the runtime note shape.
- **Files modified:** `apps/web/lib/server/data-store.ts`
- **Verification:** Full focused data-store, operational-records, and campus-community suites pass.
- **Committed in:** `a9557e6`

**2. [Rule 1 - Security boundary] Kept moderation status out of the public DTO**
- **Found during:** Task 2
- **Issue:** An initial type placement would have made stored moderation state part of the public representation.
- **Fix:** Moved `status` to the stored `CampusNote` only; public DTOs retain their existing identity-safe shape.
- **Files modified:** `apps/web/lib/campus-community.ts`
- **Verification:** Public route serialization tests and strict typecheck pass.
- **Committed in:** `a9557e6`

**Total deviations:** 2 auto-fixed (2 Rule 1)

## Issues Encountered

The default shell exposed Node 24 and pnpm 11, which do not meet this repository’s pinned Node 20/pnpm 10 requirements. Verification used the existing local ScholarScout Node 20 runtime through Corepack; no dependencies were installed or changed.

## Known Stubs

None.

## Next Phase Readiness

Plan 05-02 can consume only `listPendingReviewCampusNotes`, `restorePendingReviewCampusNote`, and `removePendingReviewCampusNote` after its fresh staff authorization gate. Plan 05-05 can join inbox writes to the already established shared reservation policy.

## Self-Check: PASSED

- Verified task commits `bca2660`, `83ff092`, and `a9557e6` exist.
- Verified all seven implementation/test files above exist.
