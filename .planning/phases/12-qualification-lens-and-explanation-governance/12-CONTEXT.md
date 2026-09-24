# Phase 12: Qualification Lens and Explanation Governance - Context

**Gathered:** 2026-09-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Give students an optional, account-held qualification lens that compares their deliberately supplied ordinary qualifications with the reviewed catalogue's published requirements and reviewed descriptions. It may reorder, explain, and help a student verify options, but never decides official eligibility or hides an opportunity. Sensitive circumstances, GPA, test scores, prestige, ZIP/residence inference, passive behaviour, and staff/provider sharing remain outside this phase.

</domain>

<decisions>
## Implementation Decisions

### Student-controlled qualification record
- **D-01:** Keep structured ordinary qualifications in the student's account and make them editable from both the account area and the programmes page. The structured choices cover diploma/credits, degree, licence, prior work, and voluntary military history. — **Reversibility:** costly — changing the persisted account contract later requires migration, validation, and compatibility handling.
- **D-02:** Include an optional editable free-text qualification note that stays private to the student. It has no staff-sharing, provider-sharing, or administrative-note flow in Phase 12.
- **D-03:** Students may explicitly promote words from their note into visible qualification-keyword choices. The app must not silently interpret free text, infer meaning, or use unconfirmed prose as a ranking signal. — **Reversibility:** costly — the visible keyword-selection boundary protects the account data contract and explanation trust.

### Transparent ordering and explanation
- **D-04:** Offer a student-controlled switch between normal catalogue order and **Qualifications first**. Qualifications-first keeps every opportunity visible and sorts in three transparent levels: (1) most checked published requirements first, descending by the number of checked requirements; (2) student-confirmed keyword connections; then (3) explore-and-verify opportunities with neither kind of connection. Ties remain deterministic.
- **D-05:** A checked item means a student's declared structured qualification corresponds to a published programme requirement; it is never called an official eligibility, admission, enlistment, funding, placement, salary, safety, or outcome decision. Each card must show the specific checked requirements and a direct source-based verification action.
- **D-06:** Keyword connections may use only the student's explicitly confirmed keywords against the reviewed catalogue's attributable requirement or programme-description text. They rank below checked requirements and above options with no connection, and the UI must name them as keyword connections rather than requirements satisfied.
- **D-07:** Missing, stale, unknown, conflicting, or otherwise dated requirements never count as a poor match. Keep them visible with a plain-language **Needs verification** label, source date, and a distinct blue visual treatment that supplements—never replaces—the text state and verification action.

### Plain-language, actionable guidance
- **D-08:** Write the primary lens language at an approximate sixth-grade reading level for every student, without profiling or inferring any student's literacy. Use short statements first and optional expandable detail where it helps without distracting from action.
- **D-09:** When a reviewed source documents an available support, show it beside a not-yet-checked or needs-verification requirement. Otherwise, provide the simple provider-verification action; do not invent availability or turn absent support data into a negative conclusion.

### the agent's Discretion
- Choose the precise account/profile form, note length/bounded keyword vocabulary, exact plain-language labels, card layout, deterministic tie-break, and responsive interaction pattern.
- Reuse the governed reviewed-snapshot, local shortlist, controlled URL, account-validation, source-state, and visible-focus patterns. Add only bounded helpers/components and tests needed for the private qualification lens.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product scope and safety rules
- `.planning/PROJECT.md` — milestone purpose, student-agency constraints, and separation of ordinary qualifications from sensitive circumstances.
- `.planning/REQUIREMENTS.md` — Phase 12 requirements `MATCH-01` through `MATCH-04` and the prohibited-scope list.
- `.planning/ROADMAP.md` — Phase 12 goal, boundaries, success criteria, and risk.
- `docs/product-recommendation-governance.md` — required explanations, all-visible ordering, source/verification actions, proxy prohibitions, and purpose-separated data rules.

