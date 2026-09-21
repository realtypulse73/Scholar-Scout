---
quick_id: 260921-ajj
title: Repair governed dashboard pathway scoring
status: complete
subsystem: recommendations
tags: [react, jest, opportunity-matching, governed-recommendations]
requires:
  - phase: 07-governed-opportunity-and-support-matching
    provides: governed opportunity matching and shared opportunity cards
provides:
  - One governed dashboard sequence for programme and pathway options
  - Regression coverage for legacy-metadata invariance
affects: [phase-07-verification]
key-files:
  created: [.planning/quick/260921-ajj-repair-phase-7-dashboard-pathway-scoring/260921-ajj-SUMMARY.md]
  modified:
    - apps/web/components/recommendations/RecommendationDashboard.tsx
    - apps/web/__tests__/app/matching-surfaces.test.tsx
    - apps/web/__tests__/lib/opportunity-matching.test.ts
    - .planning/ROADMAP.md
  deleted: [apps/web/lib/pathway-recommendations.ts]
completed: 2026-09-21
---

# Quick Task 260921-ajj: Repair Governed Dashboard Pathway Scoring Summary

**The dashboard now presents one evidence-grounded opportunity sequence and cannot be changed by GPA, acceptance rate, or legacy match-score metadata.**

## Accomplishments

- Removed the active confidence-ranked “best pathway” flow and its unused pathway scorer.
- Rendered all dashboard programme/pathway options through the shared governed `OpportunityMatchCard` sequence.
- Counted verification needs only from governed evidence and cautions.
- Added regression coverage proving legacy metadata leaves the rendered card order, reasons, evidence, cautions, and verification count unchanged.
- Corrected Phase 7 roadmap progress without altering Phase 8 requirement ownership.

## Verification

- `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/components/RecommendationDashboard.test.tsx __tests__/app/matching-surfaces.test.tsx __tests__/lib/opportunity-matching.test.ts` — passed (3 suites, 5 tests).
- `corepack pnpm --filter @scholar-scout/web run typecheck` — passed.
- `corepack pnpm --filter @scholar-scout/web run lint` — passed.
- `rg` confirmed no remaining production import of the retired pathway scorer.
- `git diff --check` — passed.

## Commits

- `d9cd1d0` — `fix(07): use governed dashboard opportunity matches`

## Deviations from Plan

### Auto-fixed Issues

1. **[Rule 3 - Test command] Corrected focused Jest paths for the filtered web workspace.**
   - The plan's repository-root test paths were resolved relative to `apps/web` by pnpm.
   - Re-ran the same targeted suites using workspace-relative paths.

2. **[Rule 1 - Test compatibility] Replaced unavailable `structuredClone` in Jest with a JSON fixture clone.**
   - The test environment does not expose `structuredClone`; the JSON-compatible programme fixtures require no richer clone behavior.

## User Setup Required

None. No deployment, provider URL, authentication, storage, or sensitive-data setting changed.

## Self-Check: PASSED

- Summary file exists at the declared quick-task path.
- Task commit `d9cd1d0` exists in repository history.

## Next Step

Re-run the Phase 7 verifier against this repaired dashboard flow.
