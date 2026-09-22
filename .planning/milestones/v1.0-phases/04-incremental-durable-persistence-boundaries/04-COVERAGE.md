---
phase: 04-incremental-durable-persistence-boundaries
status: complete
updated: 2026-08-29
requirements: [DATA-01, DATA-02]
evidence_scope: local-and-mocked-non-production
---

# Phase 4 Coverage Matrix

This audit traces the roadmap goal, requirements, locked decisions, research findings, adapters, domains, recovery compatibility, and plan-authored threats to implementation and executable evidence. It deliberately does not claim production or live-provider validation.

## Roadmap Goal and Success Criteria

| Source item | Implementation evidence | Automated evidence | Status |
|---|---|---|---|
| Goal: replace silent last-writer-wins behavior incrementally | `data-store.ts` exposes opaque versioned reads and conditional writes; bounded modules compose named domain changes over that seam. | Focused eight-suite Phase 4 run: 76/76 tests passed. | Complete |
| SC1: stale changes preserve current data and return conflict/retry | Programme and student replacements attempt once; stable-ID operational appends alone may retry once; recovery apply is one conditional attempt. | `data-store.test.ts`, `student-records.test.ts`, `operational-records.test.ts`, `platform-store.test.ts`, `data-recovery.test.ts`, route suites. | Complete |
| SC2: student, programme, and operational records use bounded operations | `student-records.ts`, `programme-records.ts`, and `operational-records.ts` own the migrated mutation contracts; `platform-store.ts` delegates through operational policies. | Source guard in `data-store.test.ts` plus domain suites. | Complete |
| SC3: migrate one high-risk boundary at a time while preserving adapters and recovery | Plans 04-01 through 04-04 migrated programme, student, operational/platform, then recovery in sequence. | JSON/HTTP/Blob adapter tests, 10/10 HTTP service tests, and Phase 3 recovery regressions. | Complete |

## Requirement Traceability

| Requirement | Domain / seam | Behavior proved | Exact evidence |
|---|---|---|---|
| DATA-01 | Programme | Entity revision and provider CAS form one conflict-safe save/delete; stale route operations return safe `409` without erasing the winner. | `apps/web/__tests__/lib/data-store.test.ts`; `apps/web/__tests__/api/admin-programmes.test.ts` |
| DATA-01 | Student | Account, onboarding, shortlist IDs, and shortlist plans are single-attempt conditional replacements; shortlist intent commits atomically. | `apps/web/__tests__/lib/student-records.test.ts`; `apps/web/__tests__/api/account-guest-routes.test.ts` |
| DATA-01 | Operational/platform | Stable-ID append families preserve interleaved writes with at most one retry; replacements surface conflict and never replay blindly. | `apps/web/__tests__/lib/operational-records.test.ts`; `apps/web/__tests__/lib/platform-store.test.ts` |
| DATA-01 | Recovery | A provider-version race after signed-plan validation returns `recovery-state-changed`, performs no stale overwrite, and records no false success. | `apps/web/__tests__/lib/data-recovery.test.ts`; `apps/web/__tests__/api/admin-data-routes.test.ts` |
| DATA-01 | JSON adapter | Cross-process exclusive lock, version re-read, same-directory durable temp write, and atomic rename allow exactly one stale/first-create winner. Lock unavailability never causes an unconditional write. | `apps/web/__tests__/fixtures/json-cas-worker.ts`; `apps/web/__tests__/lib/data-store.test.ts` |
| DATA-01 | HTTP adapter | Strong ETag reads plus `If-Match`/`If-None-Match` writes return `412` without mutation on mismatch. | `services/http-data-service/test/server.test.mjs`; `apps/web/__tests__/lib/data-store.test.ts` |
| DATA-01 | Vercel Blob adapter | Existing writes use `ifMatch`; first create disables overwrite and omits `ifMatch`; precondition/provider conflicts normalize to no-write conflict. | Mocked Blob cases in `apps/web/__tests__/lib/data-store.test.ts` |
| DATA-02 | Programme | Named bounded save/delete owns programme plus audit mutation. | `apps/web/lib/server/programme-records.ts`; programme/store tests |
| DATA-02 | Student | Named bounded account/profile/shortlist operations mutate the server-selected student slice. | `apps/web/lib/server/student-records.ts`; student and account-route tests |
| DATA-02 | Operational | Named lifecycle, audit, community, outcome, platform append, and replacement policies own mutation and retry classification. | `apps/web/lib/server/operational-records.ts`; `apps/web/lib/server/platform-store.ts`; operational/platform tests |
| DATA-02 | Recovery compatibility | Recovery remains a deliberately bounded whole-document application seam, but its final apply and compatibility helpers are conditional and non-retrying. | `apps/web/lib/server/data-recovery.ts`; recovery/store/admin-data tests |

## Locked Context Decisions

| Decision group | Evidence | Status |
|---|---|---|
| Explicit conflict/no silent loss | Typed `PersistenceConflictError`, programme conflict contract, safe student `409`, exact operational policy, recovery-state-changed mapping. | Satisfied |
| Incremental bounded migration | Four ordered implementation summaries prove programme tracer, student expansion, operational/platform expansion, recovery compatibility. | Satisfied |
| Retain Next.js/Auth.js/Vercel and port/adapters | No platform or dependency replacement; JSON, HTTP, and Blob remain supported behind one opaque version contract. | Satisfied |
| Preserve Phase 3 recovery | Signed envelopes, actor/state binding, count-only preview, one-write apply, retention, holds, audit, and idempotent outcomes remain in the recovery suites. | Satisfied |
| No production work | Only source, local tests, mocked Blob SDK behavior, local HTTP fixture, documentation, typecheck, lint, and build are used. | Satisfied |
| Programme tracer first | Plan 04-01 strengthened the existing programme revision/409 boundary before expanding to other domains. | Satisfied |

