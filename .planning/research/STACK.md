# Technology Stack: ScholarScout PRD Recovery

**Project:** ScholarScout PRD Recovery  
**Researched:** 2026-07-21  
**Scope:** Stack additions and changes required for the recovery milestone  
**Overall confidence:** HIGH for platform and database decisions; MEDIUM for package-version pins that must be resolved again when implemented

## Recommendation in One Sentence

Keep the existing Next.js application intact while first extracting a pure, versioned TypeScript matching package and replacing aggregate JSON/Blob persistence with PostgreSQL transactions; add schema validation, browser/accessibility tests, and OpenTelemetry-based operations before upgrading framework or authentication majors.

## Current Baseline to Preserve

| Technology | Current version | Decision | Rationale | Confidence |
|---|---:|---|---|---|
| Next.js App Router | 15.5.15 | Keep during core recovery; upgrade to 16.x only in a dedicated compatibility phase | 15.x is still Maintenance LTS, while 16.x is Active LTS. Mixing an application-framework migration with identity, persistence, and ranking recovery makes regressions harder to isolate. | HIGH |
| React | 18.x | Keep with Next.js 15; move to the Next.js 16-supported current release during that later upgrade | Avoid an unrelated rendering migration until critical journeys have browser coverage. | HIGH |
| TypeScript | 5.x strict | Keep and use for all model contracts | The canonical algorithm should be a framework-free, side-effect-free TypeScript package usable by the web app, backtests, and fixtures. | HIGH |
| Jest 30 | Keep temporarily for current web tests | Do not rewrite existing tests during recovery. Remove `ts-jest` if it is unused, or align its major before relying on it. | MEDIUM |
| NextAuth 4.24.14 | Stabilize first; evaluate Auth.js migration only after durable identity tests exist | First fix durable subject propagation, server-derived identity, authorization, and anonymous migration. A major auth migration is not the prerequisite for those controls. | HIGH |
| Node.js 20.x | Raise minimum to at least 20.9 now; schedule an LTS refresh with Next.js 16 | Next.js 16 requires Node 20.9+. Align local, CI, and production runtime metadata before framework upgrade. | HIGH |

The npm registry reported Next.js **16.2.10** as current on the research date, and Next.js lists 16.x as Active LTS and 15.x as Maintenance LTS. This is evidence for a planned upgrade, not permission to combine it with the initial recovery work.

## Required Stack Additions

### 1. Canonical Matching and Governance Package

Create a workspace package such as `packages/match-intelligence` with no React, Next.js, database, clock, randomness, or network dependency.

| Technology | Version policy | Purpose | Why | Confidence |
|---|---|---|---|---|
| TypeScript | Existing 5.x, lock exact compiler in the root lockfile | Versioned input/config/output types, pure scoring functions, explanation records, confidence and audit metadata | Determinism is primarily an architecture property. A pure package makes a model version reproducible in UI requests, batch backtests, and CI. | HIGH |
| Zod | Stable 4.x; resolve and lock the exact current patch when introduced | Runtime schemas for API requests, persisted model configurations, outcomes, and imports; optional JSON Schema export | TypeScript types disappear at runtime. Zod 4 is stable and has first-party JSON Schema conversion, allowing one governed contract to validate both runtime data and administrative forms. | HIGH |
| Canonical JSON + SHA-256 | Implement locally with sorted keys and Node `crypto`; do not add a scoring framework | Immutable configuration digest and prediction fingerprint | A model snapshot should identify algorithm code version, criteria version, data provenance, and exact configuration. Hashing canonical serialized data is simpler and more auditable than adding an ML platform. | HIGH |
| Seeded PRNG utility | Small local implementation or one narrowly reviewed dependency, with seed included in every stochastic artifact | Bootstrap confidence intervals and repeatable resampling | Production ranking itself should remain deterministic. Any backtest resampling must be repeatable from a recorded seed. | HIGH |

