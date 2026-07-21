# Architecture Patterns: ScholarScout PRD Recovery

**Domain:** Governed postsecondary recommendation and student-support platform  
**Researched:** 2026-07-21  
**Overall confidence:** HIGH for the target boundaries and build order; MEDIUM for database/vendor choices until deployment constraints are confirmed

## Recommendation

Keep ScholarScout a **modular Next.js monolith** for the recovery and pilot. Do not split it into microservices. Replace the fragile foundations incrementally behind typed ports: one canonical match engine, record-level transactional repositories, an append-only evaluation/audit ledger, authenticated identity, and narrow application services. This preserves the working routes and UI while making scores reproducible, mutations atomic, and launch decisions reviewable.

```text
App Router pages / client components
              |
Authenticated Route Handlers + server pages (DTO boundary)
              |
Application services / use cases
  +-----------+------------+-------------+----------------+
  |           |            |             |                |
Identity   Matching     Evaluation     Messaging       Catalogue
service    service      service        service         service
              |            |              |                |
     pure canonical        |       transactional repositories
     match engine          |              |
              +------------+--------------+
                           |
                    PostgreSQL database
                 + object storage for exports
                           |
          worker/queue seam for backtests and notifications
```

The first implementation can execute backtests synchronously or through an in-process job runner for tiny fixtures, provided the job contract is durable and idempotent. The seam, not an early distributed service, is the scaling decision.

## Architectural Principles

1. **One score path.** Every student-facing ranking, simulation-derived rerank, Accuracy Lab replay, and staff preview calls the same version-addressable pure engine.
2. **Inputs and evidence are immutable snapshots.** A prediction records normalized student inputs, programme-data revision, algorithm version, configuration digest, output, uncertainty, and explanation. Later edits never rewrite historical evidence.
3. **Draft is never active by accident.** Candidate configurations and programme revisions are separately addressable records. Only a serialized, authorized promotion transaction can change the active pointer.
4. **Repositories own persistence semantics.** Application code never performs whole-document read/modify/write. A use case commits its domain mutation, audit event, and outbox event atomically.
5. **Identity comes from the server.** Route handlers derive authenticated user and role from the session. Anonymous users receive a signed, server-issued session identifier that can be reconciled once, transactionally, into an account.
6. **Protected traits are isolated.** Operational scoring input excludes protected traits. Audit datasets may contain separately permissioned cohort attributes for aggregate evaluation; scoring code cannot import that data type.
7. **Pilot scope is an explicit policy boundary.** Cohort enrollment, geography, feature flags, staff access, data retention, and algorithm version are controlled server-side rather than by hidden UI.

## Component Boundaries

| Component | Responsibility | Must not do | Communicates with |
|---|---|---|---|
| `match-intelligence` domain | Validate canonical scoring input/config; calculate component scores, match band, confidence, explanations, deterministic tie-break | Read storage, session, clocks, environment, or protected-trait audit fields | Matching application service |
| Algorithm registry | Store immutable versions/configurations, lifecycle state, checksums, effective dates, approval links, active pointer | Evaluate candidates or mutate published versions | Matching and evaluation services |
| Matching application service | Load authoritative profile/catalogue snapshots and active version; call engine; persist prediction snapshot | Embed weights or accept client identity/version authority | Repositories, canonical engine |
| Evaluation/backtest domain | Replay labeled snapshots; compute ranking, calibration, bootstrap interval, fairness/sensitivity/drift slices | Activate a version or silently mutate evidence | Evaluation service, immutable datasets |
| Accuracy Lab application service | Create jobs, run/dispatch evaluation, assemble evidence, record review, promote/rollback atomically | Let UI directly update activation state | Job, registry, evidence, audit repositories |
| Identity/reconciliation service | Resolve actor, issue anonymous identity, authorize roles, merge anonymous state exactly once | Trust `userKey`, email, or role in a request body | Session/auth provider, user/profile repositories |
| Messaging domain/service | Threads, participants, messages, read/delivery state, moderation/audit metadata | Treat AI advisor chat as durable human messaging | Thread/message/outbox repositories |
| Catalogue governance | Version programme records, provenance, publication/effective state, validation | Let scoring consume arbitrary staff drafts | Catalogue/version repositories |
| Pilot policy | Enforce cohort/region/version/feature eligibility and operational limits | Rely on client feature hiding | Identity, feature configuration, audit |
| Telemetry/audit | Correlation IDs, operational metrics, security/audit events, model/version dimensions | Put user IDs or sensitive profile values in metric labels | All application services |

