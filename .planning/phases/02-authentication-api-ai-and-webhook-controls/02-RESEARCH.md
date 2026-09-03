# Phase 2: Authentication, API, AI, and Webhook Controls - Research

**Researched:** 2026-07-26  
**Domain:** Server-side identity, authorization, abuse controls, and bounded AI/integration endpoints  
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Student identity and guest migration
- **D-01:** Keep public discovery open, but use a distinct, opaque guest identity for a broad student-feature trial; never use a shared `local-student` fallback as identity.
- **D-02:** A guest trial lasts seven days. Staff actions and access to another student's private data remain unavailable throughout the trial.
- **D-03:** After sign-in, transfer eligible guest activity and relationships to the new account on the same device, then invalidate the guest credential.
- **D-04:** Preserve the full later roadmap after this initial security workup. Community interactions remain subject to Phase 5's privacy and moderation release controls.

#### Active staff authorization and privileged operations
- **D-05:** Re-check the configured staff-email allowlist on every privileged server request. JWT role claims are not sufficient authority.
- **D-06:** A removed staff member receives an immediate `403` from privileged routes but retains ordinary student access.
- **D-07:** Record minimal, non-sensitive metadata for successful and denied privileged operations: actor, action, route/outcome, and timestamp. Do not log request bodies or secrets.
- **D-08:** Missing or malformed staff configuration fails closed: no account is treated as staff and privileged routes expose only safe denial/configuration signals.

#### Advisor boundaries and spend controls
- **D-09:** Permit ten advisor messages per day for a guest and 25 per day for a signed-in student.
- **D-10:** Accept at most 3,000 characters of student input per advisor request. The server selects any additional profile, memory, or recommendation context; the browser cannot inject arbitrary context.
- **D-11:** Cap advisor output at roughly 1,000 tokens for detailed coaching.
- **D-12:** Quota exhaustion returns `429` with the reset time. Signing in during an active guest window does not bypass that day's guest usage limit.

#### GitHub webhook and agent dispatch controls
- **D-13:** When the webhook signature secret is missing or invalid, keep health checks observable but reject the webhook with `503` and perform no GitHub or agent call.
- **D-14:** Accept only configured Scholar Scout repository issue events (`opened` or `labeled`) bearing the approved `codex` or `automation` labels.
- **D-15:** Require a configured bearer token on outbound agent dispatches; do not dispatch when it is absent.
- **D-16:** Bound each webhook to a 64 KiB incoming body, a 16 KiB outbound job packet, and a 10-second agent-dispatch timeout.

#### Login and registration abuse controls
- **D-17:** Allow five sign-in attempts per email/IP pair every 15 minutes and five registrations per IP each hour. Exceeded limits return `429` with a retry time.
- **D-18:** Deliberately return detailed sign-in errors that distinguish an unknown account from an incorrect password. This is an accepted account-enumeration tradeoff; throttling remains mandatory.
- **D-19:** Retain local credentials but use non-blocking password verification so hostile bursts do not occupy the Node request event loop.
- **D-20:** Do not hard-lock accounts after failed sign-ins; the rolling limit expires automatically.

### the agent's Discretion
- Choose implementation details for opaque guest credential format, durable quota/rate-limit storage, request-schema helpers, and test fixture structure, provided they enforce every decision above and preserve the current Next.js, NextAuth, TypeScript, and Vercel foundation.

