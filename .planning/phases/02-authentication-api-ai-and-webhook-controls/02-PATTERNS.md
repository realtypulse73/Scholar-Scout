# Phase 2: Authentication, API, AI, and Webhook Controls - Pattern Map

**Mapped:** 2026-07-26  
**Files analyzed:** 31 expected new or modified files  
**Analogs found:** 28 / 31 (three deliberately new security boundaries have only partial analogs)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `apps/web/lib/server/student-actor.ts` | server utility | request-response | `app/api/account/onboarding/route.ts` | role-match |
| `apps/web/lib/server/active-staff.ts` | server middleware/utility | request-response, audit | `app/api/admin/programmes/route.ts` | role-match |
| `apps/web/lib/server/rate-limit.ts` | server service | request-response, atomic quota | `lib/server/data-store.ts` | partial; do not copy its read/write concurrency |
| `apps/web/lib/server/advisor-context.ts` | server service | transform | `lib/server/platform-store.ts` | exact data-access role |
| `apps/web/lib/api-request.ts` | utility | request-response, transform | `lib/onboarding-validation.ts` | role-match |
| `apps/web/lib/advisor-contract.ts` | utility/model | transform | `lib/onboarding-validation.ts` | exact validation style |
| `apps/web/app/api/account/guest-migration/route.ts` | route | request-response, migration | `app/api/account/shortlist/route.ts` | role-match |
| `apps/web/app/api/admin/programmes/route.ts` | route | request-response, CRUD | itself | update guard only |
| `apps/web/app/api/register/route.ts` | route | request-response, CRUD | itself | update validation/limit gate |
| `apps/web/app/api/memory/route.ts` | route | request-response, CRUD | `app/api/account/onboarding/route.ts` | exact boundary style |
| `apps/web/app/api/simulations/results/route.ts` | route | request-response, CRUD | `app/api/account/shortlist/route.ts` | exact boundary style |
| `apps/web/app/api/analytics/events/route.ts` | route | request-response, event-driven | `app/api/account/onboarding/route.ts` | role-match |
| `apps/web/app/api/referrals/route.ts` | route | request-response, CRUD | `app/api/account/shortlist/route.ts` | role-match |
| `apps/web/app/api/feed-events/route.ts` | route | request-response, event-driven | `app/api/account/onboarding/route.ts` | role-match |
| `apps/web/app/api/share/route.ts` | route | request-response, event-driven | `app/api/account/onboarding/route.ts` | role-match |
| `apps/web/app/api/ab-testing/assign/route.ts` | route | request-response, event-driven | `app/api/account/onboarding/route.ts` | role-match |
| `apps/web/app/api/advisor-chat/route.ts` | route | request-response, external API | itself | replace unsafe flow, retain HTTP shape |
| `apps/web/auth.ts` | auth config/service | request-response | itself | update credentials gate |
| `apps/web/components/auth/AuthForm.tsx` | client component | request-response | itself | update error/migration integration |
| `apps/web/lib/server/data-store.ts` | server model/service | CRUD, migration | itself | extend model and async credential helper |
| `apps/web/lib/server/platform-store.ts` | server model/service | CRUD, transform | itself | add explicit migration helper |
| `apps/web/package.json` | config | dependency/config | `services/codex-webhook-runner/package.json` | role-match |
| `services/codex-webhook-runner/src/server.mjs` | service | event-driven, request-response | itself | harden and expose factory |
| `services/codex-webhook-runner/package.json` | config | test config | `services/http-data-service/package.json` | role-match |
| `services/codex-webhook-runner/README.md` | operational documentation | configuration | itself | update secret/token contract |
| `apps/web/__tests__/api/auth-controls.test.ts` | test | request-response | `__tests__/api/admin-data-routes.test.ts` | exact |
| `apps/web/__tests__/api/advisor-chat.test.ts` | test | request-response, external API | `__tests__/api/admin-data-routes.test.ts` | role-match |
| `apps/web/__tests__/lib/advisor-guardrails.test.ts` | test | transform | `__tests__/lib/onboarding-validation.test.ts` | exact |
| `apps/web/__tests__/fixtures/advisor-eval-cases.ts` | test fixture/model | batch, transform | domain test fixtures in `__tests__/lib/*.test.ts` | partial |
| `services/codex-webhook-runner/test/server.test.mjs` | integration test | event-driven, request-response | `services/http-data-service/test/server.test.mjs` | exact |
| `apps/web/__tests__/lib/data-store.test.ts` | test | CRUD, migration | itself | extend injected-store cases |

