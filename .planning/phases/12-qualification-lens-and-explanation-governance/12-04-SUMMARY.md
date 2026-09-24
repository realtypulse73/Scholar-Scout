---
phase: 12-qualification-lens-and-explanation-governance
plan: 04
subsystem: governed catalogue publication evidence
tags: [nextjs, typescript, jest, catalogue, evidence, staff-governance]
requires:
  - phase: 12-01
    provides: controlled private qualification-key vocabulary
  - phase: 10-curated-import-and-governed-staff-publication
    provides: private candidate, independent review, and snapshot release lifecycle
provides:
  - Reviewed source-backed qualification requirements in published catalogue snapshots
  - Attributable reviewed descriptions and documented support statements
  - Staff JSON-import guidance and atomic evidence-boundary regression coverage
affects: [12-02, 12-03, 12-05, qualification-lens, catalogue-discovery]
tech-stack:
  added: []
  patterns:
    - Exact controlled qualification keys with required FactEvidence at the staff-import boundary
    - Optional non-current facts preserved for visible learner verification rather than converted into eligibility claims
key-files:
  created: []
  modified:
    - apps/web/lib/catalogue-contract.ts
    - apps/web/lib/catalogue-publication.ts
    - apps/web/lib/server/catalogue-publications.ts
    - apps/web/components/admin/CataloguePublicationManager.tsx
    - apps/web/__tests__/lib/catalogue-publication.test.ts
    - apps/web/__tests__/lib/server/catalogue-publications.test.ts
    - apps/web/__tests__/components/CataloguePublicationManager.test.tsx
    - docs/curated-catalogue-publication-runbook.md
key-decisions:
  - "Keep qualification requirements optional for catalogue compatibility, but reject every supplied requirement that lacks exact controlled keys or complete FactEvidence."
  - "Preserve valid non-current requirements as verification data rather than rejecting them or turning them into a learner eligibility conclusion."
patterns-established:
  - "Staff-authored evidence travels only through private candidate staging, independent review, and immutable published snapshots."
requirements-completed: [MATCH-01, MATCH-03, MATCH-04]
metrics:
  duration: 35m
  completed: 2026-09-24
status: complete
---

# Phase 12 Plan 04: Governed Catalogue Evidence Summary

**The existing staff import, independent review, and release workflow can now publish source-backed qualification requirements, descriptions, and support statements without creating a separate authoring system or learner-time provider fetch.**

## Performance

- **Duration:** 35m
- **Completed:** 2026-09-24
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Added `PublishedRequirement` to the catalogue contract, with ordered exact controlled qualification keys and required `FactEvidence`.
- Threaded optional `publishedRequirements`, `reviewedDescription`, and `documentedSupport` through private candidate decoding, checklist review, immutable snapshot publication, state guards, digests, and safe public cloning.
- Kept malformed text, arbitrary keys, and incomplete evidence out of private intake atomically while preserving a valid non-current requirement for later visible verification.
- Updated the existing manager guidance and operator runbook with the extended JSON shape and the established stage → independent review → release sequence.

## Task Commits

1. **Task 1: Stage, review, and publish one source-backed qualification requirement through existing candidate intake**
   - `ded5b95` — test(12-04): cover published qualification evidence
   - `5335a59` — feat(12-04): publish sourced qualification evidence
2. **Task 2: Make the existing JSON import seam operable and test reviewed-evidence rejection paths**
   - `7269d82` — test(12-04): cover evidence import guidance
   - `d529a55` — docs(12-04): guide governed evidence imports

## Verification

- `corepack pnpm --filter @scholar-scout/web test -- --runInBand --runTestsByPath __tests__/lib/catalogue-publication.test.ts __tests__/lib/server/catalogue-publications.test.ts` — passed: 2 suites, 37 tests.
- `corepack pnpm --filter @scholar-scout/web run typecheck` — passed.
- `corepack pnpm --filter @scholar-scout/web test -- --runInBand --runTestsByPath __tests__/components/CataloguePublicationManager.test.tsx __tests__/lib/catalogue-publication.test.ts __tests__/lib/server/catalogue-publications.test.ts` — passed: 3 suites, 48 tests.
- `corepack pnpm --filter @scholar-scout/web run lint` — passed.
- `corepack pnpm --filter @scholar-scout/web test --runInBand` — passed at wave completion.

## Decisions Made

- Use only the five controlled Plan 12-01 qualification keys: `diploma-credits`, `degree`, `licence`, `prior-work`, and `voluntary-military-history`.
- Require each supplied requirement, description, and support statement to carry independently attributable source/date/action evidence.
- Leave valid non-current evidence visible for verification, rather than treating it as a reason to suppress a catalogue option or make an eligibility assertion.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Rebased the existing final-recheck fixture's new evidence dates**
- **Found during:** Task 1 verification.
- **Issue:** The pre-existing future-date release test copied the new 2026 evidence fields into its 2027 current candidate, causing the intentionally current candidate to fail the material-evidence freshness recheck.
- **Fix:** Rebased the copied requirement, description, and support evidence to the fixture's 2027 review date.
- **Files modified:** `apps/web/__tests__/lib/server/catalogue-publications.test.ts`.
- **Verification:** The focused publication suites passed with the stale candidate quarantined and the refreshed candidate published.

**2. [Rule 3 - Blocking] Used the project-standard direct Jest flag for the full suite**
- **Found during:** Wave-end verification.
- **Issue:** The workspace's pnpm 10 forwarding behavior treats an extra delimiter as a literal Jest filter for a no-pattern full-suite run.
- **Fix:** Used `corepack pnpm --filter @scholar-scout/web test --runInBand` for the full suite.
- **Files modified:** None.
- **Verification:** The corrected full-suite command completed successfully.

**Total deviations:** 2 auto-fixed (one test-fixture compatibility correction and one verification-command correction).

## Known Stubs

None.

## Threat Flags

None. The plan extends an existing active-staff import boundary and existing reviewed-snapshot flow; it introduces no route, role, provider request, or external dependency.

## Next Phase Readiness

Plan 12-02 can consume the released `publishedRequirements`, `reviewedDescription`, and `documentedSupport` fields as snapshot-only lens inputs.

## Self-Check: PASSED

- Confirmed all eight planned product/test/runbook files exist and the four task commits are reachable in Git history.
- Confirmed no whitespace errors and no stubs in the Plan 12-04 source changes.

---
*Phase: 12-qualification-lens-and-explanation-governance*
*Completed: 2026-09-24*
