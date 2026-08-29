---
phase: 04-incremental-durable-persistence-boundaries
plan: 01
subsystem: persistence
tags: [cas, etag, json-lock, vercel-blob, programmes]
requires:
  - phase: 03-administrative-and-data-operations-correctness
    provides: signed one-write recovery, fail-closed adapters, and safe admin operations
provides:
  - Opaque versioned read and conditional-write contract across JSON, HTTP, and Vercel Blob
  - Conflict-safe bounded programme save/delete with atomic audit evidence
  - Strong HTTP ETag preconditions and cross-process JSON race protection
affects: [04-02-student-persistence, 04-03-operational-persistence, 04-04-recovery-cas]
tech-stack:
  added: []
  patterns: [opaque adapter version, single-attempt CAS mutation, compare-under-lock atomic rename]
key-files:
  created:
    - apps/web/lib/server/persistence-operations.ts
    - apps/web/__tests__/api/admin-programmes.test.ts
    - apps/web/__tests__/fixtures/json-cas-worker.ts
  modified:
    - apps/web/lib/server/data-store.ts
    - apps/web/lib/server/programme-records.ts
    - apps/web/app/api/admin/programmes/route.ts
    - services/http-data-service/src/server.mjs
key-decisions:
  - "Keep adapter versions opaque and server-only; programme routes expose only safe entity revision conflicts."
  - "Use one CAS attempt for programme replacements, with no automatic retry."
  - "Treat absent creation as a distinct conditional operation: null version, If-None-Match *, or Blob allowOverwrite false."
patterns-established:
  - "Bounded mutation: compose domain record and audit evidence from one versioned snapshot, then conditionally commit once."
  - "JSON CAS: exclusive sibling lock, compare under lock, fsynced same-directory temporary file, atomic rename."
requirements-completed: [DATA-01, DATA-02]
coverage:
  - id: D1
    description: Programme save/delete commits programme and audit changes atomically or returns an explicit conflict.
    requirement: DATA-02
    verification:
      - kind: integration
        ref: apps/web/__tests__/lib/data-store.test.ts#allows only one programme writer to commit one store version
        status: pass
      - kind: unit
        ref: apps/web/__tests__/api/admin-programmes.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: JSON, HTTP, and Blob adapters reject stale updates and conflicting first creation without overwriting the winner.
    requirement: DATA-01
    verification:
      - kind: integration
        ref: apps/web/__tests__/lib/data-store.test.ts#coordinates independent JSON writers
        status: pass
      - kind: integration
        ref: services/http-data-service/test/server.test.mjs
        status: pass
    human_judgment: false
duration: 35min
completed: 2026-08-29
status: complete
---

# Phase 4 Plan 1: Conflict-Safe Programme Persistence Summary

**Programme save/delete now crosses a bounded CAS seam with atomic audit evidence and consistent conflict behavior across JSON, HTTP, and Vercel Blob.**

## Performance

- **Duration:** 35 min
- **Completed:** 2026-08-29
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Added an opaque versioned read/conditional-write store contract while retaining legacy `read`/`write` compatibility.
- Moved programme persistence into a bounded one-attempt mutation that commits programme and audit changes together and preserves safe route `409` responses.
- Added JSON sibling-lock CAS, HTTP strong ETag preconditions, and Blob `ifMatch`/safe-create semantics with stale-update and absent-create race tests.
- Preserved Phase 3 recovery behavior; focused recovery and admin-data regression suites remain green.

## Task Commits

1. **Tasks 1–2: Programme tracer and adapter CAS contract** - `36e22b1` (feat)

## Files Created/Modified

- `apps/web/lib/server/persistence-operations.ts` - Shared single-attempt conditional mutation helper.
- `apps/web/lib/server/data-store.ts` - Versioned port plus JSON, HTTP, and Blob CAS implementations.
- `apps/web/lib/server/programme-records.ts` - Bounded programme save/delete operations and safe conflict type.
- `apps/web/app/api/admin/programmes/route.ts` - Safe save/delete `409` mapping without provider tokens.
- `apps/web/__tests__/lib/data-store.test.ts` - Programme, JSON process-race, HTTP, and Blob CAS coverage.
- `apps/web/__tests__/fixtures/json-cas-worker.ts` - Independent-process JSON race fixture.
- `apps/web/__tests__/api/admin-programmes.test.ts` - Authorized route conflict regression.
- `services/http-data-service/src/server.mjs` - Strong ETags, conditional PUT, serialized commits, and atomic replacement.
- `services/http-data-service/test/server.test.mjs` - First-create and stale-writer no-overwrite tests.

## Decisions Made

- Provider versions never cross the server route boundary; route conflict payloads remain programme-revision based.
- Programme replacements do not retry after CAS mismatch, preventing a stale operator action from being replayed against newer state.
- JSON lock timeout is an availability failure and never permission to remove an apparently stale lock or overwrite data.

## Deviations from Plan

None - plan executed within the specified files and architecture.

## TDD Gate Compliance

- Behavior-first tests were added and observed failing during implementation, then passed after the CAS implementation.
- The two tightly coupled tracer/adapter tasks were committed together after their shared focused gate rather than as separate RED/GREEN commits. The final commit retains the complete tests and production implementation, but the preferred historical RED commit is absent.

## Issues Encountered

- The sandbox initially blocked the provisioned Node/GSD paths; read-only GSD initialization and local validation were rerun with scoped approval.
- The child-process TypeScript fixture required the web workspace's pinned TypeScript compiler rather than the root TypeScript 7 resolution.

## Verification

- Focused web CAS and route tests: 2 suites, 28 tests passed.
- Phase 3 recovery/admin-data regression: 2 suites, 23 tests passed.
- HTTP data-service suite: 10 tests passed.
- Web TypeScript typecheck: passed.
- Web lint with zero warnings: passed.
- Stub scan: no TODO, FIXME, placeholder, coming-soon, or unavailable markers in plan-owned files.

## User Setup Required

None - no external service configuration or production operation was required.

## Self-Check: PASSED

- All nine created/modified artifacts exist.
- Implementation commit `36e22b1` exists in git history.
- Plan-focused tests, Phase 3 recovery regressions, typecheck, and lint all pass.
- No unrelated dirty or untracked files were staged or modified.

## Next Phase Readiness

- The opaque CAS and bounded-operation seams are ready for Plan 04-02 student persistence migration.
- Production deployment and live-provider writes remain intentionally out of scope.

---
*Phase: 04-incremental-durable-persistence-boundaries*
*Completed: 2026-08-29*
