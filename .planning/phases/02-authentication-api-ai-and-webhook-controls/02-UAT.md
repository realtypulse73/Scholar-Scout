---
status: complete
phase: 02-authentication-api-ai-and-webhook-controls
source:
  - 02-VERIFICATION.md
started: 2026-08-11T22:50:00Z
updated: 2026-08-28T00:00:00-04:00
---

## Current Test

[testing complete]

## Tests

### 1. Preview advisor limiter
expected: In a Vercel Preview deployment with the managed Upstash integration enabled, a valid advisor request receives a bounded response; malformed or oversized requests are rejected before an OpenAI call; quota exhaustion returns a reset-aware 429 before context or provider work; unavailable Redis returns 503.
result: pass

### 2. Preview credential limiter
expected: From one Vercel-derived client address, six credential attempts and six registration attempts cause the sixth request to return a reset-aware 429 before KDF, account lookup, or account creation; access resumes after the configured window; unavailable Redis returns 503.
result: pass
evidence: "On the temporary Vercel Preview sign-in page, six attempts from the same client with the same made-up email and an incorrect password produced the expected sixth-attempt lockout message. After the full reset window, one additional attempt was allowed and the lockout message was gone."

## Summary

total: 2
passed: 2
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[]
