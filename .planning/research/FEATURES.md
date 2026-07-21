# Feature Landscape

**Domain:** Explainable postsecondary pathway matching and counselor-supported decision platform
**Project:** ScholarScout PRD Recovery
**Researched:** 2026-07-21
**Overall confidence:** HIGH for regulatory/data/evaluation foundations; MEDIUM for product differentiators until pilot validation

## Product Standard

ScholarScout should not behave like a generic college search engine or an opaque admissions predictor. Its minimum credible product is a governed decision-support system: it gives students inclusive pathway choices, identifies the evidence and uncertainty behind each ranking, lets people correct or challenge the inputs, routes ambiguous or consequential cases to a counselor, and records whether recommendations led to useful actions and outcomes.

The recovered PRD capabilities are therefore interdependent. Game of Five is a rapid preference-elicitation input, not a standalone game. Messages is a durable human-support channel, not an AI chat transcript. Accuracy Lab is the promotion gate for algorithm versions, not an attractive analytics dashboard. Criteria management governs a versioned scoring contract, not live production constants.

## Table Stakes

Missing any of these makes the pilot unsafe, misleading, operationally incomplete, or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| One deterministic, versioned match contract | Every displayed score must be reproducible and attributable to the exact model/configuration that produced it | High | Persist model version, criteria version, source snapshot, material inputs, component scores, uncertainty, timestamp, and explanation codes with every prediction. **Confidence: HIGH** |
| Broad pathway catalogue | The stated value is rejection-free exploration across colleges, community colleges, certificates, trades, apprenticeships, online options, and other viable routes | High | Use a common pathway schema while preserving type-specific fields; never force non-college routes into college-only admission or completion semantics. **Confidence: HIGH** |
| Evidence provenance and freshness | Costs, admissions, completion, and outcomes change; students need to know source year and limitations | High | Show source, data year, retrieval date, provisional/final status, and missingness. IPEDS data can lag and reports aggregates rather than student-level outcomes. **Confidence: HIGH** |
| Explainable ranking and comparison | A fit number alone cannot support a consequential decision | High | Show admission/access, completion, financial stress, environment/support, climate, psychological/isolation, and overall ScholarFit components; provide “why this,” “what could change it,” and side-by-side comparison. Avoid causal or guaranteed language. **Confidence: HIGH** |
| Uncertainty and data-quality communication | Sparse profiles and stale programme data must not produce false precision | High | Confidence intervals/bands must be accompanied by plain-language confidence, missing-data flags, coverage, and evidence quality. Permit “insufficient evidence” rather than always returning a precise score. **Confidence: HIGH** |
| Student preference controls | Users must be able to inspect, correct, weight, or temporarily exclude preferences | Medium | Provide reversible filters and “show me why” controls; do not make inferred behavior silently override explicit student goals. **Confidence: HIGH** |
| Accessible onboarding and discovery | Students have varied motor, vision, cognitive, language, and device needs | High | Target WCAG 2.2 AA across full journeys, including keyboard/focus, target sizes, redundant entry, accessible authentication, error recovery, screen-reader announcements, reduced motion, and mobile layouts. **Confidence: HIGH** |
| Identity, consent, and account lifecycle | The app may handle minors and sensitive educational information | High | Establish age/eligibility policy, consent/assent as applicable, authenticated server-derived identity, anonymous-to-account migration, export, correction, deletion, retention, and session/security controls before pilot data collection. Legal review remains required. **Confidence: HIGH** |
| Role-based access and audit | Student, counselor, reviewer, data steward, and algorithm approver powers must differ | High | Enforce authorization server-side; log access and consequential mutations; keep student-visible explanations separate from protected audit-only attributes. **Confidence: HIGH** |
| Durable student–human messaging | Students need help interpreting recommendations and completing next steps | High | Threaded conversations, participants, read/delivery state, timestamps, attachments/links policy, notifications, retention, escalation, moderation/reporting, counselor assignment, and audit events. AI assistance may draft but must be clearly labeled and never impersonate a human. **Confidence: HIGH** |
| Counselor review workflow | Low-confidence, conflicting, safety-sensitive, or student-requested cases need accountable human review | High | Queue with reason codes and priority; counselor sees evidence/explanations, may annotate or recommend additional options, and cannot silently overwrite the underlying model result. Student sees who reviewed and what changed. **Confidence: HIGH** |
| Outcome/action capture | Calibration requires labels, while product success requires observable student action | High | Capture recommendation impression, shortlist, plan step, application, acceptance, enrollment, persistence/completion where consent and source allow. Separate self-report from verified outcomes and preserve observation windows. **Confidence: HIGH** |
| Programme governance | Published programme facts must be reviewable and correctable | High | Draft/review/publish/archive states, provenance, effective dates, conflict resolution, immutable revision history, validation, rollback, and steward ownership. **Confidence: HIGH** |
| Accuracy Lab evaluation | High-impact ranking changes need repeatable evidence before activation | High | Immutable prediction snapshots and outcome records; ranking metrics, calibration buckets, bootstrap confidence intervals, cohort/regime slices, missingness, version comparison, reviewer sign-off, activation/rollback. **Confidence: HIGH** |
| Fairness and red-team evaluation | Aggregate quality can conceal systematic harms or opportunity suppression | High | Audit protected groups offline with minimum cell sizes/privacy controls; test exposure, ranking, calibration, error, missingness, and resource access. Probe proxies, gaming, sparse profiles, data poisoning, extreme values, and explanation leakage. Protected traits cannot lower opportunity. **Confidence: HIGH** |
| Criteria/version management | Operators need to evolve scoring without editing hard-coded production weights | High | Typed criteria schema, constraints, validation, draft/active states, effective dates, rationale, diff, evaluation linkage, dual approval, rollback, and separation of duties. **Confidence: HIGH** |
| Pilot operations | A controlled 25–50 student launch needs support, observability, and stop conditions | High | Participant roster/eligibility, consent status, onboarding status, counselor ownership, incident intake, cohort health, data-quality checks, feedback, rollback/kill switch, and go/no-go checklist. **Confidence: HIGH** |

