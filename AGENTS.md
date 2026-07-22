<!-- GSD:project-start source:PROJECT.md -->

## Project

**ScholarScout PRD Recovery**

ScholarScout is a rejection-free postsecondary matching platform for students seeking realistic, affordable, and supportive education or training pathways. It compares colleges, community colleges, trade schools, certificates, apprenticeships, military and civil-service routes, online programmes, and selected international options while asking where a student is most likely to get in, afford attendance, stay, finish, and act on the recommendation.

This brownfield recovery rebuilds the June 19, 2026 prelaunch MVP requirements on top of the surviving GitHub codebase. The uploaded PRD is the minimum recovery contract; continuing research and evidence may improve implementation, safety, clarity, reliability, and launch readiness without weakening that contract.

**Core Value:** Give each student an explainable, evidence-backed pathway ranking that balances access, affordability, persistence, completion, support, and actionable next steps without using protected traits to reduce opportunity.

### Constraints

- **Recovery fidelity**: Every capability in the uploaded June 19 PRD must be represented by a testable requirement and roadmap phase.
- **Fairness**: Protected traits may only be used for auditing, support/resource matching, aggregate calibration, and transparent explanations; they cannot reduce opportunity.
- **Explainability**: Rankings must expose model version, material inputs, component scores, uncertainty, reasons, and audit metadata.
- **Governance**: Algorithm and criteria changes require draft/active separation, evaluation, human approval, version history, rollback, and immutable evidence.
- **Privacy and minors**: No live pilot with sensitive student data until identity, authorization, retention, consent, export/deletion, and compliance controls are reviewed.
- **Brownfield compatibility**: Preserve useful working features and repository conventions while replacing fragile foundations incrementally.
- **Source control**: Verified increments are committed atomically and pushed promptly to the recovery branch; secrets and generated artifacts remain untracked.
- **Pilot first**: Launch readiness means a controlled 25–50-student pilot, not immediate unrestricted public availability.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- TypeScript 5.x - Next.js pages, API route handlers, React components, domain logic, server storage adapters, and Jest tests under `apps/web/`.
- JavaScript (ECMAScript modules) - repository automation and the two lightweight Node services under `scripts/` and `services/`.
- CSS - global design tokens and application styling in `apps/web/app/globals.css`.
- PowerShell - portable Node/npm bootstrapping on Windows in `scripts/use-portable-node.ps1` and `scripts/npm-portable.ps1`.
- YAML - GitHub Actions workflows in `.github/workflows/`.

## Runtime

- Node.js 20.x - declared in `package.json` and `services/codex-webhook-runner/package.json`; Vercel and GitHub Actions are configured for Node 20.
- Browser runtime - React client components use browser APIs and call same-origin Next.js endpoints from `apps/web/components/` and `apps/web/app/feed/page.tsx`.
- Next.js server runtime - server components, route handlers, authentication, persistence, and OpenAI requests run from `apps/web/app/`, `apps/web/auth.ts`, and `apps/web/lib/server/`.
- npm 10.x - authoritative workspace manager declared by `packageManager` and `engines` in `package.json`.
- Lockfile: present at `package-lock.json`; use it from the repository root for reproducible workspace installs.
- A secondary pnpm lock/workspace file exists at `apps/web/pnpm-lock.yaml` and `apps/web/pnpm-workspace.yaml`, but root scripts, CI, and deployment use npm; do not update pnpm metadata unless deliberately standardizing package management.

## Frameworks

- Next.js ^15.5.15 - App Router web application, server rendering, server components, and HTTP route handlers in `apps/web/app/`.
- React ^18 and React DOM ^18 - interactive UI under `apps/web/components/` and client pages such as `apps/web/app/feed/page.tsx`.
- NextAuth.js ^4.24.14 - JWT sessions, credentials authentication, and optional OAuth in `apps/web/auth.ts` and `apps/web/app/api/auth/[...nextauth]/route.ts`.
- Tailwind CSS ^3.4.1 with PostCSS ^8 - styling pipeline configured by `apps/web/tailwind.config.ts` and `apps/web/postcss.config.mjs`.
- Jest ^30.3.0 - web unit, component, and route tests configured in `apps/web/jest.config.ts`.
- Testing Library React ^16.3.2, jest-dom ^6.9.1, and user-event ^14.6.1 - DOM/component assertions under `apps/web/__tests__/`.
- Node built-in test runner - service and production-tooling tests in `services/http-data-service/test/server.test.mjs` and `scripts/test-production-tooling.mjs`.
- Next.js CLI - `next dev`, `next build`, and `next start` in `apps/web/package.json`.
- TypeScript compiler ^5 - strict no-emit validation configured by `apps/web/tsconfig.json`.
- ESLint ^8 with eslint-config-next ^15.5.15 - linting for `.ts` and `.tsx` through `apps/web/package.json`.
- ts-jest ^29.4.9 and ts-node ^10.9.2 - TypeScript Jest configuration and transforms in `apps/web/jest.config.ts`.

