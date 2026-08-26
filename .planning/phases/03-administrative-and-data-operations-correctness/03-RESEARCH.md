# Phase 3: Administrative and Data Operations Correctness - Research

**Researched:** 2026-08-25
**Domain:** Next.js administrative recovery workflows over whole-document storage
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Admin operation visibility
- **D-01:** The admin UI is capability-driven. Show an operation only when the authorized server capability reports that it is available and healthy.
- **D-02:** The capability response states availability, allowed action, a safe reason, and whether retry is appropriate. The client does not maintain an independent operation list.
- **D-03:** If a capability becomes unavailable after load, keep its last-known state visible, show a safe inline error and Retry action, and never claim success.
- **D-04:** Load capabilities initially and refresh only through an explicit staff refresh or retry action; do not add background polling.

### Restore safeguards
- **D-05:** Every restore requires a server-enforced impact preview, a non-empty operator reason, and typed confirmation before any write.
- **D-06:** Preview counts and category deltas only. Do not expose student records, samples, or sensitive snapshot contents.
- **D-07:** Final confirmation uses a short-lived server-issued restore plan bound to the exact validated source and current persisted-data version.
- **D-08:** Phase 3 restores are all-or-nothing. Do not support category-selective or record-level mixing.
- **D-09:** A completed restore creates a pre-restore backup and an immutable, privacy-minimal audit event.

### Storage failure recovery
- **D-10:** A storage read failure produces an explicit unavailable state, disables every data-changing operation, and never substitutes an editable empty dataset.
- **D-11:** Retry must complete a fresh server read and validation. Keep the admin interface locked until that succeeds, then replace the error state with current data.
- **D-12:** Staff see a non-sensitive failure category and correlation or incident ID. Backend and provider details stay out of the UI.
- **D-13:** While storage is unhealthy, mutation requests fail closed before writing, return a structured retryable service-unavailable response, and record minimal operational evidence. Do not queue writes or fall back to process-local storage.

### Backup and import policy
- **D-14:** An accepted package is a bounded, versioned, signed envelope containing creation time, source metadata, a content digest, and completely validated structure. Do not trust filenames or client metadata.
- **D-15:** Retain the newest 10 backups for at most 30 days. Preserve a backup beyond those limits while it is referenced by an unresolved restore incident.
- **D-16:** Import validation never mutates data. It creates a short-lived server-issued plan; applying that plan uses the restore preview, reason, typed-confirmation, version-check, and pre-change-backup safeguards.
- **D-17:** Lifecycle audit evidence includes actor ID, action, package or backup ID, schema version, digest, timestamps, outcome, safe reason category, incident ID, and retention or deletion event. Never copy snapshot contents or student data into audit records.

### the agent's Discretion
- Exact safe error-category names and incident-ID presentation, provided they remain non-sensitive and stable enough for support.
- Exact wording and visual treatment of inline unavailable, retry, preview, and confirmation states, while preserving the locked behavior above.
- Exact plan expiry duration and package-size ceiling, to be selected during research and planning from existing platform constraints.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| OPS-02 | An administrator sees only data-operation controls backed by implemented, authorized route handlers with explicit error and recovery states. | Add one staff-authorized capability contract, derive UI cards exclusively from it, and test hidden/unavailable/retry states. |
| OPS-03 | A storage read failure is surfaced without silently replacing persisted application data with an empty data set. | Separate not-found from read/parse failure at every adapter, introduce typed operational failures, and reject mutations before writes while health is unknown/unhealthy. |
| DATA-03 | Backup, restore, and import workflows use authenticated operations, validation, retention limits, and recoverable audit evidence. | Introduce signed versioned envelopes, server-held short-lived plans, version/digest binding, pre-change backup, retention/hold enforcement, and lifecycle audit records. |
</phase_requirements>

## Summary

Phase 3 should harden the existing `/api/admin/data/*` family and `ProgrammeAdminManager`; it should not create a second admin surface or replace the persistence adapters. The routes already use `requireActiveStaff`, and focused route and store tests already exist, so the safest plan is to strengthen the server contract from the storage boundary outward, then reconnect the client to that contract. [VERIFIED: repository inspection of `apps/web/app/api/admin/data/**`, `apps/web/components/admin/ProgrammeAdminManager.tsx`, and existing Jest tests]

