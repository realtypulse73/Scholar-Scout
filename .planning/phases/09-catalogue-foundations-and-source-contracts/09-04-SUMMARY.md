---
phase: 09-catalogue-foundations-and-source-contracts
plan: 04
subsystem: catalogue-domain-contract
tags: [typescript, jest, catalogue, provenance, evidence, immutability]
requires:
  - plan: 09-01
    provides: Controlled regional, pathway, source-date, and coverage validation.
  - plan: 09-02
    provides: Frozen six-region provenance roster and explicit 36-cell coverage baseline.
  - plan: 09-03
    provides: Field-level evidence and source-safe opportunity-card contracts.
provides:
  - Exact region-to-boundary provenance validation and chronology-safe fact evidence.
  - Discriminated verified coverage that requires current attributable evidence and a verification action.
  - Deeply immutable regional and coverage fixtures with independent unavailable-date metadata.
affects: [phase-10-reviewed-imports, catalogue-publication, source-governance]
tech-stack:
  added: []
  patterns: [pure validation errors, injected-clock chronology, discriminated coverage, deep-frozen static fixtures]
key-files:
  created:
    - .planning/phases/09-catalogue-foundations-and-source-contracts/09-04-SUMMARY.md
  modified:
    - apps/web/lib/catalogue-contract.ts
    - apps/web/lib/catalogue-fixtures.ts
    - apps/web/__tests__/lib/catalogue-contract.test.ts
    - apps/web/__tests__/lib/catalogue-fixtures.test.ts
key-decisions:
  - "Bind each controlled region to one exact official authority and boundary identifier instead of independently allowing valid values."
  - "Make verified coverage carry current FactEvidence while retaining the complete unverified baseline as an explicit non-availability state."
  - "Deep-freeze exported fixtures and allocate a fresh unavailable-date object for every provenance record."
patterns-established:
  - "Use an injected clock for every evidence and coverage validation path."
  - "Keep unsupported runtime text values recoverable as deterministic validation errors."
requirements-completed: [REG-01, REG-02, REG-03, EVID-01, EVID-02, EVID-05]
coverage:
  - id: D1
    description: Exact regional provenance and chronology-safe material-fact evidence.
    requirement: REG-01
    verification:
      - kind: unit
        ref: apps/web/__tests__/lib/catalogue-contract.test.ts#review regression contracts
        status: pass
    human_judgment: false
  - id: D2
    description: Evidence-backed verified coverage and explicit unverified six-by-six baseline.
    requirement: REG-03
    verification:
      - kind: unit
        ref: apps/web/__tests__/lib/catalogue-contract.test.ts#requires current attributable evidence and a direct action for verified coverage
        status: pass
      - kind: unit
        ref: apps/web/__tests__/lib/catalogue-fixtures.test.ts#publishes all 36 controlled pairs in region/pathway order as not-yet-verified
        status: pass
    human_judgment: false
  - id: D3
    description: Deeply immutable source fixtures with independent source-date identities.
    requirement: EVID-01
    verification:
      - kind: unit
        ref: apps/web/__tests__/lib/catalogue-fixtures.test.ts#deep-freezes every exported record and gives every source date distinct identity
        status: pass
    human_judgment: false
metrics:
  duration: 9min
  completed: 2026-09-22
  tasks_completed: 3
  files_modified: 4
status: complete
---

# Phase 09 Plan 04: Source-Governance Repair Summary

**Pure catalogue validators now reject forged provenance, impossible evidence, unsupported availability claims, and malformed imports while frozen six-area fixtures cannot be mutated or aliased.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-09-22T21:39:45Z
- **Completed:** 2026-09-22T21:48:28Z
- **Tasks:** 3/3
- **Files modified:** 4

## Accomplishments

- Added RED-first regressions for every CR-01 through CR-04 and WR-01 through WR-03 review finding.
- Bound each region to its exact Census/OMB CBSA or STATIN KMA provenance, and added source/review chronology, current-evidence coverage, malformed text, card-state, and commitment-state protections.
- Deep-froze all exported fixture layers and made every boundary/local-focus unavailable source date an independent object without changing the six regions or 36-cell baseline.

## Task Commits

1. **Task 1: Write failing cross-contract provenance and immutability regressions** — `564a2eb` (RED), `d0e0a8c` (fixed-clock regression wiring)
2. **Task 2: Harden regional, evidence, coverage, text, card, and commitment validation** — `e420a10` (GREEN)
3. **Task 3: Make frozen regional and coverage fixtures deeply immutable** — `d035599` (GREEN)

## Files Created/Modified

- `apps/web/lib/catalogue-contract.ts` — pure provenance, chronology, coverage, malformed-input, card, and commitment validation.
- `apps/web/lib/catalogue-fixtures.ts` — deeply frozen source roster and coverage baseline with independent source-date objects.
- `apps/web/__tests__/lib/catalogue-contract.test.ts` — focused cross-contract safety regressions.
- `apps/web/__tests__/lib/catalogue-fixtures.test.ts` — deep-freeze and no-alias provenance regressions.

## Verification

- `pnpm --filter @scholar-scout/web run test -- __tests__/lib/catalogue-contract.test.ts __tests__/lib/catalogue-fixtures.test.ts --runInBand` — passed (43 tests).
- `pnpm --filter @scholar-scout/web run typecheck` — passed.
- `pnpm --filter @scholar-scout/web run lint` — passed.
- `pnpm --filter @scholar-scout/web run test --runInBand` — passed.

## Decisions Made

- Require exact authority/identifier pairs by region so individual valid values cannot be forged into a valid provenance record.
- Represent verified coverage as attributable current evidence; retain all unverified cells as explicit non-availability without source claims.
- Keep fixture data static, source-preserving, deeply frozen, and separate from provider inventory, scraping, persistence, UI, ranking, sensitive fields, or outcome logic.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The local runtime reports Node 20.20.2 while the workspace declares Node 24, and Next.js reports the existing multiple-lockfile warning. All required checks completed successfully; no runtime, dependency, source roster, or configuration change was made.
- Pre-existing modifications to `.planning/STATE.md`, `.planning/ROADMAP.md`, and `.planning/config.json` were preserved and intentionally excluded from this plan's commits.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 10 can use these pure contracts to reject unreviewed or forged imports before publication.
- The Phase 09 domain-only boundary remains intact: no provider inventory, live source retrieval, persistence, routes, UI, ranking, sensitive/referral data, or decision/outcome logic was added.

## Self-Check: PASSED

- Confirmed all four owned implementation/test files and this summary exist.
- Confirmed RED and GREEN commits `564a2eb`, `d0e0a8c`, `e420a10`, and `d035599` are present in repository history.

---
*Phase: 09-catalogue-foundations-and-source-contracts*
*Completed: 2026-09-22*
