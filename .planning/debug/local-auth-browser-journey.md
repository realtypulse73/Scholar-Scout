---
status: investigating
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

- hypothesis: The in-memory credential-grant map is not shared between the development route bundles that issue and consume the grant; the offline Google-font dependency prevents the production-mode workaround.
- next_action: Implement and verify a process-global, single-use grant store for the local Next.js route bundles; separately replace the build-time Google font fetch with a local, licensed Space Grotesk asset or document the required asset handoff.

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
