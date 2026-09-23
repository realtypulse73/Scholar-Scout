---
phase: 10-curated-import-and-governed-staff-publication
plan: 02
subsystem: catalogue-publication
tags: [nextjs, typescript, jest, staff-review, cas, catalogue]
requires:
  - phase: 10-01
    provides: private candidate staging, checklist contracts, and server capability resolution
provides:
  - bounded versioned private candidate import and correction operations
  - independent checklist-gated review with administrator self-approval exception
  - concise redacted staff lifecycle history and intake runbook
affects: [10-03, catalogue-release, catalogue-admin]
tech-stack:
  added: []
  patterns: [schema-versioned bounded intake, one-shot CAS batch mutation, allowlisted staff history DTO]
key-files:
  created:
    - apps/web/app/api/admin/catalogue-publications/import/route.ts
    - docs/curated-catalogue-publication-runbook.md
  modified:
    - apps/web/lib/catalogue-publication.ts
    - apps/web/lib/server/catalogue-publications.ts
    - apps/web/app/api/admin/catalogue-publications/route.ts
key-decisions:
  - "Staff intake accepts at most 25 schema-versioned private changes in one conditional mutation."
  - "Ordinary approval requires another reviewer; only editor-plus-administrator actors may self-approve a passing revision."
  - "Staff history exposes checklist status and concise lifecycle evidence, never raw candidates or configuration."
patterns-established:
  - "Treat every edit as a new revision that clears prior approval and requires re-review."
  - "Use a private retirement intent at intake; learner-visible changes wait for a later snapshot release."
requirements-completed: [EVID-03, PUB-01, PUB-02, PUB-03]
coverage:
  - id: D1
    description: Staff can stage one through 25 bounded, schema-versioned private candidate changes without altering learner data.
    requirement: PUB-03
    verification:
      - kind: unit
        ref: apps/web/__tests__/lib/catalogue-publication.test.ts#catalogue candidate import envelope
        status: pass
      - kind: integration
        ref: apps/web/__tests__/lib/server/catalogue-publications.test.ts#private catalogue candidate staging
        status: pass
    human_judgment: false
  - id: D2
    description: Review requires a separate reviewer except for a passing editor-plus-administrator self-approval, and later edits require re-review.
    requirement: EVID-03
    verification:
      - kind: integration
        ref: apps/web/__tests__/lib/server/catalogue-publications.test.ts#requires an independent reviewer unless an editor is also an administrator
        status: pass
    human_judgment: false
  - id: D3
    description: Authorized staff receive only six checklist categories and concise audit evidence in candidate history.
    requirement: PUB-01
    verification:
      - kind: integration
        ref: apps/web/__tests__/api/admin-catalogue-publications.test.ts#returns only redacted candidate history to an authorized staff caller
        status: pass
    human_judgment: false
duration: 58min
completed: 2026-09-23
status: complete
---

# Phase 10 Plan 02: Curated Intake and Independent Review Summary

**Staff can privately stage bounded catalogue batches, correct a revision safely, and obtain checklist-gated independent approval without exposing raw records or changing the learner catalogue.**

## Performance

- **Duration:** 58 min
- **Completed:** 2026-09-23
- **Tasks:** 2/2
- **Files modified:** 9

## Accomplishments

- Added a versioned, bounded JSON import seam for one through 25 private `upsert` or `retire` intents, with duplicate, stale, malformed, deep, and oversized input protections.
- Added single-attempt CAS correction/revision behavior; all edits clear approval and retirement remains private until a future immutable snapshot release.
- Added independent reviewer transitions, the editor-plus-administrator exception, redacted staff history, and an operating runbook.

## Task Commits

1. **Task 1: Add bounded schema-versioned staff intake and correction commands** — `9d1ec16` (test), `b7d28a6` (feat)
2. **Task 2: Enforce reviewer independence and expose safe staff history** — `d22e3ce` (test), `b914dea` (feat)
3. **Safety repair: preserve exact UTF-8 import byte limits** — `cdf75d7` (fix)

