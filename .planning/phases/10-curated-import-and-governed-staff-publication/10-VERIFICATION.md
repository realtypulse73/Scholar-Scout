---
phase: 10-curated-import-and-governed-staff-publication
verified: 2026-09-23T23:13:08Z
status: gaps_found
score: 8/10 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "Publication state survives legacy data and full recovery paths, while invalid state fails safely."
    status: failed
    reason: "The recovery validator accepts shallowly shaped but semantically invalid candidates, snapshots, and manifests. A restored active snapshot can therefore contain unvalidated public record data or a mismatched digest/lineage."
    artifacts:
      - path: "apps/web/lib/catalogue-publication.ts"
        issue: "isCataloguePublicationState validates arrays and a few primitive fields but does not validate candidate region/source/facts/claim fields, snapshot-to-manifest relationships, active snapshot references, or snapshot digest integrity."
      - path: "apps/web/lib/server/data-store.ts"
        issue: "validateScholarScoutDataImport relies solely on isCataloguePublicationState before normalizeImportData preserves the supplied state."
    missing:
      - "Deep validation and coherence checks for candidates, published records, active snapshot/manifest lineage, and canonical content digests."
      - "Negative full-recovery tests proving malformed or incoherent publication state is rejected before it can become the public read model."
  - truth: "Staff can compare a stale attempted candidate against the current revision and must supply a reason when retaining an older value."
    status: failed
    reason: "The conflict command works in isolation, but no actual stale stage/import flow returns its comparison DTO to the staff console. The stage route does not read or forward expectedRevision, import returns only a generic 409, and the UI constructs a local placeholder conflict instead of rendering a returned stale conflict."
    artifacts:
      - path: "apps/web/app/api/admin/catalogue-publications/route.ts"
        issue: "The stage body contains only action and candidate, so an existing candidate always reaches a revision conflict without a safe recoverable comparison response."
      - path: "apps/web/app/api/admin/catalogue-publications/import/route.ts"
        issue: "A stale import responds with a generic reload message rather than safe current-versus-attempted values."
      - path: "apps/web/components/admin/CataloguePublicationManager.tsx"
        issue: "Resolve conflict initializes a synthetic current/attempted pair; claim choice is hard-coded to current and no real stale import/stage response feeds the UI."
    missing:
      - "One real stale edit/import response path that returns the bounded conflict DTO and lets the editor select current or attempted title and claim boundary."
      - "Regression tests for route-to-console stale-conflict recovery and the required reason when an older value is retained."
---

# Phase 10: Curated Import and Governed Staff Publication Verification Report

**Phase Goal:** Enable authorized staff to produce a reviewed, deterministic snapshot from bounded source inputs while preserving source, claim, rights, audit, and conflict-safety controls.