## Canonical Match Contract

Create the engine in a new cohesive directory such as `apps/web/lib/match-intelligence/`; initially adapt surviving logic rather than deleting it. The public contract should be serializable and strict:

```typescript
type MatchRequest = {
  requestId: string;
  asOf: string;
  student: NormalizedStudentSnapshot; // no protected audit attributes
  programme: ProgrammeSnapshot;
  context: MatchContext;
};

type MatchConfiguration = {
  schemaVersion: 1;
  algorithmVersion: string;
  status: "draft" | "active" | "retired";
  weights: ComponentWeights;
  thresholds: MatchThresholds;
  confidencePolicy: ConfidencePolicy;
  tieBreakPolicy: TieBreakPolicy;
};

type MatchResult = {
  algorithmVersion: string;
  configurationDigest: string;
  componentScores: {
    access: number;
    completion: number;
    financialStress: number;
    environmentSupport: number;
    climateRisk: number;
    psychologicalIsolationRisk: number;
  };
  scholarFit: number;
  matchBand: string;
  confidence: { lower: number; point: number; upper: number; basis: string[] };
  reasons: Explanation[];
  warnings: DataQualityWarning[];
};
```

Determinism requires an explicit `asOf`, stable ordering/tie-break rules, normalized numeric handling, no random calls, and no implicit current-time or mutable global configuration. If bootstrap confidence uses randomness in evaluation, accept and record a seed; do not introduce randomness into live ranking.

The version identifies executable scoring semantics; the configuration digest identifies the exact data-driven weights/thresholds. Both belong on every result. Store structured explanations, not only prose, so UI wording can evolve without changing evidence.

### Migration strategy

1. Freeze the current outputs as golden fixtures.
2. Wrap `preference-matching.ts`, adaptive signals, prediction signals, and relevant `platform.ts` logic behind adapters that produce the canonical result.
3. Characterize intentional discrepancies against fixtures.
4. Move one component at a time into pure engine functions.
5. Make all consumers call `MatchingService`; remove legacy direct calls only after parity and integration tests pass.

Do not maintain a “new” and “old” student-facing score indefinitely. Shadow computation may compare them, but only one version is authoritative per prediction.

## Versioned Configuration and Audit Evidence

Use immutable records and append-only evidence:

```text
algorithm_versions
  id, semantic_version, engine_schema, code_revision, created_at
algorithm_configs
  id, algorithm_version_id, config_json, digest, lifecycle_state, created_by
algorithm_activations
  id, config_id, effective_from, effective_to, approved_review_id
evaluation_datasets
  id, schema_version, source/provenance, cohort definition, digest
evaluation_runs
  id, config_id, dataset_id, seed, status, metrics_json, started/finished_at
evaluation_slices
  run_id, dimension, bucket, sample_size, metrics_json, confidence_json
reviews
  id, subject_type/id, reviewer_id, decision, rationale, created_at
audit_events
  id, actor_id, action, subject_type/id, before_digest, after_digest, correlation_id
```

Database permissions should deny update/delete on finalized runs, reviews, and audit events to the normal application role. Corrections are new superseding records. Export evidence bundles with checksums for release review, but keep the database as the source of truth.

Promotion is a command, not a generic update:

1. Lock the active-pointer row.
2. Verify candidate remains draft and the required completed evaluation/review belongs to its exact digest.
3. Re-check policy thresholds and reviewer authorization.
4. Close the previous activation and insert the new activation plus audit/outbox records in one transaction.
5. Commit; retry serialization conflicts safely.

PostgreSQL supports transaction isolation and row locks for precisely this concurrency boundary. Use optimistic `revision` checks for ordinary staff editing, and a transaction with an explicit lock for scarce state transitions such as activation.

## Transactional Repositories

Introduce narrow interfaces by aggregate rather than a generic `read()/write()` store:

```typescript
interface UnitOfWork { transaction<T>(fn: (tx: Repositories) => Promise<T>): Promise<T> }
interface ProfileRepository { getByUserId(id: UserId): Promise<Profile | null>; save(profile: Profile, expectedRevision: number): Promise<void> }
interface PredictionRepository { append(snapshot: PredictionSnapshot): Promise<void> }
interface MessageRepository { append(message: Message): Promise<void> }
interface AlgorithmRegistry { getActive(asOf: Date): Promise<AlgorithmConfig>; promote(command: PromotionCommand): Promise<void> }
```

