---
phase: 05-school-community-and-wny-release-slice
fixed_at: 2026-08-29T18:45:30Z
review_path: .planning/phases/05-school-community-and-wny-release-slice/05-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 5: Code Review Fix Report

**Source review:** `05-REVIEW.md`
**Iteration:** 1

## Fixed Issues

### CR-01: Conflicted reports no longer confirm or hide a note

**Commit:** `a657a6b`

The report route returns a safe `409` for a rejected moderation transition; the browser keeps the note actionable because it only hides a note after a successful response.

### WR-01: Inbox persistence errors stay private

**Commit:** `bd81e6e`

The inbox endpoint maps conflict and operational failures to stable public messages and never returns storage/configuration details.

### WR-02 / WR-03: Report dialog is keyboard-safe and restores exact focus

**Commit:** `74d9c7a`

The confirmation dialog autofocuses Cancel, traps Tab focus, handles Escape, and retains the exact triggering report button for cancellation and failed-report recovery.

### WR-04: Production sliding-window selection is verified

**Commit:** `584915d`

The rate-limit test now observes the production Upstash limiter construction and proves that community submissions select `Ratelimit.slidingWindow(5, '1 h')` rather than `fixedWindow`.

## Verification

- Focused API, component, and rate-limit Jest suites passed under Node `20.20.2` and Corepack pnpm `10.34.5`.
- Full web Jest gate completed under the same pinned toolchain.
- Web lint and TypeScript typecheck passed.

_Fixer: gsd-code-fixer_
