---
phase: 07-governed-opportunity-and-support-matching
verified: 2026-09-21T12:01:49Z
status: passed
score: 7/7 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 6/7
  gaps_closed:
    - "Programme discovery, fit panel, recommendations, and pathway recommendations consume the shared governed contract and use only normalized ordinary preferences."
  gaps_remaining: []
  regressions: []
---

# Phase 7: Governed Opportunity and Support Matching Verification Report

**Phase Goal:** Students can compare visible programme and pathway opportunities through evidence-grounded, choice-preserving support explanations, while sensitive support uses a non-persisting referral path and never becomes a ranking or profile signal.

**Verified:** 2026-09-21T12:01:49Z
**Status:** passed
**Re-verification:** Yes — after dashboard-pathway scoring repair

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Every programme or pathway remains visible and shows documented support evidence or an explicit unknown/verify state; undocumented ordinary support lowers rank but never hides a choice. | VERIFIED | `rankOpportunityMatches()` maps every supplied programme, normalizes evidence, and deducts for undocumented requested ordinary support without filtering. Its named regression retained both documented and undocumented programmes and passed. |
| 2 | Only editable ordinary preferences can affect matching. Referral-only sensitive needs require purpose-specific local consent, cannot persist or transfer automatically, and do not affect matching. | VERIFIED | The account route validates ordinary profiles before saving; read/write normalization removes legacy referral-only values. `SensitiveReferralPanel` retains selection in component state only. Passing route, storage, panel, dashboard, and matcher tests cover the boundary. |
| 3 | Every matching surface uses the same plain-language reasons, source/date/verification information, and save, compare, source, and alternate-pathway actions. | VERIFIED | Discovery, fit, and dashboard each invoke `rankOpportunityMatches()` and render `OpportunityMatchCard`. The repaired dashboard maps its only visible programme/pathway sequence from `governedMatches`; the card supplies reasons, evidence, cautions, save, compare, source, and alternate-pathway actions. |
| 4 | Phase 7 contains only conspicuously test-only `.invalid` referral fixtures. Public referral destinations remain blocked until the authoritative release process records per-destination ownership, source, availability/jurisdiction, review date, and human sign-off. | VERIFIED | `sensitive-referral-directory.ts` declares only labelled HTTPS `.invalid` fixtures. The release gate is linked by the readiness checklist, release runbook, and evidence template; the production-tooling test passed. |
| 5 | Governed programmes carry attributable support/material-fact evidence; legacy evidence remains visible as unknown, stale, or conflicting with verification guidance. | VERIFIED | `getGovernedProgrammes()` returns `mergeProgrammes(...)`, which normalizes every record through `normalizeProgrammeForGovernance()`. Staff evidence validation and governed catalogue test coverage passed. |
| 6 | Requested ordinary support that is undocumented lowers rank but does not hide a programme. | VERIFIED | `opportunity-matching.ts` adds an explicit caution and negative rank delta while keeping the match in the returned array. `opportunity-matching.test.ts` passed with both programmes present in governed order. |
| 7 | Students can reach confidential support from the recommendation verification area without treating it as an ordinary profile field. | VERIFIED | The dashboard's labelled disclosure conditionally mounts `SensitiveReferralPanel`. Its keyboard/open/decline test proves no local-storage write, request, or navigation mutation; no referral-only value enters the matcher's normalized ordinary preferences. |

**Score:** 7/7 truths verified (0 present-but-behavior-unverified).

## Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `apps/web/lib/programmes.ts` | Source-aware evidence model and legacy-safe normalization | VERIFIED | Substantive finite evidence model; `normalizeProgrammeForGovernance()` retains unknown/stale/conflicting evidence with guidance. |
| `apps/web/lib/server/programme-records.ts` | Governed catalogue boundary | VERIFIED | `getGovernedProgrammes()` merges records and seeds through governed normalization. |
| `apps/web/lib/admin-programmes.ts` | Evidence validation for staff publication | VERIFIED | Publication validation rejects documented evidence without public attribution. |
| `apps/web/lib/onboarding-types.ts` and account/data-store boundaries | Ordinary/referral-only persistence boundary | VERIFIED | Finite taxonomy plus server and persistence normalization prevent referral-only values from becoming profile data. |
| `apps/web/lib/opportunity-matching.ts` | Governed ordering, reasons, evidence, and cautions | VERIFIED | Pure `rankOpportunityMatches()` consumes only ordinary preferences and normalized programme evidence. |
| `apps/web/components/opportunities/OpportunityMatchCard.tsx` | Shared accessible visible-card contract | VERIFIED | Rendered reasons, source/review/guidance, cautions, and all four choice-preserving actions are substantive and reused. |
| `apps/web/components/recommendations/RecommendationDashboard.tsx` | Governed recommendation and pathway surface | VERIFIED | Imports `rankOpportunityMatches()`, derives metrics from `governedMatches`, and renders every visible programme/pathway card from that same collection. No legacy pathway scorer import or confidence-ranked presentation remains. |
| `apps/web/lib/pathway-recommendations.ts` | Retired alternate legacy pathway scorer | VERIFIED (absent by design) | Deleted in `d9cd1d0`; repository scan found no production import or invocation. |
| `apps/web/components/support/SensitiveReferralPanel.tsx` | Local-only consent UI | VERIFIED | Component-local state reveals only a fixture after student action; no storage, fetch, or navigation call exists. |
| `07-PRELAUNCH-REFERRAL-RELEASE-GATE.md` and release documents | Public-referral release precondition | VERIFIED | The gate names source, owner, availability/jurisdiction, review, accessibility/contact-path, consent copy, and human sign-off requirements. |

## Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `programme-records.ts` | `programmes.ts` | Governed catalogue normalization | WIRED | `mergeProgrammes()` returns `...map(normalizeProgrammeForGovernance)`. |
| `account/onboarding/route.ts` | `data-store.ts` | Validated ordinary profile save | WIRED | `validateOnboardingProfile()` completes before the saved payload is passed onward. |
| `programme-records.ts` → recommendation page | `RecommendationDashboard.tsx` | Governed server catalogue prop | WIRED | `app/recommendations/page.tsx` awaits `getGovernedProgrammes()` and passes it as `programmes`. |
| `RecommendationDashboard.tsx` | `opportunity-matching.ts` → `OpportunityMatchCard.tsx` | One governed visible sequence | WIRED | `useMemo` creates `governedMatches` with `rankOpportunityMatches()`, and the only card map is `governedMatches.map(...)`. |
| `OpportunityMatchCard.tsx` | Discovery, fit, and dashboard surfaces | Shared rendering contract | WIRED | All three surfaces import the card and pass match objects from `rankOpportunityMatches()`. |
| `SensitiveReferralPanel.tsx` | `sensitive-referral-directory.ts` | Local fixture lookup after consent | WIRED | `getSensitiveReferralFixture()` supplies the selected `.invalid` URL only after component-local consent. |
| Release documents | Referral release gate | Public-release precondition | WIRED | The readiness checklist, release runbook, and prelaunch evidence template all reference the same required gate. |

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `RecommendationDashboard.tsx` | `programmes` | Server `getGovernedProgrammes()` from the recommendation page | Governed catalogue records with normalized evidence | FLOWING |
| `RecommendationDashboard.tsx` | `governedMatches` | `rankOpportunityMatches(programmes, profile)` | Deterministic ordinary-preference/evidence view models | FLOWING |
| `RecommendationDashboard.tsx` | Card order, reasons, evidence, cautions, verification count | `governedMatches` only | The legacy-metadata regression mutates GPA, acceptance rate, and `matchScore` while asserting the complete visible card snapshot and count remain unchanged | FLOWING |
| `SensitiveReferralPanel.tsx` | Selected referral fixture | Component-local selected category → fixture directory | One test-only `.invalid` destination; no persistence or network source | FLOWING |

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Dashboard has no active legacy pathway scorer and legacy metadata cannot change visible governed cards | `corepack pnpm --filter @scholar-scout/web test -- --runInBand --runTestsByPath __tests__/components/RecommendationDashboard.test.tsx __tests__/app/matching-surfaces.test.tsx __tests__/lib/opportunity-matching.test.ts` | 3 suites, 5 tests passed | PASS |
| All Phase 7 evidence, privacy, matching, card, and dashboard regressions | `corepack pnpm --filter @scholar-scout/web test -- --runInBand --runTestsByPath` with 13 Phase 7 suites | 13 suites, 99 tests passed | PASS |
| Referral release-gate and fixture allowlist | `node --test scripts/test-production-tooling.mjs` | 24 tests passed | PASS |
| TypeScript and lint | `corepack pnpm --filter @scholar-scout/web run typecheck` and `... run lint` | Both exited 0 | PASS |
| Retired scorer wiring | `rg "pathway-recommendations|buildPathwayRecommendation|buildPathwayRecommendations" .` excluding generated files | No production reference; only a historical documentation branch-name mention remains | PASS |

## Probe Execution

No Phase 7 probe was declared in its plans or summaries, and no `scripts/**/probe-*.sh` file exists. **SKIPPED (no phase probe).**

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- |
| No Phase 7 milestone requirement ID | 07-01 through 07-04 | Approved governance-only, pre-launch hardening slice | SATISFIED | Every Phase 7 plan declares `requirements: []`; the ROADMAP explicitly preserves Phase 8 ownership for `PROD-07`. |
| `PROD-07` | ROADMAP / REQUIREMENTS traceability | Source-verified area resources and advice | NOT CLAIMED BY PHASE 7 | `REQUIREMENTS.md` maps it exclusively to Phase 8; Phase 7 supplies only `.invalid` fixtures and a release gate. |

## Anti-Patterns Found

No blocker or warning anti-patterns were found in the Phase 7 production artifacts. The retired confidence-based scorer was deliberately deleted after its last active dashboard consumer was migrated; the scan confirmed it is not orphaned production code.

## Re-verification Result

The original blocker was real: the dashboard retained a separately confidence-ranked pathway flow whose fallbacks considered legacy `matchScore` and `acceptanceRate`. Commit `d9cd1d0` removes that module and presentation. The repaired dashboard now has exactly one visible programme/pathway collection, derived from `rankOpportunityMatches()`. The rendered-card regression alters GPA, acceptance rate, and match-score metadata, then proves its order, reasons, evidence, cautions, and verification total do not change.

The Phase 7 plan count is also accurate: all four plans are marked complete and the roadmap reports `4/4 executed` pending this re-verification.

---

_Verified: 2026-09-21T12:01:49Z_
_Verifier: gsd-verifier_