### Deferred Ideas (OUT OF SCOPE)
- Community relationship publishing, moderation, and author-safe representations remain in Phase 5. This phase may protect their existing server boundaries but must not silently ship unvalidated community capabilities.
- Explicit persisted staff-grant administration belongs with later administrative/data-operation correctness unless required solely to enforce the active allowlist policy.
- Background queues for deferred advisor replies are out of scope; quota exhaustion is an immediate `429` response.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|---|---|---|
| SEC-01 | Signed-in students may use only their own data; no caller-supplied identity is trusted. | Shared account/guest actor resolver, route inventory, migration boundary, and actor-scoped store calls. [VERIFIED: codebase grep] |
| SEC-02 | Staff operations require active, revocable server authorization. | Fresh session+allowlist guard and minimal audit event pattern. [VERIFIED: codebase grep] |
| SEC-03 | Advisor use is authenticated/validated and cost-bounded. | Byte/schema validation, atomic quota, server-only context, Responses cap/timeout/schema/fallback contract. [CITED: https://platform.openai.com/docs/api-reference/responses/create] |
| SEC-04 | Webhooks require a configured valid signature and bounded authenticated dispatch. | Raw-body HMAC verification, repository/event/label allowlist, payload limits, agent bearer and timeout. [CITED: https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries] |
| SEC-05 | Login/registration are rate-limited with safe non-blocking failures. | Atomic IP/email window limits before asynchronous credential verification. [CITED: https://nodejs.org/api/crypto.html] |
</phase_requirements>

## Project Constraints (from AGENTS.md)

- Retain Next.js 15, React 18, TypeScript, NextAuth, and Vercel; avoid platform churn. [VERIFIED: AGENTS.md]
- Preserve data safety through incremental, tested persistence boundaries; do not risk production data with a whole-document replacement. [VERIFIED: AGENTS.md]
- Preserve the existing in-progress school/community/WNY feature work rather than folding it into stabilization changes. [VERIFIED: AGENTS.md]
- Keep CI a reliable quality gate, use strict TypeScript, and run the web lint command for web changes. [VERIFIED: AGENTS.md]
- Keep route handlers to HTTP-method exports, authenticate/validate early, delegate reusable logic to `apps/web/lib/`, and keep server-only access under `apps/web/lib/server/`. [VERIFIED: AGENTS.md]
- Use named exports for domain/server modules, default exports for one React component, `@/` aliases in `apps/web`, and the established two-space/single-quote TypeScript style. [VERIFIED: AGENTS.md]

## Summary

Phase 2 should introduce one server-only actor boundary and route every student-owned operation through it. The current API inventory has a safe account/onboarding and shortlist pattern, but `memory`, simulations, analytics, referrals, feed events, shares, A/B assignment, and the advisor derive ownership from a caller-controlled `userKey`/`referrer` or a shared `local-student` fallback. Two public reads also return all analytics or referral records. [VERIFIED: codebase grep]

Use an opaque, HttpOnly, seven-day guest cookie backed by a server record and an `Actor` abstraction (`account` or `guest` with an internal storage key). A migration endpoint, called after successful sign-in on the same device, must transfer only the guest actor's eligible records, retain that day's guest quota binding, mark the guest record migrated, and clear the cookie. It must be idempotent and must never accept a guest ID from JSON. [ASSUMED]

Do not use the current JSON/HTTP/Blob whole-document adapter as a quota or rate-limit counter: its `read()` then overwrite `write()` contract has no conditional mutation, so concurrent serverless requests can pass a check before either write is visible. Vercel Blob is object storage, while an atomic external counter store is required for hard spend and authentication limits. [VERIFIED: codebase grep] [CITED: https://vercel.com/docs/vercel-blob]

**Primary recommendation:** Add shared server-only actor, request-validation, active-staff, and atomic rate-limit/quota modules first; then migrate every affected route and harden the advisor and webhook service around those guards.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| Guest/account identity and migration | API / Backend | Browser / Client | The server issues/verifies the cookie and performs ownership transfer; the client only initiates post-sign-in migration. [ASSUMED] |
| Student-owned API authorization | API / Backend | Database / Storage | The route derives actor identity before calling storage; storage uses that derived key. [VERIFIED: codebase grep] |
| Active staff authorization and audit | API / Backend | Database / Storage | Every privileged route must re-evaluate allowlist configuration and append minimal audit metadata. [VERIFIED: codebase grep] |
| Advisor input/context/quota/output controls | API / Backend | External API | Server validates, reserves quota, builds actor-scoped context, then calls OpenAI. [CITED: https://platform.openai.com/docs/api-reference/responses/create] |
| Login/registration throttling and credentials | API / Backend | Distributed rate-limit store | IP/email counters must be shared across Vercel instances; password derivation remains asynchronous server work. [CITED: https://upstash.com/docs/redis/sdks/ratelimit-ts/overview] |
| GitHub webhook acceptance and agent dispatch | API / Backend | External API | The standalone service must authenticate raw input before parsing and bound outbound calls. [CITED: https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries] |

## Current Route Inventory and Ownership Risks

| Endpoint | Current owner source | Risk / Phase-2 disposition |
|---|---|---|
| `/api/account/onboarding`, `/api/account/shortlist` | `getServerSession(...).user.id` | Preserve as the account baseline; add shared actor/validation only if guest trial reaches these capabilities. [VERIFIED: codebase grep] |
| `/api/admin/programmes` | JWT `session.user.role` | Replace with fresh active-staff guard and success/denial audit. [VERIFIED: codebase grep] |
| `/api/memory` | Query/body `userKey` or `local-student` | Replace with derived actor; reject supplied identity; permit guest only through actor cookie. [VERIFIED: codebase grep] |
| `/api/simulations/results` | Query/body `userKey` | Replace with derived actor; validate simulation ID and answer payload before storage. [VERIFIED: codebase grep] |
| `/api/referrals` | Body `referrer` or `local-student`; GET returns all | Replace with actor; scope GET to actor-owned referrals, not the full collection. [VERIFIED: codebase grep] |
| `/api/analytics/events` | Optional body `userKey`; GET returns all | Derive actor for writes; remove/protect global GET because it exposes all events. [VERIFIED: codebase grep] |
| `/api/feed-events`, `/api/share`, `/api/ab-testing/assign` | Body `userKey` or shared fallback | Derive actor; validate finite event/target/experiment values and cap data sizes. [VERIFIED: codebase grep] |
| `/api/advisor-chat` | Body `userKey`, browser context, shared fallback | Replace entirely with actor-only schema, durable quota, capped server context, and bounded Responses call. [VERIFIED: codebase grep] |
| `/api/campus-notes`, `/api/peer-connections` | Session user ID for write; public reads where designed | Preserve their existing route purpose, add shared request limits only when required to protect existing server boundaries; do not ship Phase-5 community features. [VERIFIED: codebase grep] |
| `/api/feed`, `/api/decisions` | No actor | Public feed is discovery; assess whether the public decision-writing GET should remain exposed, and do not add identityless writes. [VERIFIED: codebase grep] |
| `/api/register`, credentials callback | No rate-limit guard; `scryptSync` | Apply pre-verification atomic limits and replace sync KDF with async `scrypt`. [VERIFIED: codebase grep] |

## Standard Stack

### Core

| Library / platform | Version | Purpose | Why Standard |
|---|---|---|---|
| Next.js route handlers + `next-auth` | Existing Next 15.5.15 / NextAuth 4.24.14 | Server-derived session at API boundaries. | Existing app foundation; `getServerSession(authOptions)` is already used by protected routes. [VERIFIED: codebase grep] |
| Node `node:crypto` | Node 20 project baseline | Guest secrets/HMAC and non-blocking password derivation. | `crypto.scrypt` offers an asynchronous memory-hard derivation API; retain `timingSafeEqual`. [CITED: https://nodejs.org/api/crypto.html] |
| Direct OpenAI Responses REST API | Existing integration | Single-turn advisor request with bounded output and strict structured reply. | Locked AI-SPEC explicitly retains native `fetch`, no agent framework, no streaming, and no tools. [VERIFIED: 02-AI-SPEC.md] |
| `@upstash/redis` [WARNING: flagged as suspicious — verify before using.] | Registry version unavailable in this environment | Atomic shared counter backing. | Official vendor docs document HTTP/serverless use; the project needs atomic distributed state beyond Blob's object operations. [CITED: https://upstash.com/docs/redis/sdks/ratelimit-ts/overview] |
| `@upstash/ratelimit` [WARNING: flagged as suspicious — verify before using.] | Registry version unavailable in this environment | Fixed-window daily quota and rolling login/registration windows. | Vendor API returns `success`, remaining capacity, and reset time for keyed counters. [CITED: https://upstash.com/docs/redis/sdks/ratelimit-ts/methods] |

### Supporting

| Component | Purpose | When to Use |
|---|---|---|
| Server-only `student-actor.ts` | Resolves account session or trusted guest cookie into a private storage key. | Every route that owns/changes student data or needs a quota identity. [ASSUMED] |
| Server-only `active-staff.ts` | Checks session user, normalized current email, strict allowlist configuration, and writes an audit event. | Every privileged request, including GET. [ASSUMED] |
| Shared runtime validators | Bounded body reader plus exact object/field validators. | Before any store, quota, or provider call. [ASSUMED] |
| Server-only `rate-limit.ts` | Namespaced limiters and safe reset-to-`Retry-After` conversion. | Advisor, registration, and credentials authorization. [ASSUMED] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|---|---|---|
| External atomic counter store | Whole-document JSON/HTTP/Blob persistence | Current adapter writes replace the entire document without an atomic increment/conditional write; it cannot prove concurrent quota enforcement. [VERIFIED: codebase grep] |
| Application quota counters | Vercel WAF rules | WAF can add network protection, but it does not supply the actor-specific guest/account daily reservation and carry-over contract required here. [CITED: https://vercel.com/kb/guide/add-rate-limiting-vercel] |
| Async Node `scrypt` | `scryptSync` | Sync derivation blocks the request event loop; async still uses bounded worker-pool work and must follow the rate-limit gate. [CITED: https://nodejs.org/api/crypto.html] |

**Installation (only after human checkpoint):**

```bash
pnpm --filter @scholar-scout/web add @upstash/redis@1.38.0 @upstash/ratelimit@2.0.8
```

**Version verification:** The approved dependency contract is `@upstash/redis@1.38.0` plus `@upstash/ratelimit@2.0.8`. The Plan-01 blocking checkpoint must record the exact npm `dist.integrity`, publisher, repository, lifecycle-script review, review date, and reviewer for those releases; Plan 02 installs those exact versions and commits the matching lockfile integrity. The same checkpoint requires a maintainer-owned Upstash Redis database and server-only REST URL/token in Vercel Preview and Production before production verification. [RESOLVED: npm package pages and deployment contract]

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---|---|---:|---:|---|---|---|
| `@upstash/redis` | npm | unavailable | unavailable | official Upstash docs identify the package | SUS | Flagged — human must verify registry metadata, source repository, and `postinstall` before install. [CITED: https://upstash.com/docs/redis/sdks/ratelimit-ts/overview] |
| `@upstash/ratelimit` | npm | unavailable | unavailable | official Upstash docs identify the package | SUS | Flagged — human must verify registry metadata, source repository, and `postinstall` before install. [CITED: https://upstash.com/docs/redis/sdks/ratelimit-ts/features] |

**Packages removed due to [SLOP] verdict:** none.  
**Packages flagged as suspicious [SUS]:** `@upstash/redis`, `@upstash/ratelimit`; planner must insert `checkpoint:human-verify` before installation. [VERIFIED: package-legitimacy seam]

## Approved Counter Provider Contract

The preliminary registry entries above remain `SUS` until the mandatory human review, but the selected implementation target is fixed: one maintainer-provisioned Upstash Redis REST database with `@upstash/redis@1.38.0` and `@upstash/ratelimit@2.0.8`. The checkpoint must record the immutable registry integrity and source evidence before those exact versions enter `pnpm-lock.yaml`. Deployment is blocked until the database owner/region and Vercel Preview/Production server-only REST URL/token configuration are recorded. The runtime has no permissive fallback: absent configuration or provider failure returns 503 before protected work. [RESOLVED]

## Architecture Patterns

### System Architecture Diagram

```text
Browser request
  |-- public discovery ------------------------------> public read route
  |-- student feature --> account session OR HttpOnly guest cookie
                              |
                              v
                    resolveStudentActor (no JSON identity)
                              |
                 +------------+------------+
                 |                         |
                 v                         v
        exact bounded body           actor-scoped store call
                 |                         |
                 +------------+------------+
                              v
                   atomic shared limiter / quota
                              |
          +-------------------+------------------------+
          |                    |                        |
          v                    v                        v
    route response       advisor context builder   active staff guard
                              |                        |
                              v                        v
                   bounded OpenAI Responses       minimal audit event

GitHub --> raw 64 KiB body --> secret present + HMAC --> repo/event/label check
                                                      |-- rejected: no side effects
                                                      '-- 16 KiB packet --> authenticated 10 s agent dispatch
```

### Recommended Project Structure

```text
apps/web/
├── app/api/account/guest-migration/route.ts    # same-device, session-bound migration
├── lib/api-request.ts                           # bounded parsing and route validators
├── lib/advisor-contract.ts                      # advisor constants/request/reply validators
└── lib/server/
    ├── student-actor.ts                         # account/guest resolver and cookie lifecycle
    ├── active-staff.ts                          # fresh server allowlist authorization/audit
    ├── rate-limit.ts                            # atomic quota/rate-limit adapters
    ├── advisor-context.ts                       # capped actor-scoped context
    └── data-store.ts                            # guest metadata, migration, audit support, async scrypt
services/codex-webhook-runner/
└── test/server.test.mjs                         # real HTTP regression coverage (Wave 0)
```

### Pattern 1: Derive actor before parsing business input

**What:** Resolve account/guest identity only from an authenticated session or HttpOnly cookie. Reject `userKey`, `userId`, `referrer`, `context`, history, and unknown keys rather than copying them into a storage or provider call. [VERIFIED: 02-AI-SPEC.md]

**When to use:** Every existing user-keyed route, including read paths that currently accept query parameters. [VERIFIED: codebase grep]

```ts
// Source: Phase 2 AI-SPEC and current account-route getServerSession pattern
const actor = await requireStudentActor(request);
const input = await parseExactJsonBody(request, parseSimulationInput);
if (!actor || !input) return invalidActorOrRequestResponse();

return NextResponse.json(
  await saveSimulationResult({
    userKey: actor.storageKey,
    simulationId: input.simulationId,
    answers: input.answers,
  }),
);
```

### Pattern 2: Cookie-backed guest record with idempotent migration

**What:** Set a random 256-bit cookie secret (`HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, seven-day `Max-Age`); store only an HMAC/hash lookup and lifecycle metadata server-side. Internal records use a namespaced guest storage key, never `local-student`. After sign-in, a session-bound migration looks up that cookie, transfers an explicit eligible-field allowlist, records the guest quota carry-over for the current UTC day, marks the guest record migrated, and clears the cookie. [ASSUMED]

**When to use:** The broad guest trial only; never for staff authorization or cross-user lookup. [VERIFIED: 02-CONTEXT.md]

**Anti-pattern:** A self-contained signed JWT guest cookie alone cannot be reliably invalidated after migration without server-side revocation state. [ASSUMED]

### Pattern 3: Atomic reservation before expensive work

**What:** Use a fixed UTC-day key for advisor reservations and rolling/fixed window keys for sign-in/registration. On denial, return `429`, `Retry-After`, and `resetAt`; do not read context, call `scrypt`, or call OpenAI. [CITED: https://upstash.com/docs/redis/sdks/ratelimit-ts/methods]

**Key design:** `advisor:guest:{guestIdHash}:{yyyy-mm-dd}` holds the guest window. A migrated account retains a server-side binding to that key through its reset date, so the account route still consumes/checks the guest allowance for the active day; beginning the next UTC day it uses `advisor:account:{accountId}:{yyyy-mm-dd}` at 25. [ASSUMED]

**Fail policy:** For advisor, credential, and registration limits, a missing counter configuration or counter-store error must reject safely (`503`) rather than invoke an expensive operation. Do not accept the vendor library's default timeout-to-allow behavior for these controls. [CITED: https://upstash.com/docs/redis/sdks/ratelimit-ts/features]

### Pattern 4: Fresh staff guard plus minimal audit

**What:** `requireActiveStaff()` must call `getServerSession(authOptions)`, require a current user ID/email, parse a nonempty comma-separated allowlist in a strict fail-closed manner, match the normalized email each request, and append a minimal allowed/denied audit event. It must not consult `session.user.role` as authority. [VERIFIED: 02-CONTEXT.md]

**Audit shape:** actor identifier/hash, action name, route, allow/deny outcome, and timestamp only; do not store bodies, email, cookies, tokens, or programme content. [VERIFIED: 02-CONTEXT.md]

### Pattern 5: Bounded non-streaming advisor

**What:** Read a byte-limited body, accept exactly a trimmed `message` of 1--3,000 characters, reserve quota, fetch only actor-scoped memory/recommendations, keep at most three programmes and a fixed context character/token budget, then make one non-streaming Responses call. Set an allowlisted model, `max_output_tokens: 1000`, a ten-second abort, strict JSON schema, and runtime validation of a nonempty `message` no longer than 8,000 characters. One schema retry is the maximum; provider/error/timeout/schema failure returns the fixed fallback without provider details. [VERIFIED: 02-AI-SPEC.md]

### Pattern 6: Raw-body webhook gate

**What:** Reject a missing `GITHUB_WEBHOOK_SECRET` with `503` after retaining `/health`; enforce 64 KiB while streaming the raw bytes; require the signature header to be the expected length/prefix before `timingSafeEqual`; parse JSON only after HMAC validation; allow only the configured repository, `issues`, `opened`/`labeled`, and approved labels. [VERIFIED: 02-CONTEXT.md] [CITED: https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries]

**Outbound:** Strip and bound selected issue fields to a UTF-8 16 KiB packet, require `CODEX_AGENT_BEARER_TOKEN`, use `Authorization: Bearer`, pass `AbortSignal.timeout(10_000)`, and avoid GitHub/agent calls on every rejected/ignored delivery. [VERIFIED: 02-CONTEXT.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Distributed atomic limits | Read-modify-write counters in `ScholarScoutData` or a process-local `Map` | Atomic serverless Redis rate-limit primitive, behind a small project adapter. [CITED: https://upstash.com/docs/redis/sdks/ratelimit-ts/overview] | Process memory is per instance and current adapters overwrite whole documents. [VERIFIED: codebase grep] |
| Password derivation | Custom hash/cipher or synchronous KDF call | Async `crypto.scrypt` plus unique salt and `timingSafeEqual`. [CITED: https://nodejs.org/api/crypto.html] | Password derivation is intentionally expensive and sync work blocks Node request processing. [CITED: https://nodejs.org/api/crypto.html] |
| Webhook validation | Parsed-JSON signing or `===` comparison | HMAC-SHA256 over raw bytes plus constant-time comparison. [CITED: https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries] | Parsing/re-serialization changes signed data and ordinary equality can leak comparison timing. [CITED: https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries] |
| Advisor output safety | Prompt-only JSON/length promises | Responses JSON Schema plus runtime validation and deterministic fallback. [CITED: https://platform.openai.com/docs/guides/structured-outputs] | Format controls do not replace server validation or failure handling. [VERIFIED: 02-AI-SPEC.md] |

## Common Pitfalls

### Pitfall 1: Retaining `local-student` as a compatibility fallback

**What goes wrong:** Unrelated visitors share one private storage identity and can read/change each other's trial data. [VERIFIED: codebase grep]

**How to avoid:** Remove all default user keys; only an account actor or fresh opaque guest actor can reach user-owned stores. [VERIFIED: 02-CONTEXT.md]

### Pitfall 2: Authorizing staff from JWT role

**What goes wrong:** A JWT minted before allowlist removal continues to contain `staff`. [VERIFIED: codebase grep]

**How to avoid:** Treat role as display-only; re-check current configuration on every privileged request and return `403` after removal. [VERIFIED: 02-CONTEXT.md]

### Pitfall 3: Quota after context/provider work

**What goes wrong:** Concurrent requests or large browser payloads create cost before the quota detects it. [VERIFIED: 02-AI-SPEC.md]

**How to avoid:** Bound raw bytes and exact schema, then atomically reserve before store reads/OpenAI. [VERIFIED: 02-AI-SPEC.md]

### Pitfall 4: Treating a 3,000-character rule as a body-size cap

**What goes wrong:** A huge unknown field can consume memory or parsing time while `message` itself is short. [VERIFIED: 02-AI-SPEC.md]

**How to avoid:** Check `Content-Length` when supplied and enforce an actual streamed byte cap before JSON parse; reject unknown keys. [VERIFIED: 02-AI-SPEC.md]

### Pitfall 5: Missing webhook secret fails open

**What goes wrong:** The current runner logs a warning and returns successful signature verification, enabling unauthenticated side effects. [VERIFIED: codebase grep]

**How to avoid:** Return `503` for webhook POST when the secret is absent and leave only `/health` observable. [VERIFIED: 02-CONTEXT.md]

### Pitfall 6: Synchronous password verification after only a client-side check

**What goes wrong:** A hostile burst can drive `scryptSync` on the Node event loop. [VERIFIED: codebase grep]

**How to avoid:** Rate-limit server-side before lookup/KDF and await promisified `scrypt`; never lock accounts. [CITED: https://nodejs.org/api/crypto.html]

## Code Examples

### Asynchronous credential verification

```ts
// Source: Node crypto documentation; adapt the existing salt:hash format.
import { scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

async function verifyPasswordAsync(password: string, storedHash: string): Promise<boolean> {
  const [salt, expectedHex] = storedHash.split(':');
  if (!salt || !expectedHex) return false;

  const candidate = Buffer.from(await scryptAsync(password, salt, 64));
  const expected = Buffer.from(expectedHex, 'hex');
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}
```

### Advisor Responses request boundary

```ts
// Source: 02-AI-SPEC.md and OpenAI Responses structured-output guidance.
const response = await fetch('https://api.openai.com/v1/responses', {
  method: 'POST',
  signal: AbortSignal.timeout(10_000),
  headers: {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: allowlistedModel,
    max_output_tokens: 1_000,
    instructions: SERVER_OWNED_ADVISOR_INSTRUCTIONS,
    input: [{ role: 'user', content: validated.message }],
    text: { format: ADVISOR_REPLY_JSON_SCHEMA },
  }),
});
```

### Raw webhook verification guard

```js
// Source: GitHub webhook-validation documentation.
function verifySignature(rawBody, header, secret) {
  if (!secret || !header?.startsWith('sha256=')) return false;
  const expected = `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`;
  const actual = Buffer.from(header);
  const expectedBuffer = Buffer.from(expected);
  return actual.length === expectedBuffer.length && crypto.timingSafeEqual(actual, expectedBuffer);
}
```

## State of the Art

| Old approach | Current Phase-2 approach | Impact |
|---|---|---|
| Caller sends `userKey` / shared local fallback. | Server session or opaque guest cookie resolves one actor. [VERIFIED: 02-CONTEXT.md] | Prevents trivial cross-student access. |
| JWT role claim controls admin access. | Live allowlist is re-checked every privileged request. [VERIFIED: 02-CONTEXT.md] | Staff removal takes effect immediately. |
| Prompt/220-token response with browser context. | Bounded raw request, server context, atomic quota, 1,000-token cap, schema/fallback. [VERIFIED: 02-AI-SPEC.md] | Bounds cost, context disclosure, and malformed output. |
| Webhook secret omission succeeds. | Missing/invalid secret is `503` with no side effects. [VERIFIED: 02-CONTEXT.md] | Fails closed. |
| `scryptSync` in credentials flow. | Async `scrypt` after server rate reservation. [CITED: https://nodejs.org/api/crypto.html] | Avoids blocking the request event loop. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| A1 | A hash-backed HttpOnly random guest cookie plus a migration record is the appropriate opaque credential format for the supported adapters. | Architecture Pattern 2 | Cookie/migration implementation could fail to invalidate or scope guest state. |
| A2 | A migrated account should remain bound to its guest quota key through that guest UTC-day reset. | Architecture Pattern 3 | Sign-in could bypass D-12 or be stricter than intended. |
| A3 | A strict parser should reject unknown fields on security-sensitive routes. | Architecture Patterns | Existing clients may need coordinated payload updates. |
| A4 | Vercel/Upstash credentials will be provisioned before production deployment. | Environment Availability | Limits must fail closed until configured. |

## Resolved Questions

1. **Credential failure detail through NextAuth v4 - RESOLVED**
   - Evidence: The installed NextAuth v4 Credentials callback returns a generic `CredentialsSignin` failure when `authorize()` returns null; it owns neither a programmable 429 response nor safe per-failure public detail. [VERIFIED: `apps/web/node_modules/next-auth/core/routes/callback.js`]
   - Contract: Add POST `/api/auth/credentials` as the supported rate-limit-aware HTTP boundary. It derives the trusted Vercel IP, reserves before lookup/KDF, returns 429 with `Retry-After`/reset or 503 before costly work, and returns only fixed `UNKNOWN_ACCOUNT` or `INCORRECT_PASSWORD` 401 codes. A successful check issues an opaque one-use short-lived server grant; NextAuth v4 Credentials atomically consumes that grant only to establish its JWT session. AuthForm maps only those fixed codes and never reflects raw exception text. [RESOLVED: installed v4 callback behavior and Plan 10/11 contract]

2. **Production atomic counter provider - RESOLVED**
   - Contract: Scholar Scout uses one Upstash Redis REST database provisioned by the maintainer, with `@upstash/redis@1.38.0` and `@upstash/ratelimit@2.0.8`. Plan 01 records registry provenance/integrity for both fixed releases and completes database ownership/region plus Vercel Preview/Production server-only `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` provisioning. Plan 02 installs precisely those releases; missing credentials or a provider failure remains a 503 fail-closed outcome. [RESOLVED: npm package pages, Vercel deployment contract, and Plan 01/02]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|---|---|---|---|---|
| Node.js 20.x | Supported web/service validation | ✗ | Available runtime is Node 24.14.0 | Use the project-pinned Node 20 toolchain before execution. [VERIFIED: environment probe] |
| pnpm 10.34.5/Corepack | Supported workspace validation/install | ✗ | Available pnpm is 11.9.0 | Use pinned Corepack pnpm 10.34.5. [VERIFIED: environment probe] |
| Upstash REST credentials | Distributed quotas/rate limits | ✗ | — | No safe production fallback; reject bounded operations with safe `503` until configured. [VERIFIED: environment probe] |
| OpenAI API key | Live advisor | ✗ | — | Deterministic safe fallback remains available; tests mock `fetch`. [VERIFIED: environment probe] |
| GitHub webhook and agent secrets | Live webhook dispatch | ✗ | — | Health stays observable; webhook must reject safely. [VERIFIED: environment probe] |

**Missing dependencies with no fallback:** supported Node/pnpm and a configured atomic counter service for enforcing production limits.  
**Missing dependencies with fallback:** OpenAI key (safe advisor fallback) and webhook/agent secrets (health only, fail closed). [VERIFIED: 02-CONTEXT.md]

## Validation Architecture

### Test Framework

| Property | Value |
|---|---|
| Framework | Jest 30.3.0 with `next/jest`; Node built-in test runner for standalone services. [VERIFIED: apps/web/package.json] |
| Config file | `apps/web/jest.config.ts`; no webhook-runner test configuration currently exists. [VERIFIED: codebase grep] |
| Quick run command | `pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/api/advisor-chat.test.ts __tests__/api/auth-controls.test.ts` [VERIFIED: 02-AI-SPEC.md] |
| Full suite command | `pnpm --filter @scholar-scout/web test --runInBand` plus `node --test services/codex-webhook-runner/test/server.test.mjs`. [ASSUMED] |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|---|---|---|---|---|
| SEC-01 | Every user-keyed route ignores/rejects caller identity; account and guest cannot cross-read/write; migration is idempotent/invalidate-once. | Route + store integration | Jest API suite | ❌ Wave 0 |
| SEC-02 | Valid staff allowed, removed/missing/malformed allowlist denied, all outcomes minimally audited. | Route + unit | Jest API/lib suite | ❌ Wave 0 |
| SEC-03 | 0/1/3,000/3,001 message bounds; byte cap; 10/11 and 25/26 limits; migration carry-over; provider payload/output/fallback. | Route + unit | Jest advisor suite | ❌ Wave 0 |
| SEC-04 | Missing/invalid signature yields `503`; raw HMAC, size, repository/event/label allowlist, packet/bearer/timeout are enforced. | Real HTTP service integration | `node --test` | ❌ Wave 0 |
| SEC-05 | Five/six sign-in email/IP and registration IP attempts; reset response; no synchronous KDF. | Auth/helper + route integration | Jest API/lib suite | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** focused Jest or `node --test` command for the edited boundary. [ASSUMED]
- **Per wave merge:** web Jest full suite and webhook-runner service suite. [ASSUMED]
- **Phase gate:** Full suite green under Node 20/pnpm 10.34.5; advisor fixture uses mocked provider only in PR CI. [VERIFIED: 02-AI-SPEC.md]

### Wave 0 Gaps

- [ ] `apps/web/__tests__/api/auth-controls.test.ts` — actor/guest migration, active staff, registration/credential limit contracts.
- [ ] `apps/web/__tests__/api/advisor-chat.test.ts` and `apps/web/__tests__/lib/advisor-guardrails.test.ts` — locked advisor boundaries and provider mocks.
- [ ] `apps/web/__tests__/fixtures/advisor-eval-cases.ts` — 14 synthetic, non-production advisor cases required by AI-SPEC.
- [ ] `services/codex-webhook-runner/test/server.test.mjs` and exportable/create-server boundary — real HTTP service regression tests.
- [ ] Store/limiter fakes with deterministic clock/reset values; no live Redis/OpenAI/GitHub in CI.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V2 Authentication | yes | Server session or opaque guest credential; async local-password verification; throttling. [VERIFIED: 02-CONTEXT.md] |
| V3 Session Management | yes | HttpOnly/Secure/SameSite guest cookie, seven-day expiry, server invalidation on migration. [ASSUMED] |
| V4 Access Control | yes | Derived actor for all student data and fresh allowlist guard for staff. [VERIFIED: 02-CONTEXT.md] |
| V5 Input Validation | yes | Body byte caps, exact schemas, finite enums, URL/query validation, webhook size bounds. [VERIFIED: 02-AI-SPEC.md] |
| V6 Cryptography | yes | Node HMAC/SHA-256, async `scrypt`, random secret, constant-time compare; never custom cryptography. [CITED: https://nodejs.org/api/crypto.html] |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---|---|---|
| Browser identity substitution | Spoofing / Information disclosure | Derive actor server-side and reject user identity fields. [VERIFIED: 02-CONTEXT.md] |
| Stale staff privilege | Elevation of privilege | Current allowlist check on every privileged request. [VERIFIED: 02-CONTEXT.md] |
| Concurrent advisor overspend | Denial of service / Tampering | Atomic reservation before OpenAI call and fixed output cap. [VERIFIED: 02-AI-SPEC.md] |
| Prompt/context injection | Information disclosure | Exact `{ message }` input and server-selected capped context only. [VERIFIED: 02-AI-SPEC.md] |
| Forged/oversized webhook | Spoofing / Denial of service | Raw body HMAC before parse, 64 KiB cap, repository/event/label allowlist. [CITED: https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries] |
| Credential-stuffing burst | Denial of service | Email/IP and IP rate limits before async KDF; rolling expiry rather than account lock. [VERIFIED: 02-CONTEXT.md] |

## Sources

### Primary (HIGH confidence)

- Current Scholar Scout source: `apps/web/app/api/**`, `apps/web/auth.ts`, `apps/web/lib/server/data-store.ts`, `apps/web/lib/server/platform-store.ts`, and `services/codex-webhook-runner/src/server.mjs` — present route behavior and data-adapter constraints. [VERIFIED: codebase grep]
- `02-CONTEXT.md` and `02-AI-SPEC.md` — locked phase policy and advisor contract. [VERIFIED: phase artifacts]

### Secondary (MEDIUM confidence)

- [GitHub webhook delivery validation](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries) — raw payload HMAC-SHA256 and constant-time comparison.
- [GitHub webhook events and payloads](https://docs.github.com/en/webhooks/webhook-events-and-payloads) — relevant delivery headers and payload-size monitoring.
- [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses/create) and [Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs) — response parameters and JSON schema format.
- [Node crypto](https://nodejs.org/api/crypto.html) — async `scrypt`, salts, and timing-safe comparison.
- [Vercel Blob](https://vercel.com/docs/vercel-blob) — object-storage operations and limits.
- [Upstash Ratelimit overview](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview), [methods](https://upstash.com/docs/redis/sdks/ratelimit-ts/methods), and [features](https://upstash.com/docs/redis/sdks/ratelimit-ts/features) — serverless keyed counters and reset metadata.

### Tertiary (LOW confidence)

- None; implementation-shape assumptions are isolated in the Assumptions Log.

## Metadata

**Confidence breakdown:**

- Standard stack: MEDIUM — current project stack is verified; external counter-package registry metadata could not be verified in the available runtime.
- Architecture: MEDIUM — code and locked decisions establish the boundaries; guest migration and provider choice need implementation confirmation.
- Pitfalls: HIGH — directly evidenced by current routes, AI-SPEC, and GitHub/Node documentation.

**Research date:** 2026-07-26  
**Valid until:** 2026-08-02 for provider/package guidance; locked context remains authoritative until changed.
