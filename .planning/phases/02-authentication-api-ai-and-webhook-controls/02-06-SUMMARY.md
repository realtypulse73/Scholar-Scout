---
phase: 02-authentication-api-ai-and-webhook-controls
plan: 06
subsystem: staff-authorization
tags: [nextauth, authorization, allowlist, audit, api, tdd]
requires:
  - phase: 02-authentication-api-ai-and-webhook-controls
    provides: "Server-derived account identity and protected student routes."
provides:
  - "Per-request strict allowlist authorization that does not trust JWT staff roles."
  - "Privacy-minimal audit evidence for allowed and denied programme administration attempts."
  - "Programme routes that fail closed before request parsing or programme persistence."
affects: [02-07, admin-operations, staff-revocation]
tech-stack:
  added: []
  patterns:
    - "Privileged routes call requireActiveStaff before parsing untrusted input or accessing domain stores."
    - "Privileged audit records retain only actor ID, action, route, outcome, and timestamp."
key-files:
  created:
    - apps/web/lib/server/active-staff.ts
    - apps/web/__tests__/api/active-staff.test.ts
  modified:
    - apps/web/lib/server/data-store.ts
    - apps/web/app/api/admin/programmes/route.ts
key-decisions:
  - "Treat a missing, blank, malformed, or duplicate-normalized staff allowlist as invalid and deny access."
  - "Use the current session only for an ID/email comparison against the live allowlist; never use the JWT or stored role as privileged authority."
  - "Keep authorization evidence separate from existing programme content audits so it cannot contain request bodies or email addresses."
patterns-established:
  - "All future privileged routes should use requireActiveStaff with a stable action and route identifier."
requirements-completed: [SEC-02]
coverage:
  - id: D1
    description: "A removed staff member loses programme administration access on the next request despite retaining a stale staff JWT claim."
    requirement: SEC-02
    verification:
      - kind: integration
        ref: "apps/web/__tests__/api/active-staff.test.ts#checks the current strict allowlist on every request instead of a stale JWT role"
        status: pass
    human_judgment: false
  - id: D2
    description: "Privileged programme GET, POST, and DELETE fail closed for invalid allowlists and record only minimal allowed or denied authorization evidence."
    requirement: SEC-02
    verification:
      - kind: integration
        ref: "apps/web/__tests__/api/active-staff.test.ts#active staff authorization"
        status: pass
    human_judgment: false
duration: 7min
completed: 2026-07-28
status: complete
---

# Phase 2 Plan 06: Active Staff Authorization and Audit Summary

**Programme administration now verifies a strict live staff allowlist on every request and records only minimal authorization evidence for allowed and denied attempts.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-07-28T02:53:00Z
- **Completed:** 2026-07-28T03:00:00Z
- **Tasks:** 2/2
- **Files modified:** 4

## Accomplishments

- Added a server-only active-staff guard that requires current session identity and a valid, freshly parsed `SCHOLARSCOUT_STAFF_EMAILS` allowlist match.
- Added normalized, privacy-minimal privileged-operation audit persistence that excludes request content, emails, cookies, tokens, and secrets.
- Replaced programme route JWT-role checks with early live authorization for GET, POST, and DELETE while retaining ordinary signed-in student shortlist access.

## Task Commits

1. **Task 1: Create active-staff authorization and minimal audit primitives** - `536f181` (TDD RED), `299e701` (implementation)
2. **Task 2: Apply active authorization to programme administration** - `19560d8` (TDD RED), `d41af03` (implementation)
3. **Audit coverage completion** - `ce32555` (test)

## Files Created/Modified

- `apps/web/lib/server/active-staff.ts` - Enforces current strict staff authorization and emits safe 403 results.
- `apps/web/lib/server/data-store.ts` - Persists and normalizes the dedicated minimal privileged-operation audit collection.
- `apps/web/app/api/admin/programmes/route.ts` - Guards all programme operations before parsing or store work and uses the live actor ID.
- `apps/web/__tests__/api/active-staff.test.ts` - Covers live revocation, invalid config, allowed/denied audits, protected routes, and unaffected student access.

## Decisions Made

- A JWT or stored user role is not sufficient staff authority; the server compares the current session email with the current strict allowlist for every privileged request.
- An invalid allowlist denies safely instead of attempting a permissive fallback.
- Authorization audit records deliberately use actor ID rather than email and do not accept arbitrary request metadata.

## Verification

- `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/api/active-staff.test.ts` - passed (7 tests).
- `corepack pnpm --filter @scholar-scout/web run typecheck` - passed.
- `corepack pnpm --filter @scholar-scout/web run lint` - passed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Test isolation] Made route-audit assertions sequential**
- **Found during:** Task 2
- **Issue:** The initial test invoked three independent audit writes concurrently, which exercises the known whole-document persistence race outside this plan's scope and lost test fixture writes.
- **Fix:** Issued the independent route attempts sequentially while retaining assertion coverage for each authorization result and all three audit records.
- **Files modified:** `apps/web/__tests__/api/active-staff.test.ts`
- **Verification:** Focused Jest suite, typecheck, and lint pass.
- **Committed in:** `d41af03`

**Total deviations:** 1 auto-fixed (1 Rule 1 test-isolation correction). No production scope expansion.

## Known Stubs

None.

## Threat Flags

None - the authorization and audit surfaces are the plan's explicit T-02-11 and T-02-12 mitigations.

## Self-Check: PASSED

- All four plan-owned source and test files exist.
- TDD and implementation commits `536f181`, `299e701`, `19560d8`, `d41af03`, and `ce32555` exist in Git history.
- Focused Jest coverage, TypeScript, and ESLint verification passed.

---
*Phase: 02-authentication-api-ai-and-webhook-controls*
*Completed: 2026-07-28*
