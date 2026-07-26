# Phase 2: Authentication, API, AI, and Webhook Controls - Context

**Gathered:** 2026-07-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Protect Scholar Scout's student-data, privileged-action, paid-AI, webhook, and credential boundaries through server-derived identity, current authorization, validation, quotas, and non-blocking abuse controls. This phase hardens existing routes and services; it does not expand the product surface, replace persistence, or implement the separately scoped community release slice.

</domain>

<decisions>
## Implementation Decisions

### Student identity and guest migration
- **D-01:** Keep public discovery open, but use a distinct, opaque guest identity for a broad student-feature trial; never use a shared `local-student` fallback as identity.
- **D-02:** A guest trial lasts seven days. Staff actions and access to another student's private data remain unavailable throughout the trial.
- **D-03:** After sign-in, transfer eligible guest activity and relationships to the new account on the same device, then invalidate the guest credential.
- **D-04:** Preserve the full later roadmap after this initial security workup. Community interactions remain subject to Phase 5's privacy and moderation release controls.

### Active staff authorization and privileged operations
- **D-05:** Re-check the configured staff-email allowlist on every privileged server request. JWT role claims are not sufficient authority.
- **D-06:** A removed staff member receives an immediate `403` from privileged routes but retains ordinary student access.
- **D-07:** Record minimal, non-sensitive metadata for successful and denied privileged operations: actor, action, route/outcome, and timestamp. Do not log request bodies or secrets.
- **D-08:** Missing or malformed staff configuration fails closed: no account is treated as staff and privileged routes expose only safe denial/configuration signals.

### Advisor boundaries and spend controls
- **D-09:** Permit ten advisor messages per day for a guest and 25 per day for a signed-in student.
- **D-10:** Accept at most 3,000 characters of student input per advisor request. The server selects any additional profile, memory, or recommendation context; the browser cannot inject arbitrary context.
- **D-11:** Cap advisor output at roughly 1,000 tokens for detailed coaching.
- **D-12:** Quota exhaustion returns `429` with the reset time. Signing in during an active guest window does not bypass that day's guest usage limit.

### GitHub webhook and agent dispatch controls
- **D-13:** When the webhook signature secret is missing or invalid, keep health checks observable but reject the webhook with `503` and perform no GitHub or agent call.
- **D-14:** Accept only configured Scholar Scout repository issue events (`opened` or `labeled`) bearing the approved `codex` or `automation` labels.
- **D-15:** Require a configured bearer token on outbound agent dispatches; do not dispatch when it is absent.
- **D-16:** Bound each webhook to a 64 KiB incoming body, a 16 KiB outbound job packet, and a 10-second agent-dispatch timeout.

### Login and registration abuse controls
- **D-17:** Allow five sign-in attempts per email/IP pair every 15 minutes and five registrations per IP each hour. Exceeded limits return `429` with a retry time.
- **D-18:** Deliberately return detailed sign-in errors that distinguish an unknown account from an incorrect password. This is an accepted account-enumeration tradeoff; throttling remains mandatory.
- **D-19:** Retain local credentials but use non-blocking password verification so hostile bursts do not occupy the Node request event loop.
- **D-20:** Do not hard-lock accounts after failed sign-ins; the rolling limit expires automatically.

### the agent's Discretion
- Choose implementation details for opaque guest credential format, durable quota/rate-limit storage, request-schema helpers, and test fixture structure, provided they enforce every decision above and preserve the current Next.js, NextAuth, TypeScript, and Vercel foundation.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and security requirements
- `.planning/ROADMAP.md` — Phase 2 goal, success criteria, dependencies, and explicit risk statement.
- `.planning/REQUIREMENTS.md` — SEC-01 through SEC-05 traceability and acceptance criteria.
- `.planning/codebase/CONCERNS.md` — mapped privacy, authorization, advisor-cost, webhook, body-size, and credential-abuse risks.
- `.planning/codebase/ARCHITECTURE.md` — server/client boundaries, persistence port, and external service topology.