## Pattern Assignments

### Shared actor and request boundaries

#### `apps/web/lib/server/student-actor.ts` (server utility, request-response)

**Analog:** `apps/web/app/api/account/onboarding/route.ts`

**Copy the session-first boundary** (lines 10-19), moving it into a named server-only resolver and adding the trusted guest-cookie branch:

```ts
const session = await getServerSession(authOptions);

if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

return NextResponse.json({
  profile: await getOnboardingProfile(session.user.id),
});
```

**Integration:** return an `Actor` with a server-derived `storageKey`; account keys come only from `session.user.id`, guest keys only from an HttpOnly cookie lookup. Let all Phase-2 user-owned routes pass that key to `platform-store`/`data-store`.

**Avoid:** accepting `userKey`, `userId`, `referrer`, or a guest identifier from JSON/query text; retaining `local-student`; using a self-contained guest JWT that cannot be invalidated after migration.

#### `apps/web/lib/api-request.ts` and `apps/web/lib/advisor-contract.ts` (utilities, request-response/transform)

**Analog:** `apps/web/lib/onboarding-validation.ts`

**Copy the pure validator contract** (lines 6-13 and 45-62): exported functions have explicit types and return a domain-friendly sentinel instead of throwing for expected invalid input.

```ts
export function validateStep(
  step: number,
  data: OnboardingData,
): ValidationError | null {
  // ...
  return null;
}
```

**Integration:** `api-request.ts` owns byte-capped body reading and exact-object parsing; `advisor-contract.ts` owns `MAX_MESSAGE_CHARS = 3_000`, `MAX_REPLY_CHARS = 8_000`, exact `{ message }` parsing, allowlisted model selection, and response validation. Route handlers convert a `null`/typed failure into `NextResponse.json({ error }, { status: 400 })` before actor store reads, quota reservation, or provider calls.

**Avoid:** calling `request.json()` before enforcing a real byte cap; permitting unknown fields; putting browser context/history or provider logic inside validators.

#### `apps/web/lib/server/active-staff.ts` (server utility, request-response/audit)

**Analog:** `apps/web/app/api/admin/programmes/route.ts`

**Replace this stale-JWT guard** (lines 17-27):

```ts
const session = await getServerSession(authOptions);

if (session?.user?.role !== 'staff') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

**With the same early-return shape**, but resolve the current session, require ID and email, strictly parse the nonempty current allowlist, normalize and match the email on every request, then append only actor pseudonym/ID, action, route, allow/deny, and timestamp. Missing or malformed configuration must be a safe denial.

**Avoid:** using `session.user.role` or `getAccountRoleForEmail()` as current privileged authority; recording email, request body, cookie, token, programme content, or secret in the new audit event.

#### `apps/web/lib/server/rate-limit.ts` (server service, atomic quota)

**Partial analog:** `apps/web/lib/server/data-store.ts`

**Retain its server-only module boundary and typed port pattern** (lines 1 and 96-99):

```ts
import 'server-only';

