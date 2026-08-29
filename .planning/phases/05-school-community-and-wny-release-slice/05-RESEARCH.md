# Phase 5: School, Community, and WNY Release Slice - Research

**Researched:** 2026-08-29  
**Domain:** Existing Next.js discovery/community release hardening  
**Confidence:** HIGH (all implementation findings are verified against the current repository)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Use a shared, prominent verification notice at the top of both discovery surfaces and retain a contextual `Verify before applying` panel beside each WNY result or school-locker decision point. The panel points to primary sources and practical next checks; it must not call information “checked,” current, independently verified, or an admission/safety conclusion.
- **D-02:** Empty WNY/school-locker states remain accessible, explain that no applicable result or programme is available, and retain the verification guidance rather than silently rendering nothing.
- **D-03:** Retain detailed peer-match cards with a public display name, programme, one plain-language compatibility reason, school-locker link, and the existing opt-in inbox action. Order eligible peers stably by public display name; do not surface sensitive profile data or inferred potential.
- **D-04:** Use a clear no-match/onboarding call to action rather than substitute unrelated uploaders or promise an admissions outcome.
- **D-05:** Put a brief explanation near both public-note and inbox-request forms that the two actions share a limit of five signed-in submissions per rolling hour. Server enforcement is authoritative; do not show an exact remaining-submission counter.
- **D-06:** Continue to give an immediate, safe form-level error for rejected content or a reached limit, without relying on browser state to enforce the quota.
- **D-07:** Put a visible Report action on public community items. Reporting immediately removes the target from public reads, is idempotent, and gives the reporter a private confirmation without exposing moderation details.
- **D-08:** Provide a focused, staff-gated moderation queue for pending items. A freshly authorized staff member can restore or remove an item; do not place this workflow in the already large programme-admin manager.

### the agent's Discretion

- Select the smallest compatible server-side quota, public DTO, moderation-state, audit, and route contracts that satisfy the locked specification and preserve Phase 2 identity/staff controls and Phase 4 persistence guarantees.
- Choose exact accessible wording, component composition, and test fixtures as long as they preserve the decisions above and all SPEC.md prohibitions.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research support |
|---|---|---|
| PROD-01 | Release source-linked, accessible WNY and school discovery. | Existing directory, governed-programme page, and Jest component/lib suites identify exact extension seams. |
| PROD-02 | Release peer/community features without unnecessary identity or spam exposure. | Matching function, client cards, and server routes expose the DTO, ordering, and quota work. |
| PROD-03 | Server validation, combined rate limiting, report/removal path, author-safe representation. | Existing Upstash reservation boundary, CAS mutation port, and active-staff guard are directly reusable. |
</phase_requirements>

## Summary

Phase 5 can remain within the current stack: Next.js App Router route handlers, React client components, pure TypeScript domain helpers, `ScholarScoutData` bounded persistence operations, and the existing Upstash-backed atomic reservation service. No package installation is needed. [VERIFIED: repository source — `apps/web/package.json`, `apps/web/lib/server/rate-limit.ts`]

The essential technical change is to establish a small, shared community domain boundary instead of letting the two current route handlers expose persistence records. Introduce author-safe public DTOs, one signed-in account quota key shared by note and inbox submissions, and a persisted moderation status/review record for public notes. Public reads must filter state in the server store, not merely in the browser. [VERIFIED: repository source — `apps/web/app/api/campus-notes/route.ts`, `apps/web/app/api/peer-connections/route.ts`, `apps/web/lib/server/data-store.ts`]

