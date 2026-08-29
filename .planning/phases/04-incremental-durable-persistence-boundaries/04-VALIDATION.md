---
phase: 04-incremental-durable-persistence-boundaries
status: pending
nyquist: enabled
created: 2026-08-28
requirements: [DATA-01, DATA-02]
---

# Phase 4 Validation Contract

This is the required pre-execution Nyquist contract. It defines the tests that must exist before each behavior is considered implemented. Executors update results in place; they do not weaken or delete a row to obtain a green phase.

## Resolved Research Decisions

| Research question | Executable decision | Proof required |
|---|---|---|
| Atomic first creation for Vercel Blob 2.6.1 | Represent absence as an internal opaque port token. Existing Blob writes use `allowOverwrite: true` with `ifMatch`. First creation uses `allowOverwrite: false` and no `ifMatch`; an already-existing pathname and `BlobPreconditionFailedError` both normalize to conflict with no write. | Mocked adapter test runs two absent-version creators and proves exactly one applies; a separate stale-ETag test proves `ifMatch` is passed and mismatch is no-write conflict. |
| Which operational appends retry | Retry exactly once (two total CAS attempts) only for stable-ID, duplicate-safe appends: privileged audit, recovery lifecycle/outcome, feed interaction, analytics event, referral, and share. Never retry guest lifecycle/migration, incident-hold replacement, account/profile/onboarding/shortlist, programme, simulation, memory, decision, or recovery apply. | Operation-policy tests cover every allowlisted family, representative denylisted replacements, duplicate-ID no-op, retry exhaustion, and no third attempt. |
| JSON cross-process CAS | Use an OS-exclusive sibling lock file (`fs.open(..., 'wx')`), re-read and compare the normalized-content version while holding the lock, then fsync a same-directory temp file and atomically rename before releasing the lock. Lock timeout is unavailable; stale locks are never silently broken. | Spawn two independent Node processes/store instances against one file for stale-update and absent-create barriers; exactly one applies and the winner remains readable/valid. |

No user choice remains in these questions. All choices preserve the locked incremental/no-production boundary.

## Wave 0 Test Scaffolds

Wave 0 is performed inside each plan's first TDD action before production edits. A scaffold must fail for the intended missing behavior, not from syntax, import, or fixture errors.

| Plan/task | Test file(s) that must exist first | Required red behavior |
|---|---|---|
| 04-01 Task 1 | `apps/web/__tests__/lib/data-store.test.ts`, `apps/web/__tests__/api/admin-programmes.test.ts` | Interleaved programme writers currently both overwrite or fail to expose provider conflict through 409. |
| 04-01 Task 2 | `apps/web/__tests__/fixtures/json-cas-worker.ts`, `apps/web/__tests__/lib/data-store.test.ts`, `services/http-data-service/test/server.test.mjs` | Cross-process JSON, HTTP stale/first-create, and Blob stale/first-create cases fail before CAS implementation. |
| 04-02 Task 1 | `apps/web/__tests__/lib/student-records.test.ts` | Account/onboarding interleavings currently allow full-document overwrite. |
| 04-02 Task 2 | `apps/web/__tests__/lib/student-records.test.ts`, `apps/web/__tests__/api/account-guest-routes.test.ts` | Shortlist IDs/plans are currently separate writes and routes lack safe persistence-conflict mapping. |
| 04-03 Task 1 | `apps/web/__tests__/lib/operational-records.test.ts` | Lifecycle/audit operations lack retry classification and atomic conflict coverage. |
| 04-03 Task 2 | `apps/web/__tests__/lib/platform-store.test.ts` | Platform appends/replacements can lose interleaved writes and lack allowlist/denylist retry proof. |
| 04-04 Task 1 | `apps/web/__tests__/lib/data-recovery.test.ts` | A provider version change between recovery validation and apply is not yet a tested no-write conflict. |
| 04-04 Task 2 | `apps/web/__tests__/lib/data-store.test.ts` | Migrated domains have no regression gate preventing direct unconditional write reintroduction. |
| 04-05 Tasks 1-2 | Existing focused suites plus this document | Coverage/evidence remains pending until all commands and source-audit rows are recorded. |