### Governed catalogue and discovery boundaries
- `.planning/phases/09-catalogue-foundations-and-source-contracts/09-CONTEXT.md` — controlled evidence/freshness vocabulary and visible uncertainty rules.
- `.planning/phases/10-curated-import-and-governed-staff-publication/10-CONTEXT.md` — reviewed snapshot-only learner reads and no-live-provider boundary.
- `.planning/phases/11-choice-preserving-six-area-discovery/11-CONTEXT.md` — snapshot-only discovery, all-visible pathways, student-controlled comparison, and source-first actions.
- `.planning/phases/11-choice-preserving-six-area-discovery/11-VERIFICATION.md` — accepted responsive, source-first learner-surface contract.
- `apps/web/lib/catalogue-contract.ts` — controlled factual evidence and source-date states.
- `apps/web/lib/catalogue-discovery.ts` — current public snapshot discovery model, controlled filters, canonical URLs, and deterministic normal order.

### Account and presentation seams
- `apps/web/lib/onboarding-types.ts` — established account-held ordinary-preference and referral-only separation patterns.
- `apps/web/lib/onboarding-validation.ts` — existing server-validatable account form rules.
- `apps/web/lib/server/data-store.ts` — account persistence and conditional-write boundaries.
- `apps/web/app/api/account/onboarding/route.ts` — server-owned account onboarding route pattern.
- `apps/web/components/catalogue/CatalogueDiscoveryOverview.tsx` — accessible programme controls and source-state presentation.
- `apps/web/components/catalogue/CatalogueOpportunityCard.tsx` — factual cards, direct source actions, and responsive action rows.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/web/lib/catalogue-discovery.ts` — pure snapshot-to-card model, strict controlled filters, source state/date mapping, and stable normal ordering.
- `apps/web/components/catalogue/CatalogueDiscoveryOverview.tsx` and `apps/web/components/catalogue/CatalogueOpportunityCard.tsx` — labelled native controls, factual states, responsive cards, and official verification links.
- `apps/web/lib/onboarding-types.ts` and `apps/web/lib/onboarding-validation.ts` — typed, account-held ordinary fields and explicit referral-only separation.
- `apps/web/lib/server/data-store.ts` and `apps/web/app/api/account/onboarding/route.ts` — server-owned account persistence and validation seams.
- `apps/web/components/shortlist/ShortlistButton.tsx` and `apps/web/components/catalogue/CatalogueComparison.tsx` — visitor-controlled saved choices and comparison actions that must remain independent of the lens.

### Established Patterns
- Public learner surfaces consume only cloned reviewed snapshots and retain uncertainty with source/date/status plus a direct verification action.
- Server pages supply governed data; client components own explicit student interactions; profile/account writes validate on the server.
- Student-controlled state, native form controls, visible focus, readable state text, and responsive stacked factual cards are the established accessibility contract.

### Integration Points
- Extend the current discovery model and `/programmes` controls with an opt-in account qualification lens while preserving the normal-order route and all current filters.
- Add a bounded account qualification contract beside—not inside—the sensitive referral fields, then build explanation DTOs that cards, detail, and comparison can render from the reviewed snapshot.
- Add regression coverage proving every opportunity survives qualification ordering and prohibited signals cannot enter the persisted lens or sort computation.

</code_context>

<specifics>
## Specific Ideas

- Show “6 of 7 published requirements checked” before “5 of 7,” with the checked items visibly named.
- Put keyword-connected options below requirement-checked options but above options with no declared connection.
- Mark dated or incomplete facts in blue with simple “Needs verification” wording and a source date.
- Give every student plain, short explanations first and expandable detail only where it supports comprehension.

</specifics>

<deferred>
## Deferred Ideas

- A staff-visible or provider-visible note/messaging system is not part of Phase 12; the qualification note remains private to the student.
- Automated interpretation of free text, eligibility decisions, predictive matching, or inference from writing style remains out of scope.
- Sensitive support referral choices remain Phase 14's purpose-specific, non-persistent flow.

</deferred>

---

*Phase: 12-Qualification Lens and Explanation Governance*
*Context gathered: 2026-09-24*
