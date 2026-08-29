---
phase: 04-incremental-durable-persistence-boundaries
status: complete
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

## Execution Evidence — 2026-08-29

All commands below ran from the repository root with the provisioned Node.js 20.20.2 and Corepack pnpm 10.34.5 toolchain. No install command was run.

### Focused Phase 4 concurrency gate

Command:

```text
corepack pnpm --filter @scholar-scout/web run test -- --runInBand __tests__/lib/data-store.test.ts __tests__/lib/student-records.test.ts __tests__/lib/operational-records.test.ts __tests__/lib/platform-store.test.ts __tests__/lib/data-recovery.test.ts __tests__/api/admin-programmes.test.ts __tests__/api/account-guest-routes.test.ts __tests__/api/admin-data-routes.test.ts
```

Result: **PASS** — 8 suites, 76 tests, 0 failures.

Command:

```text
corepack pnpm --filter @scholar-scout/http-data-service run test
```

Result: **PASS** — 1 suite, 10 tests, 0 failures. This includes authenticated access, absent-document behavior, first-create contention, malformed/unavailable reads, previous-document backup, and stale replacement preservation.

### Full repository test gate

The plan-specified `corepack pnpm test --runInBand` was attempted and could not be a valid cross-workspace invocation on this Windows host:

1. The root script's nested bare `pnpm` resolved the host fallback runtime (Node 24 / pnpm 11), which the repository engine gate correctly rejected.
2. Running its recursive expansion directly with `--runInBand` forwarded the Jest-only flag to Node's service test runners as a filename, so those runners correctly rejected it.

The semantically complete cross-workspace command was therefore run directly with the pinned toolchain and no framework-specific extra argument:

```text
corepack pnpm --recursive --if-present run test
```

The first run exposed that Jest was discovering the Plan 04-01 child-process worker fixture as a test suite. `apps/web/jest.config.ts` now excludes `__tests__/fixtures/` from test discovery; the worker remains compiled and exercised by `data-store.test.ts`.

Final result: **PASS** — web 43 suites / 272 tests, HTTP service 1 suite / 10 tests, webhook service 1 suite / 8 tests; **45 suites / 290 tests total**, 0 failures, 0 skipped, 0 snapshots.

### Typecheck

Command:

```text
corepack pnpm --recursive --if-present run typecheck
```

Result: **PASS** — strict web TypeScript and HTTP fixture validation completed with no errors.

### Zero-warning lint

Command:

```text
corepack pnpm --recursive --if-present run lint
```

Result: **PASS** — web ESLint completed with `--max-warnings=0`; HTTP fixture validation completed; no warnings or errors.

### Vercel-equivalent build

Command (direct expansion of root `build:vercel` to avoid the same nested bare-pnpm host shim):

```text
corepack pnpm --filter @scholar-scout/web run build
```

Result: **PASS** — Next.js 15.5.22 compiled, checked types, generated 57 static pages, and completed route/build trace output. No deploy command was run.

### Phase 3 recovery predecessor regression

Command:

```text
corepack pnpm --filter @scholar-scout/web run test -- --runInBand __tests__/lib/data-recovery.test.ts __tests__/lib/data-store.test.ts __tests__/api/admin-data-routes.test.ts __tests__/components/ProgrammeAdminManager.test.tsx
```

Result: **PASS** — 4 suites, 62 tests, 0 failures. This selection covers signed plans/envelopes, exact confirmation, bounded validation, one-write apply, pre-change backup, idempotent outcomes, retention, incident holds, privacy-minimal audit/lifecycle evidence, authorized recovery routes, safe conflict/retry behavior, and the capability-driven recovery UI. The HTTP service regression also passed separately at 10/10 tests.

## Source and Boundary Audit

| Audit | Result | Evidence |
|---|---|---|
| Ordinary migrated writes avoid the unconditional primitive | PASS | `rg -n "writeScholarScoutData" apps/web/lib/server apps/web/app -g "*.ts"` returns only the compatibility export declaration in `data-store.ts`; the executable source guard also passed. |
| Programme operations are bounded | PASS | `programme-records.ts` composes programme plus audit and uses the versioned conditional seam once. |
| Student operations are bounded | PASS | `student-records.ts` owns account, onboarding, and atomic shortlist intent replacement. |
| Operational/platform operations are bounded | PASS | `operational-records.ts` owns the exact retry policy; `platform-store.ts` delegates appends/replacements through it. |
| Recovery remains conditional and compatible | PASS | `data-recovery.ts` binds the final one-write apply to its versioned snapshot; legacy recovery helpers and incident-hold release are one-attempt conditional writes. |
| Dependency and lock state | PASS | No diff exists for `package.json`, `apps/web/package.json`, `pnpm-lock.yaml`, or `vercel.json`; no package install occurred. |
| Secret/environment state | PASS | No secret or environment file was read, written, staged, or committed. Provider tokens were not requested or used. |
| Production boundary | PASS | No production environment, data, migration, Vercel command, provider write, or deployment was accessed or changed. The build was local only. |
| Unrelated work | PASS | Existing `.planning/config.json`, training output, research cache, PDF output, and `tmp/` changes remain unmodified and unstaged. |

## Requirement and Threat Gate

- `04-COVERAGE.md` maps DATA-01 and DATA-02 across JSON, HTTP, mocked Blob, programme, student, operational/platform, and recovery boundaries.
- T-04-15 is mitigated by exact command/count/limitation records above.
- T-04-16 is mitigated by the source matrix and executable source guard.
- T-04-17 is mitigated by the explicit no-production audit.
- T-04-SC is mitigated because no install or dependency change occurred.
- No critical/high implementation evidence gap was found. Formal threat closure remains the responsibility of `$gsd-secure-phase 4`.

## Residual Limitations

- Blob concurrency evidence uses the pinned SDK's mocked contract; no live Blob or production provider operation was authorized or performed.
- JSON locking is a same-filesystem cooperating-writer guarantee, not a distributed lock across independent hosts.
- The raw compatibility write export remains for intentionally unmigrated compatibility use, but migrated domain/recovery modules are guarded from importing it.
- The plan's root `--runInBand` command is not portable across mixed Jest and Node-test workspaces; the complete recursive gate above is the truthful equivalent and all 290 tests passed.

## Final Readiness

Phase 4 Plan 04-05 validation is green. The implementation is ready for `$gsd-secure-phase 4` and `$gsd-verify-work 4`; DATA-01 and DATA-02 must not be marked complete until those remaining phase gates and goal verification pass.