## Plan/Task Verification Matrix

| Plan/task | DATA-01/02 behavior | Focused automated command |
|---|---|---|
| 04-01 T1 | Programme entity plus audit is one CAS commit; second writer gets safe 409/no overwrite. | `corepack pnpm --filter @scholar-scout/web run test -- --runInBand __tests__/lib/data-store.test.ts __tests__/api/admin-programmes.test.ts` |
| 04-01 T2 | JSON cross-process lock/CAS, HTTP ETag/If-Match/If-None-Match, Blob ifMatch/no-overwrite first create. | `corepack pnpm --filter @scholar-scout/http-data-service run test && corepack pnpm --filter @scholar-scout/web run test -- --runInBand __tests__/lib/data-store.test.ts` |
| 04-02 T1 | Account/onboarding bounded ownership-safe non-retrying writes. | `corepack pnpm --filter @scholar-scout/web run test -- --runInBand __tests__/lib/student-records.test.ts __tests__/api/account-guest-routes.test.ts` |
| 04-02 T2 | Shortlist and plans commit atomically; conflict maps to safe 409. | Same focused student/route command. |
| 04-03 T1 | Operational lifecycle/audit atomicity and exact retry allowlist. | `corepack pnpm --filter @scholar-scout/web run test -- --runInBand __tests__/lib/operational-records.test.ts __tests__/lib/data-store.test.ts` |
| 04-03 T2 | Stable-ID platform appends retry once; replacements never retry. | `corepack pnpm --filter @scholar-scout/web run test -- --runInBand __tests__/lib/operational-records.test.ts __tests__/lib/platform-store.test.ts` |
| 04-04 T1 | Stale recovery apply is no-write conflict while every Phase 3 guarantee remains green. | `corepack pnpm --filter @scholar-scout/web run test -- --runInBand __tests__/lib/data-recovery.test.ts __tests__/lib/data-store.test.ts __tests__/api/admin-data-routes.test.ts` |
| 04-04 T2 | Compatibility inventory and adapter runbooks match tested CAS behavior. | Focused recovery/store command plus HTTP service test. |
| 04-05 T1 | Every roadmap domain, adapter, recovery seam, source item, and threat has evidence. | All focused suites listed by Plan 04-05. |
| 04-05 T2 | Repository quality and build gate remain green. | `corepack pnpm test --runInBand && corepack pnpm typecheck && corepack pnpm lint && corepack pnpm build:vercel` |

## Cross-Process JSON Acceptance Protocol

The JSON worker fixture must create independent operating-system processes, not two objects in one Jest process. Parent and workers use barriers so both report the same initial opaque version before either attempts commit. The result assertions are:

1. Exactly one worker returns `applied` and one returns `conflict` for the same existing version.
2. Exactly one worker returns `applied` and one returns `conflict` for the absent token.
3. The persisted file parses, normalizes, and contains only the winning mutation.
4. Lock acquisition timeout returns unavailable and never performs an unconditional write.
5. A worker exit cannot cause another process to break/delete the lock based only on elapsed time.

## Full Phase Gates

- Focused adapter, programme, student, operational/platform, recovery, and route suites all pass.
- `corepack pnpm --filter @scholar-scout/http-data-service run test` passes.
- `corepack pnpm test --runInBand` passes.
- `corepack pnpm typecheck` passes.
- `corepack pnpm lint` passes with zero warnings.
- `corepack pnpm build:vercel` passes.
- Source inventory shows ordinary student, programme, operational, and platform mutations reach named bounded conditional operations.
- Phase 3 signed backup/restore/import, retention, hold, audit, route, and UI regression suites remain green.
- No production credential, data, environment, migration, or deployment is used.

## Completion Rule

Status may change from `pending` only when every matrix row has concrete green evidence and no critical/high threat remains open. After implementation, Phase 4 still requires `$gsd-secure-phase 4`, `$gsd-verify-work 4`, and goal verification before requirements are marked complete.