## Differentiators

These create unusual value, but must sit on top of the table stakes and be tested with students and counselors.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Opportunity-preserving ScholarFit | Ranks realistic options without treating rejection risk as a reason to hide ambitious or valuable paths | High | Maintain a diverse opportunity set: likely, target, stretch, and alternate pathways. Make tradeoffs visible. Validate exposure parity and student agency. **Confidence: MEDIUM** |
| Game of Five preference elicitation | Converts a cognitively heavy intake into fast, repeated choices that reveal tradeoffs | Medium | Five options per round with “none,” “not sure,” undo, skip, and why-asked; diverse option generation; record raw choices and derivation version; never label choices as ability. **Confidence: MEDIUM** |
| Counterfactual exploration | Shows which controllable changes could alter matches and which data assumptions matter | High | “If commute radius changes…” or “if verified aid differs…”; label hypothetical scenarios, prohibit manipulation of protected traits, and keep baseline visible. **Confidence: MEDIUM** |
| Evidence cards | Lets a student inspect data source, year, coverage, uncertainty, and caveat directly beside each score | Medium | Supports trust and correction; integrate report-a-data-error and steward workflow. **Confidence: HIGH** |
| Human-in-the-loop confidence routing | Uses uncertainty and disagreement to offer counselor support at the moment it matters | High | Routing policy itself must be tested for unequal access; allow every student to request review. **Confidence: MEDIUM** |
| Multi-pathway equivalence | Compares degree, credential, apprenticeship, service, and workforce routes without implicitly declaring one category superior | High | Use shared decision dimensions plus route-specific outcomes; do not fabricate comparable admission or earnings measures where unavailable. **Confidence: MEDIUM** |
| Decision journal | Preserves why a student shortlisted, rejected, or changed an option and connects those decisions to human support | Medium | Student controls visibility; journal data is sensitive and should not silently become a ranking feature. **Confidence: MEDIUM** |
| Calibration by decision regime | Measures quality separately for pathway type, geography, source coverage, profile completeness, and time horizon | High | Prevents misleading aggregate accuracy; requires enough samples and predeclared metrics. **Confidence: HIGH** |
| Model/version comparison with promotion evidence | Makes algorithm evolution legible to reviewers and reversible | High | Champion/challenger comparison, golden fixtures, slice regressions, qualitative review, signed approval, staged rollout, and instant rollback. **Confidence: HIGH** |

