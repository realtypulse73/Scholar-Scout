# Phase 4: Incremental Durable Persistence Boundaries - Research

**Researched:** 2026-08-28
**Domain:** Optimistic concurrency, bounded persistence operations, and incremental adapter migration
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Roadmap-defined outcome
- A stale student or staff change must preserve current data and return an explicit conflict or retry result; silent last-writer-wins loss is not acceptable.
- Student, programme, and operational records must be accessible through bounded domain operations rather than requiring an unbounded shared-document replacement for every event.
- Migration must proceed one high-risk persistence boundary at a time, with compatibility and adapter-level verification at each step.

### Compatibility and safety
- Retain Next.js 15, React 18, TypeScript, NextAuth, Vercel, and the current port-and-adapter foundation.
- Preserve JSON, HTTP, and Vercel Blob support during incremental migration.
- Preserve Phase 3 signed backup, restore, import, retention, and audit behavior throughout the change.
- Keep production data and production deployment out of Phase 4 implementation unless separately authorized.
- Use a tracer-first plan: establish the versioned bounded persistence contract and prove one end-to-end migrated boundary before expanding the same pattern across the remaining roadmap domains.

### Existing foundation to reuse
- Programme records already carry revisions and expose explicit stale-edit conflict behavior at the application boundary; Phase 4 must strengthen this into an adapter/provider-level concurrency guarantee rather than discard it.
- Phase 3 already binds recovery plans to current-state digests and documents provider transaction/CAS guarantees as Phase 4 work.
- Existing server-only persistence modules and route authorization/validation boundaries remain the integration seams.

### the agent's Discretion

- Select the first tracer boundary using repository evidence about write frequency, data-loss impact, and the smallest safe adapter-spanning proof—not a new product-priority decision from the user.
- Choose the exact version-token/CAS representation and compatibility interface after comparing the three supported adapters.
- Split later expansion plans according to domain coupling and testability while ensuring all three roadmap domains are covered before phase verification.

### Deferred Ideas (OUT OF SCOPE)

- Wholesale application or datastore rewrite.
- Separate analytics storage and background jobs (`DATA-04`, `DATA-05`, v2).
- Phase 5 school/community/WNY product work.
- Production migration or deployment without separate authorization.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DATA-01 | Concurrent user and staff writes cannot silently overwrite each other; write operations have an atomic transaction or explicit version-conflict outcome. | Introduce a versioned snapshot token and adapter-level conditional write contract; map provider mismatch to one typed conflict/retry result. [VERIFIED: `.planning/REQUIREMENTS.md`; repository adapters; Vercel Blob and HTTP conditional-write documentation] |
| DATA-02 | User, programme, and operational records can be accessed and changed through bounded domain operations rather than rewriting an unbounded shared document for every event. | Add bounded domain operations above a compatibility-preserving versioned store, prove programme as tracer, then migrate student-owned and operational append/audit paths without removing the whole-document recovery seam. [VERIFIED: `.planning/REQUIREMENTS.md`; `data-store.ts`; `platform-store.ts`] |
</phase_requirements>

## Summary

Scholar Scout currently has a two-method persistence port—`read()` and `write(data)`—implemented by JSON, HTTP, and Vercel Blob adapters. Every mutable domain helper performs a read-modify-write of the complete normalized document, so the existing programme `revision` comparison protects only against a stale record already visible in that one read; another writer can still replace the document between that read and the adapter write. [VERIFIED: `apps/web/lib/server/data-store.ts`; `apps/web/lib/server/platform-store.ts`] Phase 3 deliberately retained one full-document write for approved recovery and bound plans to a current-state digest, while deferring provider compare-and-set and concurrent-write protection to this phase. [VERIFIED: `03-VERIFICATION.md`; `03-06-SUMMARY.md`; `data-recovery.ts`; adapter runbooks]

Use programme records as the first tracer boundary. They already have a revision-bearing domain model, a typed `ProgrammeRevisionConflictError`, a staff-only route that returns an explicit `409`, and focused data-store coverage. That makes programme save the smallest adapter-spanning proof of DATA-01 while keeping the public behavior stable. [VERIFIED: `data-store.ts`; `apps/web/app/api/admin/programmes/route.ts`; `apps/web/__tests__/lib/data-store.test.ts`] Student onboarding/shortlist writes have greater user-progress loss impact and must follow in the same phase; operational append/audit paths then complete DATA-02 coverage, but analytics separation and jobs remain deferred. [VERIFIED: `data-store.ts`; `platform-store.ts`; `04-CONTEXT.md`; `.planning/REQUIREMENTS.md`]

