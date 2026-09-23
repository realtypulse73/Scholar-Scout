# Phase 10: Curated Import and Governed Staff Publication - Research

**Researched:** 2026-09-22  
**Domain:** Staff-only catalogue staging, evidence validation, versioned publication, and conditional persistence  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Staff roles, review, and automated checks
- **D-01:** Use three active staff capabilities: an editor can create, revise, correct, and resubmit candidate records; a reviewer can review regular-staff candidates and make authorized emergency corrections; an administrator can make the final weekly release and may self-publish an administrator-owned candidate. Every privileged action remains restricted to active authorized staff and creates minimal audit evidence. — **Reversibility:** costly — changing the role/capability contract later requires migrating authorization rules, audit meanings, and staff operations.
- **D-02:** A regular staff candidate requires a different active reviewer before it can enter an approved release batch. An administrator-owned candidate may be approved for publication by its administrator only after the automated checklist passes.
- **D-03:** The automated checklist must gate every approval, weekly release, and emergency correction. It verifies the required source, material facts/evidence, freshness state, claim wording boundary, regional boundary relationship, and media-rights metadata. Human reviewers use the passing checklist as their review basis; the system must not present a pass as proof of a source's real-world truth.
- **D-04:** A checklist failure leaves the candidate private as a draft, lists exact correctable failures, preserves the creator's valid work, and permits correction and resubmission. A post-approval edit invalidates that approval and requires a new review.

#### Curated intake and weekly snapshot publication
- **D-05:** Support both existing individual staff editing for corrections and a bounded, structured candidate-import file for small batch intake. Imports must only stage validated drafts; they never fetch provider sites, write directly to the learner read model, or publish automatically. — **Reversibility:** costly — changing the candidate-file contract later requires compatibility handling for staff tooling and source fixtures.
- **D-06:** Limit a weekly candidate batch to 25 changed records. The planner may choose a lower safe limit if current conditional-write tests establish a stricter bound. This is a safety boundary for the existing whole-document store, not a promise of unlimited catalogue capacity.
- **D-07:** Publish weekly only when an administrator explicitly reviews the approved batch and presses Publish. The release creates a named, deterministic catalogue snapshot and manifest. Learner-facing reads use only that published snapshot through the governed catalogue boundary; they must not scrape, aggregate, or depend on a live provider.
- **D-08:** Keep every replaced public snapshot internally with its manifest and minimal audit history so an administrator can restore it. Previous versions are not learner-browseable by default.

#### Conflict repair and emergency corrections
- **D-09:** On a stale revision conflict, show the current and attempted record values side by side and let staff select what to keep. If they choose an older value over a newer value, require a short reason in the audit record.
- **D-10:** An active authorized reviewer may make an urgent correction outside the weekly schedule. It must become a new named emergency snapshot, pass the automated checklist, record the reason, and retain the prior snapshot for restoration.
- **D-11:** If a record fails the final release check, exclude and quarantine that record with its correction list while publishing only the other passing records. A missing or invalid source, claim, boundary, or rights requirement can never be converted into a public `needs confirmation` substitute.

#### Media-rights metadata
- **D-12:** Provider media is publishable only when the record stores documented Scholar Scout ownership, a licence, provider approval, or an approved embed, plus the source and any expiry date. When that proof does not exist, publish factual text with official source links instead. — **Reversibility:** costly — loosening this contract would change the rights-safe media boundary consumed by later provider pages.
- **D-13:** Before every weekly release and emergency correction, automatically recheck stored media-rights status. Expired, revoked, or uncertain rights immediately remove the media and use the factual text-and-source fallback.
- **D-14:** Incomplete media-rights proof blocks media only, not an otherwise valid factual provider record.

#### Audit history
- **D-15:** Authorized staff can inspect concise per-record and per-snapshot audit history: actor, staff capability, action, timestamp, outcome, version, required reason when applicable, and correction/review status. Audit views must not expose secrets, tokens, learner data, or provider-private information; learners do not receive this operational history.

### the agent's Discretion
- Choose the exact safe structured import representation, manifest schema, role configuration shape, and staff UI composition while preserving the locked lifecycle and no-live-provider boundary.
- Use existing conditional revision and minimal-audit patterns; do not add a database, CMS, hosted search, or unbounded bulk migration for this phase.