export interface ScholarScoutDataStore {
  read(): Promise<ScholarScoutData>;
  write(data: ScholarScoutData): Promise<void>;
}
```

**Integration:** expose small named reservation functions with deterministic `{ allowed, resetAt, retryAfterSeconds }` results for advisor guest/account quotas, sign-in email/IP, and registration IP windows. Use an externally provisioned atomic service behind this adapter and fail closed with `503` when it is unavailable.

**Avoid:** copying `read()` then mutation then `write()` for counters. The existing adapter overwrites a whole document and cannot enforce concurrent limits. Do not use a process-local `Map`, vendor timeout-to-allow behavior, or provider calls/KDF work before a reservation.

#### `apps/web/lib/server/advisor-context.ts` (server service, transform)

**Analog:** `apps/web/lib/server/platform-store.ts`

**Copy the actor-keyed read pattern** (lines 157-174):

```ts
export async function getRecommendationsForUser(userKey: string) {
  const data = await readPlatformData();
  const programmes = await getGovernedProgrammes();
  const latestSimulation = [...(data.simulationResults ?? [])]
    .reverse()
    .find((result) => result.userKey === userKey);
  // ...
}
```

**Integration:** accept only the resolved actor's storage key; select memory and at most three current recommendations, truncate individual fields, and return a fixed-size server-selected summary. Keep it single turn.

**Avoid:** passing browser-supplied context, other actors' records, unbounded memory, `previous_response_id`, tools, browsing, or retained chat history to OpenAI.

### API route migrations

#### `apps/web/app/api/account/guest-migration/route.ts` (route, request-response/migration)

**Analog:** `apps/web/app/api/account/shortlist/route.ts` lines 25-39.

```ts
const session = await getServerSession(authOptions);

if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// call a server helper, then return stable JSON
return NextResponse.json({ ok: true });
```

**Integration:** the route derives the signed-in account and guest only from server state, calls one idempotent data/platform migration helper, records the active guest quota binding through its UTC reset, marks the guest record migrated, and clears its cookie. It accepts no guest ID from the browser.

**Avoid:** broad document copying, migration before a session exists, duplicate transfers, or any community publishing/moderation expansion deferred to Phase 5.

#### User-owned route group (routes, request-response/event-driven)

**Apply to:**

- `apps/web/app/api/memory/route.ts`
- `apps/web/app/api/simulations/results/route.ts`
- `apps/web/app/api/analytics/events/route.ts`
- `apps/web/app/api/referrals/route.ts`
- `apps/web/app/api/feed-events/route.ts`
- `apps/web/app/api/share/route.ts`
- `apps/web/app/api/ab-testing/assign/route.ts`

**Analog:** `apps/web/app/api/account/shortlist/route.ts` lines 12-22 and 25-39. The authenticated route owns the identity and supplies it only to server stores:

```ts
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

return NextResponse.json({
  programmeIds: await getShortlist(session.user.id),
  plans: await getShortlistPlans(session.user.id),
});
```

**Route-specific replacements:**

| Route | Replace | Server-derived integration |
|---|---|---|
| `memory` | query/body `userKey` and `local-student` (current lines 4-16) | resolved actor key for get/update |
| `simulations/results` | query/body `userKey` (lines 10-53) | actor key for read/save/recommendations/analytics; validate simulation payload only |
| `analytics/events` | public all-events GET and body `userKey` (lines 8-32) | restrict read to authorized aggregate/staff use or actor-owned data; write actor key only |
| `referrals` | public all-referrals GET and body `referrer` (lines 8-28) | owner/referrer comes from actor; no cross-user list |
| `feed-events` | body `userKey` (lines 7-48) | actor key after event/number validation |
| `share` | body/fallback `userKey` (lines 5-32) | actor key after finite target validation |
| `ab-testing/assign` | body/fallback `userKey` (lines 5-24) | actor key for deterministic assignment and analytics |

**Avoid:** changing public discovery-only paths (`feed`, programme discovery) into an auth wall; trusting supplied identity even when it matches a session; returning every analytics/referral record to arbitrary visitors.

#### `apps/web/app/api/admin/programmes/route.ts` (route, request-response/CRUD)

**Analog:** same file lines 37-63 for its validation/conflict contract:

```ts
const errors = validateProgrammeDraft(input);

if (errors.length > 0) {
  return NextResponse.json({ errors }, { status: 400 });
}