## Feature Specifications by PRD Capability

### Explainable Match Intelligence

Minimum outputs per programme/pathway:

- Stable prediction ID plus algorithm, criteria, catalogue, and data-snapshot versions.
- ScholarFit and named component scores, with normalized range and explicit handling of unavailable components.
- Match band that does not disguise a continuous estimate as certainty.
- Evidence quality, confidence interval or uncertainty band, sample/coverage basis where applicable, and missing-data warnings.
- Positive reasons, concerns/tradeoffs, student-controllable next steps, and the top material inputs.
- A clear boundary between descriptive institutional data, predictive estimates, preference fit, and counselor judgment.
- A record of whether behavioral signals altered ordering, with student control to reset them.

Admission/access and completion should be distinct. Financial stress should use net-price/aid evidence when available and not equate sticker price with affordability. Environment/support fit should be preference-based. Climate and psychological/isolation risk require especially cautious definitions and must not be presented as clinical or individual diagnoses. **Confidence: HIGH for separation/explanation; MEDIUM for the final validity of each PRD construct pending operational definitions and data validation.**

### Game of Five

Required experience:

1. Explain the purpose and allow skip.
2. Present five accessible, materially different options per round, not five cosmetic variants.
3. Support keyboard, screen reader, reduced motion, undo, “none fit,” and “I’m unsure.”
4. Capture raw choice, option set, presentation order, timestamp, and game version.
5. Translate choices into provisional preferences, then ask the student to confirm/edit them.
6. Show how those preferences affect results and allow complete reset.

Do not infer intelligence, mental health, disability, socioeconomic status, or protected traits. Do not use variable rewards, streak pressure, loss aversion, or dark patterns to maximize engagement. **Confidence: MEDIUM** because pilot usability evidence is needed.

### Durable Human Messaging

Required domain objects include conversation, participant, assignment, message, receipt, attachment/link metadata, notification preference, escalation, and moderation event. Messages require idempotent sending, ordering, pagination, retry behavior, and retention/export/deletion policy. Counselors need workload and response-status views; students need understandable availability expectations and emergency disclaimers. Automated or AI-generated content must be labeled, reviewable, and excluded from claims that a human responded. **Confidence: HIGH** for durability/safety requirements.

### Accuracy Lab, Calibration, Audit, and Backtesting

The Lab must answer four separate questions:

- **Reproducibility:** Can this exact historical prediction be recreated from immutable inputs and versioned code/configuration?
- **Ranking utility:** Did relevant outcomes appear higher in the ranked list? Use predeclared ranking metrics such as Recall@K/NDCG where labels support them.
- **Calibration:** Do predicted probabilities correspond to observed frequencies within defensible buckets and time windows? Report sample size and uncertainty.
- **Impact/fairness:** Which groups or regimes receive different exposure, errors, confidence, or resource access, and are differences explainable and acceptable?

Every evaluation run needs dataset identity, inclusion/exclusion rules, label provenance, observation cutoff, metric definitions, slice policy, bootstrap/random seed, code/config versions, reviewer, and immutable results. Promotion requires thresholds, no critical slice regression, qualitative review, approval, staged activation, monitoring, and rollback. Tiny cohorts must be suppressed or aggregated to protect privacy and avoid noisy claims. **Confidence: HIGH** based on NIST’s lifecycle risk-management and TEVV framing; exact metric thresholds remain pilot decisions.