### Deferred Ideas (OUT OF SCOPE)
- Phase 11 owns learner-facing six-area browsing, filtering, comparing, and source/status displays.
- Phase 13 owns provider-media display, accessibility, and transition-story experiences; this phase stores and gates only the rights metadata.
- Phase 15 owns the sustainable six-area coverage/freshness operation and release gate.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|---|---|---|
| EVID-03 | Staff review source, required evidence, freshness, and claim boundary before public release. | A pure checklist returns correction codes; approval/release routes run it again server-side. |
| EVID-04 | Learners read a deterministic, reviewed versioned snapshot and never depend on a live provider. | New public read boundary exposes only the stored active snapshot and never invokes `fetch`. |
| PUB-01 | Active authorized staff alone create, revise, publish, retire, or restore records with validation and audit evidence. | Extend the current allowlist boundary with capability configuration and one CAS-backed server lifecycle module. |
| PUB-02 | Evidence failures block release with recoverable correction and no silent discard. | Failed candidates remain private with structured correction codes; final release quarantines only bad records. |
| PUB-03 | A small validated batch is previewable and recoverable without unbounded rewrite or automatic publication. | JSON import envelope has a 25-change cap; snapshot release/restore is one conditional write with a retained manifest. |
</phase_requirements>

## Summary

Phase 10 should add a **separate, incremental catalogue-publication slice** rather than repurpose the legacy `Programme` record as the new six-region contract. Phase 9 already supplies controlled region/pathway and fact-evidence validators. The current programme administration feature supplies the useful patterns—server-only access, strict current staff allowlist checks, draft/review labels, revision conflict responses, and conditional writes—but it does not contain candidate ownership, reviewer independence, immutable snapshots, rights metadata, or a release manifest. [VERIFIED: repository `apps/web/lib/catalogue-contract.ts`, `apps/web/lib/admin-programmes.ts`, `apps/web/lib/server/programme-records.ts`]

The public read seam must become `getPublishedCatalogueSnapshot()` (or equivalently named server-only function), which returns only the most recently selected stored snapshot. Staging, review, batch selection, publication, emergency correction, and restore must be command functions behind staff-only route handlers. Every mutating command reads one version, verifies its expected version, and writes once; it returns a safe conflict result instead of retrying or overwriting another staff member’s work. [VERIFIED: repository `apps/web/lib/server/persistence-operations.ts`, `apps/web/lib/server/data-store.ts`, `apps/web/__tests__/lib/data-store.test.ts`]

**Primary recommendation:** Add a versioned `cataloguePublicationState` to the existing document store, a pure `catalogue-publication` contract/checklist module, and focused staff-only routes/UI. Use a versioned JSON import file containing at most 25 candidate changes; never route it through the existing whole-application recovery import.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| Candidate form/import usability and conflict comparison | Browser / Client | API / Backend | The client can render drafts and compare values, but it cannot authorize or decide release eligibility. |
| Staff capability authorization | API / Backend | Frontend Server | Every route calls the current server-only active-staff guard before parsing body or reading state. |
| Checklist, lifecycle transitions, media fallback decision | API / Backend | Database / Storage | Pure domain validation runs in trusted server commands and is stored with candidate/snapshot state. |
| Candidate and snapshot persistence | Database / Storage | API / Backend | The whole-document port owns version reads/writes; command functions compose bounded changes through CAS. |
| Public reviewed catalogue read | Frontend Server (SSR) | Database / Storage | Future learner pages read the active snapshot through a server-only boundary, never a provider site. |
| Weekly release and emergency restore controls | API / Backend | Database / Storage | These are explicit privileged mutations with final checks, manifest creation, audit append, and conditional write. |

## Standard Stack

### Core

| Library / capability | Version | Purpose | Why Standard |
|---|---:|---|---|
| Next.js App Route Handlers | 15.5.15 | Staff-only JSON endpoints under `app/api`. | Existing route modules already authorize early and return explicit JSON statuses. [VERIFIED: repository `apps/web/package.json`, `apps/web/app/api/admin/programmes/route.ts`] |
| Auth.js / NextAuth | 4.24.14 | Obtain the authenticated session used by the active-staff guard. | Retain the existing identity foundation; do not create a second staff login path. [VERIFIED: repository `apps/web/package.json`, `apps/web/lib/server/active-staff.ts`] |
| TypeScript pure contract modules | 5.x | Controlled unions, validation, lifecycle transition rules, and test fixtures. | Phase 9 and existing programme administration already follow this pattern. [VERIFIED: repository `apps/web/lib/catalogue-contract.ts`, `apps/web/lib/admin-programmes.ts`] |
| `ScholarScoutDataStore` conditional reads/writes | existing port | Persist bounded candidate and snapshot state. | Existing adapters expose versioned reads/writes and map provider precondition failures to no-write conflicts. [VERIFIED: repository `apps/web/lib/server/data-store.ts`, `apps/web/__tests__/lib/data-store.test.ts`] |

