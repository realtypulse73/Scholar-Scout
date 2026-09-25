---
status: resolved
trigger: "Authenticated local Phase 12 browser journey cannot sign in after a successful credential exchange."
created: 2026-09-25
updated: 2026-09-25
---

# Local Authenticated Browser Journey

## Symptoms

- Expected: a local test account can sign in and complete the Phase 12 qualifications browser journey without resetting recovered state.
- Actual: `/api/auth/credentials` returns 200 and issues a one-time grant, but NextAuth's credential callback returns 401; the UI says sign-in is temporarily unavailable.
- Related evidence: a production-mode local build is blocked because `next/font/google` cannot fetch Space Grotesk in this environment.
- Timeline: observed during the Phase 12 human verification journey after the recovered local setup.
- Reproduction: run the current worktree with `next dev`, create or use a valid local account, then sign in through the credentials form at `127.0.0.1:3100`.

## Current Focus

Resolved. The repaired local credential handoff and bundled font enabled the authenticated browser journey; the resulting Phase 12 UAT is recorded in `../phases/12-qualification-lens-and-explanation-governance/12-UAT.md`.

## Repair Plan

1. Preserve the existing opaque, two-minute, single-use grant contract, but anchor its map on a namespaced `globalThis` symbol so independently evaluated development-route bundles use the same process-local store.
2. Supply a generated, process-local NextAuth secret only for plain `next dev` when no local environment file exists; deployed Vercel environments must continue to require an explicit configured secret.
3. Add regression tests that evaluate the server module in two isolated module registries, issue a grant from one, consume it from the other, and prove replay remains rejected; test the local-only auth-secret guard separately.
4. Run focused authentication tests, web typecheck, lint, a Vercel-equivalent build, and a live local sign-in check on `127.0.0.1:3100` before resuming the Phase 12 browser journey.
5. Do not silently replace the user-selected Space Grotesk typeface. Vendor the official OFL-licensed local font asset and test `build:vercel` so the offline production build does not depend on Google.

## Evidence

- 2026-09-25: Server log recorded `POST /api/auth/credentials 200` followed by `POST /api/auth/callback/credentials 401` for a valid local account.
- 2026-09-25: `next build` failed only at `next/font` fetching Space Grotesk with `EACCES` after retries.
- 2026-09-25: Source inspection confirmed the credential exchange and the NextAuth callback both import a module-local `credentialGrants` map from `data-store.ts`; the focused unit test executes both imports from one Jest module registry and therefore cannot reveal the route-bundle split.
- 2026-09-25: Before the repair, the existing server returned 500 for `/`, `/auth/sign-in`, and all NextAuth endpoints because the Google font request was unavailable; after bundling the official Space Grotesk asset, page routes returned 200.
- 2026-09-25: A newly started local server on `127.0.0.1:3200` returned 200 for NextAuth providers, CSRF, and session endpoints. The disposable test account then completed credential exchange (200), credential callback (200), and authenticated session lookup (200).

## Resolution

- root_cause: Development route bundles evaluated the module-local credential-grant map independently, while the local server also had no NextAuth secret and the root layout depended on an unavailable Google-font build fetch.
- fix: Anchored the short-lived single-use grant map and a generated local-development-only NextAuth secret on namespaced process-global symbols; replaced the remote Space Grotesk loader with the official bundled variable font.
- verification: Focused authentication, local-secret, and visual-system tests passed (19 tests); lint and typecheck passed; full web Jest passed (91 suites, 629 tests); Vercel-equivalent build completed and produced `BUILD_ID`; a local 3200 credential exchange, callback, and session check all returned 200.
- next_action: Use `http://127.0.0.1:3200/auth/sign-in`, sign in with the disposable Phase 12 test account, then complete the already-defined qualifications browser journey.
