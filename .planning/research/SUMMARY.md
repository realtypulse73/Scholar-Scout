# Project Research Summary

**Project:** ScholarScout PRD Recovery  
**Domain:** Explainable postsecondary pathway matching and counselor-supported decision platform  
**Researched:** 2026-07-21  
**Confidence:** HIGH

## Executive Summary

ScholarScout is not merely a catalogue or admissions predictor; it is a high-impact decision-support product for students, including minors. A credible pilot must preserve broad pathway choice, make every ranking reproducible and explainable, communicate uncertainty and source quality, provide accountable human support, and prevent protected traits or proxies from suppressing opportunity. The uploaded PRD is the recovery contract, but the lost numeric behavior must not be guessed or represented as recovered ground truth.

The recommended approach is an incremental recovery inside the existing Next.js modular monolith. First contain identity and input-security risks, freeze surviving scoring behavior as fixtures, and establish one pure, deterministic, versioned TypeScript match engine. Then replace whole-document JSON/Blob writes with record-level PostgreSQL transactions, add governed programme/model records and immutable evidence, and build Game of Five, messaging, and Accuracy Lab on those shared foundations. Major framework/auth upgrades should remain isolated until critical behavior has browser and integration protection.

The principal risks are discriminatory steering through proxies, false precision from sparse or selectively observed outcomes, stale or incomparable programme data, cross-user access, unsafe messaging, and unreviewed model activation. Mitigation requires strict operational-versus-audit data boundaries, immutable prediction/config/data fingerprints, provenance and freshness controls, server-derived identity, transactional state transitions, privacy-safe evaluation, human approval and rollback, WCAG 2.2 AA verification, and an invite-only 25–50-student pilot with named operators and stop conditions.

## Key Findings

### Recommended Stack

Preserve the current Next.js 15/React 18 application during core recovery and introduce dependencies only with their owning, tested capability. Use one TypeScript scoring implementation for production and backtesting; use PostgreSQL for authoritative pilot data; and add runtime schemas, browser/accessibility coverage, and portable telemetry. See [STACK.md](./STACK.md) for version policy and alternatives.

**Core technologies:**

- **TypeScript 5.x:** pure canonical match and evaluation contracts — prevents production/backtest drift.
- **Zod 4.x:** route, import, configuration, and persisted-record validation — supplies runtime enforcement for typed contracts.
- **Canonical JSON + SHA-256:** configuration and prediction fingerprints — makes historical results attributable and reproducible.
- **PostgreSQL 18.x (17.x acceptable by provider):** normalized transactional system of record — prevents aggregate-store lost updates and supports constraints, locks, idempotency, and governance evidence.
- **Drizzle ORM/Kit (pinned stable pre-1.0):** SQL-visible typed access and reviewed migrations — fits governance-heavy records without hiding constraints.
- **Jest 30 plus Playwright and axe:** preserve unit coverage and add production-build browser/accessibility journeys across Chromium, Firefox, and WebKit.
- **Next.js instrumentation with OpenTelemetry:** correlated operations and model-version telemetry without sensitive payloads or backend lock-in.

Critical sequencing: raise the Node minimum to at least 20.9, but defer Next.js 16 and any Auth.js major migration to a separately verified modernization increment.

### Expected Features

The product standard is a governed recommendation service, not a collection of independent screens. Game of Five is confirmed preference input, messaging is durable human support, and Accuracy Lab is the evidence gate for model activation. See [FEATURES.md](./FEATURES.md) for detailed capability specifications.

**Must have (table stakes):**

- One deterministic, versioned match contract with named PRD components, confidence, explanation codes, audit metadata, and immutable prediction snapshots.
- Broad, type-aware pathway catalogue with field-level provenance, freshness, comparability, publication workflow, correction, and rollback.
- Explainable comparison showing access, completion, financial stress, environment/support, climate, psychological/isolation, overall ScholarFit, uncertainty, missingness, and controllable next steps.
- Server-derived identity, consent/account lifecycle, anonymous migration, object-level authorization, role separation, export/deletion, and append-only audit evidence.
- Durable student-to-authorized-support messaging plus counselor review, delivery/read state, idempotency, moderation, escalation, retention, and clear AI/human separation.
- Outcomes and immutable evaluation datasets supporting ranking metrics, calibration, confidence intervals, privacy-safe slices, fairness/red-team tests, version comparison, human approval, activation, and rollback.
- Criteria and programme lifecycle governance; WCAG 2.2 AA journeys; monitoring, backup/restore, incident response, and invite-only pilot operations.

**Should have (differentiators):**

