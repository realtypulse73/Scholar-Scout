# Domain Pitfalls: ScholarScout PRD Recovery

**Domain:** Explainable postsecondary pathway matching for students, including minors  
**Researched:** 2026-07-21  
**Overall confidence:** HIGH for engineering, U.S. privacy/civil-rights, accessibility, and data-quality risks; MEDIUM for jurisdiction-specific obligations pending counsel and deployment facts

## Executive Warning

ScholarScout can fail while appearing technically successful. A polished ranking may still suppress opportunity, present stale or non-comparable programme facts as truth, overstate confidence from a tiny and selectively observed pilot, leak minors' data, or promote an unreviewed model. Launch readiness therefore requires evidence and operational controls, not merely completed screens. The pilot must be treated as supervised validation of a decision-support tool—not proof that ScholarFit predicts individual admission, affordability, persistence, or completion.

## Critical Pitfalls

### 1. Reconstructing the Lost Algorithm by Guesswork

**What goes wrong:** Developers translate PRD labels into plausible weights and thresholds, then call the result the recovered algorithm. Multiple surviving scoring paths continue to disagree, or UI explanations describe a different computation from the one that ranked programmes.  
**Why it happens:** The original implementation is gone; the current code has fragmented hard-coded weights; visual parity creates pressure to infer missing semantics.  
**Consequences:** Results cannot be reproduced or audited, PRD fidelity is falsely claimed, and later outcome comparisons mix incompatible definitions.  
**Prevention:** Treat the PRD as a requirements contract, not recovered numeric ground truth. Name the first rebuilt model as a new, explicit version. Define canonical inputs, missingness rules, normalization, weights, caps, tie-breakers, confidence, explanations, and output bands in one pure package. Record config digest, code commit, criteria/data versions, and prediction snapshot. Route all product scoring through it.  
**Detection:** The same profile/programme pair differs across routes; explanations cannot be recomputed; a historical prediction changes after a catalog edit; no one can state which model produced a result.  
**Confidence:** HIGH—directly evidenced by the codebase map and aligned with NIST's emphasis on validity, transparency, explainability, and lifecycle evaluation.

### 2. Protected Traits Removed by Name but Reintroduced Through Proxies

**What goes wrong:** Race, sex, disability, nationality, age, or similar fields are excluded from the scorer, but ZIP code, school, language, income, immigration-related data, climate preferences, or behavioral engagement function as proxies that lower rank or narrow the opportunity set. Support matching quietly becomes exclusion.  
**Why it happens:** A simplistic “fairness through unawareness” rule checks field names rather than causal use and downstream effects. Historical admissions or completion data already reflect unequal access and institutional conditions.  
**Consequences:** Students receive systematically restricted options; institutional partners may face civil-rights risk; a seemingly neutral system can scale discrimination. The U.S. Department of Education warns that AI recommendations in education can create or contribute to discrimination at scale.  
**Prevention:** Maintain a feature-purpose registry. Separate rankable, support-only, display-only, and audit-only fields at type, storage, and authorization boundaries. Require a threat model for every new feature and derived variable. Test protected-trait non-interference for the scorer and test outcome/ranking distributions across sufficiently supported slices. Review proxy relationships and opportunity-set composition, not only average score parity. Provide an accessible appeal/correction and human review path.  
**Detection:** Changing an audit-only trait changes rank; a new “engagement” signal disproportionately lowers a group; opportunity coverage shrinks for a cohort; explanations cite location or support need as a penalty.  
**Confidence:** HIGH for the risk and controls; legal applicability depends on ScholarScout's contracts and users.

### 3. Treating Observational Outcomes as Student Ability or Causal Proof

