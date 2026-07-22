# Roadmap: ScholarScout PRD Recovery

## Overview

ScholarScout recovers through usable vertical capabilities: protect the surviving product, route recommendations through one fair reproducible engine, establish trustworthy account-backed records, ground options in governed evidence, restore student and counselor journeys, prove changes in the Accuracy Lab, and admit a small pilot only after operational gates pass.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Safe Recovery Baseline** - Preserve behavior and make recovery increments verifiable and publishable.
- [ ] **Phase 2: Explainable ScholarFit Recommendations** - Give students one reproducible, opportunity-preserving recommendation.
- [ ] **Phase 3: Trusted Student Records** - Unify authenticated identity and durable authorized records.
- [ ] **Phase 4: Governed Pathway Evidence** - Compare diverse pathways using promoted, current authoritative evidence.
- [ ] **Phase 5: Student Decisions and Human Support** - Restore accessible decision tools, messaging, and counselor review.
- [ ] **Phase 6: Accuracy Lab and Model Governance** - Evaluate, approve, monitor, and roll back algorithm changes.
- [ ] **Phase 7: Controlled Pilot Launch** - Operate a consented 25–50-student pilot behind readiness gates.

## Phase Details

### Phase 1: Safe Recovery Baseline
**Goal**: Maintainers can change and ship the surviving product without losing behavior, leaking artifacts, or bypassing recovery verification.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: SAFE-01, SAFE-02, SAFE-03, SAFE-04, SAFE-05, SHIP-01, SHIP-02, SHIP-03
**Success Criteria** (what must be TRUE):
  1. Maintainers can run repeatable characterization, accessibility, and browser smoke checks across every surviving critical journey.
  2. Personal and staff requests reject spoofed identities, unauthorized access, and malformed mutations with safe stable errors.
  3. Recovery work cannot pass CI or publish unless required verification and secret/artifact scans pass.
  4. Each requirement is traceable through its phase, implementation, verification, commit, and release decision.
**Plans**: TBD
**UI hint**: yes

### Phase 2: Explainable ScholarFit Recommendations
**Goal**: Students receive one deterministic, explainable, uncertainty-aware ScholarFit ranking that preserves opportunity and remains reproducible.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: MATCH-01, MATCH-02, MATCH-03, MATCH-04, MATCH-05, MATCH-06, MATCH-07, MATCH-08, FAIR-01, FAIR-02, FAIR-03, FAIR-04, FAIR-05
**Success Criteria** (what must be TRUE):
  1. A student receives the same recommendation from every entry point when the versioned profile and evidence snapshot are unchanged.
  2. A student can inspect component scores, match band, confidence or insufficient-evidence state, evidence, caveats, and controllable next steps.
  3. Valuable ambitious options remain visible, and changing a protected trait alone cannot reduce rank, exposure, or support access.
  4. Authorized reviewers can run privacy-safe fairness tests while student results never expose audit attributes or diagnoses.
  5. Maintainers can reproduce a historical recommendation from its recorded engine, criteria, inputs, and data snapshot.
**Plans**: TBD
**UI hint**: yes

### Phase 3: Trusted Student Records
**Goal**: Students and authorized staff use one durable identity and consistent record across every consequential workflow.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, DATA-06, DATA-07
**Success Criteria** (what must be TRUE):
  1. A signed-in student's state remains consistent across workflows, sessions, and devices.
  2. An anonymous student can deliberately merge eligible progress into an account without duplication or silent replacement.
  3. Concurrent and retried actions preserve valid records, with append-only audit evidence for consequential access and changes.
  4. Students can inspect, correct, export, and request deletion of eligible data while consent, retention, and roles constrain collection and access.
**Plans**: TBD
**UI hint**: yes

