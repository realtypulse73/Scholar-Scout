## Project Document Index

Before starting any task, read [PROJECT-INDEX.md](PROJECT-INDEX.md) and then open the documents its “Read when” column identifies for the task. Treat the index as the canonical document map, keep it current whenever an important project document changes, and distinguish active sources of truth from historical evidence.

<!-- GSD:project-start source:PROJECT.md -->

## Project

**Scholar Scout**

Scholar Scout is a web application that helps students explore higher-education pathways, compare programmes, understand fit, and make more informed next-step decisions. It combines a programme catalogue, personalised onboarding and recommendations, simulations, community-oriented features, and optional advisor guidance.

**Core Value:** Students can confidently discover and act on the education pathways that fit their goals and circumstances.

### Constraints

- **Tech stack**: Retain the Next.js 15, React 18, TypeScript, NextAuth, and Vercel foundation — avoid unnecessary platform churn.
- **Data safety**: Do not risk production data while replacing whole-document persistence — use incremental, tested migration boundaries.
- **Delivery**: Preserve and validate the existing in-progress feature work — do not overwrite or silently absorb it into unrelated changes.
- **Operations**: CI must become a reliable quality gate before it is used for release decisions.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- TypeScript 5.x - application, API routes, React components, server data adapters, and Jest tests in `apps/web/`.
- JavaScript (ES modules) - Node.js services and operational tooling in `services/http-data-service/`, `services/codex-webhook-runner/`, and `scripts/`.
- CSS - global styles in `apps/web/app/globals.css`, processed with Tailwind/PostCSS configuration in `apps/web/tailwind.config.ts` and `apps/web/postcss.config.mjs`.
- YAML - CI, production readiness, monitoring, and automation workflows in `.github/workflows/`.
- JSON - workspace metadata in `package.json`, deployment configuration in `vercel.json`, and the optional persisted ScholarScout document managed by `apps/web/lib/server/data-store.ts`.

## Runtime

- Node.js 20.x - the bounded Phase 1 compatibility baseline required by the root workspace and both standalone services in `package.json`, `services/http-data-service/package.json`, and `services/codex-webhook-runner/package.json`; the accountable Node 24 LTS upgrade decision is recorded in `docs/adr/0001-node-runtime-upgrade.md`.
- Browser/Edge-facing runtime - Next.js App Router pages and route handlers in `apps/web/app/` run through the Next.js server build configured by `apps/web/next.config.mjs`.
- pnpm 10.34.5 - pinned by `packageManager` and `engines` in `package.json` and selected through Corepack; root scripts use pnpm workspace filters.
- Lockfile: the committed root `pnpm-lock.yaml` is the sole authoritative dependency lockfile for every workspace.

## Frameworks

- Next.js 15.5.15 - full-stack web framework and App Router, used by `apps/web/app/` and configured in `apps/web/next.config.mjs`.
- React 18 - UI component runtime for `apps/web/components/` and `apps/web/app/`.
- Auth.js / NextAuth.js 4.24.14 - JWT session and provider integration configured in `apps/web/auth.ts` and served at `apps/web/app/api/auth/[...nextauth]/route.ts`.
- Tailwind CSS 3.4.1 - utility styling scanned from `apps/web/app/` and `apps/web/components/`, with theme tokens in `apps/web/tailwind.config.ts`.
- Jest 30.3.0 with Next.js integration (`next/jest`) - browser-like component and route tests configured in `apps/web/jest.config.ts`.
- Testing Library (`@testing-library/react`, `@testing-library/user-event`, and `@testing-library/jest-dom`) - React interaction and assertion support declared in `apps/web/package.json`.
- Node built-in test runner - standalone HTTP service tests in `services/http-data-service/test/server.test.mjs`.
- TypeScript 5.x - strict, no-emit compilation for the web workspace configured in `apps/web/tsconfig.json`.
- ESLint 8 with `eslint-config-next` - linting command and Next core-web-vitals/TypeScript rules configured in `apps/web/package.json` and `apps/web/.eslintrc.json`.
- PostCSS 8 - Tailwind processing configured in `apps/web/postcss.config.mjs`.
- GitHub Actions - CI and production operational jobs in `.github/workflows/ci.yml`, `.github/workflows/production-readiness.yml`, and `.github/workflows/production-monitor.yml`.