try {
  const record = await saveProgrammeRecord(session.user.id, programme);
  return NextResponse.json({ ok: true, record });
} catch (error) {
  if (error instanceof ProgrammeRevisionConflictError) {
    return NextResponse.json({ error: '...', currentRevision: error.currentRevision }, { status: 409 });
  }
  throw error;
}
```

**Integration:** replace each repeated session-role block at lines 18-22, 31-35, and 67-71 with one active-staff helper invocation before parsing or store work. Preserve draft validation, conflict response, and unexpected-error propagation.

**Avoid:** changing the existing `400`/`409` public contract or masking unexpected persistence failures; using only a role carried in a JWT.

#### `apps/web/app/api/register/route.ts` and `apps/web/auth.ts` (route/auth service, request-response)

**Analog:** registration's current expected-error response at `register/route.ts` lines 16-35 and the provider callback at `auth.ts` lines 18-44.

```ts
if (!body.email || !body.password || body.password.length < 8) {
  return NextResponse.json(
    { error: 'Email and an 8-character password are required.' },
    { status: 400 },
  );
}
```

```ts
async authorize(credentials) {
  const email = credentials?.email;
  const password = credentials?.password;
  if (!email || !password) return null;

  const user = await verifyUserCredentials(email, password);
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}
```

**Integration:** run the corresponding atomic registration or email/IP sign-in reservation before account lookup, write, or password KDF; return `429` with reset/retry data when denied and `503` when the limiter is unavailable. Preserve the locked, allowlisted detailed credential outcome through a client-safe mapping rather than raw thrown text.

**Avoid:** honouring the `role` submitted by `AuthForm` (the server already derives it from allowlist), synchronous password work, account lockout, or reflecting untrusted error messages.

#### `apps/web/components/auth/AuthForm.tsx` (client component, request-response)

**Analog:** its existing client fetch/non-OK handling at lines 35-46:

```tsx
const response = await fetch('/api/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, name, password, role }),
});

if (!response.ok) {
  const body = (await response.json()) as { error?: string };
  setError(body.error ?? 'Unable to create account.');
  return;
}
```

**Integration:** display only an allowlisted detailed credential or rate-limit message, honour retry metadata, and call the guest-migration endpoint only after successful credentials/OAuth sign-in. The component remains a trigger; it never sees guest credential material or chooses an account role.

**Avoid:** client-side-only rate limiting, raw provider/auth errors, or carrying the current client-selected `role` into a privilege decision.

#### `apps/web/app/api/advisor-chat/route.ts` (route, request-response/external API)

**Analog:** retain only its stable `NextResponse` endpoint pattern; replace its body/context/provider flow. The current unsafe input shows exactly what must disappear (lines 13-32):

```ts
const body = (await request.json()) as {
  userKey?: string;
  message?: string;
  question?: string;
  context?: { /* browser-selected context */ };
};
const userKey = body.userKey ?? 'local-student';
```

**Required flow:** actor resolution → raw byte cap → exact `{ message }` validation → atomic 10/25 reservation → actor-scoped context builder → one bounded non-streaming Responses request → schema/length validation → stable response/fallback. Use the AI-SPEC contract: `max_output_tokens: 1_000`, `AbortSignal.timeout(10_000)`, server allowlisted model, strict JSON schema, one schema retry at most, and fixed safe fallback with `fallback: true` on provider/parse/timeout failure.

**Avoid:** all current browser `context`, `question`, and `userKey`; its `220` token cap (line 109); returning `error.message` at lines 80-86; echoing memory in the no-key fallback at line 98; output-only trimming as validation.

### Server model changes

#### `apps/web/lib/server/data-store.ts` and `apps/web/lib/server/platform-store.ts` (server models/services, CRUD/migration)

**Analog:** current optional-record normalization in `platform-store.ts` lines 87-100:

```ts
const data = (await readScholarScoutData()) as PlatformData;

