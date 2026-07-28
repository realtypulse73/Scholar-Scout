---
phase: 02-authentication-api-ai-and-webhook-controls
plan: 02
subsystem: security-infrastructure
tags: [upstash, redis, rate-limiting, request-validation, vercel]
requires:
  - phase: 02-authentication-api-ai-and-webhook-controls
    provides: "Approved Upstash package provenance and Vercel-managed Redis integration contract."
provides:
  - "Fail-closed, externally atomic reservation seam for advisor and credential operations."
  - "Trusted Vercel-only client IP resolution for credential rate-limit keys."
  - "Reusable byte-bounded JSON parsing with route-owned exact validation."
affects: [advisor-controls, credential-rate-limits, api-route-hardening]
tech-stack:
  added: ["@upstash/redis@1.38.0", "@upstash/ratelimit@2.0.8"]
  patterns:
    - "Reserve an external atomic quota before KDF, context reads, or provider calls; report unavailable state as a safe 503."
    - "Hash identity material in provider keys and derive request IPs only from Vercel's overwritten client-address header."
    - "Bound body bytes before JSON parsing and let each route own its exact payload schema."
key-files:
  created:
    - apps/web/lib/server/rate-limit.ts
    - apps/web/lib/server/request-ip.ts
    - apps/web/lib/api-request.ts
    - apps/web/__tests__/lib/rate-limit.test.ts
    - apps/web/__tests__/lib/request-ip.test.ts
    - apps/web/__tests__/lib/api-request.test.ts
  modified:
    - apps/web/package.json
    - pnpm-lock.yaml
    - .env.production.example
    - .env.prelaunch.local.example
key-decisions:
  - "Consume only Vercel's managed UPSTASH_REDIS_REST_KV_REST_API_URL and UPSTASH_REDIS_REST_KV_REST_API_TOKEN names on the server."
  - "Use Upstash fixed windows with no in-process fallback and an explicit unavailable reservation result."
  - "Retain a migrated guest advisor window as the active quota key through its UTC-day reset."
patterns-established:
  - "Inject AtomicReservationLimiter and clock seams for deterministic quota tests without a live provider."
  - "Use isExactObject plus route-owned scalar and array validators after bounded JSON parsing."
requirements-completed: [SEC-03, SEC-05]
coverage:
  - id: D1
    description: "Atomic, fail-closed advisor and credential reservation policies with trusted Vercel IP keys."
    requirement: SEC-05
    verification:
      - kind: unit
        ref: "apps/web/__tests__/lib/rate-limit.test.ts and apps/web/__tests__/lib/request-ip.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Reusable bounded JSON parser that rejects oversize, malformed, and extra-field request bodies before downstream work."
    requirement: SEC-03
    verification:
      - kind: unit
        ref: "apps/web/__tests__/lib/api-request.test.ts"
        status: pass
    human_judgment: false
duration: 11min
completed: 2026-07-28
status: complete
---

# Phase 2 Plan 02: Atomic Limiter and Bounded Request Contracts Summary

**Pinned Upstash reservations now protect advisor and credential work with fail-closed quotas, while shared request parsing rejects oversized or invalid JSON before downstream processing.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-07-28T01:47:33Z
- **Completed:** 2026-07-28T01:59:01Z
- **Tasks:** 3/3
- **Files modified:** 10

## Accomplishments

- Added the maintainer-approved `@upstash/redis@1.38.0` and `@upstash/ratelimit@2.0.8` packages with matching lockfile integrity, plus server-only Vercel integration guidance.
- Built typed, atomic fixed-window policies for guest and account advisor use, sign-in email/IP pairs, and registration IPs; absent or failed provider reservations deny work safely.
- Added strict Vercel client-IP resolution and a streamed, byte-bounded JSON parser whose route-owned validators reject extra fields and invalid bounds.

## Task Commits

1. **Task 1: Add the approved atomic limiter dependency and operational boundary** - `c5e0e10` (chore)
2. **Task 2: Implement fail-closed atomic reservation policies** - `575562c` (TDD RED), `f1371e4` (feat), `3f4741e` (test coverage)
3. **Task 3: Add reusable byte-bounded exact JSON parsing** - `a13bd26` (TDD RED), `d1826cc` (feat)

