---
phase: 04-incremental-durable-persistence-boundaries
verified: 2026-08-29T03:30:33-04:00
status: passed
score: 3/3 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 1/3
  gaps_closed:
    - "HTTP conditional PUT now holds an exclusive sibling-file lock across current-document read, ETag precondition validation, backup, temporary write, and atomic rename."
    - "Deterministic contention tests prove one winner and one 412 loser for existing-document and first-create races across independent service instances sharing a data file."
    - "The HTTP runbook and Phase 4 threat audit now state and verify the exact local-filesystem guarantee without claiming distributed or production-provider safety."
  gaps_remaining: []
  regressions: []
---

# Phase 4: Incremental Durable Persistence Boundaries Verification Report

**Phase Goal:** Student, programme, and operational changes remain durable under concurrent use without requiring every event to rewrite a shared unbounded document.
**Verified:** 2026-08-29
**Status:** passed
**Re-verification:** Yes — after HTTP conditional-write gap closure in `4cce296`

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | A stale user or staff change preserves current data and returns an explicit conflict/retry result. | VERIFIED | JSON uses an exclusive sibling lock, HTTP now locks the shared data path before reading and validating ETags through backup/write/rename (`server.mjs:110-139`), and Blob uses provider `ifMatch`/no-overwrite semantics. Programme, student, operational, and recovery conflicts retain the winning state and expose bounded outcomes. The focused HTTP suite passed 12/12, including deterministic update and first-create contention. |
| 2 | Student, programme, and operational records are changed through bounded domain operations rather than callers performing raw shared-document replacement. | VERIFIED | `programme-records.ts`, `student-records.ts`, and `operational-records.ts` provide named conditional operations; `platform-store.ts` delegates mutations to the operational layer; `data-store.test.ts:90` guards migrated modules from importing `writeScholarScoutData`. Domain race, atomicity, ownership, and retry-policy tests remain present and the recorded Phase 4 gate passed. |
| 3 | One high-risk boundary can be migrated incrementally while supported adapters and Phase 3 recovery remain verifiably safe. | VERIFIED | JSON, HTTP, and mocked Blob share one opaque versioned conditional-write contract. Recovery reads one versioned snapshot and performs one final conditional write (`data-recovery.ts:440-517`). The Phase 3 regression remained green, security re-audit closes T-04-01/T-04-04 on corrected evidence, and UAT passed 7/7. |

**Score:** 3/3 truths verified

## Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `apps/web/lib/server/data-store.ts` | Opaque versioned read and conditional write for JSON, HTTP, and Blob | VERIFIED | JSON compares under a sibling lock and atomically renames; HTTP client sends ETag preconditions; Blob uses `ifMatch` or no-overwrite creation. |
| `services/http-data-service/src/server.mjs` | Atomic strong-ETag conditional replacement | VERIFIED | `acquireWriteLock` uses `open(lockPath, 'wx')`; the held lock spans current read, precondition check, backup, temp write, rename, response, and finally release (`110-155`). The pathname-derived lock coordinates independent local instances/processes sharing the file. |
| `services/http-data-service/test/server.test.mjs` | Deterministic cross-instance update and create contention | VERIFIED | Lifecycle barriers hold one instance inside the lock, observe the second contending before release, then assert one `200`, one `412`, and the winning stored document (`197-345`). |
| `apps/web/lib/server/persistence-operations.ts` | Shared one-attempt CAS orchestration | VERIFIED | Reads a versioned snapshot, mutates it, and writes with the same opaque version (`13-24`). |
| `apps/web/lib/server/programme-records.ts` | Bounded programme save/delete with atomic audit composition | VERIFIED | Save/delete compose programme and audit in one conditional mutation and preserve existing conflict behavior. |
| `apps/web/lib/server/student-records.ts` | Bounded account/profile/shortlist operations | VERIFIED | Server-selected student slices and audit changes commit conditionally; shortlist IDs and plans are composed together (`87-102`). |
| `apps/web/lib/server/operational-records.ts` | Exact retry allowlist and bounded operational mutations | VERIFIED | Stable-ID duplicate-safe append families receive at most two attempts; every replacement receives one (`15-77`). |
| `apps/web/lib/server/data-recovery.ts` | Conditional one-write recovery apply | VERIFIED | Actor/state/signature validation precedes one composed conditional write; CAS conflict becomes `recovery-state-changed` without success evidence. |
| `docs/http-data-adapter-runbook.md` | Accurate operator scope and concurrency guidance | VERIFIED | Documents the sibling lock guarantee for local instances/processes and explicitly excludes unrelated hosts/network filesystems and distributed/provider claims. |

## Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| Programme/admin route | Programme records | Authorized bounded save/delete and typed 409 mapping | WIRED | Existing authorized conflict response remains safe and provider versions stay server-only. |
| Account routes | Student records | Server-derived actor and conflict mapping | WIRED | Onboarding and shortlist routes map `PersistenceConflictError` to safe 409 reload/retry outcomes. |
| Platform store | Operational records | Named append/replacement policies | WIRED | Platform mutations delegate to the exact allowlist/denylist policy boundary. |
| Domain operations | Data-store adapters | Versioned read plus same expected-version write | WIRED | Opaque versions flow from read to the one conditional commit. |
| HTTP client adapter | HTTP service | `ETag`, `If-Match`, `If-None-Match`, 412, and shared-file lock | WIRED | Client preconditions terminate in a service-side atomic critical section. |
| Recovery apply | Versioned persistence | One final write using the read version | WIRED | Conflict produces `recovery-state-changed`; no fallback or success write occurs. |