### Supporting

| Capability | Purpose | When to Use |
|---|---|---|
| Node `crypto` SHA-256 | Compute a non-secret digest of canonical manifest content. | Include a content fingerprint in the manifest; do not present it as a guarantee of source truth. [VERIFIED: repository `apps/web/lib/server/data-recovery.ts`] |
| Jest 30.3.0 / `next/jest` | Unit, server command, and route-handler tests. | Add focused suites before each lifecycle command is introduced. [VERIFIED: repository `apps/web/package.json`, `apps/web/jest.config.ts`] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|---|---|---|
| Incremental document-store slice | New database/CMS | The locked scope forbids platform churn; the existing CAS tests support a bounded 25-change command now. |
| Structured JSON candidate file | CSV/spreadsheet import | JSON safely represents nested per-fact evidence and rights metadata without a custom column grammar. |
| Explicit server command routes | Client-side publication logic | Browser checks can improve guidance but cannot safely enforce authority, checklist, snapshot, or conflict rules. [CITED: https://nextjs.org/docs/app/guides/authentication] |

**Installation:** No package installation is needed.

## Package Legitimacy Audit

No external packages are introduced in this phase; the package legitimacy gate is not applicable.

## Architecture Patterns

### System Architecture Diagram

```text
staff browser / structured JSON import
             |
             v
focused /api/admin/catalogue Route Handler
             |
             +--> requireActiveStaffCapability(action, capability)
             |        | deny: safe 403 + minimal authorization audit
             v
parse bounded input + pure catalogue checklist
             |
             +--> invalid -> private draft/quarantine + correction codes
             v
catalogue-publication server command
  (candidate revision / reviewer independence / release selection)
             |
             v
readVersionedScholarScoutData -> one conditional write
             |
             +--> CAS conflict -> safe 409 + current record/revision only
             v
cataloguePublicationState
  candidates | immutable snapshots/manifests | concise audit events
             |
             v
getPublishedCatalogueSnapshot (server only)
             |
             v
future Phase 11 learner pages (stored snapshot only; no provider runtime calls)
```

### Recommended Project Structure

```text
apps/web/
├── lib/
│   ├── catalogue-contract.ts              # Phase 9 vocabulary/evidence validators
│   ├── catalogue-publication.ts           # candidate, rights, checklist, manifest pure logic
│   └── server/
│       ├── active-staff.ts                 # current allowlist plus capability guard
│       └── catalogue-publications.ts       # CAS-backed commands and public snapshot read
├── app/api/admin/catalogue/
│   ├── candidates/route.ts                 # list/stage individual candidates
│   ├── imports/route.ts                    # bounded JSON staging only
│   ├── release/route.ts                    # weekly administrator release
│   ├── emergency/route.ts                  # reviewer emergency correction
│   └── snapshots/[id]/restore/route.ts     # administrator restore
├── components/admin/
│   └── CataloguePublicationManager.tsx     # separate staff manager, conflict and audit views
└── __tests__/
    ├── lib/catalogue-publication.test.ts
    ├── lib/server/catalogue-publications.test.ts
    └── api/admin-catalogue-publications.test.ts
```

### Pattern 1: Explicit server-side staff capabilities

**What:** Keep `SCHOLARSCOUT_STAFF_EMAILS` as the current active allowlist and add a strict, server-only configuration mapping each allowed email to one or more controlled capabilities: `editor`, `reviewer`, `administrator`. A route must first pass the active allowlist, then pass the requested capability. A stored/JWT `role` alone remains insufficient because the existing guard deliberately checks current configuration each request. [VERIFIED: repository `apps/web/lib/server/active-staff.ts`, `apps/web/__tests__/api/active-staff.test.ts`]

**Recommended configuration shape:** JSON object keyed by normalized email, for example `{ "editor@example.test": ["editor"], "reviewer@example.test": ["editor", "reviewer"], "admin@example.test": ["editor", "reviewer", "administrator"] }`. Reject malformed JSON, unknown capability strings, duplicate normalized keys, emails absent from the active allowlist, and an empty capability set. Treat a bad configuration as deny-all for catalogue mutations. This is an implementation recommendation based on the locked D-01 capability model. [ASSUMED]

**When to use:** Before request JSON parsing, data-store access, or import-body decoding for every catalogue route. Next.js treats Route Handlers like public-facing endpoints and advises route-specific access verification. [CITED: https://nextjs.org/docs/app/guides/authentication]

```typescript
// Source: existing active-staff guard pattern + locked D-01
const authorization = await requireActiveStaffCapability({
  action: 'catalogue:weekly-release',
  route: '/api/admin/catalogue/release',
  capability: 'administrator',
});
if (!authorization.ok) return authorization.response;
// Only now parse the body and call the command.
```

### Pattern 2: One canonical private candidate contract and checklist

**What:** Create a `CatalogueCandidate` with a stable ID, creator ID, record revision, lifecycle status (`draft`, `in-review`, `approved`, `quarantined`, `retired`), candidate record, checklist result, reviewer information, and review-invalidated-on revision. The candidate record must refer to Phase 9 `CatalogueRegionId`, `CataloguePathway`, card facts, and field-level evidence rather than copy ad hoc source text. [VERIFIED: repository `apps/web/lib/catalogue-contract.ts`]

**Checklist output:** Return ordered machine-readable correction items such as `source-required`, `fact-evidence-invalid`, `freshness-invalid`, `claim-boundary-invalid`, `region-boundary-invalid`, and `media-rights-invalid`. The same `evaluateCatalogueChecklist(candidate, now)` function runs while staging, reviewing, final weekly release, and emergency correction. A `pass` means only that the stored contract is complete and internally consistent; it never represents an assertion that a provider statement is true. [VERIFIED: Phase 10 CONTEXT.md D-03/D-04]

**Media result:** The checklist distinguishes record blockers from media blockers. An invalid or absent media-rights object strips `media` from the public snapshot and records the factual-text/source fallback; it does not reject an otherwise valid record. Expired/revoked/uncertain rights are evaluated afresh at release time. [VERIFIED: Phase 10 CONTEXT.md D-12/D-13/D-14]

### Pattern 3: Bounded JSON staging, never recovery import

**What:** Accept a versioned JSON file shaped as `{ schemaVersion: 1, changes: [...] }`, with a maximum of 25 changes and a byte/depth/array bound. Each change declares an explicit action (`upsert` or `retire`), a stable record ID, expected candidate/record revision where applicable, and its complete typed record. The route stages each valid change as a private candidate draft; it never updates `activeSnapshotId`. [VERIFIED: Phase 10 CONTEXT.md D-05/D-06/D-07]

**Why JSON:** Phase 9 requires nested source dates, per-fact evidence, card facts, controlled region/pathway values, and rights metadata. A schema-versioned JSON file preserves those structures without creating a hand-rolled CSV escaping/column-mapping format. [ASSUMED]

**Do not reuse:** `restoreScholarScoutDataFromImport` and the signed recovery-envelope code operate on a full `ScholarScoutData` document, can restore users and other unrelated collections, and are therefore the wrong trust boundary for catalogue candidate intake. [VERIFIED: repository `apps/web/lib/server/data-store.ts`, `apps/web/lib/server/data-recovery.ts`]

### Pattern 4: Revision conflict with explicit older-value reason

**What:** Retain the current single-attempt CAS behavior. A stale save returns only the current candidate/record revision and safe comparable values; the client renders current/attempted values side by side. When the staff member selects an older attempted value over a newer current value, the command requires a bounded non-empty reason and adds it to the concise catalogue audit event. [VERIFIED: repository `apps/web/lib/server/programme-records.ts`, `apps/web/lib/admin-programmes.ts`, Phase 10 CONTEXT.md D-09]

**When to use:** Individual edit, candidate correction, review result, batch assembly, weekly release, emergency release, and restore. Do not automatically retry a replacement mutation; the existing store tests prove only one concurrent writer can commit a version. [VERIFIED: repository `apps/web/__tests__/lib/data-store.test.ts`]

### Pattern 5: Immutable active snapshot and deterministic manifest

**What:** Store `snapshots` as append-only records and one `activeSnapshotId`. A weekly release reads the approved candidate revisions, runs the checklist again, sorts records by stable ID, applies at most 25 selected changes to the last active snapshot, and writes a new named snapshot plus manifest in one conditional mutation. The manifest should include snapshot ID, sequence/version, release kind (`weekly`, `emergency`, `restore`), created timestamp, sorted included record IDs/revisions, excluded/quarantined IDs with correction codes, prior snapshot ID, and non-secret canonical content digest. [VERIFIED: Phase 10 CONTEXT.md D-06/D-07/D-08/D-10/D-11; repository `apps/web/lib/server/data-recovery.ts`]

**Restore:** An administrator selects a retained snapshot and writes a new `restore` snapshot that references it; do not point the active ID backward in place. This preserves a linear public history and a restorable prior version. The existing data-recovery module demonstrates a versioned read, single conditional write, safe conflict, and retained-before-restore pattern. [VERIFIED: repository `apps/web/lib/server/data-recovery.ts`]

### Pattern 6: Public snapshot read boundary

**What:** Add a server-only `getPublishedCatalogueSnapshot()` that returns an immutable clone/view of the active snapshot or an explicit empty state. No public handler/page calls provider APIs or `fetch` as part of the catalogue read. Keep this new boundary separate from `getGovernedProgrammes()` until Phase 11 deliberately switches learner discovery to the six-area snapshot contract. [VERIFIED: repository `apps/web/lib/server/programme-records.ts`, Phase 10 CONTEXT.md D-07]

### Anti-Patterns to Avoid

- **Adding candidate fields to `Programme` globally:** legacy programme types contain obsolete publication/ranking fields and use a different source-evidence model. Build beside the Phase 9 contract and bridge only when Phase 11 owns discovery. [VERIFIED: repository `apps/web/lib/programmes.ts`, `apps/web/lib/catalogue-contract.ts`]
- **Checking staff capability only in `StaffGate`:** the visual gate is not authorization; route handlers remain direct request entry points. [VERIFIED: repository `apps/web/components/auth/StaffGate.tsx`, `apps/web/lib/server/active-staff.ts`]
- **Publishing in the import route:** import stages private candidates only; its success response must never change the active snapshot. [VERIFIED: Phase 10 CONTEXT.md D-05/D-07]
- **Whole-document recovery as candidate import:** it risks overwriting student and operational collections. [VERIFIED: repository `apps/web/lib/server/data-recovery.ts`]
- **Last-write-wins/retry on conflict:** it hides another staff member’s change and defeats the required comparison/reason flow. [VERIFIED: repository `apps/web/lib/server/programme-records.ts`]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Provider intake | Scraper, live API aggregator, browser fetch | Staff-entered/JSON-staged typed candidates | Learner reads must be deterministic and independent of live providers. |
| Storage concurrency | In-memory lock or automatic retry loop | Existing versioned store + one conditional write | Works across JSON/HTTP/Blob adapter boundaries and preserves a recoverable conflict. |
| Whole-app import | Generic snapshot restore for catalogue changes | Focused bounded candidate-import parser | Prevents a catalogue action from replacing unrelated student data. |
| Rights decision | “Publicly visible” heuristic | Controlled rights metadata and factual fallback | Public visibility is not permission; the locked contract requires evidence. |
| Capability check | UI-only role flag/JWT-only role | Current active allowlist plus server-side capability map | Revocations and malformed config must fail closed on every privileged request. |

**Key insight:** The phase is not a CMS. It is a small, explicit editorial state machine layered on the existing document port, with every public catalogue change produced as a bounded, auditable snapshot.

## Runtime State Inventory

| Category | Items Found | Action Required |
|---|---|---|
| Stored data | JSON, HTTP, and Vercel Blob adapters persist one normalized `ScholarScoutData` document; legacy documents contain no catalogue-publication slice. | Add an optional/defaulted `cataloguePublicationState`; update `INITIAL_DATA`, normalization, full-import validation, and full-import normalization so recovery does not discard it. This is an additive schema change, not a destructive data migration. [VERIFIED: repository `apps/web/lib/server/data-store.ts`] |
| Live service config | Current active staff uses `SCHOLARSCOUT_STAFF_EMAILS`; no capability map exists. | Add a maintainer-owned, server-only capability configuration and document its exact required format. Reject inconsistent/invalid configuration. [VERIFIED: repository `apps/web/lib/server/active-staff.ts`] |
| OS-registered state | None found in this phase’s implementation seams. | None. [VERIFIED: repository scan of `apps/web` and current GSD references] |
| Secrets / environment variables | Existing staff allowlist and data-adapter credentials are environment-owned. | Do not expose credentials or change data-adapter keys. Capability configuration should not be returned in staff APIs or audit payloads. [VERIFIED: repository `apps/web/lib/server/active-staff.ts`, `apps/web/lib/server/data-store.ts`] |
| Build artifacts / installed packages | No generated or installed artifact stores publication schema. | No reinstall/package migration; add TypeScript/Jest tests only. [VERIFIED: repository `package.json`, `apps/web/package.json`] |

## Common Pitfalls

### Pitfall 1: A “passed” checklist becomes a truth or quality claim
**What goes wrong:** A data-shape pass is rendered as provider endorsement or verified outcome.  
**How to avoid:** Name it an editorial/evidence completeness check; retain each fact’s source/status/action and preserve unresolved states.  
**Warning sign:** A public payload contains a boolean such as `verifiedProvider` without the underlying fact evidence. [VERIFIED: Phase 10 CONTEXT.md D-03; repository `apps/web/lib/catalogue-contract.ts`]

### Pitfall 2: A final release trusts earlier approval
**What goes wrong:** A candidate approved on Monday carries stale/expired evidence or media into Friday’s release.  
**How to avoid:** Re-run the same checklist against the persisted candidate revision immediately before release/emergency snapshot creation.  
**Warning sign:** Release code selects `approved` candidates without invoking the checklist. [VERIFIED: Phase 10 CONTEXT.md D-03/D-11/D-13]

### Pitfall 3: Snapshot extension is silently lost during recovery
**What goes wrong:** The normal read path spreads unknown data forward, but `normalizeImportData()` reconstructs a fixed list of fields and drops a new publication slice.  
**How to avoid:** Extend both validation and normalization paths before relying on snapshots.  
**Warning sign:** A restore fixture with `cataloguePublicationState` returns no such state. [VERIFIED: repository `apps/web/lib/server/data-store.ts`]

### Pitfall 4: An administrator check accidentally bypasses active staff status
**What goes wrong:** A stale session/admin claim can publish after allowlist removal.  
**How to avoid:** Require current allowlist membership and requested capability for every mutation; audit deny/allow before input parsing.  
**Warning sign:** Capability parsing occurs after `request.json()` or a route trusts `session.user.role`. [VERIFIED: repository `apps/web/lib/server/active-staff.ts`, `apps/web/__tests__/api/active-staff.test.ts`]

### Pitfall 5: Quarantine discards the staff member’s valid work
**What goes wrong:** Final-release validation deletes a bad candidate or replaces it with an opaque error.  
**How to avoid:** Preserve candidate revision/body, set `quarantined`, write ordered correction codes, and require resubmission after edit.  
**Warning sign:** Quarantine mutator filters the candidate out of persistent state. [VERIFIED: Phase 10 CONTEXT.md D-04/D-11]

### Pitfall 6: Media evidence blocks factual information
**What goes wrong:** A missing image licence makes the entire accurate provider record disappear.  
**How to avoid:** Remove media from the published projection and retain text plus official source links.  
**Warning sign:** Rights validation returns a record-level rejection rather than a media fallback result. [VERIFIED: Phase 10 CONTEXT.md D-12/D-13/D-14]

## Code Examples

### Exact, bounded candidate import validation

```typescript
// Source: Phase 10 locked D-05/D-06 and existing catalog contract style
export function validateCandidateImport(input: unknown, now: Date): string[] {
  if (!isExactRecord(input, ['schemaVersion', 'changes'])) {
    return ['Import must contain only schemaVersion and changes.'];
  }
  if (input.schemaVersion !== 1 || !Array.isArray(input.changes)) {
    return ['Import schema is unsupported.'];
  }
  if (input.changes.length === 0 || input.changes.length > 25) {
    return ['Import must contain 1 to 25 changes.'];
  }
  return input.changes.flatMap((change, index) =>
    validateCatalogueChange(change, now).map((error) => `Change ${index + 1}: ${error}`),
  );
}
```

### One-shot snapshot command

```typescript
// Source: existing commitConditionalMutation pattern
const result = await commitConditionalMutation((data) => {
  const state = normalizeCataloguePublicationState(data.cataloguePublicationState);
  const release = buildWeeklyRelease(state, { actorId, now });
  // buildWeeklyRelease rechecks every selected candidate, quarantines failures,
  // and creates the next immutable snapshot from at most 25 changes.
  data.cataloguePublicationState = release.nextState;
  return release.result;
});

if (result.status === 'conflict') {
  throw new CataloguePublicationConflictError();
}
return result.value;
```

### Media fallback projection

```typescript
// Source: Phase 10 locked D-12 through D-14
export function getPublicMedia(record: CatalogueRecord, now: Date): PublicMedia | null {
  return evaluateMediaRights(record.mediaRights, now).status === 'valid'
    ? record.media
    : null;
}
```

The public record projection retains factual card facts and official sources when `getPublicMedia` returns `null`; it must not expose unpublished licence notes or reviewer comments.

## State of the Art

| Existing approach | Phase 10 approach | Impact |
|---|---|---|
| Legacy programme `published` flag filters governed programme records. | Candidate lifecycle plus immutable active catalogue snapshot controls the new six-area read model. | Approval and release are separable, reproducible, and recoverable. [VERIFIED: repository `apps/web/lib/admin-programmes.ts`, `apps/web/lib/server/programme-records.ts`] |
| Current active staff is a strict environment allowlist. | Strict allowlist remains; a server-only controlled capability map adds editor/reviewer/administrator actions. | A UI/JWT role cannot bypass current authorization. [VERIFIED: repository `apps/web/lib/server/active-staff.ts`] |
| General recovery import can restore the full app document. | Bounded candidate import stages only catalogue drafts. | Staff cannot overwrite unrelated app data by importing a catalogue batch. [VERIFIED: repository `apps/web/lib/server/data-recovery.ts`] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| A1 | A JSON email-to-capability map is the best environment representation for the three locked capabilities. | Pattern 1 | Maintainer setup could be awkward; keep the parser isolated so representation can change without changing lifecycle logic. |
| A2 | A 25-change batch is within the safe current CAS boundary. | Pattern 3/5 | Whole-document size or contention could still be too high; benchmark with maximum fixtures and lower the cap if tests reveal a stricter safe limit. |
| A3 | A plain SHA-256 canonical content digest is sufficient as a non-secret manifest fingerprint. | Pattern 5 | It detects accidental content drift but does not establish a source’s truth or replace a signed release artifact. |

## Open Questions

None blocking. The locked decisions permit the planner to choose the exact import schema, manifest ID convention, capability configuration key, and focused staff-page composition.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|---|---|---|---|---|
| Node.js | Typecheck and Jest | ✓ | 24.19.0 | — |
| Corepack-selected pnpm | Workspace commands | ✓ | 10.34.5 via `corepack pnpm` | Use Corepack, not the older portable `pnpm` shim that resolves Node 20.20.2 in this shell. |
| External provider API | Candidate/release path | Not required | — | Typed staff input only; no runtime provider dependency. |
| New package | Implementation | Not required | — | Existing Next.js, TypeScript, Jest, and Node built-ins suffice. |

## Validation Architecture

### Test Framework

| Property | Value |
|---|---|
| Framework | Jest 30.3.0 with `next/jest` [VERIFIED: repository `apps/web/package.json`, `apps/web/jest.config.ts`] |
| Config file | `apps/web/jest.config.ts` |
| Quick run command | `corepack pnpm --filter @scholar-scout/web run test -- __tests__/lib/catalogue-publication.test.ts --runInBand` |
| Full suite command | `corepack pnpm --filter @scholar-scout/web run test -- --runInBand` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|---|---|---|---|---|
| EVID-03 | Checklist reports exact source/fact/freshness/claim/region/rights failures; any edit invalidates approval. | unit + server command | focused catalogue-publication Jest target | ❌ Wave 0 |
| EVID-04 | Public read returns only stored active snapshot, deterministically ordered, with no provider fetch/import behavior. | unit | focused catalogue-publication Jest target | ❌ Wave 0 |
| PUB-01 | Denied/inactive/missing-capability actors cannot mutate; editor/reviewer/admin transitions follow the locked roles and audit is minimal. | API + integration | `__tests__/api/admin-catalogue-publications.test.ts` | ❌ Wave 0 |
| PUB-02 | Invalid staging/release quarantines candidate, preserves draft, returns correction codes, and retains active snapshot. | unit + integration | focused catalogue-publication Jest target | ❌ Wave 0 |
| PUB-03 | 1–25 import validates/stages only; 26 rejects no-write; weekly/emergency/restore snapshot commands use one CAS and return safe conflict. | unit + integration | focused server catalogue-publications Jest target | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** focused relevant Jest target with `--runInBand`.
- **Per wave merge:** `corepack pnpm --filter @scholar-scout/web run lint`, typecheck, and full web Jest suite.
- **Phase gate:** full suite green plus staff UAT of checklist failure, reviewer separation, release, emergency correction, restore, conflict reason, and no-media fallback.

### Wave 0 Gaps

- [ ] `apps/web/__tests__/lib/catalogue-publication.test.ts` — pure lifecycle/checklist/import/rights/manifest contracts.
- [ ] `apps/web/__tests__/lib/server/catalogue-publications.test.ts` — CAS commands, quarantine, restore, and public snapshot read.
- [ ] `apps/web/__tests__/api/admin-catalogue-publications.test.ts` — authorization-before-body parsing and safe API response boundaries.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V2 Authentication | Yes | Reuse NextAuth session lookup through `requireActiveStaff`; no new identity path. [VERIFIED: repository `apps/web/lib/server/active-staff.ts`] |
| V3 Session Management | Yes | Request-time session/active-allowlist authorization; never rely on local UI state. [VERIFIED: repository `apps/web/__tests__/api/active-staff.test.ts`] |
| V4 Access Control | Yes | Active allowlist plus capability requirement in every catalogue route and command. [CITED: https://nextjs.org/docs/app/guides/authentication] |
| V5 Input Validation | Yes | Exact structural parser, controlled unions, length/count/depth limits, lifecycle guards, and server-side final checklist. [CITED: https://cornucopia.owasp.org/taxonomy/asvs-5.0/02-validation-and-business-logic/02-input-validation] |
| V6 Cryptography | Limited | Use Node built-in SHA-256 only for non-secret manifest fingerprints; do not create a custom encryption/signing scheme. [VERIFIED: repository `apps/web/lib/server/data-recovery.ts`] |

### Known Threat Patterns for this Phase

| Pattern | STRIDE | Standard Mitigation |
|---|---|---|
| Inactive or role-less staff publishes | Elevation of privilege | Current allowlist and capability check before body parsing/store read; test malformed config fails closed. |
| Crafted import overflows or changes unrelated data | Tampering / Denial of service | Exact JSON schema, max 25 changes, byte/depth bounds, focused candidate state only, one CAS write. |
| Stale writer overwrites an approved candidate/snapshot | Tampering | Expected revision/version; 409 conflict; side-by-side merge; required older-value reason. |
| Rights-unproven media becomes public | Information disclosure / Legal exposure | Typed rights metadata rechecked at release, media-only fallback, no public reviewer/private rights fields. |
| Provider source changes at request time | Integrity / Availability | Persisted reviewed snapshot, no learner runtime provider request. |
| Secrets/private information enter audit response | Information disclosure | Minimal typed audit payloads; never serialize environment values, request headers, raw imports, learner state, or provider-private notes. |

## Sources

### Primary (HIGH confidence)
- Repository `apps/web/lib/catalogue-contract.ts` — controlled regions/pathways, field-level evidence, freshness rules, and status semantics.
- Repository `apps/web/lib/server/data-store.ts` and `apps/web/lib/server/persistence-operations.ts` — persistence port, normalization/import seams, versioned read/write, and single-attempt CAS.
- Repository `apps/web/lib/server/programme-records.ts`, `apps/web/lib/admin-programmes.ts`, and `apps/web/app/api/admin/programmes/route.ts` — current governed record, conflict, validation, and route patterns.
- Repository `apps/web/lib/server/active-staff.ts` and `apps/web/__tests__/api/active-staff.test.ts` — active allowlist and privacy-minimal authorization audit behavior.
- Phase 10 `10-CONTEXT.md` — locked lifecycle, media, audit, batch, and recovery decisions.

### Secondary (MEDIUM confidence)
- [Next.js authentication guide](https://nextjs.org/docs/app/guides/authentication) — Route Handlers require authentication/authorization and server-side controls.
- [Next.js Route Handlers guide](https://nextjs.org/docs/app/getting-started/route-handlers) — `route.ts` location and supported handler architecture.
- [OWASP ASVS input validation taxonomy](https://cornucopia.owasp.org/taxonomy/asvs-5.0/02-validation-and-business-logic/02-input-validation) — trusted service-layer allow-list/structural/business-rule validation guidance.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; versions and existing implementation seams are directly verified.
- Architecture: HIGH — current data-store, active-staff, programme conflict, and recovery code were inspected directly.
- Security/pitfalls: HIGH for project-specific lifecycle risks; MEDIUM for general framework/ASVS guidance because it is cited from current official docs.

**Research date:** 2026-09-22  
**Valid until:** 2026-10-22 for framework/security guidance; Phase 10 locked decisions remain authoritative until changed through GSD discussion.