## Key Dependencies

- `next` ^15.5.15 - owns routing, rendering, compilation, and API endpoints for `apps/web/`.
- `next-auth` ^4.24.14 - owns identity/session integration through `apps/web/auth.ts`.
- `@vercel/blob` ^2.3.3 - optional durable JSON document persistence selected by `apps/web/lib/server/data-store.ts`.
- `openai` ^6.10.0 - declared in `apps/web/package.json`; the current advisor implementation calls the Responses REST endpoint directly from `apps/web/app/api/advisor-chat/route.ts` rather than using the SDK.
- Native Node `http`, `fs/promises`, and `crypto` - implement the no-dependency HTTP data fixture in `services/http-data-service/src/server.mjs`, webhook runner in `services/codex-webhook-runner/src/server.mjs`, local JSON adapter, password hashing, and webhook verification.
- Vercel configuration - deploys the web workspace using root `vercel.json` and `npm run build:vercel` from `package.json`.

## Configuration

- Environment is read only on server-side code, chiefly `apps/web/auth.ts`, `apps/web/lib/server/data-store.ts`, `apps/web/app/api/advisor-chat/route.ts`, and the services under `services/`.
- Example templates are present as `.env.production.example` and `.env.prelaunch.local.example`; their contents were not inspected. Store real values in deployment settings or an uncommitted local environment file.
- Select persistence with `SCHOLARSCOUT_DATA_ADAPTER`: `json` (default), `http`, or `vercel-blob`, as implemented in `apps/web/lib/server/data-store.ts`.
- Configure TypeScript imports through the `@/*` alias in `apps/web/tsconfig.json`; resolve it relative to `apps/web/`.
- `package.json` - npm workspace graph, Node/npm engines, root quality commands, production scripts, and Vercel build entry.
- `apps/web/next.config.mjs` - minimal Next.js configuration.
- `apps/web/tsconfig.json` - strict TypeScript, bundler module resolution, ES2017 target, and `@/*` alias.
- `apps/web/tailwind.config.ts` and `apps/web/postcss.config.mjs` - CSS processing.
- `apps/web/jest.config.ts` and `apps/web/jest.setup.ts` - jsdom tests and DOM matchers.
- `vercel.json` - root install/build commands and `apps/web/.next` output.

## Platform Requirements

- Use Node.js 20.x and npm 10.x from the repository root; install with `npm install` or the deployment-compatible `npm install --ignore-scripts`.
- Start the web application with `npm run dev`; start the local HTTP persistence fixture separately with `npm run dev --workspace @scholar-scout/http-data-service` when exercising the HTTP adapter.
- Use `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build:web` as the baseline gates defined in `package.json`.
- Windows environments without a global Node installation can use `scripts/use-portable-node.ps1` and `scripts/npm-portable.ps1`.
- Vercel is the documented web target in `vercel.json` and `docs/vercel-deployment.md`, building from the repository root on Node 20.x.
- Production persistence must use a durable adapter (`vercel-blob` or compatible `http` service); the default JSON adapter in `apps/web/lib/server/data-store.ts` writes local process storage and is explicitly non-durable.
- The standalone services in `services/http-data-service/` and `services/codex-webhook-runner/` require their own Node 20-compatible hosts if deployed; they are not part of the Vercel web build.

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Naming Patterns

