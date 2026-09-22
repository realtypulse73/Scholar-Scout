---
phase: 07
plan: 03
subsystem: governed-opportunity-matching
tags: [matching, recommendations, evidence, privacy]
dependency_graph:
  requires: [07-01, 07-02]
  provides: [shared governed opportunity card across discovery, fit, and recommendations]
  affects: [programme discovery, programme details, recommendations]
tech_stack:
  added: []
  patterns: [pure view-model ranking, shared accessible card rendering]
key_files:
  created:
    - apps/web/lib/opportunity-matching.ts
    - apps/web/components/opportunities/OpportunityMatchCard.tsx
  modified:
    - apps/web/components/programmes/ProgrammeResults.tsx
    - apps/web/components/programmes/ProgrammeFitPanel.tsx
    - apps/web/components/recommendations/RecommendationDashboard.tsx
decisions:
  - Governed matching uses only normalized ordinary preferences and programme evidence.
  - Unknown ordinary support lowers rank but never removes a programme from results.
  - Recommendation ranking no longer uses GPA, access, simulation, shortlist, or engagement signals.
metrics:
  tests: 42 focused Jest assertions passing
status: complete
---

# Phase 7 Plan 3: Governed Matching Surface Migration Summary

Discovery, programme fit, and recommendation surfaces now present one source-aware, choice-preserving programme/support contract.

## Completed Tasks

1. Added a pure `rankOpportunityMatches()` contract and reusable `OpportunityMatchCard`, then moved programme discovery onto it.
2. Kept onboarding support controls ordinary-only and replaced the legacy predictive programme-fit display with the shared card.
3. Replaced adaptive/simulation-driven recommendation cards with governed cards, preserving pathway verification guidance without using engagement signals to order opportunities.

## Verification

- `corepack pnpm --filter @scholar-scout/web test -- --runInBand ...` — 9 suites, 42 tests passed.
- `corepack pnpm --filter @scholar-scout/web run lint` — passed.
- `corepack pnpm --filter @scholar-scout/web run typecheck` — passed.

## Commits

- `3ae5b80` test(07-03): add failing governed match card coverage
- `e461a31` feat(07-03): render governed programme match cards
- `1559ba7` test(07-03): add failing governed fit panel coverage
- `c1dee0f` feat(07-03): use governed cards for programme fit
- `9724470` test(07-03): add failing shared recommendation coverage
- `c990cfe` feat(07-03): migrate recommendations to governed cards

## Deviations from Plan

### Auto-fixed Issues

1. **[Rule 1 - Type safety] Narrowed interest and GPA test types**
   - **Found during:** Task 3 verification
   - **Issue:** The new pure matcher needed an explicit `undecided` exclusion and a valid `GpaBand` fixture value for strict TypeScript.
   - **Fix:** Added the type guard and corrected the test fixture before final verification.
   - **Files modified:** `apps/web/lib/opportunity-matching.ts`, `apps/web/__tests__/lib/opportunity-matching.test.ts`
   - **Commit:** `c990cfe`

2. **[Rule 3 - Plan-path correction] Migrated the actual pathway surface inside RecommendationDashboard**
   - **Found during:** Task 3
   - **Issue:** The planned `apps/web/app/pathway-recommendations/page.tsx` does not exist; pathway recommendations are rendered by `RecommendationDashboard` on the recommendations route.
   - **Fix:** Applied the shared card migration to the owning component and tested that surface directly.
   - **Files modified:** `apps/web/components/recommendations/RecommendationDashboard.tsx`, `apps/web/__tests__/app/matching-surfaces.test.tsx`
   - **Commit:** `c990cfe`

## Known Stubs

None.

## Self-Check: PASSED

- Created matching contract and shared card exist.
- All six task commits are present in repository history.