### Red-Team and Criteria Management

Maintain a reusable adversarial suite covering malformed input, missing values, contradictory preferences, out-of-range numbers, proxy leakage, protected-trait perturbation, rank suppression, data staleness, source conflicts, duplicate programmes, prompt injection in AI-advisor context, explanation leakage, unauthorized access, message abuse, retry duplication, and concurrent updates. Findings need severity, affected versions, reproduction, owner, disposition, regression test, and release-blocking state.

Criteria changes must never edit an active version in place. Validate weight bounds, score direction, total normalization, required features, prohibited fields, monotonicity rules where declared, explanation coverage, and compatibility with stored snapshots. **Confidence: HIGH.**

### Programme and Outcome Governance

Programme records need canonical identifier, offering/provider identity, pathway type, geography/delivery, eligibility, costs, duration, support, outcomes, source URLs, source/data years, retrieval date, field-level provenance, publication status, steward, and revision history. A source conflict must remain visible until resolved; a newer date alone does not prove a better source.

IPEDS and College Scorecard are strong foundations for U.S. Title IV institutions, but their coverage, aggregation, definitions, privacy suppression, and time lags mean they cannot validate every programme type or predict an individual student’s outcome. Apprenticeships, workforce programmes, military/service, international options, and local supports require source-specific governance and should show “not comparable” rather than invented equivalence. **Confidence: HIGH.**

## Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| A universal “acceptance chance” presented as fact | Institutional aggregates are not individualized admission probabilities and can create false certainty | Use access evidence, bands, caveats, source years, and counselor review; never guarantee admission |
| Protected traits or close proxies that lower ranking/opportunity | Creates discriminatory steering and violates the core guardrail | Keep protected data in access-controlled audit context; test invariance and opportunity exposure; use student-requested support needs directly |
| A single opaque ScholarFit number | Conceals tradeoffs, missingness, and arbitrary weights | Always show components, evidence, uncertainty, reasons, and controls |
| Automatic activation of new weights/models | Aggregate improvements can hide slice harms and regressions | Require immutable evaluation, review, approval, staged rollout, monitoring, and rollback |
| AI-only counseling or AI impersonation | Students may rely on unsupported or fabricated guidance and lose accountable human help | Use grounded, labeled assistance with durable human escalation and source links |
| Engagement-maximizing gamification | Streaks, scarcity, rankings, or variable rewards can manipulate young users | Make Game of Five finite, transparent, skippable, reversible, and utility-focused |
| Public social messaging between students | Introduces moderation, grooming, bullying, and privacy risk unrelated to pilot value | Limit launch messaging to authenticated student–authorized support relationships |
| Scraping as the primary programme truth layer | Fragile, hard to audit, and may violate source terms or preserve stale facts | Prefer official datasets/APIs and stewarded sources with provenance and review |
| Inferred mental-health or isolation diagnosis | Unsupported, sensitive, and potentially harmful | Ask optional support/preferences directly; frame any environment mismatch cautiously; route concerns to qualified human resources |
| Silent behavioral personalization | Students cannot understand why ranking changed and feedback loops may narrow choices | Disclose behavioral effects, cap them, preserve diverse options, and provide reset/disable controls |
| “Fairness score” as a release shortcut | One aggregate metric cannot establish non-discrimination | Use multiple outcome/exposure/error measures, qualitative review, cohort context, privacy thresholds, and documented decisions |
| Broad public launch from the JSON/Blob aggregate | Current persistence has concurrency, durability, and authorization risks | Use transactional record-level storage, verified identity/authorization, observability, and controlled pilot gates |
| Accuracy claims from simulated or tiny samples | Produces misleading confidence | Label synthetic data, suppress tiny slices, wait for observation windows, and report uncertainty |

