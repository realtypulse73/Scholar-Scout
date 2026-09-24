---
phase: 12-qualification-lens-and-explanation-governance
plan: 02
subsystem: qualification lens and discovery ordering
tags: [nextjs, typescript, jest, catalogue, evidence, qualification-governance]
requires:
  - phase: 12-01
    provides: bounded private qualification keys and selected keywords
  - phase: 12-04
    provides: reviewed, attributable qualification requirement and support snapshot evidence
provides:
  - Pure source-preserving qualification explanation DTOs
  - Deterministic all-visible qualifications-first ordering for already-filtered discovery items
  - Strict private-input boundary that excludes notes and proxy fields
affects: [12-03, 12-05, catalogue-discovery, qualification-lens]
tech-stack:
  added: []
  patterns:
    - Current reviewed requirement evidence is the only source of checked qualification connections
    - Non-current facts remain visible verification work and never suppress or lower an option
    - Public ID is the final deterministic ordering tie-breaker
key-files:
  created:
    - apps/web/lib/qualification-lens.ts
  modified:
    - apps/web/lib/catalogue-discovery.ts
    - apps/web/__tests__/lib/qualification-lens.test.ts
    - apps/web/__tests__/lib/catalogue-discovery.test.ts
key-decisions:
  - "Use only explicit structured qualification keys and selected literal keywords; reject notes and proxy fields at the lens boundary."
  - "Retain the complete reviewed discovery set while ordering only by current checked requirements, keyword connections, and public ID."
  - "Show documented support as evidence-backed information only when there is no checked requirement or a requirement needs verification."
patterns-established:
  - "Qualification explanations carry reviewed evidence and verification actions beside the factual connection without returning a verdict."
requirements-completed: [MATCH-01, MATCH-02, MATCH-03, MATCH-04]
metrics:
  duration: 22m
  completed: 2026-09-24
status: complete
---

# Phase 12 Plan 02: Qualification Lens and Explanation Governance Summary

**The discovery layer now produces an inspectable, source-backed qualifications lens that orders every already-visible option without making an eligibility, admission, fit, or outcome decision.**

## Performance

- **Duration:** 22m
- **Completed:** 2026-09-24
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Mapped reviewed published requirements, descriptions, and documented supports from the governed snapshot into discovery items without changing authoring or publication contracts.
- Added pure, serializable checked-requirement, keyword-connection, and verification-row DTOs that preserve reviewed evidence, source dates, and verification actions.
- Ordered a copied discovery collection by current checked requirement count, literal whole-token keyword connection, then deterministic public ID while retaining every item.
- Kept stale, unknown, and conflicting requirement evidence as visible verification work instead of treating it as an unmet qualification or exclusion reason.
- Added narrowly scoped documented-support guidance that remains factual and appears only where there is no checked requirement or a verification row.

## Task Commits

1. **Task 1: Consume one governed snapshot requirement in the explanation and ordering lens**
   - `5430ef6` — test(12-02): add failing qualification lens tests
   - `bfdc4b7` — feat(12-02): add source-backed qualification lens
2. **Task 2: Preserve every reviewed option in transparent qualifications-first ordering**
   - `4e404ad` — test(12-02): cover all-visible qualification ordering
   - `905f4ae` — feat(12-02): preserve all-visible qualification ordering
3. **Task 3: Add factual documented-support guidance without predictive claims**
   - `039a1f7` — test(12-02): cover factual qualification support guidance
   - `1a95d56` — feat(12-02): add governed support guidance

## Verification

- `corepack pnpm --filter @scholar-scout/web test -- --runInBand qualification-lens catalogue-discovery` — passed: 2 suites, 13 tests.
- `corepack pnpm --filter @scholar-scout/web run lint` — passed.
- `corepack pnpm --filter @scholar-scout/web run typecheck` — passed.
- `corepack pnpm --filter @scholar-scout/web test --runInBand` — passed at wave completion.

## Decisions Made

- Only the exact five controlled qualification keys and explicit literal keyword selections can affect a lens explanation or its transparent ordering.
- Titles, skills, costs, free-text notes, onboarding state, scores, proxy data, and unreviewed provider material never enter the lens input boundary.
- A non-current requirement is preserved with source/date/action information for student verification; it cannot count as checked or change which options remain visible.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Compatibility] Kept discovery evidence fields optional at the read boundary.**
- **Found during:** Task 1 type checking.
- **Issue:** Existing discovery fixtures predate governed qualification evidence and omit the new snapshot fields.
- **Fix:** Mapped missing evidence to an empty requirement list while preserving optional descriptions and supports, so legacy reviewed records remain browseable without creating a qualification connection.
- **Files modified:** `apps/web/lib/catalogue-discovery.ts`, `apps/web/lib/qualification-lens.ts`.
- **Verification:** Focused discovery/lens tests, lint, and typecheck passed.

**2. [Rule 3 - Blocking] Used the project-standard direct Jest flag for the full suite.**
- **Found during:** Wave-end verification.
- **Issue:** pnpm 10 treats an extra delimiter as a literal Jest filter when no test pattern is intended.
- **Fix:** Used `corepack pnpm --filter @scholar-scout/web test --runInBand` for the complete suite.
- **Files modified:** None.
- **Verification:** The corrected full-suite command completed successfully.

**Total deviations:** 2 (one compatibility correction and one verification-command correction).

## Known Stubs

None.

## Threat Flags

None. This plan adds no route, external request, storage access, sensitive field, or decision surface; the lens consumes only already-reviewed snapshot data and a bounded private DTO.

## Next Phase Readiness

Plan 12-03 can render these source-preserving explanation rows on existing discovery surfaces while retaining the full normal-order item set.

## Self-Check: PASSED

- Confirmed all four planned files exist and all six task commits are reachable in Git history.
- Confirmed focused tests, lint, typecheck, and the direct full-suite command passed.

---
*Phase: 12-qualification-lens-and-explanation-governance*
*Completed: 2026-09-24*