**What goes wrong:** Admission, enrollment, retention, completion, debt, or action outcomes are used as labels without distinguishing opportunity, choice, eligibility, institutional support, economic shocks, and missing follow-up. A non-application is treated as rejection; no recorded outcome is treated as failure.  
**Why it happens:** Outcomes are sparse and easy to count, while causal context is expensive. Historical data encode selection: users see, apply to, and report only some pathways.  
**Consequences:** The algorithm reinforces earlier recommendations, disadvantages groups with lower reporting or access, and makes invalid claims about individual likelihood. Calibration may look good because labels mirror the system's own routing.  
**Prevention:** Define an outcome taxonomy with event time, source, verification status, eligibility/exposure, and censoring. Keep “unknown,” “not shown,” “shown,” “considered,” “applied,” “admitted,” “enrolled,” and later outcomes distinct. Never infer ability. Analyze selection and missingness; report metrics with denominators and uncertainty. Use outcome data to evaluate hypotheses, not to silently retrain or auto-adjust weights.  
**Detection:** Unknown outcomes are encoded as zero; evaluation contains only recommended programmes; follow-up rates differ sharply by cohort; model performance improves when the product narrows choices.  
**Confidence:** HIGH as measurement methodology; exact statistical remedies require phase-specific review and larger data.

### 4. False Precision and Invalid Confidence from a 25–50 Student Pilot

**What goes wrong:** ScholarFit displays precise percentages, narrow confidence intervals, subgroup comparisons, or “accuracy” claims unsupported by sample size, label completeness, or study design. Bootstrap intervals are computed over non-independent or selected observations and interpreted as individual certainty.  
**Why it happens:** Dashboards reward single numbers; implementing bootstrap code is easier than validating its assumptions. Many programmes per student can be mistaken for many independent students.  
**Consequences:** Students over-trust rankings; product decisions chase noise; small cohorts can be re-identified; model promotion is based on unstable metrics.  
**Prevention:** Pre-register pilot questions, metric definitions, analysis units, minimum denominators, suppression rules, and promotion thresholds. Report ranges and missing-data flags in plain language. Cluster or resample at the student level where appropriate. Suppress small slices and never claim subgroup fairness from tiny counts. Label confidence as evidence quality/uncertainty, not guaranteed probability, until calibration data support probabilistic interpretation.  
**Detection:** More “observations” than independent students drive intervals; cohort metrics show one or two students; tiny data changes reverse promotion decisions; percentage labels imply real-world probability without calibration evidence.  
**Confidence:** HIGH for the pitfall; exact thresholds need a statistician and pilot protocol.

### 5. Programme Data That Is Accurate-Looking but Stale, Incomparable, or Misapplied

**What goes wrong:** Tuition, net price, completion, admission, modality, location, accreditation, apprenticeship availability, support, climate, or deadline data are presented as current facts without source date, population definition, or provenance. Metrics across pathway types are normalized as if equivalent.  
**Why it happens:** Public data have release lags, revisions, imputations, differing cohorts, and limited coverage. IPEDS distinguishes collection year from data year and releases provisional then revised/final data. Institutions may change programmes faster than federal datasets.  
**Consequences:** Affordability or access rankings mislead students; dead programmes remain recommended; community colleges, certificates, apprenticeships, online programmes, and international options are compared using incompatible fields.  
**Prevention:** Store source URL/provider, retrieval time, data year, release status, population/denominator, geographic/currency assumptions, transformation, reviewer, effective period, and expiry. Define comparability classes and “not available/not comparable” states rather than imputing convenient values. Add freshness SLAs and stale-data warnings. Require human verification for pilot-visible programmes and direct links to authoritative application/cost pages.  
**Detection:** A value has no data year; provisional and final records overwrite silently; tuition lacks residency basis; an apprenticeship listing cannot be opened; a ranking depends on imputed values hidden from explanation.  
**Confidence:** HIGH—supported by NCES documentation on IPEDS coverage, quality controls, imputation, revisions, and release lag.

### 6. Model Promotion as an Editable Flag Rather Than a Controlled State Transition

**What goes wrong:** An administrator edits weights or toggles “active,” immediately changing live recommendations. Evaluation results are recomputed after promotion, approval is self-approved, or rollback does not restore the exact previous model/data contract.  
**Why it happens:** CRUD screens are mistaken for governance; draft configuration shares mutable rows with live configuration.  
**Consequences:** Unreviewed behavior reaches students; historical evidence is overwritten; incidents cannot be reconstructed; rollback is partial.  
**Prevention:** Use immutable versions and explicit draft → evaluated → approved → active → retired states. Activation must transactionally reference a frozen evaluation artifact, independent reviewer decision, effective time, previous active version, and rollback target. Enforce separation of duties operationally for the pilot. Re-score shadow traffic before activation; activate one version at a time; rehearse rollback.  
**Detection:** A database update can alter an active config; the evaluator can approve their own change; two versions are active; promotion lacks a commit/config/dataset digest; rollback produces new rather than identical results.  
**Confidence:** HIGH—consistent with NIST AI RMF lifecycle governance and directly required by the PRD.

