---
phase: 08
name: Seven-Area Discovery Coverage
status: needs-privacy-decisions
created: 2026-08-29
ambiguity:
  goal_clarity: 0.90
  boundary_clarity: 0.82
  constraint_clarity: 0.68
  acceptance_clarity: 0.64
  score: 0.22
assumptions:
  - "Use the existing source-linked regional-directory model as the minimum viable discovery surface; detailed per-market catalogue breadth is planned from verified first-party sources."
  - "Each requested area, including Greater Hempstead, uses the same governed geographic discovery model and validation path."
  - "Area-aware advisor/simulation guidance is student-centered and choice-preserving; any added advice input is knowingly volunteered, minimized to a disclosed purpose, consented, protected, and deletable."
---

# Phase 8: Seven-Area Discovery Coverage

## Goal

Give students a trustworthy, accessible way to browse source-verified postsecondary and transition resources for seven named coverage areas: Greater Chicago; Greater Kingston, Jamaica; Greater Memphis, Tennessee; New Orleans, Louisiana; Austin, Texas; Houston, Texas; and Greater Hempstead, New York.

## Requirements

### R1. Seven named discovery areas

- **Current state:** The application has one Western New York-specific directory and no canonical registry of named metro-area coverage.
- **Target state:** A governed regional registry represents all seven requested areas with stable IDs, student-facing names, country/state context, and a source-linked discovery entry point.
- **Acceptance:** A test asserts exactly these seven named entries can be selected and rendered: Greater Chicago; Greater Kingston, Jamaica; Greater Memphis, Tennessee; New Orleans, Louisiana; Austin, Texas; Houston, Texas; and Greater Hempstead, New York.

### R2. Equal geographic-market treatment

- **Current state:** The application has no shared geographic-market registry for the seven requested areas.
- **Target state:** Every requested area, including Greater Hempstead, uses the same governed regional discovery model, source requirements, selection behavior, and validation path.
- **Acceptance:** A test validates that each of the seven registry entries renders through the same geographic discovery surface with no area-specific workflow or source exception.

### R3. Source-governed discovery data

- **Current state:** Western New York records carry first-party links and review dates; the seven new areas have no governed records.
- **Target state:** Every displayed new-area institution, programme, and local-resource record carries a reviewed first-party source URL and source-review metadata; an unavailable or invalid source is not displayed as verified.
- **Acceptance:** Dataset validation rejects records missing a stable area ID, display name, first-party source URL, or review date; automated link/data tests cover every area and the Preview review records the visible-source outcome.

### R4. Explicit, privacy-preserving location behavior

- **Current state:** Discovery filters support broad local/in-state/online preferences, with no metro selector or browser geolocation.
- **Target state:** Students explicitly choose a coverage area or navigate to it directly. The product neither infers home location nor uses a selected area as an admissions, eligibility, or ranking decision.
- **Acceptance:** Browser and domain tests prove direct links and explicit selection render the requested area; no geolocation API, address collection, or location-derived admissions assertion is introduced.

### R5. Accessible, resilient seven-area presentation

- **Current state:** The WNY directory has accessible copy and manually verified source-link/Unicode backstops.
- **Target state:** Every area uses the same visible verification notice, keyboard-accessible selector/navigation, readable empty/error state, and responsive long-label wrapping.
- **Acceptance:** Component tests cover keyboard roles, empty state, long Unicode labels, and all seven region names; Preview human review checks screen-reader order and visible official links for populated and empty states.

### R6. Release, verification, and rollout traceability

- **Current state:** Phase 1 has five unpassed external GitHub/Vercel evidence checks; Phase 5 retains its own live provider and assistive-technology gates.
- **Target state:** Phase 8 rollout is additive and staged through validated data, automated checks, non-production Preview verification, and final human review. It cannot erase, waive, or mislabel earlier human/external gates.
- **Acceptance:** The Phase 8 plan maps data validation, UI/domain tests, Preview deployment checks, and human review for every area; final verification lists Phase 1's five external evidence items and Phase 5's remaining human/provider checks as independent, unpassed dependencies where still unresolved.

### R7. Student-centered, privacy-first advisor/simulation guidance

- **Current state:** The advisor already consumes simulation and recommendation context, but its existing guidance is not area-aware and some simulation wording can imply that observed behaviour proves personal fit. It has no Phase 8 consented-data contract, retention rule, or deletion experience.
- **Target state:** When a student explicitly selects a Phase 8 area, advisor/simulation guidance presents source-linked options to compare, facts to verify, and an appropriate next step from the student's perspective. It may use only data knowingly and voluntarily provided for the disclosed advice purpose; each field explains why it is requested, is minimized, consented, protected, and covered by a retention/deletion policy. It never requires credentials or highly sensitive data, infers a characteristic, or presents an admission, eligibility, success, or potential conclusion.
- **Acceptance:** Contract and component/API tests prove an area-aware response names the selected area, offers a compare/verify/next-step action, preserves human-referral language for complex cases, and contains no admission/eligibility/potential assertion. Before any collection ships, tests and a human review prove field-level purpose explanation, explicit consent, optionality, minimum data handling, authenticated access controls, retention/deletion behavior, and no requested credentials or highly sensitive data.