The package should expose separate types for `DraftModelVersion`, `EvaluatedModelVersion`, and `ActiveModelVersion` (or equivalent state-machine functions) so arbitrary admin input cannot be passed directly to live ranking. Protected traits must not be part of the rankable feature vector. Audit datasets may join protected-trait fields only inside evaluation boundaries.

### 2. Transactional Pilot Persistence

| Technology | Version policy | Purpose | Why | Confidence |
|---|---|---|---|---|
| PostgreSQL | Managed PostgreSQL 18.x, current minor (18.4 on research date); PostgreSQL 17.x is acceptable if the selected managed provider has a safer established offering | Accounts, identities, profiles, programme revisions, criteria/model versions, predictions, outcomes, messages, consent, audit events, idempotency keys, and evaluation runs | The existing whole-document adapters cannot prevent lost updates or make multi-record actions atomic. PostgreSQL supplies transactions, constraints, indexes, locks, JSONB where appropriate, and row security as defense in depth. | HIGH |
| Drizzle ORM + Drizzle Kit | Current stable 0.x resolved and pinned at implementation; do not adopt an unreleased v1 | Typed SQL access and reviewed, committed migrations | Drizzle keeps SQL and constraints visible, supports transactions/savepoints, and supports code-first generated migrations. This suits governance-heavy records better than hiding schema behavior. Its v1 remains roadmap work, so exact pre-1.0 pins and migration review are mandatory. | MEDIUM |
| PostgreSQL driver | Use the driver required by the chosen hosting model and supported by Drizzle; pin exact version | Pooled or serverless database connection | Choose after deployment topology is fixed. Use one adapter locally and in CI that exercises real PostgreSQL semantics; do not use SQLite as a substitute for concurrency tests. | HIGH |

Required database practices:

- Use normalized record-level tables, foreign keys, uniqueness and check constraints; reserve JSONB for immutable input/output snapshots and bounded metadata.
- Wrap shortlist updates, prediction creation, outcome recording, message delivery state, algorithm promotion, and audit event creation in transactions.
- Add idempotency keys to externally retried writes and optimistic version columns where human editors can conflict.
- Use append-only prediction, outcome, model-evaluation, approval, and audit records. Corrections create superseding records rather than rewriting evidence.
- Enforce tenant/user ownership in repositories and route authorization. PostgreSQL row-level security can be defense in depth, but application tests must not assume table owners or privileged service roles are restricted by RLS.
- Keep export/restore snapshots as an operational feature, not as the primary mutation model.

### 3. Authentication, Authorization, and Input Security

| Technology | Version policy | Purpose | Why | Confidence |
|---|---|---|---|---|
| Existing NextAuth 4 | Current locked 4.24.14 for stabilization | Session establishment during recovery | Retaining the current integration reduces change surface while durable account IDs, callback tests, session expiry, and route authorization are corrected. | HIGH |
| Zod 4.x | Same schema package used by domain contracts | Validate every route boundary, environment configuration, imports, and bounded metadata | Prevents malformed and unbounded payloads from reaching scoring, storage, or the OpenAI endpoint. | HIGH |
| Rate-limit backend | Provider-native durable limiter or PostgreSQL-backed limiter selected with production hosting | Registration, login, advisor/AI, messaging, imports, shares, and all mutations | In-memory counters do not work reliably across serverless instances. The limiter must fail safely and be integration-tested. | HIGH |

Do not add a custom authorization library initially. Implement small server-only guards (`requireUser`, `requireStaff`, `requireRole`) that derive the subject from the verified session and never accept a client `userKey`. Use opaque, signed anonymous-session IDs and a single transactional claim/migration operation at sign-in. Password credentials should not be opened to the pilot until verification, recovery, throttling, abuse monitoring, and an explicit credential-security review exist; managed OAuth/email identity is preferable for pilot operations.

### 4. Algorithm Evaluation and Backtesting

Use the canonical matching package in a Node CLI or workspace package such as `packages/algorithm-evaluation`; do not create a separate Python service for the pilot. One language and one scoring implementation eliminate cross-language drift.