**Primary recommendation:** Plan a tracer slice that takes one note from safe submission through public DTO/read, report/hide, staff restore, and re-read, then expand discovery and peer-rendering coverage around the established seams.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| WNY and school verification/empty states | Browser / Client + SSR page | Domain data | Pages/components own accessible rendering; source data remains static/governed. |
| Deterministic peer matching | Domain library | SSR page/client cards | `getCampusUploaderMatches` is a pure function invoked by the server page and rendered by the client. |
| Shared community quota | API / Backend | External atomic limiter | Both POST handlers must reserve the same account key before a write; an atomic external service owns the counter. |
| Author-safe representation | API / Backend | Browser / Client | Server maps persisted records to public DTOs; client consumes only the DTO. |
| Report/hide/restore/remove | API / Backend | Database / Storage, staff UI | Server transitions persisted state with CAS-safe operations; staff page displays pending items after fresh authorization. |

## Standard Stack

### Core

| Library / facility | Current version | Purpose | Why use it |
|---|---:|---|---|
| Next.js route handlers / `NextResponse` | 15.5.15 | Authenticated community and staff APIs | Existing route convention and test setup. [VERIFIED: repository source — `apps/web/package.json`, admin routes] |
| NextAuth `getServerSession` | 4.24.14 | Derive signed-in student identity | Existing routes already derive author identity server-side. [VERIFIED: repository source — community routes] |
| `@upstash/ratelimit` + `@upstash/redis` | 2.0.8 / 1.38.0 | Atomic, fail-closed shared quota reservation | The declared and lockfile-resolved v2.0.8 package exposes `Ratelimit.slidingWindow(tokens, window)`; use it through the existing server wrapper, never browser or process-local quota state. [VERIFIED: npm registry packaged types — `@upstash/ratelimit@2.0.8`; CITED: https://upstash.com/docs/redis/sdks/ratelimit-ts/algorithms] |
| Jest + Testing Library | 30.3.0 / 16.3.2 | Pure, route, and accessible component regression tests | Existing web test infrastructure. [VERIFIED: repository source — `apps/web/package.json`, `jest.config.ts`] |

**Installation:** none. This phase must not add packages.

## Architecture Patterns

### Community safety data flow

```text
Signed-in student
  -> POST /api/campus-notes or /api/peer-connections
  -> validate bounded JSON + contact prohibition
  -> reserveCommunitySubmission(accountId) [one shared Upstash sliding-window key, 5 / 1 h]
  -> bounded server-store write using a stable-ID append/CAS-safe policy
  -> client-safe DTO (never persistence record)

Public reader
  -> GET /api/campus-notes
  -> server-store filters state === public
  -> public-note DTO (body, context, createdAt; no author ID/contact)

Reporter
  -> signed-in report endpoint derives reporter identity from session
  -> idempotent transition public -> pending-review plus one review item
  -> all future public reads omit target

Freshly authorized staff
  -> /admin/community-moderation page + staff API
  -> requireActiveStaff before body/read/mutation
  -> restore (pending-review -> public) or remove (pending-review -> removed)
```

### 1. Map storage models to explicit response DTOs

**Use:** Keep `author_id` / `sender_id` only in server storage. Define public types with camelCase JSON fields or retain existing snake_case only if the external contract must remain stable; in either case omit identifiers, email, handle, and every contact-bearing field. `GET /api/campus-notes` must return DTOs, and successful POST responses must not echo persistence-only identity. [VERIFIED: repository source — `CampusNote` presently contains `author_id`; `UploaderInboxRequest` contains `sender_id`; current routes return the raw records]

**Why:** Current `CampusNoteBoard` receives `CampusNote` from the public GET and POST, so the API currently exposes `author_id` to every reader. `POST /api/peer-connections` also returns raw `sender_id` to the browser. [VERIFIED: repository source — `CampusNoteBoard.tsx`, both community route handlers]

### 2. Give both submissions one account-scoped atomic reservation

**Use:** Add a `COMMUNITY_SUBMISSION_POLICY` with `limit: 5`, `window: { seconds: 3_600, duration: '1 h' }`, a unique prefix, and `algorithm: 'sliding-window'`, then expose `reserveCommunitySubmission(accountId)` from the existing rate-limit service. Extend the private limiter cache key with the algorithm and construct the community limiter as `Ratelimit.slidingWindow(5, '1 h')`; leave the existing advisor/sign-in policies on `Ratelimit.fixedWindow`. Call the shared community reservation after identity and minimal request-shape validation but before a store write. Translate `denied` and `unavailable` to safe, stable errors; do not return an exact remaining count. [VERIFIED: npm registry packaged types — `@upstash/ratelimit@2.0.8` declares `Ratelimit.slidingWindow(tokens: number, window: Duration)` and `Duration` accepts `'1 h'`; VERIFIED: repository source — `rate-limit.ts` already accepts `duration: '1 h'` and fails closed]

**Execution constraint:** Production must provide `UPSTASH_REDIS_REST_KV_REST_API_URL` and `UPSTASH_REDIS_REST_KV_REST_API_TOKEN`. If either is absent or the Upstash call fails, `reserveCommunitySubmission` must return `unavailable`, the route must return a safe non-success response, and it must not write a note or inbox request. This preserves the locked rolling-hour semantics; it is not permissible to fall back to the existing fixed-window, browser, process-local, or persistence-document counter. [VERIFIED: repository source — `getAtomicReservationLimiter` and `reserve` in `rate-limit.ts`; CITED: https://upstash.com/docs/redis/sdks/ratelimit-ts/algorithms]

### 3. Model moderation as monotonic public visibility and idempotent review creation

**Use:** Add a status union such as `public | pending-review | removed` to reportable public-note records and a moderation-review collection keyed by target note ID. A report operation must set pending-review first in the same bounded mutation that conditionally adds the review record. Repeated reports find the existing review and return the same safe confirmation. Public read filtering must accept only `public`. Restore changes only `pending-review -> public`; remove changes only `pending-review -> removed`. [VERIFIED: repository source — current `communityMutation` is a no-retry replacement; no state/review structures exist]

**Race safety:** A one-attempt `communityMutation` can throw a conflict, so it cannot guarantee that a report racing publication hides the resulting record. Use a stable-ID, retry-once append-like mutation policy for a report event/state transition, or create a focused server-store operation that reads the fresh snapshot, preserves the report state, and makes at most the documented retry. It must be idempotent by note ID and prove the final public read excludes it. Do not blindly retry generic whole-document replacements. [VERIFIED: repository source — `operational-records.ts`, `communityMutation` policy, Phase 4 test conventions]

### 4. Use the active staff gate for every staff read and resolution

**Use:** Staff page calls `requireActiveStaff({ action, route })`, uses `notFound()` on denial, and staff route calls it before request parsing or storage access. Route actions should be distinct (e.g. `community-moderation:read`, `community-moderation:resolve`) for the existing minimal authorization audit. [VERIFIED: repository source — `active-staff.ts`, `/admin/feed`, `/api/admin/programmes`]

### 5. Keep reporting signed-in and session-derived

**Use:** The report route must call `getServerSession(authOptions)` first and reject an absent `session.user.id` with the existing safe sign-in response pattern. The reporter's account ID is derived only from that session and may be retained only in server-side review/audit data; the request body must contain no reporter identity, role, or moderation decision fields. Return the same private confirmation for an initial or repeated report and disclose no moderation details. [VERIFIED: repository source — both current community write routes derive their actor from `getServerSession(authOptions)`; `auth.ts` populates `session.user.id`; locked D-07 requires private confirmation and idempotent immediate hide]

**Rationale:** Signed-in reporting is the selected smallest anti-abuse contract: it reuses the Phase 2 server-derived identity boundary, allows an accountable non-public audit actor, and avoids expanding this release into anonymous/public reporting, additional reporter data collection, or a separate abuse-control system. It preserves the locked privacy scope because no reporter identity is exposed to public readers or the reported author. [VERIFIED: repository source — `auth.ts`, `campus-notes/route.ts`, `peer-connections/route.ts`; VERIFIED: Phase 5 locked D-07 and SPEC boundaries]

### Recommended project structure / affected files

```text
apps/web/
├── app/western-new-york/page.tsx                         # compose shared verification notice if page-owned
├── app/schools/[slug]/page.tsx                            # no-programmes state + verification panel
├── app/admin/community-moderation/page.tsx                # new focused staff-gated queue
├── app/api/campus-notes/route.ts                          # public DTO reads, validation/quota-safe submission
├── app/api/campus-notes/[id]/report/route.ts              # new authenticated immediate-hide report boundary
├── app/api/admin/community-moderation/route.ts            # new staff queue/resolution boundary
├── app/api/peer-connections/route.ts                      # shared quota + author-safe response
├── components/campus-community/CampusNoteBoard.tsx        # notices, DTO, report feedback
├── components/campus-community/UploaderContactPanel.tsx   # shared-limit explanation
├── components/peer-community/PeerCommunity.tsx            # ordered public-card/no-match assertions
├── components/western-new-york/WesternNewYorkDirectory.tsx # remove "checked" copy, shared notice/empty state
├── lib/campus-community.ts                                # bounded input/public DTO/moderation types & pure validation
├── lib/peer-guides.ts                                     # stable display-name sort after matching
├── lib/server/data-store.ts                               # persistent model, normalize/validate/read/write moderation ops
├── lib/server/operational-records.ts                      # explicit safe report/review mutation policy
└── lib/server/rate-limit.ts                               # shared community policy/reservation
```

## Don't Hand-Roll

| Problem | Do not build | Use instead | Why |
|---|---|---|---|
| Cross-instance quotas | React state, module `Map`, or data-document counters | Existing Upstash atomic reservation abstraction | Only the provider owns a shared atomic count; the wrapper already fails closed. [VERIFIED: repository source — `rate-limit.ts`] |
| Staff authorization | Role supplied by page/body/JWT alone | `requireActiveStaff` and its configured current email allowlist | It records minimal authorization evidence and refuses absent/malformed allowlists. [VERIFIED: repository source — `active-staff.ts`] |
| Persistence conflict handling | Unbounded read/overwrite or infinite retries | Versioned data-store and narrowly declared operational policies | Phase 4 established one retry only for stable-ID idempotent appends. [VERIFIED: repository source — `operational-records.ts`] |
| Public privacy contract | `Omit` cast at a single call site | Named DTO mapper(s) tested against all public responses | Raw stored models already contain author/sender identifiers. [VERIFIED: repository source — community models/routes] |

## Common Pitfalls

1. **Existing public raw-record leak.** `CampusNoteBoard` consumes raw `CampusNote`, whose `author_id` is returned by public GET and POST. A type-only client change does not fix this; map on the server and test serialized responses. [VERIFIED: repository source — `CampusNoteBoard.tsx`, `campus-notes/route.ts`]
2. **Quota split by route.** Separate prefixes or `reserveCampusNote`/`reserveInbox` counters would allow ten submissions. Both routes must call one account-keyed method. [VERIFIED: SPEC requirement 3]
3. **Using the existing fixed-window default for community quota.** A fixed window can allow edge bursts across a boundary and violates the locked rolling-hour wording. The community policy must explicitly select `Ratelimit.slidingWindow(5, '1 h')`, with an algorithm-aware limiter cache key, while existing policies retain their current fixed-window behavior. [VERIFIED: repository source — `rate-limit.ts`; VERIFIED: npm registry packaged types — `@upstash/ratelimit@2.0.8`; CITED: https://upstash.com/docs/redis/sdks/ratelimit-ts/algorithms]
4. **Report after publication race.** The current `communityMutation` never retries, which is correct for generic replacement but insufficient to promise the reported item is hidden after an interleaving write. Make the report operation stable-ID/idempotent and test an injected CAS conflict. [VERIFIED: repository source — `operational-records.ts`, `operational-records.test.ts`]
5. **Unsafe public language.** Current WNY link text can render `(checked)` and footer says sources were checked on a date. Replace with source-oriented wording; do not state current/independently verified, safety score, or admission prediction. [VERIFIED: repository source — `WesternNewYorkDirectory.tsx`; SPEC]
6. **School locker 404 prevents required empty state.** Current page calls `notFound()` when no uploader exists, and maps programmes without an empty state. The plan needs an explicit decision point for valid locker context with no programmes, while preserving unknown-slug 404 behavior. [VERIFIED: repository source — `schools/[slug]/page.tsx`; SPEC]
7. **Peer UI route/request mismatch.** `PeerCommunity` asks for a topic but posts only `uploader_username`, `program_id`, and `body`; the route has no topic contract. Keep Phase 5 bounded to the existing inbox request contract unless the planner explicitly adds/validates topic end-to-end; do not silently imply it is persisted. [VERIFIED: repository source — `PeerCommunity.tsx`, `peer-connections/route.ts`]
8. **Regex limitation must remain scoped.** Existing contact protection catches `@` and US-style ten-digit phone forms; Unicode is allowed but must not bypass length/blank validation. Do not claim it detects every global contact format without a changed, explicitly tested contract. [VERIFIED: repository source — `campus-community.ts`; SPEC]

## Validation Architecture

| Property | Value |
|---|---|
| Framework | Jest 30.3.0 + Next Jest / Testing Library |
| Config file | `apps/web/jest.config.ts` |
| Quick run command | `pnpm --filter @scholar-scout/web test --runInBand` |
| Full suite command | `pnpm --filter @scholar-scout/web run lint && pnpm --filter @scholar-scout/web run typecheck && pnpm --filter @scholar-scout/web test --runInBand` |

### Phase requirements -> test map

| Req ID | Behavior | Test type and target |
|---|---|---|
| PROD-01 | WNY equal scores sort alphabetically; source links/notice render; Unicode text and empty surfaces remain accessible | `lib/western-new-york.test.ts` plus component/page tests for `WesternNewYorkDirectory` and school locker |
| PROD-02 | Only declared interests/pathway/location are used; no profile/non-match CTA; display-name order | `lib/peer-guides.test.ts` plus `PeerCommunity` component test |
| PROD-03 | Server rejects malformed, whitespace, over-limit, contact-bearing and Unicode-safe requests; sixth combined reservation denied; serialized DTO has no identity/contact fields | Node-environment API tests for both route handlers + `rate-limit.test.ts` + community domain tests |
| PROD-03 | Quota provider unavailable fails safely and does not write | route test mocks reservation `unavailable`, asserts non-success/no store call |
| PROD-03 | Response never returns `author_id` / `sender_id` | API JSON exact-shape/negative-property assertions |
| PROD-03 / PROD-02 | visible shared-limit explanation and form errors are announced | Testing Library assertions for text plus `role="status"` |
| PROD-03 | report immediately omits item, duplicate report produces one review, race ends hidden | server-store integration test with Phase 4 conflict-injecting store |
| PROD-03 | denial/authorized restore/remove | node API tests mocking `requireActiveStaff` and store transition behavior |

### Required test fixtures

- Reuse `InMemoryAtomicReservationLimiter` style from `rate-limit.test.ts`, but exercise one shared community method with alternating note/inbox calls.
- Reuse `ConflictStore` style from `operational-records.test.ts` to force a report/publication interleaving and inspect the final public read.
- Route tests must mock session/auth and `requireActiveStaff` as existing API tests do; assert `requireActiveStaff` is reached before privileged read/mutation.
- Component tests should render at least one Unicode institution/display name and use accessible role/text queries, not CSS selectors.

## Security Domain

| ASVS category | Applies | Phase control |
|---|---|---|
| V2 Authentication | Yes | `getServerSession` derives author/reporter identity; no body identity field selects owner. |
| V3 Session Management | Yes | Signed-in account ID is the quota and ownership key. |
| V4 Access Control | Yes | `requireActiveStaff` gates moderation page/API before parsing/storage; public reads filter status server-side. |
| V5 Input Validation | Yes | Bounded server validation and content checks precede write; route shape validation must prevent malformed objects from throwing. |
| V6 Cryptography | Indirect | Existing provider credential/configuration is retained; no new cryptography. |

## Recommended Plan Structure

1. **Tracer - server safety foundation:** Add/extend community domain types, safe DTO mapping, signed-in report guard, data normalization, and one end-to-end note create -> public DTO -> report/hide -> staff restore flow with route/store tests. Implement the explicit community `Ratelimit.slidingWindow(5, '1 h')` policy and its fail-closed unavailable path before any UI work.
2. **Moderation operational surface:** Add the focused, staff-gated queue and resolution API/component, using the tracer state machine; cover denial, idempotency, removal, and a forced publish/report race.
3. **Discovery release hardening:** Update WNY source language/notice and contextual panels; add school locker verification and empty states; lock down WNY alphabetical tie-order tests.
4. **Peer/community presentation release:** Sort matches by public display name, protect no-match card behavior, add shared-limit text to both forms and report controls/feedback; finish component accessibility and Unicode coverage.

This ordering proves the highest-risk state transition before extending UI, keeps the one-way staff route boundary isolated, and preserves Phase 4 persistence behavior.

## Environment Availability

| Dependency | Required by | Available | Fallback |
|---|---|---|---|
| Node / pnpm workspace | tests and Next build | Assumed available in active repository workflow; versions governed by root project config | none |
| Upstash REST environment variables | production community quota | Configuration-dependent; implementation must fail closed when absent, as existing limiter does | safe unavailable response, no write |

## Package Legitimacy Audit

No new external package is required; no package-legitimacy gate applies.

## Assumptions Log

No unresolved assumptions. The Upstash v2.0.8 sliding-window API/configuration and the signed-in reporting contract were verified for this phase. [VERIFIED: npm registry packaged types — `@upstash/ratelimit@2.0.8`; VERIFIED: repository source — `auth.ts`, existing community routes]

## Open Questions

None. The former rolling-window and report-authentication questions are resolved: use `Ratelimit.slidingWindow(5, '1 h')` through the existing fail-closed server boundary, and require a session-derived signed-in reporter identity.

## Sources

### Primary (HIGH confidence)

- [VERIFIED: repository source] `apps/web/lib/server/rate-limit.ts` — atomic Upstash reservation boundary, provider configuration, fixed-window implementation, fail-closed behavior.
- [VERIFIED: npm registry packaged types] `@upstash/ratelimit@2.0.8` — exact `Ratelimit.slidingWindow(tokens, window)` declaration and accepted `Duration` values, including `'1 h'`.
- [CITED: https://upstash.com/docs/redis/sdks/ratelimit-ts/algorithms] — the documented sliding-window configuration and boundary behavior.
- [VERIFIED: repository source] `apps/web/lib/server/operational-records.ts` and tests — bounded CAS and explicit retry rules.
- [VERIFIED: repository source] `apps/web/lib/server/data-store.ts`, current community routes/components — raw persistence models, current reads/writes, and integration locations.
- [VERIFIED: repository source] `apps/web/lib/server/active-staff.ts` and admin route/page patterns — fresh allowlist authorization and safe denial behavior.
- [VERIFIED: repository source] `05-SPEC.md`, `05-CONTEXT.md`, `REQUIREMENTS.md` — locked scope, acceptance, and prohibited behavior.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — installed, already-used modules.
- Architecture: HIGH — direct current-code seams and Phase 4 policy tests.
- Risks: HIGH — the rolling quota and report-authentication semantics are now explicit; production Redis credential availability remains a fail-closed execution precondition.

**Valid until:** implementation begins or the rate-limit dependency changes.
