---
quick_id: 260924-ftn
verified: 2026-09-24T16:00:00Z
status: passed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification: false
---

# Quick Task 260924-ftn Verification Report

**Goal:** Allow safe local development registration without weakening Vercel production registration controls.

**Verified:** 2026-09-24T16:00:00Z  
**Status:** passed  
**Method:** Goal-backward inspection of the actual implementation and focused behavioral tests; the task summary was not used as evidence.

## Goal Achievement

| # | Observable truth | Status | Code and behavioral evidence |
| --- | --- | --- | --- |
| 1 | The bypass is available only to an explicitly server-derived plain local-development process. | VERIFIED | `isLocalDevelopmentRegistrationEnvironment` in `apps/web/lib/server/request-ip.ts:16-20` accepts only exact `NODE_ENV === 'development'` with empty/absent `VERCEL` and `VERCEL_ENV`. It accepts no request data. Its focused table test covers allowed local development plus production, test, `VERCEL=1`, Vercel production, and Vercel Preview rejections. |
| 2 | Local registration can create a valid account without Vercel/Upstash dependencies, while ignoring client forwarding headers. | VERIFIED | After exact payload validation, `apps/web/app/api/register/route.ts:31-56` skips trusted-IP and reservation only when the server predicate is true; `createUser` remains wired at lines 58-65 with `getAccountRoleForEmail`. The local route test sends spoofed `forwarded` and `x-forwarded-for` headers, no Vercel header, and proves neither trusted-IP resolution nor reservation is called. |
| 3 | Vercel Preview and production remain fail-closed before account creation when trusted IP or the atomic limiter is unavailable. | VERIFIED | Non-local execution resolves only `getTrustedRequestIp(request.headers)` (route lines 31-38), returns the fixed 503 before a write when IP/reservation is unavailable (lines 34-41 and 105-109), and handles denials with the preserved 429/reset/retry contract (lines 44-54). Focused route tests cover Vercel production and Preview for both unavailable boundaries and assert no write; the allowed-reservation test confirms reservation precedes creation. |
| 4 | No client-controlled forwarding header is trusted for the deployed reservation key. | VERIFIED | `getTrustedRequestIp` reads only the single `x-vercel-forwarded-for` value and rejects absent, multi-valued, or non-IP values (`request-ip.ts:26-33`). It has no `x-forwarded-for` or `forwarded` read. Its focused tests prove those client-controlled headers are irrelevant, and the route test proves a spoofed `x-forwarded-for` cannot choose the limiter key. |
| 5 | The browser exposes only fixed registration failure messages and retains the credential/guest-migration sequence after a successful registration. | VERIFIED | `AuthForm.tsx:43-52` stops before credential exchange on any failed registration. `readRegistrationResponse` returns only an object shell and `getRegistrationMessage` maps only the known 429 and 503 codes; no `detail` property is read or rendered (lines 194-214). Focused component tests exercise malformed JSON, unknown code, network rejection, known 429/503 bodies containing hostile detail, and assert no credential request or `signIn` follows a registration failure; the pre-existing successful registration-to-credential-grant flow still passes. |

**Score:** 5/5 truths verified.

## Required Artifacts and Wiring

| Artifact | Required function | Status | Evidence |
| --- | --- | --- | --- |
| `apps/web/lib/server/request-ip.ts` | Server-only Vercel parser and local runtime predicate | VERIFIED | Contains `import 'server-only'`; the predicate reads only its injected/default server environment and the parser remains Vercel-header-only. Imported and invoked by the registration route. |
| `apps/web/app/api/register/route.ts` | Exact validation, local exception, deployed reservation/write ordering | VERIFIED | Substantive route handler; predicate → non-local trusted IP → reservation → `createUser` wiring is direct and covered by route tests. |
| `apps/web/lib/server/rate-limit.ts` | Atomic registration reservation boundary | VERIFIED | `reserveRegistration` remains the deployed path; commit diff shows no change to this generic limiter module. |
| `apps/web/components/auth/AuthForm.tsx` | Safe registration-result handling and retained credential flow | VERIFIED | Form submits `/api/register`, maps known status/code pairs to fixed strings, returns before credentials on failure, and retains the existing grant/sign-in/migration wiring on success. |
| Focused request-IP, route, and component suites | Runtime proof of the critical branches | VERIFIED | The requested focused Jest command completed with exit code 0; the suites contain 32 focused cases spanning the required branches. |

## Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| Registration route | Local predicate | `isLocalDevelopmentRegistrationEnvironment()` before IP resolution | WIRED | The predicate has no request/header parameter; its result is the sole branch condition. |
| Registration route | Trusted Vercel IP parser | `getTrustedRequestIp(request.headers)` in non-local branch | WIRED | Only deployed/Preview/prod code reaches it; parser reads only `x-vercel-forwarded-for`. |
| Registration route | Atomic limiter | `await reserveRegistration(trustedIp.ip)` before `createUser` | WIRED | Unavailable and denied reservations return early; successful reservation is tested to precede account creation. |
| Registration route | Server role derivation | `getAccountRoleForEmail(parsed.value.email)` | WIRED | The exact payload allow-list excludes browser `role`; focused test verifies the derived role reaches `createUser`. |
| Auth form | Registration endpoint and credential flow | `registerAccount` then `exchangeCredentials` only on registration success | WIRED | Failed-registration tests prove the early return; successful sign-up test proves the retained downstream path. |

## Data-Flow Trace

| Artifact | Data source | Verification | Status |
| --- | --- | --- | --- |
| Registration route | Parsed request JSON and server `process.env` | Exact bounded payload is parsed before the environment gate; environment predicate accepts no request-derived data. | FLOWING |
| Registration limiter key | `getTrustedRequestIp` result | Non-local route passes only the validated Vercel-header IP into `reserveRegistration`; spoofed forwarded headers cannot alter it. | FLOWING |
| Auth-form error | Fixed local mapping of status/code/reset timestamp | Arbitrary response `detail` is not read. Malformed responses and fetch rejection select fixed generic text. | FLOWING |

## Behavioral Spot-Checks

| Check | Command | Result | Status |
| --- | --- | --- | --- |
| Local-only predicate, route fail-closure/order, and AuthForm safe error/flow behavior | `pnpm --filter @scholar-scout/web test --runInBand __tests__/lib/request-ip.test.ts __tests__/api/register.test.ts __tests__/components/auth/AuthForm.test.tsx` | Exit code 0; 32 focused cases exercised. | PASS |
| Type safety | `pnpm --filter @scholar-scout/web run typecheck` | Exit code 0. | PASS |
| Lint | `pnpm --filter @scholar-scout/web run lint` | Exit code 0. | PASS |

The commands reported only the pre-existing Node 24 engine warning while running under Node 20; no test, typecheck, or lint failure occurred.

## Requirements Coverage

This is a quick task with no separately declared requirement IDs. Its security and behavior contract is fully represented by the plan and verified above.

## Anti-Patterns Found

No blocker or warning anti-patterns were found in the implementation changes. The `return null` occurrences in the route are deliberate invalid-payload sentinels, and the `{}` returns in `AuthForm` are safe malformed-response fallbacks; neither is a user-visible stub. No `TBD`, `FIXME`, or `XXX` markers were introduced. The generic rate-limit service is unchanged.

## Human Verification Required

None. The runtime branch, ordering, cleanup/early-return behavior, and user-visible safe-error cases are directly exercised by focused tests.

---

_Verifier: gsd-verifier_  
_Report created without committing changes._