- Opportunity-preserving ScholarFit that retains likely, target, stretch, and alternate pathways.
- Accessible, optional, revisable Game of Five preference elicitation with explicit confirmation before ranking impact.
- Counterfactual exploration, evidence cards, human-in-the-loop confidence routing, and multi-pathway equivalence without invented comparability.
- Decision journal, decision-regime calibration, and champion/challenger evidence bundles.

**Defer (v2+):**

- Broad international production coverage beyond a verified, legally reviewed pilot subset.
- Public student-to-student communication, realtime messaging, and sophisticated engagement personalization.
- Generic ML experiment platforms, separate scoring microservices, and automated model activation.
- Public accuracy claims or individualized acceptance probabilities unsupported by representative outcome evidence.

### Architecture Approach

Retain a modular Next.js monolith and apply a strangler migration around typed application services and repositories. Every ranking consumer calls the same pure, version-addressable engine; every consequential mutation commits domain data, audit evidence, and an outbox event atomically; every route derives identity and role from the verified session. Operational scoring types must be structurally unable to import protected audit attributes. See [ARCHITECTURE.md](./ARCHITECTURE.md) for contracts, state machines, schemas, and scaling guidance.

**Major components:**

1. **Match intelligence domain and matching service** — normalize inputs, resolve the active version, compute deterministic components/explanations, and append prediction snapshots.
2. **Identity, pilot policy, and reconciliation services** — enforce session-derived subject/role, consent/cohort policy, and one-time transactional anonymous claims.
3. **Transactional repositories and unit of work** — own PostgreSQL constraints, optimistic revisions, idempotency, audit, and outbox semantics.
4. **Catalogue and algorithm registries** — govern immutable revisions, provenance, draft/review/approval/activation, and exact rollback.
5. **Evaluation domain and Accuracy Lab service** — build frozen datasets, run repeatable metrics/slices, preserve evidence, and authorize promotion commands.
6. **Messaging and counselor-support services** — provide authorized durable threads, receipts, moderation, escalation, assignment, and notification delivery.
7. **Telemetry and operations layer** — correlate requests and versions while redacting profiles, messages, protected traits, prompts, and tokens.

### Critical Pitfalls

1. **Guessing the lost algorithm** — call the rebuild a new explicit version; freeze legacy fixtures and define every input, rule, tie-break, missingness policy, explanation, and digest in one scorer.
2. **Proxy-based opportunity suppression** — classify fields by purpose, isolate protected/audit data by type and permission, test non-interference and opportunity exposure, and retain correction/appeal paths.
3. **Invalid learning and false precision** — keep exposure, action, admission, enrollment, unknown, and censored outcomes distinct; use as-of datasets, student-level analysis, honest denominators, suppression, and uncertainty.
4. **Stale or incomparable programme evidence** — persist source/data year/release status/population/retrieval/effective period and use explicit unknown or not-comparable states with pilot verification.
5. **Unsafe identity, messaging, or promotion** — derive authority server-side; use transactional claim/idempotency; restrict messaging to staffed support relationships; require immutable evaluation, independent review, atomic activation, and rehearsed rollback.

## Implications for Roadmap

Based on dependency and risk analysis, use seven recovery phases followed by a deliberately separate modernization phase.

### Phase 1: Characterization and Safety Containment

**Rationale:** Existing identity and fragmented-scoring risks must be bounded before more student data or recovered features are added.  
**Delivers:** Golden fixtures for surviving score paths; terminology/metric registry; runtime schemas and body limits; server-derived identity guards; durable OAuth subject mapping; correlation/redaction baseline; explicit pilot threat model and WCAG acceptance matrix.  
**Addresses:** Identity, role access, input security, reproducibility baseline, accessibility criteria.  
**Avoids:** Cross-user access, silently invented numeric parity, telemetry leakage, and framework-change ambiguity.

### Phase 2: Canonical Match Intelligence

**Rationale:** Every downstream recommendation, game signal, snapshot, and evaluation depends on one authoritative score path.  
**Delivers:** Pure versioned engine; named PRD components; configuration digest; deterministic tie-breaks; structured explanations; uncertainty/missingness policy; protected-trait boundary; legacy adapters and consumer cutover.  
**Uses:** TypeScript, Zod, canonical JSON/SHA-256, Jest and optional property tests.  
**Avoids:** Scorer/explanation drift, proxy use by construction, mutable global weights, and irreproducible history.

### Phase 3: Transactional Identity and Persistence

