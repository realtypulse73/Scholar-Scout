---
phase: 12-qualification-lens-and-explanation-governance
verified: 2026-09-24T17:19:00-04:00
status: gaps_found
score: 3/4 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "A signed-in student can use their deliberately saved ordinary qualifications to see relevant published requirements on Programmes, detail, and comparison surfaces."
    status: failed
    reason: "The account route persists and loads records at the server-derived key `account:<id>`, but all three learner server pages read the bare session ID. They therefore receive null for the record that the form saved and build an empty lens. In addition, the embedded Programmes form closes after saving without refreshing the server-supplied lens model."
    artifacts:
      - path: "apps/web/app/programmes/page.tsx"
        issue: "Calls getQualificationRecord(session.user.id) rather than the account storage key, so saved records do not reach the overview lens."
      - path: "apps/web/app/programmes/[id]/page.tsx"
        issue: "Uses the same bare-ID lookup, leaving detail explanations disconnected from the saved record."
      - path: "apps/web/app/shortlist/page.tsx"
        issue: "Uses the same bare-ID lookup, leaving comparison explanations disconnected from the saved record."
      - path: "apps/web/components/qualifications/QualificationRecordForm.tsx"
        issue: "Successful Programmes saves close the form but do not refresh the parent server data, so the already-rendered lens remains stale."
    missing:
      - "Use the same trusted account storage-key convention for learner-page qualification reads as the account route."
      - "Refresh or re-fetch the Programmes lens after a successful embedded save, and add authenticated page-level tests proving a saved record produces a checked requirement on overview, detail, and comparison."
---

# Phase 12: Qualification Lens and Explanation Governance Verification Report

**Phase Goal:** Give students an optional, private way to compare ordinary qualifications against published requirements while keeping all options visible and explanations non-predictive.

**Verified:** 2026-09-24T17:19:00-04:00  
**Status:** gaps_found  
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | A student can deliberately save ordinary qualifications and see relevant reviewed requirements to confirm. | ✗ FAILED | The Account route correctly writes at `actor.storageKey` (`account:<id>`), but Programmes, detail, and shortlist pass bare `session.user.id` to `getQualificationRecord`. The stored record is therefore not the record supplied to the lens. Programmes also does not refresh its server-provided model after a successful embedded save. |
| 2 | The lens makes no eligibility, admission, enlistment, funding, placement, salary, safety, or outcome verdict and never hides an opportunity. | ✓ VERIFIED | `qualification-lens.ts` accepts only `structured` and `keywords`, returns factual DTO rows, and sorts a copy by checked-count/keyword/public ID. Its focused tests assert no verdict fields and identical item ID sets before and after ordering. |
| 3 | Ranked results have decomposable reviewed reasons, a verification step, factual support where documented, and retained student choices. | ✓ VERIFIED | Published requirements, descriptions, and supports retain `FactEvidence` through governed candidate publication and discovery. `QualificationExplanation` renders named checked/keyword/verification rows and actions; overview/detail/comparison compose that renderer while preserving existing save, compare, alternate, and official-source controls. |
| 4 | GPA, tests, prestige, ZIP/residence, passive engagement, and similar proxies cannot rank or hide an opportunity. | ✓ VERIFIED | `parseQualificationRecord` exact-validates only structured qualification kinds, note, and explicit keywords. `isQualificationLensRecord` rejects any extra key; the lens consumes only structured keys and keywords, and its tests reject note and GPA-shaped input. |

**Score:** 3/4 truths verified (0 present but behavior-unverified)

## Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `apps/web/lib/qualification-record.ts` | Bounded private-record contract | ✓ VERIFIED | Exact payload parser permits only five ordinary kinds, a 500-character note, and at most 12 normalized 40-character keywords. |
| `apps/web/app/api/account/qualifications/route.ts` | Account-only read/write contract | ✓ VERIFIED | Resolves `allowGuest: false`, requires account actor, rejects malformed payloads, and returns a generic 409 reload contract. |
| `apps/web/lib/qualification-lens.ts` | Source-preserving explanation and all-visible order | ✓ VERIFIED | Pure, substantive module emits checked/keyword/verification/support DTOs and sorts without filtering. |
| `apps/web/lib/catalogue-publication.ts` and `apps/web/lib/server/catalogue-publications.ts` | Governed reviewed requirement evidence | ✓ VERIFIED | Controlled qualification keys and `FactEvidence` are validated, staged, reviewed, and carried to published records. |
| `apps/web/components/qualifications/QualificationExplanation.tsx` | Shared factual learner renderer | ✓ VERIFIED | Used by overview card, detail, and comparison; renders text, source, date, verification actions, and non-color uncertainty treatment. |
| `apps/web/app/programmes/page.tsx`, `apps/web/app/programmes/[id]/page.tsx`, `apps/web/app/shortlist/page.tsx` | Account record to learner lens composition | ✗ DISCONNECTED | Each calls `getQualificationRecord(session.user.id)` even though the route saves under `account:${accountId}`. |

## Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `QualificationRecordForm` | `/api/account/qualifications` | authenticated fetch | ✓ WIRED | Form fetches GET/POST and route resolves the server-derived account actor. |
| Account route | `qualificationProfiles[account:<id>]` | `actor.storageKey` → conditional write | ✓ WIRED | Route GET and POST use `actor.storageKey`; persistence tests use `account:student-one`. |
| Governed published snapshot | `buildCatalogueDiscoveryModel` | published requirements/description/support mapping | ✓ WIRED | Discovery maps published evidence directly from reviewed snapshot records. |
| Learner pages | saved account record → lens DTO | `getQualificationRecord` before `buildQualificationLensModel` | ✗ NOT_WIRED | Server pages use a different key shape from persistence, yielding a null record for any record saved through the account route. |
| Programmes save | refreshed overview lens | close callback | ✗ NOT_WIRED | Form calls `onClose` after POST; the overview only closes/refocuses and never requests fresh server lens data. |

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `QualificationRecordForm` | `record` | account route GET/POST | Account route uses real conditional persistence | ✓ FLOWING |
| `QualificationExplanation` | explanation DTO | governed snapshot + private structured keys/keywords | Snapshot evidence is real governed data, but learner pages supply an empty record due to key mismatch | ✗ DISCONNECTED |
| Detail/comparison explanation props | `qualificationExplanation(s)` | page-level lens composition | Same bare-ID lookup means saved account data cannot flow into props | ✗ DISCONNECTED |

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Parser, account route, store isolation, publication, lens, and component contracts | `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath …12 focused paths…` | 12 suites / 102 tests passed | ✓ PASS |
| Saved account record reaches Programmes/detail/comparison | Static data-flow trace | Route writes `account:<id>`; pages read bare `<id>` | ✗ FAIL |

The passing focused suites do not include an authenticated page composition test that saves a record through the route/storage convention and then asserts a checked requirement on the learner pages. They therefore did not reveal the disconnected key.

## Requirements Coverage

| Requirement | Source Plans | Status | Evidence |
| --- | --- | --- | --- |
| MATCH-01 | 12-01, 12-02, 12-03, 12-04 | ✗ BLOCKED | Account storage works, but saved ordinary qualifications do not reach learner-page explanations or ordering. |
| MATCH-02 | 12-02, 12-03, 12-05 | ✓ SATISFIED | Lens DTO and renderer use source-first verification language and neither filter nor expose predictive/verdict fields. |
| MATCH-03 | 12-02, 12-04, 12-05 | ✓ SATISFIED | Reviewed evidence, verification actions, documented support, and retained choice controls are wired across the shared renderer. |
| MATCH-04 | 12-01, 12-02, 12-03 | ✓ SATISFIED | Exact parser/lens contracts reject proxy fields; ranking can inspect only controlled structured kinds and explicit keywords. |

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `apps/web/app/programmes/page.tsx` | 29 | Bare account ID used as persistence key | 🛑 BLOCKER | Prevents saved qualifications from influencing the overview lens. |
| `apps/web/app/programmes/[id]/page.tsx` | 52 | Bare account ID used as persistence key | 🛑 BLOCKER | Prevents saved qualifications from influencing detail explanations. |
| `apps/web/app/shortlist/page.tsx` | 31 | Bare account ID used as persistence key | 🛑 BLOCKER | Prevents saved qualifications from influencing comparison explanations. |

No unresolved `TBD`, `FIXME`, or `XXX` markers were found in Phase 12 production files.

## Human Verification Required After Repair

### Authenticated qualification flow

**Test:** Sign in, save one ordinary qualification in Programmes, select `Qualifications first`, then open the same programme detail and saved comparison.

**Expected:** The checked published requirement, source/date/action, and non-predictive wording appear consistently on all three surfaces; every filtered card remains visible; focus returns to `Edit qualifications` after closing.

**Why human:** Browser focus, dynamic refresh, responsive reflow, and screen-reader announcement need an authenticated browser session to confirm.

## Gaps Summary

Phase 12’s private-record and factual lens building blocks are substantive and test-covered, but the most important end-to-end link is broken: the account route writes `qualificationProfiles` under an opaque server actor key while learner pages look up a different bare ID. This makes the central Phase 12 promise unavailable to an actual signed-in student despite passing unit and component tests. Repair the shared account-record lookup and refresh behavior, add an authenticated page-level regression, then re-verify before Phase 13 proceeds.

---

_Verified: 2026-09-24T17:19:00-04:00_  
_Verifier: the agent (gsd-verifier)_