Use PostgreSQL record-level tables as the durable pilot store. Preserve the JSON/HTTP/Blob adapter only for local fixtures and import/export during migration, not as the production write model. Migrate with an expand/backfill/verify/cutover sequence:

1. Add repositories and SQL schema without changing readers.
2. Import existing document data idempotently; retain source IDs and a migration ledger.
3. Dual-read in verification tools, not silently in product paths; compare counts/digests.
4. Cut writes by aggregate behind a feature flag.
5. Cut reads after reconciliation passes.
6. Retain signed snapshot export/restore as an operational capability.

Every externally retried command carries an idempotency key. When a committed mutation must trigger a notification or job, insert an outbox record in the same transaction and dispatch it asynchronously; consumers deduplicate by event ID. This prevents the current “record saved, analytics/notification failed” split-brain behavior.

## Outcome and Backtest Pipeline

Treat predictions and outcomes as separate time-indexed facts:

```text
authoritative profile + programme revision + active config
       -> immutable prediction snapshot
       -> student actions / verified outcomes (with source and observed_at)
       -> labeled, versioned evaluation dataset
       -> backtest job with fixed dataset/config/seed
       -> immutable metrics and slice artifacts
       -> human review
       -> promotion or rejection
```

Outcome ingestion must record provenance, verification status, observation window, and missingness. Never overwrite a historical prediction with the eventual outcome. Dataset builders should use an explicit cutoff to prevent future-information leakage.

Backtests are durable jobs with `queued/running/succeeded/failed/cancelled` state, lease/attempt metadata, and idempotent result publication. The pilot can run jobs in the web process only for development; production should use a worker process or managed queue once jobs exceed request duration. The job payload references dataset/config IDs and digests rather than embedding mutable live data.

Accuracy Lab reads persisted evidence. It never calculates authoritative metrics in the browser. Promotion controls are server-authorized and require a completed evidence bundle, human rationale, and step-up confirmation if the identity provider supports it.

## Draft-versus-Active Governance

Use explicit state machines rather than Boolean `published` fields:

```text
draft -> in_review -> approved -> active -> retired
   \         \           \
    rejected  changes_requested  superseded
```

Only valid transition commands are exposed. Editing an approved/active record clones it into a new draft. This pattern applies to algorithm configuration, criteria, and programme revisions, while each domain may have different approval policy. Database constraints protect unique digests and at most one applicable activation per effective interval; application services enforce richer transition rules.

The staff preview endpoint requires an explicit draft ID and returns a visible “preview” marker. Student routes resolve only the active version selected by server-side pilot policy. This prevents draft leakage through shared cache keys or client parameters.

## Identity and Reconciliation

Follow a centralized data-access layer: route handlers are public API boundaries and must authenticate and authorize independently of UI gates. Never accept a user ID, staff role, or pilot cohort from client JSON as authority.

Anonymous continuity:

1. Server issues a random opaque anonymous-session ID in a secure, HTTP-only, same-site cookie; storage uses only a hash/opaque ID.
2. Anonymous writes are scoped to allowed low-risk features and rate-limited.
3. On authentication, the reconciliation service locks the anonymous session, verifies it has not been claimed, merges allowed records using deterministic rules, records conflicts/audit evidence, and marks it claimed in one transaction.
4. The client clears local mirrors only after the server acknowledges reconciliation.

Prefer account state over browser state after sign-in. Browser storage can hold non-sensitive UI drafts, but must not be the authoritative profile, shortlist, match, message, or consent record. Fix the durable OAuth subject mapping before adding more account-owned data.

Database row-level security can provide defense in depth for per-user tables, but it does not replace server authorization and must be tested for policy/concurrency behavior. Separate roles for migration, worker, application, and read-only analysis reduce blast radius.

## Messaging Architecture

Implement human/support messaging separately from the AI advisor:

```text
threads(id, subject, status, created_by, revision)
thread_participants(thread_id, user_id, role, joined_at, left_at)
messages(id, thread_id, sender_id, body, client_message_id, created_at, edited_at)
message_receipts(message_id, user_id, delivered_at, read_at)
moderation_events(id, message_id/thread_id, actor_id, action, reason)
notification_outbox(id, message_id, channel, state, attempts)
```