**Rationale:** Durable messages, outcomes, predictions, and governance cannot safely use whole-document writes or client identity.  
**Delivers:** PostgreSQL schema and migrations; domain repositories/unit of work; idempotency/outbox; record-level authorization; anonymous claim; validated/quarantined import; reconciliation report; cutover and restore drill.  
**Addresses:** Authoritative profiles, shortlists, predictions, account lifecycle, audit evidence, and concurrency.  
**Avoids:** Lost updates, duplicate side effects, corrupt migration, dual-write ambiguity, and wrong-account merges.

### Phase 4: Governed Programme and Algorithm Records

**Rationale:** The canonical scorer needs trustworthy versioned inputs, while later evaluation needs immutable candidates and activation history.  
**Delivers:** Programme provenance/freshness/comparability model; steward draft/review/publish/archive workflow; immutable criteria/model registry; effective dates; diffs; independent approval; atomic active pointer and exact rollback; verified pilot catalogue subset.  
**Addresses:** Programme governance, criteria management, evidence cards, correction paths, audit history.  
**Avoids:** Stale/incomparable facts, draft leakage, self-approval, and editing active records in place.

### Phase 5: Student Decision and Human Support Experiences

**Rationale:** Recovered experiences should consume canonical profiles, scoring, identity, and persistence rather than create new state islands.  
**Delivers:** Accessible Game of Five with provisional/confirmed preferences and reset; upgraded explanations/comparison/shortlist/action paths; durable support messaging; counselor assignment/review queue; moderation, escalation, retention, and notification semantics.  
**Addresses:** PRD Game of Five, Messages, student agency, evidence cards, and human-in-the-loop review.  
**Avoids:** Behavioral proxies, inaccessible gamification, AI impersonation, unstaffed crisis handling, and retry duplication.

### Phase 6: Evaluation, Accuracy Lab, and Promotion Governance

**Rationale:** Outcome and evaluation evidence becomes meaningful only after score, data, identity, and event contracts are stable.  
**Delivers:** Outcome taxonomy and capture; frozen as-of datasets; repeatable backtest jobs; hand-verified ranking/calibration metrics; bootstrap intervals; missingness/drift/fairness/sensitivity/red-team slices; privacy suppression; version comparison; review, staged activation, monitoring, and rollback controls.  
**Addresses:** Accuracy Lab, calibration, audit, backtesting, red-team testing, and model governance.  
**Avoids:** Future leakage, unknown-as-failure encoding, tiny-slice disclosure, metric drift, and promotion without exact evidence.

### Phase 7: Controlled Pilot Readiness and Launch

**Rationale:** A small pilot is still consequential and requires technical, legal, support, and operational readiness as one release gate.  
**Delivers:** Invite-only cohort policy; age/consent/retention/export/deletion controls; verified programme subset; monitoring and alerts; security, concurrency, performance, Playwright and WCAG verification; backup/restore and rollback rehearsal; staffed support and incident runbooks; 25–50-participant go/no-go and stop criteria.  
**Addresses:** Pilot operations, privacy, accessibility, reliability, observability, and launch verification.  
**Avoids:** Public-registration creep, unsupported claims, silent incidents, unavailable escalation, and unrecoverable active-state failures.

### Phase 8: Isolated Framework and Scale Modernization

**Rationale:** Framework/auth majors and scale infrastructure should not obscure recovery defects and are not prerequisites for the controlled pilot if the current supported stack is secured.  
**Delivers:** Evidence-driven Next.js 16/React/Auth.js decision and isolated upgrade if warranted; worker/queue, realtime messaging, caching, or analytics scaling only where pilot measurements justify them.  
**Avoids:** Big-bang modernization and speculative infrastructure.

### Phase Ordering Rationale

- Characterization and security containment make existing behavior safe enough to migrate and provide regression evidence.
- The canonical engine precedes persistence governance so snapshots and version records share one stable contract.
- Transactional persistence precedes recovered messaging, outcomes, and staff workflows because their correctness depends on atomic identity-owned records.
- Programme/model governance precedes Accuracy Lab and pilot claims because evaluation must identify exact evidence and rollback targets.
- Recovered student/human experiences are built after foundations but before final evaluation and pilot verification so their actual event flows can be tested end to end.
- Modernization is isolated after pilot readiness to preserve causal clarity and rollback options.

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 2:** Operational definitions and evidence/ethics review for climate and psychological/isolation constructs; reconstruction must not guess lost weights.
- **Phase 3:** Managed PostgreSQL provider, regional residency, pooling/driver, migration reconciliation, backup/PITR, and deployment-specific Drizzle choices.
- **Phase 4:** Authoritative/licensed data sources, comparability classes, refresh SLAs, and pilot-geography catalogue contracts.
- **Phase 5:** Direct student/counselor research for Game of Five semantics, staffing SLA, safeguarding, moderation, and notification channels.
- **Phase 6:** Statistician review of target/outcome definitions, missingness, clustering, bootstrap method, slice suppression, fairness measures, and promotion thresholds.
- **Phase 7:** Qualified legal/privacy/accessibility review across participant ages, partner relationships, U.S. jurisdictions, Jamaica, consent, retention, and messaging duties.

