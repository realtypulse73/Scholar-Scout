# Roadmap: Scholar Scout

## Overview

Scholar Scout will move from a fragile Next.js monolith with whole-document persistence and an unvalidated feature cluster to a releasable student-pathway product. The phases intentionally follow the repository's current horizontal risk layers: establish a trustworthy release gate, secure identity and external boundaries, restore safe operations, make persistence conflict-safe incrementally, validate the separate school/community/WNY slice, and prove the complete discovery journey before release.

## Phases

**Phase Numbering:** Integer phases are planned milestone work; decimal phases are reserved for urgent insertions.

- [x] **Phase 1: Release and CI Baseline** - Make Scholar Scout's supported install and pull-request quality signal trustworthy. (completed 2026-08-13)
- [x] **Phase 2: Authentication, API, AI, and Webhook Controls** - Protect student data, privileged actions, and cost-bearing integrations at their server boundaries. (completed 2026-08-28)
- [x] **Phase 3: Administrative and Data Operations Correctness** - Restore authorized administrative recovery operations and fail safely when storage is unhealthy. (completed 2026-08-28)
- [x] **Phase 4: Incremental Durable Persistence Boundaries** - Prevent silent write loss while moving high-value records away from unbounded shared-document mutations. (completed 2026-08-29)
- [x] **Phase 5: School, Community, and WNY Release Slice** - Complete the in-progress student-facing experiences with privacy and moderation protections. (completed 2026-08-31)
- [ ] **Phase 6: End-to-End Hardening and Release Readiness** - Demonstrate the protected, durable product journeys in automated and production-like checks.

## Phase Details

### Phase 1: Release and CI Baseline

**Goal**: Maintainers can reproduce a clean Scholar Scout build and use pull-request checks as a reliable release signal.
**Depends on**: Nothing (first phase)
**Requirements**: OPS-01, OPS-05
**Success Criteria** (what must be TRUE):

  1. A maintainer can install dependencies with one documented immutable package-manager and lockfile path, and use it for local development, CI, and Vercel builds.
  2. Every pull request reports Scholar Scout build, typecheck, lint, and test results without an unrelated CrimClock job failing the pipeline.
  3. A maintainer can distinguish a failed Scholar Scout quality check from a clean, releasable pull request.

**Plans**: 6/6 plans executed

- [x] 01-01-PLAN.md
- [x] 01-02-PLAN.md
- [x] 01-03-PLAN.md
- [x] 01-04-PLAN.md
- [x] 01-05-PLAN.md
- [x] 01-06-PLAN.md — Close stale pnpm guidance and the Node runtime lifecycle-decision gaps

**Risk**: Package-manager cleanup can alter dependency resolution; preserve the npm 10 workspace contract and verify from a clean install before treating CI as a gate.

### Phase 2: Authentication, API, AI, and Webhook Controls

**Goal**: Students, staff, and integrations can use server APIs only within an authenticated, authorized, validated, and abuse-bounded scope.
**Depends on**: Phase 1
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04, SEC-05
**Success Criteria** (what must be TRUE):

  1. A signed-in student can access and change only their own account, shortlist, memory, simulation, referral, and engagement records, regardless of values supplied by the browser.
  2. A staff member can use administrative operations only while their active server-checked authorization remains valid; removed staff access is no longer accepted.
  3. A signed-in advisor user receives a bounded response, while oversized, malformed, or rate-exceeding advisor requests are safely rejected before they can create unbounded provider cost.
  4. An incoming GitHub webhook is rejected when its signature secret is missing or invalid, and a valid qualifying webhook can dispatch only an authenticated, size-bounded agent request.
  5. A user who repeatedly attempts login or registration receives a safe rate-limit response without tying up the server event loop for avoidable work.

**Plans**: 13/13 plans executed

Plans:
**Wave 1**

- [x] 02-01-PLAN.md — Approve the externally atomic counter dependencies
- [x] 02-09-PLAN.md — Harden and test the GitHub webhook runner

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02-PLAN.md — Add fail-closed atomic reservations and bounded request parsing

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 02-03-PLAN.md — Establish opaque guest actors and safe same-device migration

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 02-04-PLAN.md — Protect memory, simulations, and analytics ownership boundaries
- [x] 02-05-PLAN.md — Protect referral, engagement, share, and experiment ownership boundaries
- [x] 02-06-PLAN.md — Add revocable active-staff authorization and audit evidence
- [x] 02-08-PLAN.md — Harden the direct Responses advisor and evaluation fixtures
- [x] 02-12-PLAN.md — Route onboarding and shortlist through opaque guest/account actors

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 02-07-PLAN.md — Apply fresh staff checks to data-operation routes
- [x] 02-10-PLAN.md — Rate-bound credentials and trigger guest migration after sign-in
- [x] 02-13-PLAN.md — Disable public decision mutations and guard global decision dashboards

