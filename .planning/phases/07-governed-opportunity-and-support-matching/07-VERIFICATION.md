---
phase: 07-governed-opportunity-and-support-matching
verified: 2026-09-21T07:13:07Z
status: gaps_found
score: 6/7 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "Programme discovery, fit panel, recommendations, and pathway recommendations consume the shared governed contract and use only normalized ordinary preferences."
    status: failed
    reason: "The recommendation dashboard still builds and renders an active legacy pathway recommendation that ranks by a confidence score. That scorer calls the legacy fit implementation and falls back to programme matchScore and acceptanceRate, so pathway content is not governed by rankOpportunityMatches()."
    artifacts:
      - path: apps/web/components/recommendations/RecommendationDashboard.tsx
        issue: "Imports and invokes buildPathwayRecommendations(), then renders the separately ranked 'Best pathway' and its confidence percentage."
      - path: apps/web/lib/pathway-recommendations.ts
        issue: "Calls explainProgrammeFit(), uses confidenceScore, programme.matchScore, and programme.acceptanceRate, and sorts pathway recommendations by confidenceScore."
    missing:
      - "Remove or migrate the active legacy pathway recommendation flow to the governed opportunity-match view model."
      - "Remove the confidence-ranked 'Best pathway' presentation and add a regression proving GPA, access, matchScore, and acceptanceRate cannot affect any visible matching or pathway order."
---

# Phase 7: Governed Opportunity and Support Matching Verification Report

**Phase Goal:** Students can compare visible programme and pathway opportunities through evidence-grounded, choice-preserving support explanations, while sensitive support uses a non-persisting referral path and never becomes a ranking or profile signal.

**Verified:** 2026-09-21T07:13:07Z  
**Status:** gaps_found  
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Governed programmes carry attributable support/material-fact evidence; legacy evidence remains visible as unknown, stale, or conflicting with verification guidance. | VERIFIED | `programmes.ts` normalizes every material fact/support bundle to a finite evidence state; `programme-records.ts` applies that normalization at `getGovernedProgrammes()`. Admin and API regression tests passed. |
| 2 | Requested ordinary support that is undocumented lowers rank but does not hide a programme. | VERIFIED | `rankOpportunityMatches()` applies a caution and negative rank delta without filtering. Its named test passed with documented and undocumented programmes both present. |
| 3 | Only ordinary preferences persist; referral-only input is rejected and removed from legacy records. | VERIFIED | The account route rejects referral-only values before `saveOnboardingProfile`; `data-store.ts` and `student-records.ts` normalize stored support values. Route and persistence tests passed. |
| 4 | Sensitive referral selection is local-only, consent-gated, and does not change storage, network, URL, profile, or ranking. | VERIFIED | `SensitiveReferralPanel` has component-local state only; `RecommendationDashboard` mounts it only after the labelled disclosure. Its named component/integration tests passed. |
| 5 | Phase 7 exposes only test-only HTTPS `.invalid` referral fixtures, and a release record blocks public enablement. | VERIFIED | The allowlisted fixture directory contains only labelled `.invalid` URLs. The committed gate is referenced by the readiness checklist, release runbook, and evidence template; the production-tooling regression passed. |
| 6 | Every matching surface, including pathway recommendations, uses the shared ordinary-preference, evidence-grounded card contract. | FAILED | `RecommendationDashboard.tsx` still calls `buildPathwayRecommendations()` and renders “Best pathway” plus `Confidence: …%`; that legacy function uses `explainProgrammeFit`, `matchScore`, and `acceptanceRate`, rather than the governed match contract. |
| 7 | Students can reach confidential support from the recommendation verification area without treating it as an ordinary profile field. | VERIFIED | The accessible “Need confidential support?” disclosure conditionally renders `SensitiveReferralPanel`; its keyboard/open/decline non-side-effect test passed. |

**Score:** 6/7 truths verified.

## Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `apps/web/lib/programmes.ts` | Source-aware evidence model and legacy-safe normalization | VERIFIED | Substantive finite evidence model and normalization. |
| `apps/web/lib/server/programme-records.ts` | Governed catalogue boundary | VERIFIED | `getGovernedProgrammes()` normalizes the merged catalogue. |
| `apps/web/lib/admin-programmes.ts` | Evidence validation for staff publication | VERIFIED | Rejects documented evidence without public source information. |
| `apps/web/lib/onboarding-types.ts` | Ordinary/referral-only taxonomy | VERIFIED | Explicit allowlists and safe ordinary-profile normalization. |
| `apps/web/app/api/account/onboarding/route.ts` | Server-side referral-only rejection | VERIFIED | Validates before persistence call. |
| `apps/web/lib/server/data-store.ts` | Legacy persisted-profile normalization | VERIFIED | Normalizes onboarding profiles on data read. |
| `apps/web/components/support/SensitiveReferralPanel.tsx` | Local-only consent UI | VERIFIED | No persistence/network implementation; consent only reveals fixture. |
| `apps/web/lib/opportunity-matching.ts` | Governed ordering/reasons/evidence contract | VERIFIED | Uses ordinary preferences and documented support evidence only. |
| `apps/web/components/opportunities/OpportunityMatchCard.tsx` | Shared reason/evidence/action rendering | VERIFIED | Renders reasons, evidence, cautions, save, compare, source, and alternate-path actions. |
| `apps/web/components/recommendations/RecommendationDashboard.tsx` | Governed recommendation and pathway surface | FAILED | Governs programme cards, but still renders the legacy confidence-ranked pathway flow. |
| `07-PRELAUNCH-REFERRAL-RELEASE-GATE.md` | Public-referral release precondition | VERIFIED | Specifies source, owner, availability/jurisdiction, review, privacy, and human sign-off requirements. |
| `docs/production-release-runbook.md` | Authoritative public-release linkage | VERIFIED | Makes a completed per-destination record a release-evidence prerequisite. |

## Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `programme-records.ts` | `programmes.ts` | Governed catalogue normalization | WIRED | `getGovernedProgrammes()` returns `mergeProgrammes(...).map(normalizeProgrammeForGovernance)`. |
| `account/onboarding/route.ts` | `data-store.ts` | Validated ordinary payload save | WIRED | `validateOnboardingProfile()` returns `OrdinaryOnboardingProfile` before `saveOnboardingProfile()`. |
| `SensitiveReferralPanel.tsx` | `sensitive-referral-directory.ts` | Local fixture lookup after consent | WIRED | Only `getSensitiveReferralFixture()` supplies the revealed link. |
| `OpportunityMatchCard.tsx` | discovery / fit / recommendation cards | Shared rendering | PARTIAL | Discovery and fit are migrated, but the dashboard retains a separately calculated, confidence-ranked pathway presentation. |
| `RecommendationDashboard.tsx` | `SensitiveReferralPanel.tsx` | Student-action disclosure | WIRED | Labelled button conditionally mounts the panel in the verification/support area. |
| Release runbook | Referral release gate | Public-release precondition | WIRED | Runbook, readiness checklist, and evidence template link the same gate; CI runs the tooling test that checks it. |

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `ProgrammeResults.tsx` | `rankedMatches` | Server `getGovernedProgrammes()` → client `rankOpportunityMatches()` | Governed programme evidence and normalized profile | FLOWING |
| `ProgrammeFitPanel.tsx` | `match` | Profile from local/account source → `rankOpportunityMatches()` | Governed single-programme match | FLOWING |
| `RecommendationDashboard.tsx` | `governedMatches` | Server governed programmes + account/local profile → `rankOpportunityMatches()` | Governed programme cards | FLOWING |
| `RecommendationDashboard.tsx` | `bestPathway` | `buildPathwayRecommendations()` | Legacy score path uses `explainProgrammeFit`, `matchScore`, and `acceptanceRate` | FAILED |

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Evidence, privacy, matching, card, and dashboard regressions | `corepack pnpm --filter @scholar-scout/web test -- --runInBand` with 13 Phase-07 suites | 13 suites, 90 tests passed | PASS |
| Referral-gate operational regression | `node --test scripts/test-production-tooling.mjs` | 24 tests passed | PASS |
| TypeScript and lint | `corepack pnpm --filter @scholar-scout/web run lint` and `... run typecheck` | Both exited 0 | PASS |

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| No Phase 7 milestone requirement ID | 07-01 through 07-04 | Approved governance-only, pre-launch hardening slice | SATISFIED | All plans correctly declare `requirements: []`. |
| `PROD-07` | Roadmap / requirements traceability | Source-verified area resources and advice | NOT CLAIMED BY PHASE 7 | `REQUIREMENTS.md` maps `PROD-07` exclusively to Phase 8; Phase 7 uses only `.invalid` fixtures. |

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `apps/web/lib/pathway-recommendations.ts` | 30–31, 65 | Legacy fit/confidence scoring uses `explainProgrammeFit`, `matchScore`, `acceptanceRate`, and confidence sort | BLOCKER | Bypasses the governed ordinary-preference evidence contract for a still-visible pathway output. |
| `apps/web/components/recommendations/RecommendationDashboard.tsx` | 97, 222–229 | Renders “Best pathway” and a confidence percentage from the legacy flow | BLOCKER | Gives the user a separate predictive ranking in the governed recommendation screen. |
| `.planning/ROADMAP.md` | Phase 7 plan list | Still reports `1/4 plans executed` although four summaries and their commits exist | WARNING | Planning state is stale; correct it when the Phase 7 repair is completed. |

## Gaps Summary

Phase 7’s evidence model, local-only sensitive referral boundary, test fixtures, and future public-release documentation are substantively implemented and covered by passing focused tests. The goal is still not achieved because the active dashboard retains an alternate pathway scorer. It can rank and describe a “best pathway” from legacy fit/confidence inputs instead of the governed opportunity match model.

Repair the dashboard/pathway flow first, add a regression that changes GPA, acceptance rate, and `matchScore` without changing any visible pathway order or explanation, then re-run this verification. Update the roadmap plan count as part of the same closure.

---

_Verified: 2026-09-21T07:13:07Z_  
_Verifier: gsd-verifier_
