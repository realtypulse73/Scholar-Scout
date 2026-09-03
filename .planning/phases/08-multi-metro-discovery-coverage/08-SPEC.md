---
phase: 08
name: Seven-Area Discovery Coverage
status: ready-for-planning
created: 2026-08-29
updated: 2026-08-29
ambiguity:
  goal_clarity: 0.94
  boundary_clarity: 0.90
  constraint_clarity: 0.82
  acceptance_clarity: 0.82
  score: 0.11
assumptions:
  - "Financial-aid information is a dated official-source comparison, never an eligibility calculator or personalized financial recommendation."
  - "Phase 8 does not collect, persist, export, or reuse personalized advisor data; public guidance is limited to selected market/pathway and vetted source cards."
---

# Phase 8: Seven-Area Discovery Coverage

**Created:** 2026-08-29
**Updated:** 2026-08-29
**Ambiguity score:** 0.11 (gate: <= 0.20)
**Requirements:** 12 locked

## Goal

Students can explicitly select any of seven peer geographic markets and discover verified degree, trade, certificate, and apprenticeship pathways, including a clearly labeled nearest verified fallback and dated official financial-aid/loan information without location inference, eligibility claims, or personalized financial advice.

## Background

The current programme taxonomy already contains four-year, two-year, trade/vocational, certificate, and apprenticeship pathways, and the programme page can filter them. The public Western New York directory has no first-class pathway coverage rule, nearest-offering fallback, or dated jurisdiction-specific financial-aid record. The advisor says not to guarantee aid and refers complex financial questions to a human, but has no governed, dated aid-source context.