- Use PascalCase for React component files, matching the exported component: `apps/web/components/onboarding/OnboardingWizard.tsx` and `apps/web/components/ui/Button.tsx`.
- Use lowercase kebab-case for domain modules and route directories: `apps/web/lib/preference-matching.ts`, `apps/web/lib/server/data-store.ts`, and `apps/web/app/api/advisor-chat/route.ts`.
- Use Next.js App Router reserved names (`page.tsx`, `layout.tsx`, `route.ts`) under `apps/web/app/`.
- Name Jest tests `*.test.ts` or `*.test.tsx` and group them by concern under `apps/web/__tests__/lib/`, `apps/web/__tests__/components/`, and `apps/web/__tests__/api/`.
- Name Node service tests `*.test.mjs`, as in `services/http-data-service/test/server.test.mjs`.
- Use camelCase verbs that state the operation: `rankProgrammesForProfile` in `apps/web/lib/preference-matching.ts`, `saveProgrammeRecord` in `apps/web/lib/server/data-store.ts`, and `validateProgrammeDraft` in `apps/web/lib/admin-programmes.ts`.
- Use `get*`, `save*`, `parse*`, `serialize*`, `validate*`, and `build*` prefixes consistently for queries, mutations, transforms, validation, and assembly.
- Name React components and their default-exported functions in PascalCase, matching their files, as in `apps/web/components/ui/Button.tsx`.
- Name Next.js route handlers with uppercase HTTP verbs (`GET`, `POST`, `DELETE`) in `apps/web/app/api/**/route.ts`.
- Use camelCase for local values and parameters (`currentRevision`, `programmeId`, `searchParams`).
- Use SCREAMING_SNAKE_CASE for exported constants and stable fixtures: `ONBOARDING_PROFILE_STORAGE_KEY` in `apps/web/lib/preference-matching.ts`, `PROGRAMME_PAGE_SIZE` in `apps/web/lib/pagination.ts`, and `PROFILE` in `apps/web/__tests__/lib/preference-matching.test.ts`.
- Use plural nouns for collections (`programmes`, `auditEvents`, `restoreBackups`) and `*ById` for lookup maps.
- Use PascalCase for type aliases, interfaces, and classes: `OnboardingData` in `apps/web/lib/onboarding-types.ts`, `ProgrammeAdminManagerProps` in `apps/web/components/admin/ProgrammeAdminManager.tsx`, and `ProgrammeRevisionConflictError` in `apps/web/lib/server/data-store.ts`.
- Use `Props` only for small, file-local component contracts; use a component-qualified name for public or complex contracts, as shown in `apps/web/components/onboarding/StepInterests.tsx` and `apps/web/components/programmes/ProgrammeResults.tsx`.
- Use string-literal unions for finite domain states, such as `ProgrammePublicationStatus` in `apps/web/lib/programmes.ts`.

## Code Style

- No dedicated Prettier or formatter configuration is present. Preserve the established style in `apps/web/`: two-space indentation, single quotes, semicolons, trailing commas in multiline constructs, and one logical expression per line when wrapping.
- Keep JSX props one per line when a call spans multiple lines, as in `apps/web/components/onboarding/StepInterests.tsx`.
- Prefer early returns over nested conditionals in handlers and validators, as in `apps/web/app/api/admin/programmes/route.ts`.
- Use ESLint 8 through `npm run lint`; the web workspace config is `apps/web/.eslintrc.json`.
- Follow `next/core-web-vitals` and `next/typescript`; linting is configured with `--max-warnings=0` in `apps/web/package.json`.
- Keep TypeScript strict and no-emit clean according to `apps/web/tsconfig.json`; run `npm run typecheck` before integrating changes.

## Import Organization

- Use `@/*` for files rooted at `apps/web/`, configured in `apps/web/tsconfig.json`; examples include `@/lib/programmes` and `@/components/onboarding/OnboardingWizard`.
- Use `import type` or inline `type` modifiers for type-only imports, as in `apps/web/components/ui/Button.tsx` and `apps/web/__tests__/lib/data-store.test.ts`.

## Error Handling

- Validate input and authorization at API boundaries, then return `NextResponse.json` with explicit HTTP status codes, as in `apps/web/app/api/admin/programmes/route.ts`.
- Use domain-specific `Error` subclasses for recoverable conflicts that callers must distinguish, such as `ProgrammeRevisionConflictError` and `ScholarScoutDataRestoreError` in `apps/web/lib/server/data-store.ts`.
- Catch only errors that can be translated or recovered; rethrow unexpected errors so platform handling remains active, as in `apps/web/app/api/admin/programmes/route.ts`.
- Return `null` or an empty normalized value for malformed optional browser storage data, as in `apps/web/lib/preference-matching.ts` and `apps/web/lib/local-auth.ts`.
- In client components, wrap network and storage operations in `try`/`catch` and surface user-readable state; follow `apps/web/components/advisor/AdvisorChat.tsx` and `apps/web/components/admin/ProgrammeAdminManager.tsx`.