## Key Dependencies

- `next` 15.5.15 - renders pages and executes route handlers under `apps/web/app/`; source version is declared in `apps/web/package.json`.
- `react` / `react-dom` 18 - renders the client UI in `apps/web/components/`; versions are declared in `apps/web/package.json`.
- `next-auth` 4.24.14 - implements credentials, GitHub, and Google sign-in in `apps/web/auth.ts`.
- `@vercel/blob` 2.3.3 - dynamically imported for the optional durable Blob-backed data adapter in `apps/web/lib/server/data-store.ts`.
- `openai` 6.10.0 - declared in `apps/web/package.json`; the current advisor route uses a direct Responses API `fetch` instead of this SDK in `apps/web/app/api/advisor-chat/route.ts`.
- Node.js built-ins (`node:http`, `node:fs/promises`, `node:crypto`) - implement the local HTTP data fixture in `services/http-data-service/src/server.mjs` and GitHub webhook runner in `services/codex-webhook-runner/src/server.mjs`.
- `ts-node` 10.9.2 - root development dependency declared in `package.json`.

## Configuration

- Runtime settings are read from `process.env` in `apps/web/auth.ts`, `apps/web/lib/server/data-store.ts`, `apps/web/app/api/advisor-chat/route.ts`, service entrypoints, and production scripts. Example environment files exist at `.env.prelaunch.local.example` and `.env.production.example`; their contents are not part of this analysis.
- Authentication uses `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, optional OAuth pairs `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` and `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, plus `SCHOLARSCOUT_STAFF_EMAILS`; requirements are enforced by `scripts/production-env-check.mjs`.
- Data storage is selected with `SCHOLARSCOUT_DATA_ADAPTER` in `apps/web/lib/server/data-store.ts`: `json` (default local file, optionally `SCHOLARSCOUT_DATA_FILE`), `http` (`SCHOLARSCOUT_DATA_SERVICE_URL` and optional `SCHOLARSCOUT_DATA_SERVICE_TOKEN`), or `vercel-blob` (`SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN` or `BLOB_READ_WRITE_TOKEN`, with optional `SCHOLARSCOUT_BLOB_DATA_PATH`).
- The optional advisor uses `OPENAI_API_KEY` and optional `OPENAI_MODEL` in `apps/web/app/api/advisor-chat/route.ts`.
- Production readiness and smoke-monitor settings are defined in `scripts/production-env-check.mjs` and consumed by `.github/workflows/production-readiness.yml` and `.github/workflows/production-monitor.yml`.
- Root workspace scripts and workspace topology are configured in `package.json`; web scripts live in `apps/web/package.json`.
- Next.js configuration is intentionally minimal in `apps/web/next.config.mjs`; TypeScript path alias `@/*` resolves from `apps/web/` in `apps/web/tsconfig.json`.
- CI enables Corepack and runs `pnpm install --frozen-lockfile --ignore-scripts` before each named quality command in `.github/workflows/ci.yml`.
- Vercel builds from the repository root with `pnpm install --frozen-lockfile --ignore-scripts` and `pnpm build:vercel`, configured in `vercel.json` and documented in `docs/vercel-deployment.md`.
- Tailwind theme and content globs are configured in `apps/web/tailwind.config.ts`; PostCSS points at the JavaScript Tailwind config in `apps/web/postcss.config.mjs`.

## Platform Requirements

- Node.js 20.x and Corepack-selected `pnpm@10.34.5` are required by `package.json`. From the repository root, run `corepack enable`, then install only with `pnpm install --frozen-lockfile --ignore-scripts`; use `pnpm --filter @scholar-scout/web run dev` for the web workspace.
- To exercise the HTTP data contract locally, run `pnpm --filter @scholar-scout/http-data-service run dev`; start the webhook runner with `pnpm --filter @scholar-scout/codex-webhook-runner run start`. The HTTP service endpoint is described in `docs/http-data-adapter-runbook.md`.
- No Docker dependency is required for current development or the Vercel build path; the supported Docker-free commands are documented in `docs/docker-free-development.md`.
- Vercel is the configured hosting target for the Next.js web app via `vercel.json` and `docs/vercel-deployment.md`.
- Durable production storage must use the Vercel Blob or HTTP adapter; `scripts/production-env-check.mjs` rejects the local JSON adapter for production readiness.
- GitHub Actions runs web quality, production readiness, and scheduled production smoke checks through `.github/workflows/ci.yml`, `.github/workflows/production-readiness.yml`, and `.github/workflows/production-monitor.yml`.

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Naming Patterns

- Put App Router entry files at their framework-defined names: `page.tsx`, `layout.tsx`, and `route.ts` under `apps/web/app/`, for example `apps/web/app/programmes/[id]/page.tsx` and `apps/web/app/api/admin/programmes/route.ts`.
- Name React component files in PascalCase, matching the component they export: `apps/web/components/onboarding/StepSupportNeeds.tsx`, `apps/web/components/ui/Button.tsx`, and `apps/web/components/shortlist/ShortlistButton.tsx`.
- Name domain-library modules in lowercase kebab case, such as `apps/web/lib/onboarding-validation.ts`, `apps/web/lib/pathway-score.ts`, and `apps/web/lib/server/data-store.ts`.
- Name Node service source entry points `server.mjs`, as in `services/http-data-service/src/server.mjs` and `services/codex-webhook-runner/src/server.mjs`.
- Name tests `*.test.ts`, `*.test.tsx`, or `*.test.mjs`; preserve the production area in the test path, for example `apps/web/__tests__/lib/onboarding-validation.test.ts` for `apps/web/lib/onboarding-validation.ts`.
- Use camelCase verbs for functions: `validateStep`, `toggleShortlistId`, `readScholarScoutData`, and `createScholarScoutDataService` in `apps/web/lib/onboarding-validation.ts`, `apps/web/lib/shortlist.ts`, `apps/web/lib/server/data-store.ts`, and `services/http-data-service/src/server.mjs`.
- Use `handle*` for request/event helpers and `get*`, `parse*`, `normalize*`, `is*`, `format*`, or `validate*` for their respective operations. Examples include `handleWrite`, `parseShortlist`, `normalizeShortlistIds`, `isPlanStatus`, and `formatCount`.
- Use `on*` names for callback props (`onChange` in `apps/web/components/onboarding/StepSupportNeeds.tsx`) and short action names for local handlers (`toggle` in the same file).
- Use camelCase for ordinary variables, parameters, state setters, and local arrays: `errorSteps`, `withoutNone`, `currentRevision`, and `fetchMock`.
- Use SCREAMING_SNAKE_CASE for exported/static domain constants, labels, and browser storage keys, for example `TOTAL_STEPS` in `apps/web/lib/onboarding-types.ts`, `SUPPORT_NEEDS` in `apps/web/components/onboarding/StepSupportNeeds.tsx`, and `SHORTLIST_STORAGE_KEY` in `apps/web/lib/shortlist.ts`.
- Keep component-local configuration arrays camelCase where they are not module-wide constants, as in `steps`, `interests`, and `gpaBands` in `apps/web/components/onboarding/OnboardingWizard.tsx`.
- Name interfaces and type aliases in PascalCase: `OnboardingData`, `ValidationError`, `ScholarScoutDataStore`, and `ProgrammeRevisionConflictError` in `apps/web/lib/`.
- Prefer precise union types and `Record` mappings for finite domain values, for example `ShortlistPlanStatus` and `SHORTLIST_PLAN_STATUS_LABELS` in `apps/web/lib/shortlist.ts`.
- Name component-prop interfaces `*Props` when the component name makes that clearer (`ButtonProps`, `StaffGateProps`, `ProgrammeAdminManagerProps`); small step components may use `Props`, as in `apps/web/components/onboarding/StepSupportNeeds.tsx`.

## Code Style

- No Prettier or Biome configuration is detected. Match the established source style in `apps/web/components/ui/Button.tsx` and `apps/web/lib/onboarding-validation.ts`: two-space indentation, single quotes, semicolons, trailing commas in multiline lists/calls, and parentheses around multiline function parameters.
- Break long imports, JSX props, object literals, and function calls across lines with one item per line when this preserves readability. `apps/web/app/api/admin/programmes/route.ts` and `apps/web/components/onboarding/StepSupportNeeds.tsx` are the reference patterns.
- Use Tailwind utility strings directly in JSX. Compose conditional class lists with template literals when state controls a small variant, as in `apps/web/components/onboarding/StepSupportNeeds.tsx`; use `classNames` from `apps/web/lib/class-names.ts` for reusable UI primitives, as in `apps/web/components/ui/Button.tsx`.
- Retain accessibility attributes alongside interactive controls (`type`, `aria-*`, visible focus classes) as in `apps/web/components/onboarding/StepSupportNeeds.tsx` and `apps/web/components/ui/Button.tsx`.
- Run `pnpm --filter @scholar-scout/web run lint` for web changes. `apps/web/package.json` runs ESLint for `.ts` and `.tsx` files with `--max-warnings=0`.
- Follow `apps/web/.eslintrc.json`, which extends `next/core-web-vitals` and `next/typescript`; it ignores generated `next-env.d.ts`.
- Keep TypeScript strict. `apps/web/tsconfig.json` enables `strict`, uses `isolatedModules`, and disallows emitted application files with `noEmit`.

## Import Organization

- Use `import type` for type-only imports when they are separate from runtime imports, as in `apps/web/lib/onboarding-validation.ts` and `apps/web/components/ui/Button.tsx`. A mixed runtime/type import is also used where it improves locality, as in `apps/web/app/api/admin/programmes/route.ts`.
- In `apps/web`, use `@/*` for files rooted at `apps/web/`, configured in `apps/web/tsconfig.json`. Prefer `@/lib/...`, `@/components/...`, and `@/app/...` over long relative paths.
- Do not use the `@/` alias from Node services; they use standard relative imports and `node:` built-ins.

## Error Handling

- Pure validation functions return domain-friendly sentinel values instead of throwing for expected invalid user input: `validateStep` returns `ValidationError | null`, while `validateAll` returns error step numbers in `apps/web/lib/onboarding-validation.ts`.
- Throw `Error` for violated configuration or persistence invariants, and use a dedicated error class when callers need structured recovery. `apps/web/lib/server/data-store.ts` throws configuration/validation errors and exposes `ProgrammeRevisionConflictError`, which `apps/web/app/api/admin/programmes/route.ts` converts to a `409` JSON response.
- In route handlers, authenticate/validate early and return `NextResponse.json` with an explicit HTTP status for expected failures. Follow the `403`, `400`, and `409` branches in `apps/web/app/api/admin/programmes/route.ts`; let unexpected errors propagate to the framework rather than masking them.
- In client fetch flows, reject a non-OK response with its user-facing message and catch it into component state, as in `apps/web/components/peer-community/PeerCommunity.tsx` and `apps/web/components/advisor/AdvisorChat.tsx`.
- In Node HTTP services, catch request-level operational failures and return a non-sensitive JSON error with the appropriate status. `services/http-data-service/src/server.mjs` maps malformed JSON to `400` and unexpected failures to `500`.

## Logging

- Log server startup with `console.log`, as in `services/http-data-service/src/server.mjs` and `services/codex-webhook-runner/src/server.mjs`.
- Use `console.warn` only for configuration degradation that allows the service to continue, as in `services/codex-webhook-runner/src/server.mjs`.
- Do not add routine `console` logging to web components or App Router handlers; return structured responses and surface UI errors instead.

## Comments

- Use short inline comments to explain a non-obvious rule or branch, not to restate the code. The exclusivity behavior in `apps/web/components/onboarding/StepSupportNeeds.tsx` and the optional validation rule in `apps/web/lib/onboarding-validation.ts` are the pattern.
- Keep generated framework files untouched. `apps/web/next-env.d.ts` explicitly marks itself as generated.
- Add concise JSDoc to exported domain functions whose contract or units are not self-evident. `apps/web/lib/onboarding-validation.ts`, `apps/web/lib/outcome-profiles.ts`, `apps/web/lib/fairness-audit.ts`, and `apps/web/lib/pathway-score.ts` document return semantics and assumptions.
- Avoid JSDoc for simple components or obvious value objects; use expressive types and names there.

## Function Design

- Keep reusable domain logic as small exported pure functions with private helpers beneath them, as in `apps/web/lib/shortlist.ts` and `apps/web/lib/shadow-mode.ts`.
- Keep route exports limited to HTTP-method handlers (`GET`, `POST`, `DELETE`) and delegate validation/storage to `apps/web/lib/`, as demonstrated by `apps/web/app/api/admin/programmes/route.ts`.
- When a feature component requires several tightly coupled render helpers, keep them private in the same file, following `apps/web/components/onboarding/OnboardingWizard.tsx`.
- Give public functions explicit TypeScript parameter and return types when the result is not evident from a primitive, especially for domain data and type guards (`apps/web/lib/onboarding-validation.ts`, `apps/web/lib/shortlist.ts`).
- Prefer a typed object parameter for multi-option construction, as in `createScholarScoutDataService` in `services/http-data-service/src/server.mjs`.
- Return `null` for an absent optional result or successful validation; return `[]` for an empty result collection; reserve thrown errors for invalid invariant/configuration states.
- Use JSON objects with stable `ok`, `error`, `errors`, `records`, or named payload fields for API responses, as in `apps/web/app/api/admin/programmes/route.ts` and `services/http-data-service/src/server.mjs`.

## Module Design

- Prefer named exports for library functions, domain types, constants, and route handlers, as in `apps/web/lib/onboarding-validation.ts` and `apps/web/lib/server/data-store.ts`.
- Default-export single React components, as in `apps/web/components/ui/Button.tsx` and `apps/web/components/onboarding/StepSupportNeeds.tsx`.
- Keep server-only data access under `apps/web/lib/server/` and import it only from server routes/pages or server-side helpers.
- Use a focused barrel only for cohesive UI primitives: `apps/web/components/ui/index.ts` re-exports the UI components.
- Do not introduce broad feature- or application-wide barrels; import domain modules from their explicit `@/lib/...` paths.

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## System Overview

```text

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

- Place URL-routed rendering and API endpoints under `apps/web/app`; filesystem names determine App Router routes.
- Keep browser state in explicitly marked client components (`'use client'`) under `apps/web/components`; invoke server capabilities through route handlers.
- Keep reusable business rules and static/seed domain data in `apps/web/lib`, and isolate Node-only persistence code in `apps/web/lib/server` via `import 'server-only'`.
- Treat `ScholarScoutDataStore` in `apps/web/lib/server/data-store.ts` as the persistence port; adapter selection remains an environment concern.
- Keep independently runnable processes in `services/<service>/src/server.mjs`, each with its own workspace `package.json`.

## Layers

- Purpose: Render pages and establish the public, account, admin, and API route topology.
- Location: `apps/web/app/`
- Contains: App Router `page.tsx`, `layout.tsx`, and `route.ts` files.
- Depends on: `apps/web/components`, `apps/web/lib`, `apps/web/lib/server`, and `apps/web/auth.ts`.
- Used by: Next.js runtime and browser navigation.
- Purpose: Render feature-specific controls, retain transient browser state, and call internal APIs.
- Location: `apps/web/components/`
- Contains: Feature folders such as `onboarding`, `programmes`, `shortlist`, `feed`, `recommendations`, `admin`, and `auth`.
- Depends on: `apps/web/lib` types/helpers, `next-auth/react`, and internal `/api` endpoints.
- Used by: App Router pages in `apps/web/app/**/page.tsx`.
- Purpose: Model programme content and implement deterministic matching, simulation, decision, validation, and formatting rules.
- Location: `apps/web/lib/`
- Contains: `programmes.ts`, `preference-matching.ts`, `platform.ts`, `simulations.ts`, `career-simulations.ts`, `onboarding-*.ts`, and feature-specific helpers.
- Depends on: TypeScript/standard library only, except server modules that use Node APIs.
- Used by: Pages, components, API routes, and server stores.
- Purpose: Enforce data-store boundaries and persist accounts, profiles, programme governance, analytics, simulation activity, and backups.
- Location: `apps/web/lib/server/`
- Contains: `data-store.ts`, `platform-store.ts`, and `programme-records.ts`.
- Depends on: Node `crypto`/`fs`, optional `@vercel/blob`, `apps/web/lib`, and an optional HTTP service.
- Used by: Server pages, route handlers, and `apps/web/auth.ts`.
- Purpose: Supply optional process boundaries outside the Next.js deployment.
- Location: `services/http-data-service/` and `services/codex-webhook-runner/`.
- Contains: Native Node HTTP servers and service-specific package manifests.
- Depends on: Node standard APIs; the webhook runner additionally communicates with GitHub and an optional agent endpoint.
- Used by: The HTTP data adapter and GitHub webhook delivery, respectively.

## Data Flow

### Primary Request Path: programme discovery and matching

### Account-backed onboarding path

### Engagement, simulation, and recommendation path

### Persistence adapter path

- Server-rendered pages pass serializable initial data as props; NextAuth supplies client session state through `apps/web/components/auth/AuthSessionProvider.tsx`.
- Client features use React `useState`, `useEffect`, `useMemo`, and browser storage for transient state; no central browser state store is present.
- Durable application state is a single `ScholarScoutData` document accessed through `apps/web/lib/server/data-store.ts` and extended as `PlatformData` in `apps/web/lib/server/platform-store.ts`.

## Key Abstractions

- Purpose: Small read/write persistence interface for the complete ScholarScout document.
- Examples: `JsonScholarScoutDataStore`, `HttpScholarScoutDataStore`, and `VercelBlobScholarScoutDataStore` in `apps/web/lib/server/data-store.ts`.
- Pattern: Port-and-adapter selection with a process-local lazy singleton.
- Purpose: The canonical persisted document models account data, programme records, audit events, and engagement data.
- Examples: `apps/web/lib/server/data-store.ts:51` and `apps/web/lib/server/platform-store.ts:77`.
- Pattern: A base document extended by feature-owned optional collections; normalize absent collections in `readPlatformData`.
- Purpose: Produce the catalogue used by discovery and recommendations by combining immutable seed data with staff records.
- Examples: `apps/web/lib/programmes.ts`, `apps/web/lib/server/programme-records.ts`.
- Pattern: Read-time merge; use `getGovernedProgrammes` rather than importing the seed collection directly when managed edits must appear.
- Purpose: Centralize credential/OAuth provider configuration, session claims, and account provisioning.
- Examples: `apps/web/auth.ts`, `apps/web/app/api/auth/[...nextauth]/route.ts`.
- Pattern: One exported `authOptions` object reused by route handlers and server pages.

## Entry Points

- Location: `apps/web/app/layout.tsx` and `apps/web/app/**/page.tsx`.
- Triggers: Next.js App Router requests.
- Responsibilities: Compose layouts, render server pages, initialize session-provider coverage, and expose UI routes.
- Location: `apps/web/app/api/**/route.ts`.
- Triggers: Internal browser `fetch` calls and external HTTP requests.
- Responsibilities: Authenticate where a user or staff role is required, validate route inputs, invoke server/domain modules, and return JSON.
- Location: `services/http-data-service/src/server.mjs`.
- Triggers: `pnpm --filter @scholar-scout/http-data-service run dev` or `pnpm --filter @scholar-scout/http-data-service run start`.
- Responsibilities: Serve health checks and the normalized ScholarScout document contract for the HTTP persistence adapter.
- Location: `services/codex-webhook-runner/src/server.mjs`.
- Triggers: `pnpm --filter @scholar-scout/codex-webhook-runner run start` or GitHub webhook delivery to `/github/webhook`.
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

### Creating another simulation UI namespace

## Error Handling

- Return `NextResponse.json({ error: ... }, { status })` for input, authorization, and request failures, as in `apps/web/app/api/account/shortlist/route.ts`.
- Use typed domain errors where a client needs recoverable detail; `ProgrammeRevisionConflictError` is translated to `409` in `apps/web/app/api/admin/programmes/route.ts`.
- Fail adapter misconfiguration immediately in `getScholarScoutDataStore` (`apps/web/lib/server/data-store.ts:672`) and expose configuration status through the admin data routes.
- Return the deterministic advisor reply when the optional OpenAI request fails in `apps/web/app/api/advisor-chat/route.ts`.

## Cross-Cutting Concerns

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