## Boundaries

### In scope

- Named, source-linked discovery coverage for the seven requested areas.
- Equal geographic discovery treatment for all seven named areas.
- Student-centered, choice-preserving advisor/simulation guidance for an explicitly selected area, with only voluntarily provided, purpose-limited advice inputs after the privacy decision gate is resolved.
- Explicit area selection/direct navigation, data validation, accessibility, Preview rollout evidence, and final verification traceability.

### Out of scope

- Individual K–12 student, school, or attendance data for any area.
- Browser geolocation, home-address collection, or inferred location.
- Admissions/eligibility prediction, ranking claims, or location-driven negative recommendations.
- Any collection before the required privacy decisions, consent disclosure, security controls, and retention/deletion policy are locked and tested.
- Required credentials, highly sensitive data, behavioral/potential inference, or use of advice inputs for ranking, admission, eligibility, or marketing.
- Public community expansion or moderation-policy changes.
- Waiving Phase 1, Phase 5, or any later human/external verification gate.

## Edge Coverage

| Requirement | Edge | Resolution |
|---|---|---|
| R1 | Duplicate or missing area IDs; seven-name drift | covered — schema and exact-registry tests |
| R2 | An area is omitted or given a special workflow/source exception | covered — registry, data, and UI parity assertions |
| R3 | Stale, non-first-party, or missing source | covered — validation and Preview review |
| R4 | Direct URL has an unknown area ID | backstop — route/component error-state test |
| R5 | Empty area, long Unicode names, keyboard focus | covered — component and Preview human checks |
| R6 | Earlier deferred gate silently reported as green | covered — final-verification dependency check |
| R7 | An optional advice field silently becomes required, unexplained, over-retained, broadly reused, or a proxy for personal assessment | covered — consent/retention/deletion contract tests and human-review backstop |

## Prohibitions

| Must not | Requirement | Verification |
|---|---|---|
| Infer a student's location or collect an address/geolocation to select coverage. | R4 | test and review |
| Give any area a district-specific workflow, source exception, or individual school/student records. | R2 | test and review |
| Display unreviewed or non-first-party resources as verified official sources. | R3 | test and Preview review |
| Make an admissions, eligibility, or ranking claim from area selection. | R4 | domain/component test and review |
| Mark any inherited human or external gate as passed without its required retained evidence. | R6 | planning/final-verification review |
| Require credentials or highly sensitive data; collect/use advice data without a stated purpose and consent; retain/reuse it beyond that purpose; infer personal characteristics; or claim admission, eligibility, likelihood of success, or potential. | R7 | contract/API test and human review |

## Final Acceptance Criteria

- [ ] Seven exact requested coverage areas are represented by a governed registry and available through explicit selection/direct navigation.
- [ ] All seven areas, including Greater Hempstead, receive identical geographic discovery treatment with no area-specific workflow or source exception.
- [ ] All visible new-area records are source-validated and carry review metadata.
- [ ] No geolocation, address collection, individual school/student data, or location-derived admissions claim is introduced.
- [ ] Automated data, domain, UI, and deployment checks cover the seven-area flow; Preview review verifies keyboard, screen-reader, source-link, empty-state, and Unicode behavior.
- [ ] Advisor/simulation guidance for an explicitly selected area is student-centered, source-linked, choice-preserving, and uses only knowingly volunteered, purpose-limited data after consent, protection, and retention/deletion controls are verified; it makes no unsupported personal/admission/eligibility claims.
- [ ] Final verification retains—not waives—the outstanding Phase 1 and Phase 5 external/human gates.

## Required Privacy Decisions Before Implementation

The following choices are material and must be captured in Phase 8 discussion/context before any new advisor-data collection or persistence work begins:

1. **Permitted advice data categories:** which low-sensitivity, student-volunteered categories are useful (for example, stated goal, preferred programme type, schedule/format preference, budget range, or area choice) and which categories are excluded. Credentials, government identifiers, health/disability, immigration, protected attributes, precise address, and passive behavioural data are excluded unless a separate future privacy/governance phase changes the boundary.
2. **Purpose and consent interaction:** whether consent is per advice session, per saved profile field, or both; the exact field-level explanation and withdrawal behavior; and whether the default is in-session only.
3. **Retention and deletion:** whether inputs are ephemeral, retained for a bounded period, or saved until student deletion; the deletion/export experience; and the treatment of derived advisor output and audit data.
4. **Security and access:** authenticated-only versus an intentionally bounded guest mode; encryption/storage boundary, access/audit evidence, and provider-data handling. No secret, password, or credential may enter advice prompts.
5. **Advice limits and handoff:** exact student-facing caveats, source/recency treatment, and when the advisor must direct the student to a qualified human rather than advise.

Until these are decided and tested, Phase 8 may plan the seven-area registry and source-linked discovery surfaces but must not implement a new advisor-data collection, persistence, or reuse path.
