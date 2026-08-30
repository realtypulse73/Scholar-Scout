---
status: partial
phase: 05-school-community-and-wny-release-slice
source: [05-VERIFICATION.md]
started: 2026-08-29T14:54:07.492Z
updated: 2026-08-30T07:31:00.000Z
---

## Current Test

[tests 1 and 3 remain externally gated]

## Tests

### 1. Discovery source and accessibility review

expected: Keyboard- and screen-reader-check populated and empty Western New York and school-locker screens, opening every visible official source link. Guidance remains clear, focus order is usable, intended official sources open, and long Unicode labels wrap without horizontal overflow.
result: blocked
blocked_by: assistive-technology review
reason: "The deployed Preview now has 43 visible source links, a visible verification notice, four labeled controls, no stale-link 404/certificate failure, ordered focusable controls, and no horizontal overflow at the tested viewport. Focused Western New York data tests (5) and community component tests (12, including keyboard/Unicode coverage) pass, as do typecheck and lint. A real screen-reader and long-Unicode-label review still requires an assistive-technology session."

### 2. Authenticated report and staff-resolution journey

expected: As a signed-in student, report a public note, cancel once, then confirm once; as fresh staff, resolve the resulting queue entry. Cancellation restores focus to the initiating control, success hides only that row with a private confirmation, and staff actions remain restore/remove only.
result: pass
reason: "On the corrected isolated Preview, generated student content posted successfully. Cancelling the report dialog restored focus to the initiating report control; confirming the report hid only that note and displayed the private confirmation. A fresh generated allowlisted staff account saw the identity-minimal queue, restored the note, received a success status, and the queue became empty. No PersistenceConflictError occurred."

### 3. Live shared quota boundary

expected: Against configured Upstash, make alternating valid note and inbox submissions across a clock boundary. Five combined submissions are accepted, the sixth is denied before a write, expired reservations later permit a new write, and an unavailable provider writes nothing without showing a remaining count.
result: blocked
blocked_by: external-time boundary
reason: "On the exact configured Upstash Preview, a fresh generated non-personal student account made five alternating marked note/inbox submissions successfully. At 2026-08-30T07:30:27Z, its sixth marked note returned only 'Please wait before sending another community submission,' kept its draft in the form, and created no sixth public note. No remaining count was disclosed. The real sliding-window expiry still requires one marked authenticated submission after 2026-08-30T08:31:00Z; the signed-in Preview tab is retained for that single follow-up. The authenticated provider-outage/no-write check passed on isolated Preview dpl_8GPxTpWo3eF7y6F6hYfDQCJVvDqt: one marked note returned 'Community submissions are temporarily unavailable.' and one marked inbox request returned 'Inbox requests are temporarily unavailable. Please try again later.' Both drafts visibly remained in their fields, neither success state appeared, and focused route tests prove each 503 occurs before its store write."

## Summary

total: 3
passed: 1
issues: 0
pending: 0
skipped: 0
blocked: 2

## Gaps

- gap_id: G-05-1
  truth: "Keyboard- and screen-reader-check populated and empty Western New York and school-locker screens, opening every visible official source link. Guidance remains clear, focus order is usable, intended official sources open, and long Unicode labels wrap without horizontal overflow."
  status: resolved
  reason: "The Preview verification first found stale 404 links and a SUNY Erie certificate failure; both source-data defects were corrected and rechecked in Preview."
  severity: major
  test: 1
  artifacts:
    - apps/web/lib/western-new-york.ts
    - apps/web/components/western-new-york/WesternNewYorkDirectory.tsx
    - apps/web/__tests__/lib/western-new-york.test.ts
  resolved_by: [05-06-PLAN.md, 05-07-PLAN.md]
  resolved_at: 2026-08-29
  diagnosis: "The first four 404s were stale institutional mediaUrl paths. Recheck then found that the displayed www.sunyerie.edu source host had a real TLS certificate mismatch; verified official SUNY Erie pages are served at www.ecc.edu."