## Files Created/Modified

- `apps/web/lib/server/rate-limit.ts` - Upstash fixed-window adapter, typed policies, hashed provider keys, and injected test seams.
- `apps/web/lib/server/request-ip.ts` - Vercel-only client-address extraction that ignores caller-controlled forwarded headers.
- `apps/web/lib/api-request.ts` - Content-Length and streamed-byte bounds with typed JSON/validation failures.
- `apps/web/__tests__/lib/rate-limit.test.ts` - Deterministic quota, reset, migration-binding, unavailable-provider, and missing-config coverage.
- `apps/web/__tests__/lib/request-ip.test.ts` - Trusted-header and spoofed/malformed-header coverage.
- `apps/web/__tests__/lib/api-request.test.ts` - Byte-limit and exact route-schema coverage.
- `apps/web/package.json`, `pnpm-lock.yaml` - Pinned Upstash dependencies and provenance-matching integrity values.
- `.env.production.example`, `.env.prelaunch.local.example` - Server-only managed-variable and Preview verification guidance.

## Decisions Made

- Read only the Vercel-managed REST URL/token variable names; neither generic aliases nor browser-visible variables are used.
- Disable the limiter's ephemeral cache and do not fall back to process memory, so quota safety remains external and fail-closed.
- Keep payload semantics with route validators rather than coupling actor, provider, or persistence logic into the shared parser.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Isolated the ESM-only Upstash transitive dependency from Jest's CommonJS transform**
- **Found during:** Task 2
- **Issue:** The injected limiter tests loaded Upstash's ESM `uncrypto` dependency before a real provider was needed, which Jest could not parse under the existing transform.
- **Fix:** Added test-only mocks for the Upstash module boundary; production code still loads the real server-side client.
- **Files modified:** `apps/web/__tests__/lib/rate-limit.test.ts`
- **Verification:** Focused rate-limit and request-IP Jest suites pass.
- **Committed in:** `f1371e4`

**2. [Rule 3 - Blocking] Supplied Node web-stream fixtures for JSDOM parser tests**
- **Found during:** Task 3
- **Issue:** The existing JSDOM environment did not expose `ReadableStream`, `TextEncoder`, or `TextDecoder` for streamed-body tests.
- **Fix:** Used Node's standard stream/text utilities in the test fixture only.
- **Files modified:** `apps/web/__tests__/lib/api-request.test.ts`
- **Verification:** Parser suite, TypeScript check, and lint pass.
- **Committed in:** `d1826cc`

**3. [Rule 2 - Missing Critical Test Coverage] Added missing-configuration fail-closed coverage**
- **Found during:** Final verification
- **Issue:** Provider failure was tested, but the explicit no-limiter configuration result was not.
- **Fix:** Added a deterministic unavailable-reservation assertion.
- **Files modified:** `apps/web/__tests__/lib/rate-limit.test.ts`
- **Verification:** All focused Plan 02-02 tests pass.
- **Committed in:** `3f4741e`

**Total deviations:** 3 auto-fixed (2 blocking test-environment issues, 1 critical coverage gap).

## Issues Encountered

- The executor initially lacked the required Node 20/Corepack environment. The maintainer supplied a portable Node 20.20.2 and Corepack pnpm 10.34.5 runtime before dependency installation.

## Known Stubs

None.

## Next Phase Readiness

- Advisor and credential routes can now reserve their named policy before expensive or externally billable work and translate `unavailable` reservations to safe 503 responses.
- Route plans can compose `parseJsonRequest` with their own exact field validators before resolving actors, loading persistence data, or invoking providers.

## Self-Check: PASSED

- Required source files exist: `apps/web/lib/server/rate-limit.ts`, `apps/web/lib/server/request-ip.ts`, and `apps/web/lib/api-request.ts`.
- Task commits exist: `c5e0e10`, `575562c`, `f1371e4`, `a13bd26`, `d1826cc`, and `3f4741e`.
- Focused Jest verification passed: 3 suites, 20 tests; TypeScript and lint also passed.

---
*Phase: 02-authentication-api-ai-and-webhook-controls*
*Completed: 2026-07-28*