The highest-risk defect is `JsonScholarScoutDataStore.read()`: its blanket `catch` converts missing files, permission failures, malformed JSON, and other I/O failures into `INITIAL_DATA`. Status and mutation helpers then treat that synthetic document as legitimate. HTTP and Blob distinguish some absence cases but still do not validate the complete stored document before returning it. Existing restore previews are recalculated count summaries, not short-lived capabilities; restore POSTs accept the source snapshot or backup ID directly and do not bind the apply step to the previewed source or persisted-data version. [VERIFIED: repository inspection of `apps/web/lib/server/data-store.ts`]

The implementation should add no external packages. Node 20 already supplies SHA-256/HMAC, random IDs, byte sizing, and timing-safe comparison; the repository already has a bounded streaming JSON parser and Jest/Testing Library infrastructure. Keep the whole-document write boundary for Phase 3, but make one restore write contain the restored document, pre-restore backup metadata/content, and lifecycle audit evidence so callers see a single adapter operation. Concurrent conflict-safe storage is Phase 4, while Phase 3's plan token must at least reject when the current document digest no longer matches the digest recorded at preview. [VERIFIED: repository inspection; Phase 3/4 boundary from approved context and roadmap]

**Primary recommendation:** Implement a server-only recovery service around the existing data-store port: strict read outcomes → capability response → signed package validation and server-held plan → version-bound single-write apply → capability-driven UI.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Storage read classification and validation | Database / Storage | API / Backend | Adapters know whether data is absent versus unreadable; server logic converts failures to safe categories. |
| Capability discovery and safe failure response | API / Backend | Browser / Client | Authority and actual route availability are server facts; the client only renders the returned contract. |
| Package envelope verification and impact preview | API / Backend | Database / Storage | Untrusted input must be bounded, authenticated, structurally validated, and compared with current persisted state. |
| Restore/import plan issuance and consumption | API / Backend | Database / Storage | The server binds actor, source digest, data version, and expiry; storage supplies the fresh state checked at apply. |
| Backup retention and incident holds | Database / Storage | API / Backend | Retention is enforced when the persisted document is composed; the API exposes only summaries. |
| Recovery UI and accessible state transitions | Browser / Client | API / Backend | React owns focus/loading/last-known presentation but never invents capabilities or health. |
| Lifecycle audit evidence | Database / Storage | API / Backend | Evidence must be part of the same persisted mutation where possible and must exclude snapshot/student content. |

## Current-State Gap Analysis

| Area | Current behavior | Required change |
|------|------------------|-----------------|
| JSON reads | Any `readFile` or `JSON.parse` error returns `INITIAL_DATA`. | Return empty only for verified missing-file (`ENOENT`); throw a typed categorized error for unreadable/invalid data. |
| HTTP/Blob reads | HTTP 404 and missing Blob return empty; returned JSON is shallow-normalized. | Preserve supported not-found semantics, then completely validate persisted structure before it can be used or written. |
| Status | Returns counts/configuration; unconfigured storage also reports zero counts. | Return explicit health plus capabilities and last-verified timestamp; never use zero counts for an unavailable read. |
| Capabilities | Client hard-codes status, backups, export, validation, planning, and restore URLs; export link has no matching route. | Add one canonical authorized capabilities endpoint/response and remove or hide actions that are not reported available. |
| Preview | Backup GET returns current/restore counts with no token, expiry, source digest, or current version. | Issue an opaque short-lived server plan containing only safe preview data and server-side bound metadata. |
| Import | Browser parses JSON; server accepts raw snapshot or `{data}` wrapper with no byte ceiling, schema version, digest, or signature. | Parse bounded bytes server-side; require exact versioned signed envelope and validate every supported collection. |
| Apply | POST accepts backup ID/raw snapshot, typed phrase, and optional reason; reason can default. | Require plan ID, non-empty bounded reason, exact phrase, matching actor/source/current digest, unexpired unused plan. |
| Backups | Keeps 5 by count; no age expiry, digest, schema version, hold, or lifecycle deletion evidence. | Keep newest 10 for 30 days, retain incident-held backups, and audit create/hold/release/delete lifecycle. |
| Audit | Generic data audit has user/action/entity/time; privileged audit is allowed/denied only. | Add privacy-minimal recovery lifecycle records with required identifiers/digest/outcome/reason category/incident linkage. |
| UI failures | Failed initial/refreshed fetches are silently ignored; empty backup array can look legitimate. | Model initial/loading/healthy/unavailable/refreshing explicitly, retain last-known read-only state, disable mutation, and provide manual Retry. |

All rows above are [VERIFIED: repository inspection of `data-store.ts`, admin data routes, `ProgrammeAdminManager.tsx`, and existing tests] compared against locked decisions D-01–D-17.