### 7. Backtesting the Wrong Artifact or Leaking Future Information

**What goes wrong:** Evaluation imports a scorer that differs from production, uses today's programme facts to judge historical predictions, includes outcomes or post-recommendation behavior as features, tunes thresholds on the test set, or changes metric definitions between versions.  
**Why it happens:** Mutable catalog tables and ad hoc notebooks obscure “as-of” time; development and evaluation are not separated.  
**Consequences:** Accuracy is overstated; a promoted model fails in real use; version comparisons are not reproducible.  
**Prevention:** Evaluate the exact canonical scorer and frozen model/config snapshot. Build time-aware fixtures with as-of programme data. Partition development/calibration/evaluation sets at the student level and keep the final set sealed. Version metric and slice definitions. Store seed, code commit, dataset digest, parameters, and raw aggregate outputs. Require golden hand-calculated metric fixtures.  
**Detection:** Re-running an old evaluation changes results; production fingerprints differ from the backtest; outcome timestamps precede input cutoff incorrectly; test-set metrics improve after repeated tuning.  
**Confidence:** HIGH.

### 8. Collecting Minors' Data Before Age, Consent, Retention, and Deletion Are Designed

**What goes wrong:** The app asks grade, birth date, school, location, disability/support needs, finances, messages, or behavioral data and begins analytics before determining age flow and lawful authority. Consent is a checkbox without version, scope, guardian evidence, or withdrawal. Deletion leaves backups, analytics, model datasets, or provider copies.  
**Why it happens:** Data collection is implemented as product telemetry instead of a governed lifecycle. A high-school audience is incorrectly assumed to mean all users are 13+. Asking age-identifying questions can create actual knowledge under COPPA.  
**Consequences:** Unlawful or unfair processing, inability to honor rights, breach harm, pilot suspension, and loss of trust. FERPA obligations may also attach through school relationships or records, but applicability cannot be assumed without contract/context analysis.  
**Prevention:** Before pilot, complete counsel-reviewed data inventory and jurisdiction matrix. Implement age gating before personal-data collection; define under-13 handling rather than improvising it. Record consent/assent authority, policy version, purpose, time, and withdrawal. Minimize collection, separate identifiers from evaluation data, enforce purpose/role access, publish retention schedules, and test export/deletion through primary, derived, backup, telemetry, and vendor systems. Execute school/vendor agreements where required.  
**Detection:** No one can answer where a student's data exists; grade is collected before age handling; deleted users remain in backtests; vendor prompts/logs retain profile data; consent history has no policy version.  
**Confidence:** HIGH for COPPA/data-lifecycle risk; MEDIUM for which privacy and education laws apply until legal review of operating model, age range, locations, and institutional contracts.

### 9. Spoofable Identity and Cross-User Data Access

**What goes wrong:** APIs trust client-supplied `userKey`; OAuth provider subject is confused with the durable account ID; local anonymous data is merged into the wrong account; staff status is inferred inconsistently; database row security is assumed to protect privileged service connections.  
**Why it happens:** Identity is treated as a UI state and duplicated across cookies, JWTs, localStorage, and payloads.  
**Consequences:** Students can read or alter another student's profile, messages, shortlist, or predictions; staff privileges leak; audit trails attribute actions incorrectly.  
**Prevention:** Establish one immutable internal subject ID and mapped provider identities. Derive subject/role server-side for every request. Make anonymous claim a signed, expiring, one-time transactional operation with collision/conflict handling. Centralize `requireUser`/`requireStaff` guards, authorize each object, test horizontal and vertical access, protect staff with phishing-resistant MFA where feasible, and review privileged database roles. NIST SP 800-63-4 should inform authentication assurance choices.  
**Detection:** Changing a request field retrieves another user's records; two accounts share anonymous state; audit events use email as identity; staff access works after role removal; RLS tests run only as a table owner.  
**Confidence:** HIGH.

### 10. Messaging Without a Safety and Operational Model