## Logging

- No centralized application logger is present. Use console output primarily in operational scripts and service startup/error paths under `scripts/` and `services/`.
- Avoid logging secrets, bearer tokens, passwords, complete environment values, or persisted user records. Production tooling explicitly checks redaction in `scripts/test-production-tooling.mjs`.
- API routes generally communicate failures through HTTP responses rather than logging, as in `apps/web/app/api/admin/programmes/route.ts`.

## Comments

- Comment only where runtime behavior or environment choice is not self-evident. Keep implementation code readable through names and small helpers, following `apps/web/lib/preference-matching.ts`.
- Use file-level environment directives where required, such as `@jest-environment node` in `apps/web/__tests__/api/admin-data-routes.test.ts`.
- JSDoc is not a routine API-documentation convention. Use it for tool-facing configuration or framework typing only, as in `apps/web/next.config.mjs`; express normal contracts with TypeScript types.

## Function Design

## Module Design

- Default-export React components and Next.js page components; use named exports for domain functions, constants, types, metadata, and route handlers.
- Keep server-only persistence logic under `apps/web/lib/server/`; do not import it into client components.
- Keep shared domain logic pure where possible in `apps/web/lib/`, so it remains directly unit-testable.
- Barrel exports are limited to cohesive public UI primitives in `apps/web/components/ui/index.ts`.
- Import domain modules directly rather than creating broad barrels; examples throughout `apps/web/app/` use `@/lib/<module>`.

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## System Overview

