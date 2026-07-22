# Requirements: ScholarScout PRD Recovery

**Defined:** 2026-07-21  
**Core Value:** Give each student an explainable, evidence-backed pathway ranking that balances access, affordability, persistence, completion, support, and actionable next steps without using protected traits to reduce opportunity.

## v1 Requirements

Requirements for the recovered prelaunch MVP and controlled pilot. Each requirement maps to exactly one roadmap phase.

### Safety Characterization

- [ ] **SAFE-01**: Maintainers can run characterization tests that preserve the current recommendation, feed, simulation, shortlist, authentication, programme-management, and administrative behaviors before refactoring.
- [ ] **SAFE-02**: Every personal or staff API derives authenticated identity and authorization server-side instead of trusting a client-provided user identifier.
- [ ] **SAFE-03**: Every mutation API validates bounded, typed request data and returns stable errors without exposing provider or implementation details.
- [ ] **SAFE-04**: Maintainers can verify that secrets, local data, dependency caches, build output, and logs are excluded from commits and release artifacts.
- [ ] **SAFE-05**: Maintainers can run automated accessibility checks and browser-level critical-journey smoke tests before accepting recovery changes.

### Match Intelligence

- [ ] **MATCH-01**: A student receives recommendations through one deterministic, canonical match-intelligence entry point rather than independent scoring paths.
- [ ] **MATCH-02**: Every recommendation records the algorithm version, criteria version, programme-data snapshot, material inputs, component scores, explanation codes, uncertainty, and calculation timestamp.
- [ ] **MATCH-03**: A student can see admission/access, completion, financial-stress, environment/support, climate-risk, psychological/isolation-risk, and overall ScholarFit outputs in plain language.
- [ ] **MATCH-04**: A student can see an overall confidence interval or band, missing-data indicators, evidence quality, and an “insufficient evidence” result when precision is not justified.
- [ ] **MATCH-05**: A student can see each option classified as likely, target, reach, or unlikely without valuable ambitious options being silently suppressed.
- [ ] **MATCH-06**: The engine supports versioned default, support-forward, and high-achievement weighting profiles, including the PRD baseline weights of 38% access, 47% completion support, 7% affordability, 5% career/programme fit, and 3% environment/support fit.
- [ ] **MATCH-07**: A student can inspect why an option ranked where it did, what evidence was used, what controllable changes could affect it, and which caveats apply.
- [ ] **MATCH-08**: Maintainers can reproduce prior recommendation results from their stored versioned inputs and evidence snapshot.

### Fairness Guardrails

- [ ] **FAIR-01**: Protected traits and prohibited proxies cannot lower rank, suppress opportunities, predict lower ability, or route a student away from selective or high-value pathways.
- [ ] **FAIR-02**: Authorized reviewers can use protected attributes only in access-controlled audit context for fairness evaluation, support/resource discovery, aggregate calibration, and transparent risk review.
- [ ] **FAIR-03**: Maintainers can run invariance, proxy, exposure, ranking, calibration, error, missingness, and resource-access tests across approved privacy-safe slices.
- [ ] **FAIR-04**: Every student can request human review, and confidence-based routing is tested for unequal access to counselor support.
- [ ] **FAIR-05**: Student-facing explanations never reveal protected audit attributes or present inferred mental-health, ability, or isolation diagnoses.

### Identity and Data

- [ ] **DATA-01**: Authenticated account state has one durable user identity across onboarding, recommendations, shortlist, feed, simulations, messages, outcomes, and analytics.
- [ ] **DATA-02**: An anonymous student can explicitly migrate eligible local progress into an authenticated account without silent overwrites or duplication.
- [ ] **DATA-03**: Pilot records use transactional, record-level persistence with concurrency control, idempotent mutations, indexes, and auditable migrations.
- [ ] **DATA-04**: A student can access, correct, export, and request deletion of eligible personal data under documented retention rules.
- [ ] **DATA-05**: Pilot operators can record age/eligibility, consent or assent status as applicable, participant status, and data-use permissions without beginning collection before required review.
- [ ] **DATA-06**: Staff roles enforce least-privilege access for counselors, programme stewards, reviewers, algorithm approvers, operators, and administrators.
- [ ] **DATA-07**: Consequential reads and mutations produce append-only audit evidence with actor, action, target, reason, timestamp, and correlation metadata.