### Authentication and student-owned API boundaries
- `apps/web/auth.ts` — NextAuth credential/OAuth configuration, JWT callbacks, and current role propagation.
- `apps/web/app/api/account/onboarding/route.ts` — established authenticated account-route pattern.
- `apps/web/app/api/account/shortlist/route.ts` — established authenticated account-route pattern.
- `apps/web/app/api/admin/programmes/route.ts` — current privileged-route authorization pattern to replace with active staff checks.
- `apps/web/app/api/register/route.ts` — registration input and account creation boundary.
- `apps/web/app/api/memory/route.ts` — caller-controlled user-key example requiring server-derived identity.
- `apps/web/app/api/simulations/results/route.ts` — caller-controlled user-key example requiring server-derived identity.
- `apps/web/app/api/analytics/events/route.ts` — analytics-access boundary requiring authorization/validation decisions.
- `apps/web/app/api/referrals/route.ts` — referral ownership boundary requiring server-derived identity.
- `apps/web/app/api/feed-events/route.ts` — engagement-write boundary requiring server-derived identity and abuse controls.
- `apps/web/app/api/share/route.ts` — share-event boundary requiring server-derived identity and validation.
- `apps/web/app/api/ab-testing/assign/route.ts` — user-keyed assignment boundary requiring guest/account identity handling.

### Advisor, persistence, and external dispatch
- `apps/web/app/api/advisor-chat/route.ts` — current unauthenticated, unbounded paid provider integration.
- `apps/web/lib/server/data-store.ts` — account records, credential verification, staff-role source, and persistence interface.
- `apps/web/lib/server/platform-store.ts` — memory, simulation, engagement, referral, and recommendation access paths.
- `services/codex-webhook-runner/src/server.mjs` — incoming signature validation, request buffering, GitHub calls, and agent dispatch.
- `services/codex-webhook-runner/README.md` — webhook runner operational contract and configuration surface.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getServerSession(authOptions)` in account routes — the existing baseline for deriving the authenticated session at server boundaries.
- `apps/web/auth.ts` — the central NextAuth configuration point for session and credential behavior.
- `apps/web/lib/server/data-store.ts` and `apps/web/lib/server/platform-store.ts` — current domain operations that routes should call only after an identity/authorization guard succeeds.
- `services/codex-webhook-runner/src/server.mjs` — existing HMAC verification and job-packet shape to harden rather than replace.

### Established Patterns
- Route handlers return explicit JSON `403`, `400`, and `409` responses for expected authorization and validation failures.
- Server-only persistence code is isolated beneath `apps/web/lib/server/`; client components access it through App Router routes.
- The platform uses environment-selected adapters, so guards must not rely on a process-local-only identity or quota store if they must work across Vercel instances.

### Integration Points
- Apply shared student/guest identity guards to all current user-keyed route handlers before they call `platform-store` or `data-store`.
- Replace JWT-derived privileged checks in administrative routes with a shared active-staff guard based on current server configuration.
- Add bounded JSON/body parsing, rate/quota enforcement, and provider response limits around `advisor-chat`.
- Harden startup/request behavior and outbound dispatch in the standalone webhook runner without changing its supported GitHub automation purpose.
- Add route and service regression coverage for rejected, allowed, oversized, and rate-limited paths.

</code_context>

<specifics>
## Specific Ideas

- A week-long trial is intentional: students should have time to build relationships before they are required to sign in.
- Detailed login errors are intentional despite the account-enumeration risk; the rate-limit policy is the required counterbalance.
- Advisor guidance should feel substantial rather than terse, hence the 1,000-token response cap.

</specifics>

<deferred>
## Deferred Ideas

- Community relationship publishing, moderation, and author-safe representations remain in Phase 5. This phase may protect their existing server boundaries but must not silently ship unvalidated community capabilities.
- Explicit persisted staff-grant administration belongs with later administrative/data-operation correctness unless required solely to enforce the active allowlist policy.
- Background queues for deferred advisor replies are out of scope; quota exhaustion is an immediate `429` response.

</deferred>

---

*Phase: 2-Authentication, API, AI, and Webhook Controls*
*Context gathered: 2026-07-26*