**What goes wrong:** “Messages” is implemented as unrestricted student-to-staff or student-to-student text with no delivery semantics, retention policy, block/report capability, staffing hours, moderation, escalation, abuse handling, or boundary between AI and human advice. Notifications expose sensitive content.  
**Why it happens:** A chat UI is mistaken for a messaging service. Pilot staffing and legal/safeguarding responsibilities are deferred until after launch.  
**Consequences:** Harassment, grooming, impersonation, unmanaged crisis disclosures, missed urgent messages, privacy incidents, and misleading expectations of counselor availability. Schools have duties relating to discriminatory harassment in their programmes; platform/partner obligations depend on deployment context and require review.  
**Prevention:** Limit pilot messaging to authenticated student ↔ authorized support staff unless a separate safety review approves more. Define purpose, office hours, response SLA, emergency disclaimer, escalation/runbook, staff training, supervision, audit access, retention, deletion exceptions, notification redaction, block/report, and attachment policy. Keep AI advisor interactions visually and technically distinct; never imply human monitoring if none exists. Threat-model legally reportable content and obtain counsel/safeguarding guidance before operation.  
**Detection:** A student cannot tell whether they are talking to AI or staff; no one owns the inbox; urgent content has no escalation; message previews appear on lock screens/email; staff can search all conversations without reason logging.  
**Confidence:** HIGH for product/safety controls; MEDIUM for jurisdiction-specific reporting duties pending counsel.

### 11. Launching the Pilot as an Unsupervised Production Release

**What goes wrong:** “25–50 users” is treated as low risk and the public registration link spreads. No enrollment roster, support owner, incident channel, rollback authority, outage plan, or daily review exists. Pilot users rely on recommendations for real deadlines.  
**Why it happens:** Small scale is confused with low consequence. Prelaunch scripts verify uptime but not operator readiness.  
**Consequences:** Harmful results or data incidents persist unnoticed; programme deadlines are missed; evidence is unusable because protocol and consent changed mid-pilot.  
**Prevention:** Use invite-only enrollment, cohort caps, named pilot lead, counsel/privacy approval, support coverage, verified catalogue subset, frozen analysis plan, daily safety/quality review, severity levels, stop criteria, rollback authority, backup restore drill, breach/incident contacts, and participant feedback/escalation. Display uncertainty and source freshness. Gate expansion on predefined evidence, not enthusiasm.  
**Detection:** Anyone can register; alert routing is untested; no one can stop the model; the pilot changes weights midstream without cohort/version records; support requests have no owner.  
**Confidence:** HIGH.

## Moderate Pitfalls

### 12. Mixing Support Signals with Rank Penalties

**What goes wrong:** A need for tutoring, counseling, accessibility, childcare, transport, or financial aid lowers “fit” because support availability is incomplete or the need is treated as risk.  
**Prevention:** Score institutional support evidence positively and separately. Never penalize the student for needing support. Explain missing institutional data and offer broader options. Test counterfactual profiles where only a support need changes.  
**Confidence:** HIGH.

### 13. One Score Hides Tradeoffs and Value Judgments

**What goes wrong:** ScholarFit collapses cost, access, completion, climate, environment, and isolation into a number whose weights appear objective. Students cannot see why a pathway ranks lower or change legitimate preferences.  
**Prevention:** Show component scores, evidence quality, important missing data, material reasons, and tradeoffs. Separate eligibility/access from preference fit. Permit bounded user preference changes without allowing protected-trait penalties. Validate explanations against actual contributions.  
**Confidence:** HIGH.

### 14. Climate and Psychological-Risk Labels Become Unsupported Diagnoses

**What goes wrong:** Climate or isolation risk is inferred from crude geography or profile answers and presented as a clinical/personal fact.  
**Prevention:** Use descriptive, source-backed environmental indicators and user-stated preferences. Avoid diagnostic language. Show source, geography, time period, uncertainty, and an opt-out. Route support resources without asserting mental-health status.  
**Confidence:** HIGH for harm risk; metric design requires domain experts.

### 15. Game of Five Optimizes Engagement Instead of Preference Quality

**What goes wrong:** Forced choices are treated as stable preferences, accessibility suffers under time pressure/drag gestures, or gameplay behavior silently changes rank.  
**Prevention:** Make it optional, untimed, keyboard/screen-reader operable, revisable, and transparent about how answers are used. Record provenance and confidence of inferred preferences; require confirmation before durable ranking impact. Do not treat speed, abandonment, or interaction style as ability or motivation.  
**Confidence:** HIGH.