## Research Architecture, Pitfalls, and Test Map

| Research item | Resolution and evidence | Status |
|---|---|---|
| Opaque adapter version outside application data | `VersionedScholarScoutData` keeps provider metadata out of `ScholarScoutData`, recovery envelopes, exports, and audit payloads. | Covered |
| Conditional port plus compatibility seam | `readVersionedScholarScoutData` / `writeVersionedScholarScoutData` provide CAS; source guard prevents migrated modules from importing `writeScholarScoutData`. | Covered |
| JSON independent-process race | OS-exclusive sibling lock and worker-process barrier tests cover stale update, first create, readability, and unavailable-lock no-write behavior. | Covered |
| HTTP lost-update and first-create races | Strong ETag, `If-Match`, and `If-None-Match: *` are implemented and tested by the service and web adapter. | Covered |
| Blob update and first-create mapping | Mocked SDK coverage proves `ifMatch`, no-overwrite create, and precondition conflict normalization. | Covered, mocked only |
| Retry only duplicate-safe stable-ID appends | Exact allowlist: privileged audit, recovery lifecycle/outcome, feed interaction, analytics event, referral, and share; all replacements/unstable-ID operations deny retry. | Covered |
| Domain and audit must commit together | Programme and operational tests assert one conditional mutation contains both domain state and required evidence. | Covered |
| Recovery digest/retention must not change | Provider version remains external; only the final application write is conditional; Phase 3 regression selection remains green. | Covered |
| Blob cache is not concurrency state | Adapter uses provider ETag preconditions rather than a content hash as authority for live Blob updates. | Covered in source/mocks |
| Safe route errors | Programme may return its already-authorized current record; student/recovery conflicts expose only stable safe categories/actions. | Covered |
| Wave 0 gaps from research | Adapter, route, student, operational/platform, and recovery race files now exist and execute. | Closed |

## Retry Policy Inventory

| Policy | Families | Attempts | Evidence |
|---|---|---:|---|
| Stable-ID duplicate-safe append | privileged audit, recovery lifecycle, recovery outcome, feed interaction, analytics, referral, share | 2 maximum | `operational-records.test.ts` covers allowlist, duplicate no-op, exhaustion, and no third attempt. |
| Non-commutative / replacement | guest lifecycle/migration, incident hold, community/outcome replacement, account/profile/onboarding/shortlist, programme, simulation, memory, decision, recovery apply | 1 | `operational-records.test.ts`, `platform-store.test.ts`, student/programme/recovery suites. |

## Phase 3 Recovery Regression Inventory

| Preserved behavior | Evidence |
|---|---|
| Signed envelopes and actor/current-state-bound plans | `data-recovery.test.ts` |
| Count-only previews, exact confirmation, bounded input | `data-recovery.test.ts`; `admin-data-routes.test.ts` |
| One-write apply and pre-change backup | `data-recovery.test.ts`; `data-store.test.ts` |
| Idempotent outcomes and privacy-minimal lifecycle/audit evidence | `data-recovery.test.ts`; `admin-data-routes.test.ts` |
| Retention and incident hold/release | `data-recovery.test.ts`; `data-store.test.ts` |
| Authorized route behavior and safe conflict response | `admin-data-routes.test.ts` |
| HTTP fixture compatibility | `services/http-data-service/test/server.test.mjs` — 10/10 passed |

## Threat Register Disposition

| Threat | Mitigation evidence | Status |
|---|---|---|
| T-04-01 through T-04-14 (implementation plans) | Adapter/domain/recovery implementations and focused suites in Plans 04-01 through 04-04. | Mitigated; subject to `$gsd-secure-phase 4` audit |
| T-04-15 Repudiation: misleading validation evidence | Exact commands, counts, dates, failures, and limitations are recorded in `04-VALIDATION.md`. | Mitigated |
| T-04-16 Tampering: incomplete source coverage | This matrix audits every roadmap domain, adapter, recovery seam, locked decision, research test-map item, and exclusion. | Mitigated |
| T-04-17 Elevation: production boundary crossed | No production credentials, environment, data, migration, or deployment were accessed or changed. | Mitigated |
| T-04-SC package tampering | No install was run and dependency manifests/lockfile are unchanged by Phase 4 Plan 05. | Mitigated |

## Explicit Exclusions and Residual Limits

- No wholesale datastore or application rewrite was performed.
- Analytics separation and background jobs (`DATA-04`, `DATA-05`) remain deferred.
- Phase 5 school, community, and Western New York product work remains out of scope.
- No production migration, deployment, environment, credentials, or data were used.
- Vercel Blob evidence is source-level and mocked against the pinned SDK contract; it is not a live-provider or production concurrency test.
- JSON CAS protects writers that honor the Scholar Scout sibling-lock protocol on the same filesystem; it is not a distributed lock across independent filesystems.
- The compatibility whole-document export remains for recovery and unmigrated compatibility callers; migrated programme, student, operational/platform, and recovery modules are guarded from importing it.

## Recorded Focused Gate

On 2026-08-29, the Plan 04-05 focused web command passed 8 suites and 76 tests. The HTTP data-service command passed 1 suite and 10 tests. No missing in-scope evidence was found.