return {
  ...data,
  feedInteractions: data.feedInteractions ?? [],
  simulationResults: data.simulationResults ?? [],
  memoryRecords: data.memoryRecords ?? [],
  referralRecords: data.referralRecords ?? [],
  // ...
};
```

**And current scoped record replacement** (lines 237-261):

```ts
data.memoryRecords = [
  ...(data.memoryRecords ?? []).filter((record) => record.userKey !== userKey),
  memory,
];
await writeScholarScoutData(data);
```

**Integration:** extend the persisted model with guest lifecycle/migration metadata and minimal privileged-operation audit records, normalize absent optional fields, and implement explicit allowlisted guest-to-account transfer helpers for eligible actor-owned collections. Replace `scryptSync` imports and calls at `data-store.ts` lines 3 and 1385-1403 with promisified async `scrypt` while retaining `timingSafeEqual` and the existing salt/hash format.

**Avoid:** using whole-document operations as atomic rate limits; copying every collection during migration; retaining guest secret plaintext; silently treating missing guest records as a new identity; changing unrelated Phase-5 community visibility or moderation semantics.

### Webhook runner

#### `services/codex-webhook-runner/src/server.mjs` (Node service, event-driven/request-response)

**Analog:** `services/http-data-service/src/server.mjs` testable factory convention, evidenced by its test import and setup (`test/server.test.mjs` lines 6-20):

```js
import { createScholarScoutDataService } from '../src/server.mjs';

server = createScholarScoutDataService({ dataFile, token: 'test-token' });
await new Promise((resolve) => server.listen(0, resolve));
```

**Refactor the webhook runner to export a similarly injected `createCodexWebhookRunner(config)` factory**, then keep only environment loading and `listen()` at the executable edge.

**Harden these current sections:**

```js
const bodyBuffer = await readRequestBody(request); // current line 23: unbounded

if (!verifySignature(bodyBuffer, request.headers['x-hub-signature-256'])) {
  return respondJson(response, 401, { error: 'Invalid webhook signature' });
}

const payload = JSON.parse(bodyBuffer.toString('utf8')); // current line 32
```

Require configured secret before accepting webhook POST (`503` if absent; retain `/health`), cap raw input at 64 KiB before parse, validate signature prefix/length before constant-time comparison, then permit only configured repository + `issues` + `opened`/`labeled` + approved labels. Require bearer configuration before outbound agent dispatch, cap a sanitized packet to 16 KiB, use `Authorization: Bearer`, and apply a 10-second abort.

**Avoid:** current missing-secret `return true` at lines 132-136; `Buffer.concat` of arbitrary input (lines 161-168); parsing before validity; `timingSafeEqual` on unequal-length buffers; posting comments or calling agents for rejected/ignored events; unauthenticated dispatch at lines 122-129.

#### `services/codex-webhook-runner/package.json` and `README.md` (config/docs)

**Analog:** existing package scripts at lines 6-8 and documented environment list in `README.md` lines 16-23.

**Integration:** add a native `node --test` script and document required `CODEX_AGENT_BEARER_TOKEN`, configured repository allowlist, size/time limits, and fail-closed secret behavior. Keep the Node 20/pnpm 10.34.5 engine contract.

### Test assignments

#### `apps/web/__tests__/api/auth-controls.test.ts` and `apps/web/__tests__/api/advisor-chat.test.ts` (Jest route tests)

**Analog:** `apps/web/__tests__/api/admin-data-routes.test.ts`.

**Copy its test harness** (lines 5-20, 30-40, and 42-50):

```ts
import { getServerSession } from 'next-auth';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

class MemoryDataStore implements ScholarScoutDataStore {
  data = cloneData(initialData);
  async read() { return cloneData(this.data); }
  async write(data: ScholarScoutData) { this.data = cloneData(data); }
}

