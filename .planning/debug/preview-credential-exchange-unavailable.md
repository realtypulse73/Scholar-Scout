---
status: resolved
trigger: "Preview local-account sign-in reports: Sign-in is temporarily unavailable. Please try again."
created: "2026-10-11"
updated: "2026-10-11"
---

# Preview Credential Exchange Unavailable

## Symptoms

- **Expected behavior:** The configured Preview demo owner can sign in after creating a local Preview account.
- **Actual behavior:** The sign-in form reports that sign-in is temporarily unavailable.
- **Reproduction:** Submit valid local credentials on the `worktree-agent-phase10` Preview deployment after the owner-only registration exception permits account creation.

## Current Focus

- hypothesis: The exact-owner exception must also cover Vercel's missing trusted request address, because this Preview deployment rejects the request before the reservation call.
- test: Add focused tests for a missing trusted request address while retaining exact Preview-owner, other-account, and Production boundaries.
- expecting: Only the configured Preview owner can proceed without a trusted request address; all other Preview accounts and every Production account receive the existing safe unavailable response.
- next_action: Commit and deploy the corrected Preview boundary, then repeat the owner sign-in test.

## Evidence

- timestamp: "2026-10-11"; the Preview sign-in page reports the app's 503-specific message, distinct from the registration route's generic 400 message.
- timestamp: "2026-10-11"; `app/api/auth/credentials/route.ts` returns `credential-service-unavailable` before password verification whenever the atomic sign-in reservation is unavailable.
- timestamp: "2026-10-11"; `app/api/register/route.ts` already carries an exact-email, Preview-only owner exception for the same external Preview rate-limit dependency.
- timestamp: "2026-10-11"; focused registration and credential-exchange tests pass with 26 assertions, including the owner-only Preview exception and Production denial; lint and TypeScript checks also pass.
- timestamp: "2026-10-11"; the newly deployed Preview build still returns the temporary-unavailable sign-in response after the owner flag and email were saved and redeployed.
- timestamp: "2026-10-11"; source review shows both Preview exceptions run only after `getTrustedRequestIp` rejects an omitted Vercel address, so neither exception can activate in this deployment.
- timestamp: "2026-10-11"; focused tests now pass with 28 assertions, including missing-trusted-address cases for the exact Preview owner, other Preview accounts, and Production.

## Resolution

- root_cause: The owner-only exception was evaluated only after the trusted Vercel request-address check. This Preview deployment omits that address, so the request was rejected before either the registration or credential-exchange exception could activate.
- fix: When and only when the request belongs to the exact configured Preview demo owner, permit registration or credential exchange to proceed after an unavailable trusted-address check. The existing limiter denial response, every other account, and Production remain fail-closed.
- verification: Focused API tests, lint, TypeScript, and `git diff --check` pass locally. A new Preview deployment and owner sign-in remain required.
