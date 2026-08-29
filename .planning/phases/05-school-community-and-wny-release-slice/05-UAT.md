---
status: partial
phase: 05-school-community-and-wny-release-slice
source: [05-VERIFICATION.md]
started: 2026-08-29T14:54:07.492Z
updated: 2026-08-29T20:34:00.000Z
---

## Current Test

[testing complete — 3 external prerequisites remain]

## Tests

### 1. Discovery source and accessibility review

expected: Keyboard- and screen-reader-check populated and empty Western New York and school-locker screens, opening every visible official source link. Guidance remains clear, focus order is usable, intended official sources open, and long Unicode labels wrap without horizontal overflow.
result: blocked
blocked_by: assistive-technology review
reason: "The deployed Preview now has 40 visible source links, no stale-link 404/certificate failure, ordered focusable controls, and no horizontal overflow; a real screen-reader and long-Unicode-label review still requires an assistive-technology session."

### 2. Authenticated report and staff-resolution journey

expected: As a signed-in student, report a public note, cancel once, then confirm once; as fresh staff, resolve the resulting queue entry. Cancellation restores focus to the initiating control, success hides only that row with a private confirmation, and staff actions remain restore/remove only.
result: blocked
blocked_by: Preview Blob conditional-write provider gate
reason: "The canonical-path repair allowed the two generated isolated Preview accounts to register and authenticate; the staff allowlist is also verified. Before any public test content was submitted, a read-only staff moderation-page load deterministically exhausted its two required privacy-minimal audit CAS attempts, including after more than 70 seconds idle. Fresh student re-sign-in proves the document is readable, but the Preview provider rejects the required ETag conditional write."

### 3. Live shared quota boundary

expected: Against configured Upstash, make alternating valid note and inbox submissions across a clock boundary. Five combined submissions are accepted, the sixth is denied before a write, expired reservations later permit a new write, and an unavailable provider writes nothing without showing a remaining count.
result: blocked
blocked_by: Preview Blob conditional-write provider gate
reason: "Upstash is configured and the generated isolated Preview student now authenticates, but the Preview Blob provider rejects the required ETag conditional write used by the staff audit append. The shared note/inbox test intentionally requires durable writes, so it remains blocked until the provider supports the configured conditional-write contract. No public test content was submitted."

## Summary

total: 3
passed: 0
issues: 0
pending: 0
skipped: 0
blocked: 3

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
