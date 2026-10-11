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

- hypothesis: A normal credential grant is held only in process memory, but the credential exchange and Auth.js callback may execute in different Vercel Preview functions.
- test: Make the owner-only emergency handoff cryptographically verifiable in either Preview function while retaining the normal single-use in-process grant everywhere else.
- expecting: Only the exact configured Preview owner can complete the short-lived signed handoff; Production and every other account reject it.
- next_action: Commit and deploy the cross-function Preview handoff, then repeat the owner sign-in test.

## Evidence

- timestamp: "2026-10-11"; the Preview sign-in page reports the app's 503-specific message, distinct from the registration route's generic 400 message.
- timestamp: "2026-10-11"; `app/api/auth/credentials/route.ts` returns `credential-service-unavailable` before password verification whenever the atomic sign-in reservation is unavailable.
- timestamp: "2026-10-11"; `app/api/register/route.ts` already carries an exact-email, Preview-only owner exception for the same external Preview rate-limit dependency.
- timestamp: "2026-10-11"; focused registration and credential-exchange tests pass with 26 assertions, including the owner-only Preview exception and Production denial; lint and TypeScript checks also pass.
- timestamp: "2026-10-11"; the newly deployed Preview build still returns the temporary-unavailable sign-in response after the owner flag and email were saved and redeployed.
- timestamp: "2026-10-11"; source review shows both Preview exceptions run only after `getTrustedRequestIp` rejects an omitted Vercel address, so neither exception can activate in this deployment.
- timestamp: "2026-10-11"; focused tests now pass with 28 assertions, including missing-trusted-address cases for the exact Preview owner, other Preview accounts, and Production.
- timestamp: "2026-10-11"; the newly deployed Preview build still reports temporary sign-in unavailability after the request-address boundary was corrected and the owner settings were redeployed.
- timestamp: "2026-10-11"; the normal credential handoff uses a process-global in-memory map, while the exchange route and Auth.js callback can execute in separate Vercel Preview functions.
- timestamp: "2026-10-11"; focused authentication tests, lint, TypeScript, and diff checks pass after adding a signed, two-minute, Preview-owner-only cross-function handoff with no password material.

## Resolution

- root_cause: The request-address fix permitted the credential exchange, but the exchange route stored the normal short-lived grant only in its process memory. The subsequent Auth.js callback can run in a different Vercel Preview function and therefore cannot consume that in-memory grant.
- fix: When and only when the exact configured Preview demo owner reaches the existing emergency boundary, issue a two-minute HMAC-signed assertion containing only safe account claims. The Auth.js callback verifies it against the Preview environment, current owner email, and `NEXTAUTH_SECRET`; normal flows remain single-use in-memory grants. Production and every other account reject the assertion.
- verification: Focused API tests, lint, TypeScript, and `git diff --check` pass locally. A new Preview deployment and owner sign-in remain required.
