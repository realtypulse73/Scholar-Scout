---
quick_id: 260924-ftn
description: Allow safe local development registration without weakening Vercel production registration controls
files_modified:
  - apps/web/lib/server/request-ip.ts
  - apps/web/app/api/register/route.ts
  - apps/web/components/auth/AuthForm.tsx
  - apps/web/__tests__/lib/request-ip.test.ts
  - apps/web/__tests__/api/register.test.ts
  - apps/web/__tests__/components/auth/AuthForm.test.tsx
---

# Quick Task 260924-ftn

Permit registration during a developer's local `next dev` session when the Vercel-only IP and Upstash dependencies are intentionally absent, while every deployed, preview, and production execution continues to fail closed before an account write unless it has Vercel's trusted `x-vercel-forwarded-for` value and an atomic registration reservation. Do not modify Phase 12 planning artifacts, credential-authentication routes, or the generic rate-limit service.

## Implementation tasks

1. In `apps/web/lib/server/request-ip.ts`, keep `getTrustedRequestIp` unchanged as the Vercel-header-only parser. Add one small exported, server-only environment predicate for the registration route that accepts an injectable environment record for unit tests. It must return `true` only when `NODE_ENV` is exactly `development` and both `VERCEL` and `VERCEL_ENV` are absent/empty. It must return `false` for production, test, Preview, production Vercel, and any Vercel-marked process. The predicate must not accept request headers or any caller-supplied request value; local authorization is a runtime decision, not an IP decision.

2. In `apps/web/app/api/register/route.ts`, branch before trusted-IP/rate-limit resolution using that predicate. On the narrowly allowed local-development branch, retain the existing exact payload validation, `createUser` call, and server-derived `getAccountRoleForEmail` role; do not read `x-forwarded-for`, `forwarded`, or `x-vercel-forwarded-for`, and do not invoke the unavailable Upstash reservation. Everywhere else, preserve the current ordering: validate bounded payload, resolve only `getTrustedRequestIp`, reserve through `reserveRegistration`, then create the account only after an allowed atomic reservation. Keep 503 fail-closed responses for unavailable trusted IP or limiter and preserve the 429 retry contract.

3. In `apps/web/components/auth/AuthForm.tsx`, replace the registration boolean with a small parsed registration-result contract so the sign-up form can map known safe API codes to actionable copy: rate-limit responses include the supplied reset timestamp, and the unavailable registration code explains that registration is temporarily unavailable and can be retried. Keep malformed, unknown, and network failures on the current generic safe message. Never render a server-provided detail field, and do not change the subsequent credentials grant, NextAuth sign-in, or guest-migration flow.

4. Extend focused tests only in the existing suites:
   - `request-ip.test.ts`: table-test the local predicate for the sole allowed local environment and for `NODE_ENV=production`, `NODE_ENV=test`, `VERCEL=1`, `VERCEL_ENV=production`, and `VERCEL_ENV=preview`; retain direct assertions that a valid single `x-vercel-forwarded-for` is accepted and all client-controlled forwarded headers remain irrelevant.
   - `register.test.ts`: isolate and restore `process.env` per test. Prove a valid non-Vercel development registration succeeds with no Vercel header even when spoofed `x-forwarded-for`/`forwarded` headers are present, calls neither trusted-IP resolution nor the atomic limiter, and still passes the server-derived role to `createUser`. Prove Vercel production and Preview do not enter that branch: missing/untrusted trusted-IP resolution yields 503 with no write, and an unavailable atomic reservation yields 503 with no write. Preserve assertions that malformed payloads are rejected before either path, an allowed production reservation precedes creation, and a browser-supplied role is rejected.
   - `AuthForm.test.tsx`: add sign-up cases for malformed registration JSON, an unknown registration error code with hostile `detail` text, and a rejected registration `fetch`. Each must assert the fixed safe generic registration-failure copy, assert the hostile text is absent when supplied, and assert that neither a credentials request nor `signIn` continues after the failed registration. Also retain cases for 429 and 503 registration JSON bodies containing hostile `detail` text: assert accessible, fixed registration-specific guidance, no hostile text rendered, and no credentials endpoint or `signIn` call after registration fails. Retain the existing successful registration-to-credential grant behavior.

## Threat mitigations

| Threat | Mitigation and required proof |
|---|---|
| Forged forwarding headers bypass per-IP registration control | Vercel code continues to use only the single valid `x-vercel-forwarded-for` parser; the local exception consumes no forwarding header. Unit and route tests cover conflicting/spoofed headers. |
| A Preview or production deployment accidentally inherits the local bypass | The environment predicate requires exact development mode plus no `VERCEL` and no `VERCEL_ENV`; all Vercel, Preview, production, and test combinations are negative cases. |
| Rate-limit failure permits public account creation | Only the local predicate can avoid reservation. All other executions keep atomic reservation before `createUser`, and unavailable reservations return 503. |
| Privilege or credential-flow regression | Exact payload allow-listing and server-side role derivation remain in the route; tests continue rejecting a browser `role` and preserve the opaque credential grant flow. |
| Provider/internal error disclosure | The client maps only known registration codes to fixed copy and ignores arbitrary response detail; component tests inject hostile detail strings. |

## Verification

Run from the repository root:

1. `pnpm --filter @scholar-scout/web test --runInBand __tests__/lib/request-ip.test.ts __tests__/api/register.test.ts __tests__/components/auth/AuthForm.test.tsx`
2. `pnpm --filter @scholar-scout/web run typecheck`
3. `pnpm --filter @scholar-scout/web run lint`

Completion requires the focused tests to prove both the explicit local-only behavior and the unchanged Vercel fail-closed controls, with typecheck and lint passing.
