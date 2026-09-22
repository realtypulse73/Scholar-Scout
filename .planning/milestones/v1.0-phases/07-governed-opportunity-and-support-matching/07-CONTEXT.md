# Phase 7: Governed Opportunity and Support Matching - Context

**Gathered:** 2026-09-20
**Status:** Ready for planning

## Phase Boundary

Phase 7 turns the existing programme discovery and preference-matching experience into a transparent, choice-preserving opportunity-and-support matcher. Each visible pathway will present its documented support bundle, explain why it appears, identify what must be verified, and offer practical next actions.

This phase may personalize ordinary opportunity matches only with a student's editable onboarding preferences. Sensitive support categories require a separate, one-time consent, are used only to locate a human or qualified-provider referral, are not retained, and are never shared automatically. The phase must not make admissions, eligibility, success, safety, or potential claims.

## Implementation Decisions

### Match purpose

- **D-01:** Each match is a programme or pathway paired with its documented support bundle; it is not a disconnected list of opportunities and services. — **Reversibility:** costly — This shapes the catalogue evidence model, matching rules, and student-facing card contract.
- **D-02:** A pathway with missing requested support remains visible but ranks lower; it must never be hidden. Its card must say that the support is not documented and needs verification. — **Reversibility:** costly — This is a choice-preserving ranking contract used by discovery and recommendation surfaces.
- **D-03:** Personal support alignment may use only supports documented by a programme or linked provider and only after the student explicitly selects that support category.
- **D-04:** For sensitive or high-stakes needs—including disability access, housing, mental health, immigration, and complex financial help—the product offers a human-advisor or qualified-provider referral instead of ranking a “best” programme.

### Student control

- **D-05:** Ordinary opportunity matching may use the student's existing onboarding preferences: interests, pathway, location, affordability, and non-sensitive support preferences. The student can edit or clear those preferences at any time.
- **D-06:** Sensitive support categories need separate, plain-language, purpose-specific consent before they can be used to locate a referral. They never influence opportunity rank.
- **D-07:** Sensitive support details are used for the current referral only and are not retained in a referral or recommendation profile. — **Reversibility:** costly — Persisting them later would require a separately designed protected data model, retention policy, access control, delete/export behavior, and migration.
- **D-08:** Following a referral opens the provider's information or contact page; Scholar Scout does not send the student’s identity or answers to a provider automatically.

### Match cards

- **D-09:** Every match card shows two to four plain-language reasons grounded in the student's stated preferences and documented programme details; it does not lead with an unexplained fit score.
- **D-10:** Every card shows at least one material fact with a source link, the date when available, and a visible “verify before applying” prompt.
- **D-11:** Cards offer save, compare, visit-source, and lower-cost or alternate-pathway actions; they do not start an application in Scholar Scout.
- **D-12:** When a material fact or requested support is missing, old, or conflicting, the card says that it is unknown or needs verification and offers an appropriate source or human referral.

### the agent's Discretion

- Choose the exact accessible layout, wording, source-evidence schema, deterministic weighting, and test fixtures, provided the decisions above and the recommendation-governance constraints remain intact.

### Approved pre-launch authority resolution

- **Phase authority:** Phase 7 is an approved governance-only pre-launch hardening slice. It intentionally has no new milestone requirement ID; `PROD-07` remains Phase 8 work and must not be claimed by this phase.
- **Ordinary taxonomy:** `financial-aid`, `first-gen`, `tutoring`, and `career-counseling` are the finite, editable ordinary support preferences. `none` is a UI-only clear choice. They can affect matching only when the programme or a linked provider documents support evidence.
- **Referral-only taxonomy:** disability access, housing, mental health, immigration, complex financial help, childcare, and language support are sensitive/referral-only. They never enter rank reasons, profiles, persistence, URLs, analytics, or provider requests.
- **Destination policy:** Phase 7 may use only clearly labelled `*.invalid` fixture destinations. It does not claim an available real provider or publish a live referral. Before any public referral destination is enabled, the authoritative release workflow must record a reviewed source, accountable owner, availability or jurisdiction, review date, and human sign-off for that individual destination.

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product governance and scope

- `.planning/PROJECT.md` — core value, technical and data-safety constraints, and Phase 6 transition to governed matching.
- `.planning/REQUIREMENTS.md` — active milestone boundaries and the pending source-verified, area-aware resource requirement.
- `.planning/ROADMAP.md` — phase ordering and Phase 6 dependency.
- `docs/product-recommendation-governance.md` — permitted and prohibited signals, consent boundaries, explanations, referral triggers, source evidence, and claims catalogue.
- `.planning/.research/Student Opportunity Support Matching.md` — research context for opportunity-and-support combinations; use as evidence context, not as permission to infer sensitive needs.

### Existing product behavior

- `apps/web/lib/preference-matching.ts` — current deterministic preference ranking and explanation model that must be adapted away from predictive/fit language.
- `apps/web/lib/onboarding-types.ts` — ordinary profile fields and the existing support-category taxonomy.
- `apps/web/lib/programmes.ts` — programme data shape and documented support inventory to extend with provenance and unknown-state handling.
- `apps/web/lib/server/programme-records.ts` — governed programme merge boundary; do not bypass it with raw seed data.
- `apps/web/app/programmes/page.tsx` and `apps/web/components/programmes/ProgrammeResults.tsx` — current discovery page and result-card integration points.
- `apps/web/components/recommendations/RecommendationDashboard.tsx` — existing recommendation surface and local/account context pattern.

## Existing Code Insights

### Reusable Assets

- `explainProgrammeFit` and `getRankedProgrammeMatches` in `apps/web/lib/preference-matching.ts` already provide deterministic reasons, cautions, and signals; Phase 7 can make those reasons source-aware and choice-preserving rather than predictive.
- `OnboardingData` in `apps/web/lib/onboarding-types.ts` provides ordinary editable preferences and identifies support categories that need governance separation.
- `getGovernedProgrammes` in `apps/web/lib/server/programme-records.ts` merges staff-governed records with seed programmes and is the required catalogue boundary.
- The programmes page and `ProgrammeResults` already render server-ranked listings with accessible filtering and shortlist actions.

### Established Patterns

- Keep ranking rules in small, deterministic pure functions in `apps/web/lib/`; route handlers and pages should consume them rather than reimplement ranking.
- Server-rendered catalogue discovery must use the governed programme boundary, not the raw seed array.
- Route handlers validate and return safe structured errors early; sensitive data must remain server-only and never be placed into public responses or client-visible analytics.

### Integration Points

- Extend governed programme facts with source URL, provenance, last-verified date, availability/unknown state, and documented support data before rendering matching claims.
- Update ranking/explanation logic and programme/recommendation cards together so ranking reasons, cautions, verification language, and available actions agree.
- Introduce a one-time sensitive-referral path that does not write sensitive selections to the ordinary onboarding profile or provider systems.

## Specific Ideas

- Support absence is a visible verification prompt and a lower-ranking factor, never a reason to remove a pathway.
- Human referrals are advisory and source-linked; they do not disclose student answers or make a conclusion on the student's behalf.
- A lower-cost or alternate pathway must remain directly reachable from every match card.

## Deferred Ideas

- Persisting a protected sensitive-referral profile is deferred until a purpose-separated data model, retention/delete/export controls, and access/audit protections are designed and tested.
- Automated provider referrals, eligibility decisions, admissions predictions, and application submission are out of scope.
- Area-specific source-verified resource discovery and area-aware advisor/simulation guidance remain mapped to the pending `PROD-07` work in Phase 8.

---

*Phase: 07-governed-opportunity-and-support-matching*
*Context gathered: 2026-09-20*