## Standard Stack

### Core

| Library/runtime | Version | Purpose | Why Standard Here |
|-----------------|---------|---------|-------------------|
| Next.js App Router | 15.5.15 | Staff-only route handlers and structured JSON responses | Already owns `/api/admin/data/*`; avoids architecture churn. |
| React | 18 | Admin recovery interaction state and accessibility behavior | Existing client component and UI primitives already use it. |
| TypeScript | 5.x | Exact capability, envelope, plan, error, audit, and result unions | Strict project baseline; makes invalid state combinations explicit. |
| Node `crypto` | Node 20.x | SHA-256 content/current-data digests, HMAC signatures, random plan/incident IDs, timing-safe checks | Built in and already used in `data-store.ts`; no dependency required. |
| Jest + Next Jest | 30.3.0 | Store, route, and component contract tests | Existing repository harness and focused Phase 3 tests. |
| Testing Library | 16.3.2 / user-event 14.6.1 | Accessible admin-state and interaction tests | Existing component-test stack. |

Versions are [VERIFIED: committed `package.json`, `apps/web/package.json`, and runtime probe]. No new package installation is required.

### Supporting

| Existing asset | Purpose | When to Use |
|----------------|---------|-------------|
| `parseJsonRequest` | Streaming byte ceiling plus JSON parsing and exact-shape delegation | Import validation and all apply endpoints. |
| `requireActiveStaff` | Fresh allowlist authorization with minimal authorization audit | Before parsing, plan lookup, or storage access in every staff route. |
| `ScholarScoutDataStore` injection seam | Adapter-independent read/write and deterministic failure tests | Unit and route tests, including throwing read/write stores. |
| Repository `Button`, `Card`, `Input`, `Badge` | Approved UI system | All Phase 3 UI work; do not initialize shadcn. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Process-local plan registry | Persist plan metadata in the ScholarScout document | Persistence survives serverless instance changes, but issuing a read-only plan would itself mutate the shared document and increase contention. Prefer a self-contained server-authenticated plan token if it can remain bounded and privacy-free. |
| Self-contained HMAC plan token | Process-local `Map` | A map is simple and testable but unreliable across Vercel instances/restarts. Use an opaque signed token containing only IDs/digests/expiry, never snapshot content. |
| Existing primitives | New UI library | A new library creates design and dependency churn without solving a Phase 3 requirement. |

**Installation:** None.

## Package Legitimacy Audit

Not applicable. Phase 3 requires no external packages.

## Architecture Patterns

### System Architecture Diagram

```text
Staff browser
  │ explicit Load / Refresh / Retry
  ▼
Next.js admin data route
  │ requireActiveStaff (before parsing/storage)
  ▼
Recovery application service
  ├─ fresh validated read ──failure──> safe category + incident ID + retryable 503
  │
  ├─ capability projection ──────────> available/allowed/action/reason/retry response
  │
  ├─ package validation ─────────────> bounded envelope → signature/digest/schema checks
  │                                      │
  │                                      ▼
  ├─ preview creation ───────────────> counts/deltas + signed plan token + expiry
  │
  └─ apply plan
       ├─ reauthorize + verify token/actor/expiry/source
       ├─ fresh read + current digest comparison
       ├─ mismatch ──────────────────> unchanged 409 + re-preview guidance
       └─ match ─────────────────────> one composed document write
                                        ├─ restored data
                                        ├─ pre-restore recovery backup
                                        └─ minimal lifecycle audit
```

### Recommended Project Structure

```text
apps/web/
├── lib/server/
│   ├── data-store.ts                 # adapters and persisted document normalization
│   └── data-recovery.ts              # envelopes, digests, capabilities, plans, retention, apply
├── app/api/admin/data/
│   ├── capabilities/route.ts         # canonical load/refresh/retry contract
│   ├── backups/...
│   └── import/...
├── components/admin/
│   └── ProgrammeAdminManager.tsx     # existing surface, capability-driven rendering
└── __tests__/
    ├── lib/data-recovery.test.ts
    ├── api/admin-data-routes.test.ts
    └── components/ProgrammeAdminManager.test.tsx
```

The exact split between `data-store.ts` and a new `data-recovery.ts` is planner discretion, but recovery policy should not remain interleaved with unrelated account/community persistence functions in the already-large store module. [VERIFIED: repository structure and module conventions]

### Pattern 1: Typed operational read outcome

**What:** Distinguish a valid absent store from invalid persisted data and provider/I/O unavailability using a typed error with stable safe category and generated incident ID. Preserve detailed causes only server-side.

