---
quick_id: 260921-ajj
title: Repair governed dashboard pathway scoring
status: ready
must_haves:
  truths:
    - The recommendation dashboard presents every visible recommendation and pathway in the deterministic order returned by rankOpportunityMatches(), using only normalized ordinary preferences and governed programme evidence.
    - Dashboard wording and metrics do not present a confidence percentage, priority level, GPA signal, acceptance-rate signal, match score, or a singular “best” pathway/next move.
    - Changing GPA, access/acceptance rate, or legacy matchScore metadata cannot change the rendered dashboard opportunity order, reasons, evidence, cautions, or verification count.
    - Phase 7 roadmap progress accurately records that Plans 07-01 through 07-04 executed, while the verification-found dashboard repair remains pending.
  artifacts:
    - apps/web/components/recommendations/RecommendationDashboard.tsx
    - apps/web/lib/pathway-recommendations.ts
    - apps/web/__tests__/components/RecommendationDashboard.test.tsx
    - apps/web/__tests__/app/matching-surfaces.test.tsx
    - .planning/ROADMAP.md
  key_links:
    - RecommendationDashboard -> rankOpportunityMatches -> OpportunityMatchCard
    - RecommendationDashboard verification metric -> governed OpportunityMatch cautions/evidence
    - Dashboard regression fixture -> unchanged legacy metadata -> unchanged rendered governed-card sequence
---

# Quick Task 260921-ajj: Repair governed dashboard pathway scoring

## Scope and guardrails

Repair only the Phase 7 verification gap recorded in `.planning/phases/07-governed-opportunity-and-support-matching/07-VERIFICATION.md`. This is a test-first migration of the active recommendations dashboard away from the legacy confidence-ranked pathway builder. Keep the existing sensitive-referral disclosure, governed evidence model, ordinary-profile boundary, fixture-only referral policy, and all unrelated matching surfaces intact. Do not deploy, alter provider URLs, create sensitive persistence, change authentication/storage, or stage `debug.log`.

## Task 1: Replace the active confidence-ranked pathway flow with the governed opportunity contract

**Files:**

- `apps/web/components/recommendations/RecommendationDashboard.tsx`
- `apps/web/lib/pathway-recommendations.ts`
- `apps/web/__tests__/components/RecommendationDashboard.test.tsx`
- `apps/web/__tests__/app/matching-surfaces.test.tsx`
- `apps/web/__tests__/lib/opportunity-matching.test.ts`

**Test first:** Add failing dashboard-level regressions using two otherwise governed programme fixtures whose ordinary preference/evidence alignment establishes a known order. Render once with baseline legacy values, then render with only `gpaBand`, `acceptanceRate`, and `matchScore` changed. Assert the accessible opportunity-card sequence, reasons, evidence/verification copy, and count of items requiring verification are identical. Assert the rendered dashboard contains neither the legacy confidence/priority/best-pathway presentation nor GPA/access/score-based explanation text. Retain a direct pure-contract regression that confirms `rankOpportunityMatches()` ignores those values.

**Action:** Remove the `buildPathwayRecommendations()` import and every dashboard calculation derived from `PathwayRecommendation`, including the confidence-ranked best-pathway card and phase-derived verification metric. Derive all recommendation and pathway display sequences directly from `governedMatches`, preserving their `rankOpportunityMatches()` order and rendering each through `OpportunityMatchCard`. Derive the verification metric only from governed match cautions/evidence, with an explicit deterministic counting rule. Replace singular predictive language such as “Your best next move” with choice-preserving wording that accurately says the options reflect stated ordinary preferences and documented programme details. In the onboarding-needed copy, identify only the information used by governed matching; do not imply GPA is required for ranking. Delete `apps/web/lib/pathway-recommendations.ts` after confirming it has no remaining production import, because its `explainProgrammeFit`/confidence fallback would otherwise remain an unused reintroduction path. Preserve the confidential-support entry point exactly as implemented: it remains local-only and cannot affect profile, ordering, browser state, network calls, or navigation.

**Verify:**

```text
corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath apps/web/__tests__/components/RecommendationDashboard.test.tsx apps/web/__tests__/app/matching-surfaces.test.tsx apps/web/__tests__/lib/opportunity-matching.test.ts
corepack pnpm --filter @scholar-scout/web run typecheck
corepack pnpm --filter @scholar-scout/web run lint
rg -n "buildPathwayRecommendations|pathway-recommendations" apps/web --glob '!apps/web/.next/**'
```

**Done:** The dashboard has one governed recommendation/pathway ordering and explanation source, all visible cards use `OpportunityMatchCard`, and focused regressions prove legacy GPA/access/match metadata cannot change visible output.

## Task 2: Correct Phase 7 roadmap execution progress without changing scope

**Files:**

- `.planning/ROADMAP.md`

**Action:** Update only the Phase 7 roadmap detail block to mark `07-01` through `07-04` executed and state `Plans: 4/4 executed; dashboard-pathway scoring repair pending verification`. Keep Phase 7’s governance-only/no-new-requirement description, success criteria, fixture-only referral boundary, and the exclusive Phase 8 ownership of `PROD-07` verbatim. Do not alter any other phase’s count, status, objective, requirements, or plan list.

**Verify:**

```text
git diff --check
rg -n -A 35 "^### Phase 7: Governed Opportunity and Support Matching" .planning/ROADMAP.md
```

**Done:** The Phase 7 section accurately distinguishes completed planned work from the one pending verification repair, without modifying other roadmap entries or requirement ownership.

## Completion checks

1. Run the focused dashboard and governed-matching Jest tests, then the full web typecheck and lint commands above.
2. Inspect the rendered test assertions for card order, reasons, evidence, cautions, and verification count after legacy-metadata mutations.
3. Confirm the retired pathway builder has no production consumer before deleting it.
4. Review the roadmap diff so it contains only the Phase 7 progress correction.
5. Commit code/test work and the roadmap correction atomically, leaving `debug.log` untracked.