Authorize membership on every read/write, paginate by a stable cursor, enforce content/attachment limits, and deduplicate sends by `(sender_id, client_message_id)`. Initially support in-app polling or revalidation; real-time delivery can be added behind the same repository/service contract. Email/SMS notifications are outbox consumers and must not contain sensitive message bodies by default.

For minors and support workflows, include reporting/blocking, staff audit access by explicit role, retention/deletion policy, and crisis/escalation copy. Do not imply that the AI advisor is a human or silently merge its conversation into counselor threads.

## Pilot Boundary

Create a server-owned `pilot_enrollments` model with cohort, consent status/version, guardian requirement/status where applicable, region, start/end, assigned staff, and enabled capabilities. A `PilotPolicy` service makes eligibility decisions and logs denials/overrides.

For the 25–50 user pilot:

- one approved algorithm version per cohort unless a documented experiment is active;
- verified catalogue scope and explicit “data as of” timestamps;
- invite-only accounts and staff allowlist backed by durable role records;
- rate limits and body limits on all mutation/AI endpoints;
- consent, export, deletion, retention, and incident workflows tested before real data;
- dashboards for errors, queue age, promotion events, reconciliation failures, message abuse reports, and recommendation latency;
- feature flags default off outside enrolled cohorts.

These controls are architecture, not only an operations checklist: each is represented by stored state, authorization policy, and tests.

## Recommended Build Order

1. **Characterization and security containment.** Golden tests for surviving scores; schema validation/body limits; session-derived identity on existing APIs; fix OAuth durable ID; correlation IDs. This prevents further unsafe data while foundations move.
2. **Canonical match contract.** Implement pure versioned engine and legacy adapters; make recommendations, simulations, and previews converge on it; persist prediction snapshots.
3. **Transactional persistence and reconciliation.** Add PostgreSQL schema/repositories, migration tooling, idempotency/outbox, anonymous claim flow; cut over account/platform aggregates incrementally.
4. **Governed catalogue and algorithm registry.** Immutable revisions, provenance, explicit workflows, active pointer, audit evidence, rollback.
5. **Outcome/backtest pipeline and Accuracy Lab.** Labeled datasets, jobs, metrics/slices/confidence, review and promotion gate. Promotion follows evidence, not the reverse.
6. **Recovered experiences.** Build Game of Five against the canonical profile/match services; build durable messaging against identity/repositories. Avoid introducing new state islands.
7. **Pilot safety and launch verification.** Cohort policy, consent/retention, accessibility/browser/concurrency/load/fairness testing, observability, incident/runbook rehearsal.
8. **Scaling after evidence.** Add worker/queue, caches, realtime messaging, read replicas or analytics store only when pilot measurements show the need.

This order deliberately puts identity, score reproducibility, and transactional integrity ahead of feature recovery because every recovered experience depends on them.

## Anti-Patterns to Avoid

### Big-bang rewrite
Replacing the working monolith would discard known behavior and delay validation. Use strangler-style boundaries and cut over one use case at a time.

### Generic repository or JSON column for everything
It recreates whole-document coupling inside a database. Use domain repositories and relational constraints; JSON is appropriate for immutable config/evidence payloads alongside indexed identity/state columns.

### Mutable “current algorithm” row
It destroys reproducibility. Store immutable versions and a temporal activation pointer.

### Browser-side evaluation or promotion
It is untrusted and non-auditable. Compute evidence and enforce transitions on the server.

### Protected traits in a shared profile passed to the scorer
Even if weights are zero today, the boundary permits accidental use. Use distinct operational and audit schemas, stores/permissions, and tests.

### Microservices before pilot load
They add distributed consistency and deployment failure modes while the team is recovering behavior. A modular monolith plus worker seam is sufficient.

### Metrics labeled by student or raw programme identifiers
High-cardinality/sensitive labels create cost and privacy risk. Put identifiers in access-controlled logs/traces when justified; keep metrics aggregated by route, status, model version, and bounded cohort.

## Scaling Path

