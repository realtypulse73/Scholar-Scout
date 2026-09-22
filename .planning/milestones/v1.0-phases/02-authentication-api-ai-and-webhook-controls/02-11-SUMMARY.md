---
phase: 02-authentication-api-ai-and-webhook-controls
plan: 11
subsystem: registration-and-browser-credentials
tags: [security, registration, rate-limiting, nextauth, guest-migration]
requires:
  - 02-02 atomic reservation controls
  - 02-03 session-bound guest migration
  - 02-10 credential grant exchange
provides:
  - Trusted-IP, pre-write registration rate limiting
  - Browser credential grant and migration flow
affects: [registration, sign-in, account-migration]
tech-stack:
  added: []
  patterns: [exact-request-contracts, fail-closed-reservations, opaque-credential-grants]
key-files:
  created:
    - apps/web/__tests__/api/register.test.ts
    - apps/web/__tests__/components/auth/AuthForm.test.tsx
  modified:
    - apps/web/app/api/register/route.ts
    - apps/web/components/auth/AuthForm.tsx
decisions:
  - Registration accepts only email, name, and password; the server derives the role from the active allowlist.
  - Credential UI exchanges email/password only for an opaque server grant and completes guest migration before navigation.
metrics:
  duration: 24m
  completed: 2026-07-28
  tasks_completed: 2
  files_changed: 4
status: complete
---

# Phase 02 Plan 11: Registration and Browser Credential Integration Summary

Registration now reserves a trusted Vercel IP quota before account creation, while browser credential sign-in uses a one-use grant and completes same-device guest migration before profile navigation.

## Completed Tasks

1. **Rate-bound exact registration before account creation**
   - Added byte-bounded, exact registration validation for email, name, and password.
   - Resolves client address exclusively through the Vercel trusted-IP helper, fails closed on absent controls, and returns reset-aware `429` before writes.
   - Derives the account role server-side from the live allowlist and never accepts a browser role.

2. **Wire AuthForm to the supported credential boundary and migration flow**
   - Removed the client-side role selector.
   - Exchanges only email/password at `/api/auth/credentials`, passes only the opaque grant to NextAuth, then calls guest migration before profile navigation.
   - Uses fixed safe messages for credential outcomes, rate resets, service unavailability, and recoverable migration failure.

## Verification

- Focused registration and AuthForm suites: **14 tests passed**.
- Full web Jest suite: **38 suites / 221 tests passed**.
- Web lint: **passed**.
- Web typecheck: **passed**.

The execution runner did not provide the repository-pinned Corepack/Node 20/pnpm 10 toolchain. Verification therefore ran directly with the available Node 24 runtime and a temporary, removed Jest alias config; the repository files and standard test configuration were not changed for that workaround.

## Decisions Made

- Registration request bodies are exact, byte-bounded contracts; rate reservations happen only after parsing but before account writes.
- Browser code never selects an account role or sends raw credentials to NextAuth; it receives a server-minted grant first.
- A failed guest migration is recoverable and prevents profile navigation so the user is informed instead of silently losing transfer feedback.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] Used the available direct Node/Jest runner for verification**
- **Found during:** Tasks 1 and 2 verification
- **Issue:** `corepack` and Node 20 were unavailable; the fallback pnpm was Node 24/pnpm 11 and rejected the repository engine policy.
- **Fix:** Ran the installed workspace Jest, ESLint, and TypeScript binaries with the available runtime. A temporary Jest alias config was used only for execution and removed afterward.
- **Files modified:** None retained

## Known Stubs

None.

## Self-Check: PASSED

- Confirmed all four implementation and test files exist.
- Focused tests, complete web tests, lint, and typecheck passed.
