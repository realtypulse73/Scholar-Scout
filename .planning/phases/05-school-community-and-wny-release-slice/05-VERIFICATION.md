---
phase: 05-school-community-and-wny-release-slice
verified: 2026-08-29T14:52:08Z
status: human_needed
score: 6/7 must-haves verified
behavior_unverified: 1
overrides_applied: 0
behavior_unverified_items:
  - truth: "The shared community policy provides five combined note/inbox submissions in a true rolling one-hour interval when backed by the configured Upstash provider."
    test: "With an isolated Upstash test account, submit five alternating valid note and inbox requests just before an hour boundary, then attempt a sixth immediately after the boundary."
    expected: "The sixth request is rejected before a write; after each reservation ages out, a later request succeeds. Provider outage returns the safe unavailable response and writes nothing."
    why_human: "Unit tests prove the production code selects Ratelimit.slidingWindow(5, '1 h') and both routes call the shared reservation, but they do not invoke a live Upstash service across a rolling boundary."
human_verification:
  - test: "Keyboard- and screen-reader-check populated and empty Western New York and school-locker screens, including every visible official-source link."
    expected: "Notices and per-result verification panels remain understandable, focus order is usable, links lead to the intended institution resource, and long Unicode labels wrap without horizontal overflow."
    why_human: "External link destinations, responsive layout, and assistive-technology reading order are browser/environment dependent."
  - test: "As a signed-in student, post a safe note, open Report this note, cancel once, then confirm once; as fresh staff, resolve the resulting queue entry."
    expected: "Cancel returns focus to the initiating report control; confirm removes only that row and provides private confirmation; the staff queue permits only restore/remove and moves focus to its heading after a successful resolution."
    why_human: "The component tests exercise DOM focus paths, but a real authenticated browser session is required to confirm the end-to-end accessibility and private-status experience."
  - test: "Run the alternating note/inbox quota scenario against a configured Upstash environment."
    expected: "The five-per-hour shared rolling limit is enforced server-side across both endpoints; denied/unavailable requests create no records and no remaining-count is disclosed."
    why_human: "The provider is intentionally fail-closed and was not configured for this local verifier run."
---

# Phase 5: School, Community, and WNY Release Slice Verification Report

**Phase Goal:** Students can safely use the in-progress school, Western New York, peer, and campus-community experiences as a separately validated release slice.
**Verified:** 2026-08-29T14:52:08Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Students can explore school and WNY discovery with validated programme data, accessible recovery states, and dependable ordering. | VERIFIED | `rankWesternNewYorkInstitutions` applies normalized institution-name tie ordering; WNY and school pages provide source guidance and known-school empty recovery. `western-new-york.test.ts` and `community-release.test.tsx` cover those paths. |
| 2 | Peer/community screens avoid unnecessary author identity, contact details, sensitive profile signals, engagement data, and inferred potential. | VERIFIED | Explicit note and inbox DTO mappers omit `author_id`/`sender_id`; public peer profile mapping excludes private fields. Route and domain tests assert exclusions and preference-only matching. |
| 3 | Note and inbox submissions derive actors from sessions, validate before writes, use one shared fail-closed quota boundary, and return safe public responses. | VERIFIED | Both POST routes call `reserveCommunitySubmission(session.user.id)` after validation and before their store operation; unavailable/denied branches return before writes. Production limiter construction is directly tested as `Ratelimit.slidingWindow(5, '1 h')`. |
| 4 | Reporting immediately makes a public note non-public, is idempotent/private, and preserves safety through moderation-state conflicts. | VERIFIED | `reportCampusNoteForReview` performs the public → pending-review transition and public reads filter `status === 'public'`; the report route maps conflict to 409 and the client removes a row only after a successful response. Store/route/component regressions cover transition, race, and focus cases. |
| 5 | Only freshly authorized staff can read or resolve pending moderation content through the focused queue. | VERIFIED | Both page and API call `requireActiveStaff` before pending-record reads; the API delegates only to named pending-review operations and the queue uses safe DTOs. API/component tests cover denial ordering, conflicts, actions, and empty state. |
| 6 | The phase implements the locked discovery, peer, submission, reporting, and moderation decisions D-01 through D-08. | VERIFIED | WNY/school verification panels and recovery states (D-01/02); normalized public display-name peer cards and no-match recovery (D-03/04); identical guidance and server feedback (D-05/06); confirmed report/hide and staff queue (D-07/08) are each present in their declared source components and tested. |
| 7 | The actual configured provider enforces five combined note/inbox submissions in a true rolling one-hour interval. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | The production branch constructs `Ratelimit.slidingWindow(5, '1 h')` and both routes share the reservation; no live Upstash boundary run was possible locally. |

**Score:** 6/7 truths verified (1 present, behavior-unverified live-provider invariant)

## Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `apps/web/lib/server/rate-limit.ts` | Fail-closed shared sliding community reservation | VERIFIED | Policy is account-keyed, algorithm-aware, and the Upstash limiter selects sliding windows. |
| `apps/web/lib/campus-community.ts` | Explicit stored/public community models and validation | VERIFIED | Public note/inbox mappers omit private IDs; validators reject malformed, overlong, and contact-bearing input. |
| `apps/web/lib/server/data-store.ts` + `operational-records.ts` | Moderation state, public filter, bounded staff operations | VERIFIED | Legacy normalization, status validation, public-only reads, named report/list/restore/remove operations, and CAS retry are present. |
| `apps/web/app/api/campus-notes/*` + `peer-connections/route.ts` | Session-derived protected API boundaries | VERIFIED | Validate/reserve/write ordering, stable 401/400/429/503 behavior, DTO mapping, and conflict handling are wired. |
| `apps/web/app/api/admin/community-moderation/route.ts` + admin page/queue | Fresh-staff gated moderation workflow | VERIFIED | Authorization precedes reads and mutations; UI consumes the limited staff DTO and preserves rows on conflict. |
| WNY, school, peer, and community components | Approved student-facing release screens | VERIFIED | Discovery notice/recovery and peer/form/report interfaces are implemented rather than placeholder renders. |

## Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| Campus-note POST | shared limiter → store | `reserveCommunitySubmission` before `createCampusNote` | WIRED | Session ID is the key; deny/unavailable exits before persistence. |
| Inbox POST | same shared limiter → store | `reserveCommunitySubmission` before `createUploaderInboxRequest` | WIRED | Uses the same service and session-derived key as notes. |
| Report route | moderation transition → public read filter | session-derived reporter → `reportCampusNoteForReview` → `status === 'public'` filter | WIRED | Conflict is non-2xx, so the client does not falsely hide the row. |
| Staff page/API | fresh authorization → pending operations | `requireActiveStaff` before list/restore/remove | WIRED | Non-staff path returns before any storage call in route regression. |
| Student UI | protected APIs/DTOs | fetch response is rendered only after response handling | WIRED | Public board removes a note only after success; errors retain actionable control. |

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `CampusNoteBoard.tsx` | `notes` | `/api/campus-notes` GET → `getCampusNotes` → public DTO mapper | Versioned/persisted public notes, filtered by moderation status | FLOWING |
| `CommunityModerationQueue.tsx` | `initialRecords` | server page → `listPendingReviewCampusNotes` | Pending-only persisted records through a staff-safe DTO | FLOWING |
| `PeerCommunity.tsx` | peer matches | server page/domain `getCampusUploaderMatches` | Existing profiles/programmes narrowed to public profile data | FLOWING |
| `WesternNewYorkDirectory.tsx` | ranked institutions | WNY domain ranking input | Real declared institution data and deterministic sorting | FLOWING |

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Web lint | `corepack pnpm --filter @scholar-scout/web run lint` | completed with zero warnings | PASS |
| Web typecheck | `corepack pnpm --filter @scholar-scout/web run typecheck` | completed successfully | PASS |
| Library partition | `corepack pnpm --filter @scholar-scout/web test --runInBand -- __tests__/lib` | 23 suites, 168 tests | PASS |
| API partition | `corepack pnpm --filter @scholar-scout/web test --runInBand -- __tests__/api` | 12 suites, 86 tests | PASS |
| Component partition | `corepack pnpm --filter @scholar-scout/web test --runInBand -- __tests__/components` | 11 suites, 61 tests | PASS |

## Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| PROD-01 | 05-03 | Validated programme data, accessible discovery, dependable decision logic | SATISFIED | Governed school programmes; WNY sorting/domain regression; source guidance and empty-state component coverage. |
| PROD-02 | 05-01, 05-04, 05-05 | Peer/campus participation without unnecessary identity/contact exposure or spam pathways | SATISFIED | DTO allowlists, preference-only peers, session-derived inbox, input/contact validation, and shared reservation. |
| PROD-03 | 05-01, 05-02, 05-04, 05-05 | Server validation/rate limit plus author-safe reporting/removal lifecycle | SATISFIED (human confirmation pending) | Protected routes, public-only reads, CAS moderation operations, fresh staff queue, and route/component/store coverage. |

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `05-05-SUMMARY.md` | EOF | Extra blank line reported by `git diff --check` | INFO | Documentation whitespace only; no implementation or release-safety effect. |

No unreferenced `TODO`, `FIXME`, or `XXX` markers were found in Phase 5 implementation files. No stub component, empty API response, or disconnected dynamic-data source was found.

## Disconfirmation Pass

- **Partial-requirement check:** The real Upstash rolling-boundary behavior has not been exercised against a configured provider; this is recorded as behavior-unverified rather than treated as a green integration proof.
- **Misleading-test check:** The generic in-memory limiter uses reset boundaries, but this no longer stands alone as proof of the selected algorithm: `rate-limit.test.ts` additionally observes the production constructor calling `Ratelimit.slidingWindow(5, '1 h')`.
- **Uncovered error-path check:** External source availability and browser-assistive behavior cannot be proven by Jest; the required manual checks are listed below.

## Human Verification Required

### 1. Discovery source and accessibility review

**Test:** Keyboard- and screen-reader-check populated and empty WNY and school-locker screens, opening every source link.

**Expected:** Guidance is clear, focus/order is usable, intended official sources open, and long Unicode labels wrap.

**Why human:** Final destination, responsive rendering, and assistive output depend on the browser/environment.

### 2. Authenticated report and staff-resolution journey

**Test:** Report a public note, then use the staff queue to restore or remove it.

**Expected:** Reporter confirmation stays private; only a successful report hides the row; cancellation/failure restores exact focus; staff actions are limited to restore/remove.

**Why human:** Requires a real signed-in student/staff session and final accessibility confirmation.

### 3. Live shared quota boundary

**Test:** Submit alternating note/inbox requests against configured Upstash before/after a clock boundary.

**Expected:** The fifth is accepted, sixth denied before persistence, and expired reservations later allow a new write.

**Why human:** Local verification intentionally had no external provider configuration.

---

_Verified: 2026-08-29T14:52:08Z_
_Verifier: the agent (gsd-verifier)_
