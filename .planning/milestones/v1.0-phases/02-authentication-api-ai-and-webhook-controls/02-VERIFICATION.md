---
phase: 02-authentication-api-ai-and-webhook-controls
verified: 2026-07-29T03:44:45Z
status: passed
score: 3/5 must-haves verified
behavior_unverified: 2
overrides_applied: 0
behavior_unverified_items:
  - truth: "A signed-in advisor user receives a bounded response, while malformed, oversized, or quota-exceeding requests are rejected before costly work."
    test: "In a Vercel Preview deployment with the managed Upstash integration enabled, submit a valid advisor request, then exceed the configured advisor window and submit malformed/oversized requests."
    expected: "A valid request is bounded; the quota excess returns reset-aware 429 without an OpenAI call; malformed/oversized input returns 400/413 without an OpenAI call; unavailable Redis returns 503."
    why_human: "The route and passing tests exercise ordering with mocks, but this verifier cannot inspect Vercel secrets or reserve against the live externally atomic Redis limiter."
  - truth: "Repeated login or registration attempts receive an asynchronous safe rate-limit response before account lookup/KDF or account creation."
    test: "In the same Preview deployment, issue six credential attempts and six registration attempts from one Vercel-derived client address; repeat after each configured window ends."
    expected: "The sixth request is reset-aware 429 before KDF/write activity, access resumes after reset, and missing/unreachable Redis produces 503 rather than an allow-by-default path."
    why_human: "Unit tests use a deterministic injected limiter; the configured Upstash provider and Vercel header behavior cannot be exercised from this sandbox."
human_verification:
  - test: "Preview advisor limiter"
    expected: "The managed limiter enforces the bounded advisor response and fail-closed 503/429 behavior before a provider call."
    why_human: "Requires Vercel Preview environment variables and an external Upstash reservation."
  - test: "Preview credential limiter"
    expected: "Login and registration limits are externally atomic, reset-aware, and happen before KDF/account writes."
    why_human: "Requires a Vercel request path and the external Upstash provider."
---

# Phase 2: Authentication, API, AI, and Webhook Controls Verification Report

**Phase Goal:** Students, staff, and integrations can use server APIs only within an authenticated, authorized, validated, and abuse-bounded scope.
**Verified:** 2026-07-29T03:44:45Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- |
| 1 | A signed-in student can access and change only their own account, shortlist, memory, simulation, referral, and engagement records, regardless of browser-supplied values. | ✓ VERIFIED | `resolveStudentActor` derives namespaced storage keys solely from the current session or a server-validated opaque guest cookie. The onboarding, shortlist, memory, simulation, analytics, referral, feed, share, and experiment routes pass only `actor.storageKey` to stores. Route tests cover forged keys, cross-user result filtering, validation-before-write, and guest/account isolation. |
| 2 | A staff member can use administrative operations only while active server-checked authorization remains valid; removed staff access is no longer accepted. | ✓ VERIFIED | `requireActiveStaff` reads the session and parses `SCHOLARSCOUT_STAFF_EMAILS` on every request; it does not consult JWT role claims. Admin routes and the two global-metrics pages call it before data/metric operations. `active-staff.test.ts` covers allowlist removal and malformed configuration; `decision-boundary.test.ts` proves denial precedes global metrics. |
| 3 | A signed-in advisor user receives a bounded response, while oversized, malformed, or rate-exceeding requests are safely rejected before unbounded provider cost. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `advisor-chat/route.ts` validates a <=8 KiB exact message, resolves an actor, reserves quota before context/OpenAI work, constrains model/output/timing, and returns fixed fallback/error contracts. `advisor-chat.test.ts` exercises malformed, denied, and unavailable ordering. The actual Vercel/Upstash reservation is not executable in this sandbox. |
| 4 | A GitHub webhook is rejected with a missing or invalid signature secret, and a qualifying webhook dispatches only a size-bounded bearer-authenticated agent request. | ✓ VERIFIED | The runner rejects absent secret and invalid HMAC before JSON parsing; it caps raw body at 64 KiB and job packet at 16 KiB, requires both endpoint and bearer token, and applies a 10 s abort. The Node service tests exercise missing/invalid secrets, oversized body, missing bearer token, and authenticated dispatch. |
| 5 | Repeated login or registration attempts receive a safe asynchronous rate-limit response without avoidable event-loop work. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `credentials/route.ts` reserves a trusted Vercel IP + normalized email before password verification; `register/route.ts` reserves before `createUser`; both fail closed to 503. Deterministic tests cover five/six boundaries and reset metadata. Live external atomicity and Preview environment configuration require human confirmation. |

