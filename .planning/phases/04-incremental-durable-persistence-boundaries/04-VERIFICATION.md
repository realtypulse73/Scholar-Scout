---
phase: 04-incremental-durable-persistence-boundaries
verified: 2026-08-29T03:20:10-04:00
status: gaps_found
score: 1/3 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "When a user or staff member submits a stale change, the product preserves current data and returns an explicit conflict or retry outcome instead of silently losing another write."
    status: failed
    reason: "The supported HTTP data service does not make ETag validation and document replacement atomic. Concurrent handlers can both validate the same If-Match value before either asynchronous backup/write/rename completes."
    artifacts:
      - path: "services/http-data-service/src/server.mjs"
        issue: "handleWrite reads and checks the current document at lines 101-119, then awaits backup and replacement at lines 121-126 without a lock, request queue, or provider transaction covering the check-and-write critical section."
      - path: "services/http-data-service/test/server.test.mjs"
        issue: "The concurrent test observes one scheduler run, but it cannot prove atomicity; passing once does not close the check-then-act race visible in the implementation."
      - path: "docs/http-data-adapter-runbook.md"
        issue: "The runbook claims the fixture serializes competing writes, but the server contains no serialization mechanism."
    missing:
      - "Serialize HTTP fixture conditional PUTs or use an atomic provider/file-lock transaction so precondition validation and replacement form one critical section."
      - "Add deterministic barrier-based contention tests for existing-document and first-create races that fail when both handlers pass the precondition."
  - truth: "A maintainer can migrate one high-risk boundary at a time while every supported adapter and Phase 3 recovery workflow remains verifiably safe."
    status: failed
    reason: "JSON and mocked Blob conditional writes and Phase 3 recovery are covered, but the supported HTTP adapter has the same non-atomic check-and-write gap, so cross-adapter safety is not established."
    artifacts:
      - path: "services/http-data-service/src/server.mjs"
        issue: "HTTP conditional replacement is not serialized atomically."
      - path: ".planning/phases/04-incremental-durable-persistence-boundaries/04-SECURITY.md"
        issue: "T-04-01 and T-04-04 were closed on the incorrect premise that HTTP preconditions are provider-enforced atomically."
    missing:
      - "Close the HTTP atomicity gap, rerun focused adapter/recovery regressions, and re-audit affected threats T-04-01 and T-04-04."
---

# Phase 4: Incremental Durable Persistence Boundaries Verification Report

**Phase Goal:** Student, programme, and operational changes remain durable under concurrent use without requiring every event to rewrite a shared unbounded document.
**Verified:** 2026-08-29
**Status:** gaps_found
**Re-verification:** No — initial canonical verification after security and UAT

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | A stale user or staff change preserves current data and returns an explicit conflict/retry result. | FAILED | JSON locks and Blob/route conflict mappings are substantive, but `services/http-data-service/src/server.mjs:101-126` performs an unguarded asynchronous check-then-write. Two concurrent HTTP handlers can both accept the same ETag. |
| 2 | Student, programme, and operational records are changed through bounded domain operations rather than callers performing raw shared-document replacement. | VERIFIED | `programme-records.ts`, `student-records.ts`, and `operational-records.ts` expose named operations; `platform-store.ts` delegates mutations to the operational boundary; the executable source guard in `data-store.test.ts:90` prevents migrated modules from importing `writeScholarScoutData`. Focused race/atomicity/retry tests exist for each domain. |
| 3 | One high-risk boundary can be migrated incrementally while supported adapters and Phase 3 recovery remain verifiably safe. | FAILED | Phase 3 recovery is version-bound at `data-recovery.ts:440-517`, JSON compares under an exclusive sibling lock, and Blob uses `ifMatch`; however, HTTP lacks an atomic precondition/replacement critical section, so the supported-adapter safety statement is false. |

**Score:** 1/3 truths verified

## Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `apps/web/lib/server/data-store.ts` | Opaque versioned read and conditional write for JSON, HTTP, and Blob | PARTIAL | Substantive and wired. JSON uses exclusive sibling lock plus fsync/rename (`302-340`); the HTTP client sends `If-Match`/`If-None-Match` (`398-423`); Blob uses `ifMatch`/no-overwrite (`494-520`). The HTTP client cannot compensate for a non-atomic service. |
| `apps/web/lib/server/persistence-operations.ts` | Shared one-attempt CAS orchestration | VERIFIED | Reads a versioned snapshot, mutates it, and writes with the same opaque version (`13-24`). |
| `apps/web/lib/server/programme-records.ts` | Bounded programme save/delete with atomic audit composition | VERIFIED | Save/delete compose programme and audit in one conditional mutation and map provider conflict to the established domain error. |
| `apps/web/lib/server/student-records.ts` | Bounded account/profile/shortlist operations | VERIFIED | Server-selected student slices and audit changes are committed using one versioned write; shortlist IDs and plans are composed together (`87-102`). |
| `apps/web/lib/server/operational-records.ts` | Explicit retry allowlist and bounded operational mutations | VERIFIED | Stable-ID append allowlist is encoded at `15-31`; allowlisted operations receive at most two attempts and replacements one (`33-77`). |
| `apps/web/lib/server/data-recovery.ts` | Conditional one-write recovery apply | VERIFIED | Reads one versioned snapshot, validates state, composes backup/lifecycle/outcome, then conditionally writes exactly once (`440-517`). |
| `services/http-data-service/src/server.mjs` | Atomic strong-ETag conditional replacement | FAILED | Strong ETags are emitted, but precondition validation and asynchronous replacement are not serialized (`101-126`). |

## Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| Programme/admin route | Programme records | Authorized save/delete and typed 409 mapping | WIRED | Route imports the bounded operations and preserves safe conflicts without provider tokens. |
| Account routes | Student records | Server-derived actor and conflict mapping | WIRED | Onboarding and shortlist routes map `PersistenceConflictError` to safe 409 outcomes. |
| Platform store | Operational records | Named append/replacement policies | WIRED | Feed, analytics, referral, share, simulation, memory, migration, and decision mutations delegate to the bounded policy layer. |
| Domain operations | Data-store adapters | Versioned read plus expected-version write | WIRED | The same opaque version flows through each operation. |
| HTTP client adapter | HTTP service | `ETag`, `If-Match`, `If-None-Match`, and 412 | PARTIAL | Header wiring exists, but the service-side check and write are not atomic. |
| Recovery apply | Versioned persistence | One final write using the read version | WIRED | A conflict maps to `recovery-state-changed` and no success evidence is persisted. |

## Data-Flow Trace (Level 4)

| Boundary | Data source | Conditional sink | Status |
|---|---|---|---|
| Programme | Versioned `ScholarScoutData` snapshot | Programme plus audit in one CAS write | FLOWING |
| Student | Server-derived student key and versioned snapshot | Profile or combined shortlist intent in one CAS write | FLOWING |
| Operational/platform | Stable server-generated records and versioned snapshot | Allowlisted append or single-attempt replacement | FLOWING |
| Recovery | Valid signed envelope, actor/state-bound plan, versioned snapshot | One composed conditional recovery write | FLOWING |
| HTTP provider | File read and ETag comparison | Temp-file rename | FAILED | The comparison and rename are separated by awaits and no mutual exclusion. |

## Behavioral Spot-Checks

| Behavior | Evidence | Status |
|---|---|---|
| Independent-process JSON contention | `data-store.test.ts:395` and `:421` exercise existing and absent document races through child processes. | PASS (recorded in Phase 4 validation) |
| Student replacement/atomic shortlist | `student-records.test.ts:69` and `:149` exercise competing account creation and combined shortlist state. | PASS (recorded in Phase 4 validation) |
| Exact operational retry policy | `operational-records.test.ts:75`, `:97`, `:127`, and `:139` cover allowlist, ceiling, denylist, and stable-ID requirement. | PASS (recorded in Phase 4 validation) |
| Recovery provider-version race | `data-recovery.test.ts:331-396` asserts one conflict, no fallback write, and no persisted success evidence. | PASS (recorded in Phase 4 validation) |
| HTTP stale replacement | `server.test.mjs:171-194` passed in the recorded run, but the test is scheduler-dependent and the source lacks atomic serialization. | FAIL as proof of atomicity |

The verifier attempted the three single named spot-check commands, but the managed sandbox rejected the pinned runtime with `EPERM` while resolving `C:\Users\judge`. This does not create the blocker: the HTTP race is directly observable in the source, and a passing scheduler-dependent test cannot prove away an unguarded check-then-act sequence.

## Probe Execution

No Phase 4 probe scripts are declared. Step 7c is not applicable.

## Requirements Coverage

| Requirement | Status | Evidence |
|---|---|---|
| DATA-01 — concurrent writes have an atomic transaction or explicit version-conflict outcome | BLOCKED | JSON and Blob contracts have conditional mechanisms, but the supported HTTP fixture does not atomically bind precondition validation to replacement. |
| DATA-02 — user, programme, and operational records use bounded domain operations | SATISFIED | Named bounded operation modules are wired to callers and guarded from raw unconditional persistence. The retained one-document physical adapter is an explicitly scoped compatibility layer, not the caller-facing mutation contract. |

No Phase 4 requirement is orphaned; both DATA-01 and DATA-02 are claimed by every execution plan. No later milestone phase specifically owns the HTTP CAS atomicity gap, so it is not deferred.

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---:|---|---|---|
| `services/http-data-service/src/server.mjs` | 101-126 | Async check-then-act without lock/transaction | BLOCKER | Two matching conditional writes can both pass and replace the document. |
| `docs/http-data-adapter-runbook.md` | Runtime Contract | Documentation claims competing writes are serialized | WARNING | Operator guidance overstates the implemented guarantee. |

No unreferenced `TBD`, `FIXME`, or `XXX` markers were found in the modified Phase 4 runtime files. No dependency, lockfile, environment, secret, provider, deployment, or production change was found in the Phase 4 diff. Existing unrelated modified/untracked files remain outside this report.

## Security and UAT Gates

- `04-UAT.md`: passed, 7/7 checks, including human confirmation of intended scope.
- `04-SECURITY.md`: recorded `SECURED`, 18/18 threats closed. Canonical verification invalidates the evidence premise for T-04-01 and T-04-04 until the HTTP critical section is made atomic and re-audited.
- Phase 3 recovery predecessor: `03-VERIFICATION.md` passed 3/3; the Phase 4 recovery implementation and regression evidence remain sound.

## Human Verification Required

None. The unresolved issue is a code-level atomicity defect, not a visual or subjective check. No user decision is required; it needs a focused implementation correction and re-verification.

## Gaps Summary

Phase 4 has substantive bounded programme, student, operational, adapter-client, and recovery work, and DATA-02 is achieved. The phase goal is nevertheless not achieved because the supported HTTP data service does not serialize conditional PUTs. Its ETag comparison and replacement are separate asynchronous steps, so the system can still silently lose a concurrent write on that adapter. Fix the HTTP critical section, add deterministic contention coverage, correct the runbook, re-audit T-04-01/T-04-04, and re-run canonical verification.

---

_Verified: 2026-08-29_
_Verifier: Codex (gsd-verifier)_