**Verified:** 2026-09-23T23:13:08Z  
**Status:** gaps_found  
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | A staff reviewer can inspect source authority, evidence, freshness, claim boundary, regional boundary, and media-rights status before release. | ✓ VERIFIED | `evaluateCatalogueChecklist` produces the six ordered categories and disclosure; staff intake/history DTOs render them. Pure, server, API, and component tests passed. |
| 2 | The public model is a versioned reviewed snapshot with a manifest and no learner-time provider dependency. | ✗ FAILED | Normal release/read code is deterministic and provider-free, but full recovery accepts incoherent publication state that can supply an unvalidated active snapshot. |
| 3 | Only active authorized staff can create, revise, publish, retire, restore, or correct records with audit evidence and recoverable stale conflicts. | ✗ FAILED | All browser routes authorize before parsing bodies and commands audit changes, but an editor cannot reach the implemented conflict comparison from a real stale stage/import operation. |
| 4 | Invalid source, claim, boundary, or media rights block release without discarding a valid current record. | ✓ VERIFIED | Release-time checklist rechecks quarantine only the failing candidate; media rights use a factual fallback. Lifecycle test passed. |
| 5 | A bounded validated batch can be previewed and recovered without whole-document import or automatic publication. | ✓ VERIFIED | Versioned one-to-25 intake uses one conditional mutation, preview is non-mutating, and weekly/emergency/restore snapshots are append-only. |
| 6 | Multi-capability active staff authorization supports editor, reviewer, and editor-plus-administrator behavior. | ✓ VERIFIED | `requireActiveStaff` requires active allowlist membership plus a strict server-only capability map; reviewer-separation tests passed. |
| 7 | Correcting an approved candidate clears approval and preserves private correction data. | ✓ VERIFIED | Candidate revision staging resets lifecycle to draft and `approval` to null; lifecycle test passed. |
| 8 | Normal releases are deterministic, capped, Monday 09:00–17:00 America/New_York, and limited to one ISO week. | ✓ VERIFIED | Server derives schedule/period; tests cover ordering, digest, release window, and duplicate-week rejection. |
| 9 | Emergency corrections and restores are separately authorized, reasoned, and append-only. | ✓ VERIFIED | Reviewer emergency and administrator restore commands create new snapshots and retained lineage; tests passed. |
| 10 | Legacy data is preserved and invalid publication state fails closed through normal and full-recovery storage paths. | ✗ FAILED | Legacy empty state is preserved, but the state validator is too shallow to reject malformed candidates/snapshots/manifests or incoherent active state. |