afterEach(() => {
  setScholarScoutDataStoreForTests(null);
  getSessionMock.mockReset();
});
```

**Integration:** mock sessions, the limiter, current time, actor-cookie data, and `globalThis.fetch`; inject in-memory storage. Assert ordering/no side effects: rejected identity/schema/rate-limit requests make no store/provider/KDF call. Cover account/guest isolation, idempotent migration/invalidation, active/missing/malformed/removed staff access, 5/6 login and registration limits, and 0/1/3,000/3,001 advisor bounds plus 10/11 and 25/26 quotas.

#### `apps/web/__tests__/lib/advisor-guardrails.test.ts` and `apps/web/__tests__/fixtures/advisor-eval-cases.ts` (unit test/fixture)

**Analog:** `apps/web/lib/onboarding-validation.ts` plus its direct unit-test convention. Keep fixtures TypeScript-only, deterministic, and synthetic.

**Integration:** test exact input/reply parsing, context caps, model allowlist, and fixed fallback paths. The checked-in fixture must contain at least 14 synthetic cases covering helpful/stale-fact coaching, agency/no guarantees, crisis/disability/immigration/complex-aid handoffs, identity/context injection, and quota/provider failure edges. No real student record, message, cookie, or provider call enters CI.

#### `apps/web/__tests__/lib/data-store.test.ts` (store/migration test)

**Analog:** its local injected-store and environment cleanup pattern (lines 38-82): initial data object, cloned in-memory `ScholarScoutDataStore`, `setScholarScoutDataStoreForTests`, environment restoration, and `jest.restoreAllMocks()`.

**Integration:** add guest lifecycle schema/normalization, idempotent transfer allowlist, invalidation, and async password verification tests; preserve all existing adapter tests.

#### `services/codex-webhook-runner/test/server.test.mjs` (Node integration test)

**Analog:** `services/http-data-service/test/server.test.mjs` lines 1-25.

```js
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createScholarScoutDataService } from '../src/server.mjs';

before(async () => {
  server = createScholarScoutDataService({ dataFile, token: 'test-token' });
  await new Promise((resolve) => server.listen(0, resolve));
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});
```

**Integration:** import the new webhook factory, bind ephemeral ports, stub outbound `fetch`, calculate real HMAC signatures, and assert missing/invalid secret, malformed JSON, oversized raw body/packet, wrong repository/event/action/label, absent agent bearer, timeout, and valid dispatch. Assert `/health` remains available with missing webhook configuration.

## Shared Patterns

### Server-only and imports

**Sources:** `apps/web/lib/server/platform-store.ts` lines 1-20; `apps/web/app/api/account/onboarding/route.ts` lines 1-8.

```ts
import 'server-only';

import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/auth';
import { getOnboardingProfile } from '@/lib/server/data-store';
```

Apply `server-only` to all new persistence/identity/quota/context helpers. Use `@/` aliases in web code and `node:` built-ins/relative imports in the standalone service.

### Expected route failures

**Source:** `apps/web/app/api/admin/programmes/route.ts` lines 37-63.

```ts
if (errors.length > 0) {
  return NextResponse.json({ errors }, { status: 400 });
}

if (error instanceof ProgrammeRevisionConflictError) {
  return NextResponse.json({ error: '...' }, { status: 409 });
}

throw error;
```

Authenticate/authorize and validate before server work; return explicit `400`, `401`, `403`, `429`, or `503` JSON for expected failures. Let unexpected server failures propagate except the advisor's deliberately fixed safe fallback path. Never return raw OpenAI/crypto/webhook errors.

### Test isolation

**Source:** `apps/web/__tests__/api/admin-data-routes.test.ts` lines 30-50.

Use injected data stores and mocked NextAuth/fetch/environment values, resetting every override in `afterEach`. The new test suite must never need a live atomic-counter provider, GitHub, or OpenAI service.

## No Exact Analog Found

| File/boundary | Reason | Planner direction |
|---|---|---|
| `apps/web/lib/server/rate-limit.ts` | No distributed atomic counter adapter exists; existing whole-document adapters are specifically unsafe for this use. | Introduce a narrow external atomic adapter behind a testable interface; require dependency/provider verification and fail closed. |
| `apps/web/lib/server/student-actor.ts` / guest migration | Existing session routes have no opaque guest lifecycle, cookie revocation, or same-device migration. | Build server-owned guest record/cookie lifecycle with explicit transfer allowlist and idempotency tests. |
| `apps/web/__tests__/fixtures/advisor-eval-cases.ts` | No AI evaluation fixture exists. | Add a synthetic, versioned 14-case fixture; route/unit tests remain the PR gate. |

## Metadata

**Analog search scope:** `apps/web/app/api`, `apps/web/components/auth`, `apps/web/lib`, `apps/web/lib/server`, `apps/web/__tests__`, and `services/*`  
**Files scanned:** 32 source/config/test files plus Phase 02 context, research, and AI specification  
**Pattern extraction date:** 2026-07-26
