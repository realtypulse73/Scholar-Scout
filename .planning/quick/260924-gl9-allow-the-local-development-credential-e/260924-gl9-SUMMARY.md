---
quick_id: 260924-gl9
status: complete
completed: 2026-09-24
commit: c44eb98
---

# Quick Task 260924-gl9 Summary

Made a newly registered account usable in a plain local `next dev` process by applying the existing server-derived local-only exception to the credential-grant exchange, while Vercel Preview and production retain trusted-IP and atomic rate-limit controls.

## Changes

- Renamed the local runtime predicate to cover both registration and credential exchange without broadening its allowlist: only `NODE_ENV=development` with empty or absent Vercel markers is permitted.
- Preserved registration behavior and made the credentials route bypass trusted IP parsing and atomic sign-in reservation only under that exact local runtime condition.
- Kept deployed credential exchanges in their existing order: trusted Vercel IP, atomic reservation, unavailable or rate-limit response, credential verification, then one-use grant issuance.
- Issued local grants with a fixed server-owned `local-development` marker and ignored all forwarded request headers in the local branch.
- Added regression coverage for spoofed forwarding headers, Vercel Preview/production failure closure, and the previously established rate-limit and one-use grant behavior.

## Verification

- `pnpm --filter @scholar-scout/web test --runInBand __tests__/lib/request-ip.test.ts __tests__/api/register.test.ts __tests__/api/auth-controls.test.ts` — 31/31 passed.
- `pnpm --filter @scholar-scout/web run typecheck` — passed.
- `pnpm --filter @scholar-scout/web run lint` — passed.

## Decisions

- The local exception remains server-runtime-derived and never accepts a request header as an environment or identity signal.
- The local credential grant uses a fixed server-owned marker, retaining the existing credential verification and short-lived one-use grant semantics.
- Any Vercel-marked or non-development runtime continues to fail closed when trusted IP or the atomic reservation service is unavailable.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Test typing] Narrowed the credential environment fixture.**
- **Found during:** TypeScript verification.
- **Issue:** The Preview/production table inferred `NODE_ENV` as a general string, which did not satisfy the project’s strict `ProcessEnv` type.
- **Fix:** Added an explicitly narrow `CredentialEnvironment` test type.
- **Verification:** Focused Jest tests, typecheck, and lint passed.
- **Committed in:** `c44eb98`

---

**Total deviations:** 1 auto-fixed test typing issue.
**Impact on task:** No production behavior changed beyond the planned local-only credential exchange boundary.

## Commit

- `c44eb98` — `fix(260924-gl9): allow safe local credential exchange`

## Self-Check: PASSED

- All six planned implementation and test files exist in the worktree.
- `c44eb98` is present in git history.