**Score:** 3/5 truths verified (2 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `apps/web/lib/server/student-actor.ts` | Server-derived account/guest private actor | ✓ VERIFIED | Substantive server-only resolver; imports session, cookie, and hashed lifecycle boundaries; consumed by every Phase-02 private route. |
| `apps/web/lib/server/rate-limit.ts` | External atomic, fail-closed reservation seam | ✓ VERIFIED | Pinned Upstash client with no in-process fallback; typed allowed/denied/unavailable results and hashed provider keys. External provider behavior remains in Human Verification. |
| `apps/web/lib/api-request.ts` | Byte-bounded exact JSON parser | ✓ VERIFIED | Checks declared size, streams to a maximum, and returns typed non-sensitive parse failures; consumed by private mutation routes and credential/registration paths. |
| `apps/web/lib/server/active-staff.ts` | Revocable server-side staff authorization | ✓ VERIFIED | Fresh allowlist parse plus minimal audit event; wired before admin route and global-dashboard access. |
| `apps/web/app/api/advisor-chat/route.ts` | Bounded advisor boundary | ✓ VERIFIED | Validates input, obtains server actor/quota before context/provider, limits model/output/timeout, and uses an actor-scoped context. |
| `apps/web/app/api/auth/credentials/route.ts` and `apps/web/app/api/register/route.ts` | Pre-work credential and registration limits | ✓ VERIFIED | Exact bounded bodies, trusted IP only, reservation before KDF/account write, reset-aware 429, safe 503. |
| `services/codex-webhook-runner/src/server.mjs` | Fail-closed signed webhook and authenticated dispatch | ✓ VERIFIED | Raw-body HMAC check precedes parse; repository/action/label qualification and payload/job bounds precede external dispatch. |
| `apps/web/app/api/decisions/route.ts` | Disabled public global decision mutation | ✓ VERIFIED | Minimal 404 handler has no platform-store dependency; no public decision-engine path remains. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| Private account/engagement routes | `student-actor.ts` | `resolveStudentActor({ allowGuest: true })` | WIRED | Route audit found the expected actor resolver in onboarding, shortlist, memory, simulations, analytics, referrals, feed events, shares, A/B assignment, and advisor. |
| Student actor | persistence | `actor.storageKey` | WIRED | Direct route inspection shows caller-provided identity fields are rejected or ignored; storage calls use only the actor key. |
| Admin operations | `active-staff.ts` | `requireActiveStaff(...)` before reads/writes | WIRED | Programmes and all admin-data operations authorize first; ops/feed pages authorize before `getPlatformMetrics`. |
| Advisor route | atomic limiter / OpenAI | reserve → context → provider | WIRED | The code orders reservation before context and `fetch`; mocked route test asserts denied quota never reaches either downstream operation. |
| Credential / registration routes | trusted IP + limiter | trusted header → reserve → KDF/write | WIRED | `getTrustedRequestIp` ignores `x-forwarded-for`; tests prove no-write/no-lookup failure paths. |
| GitHub webhook | agent endpoint | HMAC → parse/qualify/bound packet → bearer dispatch | WIRED | Service test observes exact Authorization header, 16 KiB packet ceiling, and 10-second abort. |
| Public decisions route | platform decision engine | no import/call | WIRED (disabled) | `route.ts` returns 404 only; route test proves no metric/decision seam invocation. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| Private data routes | `actor.storageKey` | `getServerSession` or hashed opaque cookie lifecycle | Yes — server credentials only | ✓ FLOWING |
| Staff guard | allowlisted email / actor id | Current server session plus `SCHOLARSCOUT_STAFF_EMAILS` | Yes — evaluated per request | ✓ FLOWING |
| Advisor context | actor-scoped memory/recommendations | `buildAdvisorContext({ storageKey })` | Yes — server-side scoped store reads | ✓ FLOWING |
| Rate-limit result | reservation status/reset metadata | Vercel-managed Upstash REST integration | Cannot inspect live configuration from sandbox | ⚠️ EXTERNAL HUMAN CHECK |
| Webhook job packet | verified GitHub issue payload | HMAC-verified, qualified raw request | Yes — bounded/sanitized payload | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command / evidence | Result | Status |
| --- | --- | --- | --- |
| Full web regression suite | Final supplied Node 20.20.2 / pnpm 10.34.5 quality evidence | 38 suites / 221 tests passed | ✓ PASS |
| Web build | Final supplied Node 20.20.2 / pnpm 10.34.5 quality evidence | production build passed | ✓ PASS |
| Standalone services | Final supplied Node 20.20.2 / pnpm 10.34.5 quality evidence | service suites passed | ✓ PASS |
| Live Upstash reservation | Not run — requires protected Vercel Preview configuration | No live provider evidence available to verifier | ? SKIP → human verification |

### Probe Execution

Step 7c: SKIPPED — Phase 02 declares no repository probe script, and no `scripts/*/tests/probe-*.sh` target was found for this phase.

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| SEC-01 | 02-03, 02-04, 02-05, 02-12, 02-13 | Server-derived student ownership; no caller-supplied identity | ✓ SATISFIED | Actor, private-route, engagement-route, user-data-route, migration, and disabled-decision tests; direct route audit. |
| SEC-02 | 02-06, 02-07, 02-13 | Active, revocable staff authorization | ✓ SATISFIED | Current-allowlist guard wired before every audited privileged operation; denied-before-metrics and revoked-staff tests. |
| SEC-03 | 02-01, 02-02, 02-03, 02-08 | Bounded and abuse-limited AI advisor | ? NEEDS HUMAN | Code/test evidence proves contracts and ordering; live Upstash/Vercel configuration is not observable here. |
| SEC-04 | 02-09 | Fail-closed signed webhook and bounded authenticated dispatch | ✓ SATISFIED | Direct service implementation and Node service tests cover secret, signature, body/job bounds, bearer dispatch, and error paths. |
| SEC-05 | 02-01, 02-02, 02-10, 02-11 | Nonblocking login/registration rate limits | ? NEEDS HUMAN | External atomic-limiter path is wired and deterministic behavior is tested, but live provider behavior remains unexercised. |

No Phase-02 requirement is orphaned: every SEC-01 through SEC-05 identifier appears in at least one Phase-02 plan.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| — | — | No unreferenced `TBD`, `FIXME`, or `XXX` markers in Phase-02 implementation files. | ℹ️ Info | No debt-marker blocker found. |
| `apps/web/app/api/advisor-chat/route.ts` | 326 | User-facing “not available” 503 message | ℹ️ Info | Intentional safe failure contract, not a placeholder or stub. |

### Disconfirmation Pass

- **Partial-requirement search:** The initial source scan found legacy `userKey`/`referrer` fields still accepted by a few compatibility validators. They are not used as identity: routes derive ownership from `actor.storageKey`, and forged-key tests confirm the caller cannot select a different record.
- **Misleading-test search:** Most route tests inject/mocks the actor/store boundary. The direct actor lifecycle test exercises the actual session/cookie/data-store contract, and the source audit confirmed all in-scope private routes use that boundary. This is adequate for SEC-01 but does not replace a deployed Upstash check.
- **Uncovered-error-path search:** The live Redis connection/reservation failure path cannot be exercised without protected provider configuration. Code returns typed `unavailable` and route tests map it to 503, but deployment evidence is still required.

### Human Verification Required

### 1. Preview advisor limiter

**Test:** Use a Vercel Preview deployment with its managed Upstash integration configured. Send one valid advisor request, malformed/oversized requests, and enough valid requests to exhaust the quota.

**Expected:** The valid request is bounded; malformed/oversized bodies never call OpenAI; quota exhaustion returns reset-aware 429 before context/provider work; unavailable Redis returns 503.

**Why human:** The protected Vercel environment and external atomic provider are outside this sandbox.

### 2. Preview credential limiter

**Test:** From a single real client address, submit six credential attempts and six registration attempts, then repeat after the respective window reset.

**Expected:** The sixth request returns reset-aware 429 before password KDF/account creation; access resumes after reset; unavailable Redis produces 503.

**Why human:** Tests use an injected deterministic limiter, not the managed Upstash service.

### Gaps Summary

No code gap was found. The phase is not marked `passed` because two success criteria depend on a live Vercel/Upstash boundary that cannot be observed or invoked from this verification environment. This is an **Escalation Gate** for the developer: complete the two Preview checks above, record the result, then re-verify.

---

_Verified: 2026-07-29T03:44:45Z_
_Verifier: the agent (gsd-verifier)_