## Feature Dependencies

```text
Authenticated identity + consent policy
  -> authoritative student profile
  -> durable messages and counselor assignment
  -> trustworthy prediction/outcome linkage

Governed programme schema + provenance
  -> canonical match inputs
  -> reproducible predictions
  -> reliable explanations and backtests

Versioned criteria schema + deterministic scorer
  -> prediction snapshots
  -> model/version comparison
  -> Accuracy Lab promotion and rollback

Outcome taxonomy + consented event capture
  -> labeled evaluation datasets
  -> calibration/ranking/fairness metrics
  -> evidence-based model activation

Protected-attribute isolation + authorization
  -> privacy-preserving audit slices
  -> fairness/red-team review
  -> pilot approval

Accessible onboarding + editable preferences
  -> Game of Five confirmed signals
  -> explainable recommendations
  -> actionable shortlist and counselor review

Transactional/idempotent persistence
  -> reliable messages/events/snapshots
  -> accurate operational dashboards
  -> controlled multi-user pilot
```

## Complexity and Sequencing Implications

| Capability | Primary Complexity Driver | Must Precede |
|------------|---------------------------|--------------|
| Identity/privacy foundation | Minor-sensitive data, role authorization, migration, lifecycle controls | Messaging, outcome tracking, pilot |
| Transactional persistence | Concurrency, idempotency, record-level authorization, migration | Durable messaging, immutable evaluation, multi-user pilot |
| Programme governance | Heterogeneous source definitions and field-level provenance | Canonical matching and trustworthy comparisons |
| Canonical match engine | Reconciliation of fragmented logic and backward-compatible explanations | Game impact, snapshots, Accuracy Lab |
| Game of Five | Accessible choice design, bias control, versioned derivation | Pilot preference elicitation |
| Messaging/counselor review | Delivery semantics, moderation, notifications, staffing workflow | Supported pilot |
| Accuracy Lab | Label quality, time horizons, reproducibility, privacy-safe slices | Algorithm promotion and launch claims |
| Pilot operations | Consent, support staffing, incidents, monitoring, stop criteria | Any broader launch |

## MVP Recovery Recommendation

Prioritize in this order:

1. **Safety and integrity foundation:** authenticated identity, consent/account lifecycle, server-side authorization, schemas/limits, transactional record storage, audit events, and WCAG 2.2 AA acceptance criteria.
2. **Governed evidence foundation:** canonical programme/outcome schemas, official-source ingestion, provenance/freshness, steward workflows, and correction paths.
3. **Canonical match intelligence:** versioned deterministic contract, recovered PRD components, explanations, uncertainty, protected-trait isolation, golden fixtures, and legacy comparison.
4. **Student decision experience:** accessible onboarding, Game of Five with confirmed preferences, recommendations, evidence cards, comparison, shortlist, and action plans.
5. **Human support:** durable messages, counselor assignment/review, escalation, moderation, and response operations.
6. **Evaluation/governance:** prediction and outcome snapshots, backtesting, calibration, fairness/red-team suites, Accuracy Lab, criteria management, activation/rollback.
7. **Controlled pilot:** provision sources/providers, train counselors/stewards, recruit 25–50 consented participants, monitor operations and harms, collect feedback/outcomes, and make a documented go/no-go decision.

Defer broad international coverage, public student-to-student communication, automated algorithm activation, sophisticated ML personalization, and public accuracy claims until source governance, sample size, legal/privacy review, and pilot evidence support them.

## Pilot Acceptance Signals