### 16. Aggregate Fairness Metrics Leak Small-Cohort Identities

**What goes wrong:** Accuracy Lab shows slices so small that staff can infer individual outcomes or sensitive traits. Exported evaluation artifacts contain row-level protected data.  
**Prevention:** Separate audit access, minimum-cell suppression, query controls, purpose logging, aggregate-only exports, and disclosure review. Use synthetic fixtures in demos. Small pilot slices are diagnostic prompts, not publishable claims.  
**Confidence:** HIGH.

### 17. Audit Logs Are Mutable, Overbroad, or Contain Secrets

**What goes wrong:** Logs can be edited by ordinary admins, omit failed actions, or store full profiles/messages/tokens. “Immutable” is claimed without operational controls.  
**Prevention:** Append-only application events with actor, subject, action, target version, correlation ID, result, time, and reason; restrict access and separately protect database/platform logs. Redact payloads. Test clock/timezone handling and retention. Do not claim cryptographic immutability unless actually implemented and verified.  
**Confidence:** HIGH.

### 18. Migration Preserves Corruption or Loses Provenance

**What goes wrong:** JSON records are bulk-copied into PostgreSQL without validating identities, duplicates, timestamps, or source versions. Legacy and new stores both remain writable.  
**Prevention:** Inventory, validate, normalize, and quarantine invalid records. Generate reconciliation counts/digests. Use dry runs and restore rehearsal. Establish one cutover point and make legacy adapters read-only, then remove writes. Preserve original source snapshots under restricted retention.  
**Confidence:** HIGH.

### 19. Accessibility Is Reduced to an Automated Scan

**What goes wrong:** Axe passes while focus is lost on route changes, charts lack equivalent tables, ranking changes are not announced, mobile zoom breaks, or cognitive load makes explanations unusable.  
**Prevention:** Target WCAG 2.2 AA; combine automated scans with keyboard, screen-reader, zoom/reflow, reduced-motion, contrast, language, and inclusive-user review. Test critical workflows in Chromium, Firefox, and WebKit. W3C states conformance requires both machine and human evaluation, and automated tooling catches only part of the problem.  
**Confidence:** HIGH.

### 20. Sensitive Data Leaks Through Telemetry, AI Prompts, and Preview Environments

**What goes wrong:** Full profiles, protected traits, messages, recommendation explanations, or tokens are logged, traced, sent to the advisor provider, copied into analytics, or seeded into shared previews.  
**Prevention:** Data-flow map and field-level allowlists for logs/prompts. Redaction tests, synthetic preview data, restricted observability access, vendor retention/config review, secrets scanning, and no raw payloads in error reports. FTC guidance emphasizes collecting only what is needed, least privilege, lifecycle security, retention, and secure disposal.  
**Confidence:** HIGH.

### 21. Silent Failure and Retry Duplicate Effects

**What goes wrong:** A timed-out request is retried and duplicates messages, outcomes, audit events, or promotions; a primary write succeeds while notification/analytics fails.  
**Prevention:** Idempotency keys, unique constraints, transactional outbox, explicit delivery states, retry budgets, dead-letter/reconciliation workflow, and concurrency tests against real PostgreSQL.  
**Confidence:** HIGH.

### 22. Framework/Auth Upgrade Obscures Recovery Regressions

**What goes wrong:** Next.js 16, React, Auth.js, database, and algorithm changes ship together; failures cannot be attributed or rolled back independently.  
**Prevention:** Follow the stack sequencing: protect critical journeys and scoring contracts, then perform framework/auth major upgrades in isolated verified increments.  
**Confidence:** HIGH.

## Minor Pitfalls

### 23. Terminology Drifts Across UI, Code, and Metrics

“Match,” “fit,” “probability,” “confidence,” “risk,” “success,” and “accuracy” acquire conflicting meanings. Maintain a governed glossary and metric registry; test user-facing labels against definitions. **Confidence: HIGH.**

### 24. Time, Currency, Residency, and Locale Are Implicit

Deadlines, tuition, climate, and international comparisons lack timezone, academic year, currency, exchange-date, residency basis, or locale. Store explicit temporal/geographic context and do not normalize unlike values invisibly. **Confidence: HIGH.**

