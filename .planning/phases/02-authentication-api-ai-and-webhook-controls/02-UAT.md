---
status: testing
phase: 02-authentication-api-ai-and-webhook-controls
source:
  - 02-VERIFICATION.md
started: 2026-08-11T22:50:00Z
updated: 2026-08-11T22:50:00Z
---

## Current Test

number: 1
name: Preview advisor limiter
expected: |
  In a Vercel Preview deployment with the managed Upstash integration enabled, a valid advisor request receives a bounded response; malformed or oversized requests are rejected before an OpenAI call; quota exhaustion returns a reset-aware 429 before context or provider work; unavailable Redis returns 503.
awaiting: user response

## Tests

### 1. Preview advisor limiter
expected: In a Vercel Preview deployment with the managed Upstash integration enabled, a valid advisor request receives a bounded response; malformed or oversized requests are rejected before an OpenAI call; quota exhaustion returns a reset-aware 429 before context or provider work; unavailable Redis returns 503.
result: [pending]

### 2. Preview credential limiter
expected: From one Vercel-derived client address, six credential attempts and six registration attempts cause the sixth request to return a reset-aware 429 before KDF, account lookup, or account creation; access resumes after the configured window; unavailable Redis returns 503.
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps

[]