### Programme Governance

- [ ] **PROG-01**: A student can compare colleges, community colleges, trades, certificates, apprenticeships, military and civil-service options, online programmes, and selected international pathways without forcing every route into college-only semantics.
- [ ] **PROG-02**: Programme records support tuition, access rate, pathway and institution type, delivery mode, geography, career outcomes, aid, support services, accreditation, housing, classifications, and source cross-references.
- [ ] **PROG-03**: Every material programme fact exposes its source, data year, retrieval date, coverage, freshness, and provisional or verified status.
- [ ] **PROG-04**: A programme steward can draft, validate, review, publish, supersede, archive, correct, compare, and roll back programme revisions with immutable history.
- [ ] **PROG-05**: A student can report a suspected data error and see that it entered a stewarded review workflow.
- [ ] **PROG-06**: Pilot operators can prioritize verified programme coverage for New York, Texas, Illinois, Washington, D.C., and Jamaica while labeling other regions exploratory.

### Authoritative Data Integration

- [ ] **SOURCE-01**: Maintainers can ingest governed snapshots from the U.S. Department of Education College Scorecard API/downloads and IPEDS, preserving each field's source release, cohort definition, retrieval time, revision status, and data dictionary version.
- [ ] **SOURCE-02**: Maintainers can ingest supported programme-outcome and labor-market evidence from authoritative sources such as Census Post-Secondary Employment Outcomes, BLS OEWS/Occupational Outlook Handbook, and Apprenticeship.gov without treating incomplete source coverage as evidence of poor quality.
- [ ] **SOURCE-03**: Maintainers can build privacy-safe, survey-weighted aggregate evidence from NCES NPSAS and BPS about non-traditional students' institution choices, stated reasons, enrollment patterns, work and family constraints, persistence, and attainment, including uncertainty and sample/coverage limitations.
- [ ] **SOURCE-04**: A canonical crosswalk resolves UNITID, OPEID, CIP, SOC, NAICS, apprenticeship, and internal programme identifiers with effective dates, confidence, ambiguity handling, and steward review instead of relying on names alone.
- [ ] **SOURCE-05**: Every source adapter lands data into quarantine, validates schema and semantic constraints, detects anomalous changes, reconciles conflicts, and requires an approved promotion before a snapshot can affect recommendations.
- [ ] **SOURCE-06**: Recommendation requests use reproducible internal snapshots rather than live third-party responses, and operators can monitor freshness SLAs, failed refreshes, coverage gaps, provisional-to-final revisions, and roll back a bad snapshot.
- [ ] **SOURCE-07**: When authoritative sources disagree, the system applies a documented field-level precedence rule, retains both values and provenance, exposes material uncertainty, and routes unresolved consequential conflicts to a programme steward.
- [ ] **SOURCE-08**: Population-level evidence about non-traditional students can influence programme coverage, support-service fit, explanation content, evaluation slices, and calibrated uncertainty, but cannot directly penalize an individual, infer a protected trait, suppress an option, or override explicit preferences.
- [ ] **SOURCE-09**: Algorithm optimization uses preregistered multi-objective metrics, temporal holdouts, survey weights where applicable, coverage-aware evaluation, and champion/challenger comparison; engagement, application volume, or historical popularity cannot serve as the sole objective.
- [ ] **SOURCE-10**: No new external field, derived behavioral feature, source snapshot, or optimized model version can affect the active ranking until its intended use, limitations, lineage, fairness tests, evaluation evidence, human approval, monitoring plan, and rollback target are recorded.

### Student Experiences

- [ ] **UX-01**: A student can complete accessible onboarding and explicitly inspect, correct, weight, skip, or reset preferences used by matching.
- [ ] **UX-02**: A student can use Game of Five rounds with five diverse options plus none, not-sure, skip, undo, and why-asked controls to reveal preferences without ability labeling.
- [ ] **UX-03**: Game of Five stores raw choices, derivation version, and reversible preference updates without silently overriding explicit goals.
- [ ] **UX-04**: A student can browse the feed, programme pages, recommendations, shortlist, simulations, and advisor while seeing consistent account-backed state.
- [ ] **UX-05**: A student can compare shortlisted options side by side using shared decision dimensions and route-specific evidence.
- [ ] **UX-06**: A student can explore clearly labeled counterfactual scenarios that change controllable assumptions while preserving the baseline result.
- [ ] **UX-07**: Complete student and staff journeys meet WCAG 2.2 AA expectations for keyboard use, focus, errors, screen readers, contrast, zoom, motion, touch targets, and responsive layouts.

### Messaging and Review

- [ ] **MSG-01**: An authenticated student can exchange durable threaded messages only with authorized counselors or support participants.
- [ ] **MSG-02**: A conversation records participants, sender, timestamps, delivery/read state, retention state, moderation events, and audit metadata.
- [ ] **MSG-03**: Students and counselors receive configurable in-app or approved delivery notifications without exposing message content improperly.
- [ ] **MSG-04**: A counselor can triage a review queue using reason codes, confidence, priority, evidence, student request, and assignment state.
- [ ] **MSG-05**: A counselor can annotate a recommendation and suggest additional options without silently replacing the underlying model result.
- [ ] **MSG-06**: A student can see who reviewed a recommendation, what human guidance was added, and whether any AI-generated draft assistance was used.
- [ ] **MSG-07**: Staff can report, moderate, escalate, and resolve unsafe or inappropriate messaging under documented pilot procedures.

### Accuracy Lab and Governance

- [ ] **EVAL-01**: The system stores immutable prediction snapshots and outcome observations with source type, verification status, observation window, and algorithm/data versions.
- [ ] **EVAL-02**: Authorized analysts can calculate Top 1, Top 3, Top 5, mean reciprocal rank, calibration buckets, and bootstrap confidence intervals for eligible datasets.
- [ ] **EVAL-03**: Authorized analysts can compare results by declared cohort, pathway type, geography, data coverage, profile completeness, decision regime, and time horizon with privacy minimums.
- [ ] **EVAL-04**: Accuracy Lab distinguishes synthetic, self-reported, counselor-reported, institution/imported, and verified clearinghouse-style outcomes.
- [ ] **EVAL-05**: Authorized reviewers can compare draft and active algorithm versions against baselines, golden fixtures, slice regressions, qualitative cases, and declared acceptance thresholds.
- [ ] **EVAL-06**: Scoring calibration presents human-reviewed suggestions as drafts and never changes active criteria automatically.
- [ ] **EVAL-07**: Scoring audit exposes version history, criteria diffs, evaluation evidence, approvals, activation events, monitoring, and rollback events.
- [ ] **EVAL-08**: Red-team tools test sparse and malformed profiles, extreme values, proxy leakage, gaming, data poisoning, explanation leakage, opportunity suppression, and unequal counselor routing.
- [ ] **EVAL-09**: Criteria management validates typed constraints, rationale, effective dates, ownership, separation of duties, dual approval, activation, and rollback.
- [ ] **EVAL-10**: Only an approved version with required evaluation evidence can be activated, and operators can immediately roll back to the prior active version.

### Outcomes and Pilot Launch

- [ ] **PILOT-01**: With appropriate consent, the system captures recommendation impressions, shortlist decisions, actions, applications, admissions, aid offers, enrollment, transfer, persistence, credential, and completion observations.
- [ ] **PILOT-02**: Operators can manage a 25–50-student pilot roster, eligibility, consent, onboarding, counselor ownership, support status, feedback, and follow-up windows across the launch regions.
- [ ] **PILOT-03**: Operators can monitor cohort health, authentication and authorization failures, data quality, recommendation coverage, incidents, message response, outcome completeness, and algorithm-version exposure.
- [ ] **PILOT-04**: The pilot has documented go/no-go gates, incident response, participant support, rollback, kill switch, backup/restore, and stop conditions.
- [ ] **PILOT-05**: Production configuration verifies durable storage, authentication providers, email/notification delivery, observability, rate limits, backups, environment separation, and secret management before pilot enrollment.
- [ ] **PILOT-06**: Privacy, consent, retention, accessibility, civil-rights/fairness, messaging, and jurisdiction-specific launch questions receive documented owner review before real student data is accepted.
- [ ] **PILOT-07**: Pilot reports avoid unsupported accuracy or outcome claims and present sample size, uncertainty, missingness, observation windows, and known limitations.