**When to use:** Every administrative health/capability/read path and as a precondition to every mutation.

```typescript
type DataReadFailureCategory =
  | 'storage-unavailable'
  | 'invalid-persisted-data'
  | 'storage-timeout';

class DataOperationUnavailableError extends Error {
  constructor(
    readonly category: DataReadFailureCategory,
    readonly incidentId: string,
    options?: ErrorOptions,
  ) {
    super('Scholar Scout data is unavailable.', options);
  }
}
```

Source: [VERIFIED: project typed-error pattern and locked decisions D-10–D-13].

### Pattern 2: Canonicalized digest and signed capability token

**What:** Serialize the normalized envelope/data with one deterministic canonicalizer, hash the exact bytes, and authenticate the bounded plan claims with server-only HMAC. Store no snapshot/student content in the token.

**When to use:** Export/package verification, backup summaries, preview binding, and apply-time current-version checks.

```typescript
interface RestorePlanClaims {
  planId: string;
  actorId: string;
  sourceKind: 'backup' | 'import';
  sourceId: string;
  sourceDigest: string;
  currentDataDigest: string;
  schemaVersion: 1;
  expiresAt: string;
}
```

Source: [VERIFIED: Node crypto is already available; claim fields follow D-07, D-14, and D-17]. The canonical JSON representation and dedicated signing-secret configuration are implementation decisions that must be specified and tested before accepting packages.

### Pattern 3: Compose then write once

**What:** After all checks pass, construct the restored document, recovery backup, pruned/held backup set, and lifecycle audit in memory, validate the final document, then invoke the adapter's `write` once.

**When to use:** Backup restore and validated import apply.

This gives all-or-nothing behavior at the existing application port. It does not make the underlying HTTP fixture's direct `writeFile` crash-safe or solve cross-instance concurrent writes; those limitations must be documented and the latter remains Phase 4. [VERIFIED: `ScholarScoutDataStore` exposes one whole-document `write`; HTTP fixture currently writes directly]

### Pattern 4: Explicit client state machine

**What:** Use discriminated UI state (`loading`, `healthy`, `refreshing`, `unavailable`) plus independent plan/apply states. Retain a `lastVerified` payload only for display during refresh/failure; a separate `mutationsAllowed` condition must depend on the latest successful capability response.

**When to use:** Capability summary, backup list, preview/import flow, and result announcements.

Source: [VERIFIED: approved `03-UI-SPEC.md`].

### Anti-Patterns to Avoid

- **Blanket read catch → empty document:** conflates absence with corruption/outage and can erase real data on the next save.
- **Client endpoint inventory:** lets the UI advertise missing or unhealthy operations; render from the server capability response only.
- **Raw snapshot echoed through preview/apply:** exposes and allows tampering with sensitive data between validation and apply.
- **Browser-only confirmation:** does not bind the apply request to a server-approved preview.
- **Optional/default restore reason:** violates D-05; validate trimmed length server-side.
- **Plan lookup by backup ID alone:** fails actor, expiry, source-digest, and current-version binding.
- **Two separate adapter writes for backup then restore:** can leave only half the lifecycle committed.
- **Process-local fallback or queued mutations:** forbidden by D-13 and unsafe on serverless instances.
- **Treating failed backup reads as `[]`:** mislabels operational failure as a valid empty history.
- **Nested backup histories:** recursively expand sensitive snapshot size; keep backup `data.restoreBackups` empty.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cryptographic hashing/signing | Custom checksum or reversible signature | Node `createHash`, `createHmac`, `timingSafeEqual` | Correct primitives already ship with Node. |
| Bounded request buffering | Repeated unbounded `request.json()` calls | Existing `parseJsonRequest` | It checks declared and streamed bytes before parsing. |
| Staff authorization | JWT-role or client-role checks | Existing `requireActiveStaff` | It rechecks the live allowlist and audits the decision. |
| UI design system | New components/library for every state | Approved repository primitives and Tailwind tokens | Consistent accessibility and no platform churn. |
| Background restore jobs | Queue/worker workflow | Synchronous bounded Phase 3 operation | Background jobs are explicitly v2 (`DATA-05`). |

**Key insight:** This phase needs stronger contracts and state transitions, not more infrastructure dependencies.

## Common Pitfalls