- Every recommendation can be reproduced from its stored versions and snapshot.
- Every displayed fact has source/freshness or an explicit unknown state.
- No protected attribute changes ranking downward in invariance tests; audit-only fields are access-controlled.
- Students can inspect, correct, reset, and challenge their preferences and results.
- All participants can request counselor review; low-confidence cases are routed consistently across slices.
- Messages are authorized, ordered, idempotent, auditable, exportable, and covered by moderation/escalation procedures.
- Algorithm candidates cannot activate without passed evaluation, documented human approval, staged rollout, and tested rollback.
- Launch-critical journeys meet WCAG 2.2 AA acceptance checks and browser-level verification.
- Privacy, consent, retention, incident response, monitoring, and pilot stop criteria have named owners.
- Claims distinguish institutional aggregates, estimates, verified outcomes, and student self-reports.

## Sources

Primary/authoritative sources were preferred. Confidence is assigned to the claim supported by the source, not to ScholarScout's future implementation.

- **HIGH — U.S. Department of Education, NCES, IPEDS overview:** scope, mandatory Title IV reporting, institutional characteristics, costs, admissions, enrollment, aid, completions, persistence/success, and institutional resources. https://nces.ed.gov/IPEDS/about-ipeds
- **HIGH — NCES, IPEDS survey components:** aggregate institutional rather than student-level data and current public release structure. https://nces.ed.gov/ipeds/use-the-data/survey-components
- **HIGH — NCES, IPEDS collection/coverage/release timing:** provisional/final releases, time lags, cohort alignment, changing institution universe, and interpretation constraints. https://nces.ed.gov/ipeds/use-the-data/timing-of-ipeds-data-collection
- **HIGH — U.S. Department of Education, College Scorecard technical documentation:** institutional data definitions, coverage, accuracy, privacy suppression, and use limitations. https://collegescorecard.ed.gov/files/InstitutionDataDocumentation.pdf
- **HIGH — NIST AI Risk Management Framework:** trustworthy AI characteristics and lifecycle functions Govern, Map, Measure, and Manage. https://www.nist.gov/itl/ai-risk-management-framework
- **HIGH — NIST AI Resource Center:** testing, evaluation, verification, and validation resources for operationalizing AI risk management. https://airc.nist.gov/
- **HIGH — U.S. Department of Education Student Privacy Policy Office:** FERPA resources and responsibilities for education technology vendors handling student PII. https://studentprivacy.ed.gov/audience/education-technology-vendors?resource_type=All&topic=21
- **HIGH — U.S. Department of Education PTAC:** responsibilities of third-party service providers under FERPA. https://studentprivacy.ed.gov/resources/responsibilities-third-party-service-providers-under-ferpa
- **HIGH — FTC COPPA Rule:** applicability to child-directed services and services with actual knowledge of collection from children under 13. https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa
- **HIGH — FTC COPPA business guidance:** notice, verifiable parental consent, security, retention/deletion, actual knowledge, and age-screen considerations. https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions
- **HIGH — W3C WCAG 2.2 Recommendation:** full-page conformance and Level AA accessibility requirements across devices. https://www.w3.org/TR/WCAG22/

## Research Gaps

- The uploaded PRD's exact construct definitions and original June 19 weights are not recoverable; they must be operationally re-specified and validated rather than guessed. **Confidence: HIGH.**
- Climate and psychological/isolation risk need a phase-specific evidence and ethics review before inclusion in live ranking. Current recommendation: keep them explanatory/preference-oriented until validated. **Confidence: MEDIUM.**
- Legal obligations vary by institution relationships, participant ages, jurisdictions, data sources, and pilot design. FERPA/COPPA research informs product requirements but is not legal advice; counsel must review the pilot. **Confidence: HIGH.**
- Exact fairness metrics and thresholds cannot be chosen responsibly before the prediction target, opportunity definition, cohort sizes, and action policy are fixed. **Confidence: HIGH.**
- Game of Five option semantics, counselor staffing/service levels, and notification channels require direct student/counselor research during implementation. **Confidence: MEDIUM.**

---
*Feature research prepared for recovery roadmap creation; it expands implementation safeguards without weakening the uploaded PRD contract.*
