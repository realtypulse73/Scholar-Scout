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

- hypothesis: Credential exchange still fails closed on the unavailable Preview rate-limit reservation, while registration alone has the exact-email Preview-owner exception.
- test: Add focused tests covering the exact configured Preview owner, another Preview account, and Production when the limiter is unavailable.
- expecting: Only the configured Preview owner can receive a credential grant during that temporary dependency outage.
- next_action: Deploy the committed Preview fix and repeat the owner sign-in test.

## Evidence

- timestamp: "2026-10-11"; the Preview sign-in page reports the app's 503-specific message, distinct from the registration route's generic 400 message.
- timestamp: "2026-10-11"; `app/api/auth/credentials/route.ts` returns `credential-service-unavailable` before password verification whenever the atomic sign-in reservation is unavailable.
- timestamp: "2026-10-11"; `app/api/register/route.ts` already carries an exact-email, Preview-only owner exception for the same external Preview rate-limit dependency.
- timestamp: "2026-10-11"; focused registration and credential-exchange tests pass with 26 assertions, including the owner-only Preview exception and Production denial; lint and TypeScript checks also pass.

## Resolution

- root_cause: The account-creation exception did not cover the separate credential-exchange endpoint, which independently reserves a sign-in rate-limit window before verifying the account password.
- fix: When and only when the atomic reservation is unavailable, permit the exact configured Preview demo owner through credential exchange. The existing trusted-IP requirement, a functioning limiter's denial response, every other account, and Production all remain fail-closed.
- verification: Focused API tests, lint, TypeScript, and `git diff --check` pass locally. A new Preview deployment and owner sign-in remain required.