```text
| Next.js App Router web application (`apps/web/app`)           |
| Pages / layouts   | Route handlers     | React components     |
| `app/**/page.tsx` | `app/api/**`       | `components/**`      |
| Domain and application logic (`apps/web/lib`)                 |
| matching, recommendations, simulations, programmes, decisions |
| Server orchestration (`apps/web/lib/server`)                  |
| auth/account operations, platform events, governed programmes |
| Pluggable document storage                                    |
| JSON file | HTTP data service | Vercel Blob                   |
| `lib/server/data-store.ts`                                    |
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

- Use server-rendered App Router pages as composition roots; place interaction-heavy behavior in client components under `apps/web/components/`.
- Keep deterministic scoring and recommendation rules as pure functions in `apps/web/lib/`.
- Keep filesystem, network, authentication, and mutable persistence in `apps/web/lib/server/` or API route handlers.
- Share one logical ScholarScout document across JSON, HTTP, and Vercel Blob adapters through `ScholarScoutDataStore` in `apps/web/lib/server/data-store.ts`.
- Treat `apps/web/lib/programmes.ts` and `apps/web/lib/platform.ts` as in-code seed fixtures; governed programme records can override programme IDs at runtime.

## Layers

- Purpose: Render pages, navigation, forms, dashboards, feeds, simulations, and staff tools.
- Location: `apps/web/app/`, `apps/web/components/`
- Contains: Server components, client components, layouts, global styles, local fonts.
- Depends on: Domain functions, server query functions, NextAuth session state, internal API routes.
- Used by: Browser clients.
- Purpose: Expose mutations and JSON queries to client components.
- Location: `apps/web/app/api/`
- Contains: Next.js `GET`, `POST`, and `DELETE` route handlers.
- Depends on: `apps/web/auth.ts`, `apps/web/lib/server/`, `apps/web/lib/platform.ts`.
- Used by: Client components and operational probes.
- Purpose: Encode catalogue types and deterministic product behavior.
- Location: `apps/web/lib/*.ts`
- Contains: Matching, ranking, simulations, pathway plans, advisor messages, filters, validation, and utilities.
- Depends on: Domain types in sibling modules; no storage adapter should be imported here.
- Used by: Pages, components, route handlers, and server orchestration.
- Purpose: Coordinate domain functions with persistent state and external services.
- Location: `apps/web/lib/server/`, `apps/web/auth.ts`
- Contains: Data adapter selection, account operations, audit trails, platform event aggregation, programme record merging.
- Depends on: Domain layer, Node server APIs, `@vercel/blob`, NextAuth.
- Used by: Server pages, API routes, authentication callbacks.
- Purpose: Persist the complete account and platform document.
- Location: `apps/web/lib/server/data-store.ts`, `services/http-data-service/src/server.mjs`
- Contains: JSON, HTTP, and Vercel Blob adapters; local HTTP document service.
- Depends on: Local filesystem, Fetch API, or Vercel Blob.
- Used by: Server/application layer.
- Purpose: Validate environments, rehearse releases, smoke-test production, and automate issue dispatch.
- Location: `scripts/`, `services/codex-webhook-runner/`, `docs/`
- Contains: Node operational scripts, runbooks, release evidence, webhook receiver.
- Depends on: Workspace scripts, environment configuration, deployed endpoints.
- Used by: Maintainers and CI/CD.

## Data Flow

### Student Recommendation Request Path

### Platform Interaction Flow

### Account Mutation Flow

### AI Advisor Flow

- Authenticated account state is server-persisted in the `ScholarScoutData` document; NextAuth uses JWT sessions configured in `apps/web/auth.ts`.
- Some unauthenticated/local experiences use browser state via client components and `ONBOARDING_PROFILE_STORAGE_KEY` in `apps/web/lib/preference-matching.ts`.
- Persistent platform event state extends `ScholarScoutData` through `PlatformData` in `apps/web/lib/server/platform-store.ts`.
- Seed catalogue, feed, simulation, and creator content are module-level constants in `apps/web/lib/programmes.ts` and `apps/web/lib/platform.ts`.

## Key Abstractions

- Purpose: Canonical post-secondary offering plus cost, access, pathway, support, and publication metadata.
- Examples: `apps/web/lib/programmes.ts`, `apps/web/lib/admin-programmes.ts`
- Pattern: Typed domain entity with seed instances and governed overrides.
- Purpose: Student preference profile used by filters and scoring.
- Examples: `apps/web/lib/onboarding-types.ts`, `apps/web/lib/onboarding-validation.ts`
- Pattern: Shared value object validated at boundaries.
- Purpose: Carry numerical ranking together with transparent signal-level explanations.
- Examples: `apps/web/lib/preference-matching.ts`, `apps/web/lib/adaptive-recommendations.ts`
- Pattern: Pure functional scoring pipeline returning immutable result objects.
- Purpose: Abstract the read/write persistence mechanism for one logical document.
- Examples: `apps/web/lib/server/data-store.ts`
- Pattern: Interface plus runtime-selected adapter implementations.
- Purpose: Extend account data with event, simulation, memory, referral, sharing, analytics, and decision records.
- Examples: `apps/web/lib/server/platform-store.ts`
- Pattern: Additive document schema normalized on reads.

## Entry Points

- Location: `apps/web/app/layout.tsx`, `apps/web/app/page.tsx`
- Triggers: Next.js request or client navigation.
- Responsibilities: Root metadata/session provider and landing page.
- Location: `apps/web/app/api/**/route.ts`
- Triggers: HTTP requests from clients or operational tools.
- Responsibilities: Parse, authorize, call server/domain functions, serialize responses.
- Location: `apps/web/app/api/auth/[...nextauth]/route.ts`, `apps/web/auth.ts`
- Triggers: Sign-in, OAuth callback, session requests.
- Responsibilities: Provider configuration, identity persistence, JWT/session shaping.
- Location: `services/http-data-service/src/server.mjs`
- Triggers: `npm run dev --workspace @scholar-scout/http-data-service`.
- Responsibilities: Serve `/health` and authorized GET/PUT `/scholarscout` operations.
- Location: `services/codex-webhook-runner/src/server.mjs`
- Triggers: Node workspace start and GitHub webhook requests.
- Responsibilities: Signature validation, issue filtering, job packet creation, optional dispatch.
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

### Importing Storage into Client Components

### Adding Scoring Logic Inside UI Components

### Writing Partial Adapter Documents

## Error Handling

- Route handlers such as `apps/web/app/api/advisor-chat/route.ts` wrap request work in `try/catch` and avoid exposing non-Error values.
- Store adapters in `apps/web/lib/server/data-store.ts` throw descriptive errors for configuration and non-success HTTP responses.
- Validation functions such as `validateScholarScoutDataImport()` and `validateProgrammeDraft()` return structured error collections before mutation.
- Local JSON reads and service reads treat missing documents as initial empty state.
- The advisor degrades to a deterministic response when the OpenAI key or upstream response is unavailable.

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