### 25. Tie-Breakers Change Rankings Accidentally

Database order, floating-point details, or locale collation alter equal scores. Specify rounding only for display, use stable deterministic tie-breakers, and preserve full-precision components in snapshots. **Confidence: HIGH.**

### 26. Demo and Production Data Become Indistinguishable

Synthetic programmes/outcomes appear in pilot dashboards or metrics. Tag environment and provenance, prevent production imports by default, and watermark demo exports. **Confidence: HIGH.**

### 27. “Explainable” Means Verbose Rather Than Understandable

The UI dumps weights and formulas but does not answer why a recommendation matters or what to do next. Test explanations with students/counselors; layer plain-language reasons, evidence/uncertainty, tradeoffs, and technical detail. **Confidence: HIGH.**

## Phase-Specific Warnings and Gates

| Phase topic | Likely pitfall | Required mitigation / exit gate | Confidence |
|---|---|---|---|
| Canonical match contract | Inventing lost numeric behavior; explanation/scorer divergence | New explicit model version, golden fixtures, one scorer path, config/code/data fingerprint, protected-trait boundary, deterministic tie-breaks | HIGH |
| Data model and migration | Copying aggregate corruption; dual writes; lost updates | Validated/quarantined migration, reconciliation report, real PostgreSQL concurrency tests, one authoritative store, restore drill | HIGH |
| Identity and authorization | Client identity spoofing; OAuth subject confusion; wrong anonymous claim | Server-derived subject, provider mapping, one-time transactional claim, object-level authorization tests, staff MFA plan | HIGH |
| Programme governance | Stale/incomparable facts; publication without evidence | Provenance/data-year/comparability/freshness model, reviewer workflow, stale warnings, pilot catalogue verification | HIGH |
| Algorithm governance | Editable active model; self-approval; non-reproducible rollback | Immutable lifecycle, frozen evidence, independent approval, atomic activation, exact rollback rehearsal | HIGH |
| Outcomes/backtesting | Selection bias, unknown=negative, leakage, tiny samples | Outcome taxonomy, as-of data, sealed evaluation set, student-level analysis, suppression/minimum denominators, honest uncertainty | HIGH |
| Accuracy Lab | Sensitive slice disclosure; metric-definition drift | Role/purpose controls, cell suppression, versioned metrics/slices, aggregate exports, hand-verified metric fixtures | HIGH |
| Game of Five | Behavioral proxy; inaccessible interaction; overconfident inferred preference | Optional/revisable/untimed accessible flow, explicit use disclosure, confirmation, no speed/abandonment rank signal | HIGH |
| Messaging | Unstaffed inbox; harassment/crisis; AI/human confusion | Restricted participants, operator/SLA/runbook, report/block, notification redaction, retention, safeguarding/legal review | HIGH |
| Accessibility/browser QA | Automated-only confidence | WCAG 2.2 AA matrix, manual keyboard/screen-reader/zoom testing, inclusive users, three browser engines | HIGH |
| Monitoring | PII in logs; inadequate retention; untested alerts | Field allowlists/redaction tests, correlation IDs, access/retention review, alert and synthetic-check rehearsal | HIGH |
| Pilot launch | Public creep; no stop criteria; claims outrun evidence | Invite-only cap, consent/legal approval, named operators, verified subset, daily review, stop/rollback authority, pre-registered success criteria | HIGH |
| Framework modernization | Too many simultaneous variables | Separate atomic upgrade after behavioral, data, and browser protection | HIGH |

## Non-Negotiable Pilot Stop Conditions

Pause recommendation delivery or the entire pilot when any of the following occurs:

- Suspected cross-user access, account misbinding, credential compromise, or sensitive-data exposure.
- Protected/audit-only trait changes ranking, or a cohort loses opportunity coverage without a reviewed legitimate explanation.
- Active model/config cannot be identified or historical predictions cannot be reproduced.
- Programme source is materially wrong for a deadline, cost, eligibility, accreditation, or availability claim.
- Model activation lacks required evidence/approval or rollback fails.
- Messaging safety escalation is unavailable during promised coverage, or staff cannot distinguish urgent/unread states.
- Consent/guardian authority, deletion, or data-location questions cannot be answered for a participant.
- Monitoring/alerts or durable storage are unavailable beyond the rehearsed recovery window.