Phases with established patterns that can usually skip broad research-phase work:

- **Phase 1:** Characterization fixtures, boundary validation, centralized server authorization, and structured redaction have mature patterns; project-specific threat modeling still applies.
- **Phase 8:** Use official upgrade guides once the exact target versions are selected; scope it as an isolated compatibility project.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Platform, database semantics, validation, testing, and telemetry recommendations rely on official documentation; exact ORM/driver/provider patches remain implementation decisions. |
| Features | HIGH | Table stakes follow the PRD plus authoritative education-data, NIST, privacy, and accessibility guidance; differentiator usability/value remains MEDIUM pending pilot research. |
| Architecture | HIGH | Modular-monolith boundaries and dependency order directly address mapped failure modes; vendor, RLS, and realtime details remain conditional. |
| Pitfalls | HIGH | Engineering, civil-rights, data-quality, accessibility, and U.S. privacy risks are well supported; jurisdiction-specific duties require counsel. |

**Overall confidence:** HIGH for recovery sequencing and safety gates; MEDIUM for model validity, product differentiators, and jurisdiction-specific launch policy until specialist and pilot evidence exists.

### Gaps to Address

- **Lost numerical semantics:** Define and version a new model transparently; do not claim exact recovery of weights or thresholds.
- **Model constructs and thresholds:** Obtain counselor/domain/statistical review, especially for access probability, climate, psychological/isolation, confidence, fairness, and promotion policy.
- **Programme truth:** Select licensed authoritative sources and define field-level provenance, comparability, review ownership, and freshness per pilot region and pathway type.
- **Privacy/legal authority:** Counsel must resolve age policy, COPPA/FERPA/state and general privacy applicability, school/vendor roles, records/retention, accessibility, safeguarding, and Jamaica/cross-border requirements.
- **Pilot operations:** Name support owners, response SLAs, escalation contacts, incident/rollback authority, analysis protocol, feedback methods, and expansion criteria.
- **Deployment choices:** Confirm managed PostgreSQL, identity provider/method, observability retention/alerts, worker topology, budget, and regional constraints during the owning phases.
- **Evidence limits:** A 25–50-person pilot cannot substantiate broad accuracy or subgroup fairness claims; pre-register questions and treat small slices as diagnostic, privacy-protected signals.

## Sources

### Primary (HIGH confidence)

- Next.js support, authentication/authorization, upgrade, instrumentation, and OpenTelemetry documentation — framework sequencing, route boundaries, runtime, and observability.
- PostgreSQL current, versioning, transaction isolation, locking, constraints, and row-security documentation — persistence and governance semantics.
- NIST AI Risk Management Framework and AI Resource Center — lifecycle governance, testing, evaluation, verification, validation, transparency, and human oversight.
- U.S. Department of Education OCR guidance — discriminatory AI use, equal educational opportunity, and civil-rights context.
- NCES IPEDS and College Scorecard documentation — institutional-data coverage, aggregation, release lag, revisions, suppression, quality, and comparability limits.
- FTC COPPA and data-security guidance; U.S. Department of Education Student Privacy resources; NIST SP 800-63-4 — age, consent, minimization, lifecycle security, vendor, and identity considerations.
- W3C WCAG 2.2 and Playwright accessibility guidance — AA targets and the need for automated plus human testing.
- Drizzle, Zod, OpenTelemetry, and Vercel official documentation — migrations, runtime schemas, telemetry, retention, and alerting capabilities.

### Secondary (MEDIUM confidence)

- Product-specific recommendations for opportunity-preserving ScholarFit, Game of Five semantics, counselor confidence routing, notification channels, polling-first messaging, and pilot operating thresholds — coherent with authoritative guidance but require direct user, specialist, and operational validation.
- Exact managed-service, ORM/driver, identity method, and observability vendor choices — intentionally unresolved until deployment requirements are fixed.

### Tertiary (LOW confidence)

- None used as a basis for roadmap decisions. Unknowns are recorded as research or approval gates rather than inferred.

---
*Research completed: 2026-07-21*  
*Ready for roadmap: yes*
