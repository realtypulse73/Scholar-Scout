---
status: testing
phase: 05-school-community-and-wny-release-slice
source: [05-VERIFICATION.md]
started: 2026-08-29T14:54:07.492Z
updated: 2026-08-29T14:54:07.492Z
---

## Current Test

number: 1
name: Discovery source and accessibility review
expected: |
  Guidance is clear, focus/order is usable, intended official sources open, and long Unicode labels wrap.
awaiting: user response

## Tests

### 1. Discovery source and accessibility review

expected: Keyboard- and screen-reader-check populated and empty Western New York and school-locker screens, opening every visible official source link. Guidance remains clear, focus order is usable, intended official sources open, and long Unicode labels wrap without horizontal overflow.
result: [pending]

### 2. Authenticated report and staff-resolution journey

expected: As a signed-in student, report a public note, cancel once, then confirm once; as fresh staff, resolve the resulting queue entry. Cancellation restores focus to the initiating control, success hides only that row with a private confirmation, and staff actions remain restore/remove only.
result: [pending]

### 3. Live shared quota boundary

expected: Against configured Upstash, make alternating valid note and inbox submissions across a clock boundary. Five combined submissions are accepted, the sixth is denied before a write, expired reservations later permit a new write, and an unavailable provider writes nothing without showing a remaining count.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps

