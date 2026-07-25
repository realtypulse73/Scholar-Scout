<!-- refreshed: 2026-07-25 -->
# Architecture

**Analysis Date:** 2026-07-25

## System Overview

```text
┌───────────────────────────────────────────────────────────────────┐
│                 Next.js web application: `apps/web`                │
├────────────────────────┬──────────────────────┬───────────────────┤
│ App Router pages       │ Client components    │ Route handlers    │
│ `app/**/page.tsx`      │ `components/**`      │ `app/api/**`      │
└────────────┬───────────┴──────────┬───────────┴─────────┬─────────┘
             │                      │                     │
             │ server rendering     │ browser `fetch`      │ server-only calls
             ▼                      ▼                     ▼
┌───────────────────────────────────────────────────────────────────┐
│ Domain and application logic: `apps/web/lib/**`                    │
│ matching, programme catalogue, simulations, platform decisions     │
├───────────────────────────────────────────────────────────────────┤
│ Server persistence boundary: `apps/web/lib/server/**`              │
│ `data-store.ts` / `platform-store.ts` / `programme-records.ts`     │
└──────────────────────────────┬────────────────────────────────────┘
                               │ selected by `SCHOLARSCOUT_DATA_ADAPTER`
       ┌───────────────────────┼──────────────────────────┐
       ▼                       ▼                          ▼
 JSON file               HTTP data service           Vercel Blob
 `data/*.json`           `services/http-data-service` `@vercel/blob`

Separate automation service: `services/codex-webhook-runner/src/server.mjs`
receives validated GitHub issue webhooks and optionally dispatches a Codex job.
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Root layout | Applies fonts, global CSS, and the NextAuth client session provider. | `apps/web/app/layout.tsx` |
| App Router pages | Compose route-specific screens; server pages can read session, governed programmes, and stores directly. | `apps/web/app/**/page.tsx` |
| Feature components | Own browser interaction, local UI state, and calls to internal `/api` routes. | `apps/web/components/<feature>/*.tsx` |
| UI primitives | Reusable visual controls with a barrel export for grouped imports. | `apps/web/components/ui/*.tsx`, `apps/web/components/ui/index.ts` |
| API route handlers | Parse requests, enforce route-level authorization where required, coordinate domain and persistence logic, and return `NextResponse`. | `apps/web/app/api/**/route.ts` |
| Domain modules | Define programme data, matching, validation, simulation scoring, recommendation, and platform decision algorithms. | `apps/web/lib/*.ts` |
| Server data store | Selects and abstracts the JSON, HTTP, or Vercel Blob persistence backend; owns account, programme, and restore operations. | `apps/web/lib/server/data-store.ts` |
| Platform store | Persists feed, simulation, memory, referral, share, analytics, and decision records on top of the shared data store. | `apps/web/lib/server/platform-store.ts` |
| Programme record boundary | Merges seed catalogue data with staff-governed persisted programme records. | `apps/web/lib/server/programme-records.ts` |
| HTTP data service | Provides the `GET`/`PUT /scholarscout` document contract for the HTTP adapter. | `services/http-data-service/src/server.mjs` |
| Webhook runner | Verifies GitHub webhooks, creates automation job packets, and optionally posts/distributes them. | `services/codex-webhook-runner/src/server.mjs` |

## Pattern Overview

**Overall:** A Next.js monolith with feature-oriented UI modules, functional domain modules, route-handler application services, and a pluggable document-store persistence port.

**Key Characteristics:**

- Place URL-routed rendering and API endpoints under `apps/web/app`; filesystem names determine App Router routes.
- Keep browser state in explicitly marked client components (`'use client'`) under `apps/web/components`; invoke server capabilities through route handlers.
- Keep reusable business rules and static/seed domain data in `apps/web/lib`, and isolate Node-only persistence code in `apps/web/lib/server` via `import 'server-only'`.
- Treat `ScholarScoutDataStore` in `apps/web/lib/server/data-store.ts` as the persistence port; adapter selection remains an environment concern.
- Keep independently runnable processes in `services/<service>/src/server.mjs`, each with its own workspace `package.json`.

## Layers

**Presentation and routing:**

- Purpose: Render pages and establish the public, account, admin, and API route topology.
- Location: `apps/web/app/`
- Contains: App Router `page.tsx`, `layout.tsx`, and `route.ts` files.
- Depends on: `apps/web/components`, `apps/web/lib`, `apps/web/lib/server`, and `apps/web/auth.ts`.
- Used by: Next.js runtime and browser navigation.

**Interactive feature UI:**

- Purpose: Render feature-specific controls, retain transient browser state, and call internal APIs.
- Location: `apps/web/components/`
- Contains: Feature folders such as `onboarding`, `programmes`, `shortlist`, `feed`, `recommendations`, `admin`, and `auth`.
- Depends on: `apps/web/lib` types/helpers, `next-auth/react`, and internal `/api` endpoints.
- Used by: App Router pages in `apps/web/app/**/page.tsx`.

**Domain logic:**

- Purpose: Model programme content and implement deterministic matching, simulation, decision, validation, and formatting rules.
- Location: `apps/web/lib/`
- Contains: `programmes.ts`, `preference-matching.ts`, `platform.ts`, `simulations.ts`, `career-simulations.ts`, `onboarding-*.ts`, and feature-specific helpers.
- Depends on: TypeScript/standard library only, except server modules that use Node APIs.
- Used by: Pages, components, API routes, and server stores.

**Server application and persistence:**

- Purpose: Enforce data-store boundaries and persist accounts, profiles, programme governance, analytics, simulation activity, and backups.
- Location: `apps/web/lib/server/`
- Contains: `data-store.ts`, `platform-store.ts`, and `programme-records.ts`.
- Depends on: Node `crypto`/`fs`, optional `@vercel/blob`, `apps/web/lib`, and an optional HTTP service.
- Used by: Server pages, route handlers, and `apps/web/auth.ts`.

**Standalone services:**

- Purpose: Supply optional process boundaries outside the Next.js deployment.
- Location: `services/http-data-service/` and `services/codex-webhook-runner/`.
- Contains: Native Node HTTP servers and service-specific package manifests.
- Depends on: Node standard APIs; the webhook runner additionally communicates with GitHub and an optional agent endpoint.
- Used by: The HTTP data adapter and GitHub webhook delivery, respectively.

## Data Flow

### Primary Request Path: programme discovery and matching

1. Next.js resolves `/programmes` to `apps/web/app/programmes/page.tsx:44`.
2. The server page reads the NextAuth session and optional account profile with `getOnboardingProfile` (`apps/web/app/programmes/page.tsx:45-48`).
3. It combines the seed catalogue and staff-managed records through `getGovernedProgrammes` (`apps/web/app/programmes/page.tsx:17`) and ranks the results with `rankProgrammesForProfile`.
4. The page passes serializable results to the client `ProgrammeResults` component in `apps/web/components/programmes/ProgrammeResults.tsx:32`.
5. Browser-side profile adjustments are loaded from the authenticated `/api/account/onboarding` handler, whose `GET` and `POST` operations appear in `apps/web/app/api/account/onboarding/route.ts:10` and `:22`.

### Account-backed onboarding path

1. The client wizard owns step and draft state in `apps/web/components/onboarding/OnboardingWizard.tsx:58`, including a local-storage draft key at `:30`.
2. Completion posts the selected profile to `/api/account/onboarding` (`apps/web/components/onboarding/OnboardingWizard.tsx:155`).
3. `apps/web/app/api/account/onboarding/route.ts:23` obtains the authenticated user with `getServerSession(authOptions)` and calls `saveOnboardingProfile`.
4. `apps/web/lib/server/data-store.ts:811` reads the complete document, replaces the user profile, appends an audit event, then writes through the selected `ScholarScoutDataStore` adapter.

### Engagement, simulation, and recommendation path

1. Client feature components post feed events (`apps/web/components/feed/PathCard.tsx:163`), simulations, and advisor context to API routes.
2. Route handlers call platform-store functions such as `appendFeedInteraction`, `saveSimulationResult`, and `getRecommendationsForUser` in `apps/web/lib/server/platform-store.ts:102`, `:125`, and `:157`.
3. `platform-store.ts` reads the shared document, applies domain functions imported from `apps/web/lib/platform.ts`, writes the updated document, and recalculates memory when relevant.
4. Advisor requests in `apps/web/app/api/advisor-chat/route.ts:11` use the saved memory/recommendation context and call the OpenAI Responses HTTP API only when `OPENAI_API_KEY` is configured; otherwise they return a deterministic fallback.

### Persistence adapter path

1. `getScholarScoutDataStore` in `apps/web/lib/server/data-store.ts:672` lazily selects an adapter based on `SCHOLARSCOUT_DATA_ADAPTER`.
2. `json` reads/writes `data/scholarscout-data.json` through `JsonScholarScoutDataStore` (`apps/web/lib/server/data-store.ts:158`).
3. `http` calls the configured HTTP endpoint with optional bearer authorization through `HttpScholarScoutDataStore` (`apps/web/lib/server/data-store.ts:176`); `services/http-data-service/src/server.mjs` accepts `GET` and `PUT /scholarscout`.
4. `vercel-blob` dynamically imports `@vercel/blob` and reads/writes the configured blob path through `VercelBlobScholarScoutDataStore` (`apps/web/lib/server/data-store.ts:229`).

**State Management:**

- Server-rendered pages pass serializable initial data as props; NextAuth supplies client session state through `apps/web/components/auth/AuthSessionProvider.tsx`.
- Client features use React `useState`, `useEffect`, `useMemo`, and browser storage for transient state; no central browser state store is present.
- Durable application state is a single `ScholarScoutData` document accessed through `apps/web/lib/server/data-store.ts` and extended as `PlatformData` in `apps/web/lib/server/platform-store.ts`.

## Key Abstractions

**ScholarScoutDataStore:**

- Purpose: Small read/write persistence interface for the complete ScholarScout document.
- Examples: `JsonScholarScoutDataStore`, `HttpScholarScoutDataStore`, and `VercelBlobScholarScoutDataStore` in `apps/web/lib/server/data-store.ts`.
- Pattern: Port-and-adapter selection with a process-local lazy singleton.

**ScholarScoutData / PlatformData:**

- Purpose: The canonical persisted document models account data, programme records, audit events, and engagement data.
- Examples: `apps/web/lib/server/data-store.ts:51` and `apps/web/lib/server/platform-store.ts:77`.
- Pattern: A base document extended by feature-owned optional collections; normalize absent collections in `readPlatformData`.

**Governed programme catalogue:**

- Purpose: Produce the catalogue used by discovery and recommendations by combining immutable seed data with staff records.
- Examples: `apps/web/lib/programmes.ts`, `apps/web/lib/server/programme-records.ts`.
- Pattern: Read-time merge; use `getGovernedProgrammes` rather than importing the seed collection directly when managed edits must appear.

**NextAuth options:**

- Purpose: Centralize credential/OAuth provider configuration, session claims, and account provisioning.
- Examples: `apps/web/auth.ts`, `apps/web/app/api/auth/[...nextauth]/route.ts`.
- Pattern: One exported `authOptions` object reused by route handlers and server pages.

## Entry Points

**Web application:**

- Location: `apps/web/app/layout.tsx` and `apps/web/app/**/page.tsx`.
- Triggers: Next.js App Router requests.
- Responsibilities: Compose layouts, render server pages, initialize session-provider coverage, and expose UI routes.

**Web APIs:**

- Location: `apps/web/app/api/**/route.ts`.
- Triggers: Internal browser `fetch` calls and external HTTP requests.
- Responsibilities: Authenticate where a user or staff role is required, validate route inputs, invoke server/domain modules, and return JSON.

**HTTP data service:**

- Location: `services/http-data-service/src/server.mjs`.
- Triggers: `npm run dev --workspace @scholar-scout/http-data-service` or `npm run start --workspace @scholar-scout/http-data-service`.
- Responsibilities: Serve health checks and the normalized ScholarScout document contract for the HTTP persistence adapter.

**Codex webhook runner:**

- Location: `services/codex-webhook-runner/src/server.mjs`.
- Triggers: `npm run start --workspace @scholar-scout/codex-webhook-runner` or GitHub webhook delivery to `/github/webhook`.
- Responsibilities: Validate signature, filter labeled issue events, produce a job packet, and optionally notify GitHub/an agent endpoint.

## Architectural Constraints

- **Threading:** Next.js route handling and both services run on Node.js's single-threaded event loop. The data stores use async I/O, but the local JSON adapter has no locking or transaction mechanism.
- **Global state:** `activeDataStore` in `apps/web/lib/server/data-store.ts:263` caches one data-store adapter per process; reset it only through `setScholarScoutDataStoreForTests` in `data-store.ts:723`.
- **Server/client boundary:** Files in `apps/web/lib/server/` begin with `import 'server-only'`; browser code must access their capabilities through `apps/web/app/api/**/route.ts` or server-rendered pages.
- **Persistence shape:** The adapter reads and writes the entire `ScholarScoutData` document, including platform extensions. Add persisted fields through the model and normalization paths before writing feature code.
- **Authentication:** `apps/web/auth.ts` is the sole NextAuth configuration. Use `getServerSession(authOptions)` in account/staff routes, as demonstrated by `apps/web/app/api/account/shortlist/route.ts` and `apps/web/app/api/admin/programmes/route.ts`.
- **Circular imports:** No circular dependency chain is detected in the scanned production modules. Preserve the direction `app/components → lib → lib/server`, with `lib/server` importing domain types/helpers only.

## Anti-Patterns

### Bypassing the governed programme boundary

**What happens:** Pages or recommendation code can import the seed `programmes` array directly from `apps/web/lib/programmes.ts`.
**Why it's wrong:** Staff-created or edited records stored through `apps/web/lib/server/data-store.ts` are omitted from results and recommendations.
**Do this instead:** Use `getGovernedProgrammes` from `apps/web/lib/server/programme-records.ts` for any server-rendered listing, recommendation, or staff-aware programme view.

### Creating another simulation UI namespace

**What happens:** Simulation UI is split between the singular `apps/web/components/simulation/SimulationPlayer.tsx` and plural `apps/web/components/simulations/SimulationPlayer.tsx` / `SimulationScene.tsx`.
**Why it's wrong:** Similar component names make imports and responsibility selection ambiguous.
**Do this instead:** Add simulation work to the namespace used by the target route: `/simulate` composes `components/simulation/SimulationPlayer.tsx`, while `/explore` composes `components/simulations/SimulationPlayer.tsx`; avoid adding another parallel folder or identically named player.

## Error Handling

**Strategy:** Route handlers validate inputs early, return JSON errors with appropriate status codes, and catch persistence/external failures at API boundaries.

**Patterns:**

- Return `NextResponse.json({ error: ... }, { status })` for input, authorization, and request failures, as in `apps/web/app/api/account/shortlist/route.ts`.
- Use typed domain errors where a client needs recoverable detail; `ProgrammeRevisionConflictError` is translated to `409` in `apps/web/app/api/admin/programmes/route.ts`.
- Fail adapter misconfiguration immediately in `getScholarScoutDataStore` (`apps/web/lib/server/data-store.ts:672`) and expose configuration status through the admin data routes.
- Return the deterministic advisor reply when the optional OpenAI request fails in `apps/web/app/api/advisor-chat/route.ts`.

## Cross-Cutting Concerns

**Logging:** Services use `console.log`/`console.warn` in `services/http-data-service/src/server.mjs` and `services/codex-webhook-runner/src/server.mjs`; the web app persists product analytics through `appendAnalyticsEvent` in `apps/web/lib/server/platform-store.ts`.

**Validation:** Feature validation lives near domain models (`apps/web/lib/onboarding-validation.ts`, `apps/web/lib/admin-programmes.ts`, `apps/web/lib/campus-community.ts`, and `apps/web/lib/outcome-profiles.ts`) and is applied in stores or route handlers.

**Authentication:** NextAuth configuration lives in `apps/web/auth.ts`; the session provider wraps all pages in `apps/web/app/layout.tsx`, while server routes enforce `session.user.id` or `session.user.role === 'staff'` for protected capabilities.

---

*Architecture analysis: 2026-07-25*