### Pitfall 1: Fixing only the status route
**What goes wrong:** Status reports an outage, but another mutation reads synthetic empty data and writes it.
**How to avoid:** Correct adapter read semantics first; require a fresh validated read inside the apply service immediately before composing the write.
**Warning signs:** Any `catch { return INITIAL_DATA; }` remains, or mutation tests do not use a throwing store.

### Pitfall 2: A preview token that is bearer-only
**What goes wrong:** Another staff member can apply a captured token, or a token can be replayed.
**How to avoid:** Bind actor ID and plan ID; consume once. If using a self-contained token, persist a bounded used-plan marker or include idempotent result semantics so replay cannot create a second restore.
**Warning signs:** Apply verifies only HMAC and expiry.

### Pitfall 3: Digest instability
**What goes wrong:** Equivalent documents hash differently due to property ordering, or export verification hashes a representation different from the signed bytes.
**How to avoid:** Define one canonical byte representation and use it for package signature, content digest, source binding, and current-data version tests.
**Warning signs:** Multiple `JSON.stringify` call sites construct digests independently.

### Pitfall 4: Partial schema validation
**What goes wrong:** Unknown/invalid optional collections survive import and later crash or alter authorization/audit behavior.
**How to avoid:** Validate exact envelope keys and every persisted collection, including guest, platform, backup, and privileged audit extensions; reject unknown schema versions.
**Warning signs:** Validation uses casts after checking only the five legacy required fields.

### Pitfall 5: Audit evidence lost by restore
**What goes wrong:** The restored snapshot replaces the audit trail that records the restore.
**How to avoid:** Compose lifecycle evidence from the current trusted side and append it to the final document after normalizing the source; do not trust imported audit claims as operational evidence.
**Warning signs:** Apply begins its audit array from only `sourceData.auditEvents`.

### Pitfall 6: Retention by count only
**What goes wrong:** Old backups survive indefinitely or incident evidence is pruned.
**How to avoid:** Centralize pruning with age + newest-10 rules and explicit hold exceptions; test boundary timestamps and held items.
**Warning signs:** Direct `.slice(0, N)` remains in restore functions.

### Pitfall 7: Claiming atomicity beyond the adapter
**What goes wrong:** A direct filesystem write can be interrupted, or concurrent instances overwrite each other.
**How to avoid:** Promise one application-port write in Phase 3, test unchanged-on-validation/write failure, and explicitly defer adapter CAS/transactions to Phase 4.
**Warning signs:** Documentation claims transactional durability for JSON/HTTP/Blob adapters.

## Code Examples

### Structured fail-closed route response

```typescript
return NextResponse.json(
  {
    ok: false,
    error: 'data-operations-unavailable',
    category: failure.category,
    incidentId: failure.incidentId,
    retryable: true,
  },
  { status: 503 },
);
```

Source: [VERIFIED: existing explicit `NextResponse.json` route pattern plus D-12/D-13].

### Exact apply request contract

```typescript
interface ApplyRestoreRequest {
  planToken: string;
  reason: string;
  confirmation: typeof SCHOLARSCOUT_RESTORE_CONFIRMATION;
}
```

Use `parseJsonRequest` with `isExactObject`, reject whitespace-only/beyond-limit reasons, and never accept `snapshot` in the apply endpoint. Source: [VERIFIED: existing bounded request helper and D-05/D-07/D-16].

### Safe preview projection

```typescript
interface RestorePreviewResponse {
  planToken: string;
  expiresAt: string;
  source: {
    id: string;
    schemaVersion: number;
    digest: string;
  };
  rows: Array<{
    key: string;
    label: string;
    currentCount: number;
    restoredCount: number;
    delta: number;
  }>;
}
```

Source: [VERIFIED: current count-row contract narrowed by D-06/D-07 and UI-SPEC].

## State of the Art

| Old/current repository approach | Phase 3 approach | Impact |
|---------------------------------|------------------|--------|
| Raw/loosely wrapped snapshot | Exact signed versioned envelope | Provenance and integrity become enforceable. |
| Browser parses and resubmits snapshot | Server validates once and returns bound plan | Apply cannot silently diverge from preview. |
| Counts imply health | Explicit health/capability union | Outage cannot masquerade as empty data. |
| Count-only backup cap of 5 | Newest 10 / 30 days / incident holds | Meets locked retention and recovery policy. |
| Optional reason and generic audit | Required reason plus lifecycle audit | Recoverable operational evidence without student content. |

All comparisons are [VERIFIED: current repository implementation versus approved Phase 3 context].

## Recommended Planning Sequence

