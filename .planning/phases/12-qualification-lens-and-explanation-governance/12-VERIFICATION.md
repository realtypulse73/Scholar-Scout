---
phase: 12-qualification-lens-and-explanation-governance
verified: 2026-09-25T06:45:00-04:00
status: passed
score: 4/4 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 3/4
  gaps_closed:
    - "A signed-in student can use their deliberately saved ordinary qualifications to see relevant published requirements on Programmes, detail, and comparison surfaces."
  gaps_remaining: []
  regressions: []
human_verification:
  completed: "2026-09-25T09:00:00-04:00"
  evidence: "12-UAT.md"
---

# Phase 12: Qualification Lens and Explanation Governance Verification Report

**Phase Goal:** Give students an optional, private way to compare ordinary qualifications against published requirements while keeping all options visible and explanations non-predictive.

**Verified:** 2026-09-25T06:45:00-04:00
**Status:** passed
**Re-verification:** Yes — after gap closure

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | A signed-in student can deliberately save ordinary qualifications and see relevant reviewed requirements to confirm. | ✓ VERIFIED | The account route and all three learner pages use `createAccountStorageKey(session.user.id)`. Authenticated page tests seed `account:student-one`, render Programmes/detail/shortlist, assert the reviewed requirement/source/action, reject a foreign key lookup, and prove the private note is absent. |
| 2 | The lens makes no eligibility, admission, enlistment, funding, placement, salary, safety, or outcome verdict and never hides an opportunity. | ✓ VERIFIED | `qualification-lens.ts` accepts only structured choices and explicit keywords, produces factual rows, and `orderQualificationsFirst` sorts a copy without filtering. Focused lens tests pass. |
| 3 | Ranked results have decomposable reviewed reasons, a verification step, factual support where documented, and retained student choices. | ✓ VERIFIED | The governed snapshot supplies reviewed requirement evidence, descriptions, and documented supports to the shared `QualificationExplanation` renderer. Programmes, detail, and comparison retain their verification and student-choice controls. |
| 4 | GPA, tests, prestige, ZIP/residence, passive engagement, and similar proxies cannot rank or hide an opportunity. | ✓ VERIFIED | The exact private-record parser rejects unexpected/proxy fields, and the lens validates its input to the two allowed fields before deriving its all-visible order. Focused parser and lens suites pass. |