The compatible foundation should be a versioned read plus conditional whole-document write at the adapter port, followed by bounded domain-operation methods that hide the document mutation. HTTP uses strong ETag plus `If-Match` and returns `412` on mismatch. Vercel Blob existing writes use `allowOverwrite: true` plus the read ETag as `ifMatch`; absent creation uses `allowOverwrite: false` with no `ifMatch`, and pathname-exists or provider precondition errors normalize to conflict. The JSON adapter uses a cross-process sibling-lock protocol: exclusive `fs.open(lockPath, 'wx')`, re-read and compare under lock, write and fsync a unique same-directory temp file, atomically rename it, and release the lock in `finally`; bounded lock contention returns unavailable, and an apparently stale lock is never broken automatically. [CITED: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/If-Match] [CITED: https://vercel.com/docs/vercel-blob] [VERIFIED: `04-01-PLAN.md`; `04-VALIDATION.md`] Recovery must continue to read/validate/compose once and conditionally apply one full document using the same expected version; it must not be decomposed into partial domain writes. [VERIFIED: `data-recovery.ts`; Phase 3 recovery artifacts]

**Primary recommendation:** Add one versioned CAS-capable compatibility port using cross-process sibling-lock/fsync/rename for JSON, ETag preconditions for HTTP, and explicit existing-versus-absent conditional writes for Blob; prove it with `saveProgrammeRecord`, then migrate student and operational helpers using the exact retry allowlist while leaving Phase 3 recovery as a guarded whole-document operation. [VERIFIED: repository architecture; `04-01-PLAN.md`; `04-03-PLAN.md`; `04-VALIDATION.md`]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Version token and conditional-write result | Database / Storage | API / Backend | The adapter/provider owns whether the expected version still matches; the backend maps provider outcomes into stable domain errors. [VERIFIED: current adapter boundary; official conditional-write docs] |
| Bounded programme operation (tracer) | API / Backend | Database / Storage | Server domain logic validates revision and composes programme plus audit mutation; the adapter commits it conditionally. [VERIFIED: `data-store.ts`; admin programme route] |
| Bounded student operations | API / Backend | Database / Storage | Server-derived user identity selects onboarding, shortlist, and plan records; browser input cannot choose another owner. [VERIFIED: Phase 2 route architecture; `data-store.ts`] |
| Bounded operational append/update operations | API / Backend | Database / Storage | Server modules own audit, guest lifecycle, recovery lifecycle, and platform event invariants; storage provides conflict-safe commit. [VERIFIED: `data-store.ts`; `platform-store.ts`] |
| Conflict/retry HTTP response | API / Backend | Browser / Client | Route handlers translate the typed persistence conflict into `409`/retry-safe JSON; UI may reload current state but cannot adjudicate storage versions. [VERIFIED: admin programme route pattern] |
| Signed recovery apply | API / Backend | Database / Storage | Phase 3 validates authorization, signature, digest, reason, confirmation, and retention; the adapter must make its one final write conditional on the read version. [VERIFIED: `data-recovery.ts`; `03-VERIFICATION.md`] |

## Standard Stack

### Core

| Library / Runtime | Version | Purpose | Why Standard |
|-------------------|---------|---------|--------------|
| Next.js | 15.5.15 | Existing route handlers and server execution | Locked project foundation; no routing or platform migration is needed. [VERIFIED: `apps/web/package.json`; `AGENTS.md`] |
| TypeScript | 5.x | Typed version tokens, operation results, and conflict errors | Existing strict server/domain language. [VERIFIED: `apps/web/tsconfig.json`; `AGENTS.md`] |
| Node.js | 20.x | JSON filesystem adapter, hashing, exclusive sibling lock, fsync, and temp-file/rename primitives | Locked runtime; the validated plan uses `fs.open(..., 'wx')` plus compare-under-lock and fsynced same-directory atomic replacement for independent processes. [VERIFIED: root `package.json`; `data-store.ts`; `04-01-PLAN.md`; `04-VALIDATION.md`] |
| `@vercel/blob` | 2.6.1 resolved | Private Blob read and ETag-conditional overwrite | Current lockfile version exposes `ifMatch`, ETags, and `BlobPreconditionFailedError`; no new package is required. [VERIFIED: `pnpm-lock.yaml`; local package declarations] [CITED: https://vercel.com/docs/vercel-blob] |
| Native HTTP conditional requests | HTTP/1.1 semantics | Strong ETag read token and `If-Match` write precondition | Standard lost-update prevention; mismatch is `412 Precondition Failed`. [CITED: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/If-Match] |

### Supporting

| Library / Tool | Version | Purpose | When to Use |
|----------------|---------|---------|-------------|
| Jest / Next Jest | 30.3.0 | Store, route, recovery, and concurrency regression tests | Every adapter and migrated domain operation. [VERIFIED: `apps/web/package.json`; `apps/web/jest.config.ts`] |
| Node built-in test runner | Node 20.x | HTTP fixture contract and concurrent conditional PUT tests | Service-side ETag/`If-Match` behavior. [VERIFIED: `services/http-data-service/package.json`; existing tests] |
| Node `crypto` | built-in | Stable content digest where provider ETag is unavailable | Versioning normalized JSON and checking local/HTTP fixture snapshots. [VERIFIED: existing repository use in `data-store.ts` and `data-recovery.ts`] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Compatibility CAS on the existing document port | Immediate relational/database migration | A database would provide stronger record transactions and queries, but violates the locked incremental/no-wholesale-migration boundary and would put all adapters and Phase 3 recovery at once at risk. [VERIFIED: `04-CONTEXT.md`; project constraints] |
| Programme as tracer | Student shortlist/onboarding first | Student data has higher direct progress-loss impact, but lacks an existing revision/UI conflict contract; programme provides a smaller safe proof before applying the same port to student writes. [VERIFIED: current source/tests] |
| Provider ETag/version token | Process-local mutex only | A mutex cannot coordinate independent local processes, Vercel serverless instances, or a remote HTTP service; JSON therefore uses an OS-exclusive sibling lock, while HTTP and Blob use provider preconditions. [VERIFIED: adapter topology; `04-01-PLAN.md`; `04-VALIDATION.md`] |

**Installation:** No new dependency installation is required. Use the committed lockfile and Corepack-selected `pnpm@10.34.5`. [VERIFIED: root `package.json`; `pnpm-lock.yaml`]

## Architecture Patterns

### System Architecture Diagram

```text
Browser/API request
        |
        v
authorized route handler
        |
        v
bounded domain operation
  (programme -> student -> operational)
        |
        +--> readVersioned() -> { data, version }
        |                         |
        |                         v
        |                 validate domain invariant
        |                 + compose audit atomically
        |                         |
        +-------------------------+
                                  v
                   writeVersioned(next, expectedVersion)
                         /          |           \
                        v           v            v
                 JSON local     HTTP service   Vercel Blob
              sibling lock +    ETag/If-Match  ETag/ifMatch
              fsync + rename
                        \           |            /
                         +----------+-----------+
                                    |
                           applied | conflict | unavailable
                                    |
                                    v
                         stable route/domain outcome

Phase 3 recovery: authorize -> validate signed plan/digest -> compose one full
document -> writeVersioned(expectedVersion); never split recovery across domains.
```

### Recommended Project Structure

```text
apps/web/lib/server/
├── data-store.ts                 # versioned adapter port and compatibility read/write
├── persistence-operations.ts     # shared CAS retry/conflict orchestration
├── programme-records.ts          # bounded programme tracer operations
├── student-records.ts            # onboarding/shortlist/plan operations
├── operational-records.ts        # audit/lifecycle/event operations
├── platform-store.ts             # delegates migrated platform writes to operations
└── data-recovery.ts              # preserved one-document guarded recovery

services/http-data-service/
├── src/server.mjs                # ETag GET and If-Match conditional PUT
└── test/server.test.mjs          # concurrent/stale write contract
```

The exact module split may stay smaller if circularity would result; keep the invariant that route handlers call bounded server operations and only adapter code performs conditional persistence. [VERIFIED: `AGENTS.md` dependency-direction constraints]

### Pattern 1: Versioned Read + Conditional Write

**What:** The store returns data with an opaque version, and accepts the expected version on write. The caller never constructs provider-specific ETags. [VERIFIED: repository adapter abstraction; official conditional-write semantics]

**When to use:** Every mutation, including the Phase 3 recovery apply. Reads that do not write may continue through a convenience `readScholarScoutData()` wrapper. [VERIFIED: DATA-01; recovery requirements]

```typescript
// Source: repository architecture + HTTP/Vercel conditional-write contracts
export interface VersionedScholarScoutData {
  data: ScholarScoutData;
  version: string;
}

export type ConditionalWriteResult =
  | { status: 'applied'; version: string }
  | { status: 'conflict'; currentVersion?: string };

export interface ScholarScoutDataStore {
  readVersioned(): Promise<VersionedScholarScoutData>;
  writeVersioned(
    data: ScholarScoutData,
    expectedVersion: string,
  ): Promise<ConditionalWriteResult>;
}
```

### Pattern 2: Bounded Operation Owns Data + Audit Mutation

**What:** A domain operation reads one version, validates its entity revision, modifies only its domain slice plus required audit evidence, and conditionally commits once. [VERIFIED: existing programme and audit behavior]

**When to use:** Programme save/delete, onboarding/shortlist/plan writes, operational append and lifecycle updates. [VERIFIED: current write inventory]

```typescript
// Source: existing saveProgrammeRecord contract, strengthened at the adapter boundary
const current = await store.readVersioned();
const next = applyProgrammeSave(current.data, actorId, programme);
const result = await store.writeVersioned(next, current.version);

if (result.status === 'conflict') {
  throw new ProgrammeRevisionConflictError(
    programme.id,
    programme.revision ?? 0,
    undefined,
  );
}
```

The final implementation should return a general persistence conflict carrying safe retry metadata and preserve `ProgrammeRevisionConflictError` at the route-facing compatibility seam. [VERIFIED: current route behavior; DATA-01]

### Pattern 3: Exact Stable-Identity Commutative Retry Allowlist

**What:** On CAS conflict, retry exactly once—two total CAS attempts—only for stable-ID, duplicate-safe appends. The allowlist is privileged audit, recovery lifecycle/outcome, feed interaction, analytics event, referral, and share. Each ID is generated before the first read and duplicate-ID application is a no-op. Guest lifecycle/migration, incident-hold replacement, account/profile/onboarding/shortlist, programme, simulation, memory, decision, recovery apply, and every operation without a stable ID never retry. [CITED: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Conditional_requests] [VERIFIED: `04-03-PLAN.md`; `04-VALIDATION.md`]

**When to use:** Only the named allowlisted append families may make a second attempt; retry exhaustion and every denylisted operation surface explicit conflict without a third attempt. [VERIFIED: `04-03-PLAN.md`; `04-VALIDATION.md`]

### Pattern 4: Cross-Process JSON CAS

**What:** Acquire a sibling lock with `fs.open(lockPath, 'wx')`; while holding it, re-read and normalize the current file, compare the exact content version with the caller's expected version (including the absent token), write a unique same-directory temp file, fsync it, atomically rename it over the data path, and close/unlink the lock in `finally`. Contenders wait only for a bounded interval; timeout is unavailable, never permission to overwrite. Do not break an apparently stale lock automatically. [VERIFIED: `04-01-PLAN.md`; `04-VALIDATION.md`]

**When to use:** Every JSON adapter conditional write and absent-document creation. Validate with two independent Node processes synchronized after reading the same version; exactly one stale update and exactly one absent creator apply. [VERIFIED: `04-01-PLAN.md`; `04-VALIDATION.md`]

### Pattern 5: Recovery Remains a Guarded Whole-Document Operation

**What:** Preserve Phase 3's signed envelope, current digest, one-write apply, backup retention, incident hold, and audit semantics, but pass the read version into the final conditional write. [VERIFIED: `data-recovery.ts`; `03-VERIFICATION.md`]

**When to use:** Restore and signed import only. Recovery is intentionally not a normal bounded domain operation. [VERIFIED: Phase 3 design]

### Anti-Patterns to Avoid

- **Check entity revision, then call unconditional `write(data)`:** another writer can commit after the check and before the write, so the apparent revision protection still loses data. [VERIFIED: current `saveProgrammeRecord` sequence]
- **Retry every conflict automatically:** replacement operations can overwrite newer user intent; only the exact stable-ID, duplicate-safe append allowlist may retry, and only once. [VERIFIED: `04-03-PLAN.md`; `04-VALIDATION.md`]
- **Expose ETags to browser/domain code:** provider tokens are adapter concerns; leaking them upward couples routes to storage and complicates adapter compatibility. [VERIFIED: port-and-adapter constraint]
- **Split recovery into many domain commits:** partial apply would violate Phase 3's one-write recovery and audit guarantee. [VERIFIED: Phase 3 recovery evidence]
- **Claim JSON local storage is production-transactional:** the project already marks JSON non-durable; keep its guarantee scoped to supported local compatibility. [VERIFIED: `getDataStoreConfigurationSummary`; runbooks]
- **Move analytics to a separate store:** DATA-04 is explicitly v2; Phase 4 may give analytics append a bounded operation but must not create a new analytics platform. [VERIFIED: `.planning/REQUIREMENTS.md`; `04-CONTEXT.md`]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Blob concurrency | Custom lease service around Blob | `@vercel/blob` ETag + `ifMatch` + `BlobPreconditionFailedError` | The provider already supplies an atomic conditional-write precondition. [CITED: https://vercel.com/docs/vercel-blob] |
| HTTP lost-update protection | Custom JSON version header with ambiguous semantics | Strong `ETag`, `If-Match`, and `412 Precondition Failed` | These are standard interoperable conditional request semantics. [CITED: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/If-Match] |
| Cryptographic version token | Novel checksum or serialization | Existing canonical/normalized JSON plus Node SHA-256 where a provider ETag is absent | The codebase already uses SHA-256 digests for recovery state binding. [VERIFIED: `data-recovery.ts`] |
| Domain conflict UI protocol | A second programme-specific error shape | Preserve the existing `409` programme conflict and introduce one internal general persistence conflict | Avoid route regression and duplicated conflict taxonomies. [VERIFIED: admin programme route] |
| Recovery transaction decomposition | Per-collection restore orchestration | Existing signed plan + one conditional document apply | Preserves recoverability and prevents partial restore. [VERIFIED: Phase 3 artifacts] |

**Key insight:** Phase 4 is not a datastore replacement. It is an adapter-contract hardening plus domain-operation extraction that makes every migration step independently testable and reversible. [VERIFIED: locked context and roadmap]

## Common Pitfalls

### Pitfall 1: Entity Revision Without Provider CAS
**What goes wrong:** Two server instances both read the same document and both pass the programme revision check; the later full-document write silently erases the earlier one. [VERIFIED: current read/check/write sequence]
**Why it happens:** The revision comparison and the actual write are separate operations with no shared precondition. [VERIFIED: `ScholarScoutDataStore` interface]
**How to avoid:** Carry an opaque version from adapter read to conditional write and map mismatch to a typed conflict. [CITED: Vercel Blob and HTTP conditional-write docs]
**Warning signs:** Tests assert stale programme input but do not interleave two successful reads before writes. [VERIFIED: current test inventory]

### Pitfall 2: Missing-Document Creation Race
**What goes wrong:** Two first writers both observe an empty store and create divergent initial documents. [CITED: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Conditional_requests]
**Why it happens:** A missing document has no ordinary ETag to match. [CITED: HTTP conditional request guide]
**How to avoid:** Define an explicit absent-version token in the port. Map HTTP creation to `If-None-Match: *`; map Blob creation to `allowOverwrite: false` without `ifMatch`, treating pathname-exists/precondition failures as conflict; and perform JSON creation while holding the exclusive sibling lock. [CITED: HTTP conditional request guide] [VERIFIED: `04-01-PLAN.md`; `04-VALIDATION.md`]
**Warning signs:** Adapter tests cover stale overwrite but not two concurrent initial writes. [VERIFIED: current test inventory]

### Pitfall 3: Retrying Non-Commutative Student Replacements
**What goes wrong:** A retry applies an old shortlist/profile over a newer user choice. [VERIFIED: student helpers replace keyed values]
**Why it happens:** Generic retry logic treats replacement and append operations identically. [VERIFIED: operation inventory]
**How to avoid:** Return conflict for every replacement or unstable-ID write. Retry exactly once only for privileged audit, recovery lifecycle/outcome, feed interaction, analytics event, referral, and share appends with IDs generated before the first read and duplicate-ID no-op behavior. [VERIFIED: `04-03-PLAN.md`; `04-VALIDATION.md`]
**Warning signs:** One helper catches all conflicts and loops without classifying the operation. [VERIFIED: required architecture]

### Pitfall 4: Audit Event Separated From Domain Commit
**What goes wrong:** The data changes without its audit event, or an audit event records a change that failed. [VERIFIED: current same-document audit design]
**Why it happens:** Bounded operations are mistaken for separate physical writes per collection. [VERIFIED: DATA-02 interpretation]
**How to avoid:** Treat the domain record and its required audit evidence as one conditional mutation even while the physical compatibility store remains one document. [VERIFIED: existing invariants]
**Warning signs:** Domain and audit methods call the adapter independently. [VERIFIED: required architecture]

### Pitfall 5: Breaking Recovery Digest and Retention Semantics
**What goes wrong:** A new version field changes signed package validation unexpectedly, or recovery partially applies across bounded operations. [VERIFIED: recovery digest and one-write behavior]
**Why it happens:** Persistence metadata is mixed into signed application content or recovery is routed through ordinary entity operations. [VERIFIED: `data-recovery.ts`]
**How to avoid:** Keep adapter version metadata outside `ScholarScoutData`; preserve canonical application digest and make only the final recovery write conditional. [VERIFIED: Phase 3 contract]
**Warning signs:** Backup/export payloads gain provider ETags, or apply performs multiple writes. [VERIFIED: Phase 3 prohibitions]

### Pitfall 6: Blob Cache Mistaken for Concurrency State
**What goes wrong:** A stale content read drives an update even though a more recent blob exists. [CITED: https://vercel.com/docs/vercel-blob]
**Why it happens:** Overwrite propagation can be cached; the current code already requests cache bypass, but concurrency must rely on ETag preconditions, not content freshness alone. [CITED: Vercel Blob docs] [VERIFIED: current `get(... useCache: false)`]
**How to avoid:** Always use the ETag returned by the versioned read/head as `ifMatch`; treat precondition failure as conflict. [CITED: Vercel Blob docs]
**Warning signs:** The adapter hashes fetched content and overwrites with `allowOverwrite` but omits `ifMatch`. [VERIFIED: current write path]

## Code Examples

### HTTP Conditional PUT

```http
# Source: MDN If-Match / conditional requests
PUT /scholarscout HTTP/1.1
Content-Type: application/json
If-Match: "strong-current-etag"

{ "users": [], "programmeRecords": [], "auditEvents": [] }
```

The service returns `200` with the new strong ETag on success and `412 Precondition Failed` without writing on mismatch. [CITED: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/If-Match]

### Vercel Blob Conditional Write

```typescript
// Source: https://vercel.com/docs/vercel-blob
import { BlobPreconditionFailedError, put } from '@vercel/blob';

try {
  const result = await put(pathname, JSON.stringify(data), {
    access: 'private',
    allowOverwrite: true,
    ifMatch: expectedEtag,
    token,
  });
  return { status: 'applied' as const, version: result.etag };
} catch (error) {
  if (error instanceof BlobPreconditionFailedError) {
    return { status: 'conflict' as const };
  }
  throw error;
}
```

### Conflict-Safe Route Mapping

```typescript
// Source: existing apps/web/app/api/admin/programmes/route.ts pattern
try {
  const record = await saveProgrammeRecord(actorId, input);
  return NextResponse.json({ record });
} catch (error) {
  if (error instanceof ProgrammeRevisionConflictError) {
    return NextResponse.json(
      { error: error.message, currentRecord: error.currentRecord },
      { status: 409 },
    );
  }
  throw error;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Unconditional overwrite at a stable Blob pathname | ETag conditional writes via `ifMatch` | Available in the resolved `@vercel/blob` 2.6.1 SDK and current official docs | Provider-level optimistic concurrency can be implemented without a new storage product. [VERIFIED: lockfile/local types] [CITED: Vercel Blob docs] |
| PUT after a prior GET with no precondition | Strong ETag + `If-Match`; reject mismatch with `412` | Established HTTP conditional request standard | Prevents the lost-update problem at the service boundary. [CITED: MDN If-Match] |
| Programme revision check followed by unconditional document write | Entity revision plus adapter CAS | Phase 4 target | Closes the race between application validation and persistence. [VERIFIED: current code and roadmap] |
| All domain events directly call `writeScholarScoutData(data)` | Bounded domain operations over a compatibility CAS port | Phase 4 target | Makes migration incremental and keeps adapters/recovery supported. [VERIFIED: DATA-02 and context] |

**Deprecated/outdated:**
- `ScholarScoutDataStore.write(data)` as the mutation primitive is insufficient for concurrent use and should remain only as a temporary compatibility wrapper until every write path is migrated. [VERIFIED: DATA-01; current port]
- `allowOverwrite: true` without `ifMatch` on Vercel Blob is last-writer-wins and cannot satisfy DATA-01. [VERIFIED: current code] [CITED: Vercel Blob docs]
- HTTP `PUT` without `If-Match` cannot claim conflict safety. [VERIFIED: current service] [CITED: MDN If-Match]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | None. All planning recommendations are grounded in locked project artifacts, repository source, resolved package declarations, or official documentation. | — | — |

## Open Questions (RESOLVED)

1. **How should existing and missing Vercel Blobs be conditionally written? — Resolved**
   - Existing write: use `allowOverwrite: true` plus the ETag from the versioned read as `ifMatch`; map `BlobPreconditionFailedError` to conflict with no write. [VERIFIED: `04-01-PLAN.md`; `04-VALIDATION.md`]
   - Absent create: use `allowOverwrite: false` with no `ifMatch`; map pathname-already-exists and provider precondition failure to conflict with no write. [VERIFIED: `04-01-PLAN.md`; `04-VALIDATION.md`]
   - Verification: mocked adapter tests run two absent-version creators and prove exactly one applies, plus a stale-ETag no-write conflict. [VERIFIED: `04-VALIDATION.md`]

2. **Which operational appends may retry automatically? — Resolved**
   - Allowlist: privileged audit, recovery lifecycle/outcome, feed interaction, analytics event, referral, and share. IDs are generated before the first read; duplicate-ID application is a no-op. [VERIFIED: `04-03-PLAN.md`; `04-VALIDATION.md`]
   - Limit: exactly one retry, for two total CAS attempts; exhaustion returns conflict and no third attempt occurs. [VERIFIED: `04-03-PLAN.md`; `04-VALIDATION.md`]
   - Denylist: guest lifecycle/migration, incident-hold replacement, account/profile/onboarding/shortlist, programme, simulation, memory, decision, recovery apply, and any unstable-ID operation never retry. [VERIFIED: `04-03-PLAN.md`; `04-VALIDATION.md`]

3. **How does JSON CAS coordinate independent processes? — Resolved**
   - Use the cross-process sibling-lock, compare-under-lock, fsynced same-directory temp, and atomic-rename protocol. Bounded contention failure is unavailable; an apparently stale lock is never automatically removed. [VERIFIED: `04-01-PLAN.md`; `04-VALIDATION.md`]
   - Verification: independent-process race tests prove exactly one stale updater and one absent creator apply while the winning document remains valid. [VERIFIED: `04-01-PLAN.md`; `04-VALIDATION.md`]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | web/store and HTTP fixture tests | ✓ | 20.20.2 | — [VERIFIED: command output] |
| Corepack pnpm | locked install/test path | ✓ | 10.34.5 | Do not use PATH pnpm 11.19.0. [VERIFIED: command output; root manifest] |
| Git | GSD commits | ✓ | 2.55.0.windows.3 | — [VERIFIED: command output] |
| `@vercel/blob` | Blob conditional-write adapter | ✓ | 2.6.1 resolved | Mocked adapter tests when external Blob credentials are unavailable. [VERIFIED: lockfile; local package metadata] |
| HTTP fixture service | HTTP ETag/If-Match contract tests | ✓ | Node built-in service | — [VERIFIED: service source/tests] |
| Vercel Blob credentials/service | Live provider integration | Not probed | — | Unit/mocked integration during implementation; production remains out of scope. [VERIFIED: no-production constraint] |

**Missing dependencies with no fallback:** None for planning or local implementation verification. [VERIFIED: environment audit]

**Missing dependencies with fallback:** Live Blob credentials are not required for code/test planning; use mocked SDK contracts and reserve non-production provider smoke for an authorized later gate. [VERIFIED: project test patterns and no-production constraint]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30.3.0 + Next Jest; Node 20 built-in test runner [VERIFIED: manifests/config] |
| Config file | `apps/web/jest.config.ts`; service uses `node --test` [VERIFIED: repository files] |
| Quick run command | `corepack pnpm --filter @scholar-scout/web run test -- --runInBand __tests__/lib/data-store.test.ts` [VERIFIED: existing scripts] |
| Full suite command | `corepack pnpm test --runInBand` plus `corepack pnpm typecheck`, `corepack pnpm lint`, `corepack pnpm build:vercel` [VERIFIED: repository scripts and prior phase gate] |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | Two programme writers read one version; first applies, second receives explicit conflict and cannot erase first write across injected, HTTP, and Blob adapters. | unit + adapter integration | focused web data-store and HTTP service tests | ⚠ extend existing files |
| DATA-01 | Missing-document creation race and stale recovery apply fail without replacing current data. | adapter + recovery integration | focused data-store/data-recovery and service tests | ⚠ extend existing files |
| DATA-02 | Programme save/delete use bounded operation while preserving revision, audit, route `409`, and governed read behavior. | unit + route | focused data-store/admin programme route tests | ⚠ route coverage file may require Wave 0 creation |
| DATA-02 | Onboarding, shortlist, and shortlist-plan writes mutate only the authenticated student's slice plus audit and return conflict/retry explicitly. | unit + route | focused student store and account route tests | ⚠ extend/create Wave 0 coverage |
| DATA-02 | Operational audit/platform appends use bounded operations and cannot lose an interleaved append; replacements do not retry blindly. | unit + route | focused operational/platform tests | ❌ Wave 0 |
| DATA-01/02 | JSON, HTTP, and Blob remain compatible; Phase 3 signed recovery/retention/audit suite remains green. | regression | data-store, data-recovery, admin-data-routes, HTTP service suites | ✅ existing, extend CAS cases |

### Sampling Rate

- **Per task commit:** Run the focused store/route/service test file for the touched boundary. [VERIFIED: project testing convention]
- **Per wave merge:** Run all web tests plus HTTP service tests and typecheck. [VERIFIED: prior phase validation pattern]
- **Phase gate:** Full repository test, typecheck, lint, Vercel build, API coverage, security review, and conversational UAT before phase verification. [VERIFIED: `.planning/config.json`; project workflow]

### Wave 0 Gaps

- [ ] Extend `apps/web/__tests__/lib/data-store.test.ts` with interleaved CAS, Blob existing-write `allowOverwrite: true` + `ifMatch`, absent-create `allowOverwrite: false` without `ifMatch`, and provider conflict cases; add independent-process JSON stale-update and absent-create races. [VERIFIED: `04-01-PLAN.md`; `04-VALIDATION.md`]
- [ ] Extend `services/http-data-service/test/server.test.mjs` for strong ETag on GET, required `If-Match` on replacement, `If-None-Match: *` creation, `412` no-write behavior, and two concurrent writers. [VERIFIED: current service tests lack conditional writes]
- [ ] Add focused admin programme route conflict coverage if no existing route test covers the CAS-derived `409`. [VERIFIED: test inventory]
- [ ] Add student persistence operation tests covering onboarding, shortlist, shortlist plans, and audit atomicity. [VERIFIED: no focused server persistence test exists]
- [ ] Add operational persistence tests for privileged audit, guest lifecycle/migration, recovery lifecycle/outcome, and platform append/replacement classifications. [VERIFIED: no `platform-store.test.ts` exists]
- [ ] Add a recovery regression proving a stale version between plan validation and apply returns no-write conflict while signed digest, backup retention, incident hold, and idempotent outcome behavior remain intact. [VERIFIED: current recovery tests cover digest staleness but not provider CAS interleaving]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Preserve NextAuth and active staff authorization before privileged domain operations. [VERIFIED: Phase 2/3 architecture] |
| V3 Session Management | yes | Never use browser-supplied user keys; retain server-derived actor binding. [VERIFIED: SEC-01 implementation and routes] |
| V4 Access Control | yes | Bounded operations accept a trusted actor and enforce domain ownership/role before persistence. [VERIFIED: project requirements] |
| V5 Input Validation | yes | Preserve existing bounded route/domain validators before any CAS attempt. [VERIFIED: route conventions] |
| V6 Cryptography | yes | Use provider ETags or Node SHA-256; do not invent cryptography or mix recovery signing keys into persistence versions. [VERIFIED: source; official docs] |
| V7 Error/Logging | yes | Return stable conflict/unavailable categories without provider secrets, tokens, or student data. [VERIFIED: Phase 3 safe-error pattern] |
| V8 Data Protection | yes | Conditional writes protect confidentiality-linked ownership data from cross-write loss; backups remain private and bounded. [VERIFIED: DATA-01; Phase 3] |
| V13 API | yes | HTTP service implements authenticated strong ETag/`If-Match` and correct `412`; app routes preserve `409` conflict contracts. [CITED: MDN If-Match] [VERIFIED: project route pattern] |

### Known Threat Patterns for Next.js + Shared Document Persistence

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Lost update from concurrent serverless instances | Tampering | Adapter-level strong CAS/ETag and explicit no-write conflict. [VERIFIED: DATA-01] |
| Conflict response leaks current student data | Information Disclosure | Return safe category/version metadata only; programme route may return only its already-authorized current record. [VERIFIED: access-control boundaries] |
| Retry amplification under contention | Denial of Service | Exactly one retry/two attempts only for the stable-ID duplicate-safe append allowlist; all replacements and unstable-ID operations return conflict. [VERIFIED: `04-03-PLAN.md`; `04-VALIDATION.md`] |
| Stale recovery overwrites post-plan data | Tampering | Bind both application digest and adapter version; conditionally apply once. [VERIFIED: Phase 3 plus DATA-01] |
| Conditional header omitted or forged by public caller | Spoofing / Tampering | App owns adapter token; HTTP data service requires server bearer auth and validates the current ETag itself. [VERIFIED: current HTTP auth boundary] |
| Persistence version included in signed/exported data | Information Disclosure / Tampering | Keep version metadata outside `ScholarScoutData` and recovery envelopes. [VERIFIED: recovery contract] |

## Project Constraints (from AGENTS.md)

- Read `PROJECT-INDEX.md` and all task-relevant canonical sources before planning or editing. [VERIFIED: `AGENTS.md`]
- Retain Next.js 15, React 18, TypeScript, NextAuth, Vercel, Node 20.x, pnpm 10.34.5, and the root lockfile path; avoid platform churn. [VERIFIED: `AGENTS.md`]
- Preserve production data through incremental tested migration boundaries and do not overwrite or absorb unrelated in-progress work. [VERIFIED: `AGENTS.md`]
- Keep server-only persistence under `apps/web/lib/server/`; browser code reaches it only through server pages/routes. [VERIFIED: `AGENTS.md`]
- Preserve dependency direction `app/components → lib → lib/server`; avoid broad barrels and circular imports. [VERIFIED: `AGENTS.md`]
- Authenticate and validate early, return explicit structured expected failures, and do not mask unexpected failures. [VERIFIED: `AGENTS.md`]
- Use strict TypeScript, named library exports, existing naming/style, and focused route handlers delegating to server/domain modules. [VERIFIED: `AGENTS.md`]
- Add focused `*.test.ts`/`*.test.tsx`/`*.test.mjs` coverage and run lint with zero warnings, typecheck, relevant tests, and build validation. [VERIFIED: `AGENTS.md`]
- Start and execute changes through the applicable GSD workflow; this artifact is produced by the Phase 4 plan-phase research workflow. [VERIFIED: `AGENTS.md`]

## Sources

### Primary (HIGH confidence)

- `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, and `04-CONTEXT.md` — locked phase outcome, requirements, dependency, scope, and current state.
- `apps/web/lib/server/data-store.ts` — data model, port, JSON/HTTP/Blob adapters, programme revision behavior, student and operational writes.
- `apps/web/lib/server/platform-store.ts` — append-heavy and replacement platform mutations.
- `apps/web/lib/server/data-recovery.ts` — signed plan, digest, one-write apply, retention, and lifecycle audit invariants.
- `apps/web/app/api/admin/programmes/route.ts` — existing staff programme conflict response.
- `services/http-data-service/src/server.mjs` and its tests — current whole-document remote service contract.
- `apps/web/__tests__/lib/data-store.test.ts`, `data-recovery.test.ts`, and `admin-data-routes.test.ts` — current validation seams and gaps.
- Phase 3 context, research, summaries, UAT, security, validation, and verification — predecessor guarantees and explicitly deferred Phase 4 provider work.
- `AGENTS.md`, `PROJECT-INDEX.md`, `.planning/codebase/*`, and adapter runbooks — project constraints and operational boundaries.
- `pnpm-lock.yaml` and installed `@vercel/blob` 2.6.1 declarations — resolved SDK version and conditional-write types.
- `04-01-PLAN.md`, `04-03-PLAN.md`, and `04-VALIDATION.md` — validated JSON cross-process CAS, Blob create/update mapping, and exact operational retry decisions.

### Secondary (MEDIUM confidence)

- https://vercel.com/docs/vercel-blob — official ETag, `ifMatch`, conditional writes, caching, and `BlobPreconditionFailedError` behavior (last updated 2025-12-17 in retrieved source).
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/If-Match — official-reference summary of strong ETag `If-Match`, lost-update prevention, and `412` behavior (last modified 2025-07-04 in retrieved source).
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Conditional_requests — optimistic locking and first-create conditional request patterns.
- https://nodejs.org/api/fs.html — Node exclusive-create and rename primitives; local JSON transaction scope remains limited.

### Tertiary (LOW confidence)

- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — current manifests, lockfile, installed declarations, and official provider docs; no new packages.
- Architecture: HIGH — every write path, adapter, route seam, and recovery invariant was traced in repository source.
- Tracer selection: HIGH — programme has the only existing revision/conflict contract and focused adapter tests, making it the smallest safe adapter-spanning proof.
- Pitfalls: HIGH — current code exhibits the race boundaries and Phase 3 explicitly records the deferred guarantees.

**Research date:** 2026-08-28
**Valid until:** 2026-09-27 (re-check provider SDK docs and lockfile if implementation begins after this date)