| Technology | Version policy | Purpose | Why | Confidence |
|---|---|---|---|---|
| TypeScript/Node batch runner | Existing runtime | Frozen-dataset evaluation, model comparison, cohort/regime slicing, calibration buckets, ranking metrics, bootstrap intervals | Reuses exactly the production scorer and can emit immutable evaluation artifacts. | HIGH |
| Jest 30 or Node stable test runner | Preserve Jest for package tests; Node runner is acceptable for CLI-only tests | Golden fixtures, invariants, malformed/sparse profiles, regression tests | Existing Jest investment should be retained. Avoid a simultaneous test-runner migration. | HIGH |
| `fast-check` | Current stable resolved and pinned only if property-based tests prove useful | Invariants such as bounds, determinism, ordering stability, and protected-trait non-interference | Generated inputs can expose edge cases beyond fixtures, but golden datasets and explicit fairness tests remain authoritative. | MEDIUM |

Persist the following as records, not only dashboard calculations: dataset version/digest, scorer and criteria versions, seed, metric definitions, slice definitions, run parameters, code commit, results, reviewer decision, activation, and rollback target. Calculate metrics in pure functions and test them against hand-computed fixtures before displaying them in Accuracy Lab.

Do not add a generic ML experiment platform during the 25–50-student pilot. The product needs reproducible governance and transparent statistics, not an infrastructure-heavy model-training system. Reassess only when dataset size, model complexity, or multiple training pipelines justify it.

### 5. Browser, Accessibility, and Contract Testing

| Technology | Verified/current version | Purpose | Why | Confidence |
|---|---:|---|---|---|
| Playwright Test | 1.61.1 on research date | Chromium, Firefox, and WebKit journeys against a running production build | Covers registration/sign-in, onboarding migration, Game of Five, ranking explanations, shortlist, messaging, staff publishing, model promotion/rollback, export/deletion, and mobile navigation. | HIGH |
| `@axe-core/playwright` | Resolve current stable and lock exact patch with Playwright | Automated accessibility scans inside critical journeys | Playwright's official guidance uses this integration and explicitly says automated scans must be combined with manual and inclusive-user testing. | HIGH |
| Existing Testing Library | Keep | Component semantics and keyboard interaction | Fast feedback below browser level; not a substitute for end-to-end tests. | HIGH |
| PostgreSQL integration test instance | Same major as production | Transaction, isolation, migration, constraint, idempotency, and concurrency verification | An in-memory fake cannot validate the failure modes that caused aggregate-store data loss. | HIGH |

Add accessibility gates aligned to WCAG 2.2 AA, but maintain a manual checklist for keyboard-only navigation, focus restoration, zoom/reflow, screen-reader announcements, reduced motion, and comprehensibility. Automated accessibility tools detect only a subset of issues.

### 6. Monitoring and Production Operations

| Technology | Version policy | Purpose | Why | Confidence |
|---|---|---|---|---|
| Next.js instrumentation + `@vercel/otel` / OpenTelemetry API | Current versions compatible with the selected Next.js line | Request, database, advisor, ranking, and background-operation traces | Next.js officially supports an `instrumentation.ts` entry point and OpenTelemetry. This avoids locking domain instrumentation to one backend. | HIGH |
| Structured JSON logging | Prefer a tiny project wrapper first; add Pino only if log volume/serialization warrants it | Correlation IDs, stable event names, redaction, severity, model/version identifiers | Vercel runtime logs are limited and short-retention on lower plans. Structured fields make them queryable and portable to a drain. Never log student profiles, protected traits, messages, tokens, or raw advisor prompts. | HIGH |
| Vercel Observability + external alert/error backend | Enable before pilot; provider selected during deployment | Error rate, latency, failed jobs, database saturation, advisor quota, and model pipeline health | Vercel supplies runtime logs/observability, but retention and alert availability depend on plan. A pilot needs tested notification routing and adequate retention. | HIGH |

Minimum operational signals:

- HTTP error rate and p50/p95 latency by route pattern.
- Database connection, transaction retry, deadlock, migration, and idempotency-conflict counts.
- Recommendation requests by algorithm version, validation failures, latency, confidence/missing-data distribution, and fallback use—never raw sensitive inputs.
- Evaluation-run success/failure, model promotion/rollback, programme publication, privilege changes, export/deletion, consent, and authentication anomalies.
- Advisor request count, token/cost budget, latency, provider errors, and rate-limit rejections without prompt content.
- Synthetic smoke checks for sign-in, onboarding, recommendation, shortlist, and staff health; alerts must be exercised in rehearsal.

## Framework Upgrade Plan

Upgrade Next.js 15.5.15 to the current 16.x release only after the following are true:

1. Critical browser journeys pass on a production build.
2. Route boundaries have runtime schemas and authorization tests.
3. The canonical scorer has golden fixtures and deterministic fingerprints.
4. Persistence has PostgreSQL integration/concurrency tests.
5. The upgrade is its own atomic commit with the official codemod, Node minimum raised to 20.9+, React/types updated as a compatible set, and preview deployment verified.

This sequencing keeps the application on a supported Next.js release while preventing framework churn from obscuring data or model-recovery defects.

## Alternatives Considered

| Category | Recommended | Alternative | Why not now |
|---|---|---|---|
| Persistence | PostgreSQL record-level schema | Continue Vercel Blob/full JSON | No transactions, record-level concurrency, relational constraints, or efficient indexed evaluation queries. |
| ORM | Drizzle with reviewed SQL migrations | Prisma | Prisma is viable, but Drizzle's SQL-visible schema and thin query layer better fit explicit governance constraints; avoid changing if the deployment team already operates Prisma successfully. |
| Algorithm runtime | Pure TypeScript package | Python microservice/notebook scorer | Creates two implementations or a network dependency, increasing reproducibility and deployment risk at pilot scale. Python may be used offline for independent validation, never as an alternate source of truth. |
| Evaluation infrastructure | Versioned DB records + Node batch runner | MLflow or hosted ML platform | Operational weight is unjustified for a deterministic rules/statistics engine and tiny pilot dataset. |
| Authentication | Stabilize current NextAuth then migrate deliberately | Immediate Auth.js major migration | Does not itself solve spoofed identity, missing authorization, consent, throttling, or transactional anonymous migration and enlarges the first recovery phase. |
| Testing | Keep Jest, add Playwright + axe | Replace all tests with Vitest | A runner migration provides little product value and risks losing surviving coverage. |
| Monitoring | OpenTelemetry-compatible instrumentation | Vendor-only domain calls everywhere | OTel preserves backend choice and Next.js has official support. |
| Queue | Synchronous transactional outbox table first | Introduce Redis/queue immediately | Pilot scale does not require another stateful service. A transactional outbox provides durable work claims and can feed a queue later. |

## Version and Supply-Chain Policy

- Commit one authoritative root npm lockfile; remove or explicitly prohibit the nested pnpm lock/workspace files after confirming they are unused.
- Use exact versions for production and test infrastructure in the lockfile. Re-resolve all `current stable` recommendations when their implementation phase starts, review release notes, and record the chosen version in the phase summary.
- Do not adopt beta, canary, release-candidate, or unreleased v1 packages for the pilot.
- Run clean-install, typecheck, lint, unit/integration, browser, accessibility, production build, migration, backup/restore, and dependency/security gates in CI.
- Produce a software bill of materials and enable automated dependency update/security review, but never auto-merge framework, ORM, authentication, or database-major changes.

## Phased Installation Guidance

Do not install all packages at initialization. Add dependencies only when the owning phase introduces executable tests and removes/replaces the fragile behavior.

```bash
# Canonical contracts and route validation
npm install zod --workspace @scholar-scout/web

# Transactional persistence (exact driver chosen with hosting)
npm install drizzle-orm <postgres-driver> --workspace @scholar-scout/web
npm install -D drizzle-kit --workspace @scholar-scout/web

# Browser and accessibility gates
npm install -D @playwright/test @axe-core/playwright --workspace @scholar-scout/web
npx playwright install --with-deps

# Portable telemetry when the deployment backend is chosen
npm install @vercel/otel @opentelemetry/api --workspace @scholar-scout/web
```