**Score:** 4/4 truths verified (0 present but behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `apps/web/lib/server/student-actor.ts` | Shared trusted account key | ✓ VERIFIED | `createAccountStorageKey` is server-only and is used by actor resolution and all three learner pages. |
| `apps/web/app/api/account/qualifications/route.ts` | Account-only persistence | ✓ VERIFIED | It resolves `allowGuest: false`, uses `actor.storageKey` for GET/POST, validates the bounded record, and returns a recoverable conflict response. |
| `apps/web/app/programmes/page.tsx`, `apps/web/app/programmes/[id]/page.tsx`, `apps/web/app/shortlist/page.tsx` | Active-account record to factual lens | ✓ VERIFIED | Each derives the storage namespace only from `session.user.id` and passes only `{ structured, keywords }` to the lens. No guest has a lookup path. |
| `apps/web/components/qualifications/QualificationRecordForm.tsx` | Success-only persistence signal | ✓ VERIFIED | `onSuccess` and `onClose` execute only after a successful POST; conflict and non-OK tests retain the editor/draft and call neither callback. |
| `apps/web/components/catalogue/CatalogueDiscoveryOverview.tsx` | Fresh Programmes lens after successful mutation | ✓ VERIFIED | Its success callback calls `router.refresh()` before the close/focus callback. The component regression asserts one refresh and focus restoration. |
| `apps/web/lib/qualification-lens.ts` | Source-preserving, all-visible explanation | ✓ VERIFIED | It maps all supplied discovery items, uses only reviewed evidence, and sorts without suppressing an opportunity. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| Trusted NextAuth session ID | active account record | `createAccountStorageKey` → `getQualificationRecord` | ✓ WIRED | Programmes, detail, and shortlist now use the same `account:<id>` convention as the account route. |
| Active account record | learner explanation DTO | `{ structured, keywords }` → `buildQualificationLensModel` | ✓ WIRED | Page tests prove a checked reviewed requirement reaches each surface while the private note does not. |
| Successful form POST | fresh Programmes server data | `onSuccess` → `router.refresh()` → close/focus | ✓ WIRED | Form and overview tests exercise successful save/clear; 409/non-OK paths do not refresh or close. |
| Governed snapshot evidence | shared learner explanation | reviewed requirement/description/support → `QualificationExplanation` | ✓ WIRED | The common renderer retains source/date/action and factual support conditions across overview, detail, and comparison. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| Learner pages | `qualificationRecord` | Account-only persisted `qualificationProfiles[account:<id>]` | Active session selects only its namespaced record | ✓ FLOWING |
| Lens model | `structured`, `keywords` | Bounded persisted record | Pages intentionally omit `note`; reviewed snapshot carries the factual evidence | ✓ FLOWING |
| Programmes overview | fresh server lens | App Router refresh after accepted POST | Success callback is invoked before close; failed writes retain the previous state | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Account-scoped reads, guest/foreign isolation, note-free view composition, success-only form refresh, all-visible lens | `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath` on 10 Phase 12 regression paths | 10 suites, 59 tests passed | ✓ PASS |
| Type safety | `corepack pnpm --filter @scholar-scout/web run typecheck` | Exit 0 | ✓ PASS |
| Lint | `corepack pnpm --filter @scholar-scout/web run lint` | Exit 0 | ✓ PASS |
| Whole web workspace | `corepack pnpm --filter @scholar-scout/web test --runInBand` | Exit 0 | ✓ PASS |

The test runner warns that the repository and this worktree both contain a `pnpm-lock.yaml`; it still completed all checks successfully. This pre-existing workspace-root warning is unrelated to Phase 12 behavior.

### Requirements Coverage

| Requirement | Source Plans | Status | Evidence |
| --- | --- | --- | --- |
| MATCH-01 | 12-01 through 12-06 | ✓ SATISFIED | The saved active-account record produces a reviewed requirement to verify on Programmes, detail, and comparison; the repair adds the missing account-key and refresh wiring. |
| MATCH-02 | 12-02, 12-03, 12-05, 12-06 | ✓ SATISFIED | All-visible factual lens behavior has no predictive/verdict DTO or filtering path. |
| MATCH-03 | 12-02 through 12-06 | ✓ SATISFIED | Reviewed reasons, evidence/action, documented support, and student-controlled actions remain connected across all three learner surfaces. |
| MATCH-04 | 12-01 through 12-06 | ✓ SATISFIED | The parser/lens contract permits only structured ordinary qualifications and explicit keywords; proxy fields cannot reach ordering or visibility. |

### Anti-Patterns Found

No unresolved `TBD`, `FIXME`, or `XXX` markers were found in the Phase 12 production files. The new learner-page tests contain no hardcoded private note rendered through production props; their private-note fixtures assert the opposite boundary.

### Human Verification Completed

### 1. Authenticated refreshed qualification journey

**Test:** Sign in as a student, save one structured qualification in Programmes, choose `Qualifications first`, then visit the matching detail page and saved comparison. Clear the record and revisit Programmes.

**Expected:** The matching checked requirement, source/date, and verification link appear on all three views after the save; every reviewed card remains visible; clearing removes that checked row after refresh; focus returns to `Edit qualifications` after closing.

**Result:** PASS — the authenticated browser journey completed on 2026-09-25. The saved qualification produced the reviewed requirement/source/date/action on Programmes, programme detail, and saved comparison. Clearing it refreshed the view, preserved visible programme cards, returned focus to `Edit qualifications`, and showed accurate no-input wording. See `12-UAT.md`.

## Gaps Summary

The original account-key and stale-overview gap is closed. Automated evidence and the focused authenticated-browser journey both pass; there are no remaining Phase 12 gaps.

---

_Verified: 2026-09-25T06:45:00-04:00_
_Verifier: the agent (independent Phase 12 re-verification)_