## Data-Flow Trace (Level 4)

| Boundary | Data source | Conditional sink | Status |
|---|---|---|---|
| Programme | Versioned store snapshot | Programme plus audit in one CAS write | FLOWING |
| Student | Server-derived student key and versioned snapshot | Profile or combined shortlist intent in one CAS write | FLOWING |
| Operational/platform | Stable server-generated records and versioned snapshot | Allowlisted append or single-attempt replacement | FLOWING |
| Recovery | Valid signed envelope, actor/state-bound plan, versioned snapshot | One composed conditional recovery write | FLOWING |
| HTTP provider | File content and strong ETag read while lock is held | Backup plus temp-file atomic rename before lock release | FLOWING |

## Behavioral Spot-Checks

| Behavior | Command/Evidence | Result | Status |
|---|---|---|---|
| HTTP cross-instance update and first-create contention | `node --test services/http-data-service/test/server.test.mjs` | 12/12 passed; update and create barriers each proved one `200` winner and one `412` loser. | PASS |
| JSON independent-process contention | `data-store.test.ts:395` and `:421`; recorded Phase 4 focused/full gate | Existing and absent document races pass with one winner. | PASS |
| Student replacement and atomic shortlist | `student-records.test.ts:69` and `:149`; recorded Phase 4 gate | Concurrent creation and combined shortlist intent pass. | PASS |
| Exact operational retry policy | `operational-records.test.ts:75`, `:97`, `:127`, `:139`; recorded Phase 4 gate | Allowlist, two-attempt ceiling, denylist, and stable-ID guard pass. | PASS |
| Recovery provider-version race | `data-recovery.test.ts:331-396`; recorded Phase 3/4 regression | One conflict, no fallback write, current state and evidence invariants preserved. | PASS |

The two new HTTP tests share suite setup: an isolated name-filter run of the update test receives `412` because no earlier test created the baseline document, while the complete focused service suite passes 12/12. This is a test-isolation warning, not a concurrency failure; the deterministic lock barriers and complete-suite result exercise the intended transitions.

## Probe Execution

No Phase 4 probe scripts are declared. Step 7c is not applicable.

## Requirements Coverage

| Requirement | Status | Evidence |
|---|---|---|
| DATA-01 — concurrent writes have an atomic transaction or explicit version-conflict outcome | SATISFIED | JSON and local HTTP use exclusive sibling-file critical sections; Blob uses provider preconditions; domain and recovery operations map conflicts without overwriting winners. |
| DATA-02 — user, programme, and operational records use bounded domain operations | SATISFIED | Named bounded operation modules are wired to callers and guarded from raw unconditional persistence. The retained physical one-document adapter is an explicitly scoped compatibility layer, not the caller-facing mutation contract. |

No Phase 4 requirement is orphaned. DATA-01 and DATA-02 are both claimed across the five plans and have implementation, behavioral, security, and UAT evidence.

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---:|---|---|---|
| `services/http-data-service/test/server.test.mjs` | 197 | Update contention test depends on earlier suite state | WARNING | The named test is not independently runnable; the complete focused suite passes and the behavior is still deterministically exercised. Future cleanup should seed its own baseline document. |

No unreferenced `TBD`, `FIXME`, or `XXX` markers were found in the fix files. Commit `4cce296` changes only the HTTP service, its tests/runbook, the debug record, and Phase 4 security evidence. It changes no dependency manifest, lockfile, environment template, secret, deployment configuration, provider, or production state. Existing unrelated modified/untracked files remain untouched.

## Security and UAT Gates

- `04-SECURITY.md`: `SECURED`; 18/18 threats closed. The focused re-audit explicitly closes T-04-01 and T-04-04 on sibling-lock and deterministic contention evidence.
- `04-UAT.md`: passed; 7/7 automated and human-confirmed checks passed.
- `03-VERIFICATION.md`: passed; Phase 3 signed recovery, retention, holds, audit, and one-write apply remain preserved by the version-bound final write.
- No production credential, environment, data, migration, Vercel command, provider write, or deployment was used.

## Human Verification Required

None. UAT is already passed, and every concurrency/state-transition truth has behavioral evidence.

## Gaps Summary

No blocking gaps remain. The initial HTTP atomicity gap is closed: the exclusive sibling-file lock now covers the full conditional replacement critical section across local service instances/processes sharing the configured data path, and deterministic contention tests pass. Residual limits remain explicit and acceptable within roadmap scope: mocked rather than live Blob evidence, same-filesystem cooperative locking for JSON/HTTP fixtures, and no claim of distributed or production-provider validation.

## Verdict

**PASSED.** All three Phase 4 roadmap success criteria and requirements DATA-01/DATA-02 are achieved. Security and UAT gates are complete, Phase 3 recovery remains sound, no production action occurred, and no user decision is required.

---

_Verified: 2026-08-29_
_Verifier: Codex (gsd-verifier)_