1. **Wave 0 — tests and contracts:** Define fixtures for valid envelope, corrupted signature/digest/schema, throwing reads/writes, deterministic clock, and plan token verification. Add component fetch/state harness before implementation.
2. **Storage read safety:** Introduce typed read failures, distinguish verified absence, and validate normalized stored data for JSON/HTTP/Blob. Ensure status and mutations propagate failure without zero fallback.
3. **Recovery domain service:** Add canonical serialization, digest/signature, capability projection, plan issuance/verification, retention/holds, lifecycle audit types, and one-write apply composition.
4. **Route contracts:** Add/reshape capability, backup plan/apply, and import validate/apply routes. Authorize first, bound/validate second, read/plan/apply third. Remove raw snapshot apply.
5. **UI state machine:** Refactor the data-operations section of `ProgrammeAdminManager` to server capabilities and the approved accessibility/copy states. Remove the unsupported export action unless a safe route is implemented and reported.
6. **Adapter and regression verification:** Run store, route, component, full web test/typecheck/lint/build gates; then exercise each supported adapter's absence/failure semantics where practical.

This ordering is [VERIFIED: dependency direction `components → routes → lib/server → adapter`] and prevents UI work from encoding a temporary or unsafe route contract.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Use a 10-minute plan lifetime. [ASSUMED] | Discretion recommendation | Too short may frustrate staff; too long enlarges replay window. Make it a named constant and test boundaries. |
| A2 | Use a 5 MiB maximum import-package request size. [ASSUMED] | Discretion recommendation | Existing production snapshots may exceed it. Before execution, measure a sanitized production-size sample or expose a server config with a hard upper bound. |
| A3 | A dedicated `SCHOLARSCOUT_DATA_PACKAGE_SIGNING_SECRET` can be provisioned in every target environment. [ASSUMED] | Signing architecture | Missing secret should make package capabilities unavailable, not fall back to `NEXTAUTH_SECRET`; deployment configuration and readiness checks must be updated. |

## Open Questions

1. **Package signing key lifecycle**
   - What we know: D-14 requires a signed envelope, and no dedicated package-signing secret is currently configured. [VERIFIED: context and env references]
   - What's unclear: rotation/grace policy for validating older retained backups.
   - Recommendation: include a non-secret key ID in the envelope and support the current key plus explicitly configured previous verification key; fail the capability closed when none is configured.

2. **Plan replay control across serverless instances**
   - What we know: a process-local map is not shared across Vercel instances, while D-07 requires short-lived binding. [VERIFIED: Vercel deployment and process-local singleton pattern]
   - What's unclear: whether Phase 3 may persist consumed-plan markers in the shared document.
   - Recommendation: include `planId` in the lifecycle audit and make apply idempotently return the recorded result when the same valid plan is repeated; verify this in the same composed document write. Full distributed compare-and-set remains Phase 4.

3. **Incident hold resolution authority**
   - What we know: D-15 requires unresolved incidents to hold backups, but no incident model or resolution route exists. [VERIFIED: repository search]
   - What's unclear: who resolves a hold and through what supported operation.
   - Recommendation: Phase 3 should create/retain holds and surface them; if no explicit resolution workflow is approved, do not add a release action and require a documented maintainer recovery process.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Build/tests and Node crypto | ✓ | 20.20.2 direct runtime | Project requires Node 20.x. |
| pnpm | Workspace commands | ⚠ | PATH reports 11.19.0; project pins 10.34.5 | Use Corepack-selected 10.34.5 after environment/sandbox path repair. |
| Corepack | Pinned pnpm selection | ⚠ | Installed, but invocation hit sandbox `EPERM` resolving `C:\Users\judge` | Run in normal project terminal or repair allowed runtime path. |
| Vercel Blob credentials/service | Adapter integration verification | Not probed (secret/external) | — | Use injected adapter unit tests; perform production-like smoke later. |
| HTTP fixture service | Adapter integration verification | ✓ source available | Node built-in service | Start locally from workspace after pnpm repair. |

**Missing dependencies with no fallback:** A working pinned pnpm 10.34.5 execution path is required for the full verification gate.

**Missing dependencies with fallback:** External Blob access is not required for unit/route planning; use the existing injected-store and mocked Blob seams, then retain deployment smoke as manual evidence.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30.3.0 with Next Jest; Testing Library 16.3.2 |
| Config file | `apps/web/jest.config.ts` |
| Quick run command | `pnpm --filter @scholar-scout/web run test -- --runInBand __tests__/lib/data-recovery.test.ts __tests__/api/admin-data-routes.test.ts` |
| Full suite command | `pnpm --filter @scholar-scout/web run test -- --runInBand` |

