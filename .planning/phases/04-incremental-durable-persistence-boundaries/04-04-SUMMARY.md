---
phase: 04-incremental-durable-persistence-boundaries
plan: 04
subsystem: persistence
tags: [cas, recovery, etag, vercel-blob, compatibility]
requires:
  - phase: 04-03
    provides: Bounded operational persistence and exact stable-ID retry policies
  - phase: 03-02
    provides: Signed one-write recovery, retention, incident holds, and idempotent outcomes
provides:
  - Version-bound one-write recovery apply with safe no-write conflicts
  - Conditional incident-hold and legacy recovery compatibility writes
  - Source guard preventing migrated domains from importing unconditional persistence
  - Implemented HTTP and Blob concurrency/recovery operator guidance
affects: [04-05, recovery, adapter-runbooks, phase-verification]
tech-stack:
  added: []
  patterns: [apply-time versioned recovery snapshot, one-attempt recovery CAS, source-level migration guard]
key-files:
  created: []
  modified:
    - apps/web/lib/server/data-recovery.ts
    - apps/web/lib/server/data-store.ts
    - apps/web/__tests__/lib/data-recovery.test.ts
    - apps/web/__tests__/lib/data-store.test.ts
    - docs/http-data-adapter-runbook.md
    - docs/vercel-blob-data-adapter.md
key-decisions:
  - "Keep provider versions server-only and bind them only to the final conditional recovery write."
  - "Use the existing recovery-state-changed contract for both digest staleness and provider CAS conflict."
  - "Treat incident-hold and legacy recovery helpers as non-retrying recovery replacements."
patterns-established:
  - "Recovery apply: validate signed application content, read data plus opaque version once, compose once, and conditionally write once."
  - "Migration guard: bounded domain modules may not import writeScholarScoutData."
requirements-completed: [DATA-01, DATA-02]
coverage:
  - id: D1
    description: "A recovery apply that loses a provider-version race fails without overwriting current data or persisting success evidence."
    requirement: DATA-01
    verification:
      - kind: integration
        ref: "apps/web/__tests__/lib/data-recovery.test.ts#rejects an adapter-version race without writing recovery success evidence"
        status: pass
      - kind: integration
        ref: "apps/web/__tests__/api/admin-data-routes.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every migrated domain uses conditional persistence while HTTP and Blob runbooks match the tested provider contracts."
    requirement: DATA-02
    verification:
      - kind: unit
        ref: "apps/web/__tests__/lib/data-store.test.ts#keeps migrated domain modules off the unconditional whole-document write"
        status: pass
      - kind: integration
        ref: "services/http-data-service/test/server.test.mjs"
        status: pass
    human_judgment: false
duration: 25min
completed: 2026-08-29
status: complete
---

# Phase 4 Plan 4: Conditional Recovery and Compatibility Summary

**Signed recovery now preserves every Phase 3 guarantee while rejecting provider-version races through one conditional no-retry write across all supported adapters.**

## Performance

- **Duration:** 25 min
- **Completed:** 2026-08-29
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Bound signed recovery apply to the opaque version read with its freshly validated application state, returning `recovery-state-changed` when the final CAS loses a race.
- Preserved one-write apply, idempotent outcomes, pre-change backups, retention, incident holds, privacy-minimal audit evidence, signed digests, and exact confirmation behavior.
- Moved incident-hold release and older exported recovery compatibility helpers onto conditional one-attempt writes.
- Added a source-level regression preventing programme, student, operational, platform, or recovery modules from importing the raw unconditional write.
- Updated HTTP and Vercel Blob runbooks with tested first-create, update, conflict, retry, JSON scope, and one-write recovery semantics; no production action occurred.

## Task Commits

1. **Task 1 RED: Stale recovery apply coverage** - `902d1d5`
2. **Task 1 GREEN: Version-bound recovery apply** - `56f5fb7`
3. **Task 2: Compatibility guard, conditional hold release, and runbooks** - `40c7c72`
4. **Task 2 correctness closeout: Legacy recovery compatibility CAS** - `4cc2218`

## Files Created/Modified

- `apps/web/lib/server/data-recovery.ts` - Versioned recovery apply and incident-hold release.
- `apps/web/lib/server/data-store.ts` - Conditional legacy import/backup recovery helpers.
- `apps/web/__tests__/lib/data-recovery.test.ts` - Apply-race and hold-release conflict coverage.
- `apps/web/__tests__/lib/data-store.test.ts` - Migration source guard and compatibility restore conflict coverage.
- `docs/http-data-adapter-runbook.md` - Strong ETag and conditional recovery contract.
- `docs/vercel-blob-data-adapter.md` - Blob ETag, `ifMatch`, first-create, and recovery contract.

## Decisions Made

- Provider versions remain opaque and out of `ScholarScoutData`, signed tokens, envelopes, previews, backups, and audit payloads.
- Recovery and incident-hold replacements receive one CAS attempt and never replay over newer state.
- Existing `recovery-state-changed` route behavior remains the stable replan response for both digest and provider-version staleness.

## Deviations from Plan

None - plan executed exactly as written, including the compatibility inventory closeout.

## Issues Encountered

- The inventory found two older exported restore helpers that were not used by current routes but still performed unconditional recovery writes. They were moved to the same conditional compatibility seam and covered by a stale-write regression before closeout.

## Verification

- Recovery, datastore, and admin-data route suites: 3 suites, 54 tests passed.
- HTTP data-service contract: 10 tests passed.
- Web strict TypeScript typecheck: passed.
- Web ESLint with zero warnings: passed.
- Source inventory: only the compatibility export itself remains named `writeScholarScoutData`; migrated domain and recovery modules do not import it.
- Stub scan: no functional TODO, FIXME, placeholder, unavailable, or empty-render stubs introduced.

## User Setup Required

None - no provider credentials, production migration, deployment, or production data action was required.

## Self-Check: PASSED

- All six modified artifacts exist.
- Commits `902d1d5`, `56f5fb7`, `40c7c72`, and `4cc2218` exist in git history.
- Focused recovery, adapter, route, HTTP service, typecheck, and lint gates pass.
- Unrelated dirty and untracked files remain untouched.

## Next Phase Readiness

- Plan 04-05 can assemble the final cross-domain coverage matrix and run the full phase validation gate.
- JSON, HTTP, and Vercel Blob remain supported; Phase 3 signed recovery behavior remains intact.
- Production remains unchanged.

---
*Phase: 04-incremental-durable-persistence-boundaries*
*Completed: 2026-08-29*