### Phase 4: Governed Pathway Evidence
**Goal**: Students compare diverse pathways using reproducible, current, source-labeled evidence that passed validation and human promotion.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: PROG-01, PROG-02, PROG-03, PROG-04, PROG-05, PROG-06, SOURCE-01, SOURCE-02, SOURCE-03, SOURCE-04, SOURCE-05, SOURCE-06, SOURCE-07, SOURCE-08, SOURCE-09, SOURCE-10
**Success Criteria** (what must be TRUE):
  1. Students compare college, trade, certificate, apprenticeship, service, online, and international options with route-appropriate facts and coverage labels.
  2. Every material fact and behavioral signal exposes source, cohort or survey limits, freshness, uncertainty, and verification status.
  3. Maintainers ingest supported authoritative sources through quarantine, crosswalk, validation, conflict review, promotion, monitoring, and rollback.
  4. Stewards manage reported errors and immutable programme revisions without live third-party responses unexpectedly changing recommendations.
  5. Population patterns and optimized challengers affect rankings only after recorded fairness evidence and approval, never by penalizing individuals or optimizing solely for engagement.
**Plans**: TBD
**UI hint**: yes

### Phase 5: Student Decisions and Human Support
**Goal**: Students can refine preferences, compare and simulate options, and obtain transparent help from authorized counselors in accessible journeys.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: UX-01, UX-02, UX-03, UX-04, UX-05, UX-06, UX-07, MSG-01, MSG-02, MSG-03, MSG-04, MSG-05, MSG-06, MSG-07
**Success Criteria** (what must be TRUE):
  1. Students control onboarding preferences and reversible Game of Five rounds without inferred choices overriding stated goals.
  2. Students move through discovery, recommendations, comparison, simulations, and advisor views with consistent account state.
  3. Students and authorized counselors exchange retained, moderated, auditable messages with privacy-safe notifications.
  4. Counselors triage and annotate results while students can distinguish model results, named human guidance, and labeled AI assistance.
  5. Complete journeys meet WCAG 2.2 AA expectations at supported responsive sizes.
**Plans**: TBD
**UI hint**: yes

### Phase 6: Accuracy Lab and Model Governance
**Goal**: Reviewers can determine whether a proposed algorithm is safer and more useful, then approve, activate, monitor, or reverse it without rewriting history.
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: EVAL-01, EVAL-02, EVAL-03, EVAL-04, EVAL-05, EVAL-06, EVAL-07, EVAL-08, EVAL-09, EVAL-10
**Success Criteria** (what must be TRUE):
  1. Analysts evaluate immutable predictions against sourced outcomes using ranking, calibration, confidence, eligible slices, and privacy minimums.
  2. Reviewers distinguish outcome evidence types and compare draft versions against baselines, fixtures, regressions, cases, and thresholds.
  3. Reviewers red-team malformed and adversarial profiles, proxy leakage, gaming, poisoning, explanation leakage, suppression, and unequal routing.
  4. No criteria or model activates without typed validation, evidence, separation of duties, approval, monitoring, and rollback target.
  5. Staff can inspect complete audit history and immediately restore the prior active version.
**Plans**: TBD
**UI hint**: yes

### Phase 7: Controlled Pilot Launch
**Goal**: Operators can safely enroll, support, monitor, and learn from a consented 25–50-student pilot without unsupported claims.
**Mode:** mvp
**Depends on**: Phase 6
**Requirements**: PILOT-01, PILOT-02, PILOT-03, PILOT-04, PILOT-05, PILOT-06, PILOT-07
**Success Criteria** (what must be TRUE):
  1. Operators manage an eligible, consented roster across launch regions with counselor ownership, support, feedback, and follow-up windows.
  2. With permission, the pilot records recommendation exposure, decisions, actions, admissions, aid, enrollment, persistence, credentials, and completion with context.
  3. Operators observe cohort health, access failures, data quality, coverage, incidents, response, outcome completeness, and model exposure.
  4. Enrollment stays blocked until production, privacy, consent, accessibility, fairness, jurisdiction, backup, response, rollback, kill-switch, and stop-condition gates are approved.
  5. Reports present sample size, uncertainty, missingness, windows, and limitations without unsupported outcome claims.
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:** Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Safe Recovery Baseline | 0/TBD | Not started | - |
| 2. Explainable ScholarFit Recommendations | 0/TBD | Not started | - |
| 3. Trusted Student Records | 0/TBD | Not started | - |
| 4. Governed Pathway Evidence | 0/TBD | Not started | - |
| 5. Student Decisions and Human Support | 0/TBD | Not started | - |
| 6. Accuracy Lab and Model Governance | 0/TBD | Not started | - |
| 7. Controlled Pilot Launch | 0/TBD | Not started | - |