The current focused suite could not be executed in this research session because PATH supplied pnpm 11.19.0/Node 24 to the pnpm process while the project pins pnpm 10.34.5/Node 20.x; Corepack fallback then hit a sandbox `EPERM` while resolving `C:\Users\judge`. [VERIFIED: command output on 2026-08-25]

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OPS-02 | Capability response is authorized, canonical, and controls visible actions; refresh failure retains read-only last-known state and disables mutations. | Route + component | focused admin route and component Jest files | ❌ Wave 0 component coverage; route file exists but needs new cases |
| OPS-03 | Missing store is valid empty; corrupt/unreadable/timeout reads become categorized failures; status returns 503 and no mutation writes. | Unit + route | focused data-store/recovery and admin route Jest files | ❌ Wave 0 throwing/corrupt adapter cases |
| DATA-03 | Invalid/oversized/unsigned/bad-digest/unsupported envelopes never write; valid preview is count-only and bound to actor/source/current digest/expiry; apply writes once with backup/audit and prunes by policy. | Unit + route | focused recovery and admin route Jest files | ❌ Wave 0 recovery contract cases |
| DATA-03 | Keyboard focus, live regions, disabled duplicate apply, reason/confirmation reset, expiry/conflict recovery, responsive-safe table semantics. | Component | `ProgrammeAdminManager.test.tsx` | ❌ Wave 0 |

### Required Test Scenarios

- Adapter reads: JSON `ENOENT` → valid empty; JSON permission error/malformed JSON → unavailable; HTTP 404 → valid empty; HTTP non-2xx/invalid body → unavailable; Blob missing → valid empty; Blob stream/parse/provider failure → unavailable.
- Capability route: unauthenticated/removed staff denied before storage; healthy partial capabilities; unconfigured signing key hides import/restore; throwing read returns safe 503 with incident ID and no provider text.
- Envelope: exact keys, schema version, timestamp bounds, source metadata bounds, signature, digest, byte limit, every persisted collection, unknown fields/version rejection.
- Plan: count-only response; actor/source/current digest binding; expiry boundary; changed source/current document; malformed signature; one-use/idempotent replay behavior.
- Apply: whitespace reason and wrong phrase rejected before write; pre-change backup contains no nested backups; one adapter write; write rejection returns unchanged/failure; required audit fields exclude snapshot/student data.
- Retention: newest-first, exactly 10, over 10, 30-day boundary, old held backup retained, released/expired items pruned with deletion event, duplicate IDs rejected.
- UI: initial loading, verified zero/empty, last-known refresh, unavailable alert/focus, Retry, plan focus, expiry/conflict re-preview, pending duplicate prevention, success/failure announcement, long IDs/reasons.

### Sampling Rate

- **Per task commit:** focused test file(s) for the changed server, route, or component boundary.
- **Per wave merge:** `pnpm --filter @scholar-scout/web run test -- --runInBand` plus web typecheck.
- **Phase gate:** full repository `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm build:vercel` green before `$gsd-verify-work`; perform the Phase 2 live credential-limiter UAT before Phase 3 execution begins.

### Wave 0 Gaps

- [ ] `apps/web/__tests__/lib/data-recovery.test.ts` — envelope, digest, plan, retention, audit, and apply invariants.
- [ ] Extend `apps/web/__tests__/lib/data-store.test.ts` — adapter absence versus failure and persisted-document validation.
- [ ] Extend `apps/web/__tests__/api/admin-data-routes.test.ts` — capability, bounded input, 409/410/413/503, actor binding, and no-write failures.
- [ ] `apps/web/__tests__/components/ProgrammeAdminManager.test.tsx` — approved UI state/accessibility contract.
- [ ] Shared deterministic fixtures for clock, signing key, valid envelope, digest, and throwing/counting store.
- [ ] Repair/use the pinned Node 20 + pnpm 10.34.5 command path before treating test results as evidence.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | NextAuth session via `requireActiveStaff`. |
| V3 Session Management | yes | Re-resolve session and active allowlist on every route; bind plan to actor. |
| V4 Access Control | yes | Authorize before parsing, plan access, or storage reads; server owns capabilities. |
| V5 Input Validation | yes | Bounded streaming parser, exact envelope/apply shapes, complete structural validation. |
| V6 Cryptography | yes | Node SHA-256/HMAC/timing-safe comparison; dedicated server-only signing key. |
| V7 Error/Logging | yes | Safe categories and incident IDs in UI; provider causes stay server-side; privacy-minimal audit. |
| V8 Data Protection | yes | Count-only preview, private backup contents, no student data in lifecycle audit. |
| V12 File/Resource | yes | Strict byte ceiling, schema/signature/digest checks; never trust filename/client metadata. |
| V13 API | yes | Exact request/response contracts, correct 4xx/5xx semantics, fail-closed mutations. |

