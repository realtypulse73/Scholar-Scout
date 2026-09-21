---
phase: 07-governed-opportunity-and-support-matching
plan: 02
subsystem: privacy-boundary
tags: [typescript, nextjs, jest, onboarding, referral-privacy]
requires:
  - phase: 07-01
    provides: governed programme evidence boundary
provides:
  - persisted ordinary-support taxonomy with server-side referral rejection
  - legacy onboarding-profile normalization at read and write boundaries
  - local-only, fixture-only sensitive referral interaction and public-release gate
affects: [07-03, matching, onboarding, release-process]
tech-stack:
  added: []
  patterns:
    - taxonomy-driven persistence boundary
    - component-memory-only sensitive referral selection
key-files:
  created:
    - apps/web/lib/sensitive-referral-directory.ts
    - apps/web/components/support/SensitiveReferralPanel.tsx
    - .planning/phases/07-governed-opportunity-and-support-matching/07-PRELAUNCH-REFERRAL-RELEASE-GATE.md
  modified:
    - apps/web/lib/onboarding-types.ts
    - apps/web/lib/server/data-store.ts
    - apps/web/lib/server/student-records.ts
key-decisions:
  - "Ordinary support preferences are the only support values accepted by the account profile API or durable onboarding record."
  - "Referral-only categories are local component state and resolve only to labelled .invalid fixtures before pre-launch review."
  - "The existing onboarding controls exclude referral-only categories to prevent browser-storage leakage."
patterns-established:
  - "Normalize legacy profile values at all read/write persistence boundaries rather than performing a whole-document migration."
  - "Treat .invalid referral entries as fixtures; require release evidence before enabling any public destination."
requirements-completed: []
coverage:
  - id: D1
    description: Referral-only support values are rejected before account-profile persistence.
    verification:
      - kind: integration
        ref: apps/web/__tests__/api/account-guest-routes.test.ts#rejects referral-only support values before they reach persistence
        status: pass
      - kind: unit
        ref: apps/web/__tests__/lib/onboarding-validation.test.ts#rejects referral-only support values from the ordinary profile
        status: pass
    human_judgment: false
  - id: D2
    description: Legacy onboarding records retain only ordinary support preferences at read and replacement boundaries.
    verification:
      - kind: unit
        ref: apps/web/__tests__/lib/data-store.test.ts#removes referral-only values when reading a legacy onboarding profile
        status: pass
      - kind: unit
        ref: apps/web/__tests__/lib/student-records.test.ts#normalizes referral-only legacy values before a profile replacement is stored
        status: pass
    human_judgment: false
  - id: D3
    description: Sensitive referral choices are local-only and expose clearly marked non-live fixtures only after consent.
    verification:
      - kind: automated_ui
        ref: apps/web/__tests__/components/SensitiveReferralPanel.test.tsx#keeps a referral selection in component memory and reveals a test-only link only after consent
        status: pass
      - kind: unit
        ref: apps/web/__tests__/lib/sensitive-referral-directory.test.ts#contains only clearly labelled non-live .invalid destinations
        status: pass
    human_judgment: false
duration: 45min
completed: 2026-09-21
status: complete
---

# Phase 07 Plan 02: Profile Boundary and Local-Only Referral Fixtures Summary

**Ordinary onboarding preferences now persist through a taxonomy-enforced boundary, while sensitive referral choices stay in component memory and reveal only explicit non-live fixtures.**

## Performance

- **Duration:** 45 min
- **Tasks:** 3 completed
- **Files modified:** 15
- **Verification:** 65 focused Jest tests, lint, and TypeScript checks passed.

## Accomplishments

- Rejected referral-only support values before the account onboarding API can save them; the UI-only `none` selection becomes no persisted ordinary preference.
- Normalized legacy profiles on read and replacement writes, removing referral-only values without whole-document migration or audit payload disclosure.
- Added a local-only consent panel and an allowlisted `.invalid` fixture directory, plus a blocking pre-public-release evidence gate.
- Removed referral-only options from ordinary onboarding controls so they cannot enter browser storage.

## Task Commits

1. **Task 1: Reject a referral-only onboarding value before it reaches persistence** — `7cf616d` (RED), `17b7190` (GREEN)
2. **Task 2: Normalize legacy persisted profiles at every onboarding record boundary** — `f496bf3` (RED), `448dbb9` (GREEN)
3. **Task 3: Implement fixture-only referral consent and record the future public-release gate** — `8fe6e64` (RED), `1ad6749` (additional privacy RED), `0e30428` (GREEN)

## Decisions Made

- Keep `financial-aid`, `first-gen`, `tutoring`, and `career-counseling` as the only ordinary persisted support categories.
- Treat disability access, housing, mental health, immigration, complex financial guidance, childcare, and language support as referral-only.
- Keep all referral URLs deliberately non-live until the documented release gate has reviewed real sources, owner, availability, jurisdiction, and dates.

## Deviations from Plan

### Auto-fixed Issues

1. **[Rule 3 - Blocking] Used the existing account onboarding API test surface**
   - **Found during:** Task 1
   - **Issue:** The planned `account-onboarding.test.ts` file does not exist; account onboarding is covered by `account-guest-routes.test.ts`.
   - **Fix:** Added the API regression to the established suite.
   - **Verification:** Focused API test passes.
   - **Committed in:** `7cf616d`

2. **[Rule 2 - Missing critical functionality] Removed referral-only choices from ordinary onboarding controls**
   - **Found during:** Task 3
   - **Issue:** The existing ordinary onboarding controls could still send referral-only values to browser storage before the new server boundary rejected them.
   - **Fix:** Restricted those controls to ordinary categories plus the UI-only `none` choice and normalized old browser values before reuse.
   - **Verification:** `StepSupportNeeds` regression and the full Plan 02 focused suite pass.
   - **Committed in:** `1ad6749`, `0e30428`

3. **[Rule 1 - Bug] Completed taxonomy type propagation**
   - **Found during:** Tasks 1 and 2
   - **Issue:** The new strict taxonomy exposed stale broad type annotations in the API and persisted-profile parser.
   - **Fix:** Typed allowed value sets and converted the stored profile boundary to `OrdinaryOnboardingProfile`.
   - **Verification:** lint and TypeScript checks pass.
   - **Committed in:** `17b7190`, `448dbb9`

**Impact:** All deviations were necessary to keep the sensitive-data boundary correct; no production infrastructure or live provider data was added.

## Issues Encountered

- The jsdom test environment does not provide `fetch`; the referral panel test supplies and restores a temporary mock so it can prove no network call occurs.
- Jest reports a pre-existing multiple-lockfile Next.js warning in this worktree; all requested checks still passed.

## User Setup Required

None. The implemented destinations are test-only `.invalid` fixtures and must not be configured as public provider links.

## Next Phase Readiness

Plan 03 can consume ordinary preferences only and must keep referral-only values and fixture metadata outside matching, explanations, storage, analytics, URLs, and provider requests. Before public release, follow the committed referral release gate.

## Self-Check: PASSED

- Summary file exists and all seven implementation/test commits are present in Git history.