| Concern | Pilot (25–50) | ~10K users | ~1M users |
|---|---|---|---|
| Web architecture | One Next.js deployment, modular monolith | Horizontally scaled stateless web | Split only measured hotspots; keep domain contracts |
| Data | Managed PostgreSQL, indexed record tables | Connection pooling, partition large events, read replicas if measured | Partition/shard by tenant/user where justified; dedicated analytical store |
| Matching | Request-time pure scoring, cached catalogue/config | Cache versioned inputs/results; batch reranks | Dedicated stateless scoring service only if independent scaling/SLO requires it |
| Backtests | Small worker or managed job | Queue + autoscaled workers; object evidence bundles | Distributed batch compute and columnar analytical store |
| Messaging | Poll/revalidate, transactional outbox | Realtime gateway/pub-sub; notification workers | Partitioned event stream and regional delivery |
| Analytics | Bounded events and precomputed pilot metrics | Async aggregates and warehouse export | Streaming ingestion and governed warehouse/lakehouse |
| Audit | PostgreSQL append-only tables + signed exports | Partition/archive and separate read role | Tamper-evident archive, long-term governed storage |

Scale triggers should be measured: p95 latency, database lock/connection pressure, queue age, dataset size, event volume, and operational ownership—not speculative user counts alone.

## Confidence Assessment

| Finding | Confidence | Basis |
|---|---|---|
| Retain a modular monolith during recovery | HIGH | Existing architecture and pilot scale; reduces migration surface |
| Replace whole-document production writes with transactional repositories | HIGH | Confirmed lost-update/multi-write defects; PostgreSQL transaction/locking semantics are documented |
| Centralize authorization in DAL/application services | HIGH | Existing spoofable identity paths; current Next.js official guidance |
| Immutable model/config/evidence with human promotion | HIGH | Reproducibility need in PRD and NIST TEVV/governance guidance |
| PostgreSQL as production system of record | MEDIUM | Strong semantic fit; final managed vendor, ORM/query layer, and operational constraints are not yet selected |
| Worker/queue after initial synchronous test harness | HIGH | Pilot can start small, but durable long-running job semantics are needed before production backtests |
| Row-level security as defense in depth | MEDIUM | Supported by PostgreSQL; application-role design and policy tests need phase-specific validation |
| Polling before realtime messaging | MEDIUM | Appropriate pilot simplification; user expectations and support SLAs need validation |

## Phase-Specific Research Flags

- **Database implementation:** choose managed PostgreSQL provider, migration tool, query layer, pooling/runtime compatibility, backup/restore, and regional residency based on deployment constraints.
- **Evaluation metrics:** define exact ranking/calibration/fairness metrics, sample-size suppression, bootstrap method, and promotion thresholds with domain/statistical review.
- **Minors/privacy:** obtain jurisdiction-specific legal review for consent, guardian flows, retention, messaging moderation, and protected audit data before pilot.
- **Messaging:** validate counselor workflow, safeguarding escalation, notification channels, and response-time expectations.
- **Programme provenance:** define authoritative sources, refresh cadence, conflict policy, and quality grades for every pilot geography.

## Sources

- **HIGH:** [Next.js authentication and authorization guide](https://nextjs.org/docs/app/guides/authentication) — Route Handlers are public-facing API boundaries; use a centralized data-access layer, session verification, role checks, and DTOs.
- **HIGH:** [PostgreSQL transaction characteristics and isolation](https://www.postgresql.org/docs/current/sql-set-transaction.html) — transaction visibility, serializable conflict behavior, and retry implications.
- **HIGH:** [PostgreSQL explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html) — row/table locking for serialized state transitions.
- **HIGH:** [PostgreSQL row security policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) — per-row policy behavior, default deny, and concurrency caveats.
- **HIGH:** [PostgreSQL data-definition and constraints](https://www.postgresql.org/docs/current/ddl.html) — relational integrity primitives supporting version and workflow records.
- **HIGH:** [NIST AI Resource Center](https://airc.nist.gov/) and [AI RMF 1.0](https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=936225) — governance, testing/evaluation/verification/validation, documentation, monitoring, and human oversight framing.
- **HIGH:** [OpenTelemetry signals](https://opentelemetry.io/docs/concepts/signals/) and [log correlation specification](https://opentelemetry.io/docs/specs/otel/logs/) — correlated traces, metrics, and logs.
- **HIGH:** [OpenTelemetry metrics](https://opentelemetry.io/docs/concepts/signals/metrics/) — metrics semantics and the operational/privacy risk of high-cardinality attributes.

## Gaps

The uploaded PRD establishes recovery scope, but it does not determine the production database vendor, legal policy, evaluation acceptance thresholds, message-support staffing model, or authoritative programme-data contracts. Those are roadmap gates, not details to infer silently. The architecture above preserves room to decide them without changing the canonical domain contracts.