**Wave 6** *(blocked on Wave 5 completion)*

- [x] 02-11-PLAN.md — Rate-bound registration and wire the supported credential client flow

**Risk**: Existing public routes and JWT-carried roles currently assume caller data or stale authorization; introduce shared server guards with route-contract tests before changing client flows.

### Phase 3: Administrative and Data Operations Correctness

**Goal**: Authorized staff can perform only implemented, recoverable data operations and are never misled when persisted data cannot be read.
**Depends on**: Phase 2
**Requirements**: OPS-02, OPS-03, DATA-03
**Success Criteria** (what must be TRUE):

  1. An authorized administrator sees data-operation controls only for implemented server routes and receives explicit success, failure, and recovery states for each operation.
  2. A storage read failure is surfaced as a recoverable operational error and cannot silently appear as an empty Scholar Scout data set that a later save overwrites.
  3. An authorized administrator can validate backup, restore, and import inputs with retention limits and recoverable audit evidence before a data-changing operation occurs.

**Plans**: 6/6 plans executed

Plans:
**Wave 1**

- [x] 03-01-PLAN.md — Prove fail-closed storage reads through an authorized capability tracer and Wave 0 tests
- [x] 03-02-PLAN.md — Implement signed envelopes, bound restore plans, one-write apply, retention, and audit policy

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 03-03-PLAN.md — Wire authorized backup list, preview, and apply route contracts

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 03-04-PLAN.md — Wire bounded signed import validation/apply and signing readiness

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 03-05-PLAN.md — Deliver the capability-driven accessible recovery UI and visual backstops

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 03-06-PLAN.md — Close adapter semantics, coverage, prohibitions, and full validation evidence

**UI hint**: yes
**Risk**: `ProgrammeAdminManager` currently renders controls for missing endpoints and whole-snapshot restore is destructive; establish privileged route contracts and recovery semantics before reconnecting controls.

### Phase 4: Incremental Durable Persistence Boundaries

**Goal**: Student, programme, and operational changes remain durable under concurrent use without requiring every event to rewrite a shared unbounded document.
**Depends on**: Phase 3
**Requirements**: DATA-01, DATA-02
**Success Criteria** (what must be TRUE):

  1. When a user or staff member submits a stale change, the product preserves the current data and returns an explicit conflict or retry outcome instead of silently losing another person's write.
  2. Student, programme, and operational records can be read and changed through bounded domain operations rather than a full shared-document replacement for every event.
  3. A maintainer can migrate one high-risk persistence boundary at a time while existing supported data adapters and recovery workflows remain verifiably safe.

**Plans**: 5/5 plans executed

Plans:
**Wave 1**

- [x] 04-01-PLAN.md — Prove programme save/delete through provider-level CAS across JSON, HTTP, and Vercel Blob

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 04-02-PLAN.md — Migrate account, onboarding, shortlist, and plan writes to bounded student operations

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 04-03-PLAN.md — Migrate operational lifecycle, audit, and platform writes with explicit retry classification

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 04-04-PLAN.md — Bind Phase 3 recovery to conditional apply and close adapter compatibility boundaries

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 04-05-PLAN.md — Record DATA-01/DATA-02 coverage and run the complete Phase 4 validation gate

**Risk**: `data-store.ts` is the current system of record for several domains and adapters; use compatibility boundaries, transactional/versioned writes, and adapter-level integration tests rather than a wholesale datastore replacement.

### Phase 5: School, Community, and WNY Release Slice

**Goal**: Students can safely use the in-progress school, Western New York, peer, and campus-community experiences as a separately validated release slice.
**Depends on**: Phase 4
**Requirements**: PROD-01, PROD-02, PROD-03
**Success Criteria** (what must be TRUE):

  1. A student can explore the school and Western New York discovery experiences using validated programme data, accessible screens, and dependable decision logic.
  2. A student can participate in peer and campus-community experiences without unnecessary exposure of author identity or contact details.
  3. Community submissions are server-validated and rate-limited, publish an author-safe representation, and provide a usable report and authorized removal path for harmful or spam content.

**Plans**: 5/5 plans executed

**Execution waves**:

- **Wave 1**: 05-01
- **Wave 2**: 05-02, 05-05 (both depend on 05-01)
- **Wave 3**: 05-03 (depends on 05-02)
- **Wave 4**: 05-04 (depends on 05-01, 05-02, 05-03, and 05-05)

Plans:

- [x] 05-01-PLAN.md — Establish safe community persistence, public DTOs, reporting transitions, and the shared submission reservation boundary.
- [x] 05-02-PLAN.md — Add the fresh-staff-gated moderation queue and restore/remove actions.
- [x] 05-03-PLAN.md — Harden school and Western New York discovery data, decision logic, source links, and accessible empty states.
- [x] 05-04-PLAN.md — Deliver peer matching and community UI that consumes the protected APIs and locked interaction states.
- [x] 05-05-PLAN.md — Extend the protected community boundary to inbox writes and the shared sliding-window quota.

**UI hint**: yes
**Risk**: This is an uncommitted feature cluster with unaudited public routes; keep its validation/release path separate from stabilization work and cover contact obfuscation, spam, and decision-logic edge cases.

### Phase 6: End-to-End Hardening and Release Readiness

**Goal**: Maintainers can release a production-like Scholar Scout build knowing high-risk boundaries and core student discovery journeys have passed automated and end-to-end checks.
**Depends on**: Phase 5
**Requirements**: OPS-04, PROD-04
**Success Criteria** (what must be TRUE):

  1. High-risk API, webhook, and persistence behaviors have automated route or integration coverage, and a minimal end-to-end release check exercises the protected student journey.
  2. A student can still complete programme discovery, onboarding, shortlist, recommendation, and simulation journeys after the security, operations, persistence, and feature-slice changes.
  3. A maintainer can run the documented release checks against a production-like configuration and identify any failed journey or external-boundary safeguard before release.

**Plans**: 4/7 plans executed

- [x] 06-01-PLAN.md
- [x] 06-02-PLAN.md
- [x] 06-03-PLAN.md
- [x] 06-04-PLAN.md
- [ ] 06-05-PLAN.md
- [ ] 06-06-PLAN.md
- [ ] 06-07-PLAN.md

**Risk**: No browser E2E harness or coverage gate currently exists; start with the smallest production-like critical path and retain route/service tests as the primary regression boundary.

## Progress

**Execution Order:** Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Release and CI Baseline | 6/6 | Complete    | 2026-08-13 |
| 2. Authentication, API, AI, and Webhook Controls | 13/13 | Complete    | 2026-08-28 |
| 3. Administrative and Data Operations Correctness | 6/6 | Complete | 2026-08-28 |
| 4. Incremental Durable Persistence Boundaries | 5/5 | Complete | 2026-08-29 |
| 5. School, Community, and WNY Release Slice | 7/7 | Complete    | 2026-08-31 |
| 6. End-to-End Hardening and Release Readiness | 4/7 | In Progress|  |

### Phase 7: Governed Opportunity and Support Matching

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 6
**Plans:** 0 plans

Plans:

- [ ] TBD (run /gsd-plan-phase 7 to break down)

### Phase 8: Seven-Area Discovery Coverage

**Goal:** Extend governed discovery coverage to Greater Chicago; Greater Kingston, Jamaica; Greater Memphis, Tennessee; New Orleans, Louisiana; Austin, Texas; Houston, Texas; and the Greater Hempstead, New York area. Preserve source verification, privacy, accessible location behavior, student-centered advisor/simulation guidance, validation, deployment readiness, and final verification traceability.
**Requirements**: PROD-07
**Depends on:** Phase 7
**Plans:** 0 plans

**Success Criteria** (what must be TRUE):

  1. Students can select and browse a source-linked discovery experience for each of the seven named coverage areas without an inferred home location or an admissions recommendation claim.
  2. Every displayed institution, programme, and official regional-resource link has a reviewed first-party source; all seven areas use the same geographic discovery model without an area-specific workflow or source exception.
  3. Advisor/simulation guidance helps a student compare and verify options in their explicitly selected area using only purpose-limited, knowingly volunteered data with consent and deletion controls; it never requires highly sensitive data or credentials or asserts admission/eligibility. Location UI, data validation, automated tests, Preview deployment checks, and final human verification make the seven-area coverage observable and preserve the deferred Phase 1 GitHub/Vercel release-evidence gate.

Plans:

- [ ] TBD (run /gsd-spec-phase 8, then /gsd-discuss-phase 8 and /gsd-plan-phase 8 to break down)

## Backlog

### Phase 999.1: Direct school search and opening (BACKLOG)

**Goal:** Let a student directly find and open a school without manually navigating the feed.
**Requirements:** TBD
**Plans:** 0 plans

**Captured rationale:** During Phase 5 UAT, the current feed did not provide school search, so the tester could not efficiently locate Metro Technical Institute. Evaluate an accessible search entry point and result-to-school navigation in Phase 6-or-later planning; preserve current discovery, privacy, source-validation, and accessibility safeguards.

Plans:

- [ ] TBD (promote with $gsd-review-backlog when ready)
