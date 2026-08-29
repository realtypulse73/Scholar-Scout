---
phase: 05-school-community-and-wny-release-slice
reviewed: 2026-08-29T18:33:18Z
depth: standard
files_reviewed: 23
files_reviewed_list:
  - apps/web/__tests__/api/campus-community.test.ts
  - apps/web/__tests__/api/community-moderation.test.ts
  - apps/web/__tests__/components/community-release.test.tsx
  - apps/web/__tests__/lib/data-store.test.ts
  - apps/web/__tests__/lib/operational-records.test.ts
  - apps/web/__tests__/lib/rate-limit.test.ts
  - apps/web/__tests__/lib/western-new-york.test.ts
  - apps/web/app/admin/community-moderation/page.tsx
  - apps/web/app/api/admin/community-moderation/route.ts
  - apps/web/app/api/campus-notes/[id]/report/route.ts
  - apps/web/app/api/peer-connections/route.ts
  - apps/web/app/schools/[slug]/page.tsx
  - apps/web/components/admin/CommunityModerationQueue.tsx
  - apps/web/components/campus-community/CampusNoteBoard.tsx
  - apps/web/components/campus-community/UploaderContactPanel.tsx
  - apps/web/components/peer-community/PeerCommunity.tsx
  - apps/web/components/western-new-york/WesternNewYorkDirectory.tsx
  - apps/web/lib/campus-community.ts
  - apps/web/lib/peer-guides.ts
  - apps/web/lib/server/data-store.ts
  - apps/web/lib/server/operational-records.ts
  - apps/web/lib/server/rate-limit.ts
  - apps/web/lib/western-new-york.ts
findings:
  critical: 1
  warning: 4
  info: 0
  total: 5
status: issues_found
---

# Phase 5: Code Review Report

**Reviewed:** 2026-08-29T18:33:18Z
**Depth:** standard
**Files Reviewed:** 23
**Status:** issues_found

## Summary

The Phase 5 review found a report-transition correctness failure that can make the client remove a public note despite the server declining to hide it. The remaining findings concern error disclosure, a required confirmation-dialog accessibility contract, focus restoration, and a rate-limit test double that cannot validate the selected sliding-window behavior.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Report endpoint confirms success after a rejected moderation transition

**File:** `C:\Users\judge\.codex\worktrees\75c6\Scholar-Scout-main\apps\web\app\api\campus-notes\[id]\report\route.ts:22-23`

**Issue:** `reportCampusNoteForReview` returns `{ status: 'conflict' }` when a stale report targets a removed/nonexistent note. The route discards that result and always returns `200 { ok: true }`. `CampusNoteBoard` treats every 2xx response as confirmation and removes its local row. A stale page can therefore claim a report hid a note even though no state change was committed, violating the required “hide only after successful server state transition” behavior.

**Fix:** Translate `conflict` to a non-2xx response and add a route/component regression test for it.

```ts
const result = await reportCampusNoteForReview({ noteId: id, reporterId: session.user.id });
if (result.status === 'conflict') {
  return NextResponse.json(
    { error: 'This note changed before it could be reported. Refresh and try again.' },
    { status: 409 },
  );
}
return NextResponse.json({ ok: true, message: PRIVATE_CONFIRMATION });
```

## Warnings

### WR-01: Inbox route sends persistence/configuration error messages to the browser

**File:** `C:\Users\judge\.codex\worktrees\75c6\Scholar-Scout-main\apps\web\app\api\peer-connections\route.ts:73-76`

**Issue:** The catch branch returns any thrown `Error.message`. The data-store boundary can throw messages naming the configured adapter, missing environment variables, service failures, or write-lock state. This breaks the project convention requiring non-sensitive operational errors and exposes internal deployment details to any signed-in requester.

**Fix:** Return a stable public failure message/status (use 409 for `PersistenceConflictError`, otherwise 500/503) and log sensitive diagnostics only on the server through the project’s approved operational path.

### WR-02: Public report confirmation dialog is not an actual modal interaction

**File:** `C:\Users\judge\.codex\worktrees\75c6\Scholar-Scout-main\apps\web\components\campus-community\CampusNoteBoard.tsx:114-122`

**Issue:** The dialog declares `aria-modal="true"`, but focus is neither moved into it nor trapped, and Escape does not cancel it. Keyboard users can continue interacting with the underlying public page while the confirmation is open. This violates the approved dialog contract and risks reporting the wrong note after focus/navigation changes.

**Fix:** Use the established moderation-dialog behavior (safe Cancel autofocus, focus trap, Escape handler, and return focus), or adopt a tested modal primitive.

### WR-03: Report failure restores focus to the last note, not the initiating note

**File:** `C:\Users\judge\.codex\worktrees\75c6\Scholar-Scout-main\apps\web\components\campus-community\CampusNoteBoard.tsx:26, 71, 80, 110`

**Issue:** One ref is assigned inside every mapped report button, so React leaves it pointing at the final rendered button. When reporting any earlier note fails, focus jumps to the last note’s control rather than the initiating action, contrary to the required actionable-error focus behavior.

**Fix:** Store the triggering `HTMLButtonElement` alongside `reportingNote` (as the moderation queue does), or maintain refs keyed by note ID, then restore focus to that exact element.

### WR-04: Sliding-window test double implements a fixed window and cannot verify the release policy

**File:** `C:\Users\judge\.codex\worktrees\75c6\Scholar-Scout-main\apps\web\__tests__\lib\rate-limit.test.ts:23-29, 146-164`

**Issue:** `InMemoryAtomicReservationLimiter` resets on a boundary and ignores `window.algorithm`. The test labelled “rolling one-hour” therefore passes with fixed-window behavior and does not exercise the production `UpstashAtomicReservationLimiter` branch that selects `Ratelimit.slidingWindow`. A regression to fixed windows would retain this test’s green result.

**Fix:** Add a unit test around the constructed Upstash limiter (mock `Ratelimit.fixedWindow` and `Ratelimit.slidingWindow`), or make the fake honor `algorithm` and test a boundary where fixed and sliding behavior diverge.

---

_Reviewed: 2026-08-29T18:33:18Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
