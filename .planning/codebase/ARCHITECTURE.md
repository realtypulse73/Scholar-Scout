<!-- refreshed: 2026-07-21 -->
# Architecture

**Analysis Date:** 2026-07-21

## System Overview

```text
+---------------------------------------------------------------+
| Next.js App Router web application (`apps/web/app`)           |
+-------------------+--------------------+----------------------+
| Pages / layouts   | Route handlers     | React components     |
| `app/**/page.tsx` | `app/api/**`       | `components/**`      |
+---------+---------+----------+---------+----------+-----------+
          |                    |                    |
          +--------------------+--------------------+
                               v
+---------------------------------------------------------------+
| Domain and application logic (`apps/web/lib`)                 |
| matching, recommendations, simulations, programmes, decisions |
+-------------------------------+-------------------------------+
                                v
+---------------------------------------------------------------+
| Server orchestration (`apps/web/lib/server`)                  |
| auth/account operations, platform events, governed programmes |
+-------------------------------+-------------------------------+
                                v
+---------------------------------------------------------------+
| Pluggable document storage                                    |
| JSON file | HTTP data service | Vercel Blob                   |
| `lib/server/data-store.ts`                                    |
+---------------------------------------------------------------+

Supporting workspace services:
  `services/http-data-service`       local/durable HTTP adapter
  `services/codex-webhook-runner`    GitHub-to-agent automation
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| App Router UI | Public, student, creator, and staff page composition | `apps/web/app/**/page.tsx` |
| Route handlers | JSON API boundary, request parsing, auth gates, response status | `apps/web/app/api/**/route.ts` |
| UI components | Interactive client experiences and reusable primitives | `apps/web/components/` |
| Programme domain | Seed catalogue, types, filtering, related programmes, pagination | `apps/web/lib/programmes.ts` |
| Baseline matcher | Explainable six-signal profile-to-programme scoring | `apps/web/lib/preference-matching.ts` |
| Adaptive recommender | Adds shortlist, planning, similarity, and fit feedback to ranking | `apps/web/lib/adaptive-recommendations.ts` |
| Decision prediction | Estimates choice probability, stage, risk, and next action | `apps/web/lib/predictive-decisions.ts` |
| Platform engine | Feed/simulation models, simulation scoring, recommendations, variants, content decisions | `apps/web/lib/platform.ts` |
| Account data store | Users, onboarding, shortlists, programme governance, audit and restore operations | `apps/web/lib/server/data-store.ts` |
| Platform store | Feed events, simulation results, memory, analytics, referrals, decisions | `apps/web/lib/server/platform-store.ts` |
| Programme governance | Merges published staff records over the seed catalogue | `apps/web/lib/server/programme-records.ts` |
| Authentication | Credentials and conditional GitHub/Google providers with JWT sessions | `apps/web/auth.ts` |
| HTTP data service | GET/PUT document persistence with token auth and file backups | `services/http-data-service/src/server.mjs` |
| Webhook runner | Validates GitHub issue webhooks and dispatches Codex job packets | `services/codex-webhook-runner/src/server.mjs` |

## Pattern Overview

**Overall:** Modular Next.js monolith in an npm monorepo, with functional domain modules and an adapter-based document store.

**Key Characteristics:**
- Use server-rendered App Router pages as composition roots; place interaction-heavy behavior in client components under `apps/web/components/`.
- Keep deterministic scoring and recommendation rules as pure functions in `apps/web/lib/`.
- Keep filesystem, network, authentication, and mutable persistence in `apps/web/lib/server/` or API route handlers.
- Share one logical ScholarScout document across JSON, HTTP, and Vercel Blob adapters through `ScholarScoutDataStore` in `apps/web/lib/server/data-store.ts`.
- Treat `apps/web/lib/programmes.ts` and `apps/web/lib/platform.ts` as in-code seed fixtures; governed programme records can override programme IDs at runtime.

## Layers

**Presentation Layer:**
- Purpose: Render pages, navigation, forms, dashboards, feeds, simulations, and staff tools.
- Location: `apps/web/app/`, `apps/web/components/`
- Contains: Server components, client components, layouts, global styles, local fonts.
- Depends on: Domain functions, server query functions, NextAuth session state, internal API routes.
- Used by: Browser clients.

**HTTP/API Layer:**
- Purpose: Expose mutations and JSON queries to client components.
- Location: `apps/web/app/api/`
- Contains: Next.js `GET`, `POST`, and `DELETE` route handlers.
- Depends on: `apps/web/auth.ts`, `apps/web/lib/server/`, `apps/web/lib/platform.ts`.
- Used by: Client components and operational probes.

**Domain Layer:**
- Purpose: Encode catalogue types and deterministic product behavior.
- Location: `apps/web/lib/*.ts`
- Contains: Matching, ranking, simulations, pathway plans, advisor messages, filters, validation, and utilities.
- Depends on: Domain types in sibling modules; no storage adapter should be imported here.
- Used by: Pages, components, route handlers, and server orchestration.

**Server/Application Layer:**
- Purpose: Coordinate domain functions with persistent state and external services.
- Location: `apps/web/lib/server/`, `apps/web/auth.ts`
- Contains: Data adapter selection, account operations, audit trails, platform event aggregation, programme record merging.
- Depends on: Domain layer, Node server APIs, `@vercel/blob`, NextAuth.
- Used by: Server pages, API routes, authentication callbacks.

**Persistence Layer:**
- Purpose: Persist the complete account and platform document.
- Location: `apps/web/lib/server/data-store.ts`, `services/http-data-service/src/server.mjs`
- Contains: JSON, HTTP, and Vercel Blob adapters; local HTTP document service.
- Depends on: Local filesystem, Fetch API, or Vercel Blob.
- Used by: Server/application layer.

**Operations Layer:**
- Purpose: Validate environments, rehearse releases, smoke-test production, and automate issue dispatch.
- Location: `scripts/`, `services/codex-webhook-runner/`, `docs/`
- Contains: Node operational scripts, runbooks, release evidence, webhook receiver.
- Depends on: Workspace scripts, environment configuration, deployed endpoints.
- Used by: Maintainers and CI/CD.

## Data Flow

### Student Recommendation Request Path

1. A page such as `apps/web/app/recommendations/page.tsx` obtains the authenticated session and stored student context.
2. Account/profile state is read through functions in `apps/web/lib/server/data-store.ts`.
3. Published programme records are merged over seed records by `getGovernedProgrammes()` in `apps/web/lib/server/programme-records.ts`.
4. `getRankedProgrammeMatches()` in `apps/web/lib/preference-matching.ts` calculates six explainable signals from a 35-point baseline.
5. `getAdaptiveRecommendations()` in `apps/web/lib/adaptive-recommendations.ts` adds shortlist and planning behavior, clamps to 0-100, and sorts.
6. `apps/web/components/recommendations/RecommendationDashboard.tsx` renders scores, reasons, and actions.

### Platform Interaction Flow

1. A client experience such as `apps/web/components/feed/FeedExperience.tsx` or `apps/web/components/simulations/SimulationPlayer.tsx` emits an internal API request.
2. A route under `apps/web/app/api/feed-events/`, `apps/web/app/api/simulations/results/`, or `apps/web/app/api/analytics/events/` validates the request shape.
3. `apps/web/lib/server/platform-store.ts` appends an event to the same persisted platform document.
4. `apps/web/lib/platform.ts` scores simulations, ranks recommendations, assigns stable variants, or runs content decisions.
5. Memory and operational metrics are derived and stored by `apps/web/lib/server/platform-store.ts`.

### Account Mutation Flow

1. Credentials or OAuth enter through `apps/web/auth.ts` or `apps/web/app/api/register/route.ts`.
2. Account functions in `apps/web/lib/server/data-store.ts` normalize emails, hash or verify passwords, assign roles, and append audit events.
3. `getScholarScoutDataStore()` selects `json`, `http`, or `vercel-blob` from runtime configuration.
4. The selected adapter writes the complete `ScholarScoutData` document.

### AI Advisor Flow

1. `apps/web/components/advisor/AdvisorChat.tsx` posts a question and optional simulation context to `apps/web/app/api/advisor-chat/route.ts`.
2. The route loads memory and top recommendations from `apps/web/lib/server/platform-store.ts`.
3. When configured, the route calls the OpenAI Responses API; otherwise it returns a deterministic fallback.
4. The route records an advisor analytics event before returning the reply.

**State Management:**
- Authenticated account state is server-persisted in the `ScholarScoutData` document; NextAuth uses JWT sessions configured in `apps/web/auth.ts`.
- Some unauthenticated/local experiences use browser state via client components and `ONBOARDING_PROFILE_STORAGE_KEY` in `apps/web/lib/preference-matching.ts`.
- Persistent platform event state extends `ScholarScoutData` through `PlatformData` in `apps/web/lib/server/platform-store.ts`.
- Seed catalogue, feed, simulation, and creator content are module-level constants in `apps/web/lib/programmes.ts` and `apps/web/lib/platform.ts`.

## Key Abstractions

**Programme:**
- Purpose: Canonical post-secondary offering plus cost, access, pathway, support, and publication metadata.
- Examples: `apps/web/lib/programmes.ts`, `apps/web/lib/admin-programmes.ts`
- Pattern: Typed domain entity with seed instances and governed overrides.

**OnboardingData:**
- Purpose: Student preference profile used by filters and scoring.
- Examples: `apps/web/lib/onboarding-types.ts`, `apps/web/lib/onboarding-validation.ts`
- Pattern: Shared value object validated at boundaries.

**ProgrammeFitExplanation / AdaptiveProgrammeRecommendation:**
- Purpose: Carry numerical ranking together with transparent signal-level explanations.
- Examples: `apps/web/lib/preference-matching.ts`, `apps/web/lib/adaptive-recommendations.ts`
- Pattern: Pure functional scoring pipeline returning immutable result objects.

**ScholarScoutDataStore:**
- Purpose: Abstract the read/write persistence mechanism for one logical document.
- Examples: `apps/web/lib/server/data-store.ts`
- Pattern: Interface plus runtime-selected adapter implementations.

**PlatformData:**
- Purpose: Extend account data with event, simulation, memory, referral, sharing, analytics, and decision records.
- Examples: `apps/web/lib/server/platform-store.ts`
- Pattern: Additive document schema normalized on reads.

## Entry Points

**Web application:**
- Location: `apps/web/app/layout.tsx`, `apps/web/app/page.tsx`
- Triggers: Next.js request or client navigation.
- Responsibilities: Root metadata/session provider and landing page.

**App APIs:**
- Location: `apps/web/app/api/**/route.ts`
- Triggers: HTTP requests from clients or operational tools.
- Responsibilities: Parse, authorize, call server/domain functions, serialize responses.

**NextAuth:**
- Location: `apps/web/app/api/auth/[...nextauth]/route.ts`, `apps/web/auth.ts`
- Triggers: Sign-in, OAuth callback, session requests.
- Responsibilities: Provider configuration, identity persistence, JWT/session shaping.

**HTTP data service:**
- Location: `services/http-data-service/src/server.mjs`
- Triggers: `npm run dev --workspace @scholar-scout/http-data-service`.
- Responsibilities: Serve `/health` and authorized GET/PUT `/scholarscout` operations.

**Codex webhook runner:**
- Location: `services/codex-webhook-runner/src/server.mjs`
- Triggers: Node workspace start and GitHub webhook requests.
- Responsibilities: Signature validation, issue filtering, job packet creation, optional dispatch.

**Operational commands:**
- Location: `scripts/*.mjs`
- Triggers: Root `package.json` release/readiness scripts.
- Responsibilities: Environment checks, provisioning, rehearsal, smoke tests, reporting.

## Architectural Constraints

- **Threading:** All application and service code runs on the Node.js event loop; no worker threads are used.
- **Global state:** `activeDataStore` in `apps/web/lib/server/data-store.ts` caches the selected adapter for the process; tests must reset it with `setScholarScoutDataStoreForTests()`.
- **Document writes:** Store adapters replace the entire logical document. Mutations in `apps/web/lib/server/data-store.ts` and `apps/web/lib/server/platform-store.ts` use read-modify-write and have no transaction or concurrency control.
- **Server-only boundary:** Persistence modules declare `server-only`; never import them from a component marked `use client`.
- **Deployment runtime:** Filesystem JSON is a local-development adapter. Use the HTTP or Vercel Blob adapter when process-local files are not durable.
- **Circular imports:** No explicit circular dependency chain was detected; preserve the dependency direction UI/API -> server/domain -> adapters.
- **Workspace boundary:** Shared packages are reserved but currently empty (`packages/README.md`); most reuse remains inside the web workspace.

## Anti-Patterns

### Bypassing Governed Programme Loading

**What happens:** A feature reads the `programmes` seed array directly when it needs the live catalogue.
**Why it's wrong:** Published staff edits in persistent programme records are ignored.
**Do this instead:** Server-side catalogue features should call `getGovernedProgrammes()` from `apps/web/lib/server/programme-records.ts`; use the seed array only for static/demo logic.

### Importing Storage into Client Components

**What happens:** A client component imports `apps/web/lib/server/data-store.ts` or `apps/web/lib/server/platform-store.ts`.
**Why it's wrong:** These modules depend on Node APIs, secrets, and server-only packages and cannot be included in a browser bundle.
**Do this instead:** Add an authenticated route in `apps/web/app/api/` and call it from the client component, or load data in a server page and pass serializable props.

### Adding Scoring Logic Inside UI Components

**What happens:** Product rules are embedded in a page or component.
**Why it's wrong:** Explanations, tests, APIs, and alternate surfaces can diverge.
**Do this instead:** Add pure typed rules beside `apps/web/lib/preference-matching.ts`, `apps/web/lib/adaptive-recommendations.ts`, or `apps/web/lib/platform.ts` and render their returned signals.

### Writing Partial Adapter Documents

**What happens:** A caller treats `ScholarScoutDataStore.write()` as a patch operation.
**Why it's wrong:** Each adapter replaces the complete stored JSON document.
**Do this instead:** Read and normalize through `readScholarScoutData()` or `readPlatformData()`, update the in-memory document, then write the full value.

## Error Handling

**Strategy:** Validate at HTTP/domain boundaries, return explicit 4xx responses for expected input/auth failures, and catch unexpected route failures as JSON 500 responses.

**Patterns:**
- Route handlers such as `apps/web/app/api/advisor-chat/route.ts` wrap request work in `try/catch` and avoid exposing non-Error values.
- Store adapters in `apps/web/lib/server/data-store.ts` throw descriptive errors for configuration and non-success HTTP responses.
- Validation functions such as `validateScholarScoutDataImport()` and `validateProgrammeDraft()` return structured error collections before mutation.
- Local JSON reads and service reads treat missing documents as initial empty state.
- The advisor degrades to a deterministic response when the OpenAI key or upstream response is unavailable.

## Cross-Cutting Concerns

**Logging:** Application logging is minimal; service startup and automation warnings use `console` in `services/**/src/server.mjs`, while product activity is captured as structured analytics/audit records.
**Validation:** Use typed request parsing plus domain validators in `apps/web/lib/onboarding-validation.ts`, `apps/web/lib/admin-programmes.ts`, and `apps/web/lib/server/data-store.ts`.
**Authentication:** NextAuth JWT sessions are configured in `apps/web/auth.ts`; protect staff pages/routes with role checks and `apps/web/components/auth/StaffGate.tsx` as appropriate.
**Authorization:** Staff membership derives from an email allowlist in `apps/web/lib/server/data-store.ts`; API routes must enforce authorization server-side rather than relying on UI gates alone.
**Auditability:** Account/programme/restore mutations append audit records through `apps/web/lib/server/data-store.ts`; preserve this pattern for new governed mutations.
**Accessibility and design:** Reuse primitives under `apps/web/components/ui/` and tokens in `apps/web/app/globals.css` rather than introducing isolated controls/styles.

---

*Architecture analysis: 2026-07-21*