## Files Created/Modified

- `apps/web/lib/catalogue-publication.ts` — import envelope parsing, audit contract, and portable UTF-8 limits.
- `apps/web/lib/server/catalogue-publications.ts` — CAS import, correction, submit, review, and redacted-history commands.
- `apps/web/app/api/admin/catalogue-publications/import/route.ts` — editor-guarded bounded intake endpoint.
- `apps/web/app/api/admin/catalogue-publications/route.ts` — safe staff-history and review/submit actions.
- `apps/web/__tests__/lib/catalogue-publication.test.ts` — parser limits and structural correction coverage.
- `apps/web/__tests__/lib/server/catalogue-publications.test.ts` — import, revision, review, and redaction coverage.
- `apps/web/__tests__/api/admin-catalogue-publications.test.ts` — protected history DTO coverage.
- `docs/curated-catalogue-publication-runbook.md` — capability, intake, review, and privacy-safe operations guide.

## Decisions Made

- A valid import is all-or-nothing and never uses the broad recovery-import path.
- Regular creators cannot approve their own candidate; the administrator exception is still server-checklist-gated.
- Rights problems remove media only, leaving factual text and official source links for a later release.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Made the import-size limit portable in the Jest and browser/server environments**
- **Found during:** Task 1
- **Issue:** `TextEncoder` was not available in the test runtime, causing valid bounded batches to be rejected.
- **Fix:** Added a small UTF-8 byte counter with no runtime dependency.
- **Files modified:** `apps/web/lib/catalogue-publication.ts`
- **Verification:** Focused parser/server/API suites, typecheck, and lint pass.
- **Committed in:** `cdf75d7`

**2. [Rule 1 - Bug] Corrected the in-memory CAS test actor and state fixture**
- **Found during:** Task 1
- **Issue:** The new test fixture used an array rather than the runtime capability set and did not include the normalized empty publication state.
- **Fix:** Matched the production actor/state contracts in the test fixture.
- **Files modified:** `apps/web/__tests__/lib/server/catalogue-publications.test.ts`
- **Verification:** Focused server tests pass.
- **Committed in:** `b7d28a6`

**3. [Rule 2 - Documentation] Indexed the new staff publication runbook**
- **Found during:** Task 2
- **Issue:** Project guidance requires the document index to remain current for important operational documents.
- **Fix:** Added the runbook to `PROJECT-INDEX.md`.
- **Files modified:** `PROJECT-INDEX.md`
- **Verification:** The index points to the committed runbook.
- **Committed in:** `b914dea`

**4. [Rule 3 - Blocking] Repaired legacy state-position text after the state command could not parse it**
- **Found during:** Plan metadata update
- **Issue:** The GSD state advance command could not parse the repository's legacy `Current Position` format.
- **Fix:** Updated the current-focus and plan-position lines to accurately show Plan 02 complete.
- **Files modified:** `.planning/STATE.md`
- **Verification:** State now identifies Phase 10, Plan 02 of 05 complete.

**Total deviations:** 4 auto-fixed (2 Rule 1, 1 Rule 2, 1 Rule 3).

## Verification

- `corepack pnpm --filter @scholar-scout/web test -- --runInBand __tests__/lib/catalogue-publication.test.ts __tests__/lib/server/catalogue-publications.test.ts __tests__/api/admin-catalogue-publications.test.ts` — 28 tests passed.
- `corepack pnpm --filter @scholar-scout/web run typecheck` — passed.
- `corepack pnpm --filter @scholar-scout/web run lint` — passed.

## Known Stubs

None.

## Next Phase Readiness

Plan 10-03 can create immutable scheduled snapshot manifests and public read boundaries using only approved private candidates. No external service configuration is required for this plan.

## Self-Check: PASSED

- Confirmed the import route, server command module, runbook, and all focused test files exist.
- Confirmed commits `9d1ec16`, `b7d28a6`, `d22e3ce`, `b914dea`, and `cdf75d7` exist.
