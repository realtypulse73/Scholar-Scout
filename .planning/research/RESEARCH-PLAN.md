# v1.1 Regional Opportunity Navigator Research Plan

**Status:** Active
**Started:** 2026-09-22
**Decision owner:** Scholar Scout product owner

## Research objective

Establish a reliable, maintainable evidence base for an opportunity catalogue that helps students in Greater Houston, Greater Chicago, Greater Buffalo, Greater Atlanta, and Greater New Orleans compare college, trade, apprenticeship, employer-linked training, and military-information pathways without making eligibility or outcome claims.

## Non-negotiable product rules

- A student can browse every pathway type regardless of age, neighbourhood, race, personal circumstance, prior education, or current preference.
- Ordinary qualifications a student deliberately enters (such as diploma/credits, degree, licence, prior work, or voluntary military history) may explain published requirements. They never suppress a route or become a prediction.
- Sensitive circumstances are not matching data. They can only open an optional, purpose-specific support referral with explicit consent; they are not inferred, persisted with the recommendation profile, shared externally, or used to alter rank.
- Every displayed factual claim has an attributable source, a checked date, and an honest current/needs-confirmation/unknown state.
- Scholar Scout journey pages use original or licensed transition imagery. Provider pages use only provider-approved, owned, licensed, or appropriately embedded media and clearly name the source.
- No student-facing content promises admission, enlistment, funding, job placement, salary, eligibility, programme quality, or personal outcome.

## Workstreams

### 1. Official regional boundary and inventory scope

**Question:** Which official CBSA/MSA definitions and published component geographies define each approved metro area?

**Sources of record:** OMB metropolitan statistical area delineations; U.S. Census Gazetteer/CBSA resources; official regional workforce agencies only for supplementary local coverage.

**Deliverable:** Stable metro IDs, display labels, authority URLs, checked dates, update-trigger policy, and a coverage matrix for Greater Houston, Greater Chicago, Greater Buffalo, Greater Atlanta, and Greater New Orleans.

### 2. Opportunity-source catalogue

**Question:** Which primary sources can verify each pathway type, its provider, location, audience, and current status?

**Research categories:**

- Two- and four-year public/private institutions: IPEDS, College Navigator, official provider catalogue and admissions pages.
- Community colleges and career/technical education: official provider and state education/workforce authority pages.
- Trades and registered apprenticeships: Apprenticeship.gov, official sponsor pages, and relevant state licensing/approval records.
- Employer-linked training, including AI-infrastructure pathways: employer-owned training pages, local partner/provider pages, and workforce-authority corroboration where available.
- Military pathways: official U.S. service, National Guard, Reserve, DoD, and VA education sources. Present factual exploration and official verification—not recruiting pressure or a personal eligibility judgment.

**Deliverable:** A source-authority ladder, required record fields, prohibited-source list, and first-pass coverage matrix that marks unknowns rather than inventing coverage.

### 3. Facts, pay, eligibility, and freshness

**Question:** How can the product show useful facts without overstating availability or a student’s eligibility?

**Sources of record:** Official provider requirements, federal/state labour statistics, BLS occupation data, government apprenticeship sources, and official public funding/education agencies.

**Deliverable:** A fact model that separately records provider/programme status, published entry requirements, delivery location, source URL, source type, reviewed date, publication/effective date, and verification status. Salary context, if shown, is occupation-and-area context with source/date—not a provider or personal promise.

### 4. Student control, safety, and lifecycle

**Question:** Which inputs are appropriate for comparison, and which are referral-only or prohibited?

**Sources of record:** `docs/product-recommendation-governance.md`, current route/data contracts, official youth/military information, and applicable privacy guidance.

**Deliverable:** Input classification table, consent wording/withdrawal design, retention/deletion boundary, minor-safe information design, handoff criteria, and tests that prove sensitive fields never change rank or provider disclosures.

### 5. Provider pages and visual experience

**Question:** What structure lets a student feel the transition story on Scholar Scout while seeing accurate provider-specific details after choosing an option?

**Sources of record:** Provider-owned public media/catalogue pages, explicit media permissions or approved embeds, and existing Scholar Scout accessibility/visual-system contracts.

**Deliverable:** Provider-page content schema; media-rights checklist; citation pattern; accessible reduced-motion behavior; and a clear boundary between Scholar Scout’s inclusive transition stories and verified provider content.

## Quality gate before any listing is shown

1. Verify the area boundary and source authority.
2. Verify the provider/programme URL and publication status from a first-party or official source.
3. Record source and review dates; mark uncertain information as `Needs confirmation` or `Unknown`.
4. Ensure display text has no personal eligibility, salary, placement, admission, or outcome guarantee.
5. Confirm the record can be shown without any sensitive student data.
6. Add automated validation and a staff review path before Preview deployment.

## Research outputs

- `STACK.md` — current technology/data-source integration choices and what not to add.
- `FEATURES.md` — table stakes, student-facing actions, differentiators, and explicit anti-features.
- `ARCHITECTURE.md` — catalogue, source provenance, consent, and provider-page boundaries.
- `PITFALLS.md` — source staleness, unlicensed media, eligibility claims, bias, youth safety, and operational risks.
- `SUMMARY.md` — synthesized roadmap inputs, source links, and decisions requiring product-owner confirmation.

## Completion criteria

Research is complete only when the summary names authoritative sources and freshness rules for all five metros and pathway categories, identifies unresolved source/rights gaps honestly, and produces testable requirements without relaxing existing recommendation-governance safeguards.