The applicable categories and controls are [VERIFIED: phase requirements, locked context, and repository server boundaries].

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Tampered import or plan | Tampering | HMAC signature, exact schema, digest comparison, timing-safe verification. |
| Replay/cross-actor plan use | Spoofing / Elevation | Actor-bound short TTL, plan ID, consumed/idempotent record, fresh authorization. |
| Oversized/deep JSON | Denial of Service | Byte limit before parsing plus bounded collection/string counts. |
| Outage represented as empty | Tampering / Availability | Typed read failure, explicit 503, no mutation without fresh validated read. |
| Sensitive snapshot in preview/audit | Information Disclosure | Count-only DTOs and privacy-minimal lifecycle records. |
| Lost concurrent update between preview/apply | Tampering | Current-document digest mismatch → unchanged 409 and re-preview; full CAS deferred to Phase 4. |
| Partial restore after failure | Tampering | Compose/validate once and invoke adapter write once; test unchanged behavior on pre-write failures. |

## Project Constraints (from AGENTS.md)

- Retain Next.js 15, React 18, TypeScript, NextAuth, Vercel, Node 20.x, and pnpm 10.34.5; avoid unnecessary platform churn.
- Preserve production data with incremental, tested migration boundaries and do not overwrite unrelated in-progress feature work.
- Use App Router filenames, PascalCase components, kebab-case domain modules, strict TypeScript, two-space indentation, single quotes, semicolons, and repository import conventions.
- Put server-only data access in `apps/web/lib/server/`; browser code reaches it through server pages or route handlers.
- Authenticate and validate early; return explicit structured statuses for expected route failures and do not mask unexpected errors as success.
- Use existing UI primitives/Tailwind patterns and preserve accessibility attributes.
- Add/extend `*.test.ts`/`*.test.tsx` coverage and run lint with zero warnings; verify typecheck and relevant tests.
- Keep route exports focused on HTTP handlers and delegate persistence/domain work to server library modules.
- Preserve the dependency direction `app/components → lib → lib/server`; do not create broad barrels.
- Use GSD planning/execution workflows for changes; this research artifact is part of `$gsd-plan-phase 3`.

These constraints are [VERIFIED: `AGENTS.md` and `PROJECT-INDEX.md`].

## Sources

### Primary (HIGH confidence)

- `03-CONTEXT.md` — locked Phase 3 behavior and scope.
- `03-UI-SPEC.md` — approved UI states, accessibility, copy, and design system.
- `.planning/REQUIREMENTS.md` and `.planning/ROADMAP.md` — OPS-02, OPS-03, DATA-03 and phase boundary.
- `apps/web/lib/server/data-store.ts` — adapters, validation, backup, restore, normalization, and audit implementation.
- `apps/web/app/api/admin/data/**/route.ts` — current authorized route contracts.
- `apps/web/components/admin/ProgrammeAdminManager.tsx` — current UI behavior and unsupported export link.
- `apps/web/lib/api-request.ts` and `apps/web/lib/server/active-staff.ts` — reusable bounded parsing and authorization seams.
- `apps/web/__tests__/api/admin-data-routes.test.ts`, `apps/web/__tests__/lib/data-store.test.ts`, and `apps/web/jest.config.ts` — current validation architecture.
- `services/http-data-service/src/server.mjs`, `docs/http-data-adapter-runbook.md`, and `docs/vercel-blob-data-adapter.md` — adapter behavior and operational limits.
- `AGENTS.md`, `PROJECT-INDEX.md`, and `.planning/codebase/*` — project constraints, architecture, concerns, and testing conventions.

No external web sources or new package claims were required; repository sources are authoritative for this phase's implementation planning.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from manifests and current source; no new packages.
- Architecture: HIGH — traced existing routes, client, server modules, adapters, and tests.
- Pitfalls: HIGH — each is directly exhibited by current code or follows from locked decisions.
- Discretionary constants: LOW — plan lifetime, package ceiling, and signing-key availability require implementation validation.

**Research date:** 2026-08-25
**Valid until:** 2026-09-24 (implementation topology is stable; re-check manifests and phase context if planning resumes later)