## Authoritative Sources

- U.S. Department of Education OCR, *Avoiding the Discriminatory Use of Artificial Intelligence*: https://www.ed.gov/media/document/avoiding-discriminatory-use-of-ai-108250.pdf — **HIGH**
- U.S. Department of Education OCR reading room and laws enforced (Title VI, Title IX, Section 504, Age Discrimination Act): https://www.ed.gov/laws-and-policy/civil-rights-laws/office-civil-rights-ocr-reading-room — **HIGH**
- U.S. Department of Education, equal access under Title VI: https://www.ed.gov/laws-and-policy/civil-rights-laws/title-vi/title-vi-key-issues/access-equal-education-opportunity — **HIGH**
- NIST AI Risk Management Framework resources and TEVV guidance: https://airc.nist.gov/ — **HIGH**
- NIST AI RMF FAQ (validity, safety, transparency, explainability, privacy, fairness across lifecycle): https://www.nist.gov/itl/ai-risk-management-framework/ai-risk-management-framework-faqs — **HIGH**
- FTC COPPA rule, 16 CFR Part 312: https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa — **HIGH**
- FTC COPPA applicability and actual-knowledge examples: https://www.ftc.gov/business-guidance/resources/childrens-online-privacy-protection-rule-not-just-kids-sites — **HIGH**
- U.S. Department of Education Student Privacy Policy Office, resources for education technology vendors: https://studentprivacy.ed.gov/audience/education-technology-vendors — **HIGH; applicability depends on relationship/data**
- FTC *Start with Security* (minimization, least privilege, lifecycle protection, disposal): https://www.ftc.gov/business-guidance/resources/start-security-guide-business — **HIGH**
- FTC *Protecting Personal Information* (retention policy and least privilege): https://www.ftc.gov/business-guidance/resources/protecting-personal-information-guide-business — **HIGH**
- NIST SP 800-63-4 Digital Identity Guidelines: https://www.nist.gov/identity-access-management/projects/nist-special-publication-800-63-digital-identity-guidelines — **HIGH**
- NCES IPEDS overview and coverage: https://nces.ed.gov/IPEDS/about-ipeds — **HIGH**
- NCES IPEDS collection/data-year/revision/release timing: https://nces.ed.gov/ipeds/use-the-data/timing-of-ipeds-data-collection — **HIGH**
- NCES IPEDS methodology, validation and imputation: https://nces.ed.gov/ipeds/survey-components/ipeds-survey-methodology — **HIGH**
- NCES IPEDS data-quality and comparability notes: https://nces.ed.gov/statprog/handbook/ipeds_dataquality.asp — **HIGH**
- W3C Web Content Accessibility Guidelines 2.2: https://www.w3.org/TR/WCAG22/ — **HIGH**
- Playwright accessibility testing limitations and axe integration: https://playwright.dev/docs/accessibility-testing — **HIGH**
- PostgreSQL row-security behavior and bypass caveats: https://www.postgresql.org/docs/current/ddl-rowsecurity.html — **HIGH**
- Vercel runtime-log limits and retention: https://vercel.com/docs/logs/runtime — **HIGH**
- U.S. Department of Education OCR harassment/bullying guidance: https://www.ed.gov/laws-and-policy/civil-rights-laws/protecting-students/sex-discrimination — **HIGH for schools; ScholarScout/partner applicability requires review**

## Legal and Research Gaps Requiring Specialists

- Obtain qualified counsel before the pilot to determine COPPA, FERPA, state student-privacy, general consumer-privacy, breach, accessibility, records, advertising, messaging/safeguarding, and international requirements based on actual ages, entities, contracts, data flows, and locations. This document is engineering research, not legal advice.
- Jamaica participation needs a specific privacy, cross-border transfer, minors/consent, and education-services review; U.S. controls are not presumed sufficient.
- Have a statistician or evaluation specialist review outcome definitions, study design, missingness, clustering, bootstrap method, calibration, fairness slices, and the claims supported by a 25–50-person pilot.
- Have counselors/student-support and safeguarding professionals review recommendation language, psychological/isolation indicators, Game of Five, messaging boundaries, escalation, and crisis resources.
- Have programme-data owners validate source licensing, update cadence, comparability, and the pilot's institution/pathway subset.