## Roadmap Implications

1. **Contract and safety baseline:** canonical schemas, deterministic scorer, golden fixtures, protected-trait boundary, model fingerprinting.
2. **Transactional identity and persistence:** PostgreSQL schema/migrations, repository seam, session-derived identity, anonymous claim, validation, idempotency, audit ledger.
3. **Governed model and programme records:** criteria/model lifecycle, provenance, effective dates, approval, rollback, transactional outbox.
4. **Evaluation and Accuracy Lab:** frozen datasets, outcomes, metrics, slices, calibration, bootstrap intervals, comparisons, human activation gate.
5. **Recovered experiences:** Game of Five and durable messaging on the new identity/persistence foundation.
6. **Launch verification:** Playwright journeys, axe plus manual accessibility, performance/concurrency/security tests, consent/privacy controls, monitoring/alerts, backup/restore and pilot rehearsal.
7. **Framework modernization:** isolated Next.js 16/Auth.js evaluation or migration after behavioral protection; not on the critical path to restoring PRD functionality.

## Official Sources

- Next.js support policy (16.x Active LTS; 15.x Maintenance LTS): https://nextjs.org/support-policy — **HIGH**
- Next.js 16 upgrade guide and Node 20.9+ requirement: https://nextjs.org/docs/app/guides/upgrading/version-16 — **HIGH**
- Next.js installation/runtime and browser requirements: https://nextjs.org/docs/app/getting-started/installation — **HIGH**
- npm registry metadata for current Next.js 16.2.10: https://registry.npmjs.org/next/latest — **HIGH**
- PostgreSQL current documentation (18.4): https://www.postgresql.org/docs/current/ — **HIGH**
- PostgreSQL versioning/support policy: https://www.postgresql.org/support/versioning/ — **HIGH**
- PostgreSQL row security behavior and privileged-role caveats: https://www.postgresql.org/docs/current/ddl-rowsecurity.html — **HIGH**
- Drizzle transactions and savepoints: https://orm.drizzle.team/docs/transactions — **HIGH for capability; MEDIUM for exact pre-1.0 version choice**
- Drizzle migration fundamentals: https://orm.drizzle.team/docs/migrations — **HIGH for capability; MEDIUM for exact pre-1.0 version choice**
- Drizzle v1 roadmap (reason not to target unreleased v1): https://orm.drizzle.team/roadmap — **HIGH**
- Zod 4 stable package documentation: https://zod.dev/packages/zod — **HIGH**
- Zod JSON Schema support and stability notes: https://zod.dev/json-schema — **HIGH**
- Playwright accessibility guidance: https://playwright.dev/docs/accessibility-testing — **HIGH**
- npm registry metadata for Playwright Test 1.61.1: https://registry.npmjs.org/%40playwright/test/latest — **HIGH**
- Next.js instrumentation convention: https://nextjs.org/docs/app/guides/instrumentation — **HIGH**
- Next.js OpenTelemetry guide: https://nextjs.org/docs/app/guides/open-telemetry — **HIGH**
- Vercel Observability: https://vercel.com/docs/observability — **HIGH**
- Vercel runtime-log limits and retention: https://vercel.com/docs/logs/runtime — **HIGH**
- Vercel alerts availability: https://vercel.com/docs/alerts — **HIGH**

## Open Decisions for Phase Planning

- Select the managed PostgreSQL provider only after confirming preview-database workflow, point-in-time recovery, region, encryption, connection pooling, data-processing terms, and pilot budget.
- Decide whether production pilot credentials are OAuth-only, magic-link/email, or managed password credentials after the privacy/security review.
- Select observability retention and alert backend based on Vercel plan; baseline Vercel logs may be too short-lived for incident review.
- Define the authoritative programme-data sources and licensing/provenance model; stack changes cannot make hard-coded or unverified catalogue data launch-ready.