### Delivery Protection

- [ ] **SHIP-01**: Every completed recovery increment passes its defined tests, review, secret scan, and verification before being committed and pushed to `recovery/prd-rebuild`.
- [ ] **SHIP-02**: Continuous integration runs type checking, linting, unit/integration tests, production build, and required recovery safety checks on pull requests.
- [ ] **SHIP-03**: Maintainers can trace every v1 requirement to one roadmap phase, implementation evidence, verification result, commit, and release decision.

## v2 Requirements

Deferred until the controlled pilot foundations and evidence exist.

### Broader Scale and Coverage

- **V2-01**: Expand verified production programme coverage beyond the launch regions using jurisdiction-appropriate authoritative sources and steward capacity.
- **V2-02**: Scale event processing, analytics, and notifications through asynchronous queues and derived aggregates after pilot traffic establishes real capacity needs.
- **V2-03**: Complete any Auth.js/framework modernization only after recovery behavior is protected by integration and browser tests.
- **V2-04**: Add broader institution/recruiter workflows only after student privacy, counselor operations, and data-governance boundaries are validated.
- **V2-05**: Consider native mobile applications only after responsive web pilot journeys and accessibility are validated.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Guaranteed admission, affordability, completion, or career outcomes | Available evidence cannot support guarantees; ScholarScout must communicate uncertainty and limitations. |
| Protected traits or close proxies that reduce ranking or opportunity | Conflicts with the product’s explicit guardrail and creates discriminatory steering risk. |
| Automatic algorithm activation | High-impact changes require evaluation, human approval, audit history, staged monitoring, and rollback. |
| Public student-to-student social messaging | Adds moderation, grooming, bullying, and privacy risk unrelated to controlled-pilot value. |
| AI impersonation of a counselor | Students require transparent, accountable human support; AI assistance must be labeled. |
| Engagement-maximizing gamification | Manipulative streaks, scarcity, and variable rewards are inappropriate for young users and consequential decisions. |
| Inferred mental-health or ability diagnoses | Unsupported and potentially harmful; collect optional support preferences directly and use cautious language. |
| Scraping as the primary programme truth source | Fragile, hard to audit, and may violate source terms; use authoritative or stewarded sources with provenance. |
| Broad public launch on JSON/Blob aggregate storage | Current concurrency, authorization, and durability limits are incompatible with public launch risk. |
| Accuracy claims based only on synthetic or tiny samples | Such claims would be misleading; label synthetic data and suppress or qualify insufficient samples. |

## Definition of Done

- Every v1 requirement is implemented, tested, independently verified, committed, and traceable to a roadmap phase.
- All PRD student and staff surfaces are present and pass browser-level critical journeys at supported responsive sizes.
- The canonical match engine reproduces versioned results, passes guardrail and fairness checks, and exposes evidence and uncertainty.
- Authoritative education, outcome, labor-market, and non-traditional-student evidence flows through versioned source adapters, crosswalks, validation, human promotion, freshness monitoring, and rollback.
- Accuracy Lab evaluates immutable snapshots and outcomes, and activation requires recorded human approval with rollback.
- Security, privacy, accessibility, persistence, monitoring, and pilot operations pass documented go/no-go gates.
- The recovery branch is current on GitHub with no secrets, generated caches, local data, or unverified work committed.

## Traceability

Populated during roadmap creation. Each v1 requirement will map to exactly one phase.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SAFE-01…SHIP-03 | Pending roadmap mapping | Pending |

**Coverage:**
- v1 requirements: 75 total
- Mapped to phases: 0
- Unmapped: 75

---
*Requirements defined: 2026-07-21*  
*Last updated: 2026-07-21 after PRD recovery research*