**Score:** 8/10 truths verified (0 present but behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `apps/web/lib/catalogue-publication.ts` | Candidate/checklist/import/snapshot contract | ⚠️ PARTIAL | Substantive, used, and tested; recovery validation is not deep enough. |
| `apps/web/lib/server/catalogue-publications.ts` | CAS lifecycle commands, preview, release, recovery, history | ✓ VERIFIED | Commands are substantive and tested; conflict command itself works but is not connected from a real stale intake flow. |
| `apps/web/lib/server/data-store.ts` | Additive persistence and recovery validation | ✗ FAILED | Adds the field and preserves legacy state, but accepts incoherent publication state during restore. |
| `apps/web/app/api/admin/catalogue-publications/route.ts` | Staff-only staging/review/release/recovery route | ⚠️ PARTIAL | Authorization occurs before body parsing; stage cannot carry an expected revision or surface a safe stale comparison. |
| `apps/web/app/api/admin/catalogue-publications/import/route.ts` | Bounded staff import route | ⚠️ PARTIAL | Correctly authorizes and stages private batches, but stale errors are not recoverable through a comparison DTO. |
| `apps/web/components/admin/CataloguePublicationManager.tsx` | Staff intake/review/release/recovery/audit console | ⚠️ PARTIAL | Release/recovery controls and history are wired; its conflict panel is synthetic rather than fed by an actual stale operation. |
| `docs/curated-catalogue-publication-runbook.md` | Safe operating procedure | ✓ VERIFIED | Covers capabilities, limits, checklist, weekly release, emergency correction, restore, redaction, and no-live-provider boundary without secret values. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| Staff routes | `requireActiveStaff` | Authorization before request-body parsing | ✓ WIRED | Stage/import/weekly/recovery routes all call the server-only guard before `request.json()`. |
| Import route | `importCatalogueCandidates` | Authorized schema-versioned staging | ✓ WIRED | The route uses editor capability and returns private staging results. |
| Lifecycle commands | conditional persistence | One conditional whole-document mutation | ✓ WIRED | `commitConditionalMutation` backs staging, import, release, emergency, and restore. |
| Snapshot read seam | stored active snapshot | Cloned, provider-free read | ✓ WIRED | `programme-records.ts` delegates to the stored snapshot reader; no provider fetch occurs. |
| Staff console | stale conflict response | Safe current-versus-attempted recovery | ✗ NOT WIRED | No real stale stage/import response provides the DTO consumed by the console. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `CataloguePublicationManager.tsx` | candidates/capabilities/history | Authorized `/api/admin/catalogue-publications` GET views | Yes, redacted server DTOs | ✓ FLOWING |
| `CataloguePublicationManager.tsx` | weekly preview | Administrator-only POST response | Yes, server-derived eligibility/selection/quarantine data | ✓ FLOWING |
| `programme-records.ts` | published snapshot | `getPublishedCatalogueSnapshot()` | Yes, stored snapshot clone only | ✓ FLOWING for normal state; ✗ unsafe after malformed recovery state |
| `CataloguePublicationManager.tsx` | conflict | Local state and hypothetical `409` DTO | No real stale stage/import response produces it | ✗ DISCONNECTED |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Phase 10 lifecycle matrix | `corepack pnpm --filter @scholar-scout/web test -- --runInBand __tests__/lib/catalogue-publication.test.ts __tests__/lib/server/catalogue-publications.test.ts __tests__/api/admin-catalogue-publications.test.ts __tests__/components/CataloguePublicationManager.test.tsx __tests__/lib/data-store.test.ts` | 5 suites, 85 tests passed | ✓ PASS |
| Type safety | `corepack pnpm --filter @scholar-scout/web run typecheck` | Passed | ✓ PASS |
| Lint | `corepack pnpm --filter @scholar-scout/web run lint` | Passed with zero warnings | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- |
| EVID-03 | 10-01–10-05 | Staff review source/evidence/freshness/claim boundary before public release | ✓ SATISFIED | Six-category checklist, review/recheck commands, staff DTOs, and passing test matrix. |
| EVID-04 | 10-03, 10-05 | Deterministic, versioned reviewed snapshot independent of live provider | ✗ BLOCKED | Normal seam is correct, but malformed recovered publication state can become an active public snapshot. |
| PUB-01 | 10-01–10-05 | Active authorized staff lifecycle actions with validation/audit evidence | ⚠️ PARTIAL | Route authorization and audit evidence work; stale-conflict recovery is not reachable from the real staff intake path. |
| PUB-02 | 10-01–10-04 | Evidence failures block release with recoverable correction | ✓ SATISFIED | Draft correction lists, final recheck quarantine, prior snapshot preservation, media fallback. |
| PUB-03 | 10-02–10-05 | Bounded validated batch, conflict-safe recovery, explicit publication | ✗ BLOCKED | Cap/preview/explicit publish work, but the required staff conflict recovery path is disconnected. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `apps/web/lib/catalogue-publication.ts` | 302–381 | Shallow state validation | 🛑 Blocker | Allows semantically malformed publication data through full recovery. |
| `apps/web/app/api/admin/catalogue-publications/route.ts` | 38–74 | Stage body omits `expectedRevision` | 🛑 Blocker | Existing records cannot enter an intentional, recoverable stage edit flow. |
| `apps/web/components/admin/CataloguePublicationManager.tsx` | 91–93, 201–216, 361 | Synthetic conflict state / fixed claim choice | 🛑 Blocker | UI does not present or resolve real stale candidate values. |

### Gaps Summary

The ordinary catalogue lifecycle is substantially implemented: it has strict route authorization, bounded intake, independent review, deterministic normal releases, quarantine, factual media fallback, emergency correction, append-only restoration, redacted audit history, and a provider-free snapshot seam. The phase cannot be called complete, however, because the two controls intended to make that lifecycle safely recoverable are incomplete:

1. Full recovery must reject malformed or incoherent catalogue-publication state before it can become the active learner snapshot.
2. A real stale stage/import must lead the editor into the safe comparison screen, where both supported values can be selected and an older choice is recorded with a reason.

No later v1.1 phase specifically owns either persistence validation or the Phase 10 staff conflict workflow, so neither gap is deferred.

---

_Verified: 2026-09-23T23:13:08Z_  
_Verifier: the agent (gsd-verifier)_