Federal Student Aid treats college, career, and trade school pathways as in scope, while provider and state deadlines/availability differ; an institution makes the final aid offer after admission. Jamaica's Students' Loan Bureau conditions loans on an approved programme at an Approved Tertiary Institution. These are comparison facts, not individual eligibility determinations. Sources checked during specification: [Federal Student Aid deadlines](https://studentaid.gov/articles/3-fafsa-deadlines/), [Federal Student Aid award distinction](https://studentaid.gov/articles/fafsa-submission-summary/), [Federal Work-Study limits](https://studentaid.gov/articles/8-things-federal-work-study/), [Jamaica SLB eligibility](https://www.slbja.com/faq/what-makes-an-individual-eligible-for-a-student-loan/), and [Louisiana TOPS Tech](https://mylosfa.la.gov/tops/tops-tech/).

## Requirements

### R1. Seven equal geographic discovery areas

- **Current state:** One Western New York-specific directory; no governed seven-market registry.
- **Target state:** A single registry represents exactly Greater Chicago; Greater Kingston, Jamaica; Greater Memphis, Tennessee; New Orleans, Louisiana; Austin, Texas; Houston, Texas; and Greater Hempstead, New York, with stable IDs, visible names, country/state context, and a published geographic centre used only for fallback ordering.
- **Acceptance:** Dataset and UI tests assert exactly those seven entries are selectable/directly navigable and share one discovery workflow, source contract, and validation path.

### R2. Four peer pathway classes

- **Current state:** Core programme types include trade, certificate, and apprenticeship values, but regional discovery does not require or expose them as peers.
- **Target state:** Degree, trade/skilled-trades, certificate, and apprenticeship are first-class visible categories in every market's discovery, filters, cards, advisor guidance, and source-curation rules.
- **Acceptance:** Validation rejects a market release record set that lacks a current first-party offering or governed fallback for any class; component tests expose all four labels without a generic catch-all.

### R3. Nearest verified offering fallback

- **Current state:** An absent local category produces no governed alternative.
- **Target state:** When the selected market lacks a verified offering for a requested pathway, discovery presents the nearest verified fallback from the governed catalogue, marks it outside the selected market, identifies its market/provider, and links an official current source. A market is never replaced by an empty category alone.
- **Acceptance:** Tests cover a local match, an out-of-market fallback, and release-data rejection when no verified fallback is available; the fallback visibly says it is outside the selected area and includes its official link and verification notice.

### R4. Privacy-preserving nearest ordering

- **Current state:** No fallback ordering exists; the product does not use browser geolocation.
- **Target state:** “Nearest” is approximate straight-line map distance: great-circle (Haversine) metres from the selected market's published WGS-84 centre to a provider's public site coordinate, compared before display rounding. Equal distance sorts by newer source freshness, then provider name. It is never travel time, access assurance, GPS, an address, or inferred residence.
- **Acceptance:** Domain tests prove distance/tie-break order, invalid/absent coordinate rejection, and that a selected market alone is sufficient; UI calls it approximate map distance, not travel time; tests assert no geolocation API, address field, or inferred-location code.

### R5. Official, current pathway-source records

- **Current state:** WNY records have selected first-party links/review dates; new markets have no governed records.
- **Target state:** Every displayed provider/programme/fallback record has a stable market ID, pathway class, provider name, public-site coordinate, first-party/official URL, source type, checked date, and verification status. Missing, malformed, stale, or non-official sources never appear as verified.
- **Acceptance:** Validation rejects incomplete records; link/data tests cover every market-pathway pair; Preview review confirms visible cards expose their official source and source date.

### R6. Financial-aid and loan source cards, not determinations

- **Current state:** Discovery offers generic “verify aid” language, not dated official aid/loan facts.
- **Target state:** Relevant pathway/provider surfaces show dated official cards for applicable federal, state/territory, Jamaican, provider, or registered-apprenticeship-sponsor funding sources. A card identifies authority, jurisdiction, provider/programme scope, funding type, published conditions, award cycle/effective period where published, URL, and checked date.
- **Acceptance:** Tests distinguish `published eligibility conditions`, `reported current availability`, `current confirmation needed`, and `not assessed`; no card renders an individualized eligibility conclusion, loan recommendation, exact aid promise, or unsupported availability claim.

### R7. Freshness, jurisdiction, and availability boundaries

- **Current state:** No revalidation cadence or boundary exists for regional aid information.
- **Target state:** Availability and loan records are revalidated every 30 days during an active award cycle and immediately after an official change. Overdue records become “Current confirmation needed.” Cards state programme/provider jurisdiction and any source-stated residency qualifier without inferring student residency.
- **Acceptance:** Time-based tests cover current, exactly-30-day, overdue, and official-change states; UI shows source date and overdue warning; a market selection never becomes a residency or eligibility assertion.

### R8. Government-imposed loan restriction records

- **Current state:** The application has no governed model for tracking official government loan restrictions by jurisdiction or pathway.
- **Target state:** Where an official government authority publishes a loan restriction or condition relevant to a displayed pathway/provider, the public registry retains a dated, jurisdiction-specific record with authority, jurisdiction, programme/pathway scope, restriction/condition type, published effective or award-cycle dates when available, official URL, checked date, and change status. It refreshes at least every 30 days during an active cycle and immediately after an official change; overdue records become “Current confirmation needed.”
- **Acceptance:** Dataset validation rejects a loan-restriction record missing authority, jurisdiction, scope, condition type, official URL, checked date, or change status; time-based tests cover active, overdue, and official-change downgrade states; UI tests show a direct official link and human-referral instruction without an eligibility, availability, funding, or advice assertion.

### R9. Student-centered, bounded advisor guidance

- **Current state:** The advisor is student-facing and says not to guarantee aid, but lacks governed pathway/aid-source context.
- **Target state:** Advisor/simulation guidance treats all four classes as peer options, offers verified source links/questions to compare, distinguishes potential eligibility from present availability, and directs the student to the provider financial-aid office or official authority to verify.
- **Acceptance:** Contract/API and judgment review prove it names no “best” path, does not promise admission, aid, loan terms, pay, employment, or outcomes, and refers complex financial cases to a qualified human/provider.

### R10. Location and financial-data minimization

- **Current state:** Broad location preferences and advisor context exist, but no Phase 8 aid-data contract.
- **Target state:** Discovery uses only selected market or explicit optional location. Source cards require no student data. The product neither requests nor accepts SSN/government IDs, tax returns, income/assets, bank/card/loan data, aid credentials, precise address, protected attributes, immigration status, or passive location/behaviour data for aid guidance.
- **Acceptance:** Route/component tests prove cards/fallbacks work with no financial profile; validation rejects prohibited data/credentials; privacy review confirms cards and prompts do not record those values.

### R11. Accessible and candid presentation

- **Current state:** WNY has accessible verification notice/manual source-link/Unicode backstops, but no category/fallback/aid-card system.
- **Target state:** Market, pathway, fallback, and aid-card controls are keyboard-accessible, screen-reader understandable, resilient to long Unicode labels, and visibly direct students to verify with provider/authority without hiding outside-market, stale, or unknown status.
- **Acceptance:** Component tests cover keyboard roles, empty/error/fallback states, long Unicode labels, and source-date labels; Preview human review checks screen-reader order and visible official links for local, fallback, and overdue states.

### R12. Staged rollout and inherited gates

- **Current state:** Phase 1 external release proof and Phase 5 provider/assistive-technology checks remain unpassed.
- **Target state:** Phase 8 rolls out additively through source validation, automated data/domain/UI checks, non-production Preview review, and qualified human review; it cannot waive or mark earlier gates passed.
- **Acceptance:** The Phase 8 plan maps every market-pathway pair, freshness, fallback, card, accessibility, and advisor-safety check; final verification retains Phase 1/5 unresolved evidence as dependencies until it passes.

## Boundaries

### In scope

- One consistent seven-market registry and explicit market selection/direct navigation.
- Four first-class pathway categories, source criteria, coverage validation, and nearest verified fallback cards.
- Dated official financial-aid/loan source cards and government-imposed loan-restriction records, freshness policy, jurisdiction/residency-qualifier display, and safe advisor comparison/referral language.
- Privacy-minimizing location behavior, accessibility, source validation, Preview rollout, automated tests, and inherited-gate traceability.

### Out of scope

- Eligibility calculators, individual determinations, loan recommendations, credit advice, payment plans, or financial advice — source comparison cannot determine individual circumstances.
- Financial/identity/credential/precise-location/protected/immigration/health/passive-behaviour data — unnecessary and barred by the privacy boundary.
- Browser geolocation, home-address collection, inferred residence, or travel-time claims — approved ordering is public-coordinate map distance only.
- Guarantees of admission, award, funds, interest rate, loan approval, pay, employment, programme quality, or outcome.
- Area-specific school-district scope, exceptions, or workflow — all seven are peer geographic markets.
- Waiving Phase 1, Phase 5, or later human/external verification gates.

## Constraints

- Retain the Next.js/TypeScript/Vercel foundation and source-linked discovery model.
- Use first-party provider, official government/aid authority, or official registered-apprenticeship-sponsor sources; third-party summaries never become verified facts.
- Phase 8 introduces no personalized advisor inputs, profile creation, persistence, export, or marketing reuse. Public market/pathway guidance behaves the same for authenticated and unauthenticated students.
- Every availability statement has a source date and direct verification action; dates/cycles are never fabricated.

## Acceptance Criteria

- [ ] Exactly the seven named peer markets use one explicit discovery contract.
- [ ] Each market exposes degree, trade/skilled-trades, certificate, and apprenticeship peer categories, with a verified local offering or governed nearest fallback for every category.
- [ ] Fallback ordering uses only selected-market centre and public provider coordinate; an outside-market fallback says so and calls distance approximate map distance, not travel time.
- [ ] Every visible pathway/fallback has a current official source, source date, and honest verification status.
- [ ] Every aid/loan card separately displays authority, jurisdiction, scope, funding type, published conditions, source date, and verification link; it never equates conditions with eligibility/current availability.
- [ ] Every displayed government-imposed loan restriction is a dated official record with authority, jurisdiction, pathway/programme scope, restriction/condition type, effective/award-cycle dates when published, official URL, checked date, and change status; overdue data becomes “Current confirmation needed.”
- [ ] Records at/before 30 days and after official change follow the stated freshness policy; overdue records show “Current confirmation needed.”
- [ ] No personal financial or prohibited identity/location data is requested, inferred, stored, logged, or sent to an advisor/provider for cards/fallbacks.
- [ ] Discovery/advisor copy makes no admission, eligibility, funding, loan, employment, pay, quality, or outcome guarantee and refers complex financial cases to official/human help.
- [ ] Keyboard, screen-reader, Unicode, empty/error, fallback, stale-source, and official-link behavior pass automated and Preview human checks.
- [ ] Phase 8 verification retains outstanding Phase 1/5 gates as unpassed until their evidence exists.

## Edge Coverage

**Coverage:** 55/55 applicable edges resolved · 0 unresolved

| Category | Requirement | Status | Resolution / Reason |
|----------|-------------|--------|---------------------|
| adjacency / empty / ordering | R1 | ✅ explicit | Duplicate/missing ID or a non-exact registry is rejected; canonical seven-market order is stable. |
| adjacency / empty / ordering | R2 | ✅ explicit | Duplicate category records are rejected; every market-pathway pair resolves to exactly one local or fallback record in stable category order. |
| adjacency / empty / ordering / idempotency / concurrency | R3 | ✅ explicit | Local wins; missing local yields one deterministic sorted fallback; missing both rejects release data; repeated/parallel reads of one source snapshot return the same result. |
| boundary / adjacency / empty / ordering / precision | R4 | ✅ explicit | Coordinates must be valid WGS-84 values; Haversine metres are compared before display rounding; duplicate provider IDs rejected; equal distance uses freshness then name. |
| adjacency / empty / encoding / ordering | R5 | ✅ explicit | Required source fields are Unicode-safe after trimming; duplicate stable IDs, blank collections, invalid URLs/dates, and ambiguous ordering are rejected. |
| adjacency / empty / encoding / ordering / idempotency / concurrency | R6 | ✅ explicit | Controlled source-status vocabulary prevents missing data becoming an availability/eligibility claim; duplicate updates and parallel reads resolve to the same reviewed record/version. |
| boundary / adjacency / empty / ordering / precision / idempotency / concurrency | R7 | ✅ explicit | Exactly 30 days remains current; a later instant is confirmation-needed; official-change event overrides date; duplicate/parallel refreshes leave one newest reviewed status; no residency inference. |
| boundary / adjacency / empty / encoding / ordering / precision / idempotency / concurrency | R8 | ✅ explicit | Required official fields are Unicode-safe; absent/duplicate records are rejected; exactly 30-day/on-change transitions are deterministic, including repeated/parallel refreshes. |
| empty / encoding / idempotency / concurrency | R9 | 🧪 backstop | Held-out advisor cases cover blank/Unicode prompts, repeated calls, stale facts, ambiguous financial questions, and complex referrals. |
| empty / encoding / idempotency / concurrency | R10 | ✅ explicit | Cards/fallbacks render without profile; prohibited inputs are rejected before storage/logging/prompt use, including repeated or parallel submissions. |
| adjacency / empty / encoding / ordering | R11 | ✅ explicit | Accessible labels have deterministic reading/order for empty, fallback, and long-Unicode content; duplicate controls are not rendered. |
| idempotency / concurrency | R12 | ✅ explicit | Repeated/parallel final-verification runs preserve inherited gates as unpassed unless their own retained evidence changes. |

## Prohibitions (must-NOT)

**Coverage:** 8/8 applicable prohibitions resolved · 0 unresolved

| Prohibition (must-NOT statement) | Requirement | Status | Verification / Reason |
|----------------------------------|-------------|--------|------------------------|
| MUST NOT infer/collect GPS, home address, residency, or travel time to find/order fallback. | R3–R4 | resolved | test and judgment review |
| MUST NOT display a non-official/stale/missing source as verified availability or individual eligibility. | R5–R7 | resolved | test and judgment review |
| MUST NOT turn a card/reply into personalized financial advice, loan recommendation, promise, or admission/eligibility/award/outcome claim. | R6–R8 | resolved | test and judgment review |
| MUST NOT request, accept, retain, log, or prompt with financial credentials, IDs, tax/income/asset data, bank/card/loan data, precise address, protected attributes, immigration status, or passive location/behaviour. | R9 | resolved | test and privacy judgment review |
| MUST NOT label a pathway unavailable merely because funding/eligibility is unknown; use current-confirmation language and official verification. | R6–R7 | resolved | test and judgment review |
| MUST NOT hide outside-market status, turn map distance into access assurance, or make any pathway class second-class. | R2–R4 | resolved | component test and accessibility judgment review |
| MUST NOT add an area-specific school-district workflow or exception. | R1 | resolved | registry/data test |
| MUST NOT mark inherited Phase 1/5 human/external checks passed without retained evidence. | R11 | resolved | final-verification review |

## Ambiguity Report

| Dimension | Score | Min | Status | Notes |
|-----------|-------|-----|--------|-------|
| Goal Clarity | 0.94 | 0.75 | ✓ | Seven markets, four pathways, fallback, and dated source cards are specific. |
| Boundary Clarity | 0.90 | 0.70 | ✓ | Excludes personalization, location inference, financial data, and guarantees. |
| Constraint Clarity | 0.82 | 0.65 | ✓ | Official-source, 30-day freshness, public-coordinate, privacy, and inherited-gate rules locked. |
| Acceptance Criteria | 0.82 | 0.70 | ✓ | Dataset, domain, UI, advisor, Preview, and human-review checks are falsifiable. |
| **Ambiguity** | **0.11** | **<=0.20** | ✓ | No personalized advisor-data collection is in Phase 8; it is an explicit boundary, not an unresolved implementation choice. |

## Interview Log

| Round | Perspective | Question summary | Decision locked |
|-------|-------------|------------------|-----------------|
| 1 | Researcher | Missing local pathway coverage? | Show nearest verified offering; disclose outside selected market. |
| 2 | Simplifier | What determines “nearest”? | Approximate straight-line distance from market centre to public provider coordinate; freshness then name ties. |
| 3 | Boundary Keeper | What aid guidance is safe? | Dated official-source cards/comparison only; no calculator, advice, or loan recommendation. |
| 4 | Failure Analyst | How do availability/jurisdiction stay honest? | Revalidate every 30 days/on official changes; overdue downgrade; show jurisdiction/qualifier without residency inference. |

## Locked Privacy Boundary

Phase 8 does not add personalized advisor-data collection. Public guidance uses the selected market/pathway and vetted official source cards only; it does not create a profile or infer more for authenticated students. It has no collection, persistence, export, or marketing reuse path. Personal aid eligibility, residency/immigration, income/tax, debt/default/appeal, and conflicting or stale source questions receive the official authority/provider link plus a clear instruction to speak with that office or a qualified advisor. Any later feature that proposes personalized advisor inputs requires a new consent, minimization, retention/deletion/export, security/access, and handoff decision before implementation.

---

*Phase: 08-multi-metro-discovery-coverage*
*Specification updated: 2026-08-29*
*Next step: $gsd-discuss-phase 8 — implementation decisions after the retained advisor-data privacy gate is resolved.*
