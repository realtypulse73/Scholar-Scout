---
phase: 08
name: Multi-Metro and Greater Hempstead Discovery Coverage
status: locked-with-planning-assumptions
created: 2026-08-29
ambiguity:
  goal_clarity: 0.88
  boundary_clarity: 0.78
  constraint_clarity: 0.76
  acceptance_clarity: 0.80
  score: 0.19
assumptions:
  - "Use the existing source-linked regional-directory model as the minimum viable discovery surface; detailed per-market catalogue breadth is planned from verified first-party sources."
  - "Greater Hempstead is geographic discovery coverage. The Hempstead Union Free School District is an official local resource, not a school, student, or account-data boundary."
---

# Phase 8: Multi-Metro and Greater Hempstead Discovery Coverage

## Goal

Give students a trustworthy, accessible way to browse source-verified postsecondary and transition resources for seven named coverage areas: Greater Chicago; Greater Kingston, Jamaica; Greater Memphis, Tennessee; New Orleans, Louisiana; Austin, Texas; Houston, Texas; and Greater Hempstead, New York.

## Requirements

### R1. Seven named discovery areas

- **Current state:** The application has one Western New York-specific directory and no canonical registry of named metro or district-area coverage.
- **Target state:** A governed regional registry represents all seven requested areas with stable IDs, student-facing names, country/state context, and a source-linked discovery entry point.
- **Acceptance:** A test asserts exactly these seven named entries can be selected and rendered: Greater Chicago; Greater Kingston, Jamaica; Greater Memphis, Tennessee; New Orleans, Louisiana; Austin, Texas; Houston, Texas; and Greater Hempstead, New York.

### R2. Greater Hempstead geographic boundary

- **Current state:** No Greater Hempstead discovery area exists. The official Hempstead Union Free School District exists externally as a local resource.
- **Target state:** Greater Hempstead is a geographic discovery area. Hempstead Union Free School District is represented only as a reviewed official local transition resource where relevant, not as the area definition or as a source of student records.
- **Acceptance:** Greater Hempstead renders its geographic label and a reviewed Hempstead Union Free School District resource when applicable; no data model or UI labels the district as the sole coverage boundary or exposes individual school/student data.

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

## Boundaries

### In scope

- Named, source-linked discovery coverage for the seven requested areas.
- Greater Hempstead geographic coverage, with Hempstead Union Free School District as a relevant official resource.
- Explicit area selection/direct navigation, data validation, accessibility, Preview rollout evidence, and final verification traceability.

### Out of scope

- Individual K–12 student, school, attendance, or district operational data.
- Browser geolocation, home-address collection, or inferred location.
- Admissions/eligibility prediction, ranking claims, or location-driven negative recommendations.
- Public community expansion or moderation-policy changes.
- Waiving Phase 1, Phase 5, or any later human/external verification gate.

## Edge Coverage

| Requirement | Edge | Resolution |
|---|---|---|
| R1 | Duplicate or missing area IDs; seven-name drift | covered — schema and exact-registry tests |
| R2 | District mistaken for geographic boundary | covered — dedicated data/UI assertion |
| R3 | Stale, non-first-party, or missing source | covered — validation and Preview review |
| R4 | Direct URL has an unknown area ID | backstop — route/component error-state test |
| R5 | Empty area, long Unicode names, keyboard focus | covered — component and Preview human checks |
| R6 | Earlier deferred gate silently reported as green | covered — final-verification dependency check |

## Prohibitions

| Must not | Requirement | Verification |
|---|---|---|
| Infer a student's location or collect an address/geolocation to select coverage. | R4 | test and review |
| Treat Hempstead Union Free School District as the entire Greater Hempstead boundary or ingest individual school/student records. | R2 | test and review |
| Display unreviewed or non-first-party resources as verified official sources. | R3 | test and Preview review |
| Make an admissions, eligibility, or ranking claim from area selection. | R4 | domain/component test and review |
| Mark any inherited human or external gate as passed without its required retained evidence. | R6 | planning/final-verification review |

## Final Acceptance Criteria

- [ ] Seven exact requested coverage areas are represented by a governed registry and available through explicit selection/direct navigation.
- [ ] Greater Hempstead is geographic coverage; Hempstead Union Free School District is a reviewed local resource rather than the product boundary.
- [ ] All visible new-area records are source-validated and carry review metadata.
- [ ] No geolocation, address collection, individual district/school/student data, or location-derived admissions claim is introduced.
- [ ] Automated data, domain, UI, and deployment checks cover the seven-area flow; Preview review verifies keyboard, screen-reader, source-link, empty-state, and Unicode behavior.
- [ ] Final verification retains—not waives—the outstanding Phase 1 and Phase 5 external/human gates.
