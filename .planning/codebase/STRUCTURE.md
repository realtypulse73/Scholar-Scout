# Codebase Structure

**Analysis Date:** 2026-07-25

## Directory Layout

```text
Scholar-Scout-main/
├── apps/
│   └── web/                         # Next.js application workspace
│       ├── app/                     # App Router pages, layouts, API route handlers
│       ├── components/              # Feature UI and reusable UI primitives
│       ├── lib/                     # Domain logic, data models, and helpers
│       │   └── server/              # Node-only persistence/application services
│       ├── __tests__/               # Jest tests grouped by api, components, and lib
│       ├── public/                  # Static images and simulation assets
│       ├── types/                   # Type augmentations
│       ├── auth.ts                  # Shared NextAuth configuration
│       └── package.json             # Web workspace scripts and dependencies
├── services/
│   ├── http-data-service/           # Optional document-store HTTP adapter service
│   └── codex-webhook-runner/        # GitHub webhook-to-agent automation service
├── packages/                        # Reserved workspace for extracted shared packages
├── scripts/                         # Repository-level production/release tooling
├── docs/                            # Operational, deployment, and product documentation
├── reports/                         # Generated local production/prelaunch reports
├── .github/workflows/               # GitHub Actions workflows
├── package.json                     # npm workspace root and shared commands
├── package-lock.json                # Root npm lockfile
├── pnpm-lock.yaml                   # Additional pnpm lockfile
└── vercel.json                      # Vercel build configuration for `apps/web`
```

## Directory Purposes

**`apps/web/app/`:**

- Purpose: Own all Next.js App Router URL segments, the root layout, global styles, and HTTP API handlers.
- Contains: `page.tsx`, dynamic route folders (`[id]`, `[slug]`, `[username]`), `route.ts`, `layout.tsx`, and `globals.css`.
- Key files: `apps/web/app/layout.tsx`, `apps/web/app/page.tsx`, `apps/web/app/api/auth/[...nextauth]/route.ts`.

**`apps/web/app/api/`:**

- Purpose: Expose internal JSON APIs under `/api`.
- Contains: Feature-named directories ending in `route.ts`; nested folders encode endpoint paths.
- Key files: `apps/web/app/api/account/onboarding/route.ts`, `apps/web/app/api/account/shortlist/route.ts`, `apps/web/app/api/admin/programmes/route.ts`, `apps/web/app/api/advisor-chat/route.ts`.

**`apps/web/components/`:**

- Purpose: Keep React UI organized by product feature, separate from route orchestration.
- Contains: Feature component folders and the reusable `ui/` primitive set.
- Key files: `apps/web/components/onboarding/OnboardingWizard.tsx`, `apps/web/components/programmes/ProgrammeResults.tsx`, `apps/web/components/auth/AuthSessionProvider.tsx`, `apps/web/components/ui/index.ts`.

**`apps/web/components/ui/`:**

- Purpose: Own low-level reusable display primitives.
- Contains: `Badge.tsx`, `Button.tsx`, `Card.tsx`, and `Input.tsx`, with an explicit barrel file.
- Key files: `apps/web/components/ui/index.ts`.

**`apps/web/lib/`:**

- Purpose: Hold pure/reusable domain models and algorithms, including catalogue data, matching, recommendation scoring, onboarding, simulations, platform decisions, and feature validation.
- Contains: Feature-oriented `.ts` modules; domain data and types stay next to their algorithm/validator where applicable.
- Key files: `apps/web/lib/programmes.ts`, `apps/web/lib/preference-matching.ts`, `apps/web/lib/platform.ts`, `apps/web/lib/onboarding-types.ts`, `apps/web/lib/career-simulations.ts`.

**`apps/web/lib/server/`:**

- Purpose: Isolate Node-only persistence and server application operations from browser bundles.
- Contains: Data adapter implementation, platform persistence service, and governed programme merge service.
- Key files: `apps/web/lib/server/data-store.ts`, `apps/web/lib/server/platform-store.ts`, `apps/web/lib/server/programme-records.ts`.

**`apps/web/__tests__/`:**

- Purpose: Keep Jest tests outside production route/module folders while mirroring test targets by concern.
- Contains: `api/`, `components/`, and `lib/` test directories.
- Key files: `apps/web/__tests__/api/admin-data-routes.test.ts`, `apps/web/__tests__/components/OnboardingWizard.test.tsx`, `apps/web/__tests__/lib/data-store.test.ts`.

**`apps/web/public/`:**

- Purpose: Serve static assets at stable public URLs.
- Contains: Product images and SVG simulation scenes.
- Key files: `apps/web/public/images/scholar-scout-transition-v1.png`, `apps/web/public/images/simulations/cybersecurity-incident.svg`.

**`apps/web/types/`:**

- Purpose: Declare application-level TypeScript module augmentations.
- Contains: NextAuth session/JWT extension declarations.
- Key files: `apps/web/types/next-auth.d.ts`.

**`services/http-data-service/`:**

- Purpose: Run a standalone HTTP implementation of the data-store adapter contract.
- Contains: Node ESM server, fixture validator, tests, service README, and workspace manifest.
- Key files: `services/http-data-service/src/server.mjs`, `services/http-data-service/test/server.test.mjs`, `services/http-data-service/package.json`.

**`services/codex-webhook-runner/`:**

- Purpose: Receive and route GitHub issue automation webhooks.
- Contains: Node ESM server, README, and workspace manifest.
- Key files: `services/codex-webhook-runner/src/server.mjs`, `services/codex-webhook-runner/package.json`.

**`scripts/`:**

- Purpose: Supply repository-level environment provisioning, production readiness, smoke, reporting, and release scripts.
- Contains: Node `.mjs` scripts and Windows portable npm helpers.
- Key files: `scripts/production-env-check.mjs`, `scripts/production-smoke.mjs`, `scripts/prelaunch-rehearsal.mjs`, `scripts/provision-environment.mjs`.

**`docs/`:**

- Purpose: Document operations and integrations without coupling runtime code to prose.
- Contains: Deployment, adapter, OAuth, production readiness, incident response, and rubric documents.
- Key files: `docs/vercel-deployment.md`, `docs/http-data-adapter-runbook.md`, `docs/production-readiness-checklist.md`.

## Key File Locations

**Entry Points:**

- `apps/web/app/layout.tsx`: Root App Router layout and session-provider boundary.
- `apps/web/app/page.tsx`: Public landing page.
- `apps/web/app/api/**/route.ts`: API entry points; each directory maps to its `/api/...` path.
- `apps/web/auth.ts`: NextAuth provider and callback configuration reused by pages and route handlers.
- `services/http-data-service/src/server.mjs`: HTTP data adapter server process.
- `services/codex-webhook-runner/src/server.mjs`: GitHub webhook runner process.

**Configuration:**

- `package.json`: Root workspace, Node/npm requirements, and cross-workspace commands.
- `apps/web/package.json`: Next.js application scripts and dependencies.
- `apps/web/tsconfig.json`: Strict TypeScript settings and the `@/*` alias rooted at `apps/web`.
- `apps/web/next.config.mjs`: Next.js configuration.
- `apps/web/tailwind.config.ts`: Tailwind content and theme configuration.
- `apps/web/jest.config.ts`: Jest/Next test configuration.
- `vercel.json`: Root deployment build command and `apps/web/.next` output directory.

**Core Logic:**

- `apps/web/lib/programmes.ts`: Seed programme model/data and catalogue helpers.
- `apps/web/lib/preference-matching.ts`: Programme ranking for student profiles.
- `apps/web/lib/platform.ts`: Feed, simulation, recommendation, analytics, and decision algorithms.
- `apps/web/lib/server/data-store.ts`: Durable-data interface, adapters, account operations, admin restore, and audit operations.
- `apps/web/lib/server/platform-store.ts`: Engagement and platform persistence operations.
- `apps/web/lib/server/programme-records.ts`: Catalogue merge boundary for staff-managed programme data.

**Testing:**

- `apps/web/__tests__/lib/`: Unit tests for domain and server-data modules.
- `apps/web/__tests__/components/`: React component behavior tests.
- `apps/web/__tests__/api/`: API handler tests.
- `services/http-data-service/test/server.test.mjs`: Node built-in test coverage for the HTTP data contract.

## Naming Conventions

**Files:**

- App Router segments use lowercase, URL-oriented folder names: `apps/web/app/peer-community/page.tsx`, `apps/web/app/api/feed-events/route.ts`.
- Dynamic segments use square-bracket folders: `apps/web/app/programmes/[id]/page.tsx`, `apps/web/app/schools/[slug]/page.tsx`, `apps/web/app/u/[username]/page.tsx`.
- React component files use PascalCase: `apps/web/components/recommendations/RecommendationDashboard.tsx`.
- Domain/server modules use lowercase kebab-case: `apps/web/lib/preference-matching.ts`, `apps/web/lib/server/platform-store.ts`.
- Tests use `<target>.test.ts` or `<target>.test.tsx`: `apps/web/__tests__/lib/pagination.test.ts`, `apps/web/__tests__/components/StepGpa.test.tsx`.
- Standalone Node service and operational scripts use `.mjs`: `services/http-data-service/src/server.mjs`, `scripts/production-smoke.mjs`.

**Directories:**

- Group components by product capability in lowercase kebab-case directories: `apps/web/components/campus-community/`, `apps/web/components/western-new-york/`.
- Keep `app/api` directories aligned exactly with endpoint URLs; use nested folders for endpoint namespaces such as `apps/web/app/api/admin/data/backups/[id]/restore/`.
- Give each independently runnable workspace a dedicated directory and `package.json` under `apps/`, `packages/`, or `services/`.

## Where to Add New Code

**New Feature:**

- Primary route: Create `apps/web/app/<feature>/page.tsx` for an HTML route, or `apps/web/app/api/<feature>/route.ts` for a JSON endpoint.
- Interactive UI: Create `apps/web/components/<feature>/<FeatureComponent>.tsx`; add `'use client'` only when it uses hooks, browser APIs, event handlers, or client NextAuth hooks.
- Domain rules/types: Add `apps/web/lib/<feature>.ts`; keep it independent of React when it can be used by tests and server routes.
- Server persistence: Add operations to `apps/web/lib/server/data-store.ts` or `apps/web/lib/server/platform-store.ts` only when the new capability belongs in the shared persisted document.
- Tests: Add matching coverage under `apps/web/__tests__/lib/`, `apps/web/__tests__/components/`, or `apps/web/__tests__/api/`.

**New Component/Module:**

- Feature implementation: `apps/web/components/<feature>/<PascalCaseComponent>.tsx`.
- Shared visual primitive: `apps/web/components/ui/<PascalCasePrimitive>.tsx`, then export it from `apps/web/components/ui/index.ts`.
- Server-only capability: `apps/web/lib/server/<kebab-case-module>.ts`, beginning with `import 'server-only';`.
- Shared domain helper: `apps/web/lib/<kebab-case-module>.ts`.

**Utilities:**

- Shared browser/server-safe helper: `apps/web/lib/<kebab-case-helper>.ts`.
- CSS class composition: extend or use `apps/web/lib/class-names.ts`.
- Release/production automation: add an ESM script in `scripts/<kebab-case>.mjs` and register it in root `package.json` when it should be runnable by contributors.

**New Service:**

- Implementation: `services/<service-name>/src/server.mjs` (or a service-appropriate entry point).
- Manifest: `services/<service-name>/package.json` with `dev`, `start`, and quality scripts so the root workspace commands discover it.
- Contract tests: `services/<service-name>/test/`.

## Special Directories

**`apps/web/.next/`:**

- Purpose: Next.js compiled output and development cache.
- Generated: Yes.
- Committed: No.

**`apps/web/node_modules/`, `node_modules/`, and `.pnpm-store/`:**

- Purpose: Installed package dependencies and package-manager store data.
- Generated: Yes.
- Committed: No.

**`apps/web/data/`:**

- Purpose: Default local JSON adapter location for `scholarscout-data.json` when `SCHOLARSCOUT_DATA_ADAPTER=json` is selected.
- Generated: Yes, when the JSON adapter writes data.
- Committed: No; treat any runtime data as local operational state.

**`reports/`:**

- Purpose: Local prelaunch and product-operations report output.
- Generated: Yes, by scripts such as `scripts/prelaunch-rehearsal.mjs` and `scripts/product-ops-report.mjs`.
- Committed: Follow repository ignore rules; do not treat reports as production source code.

**`.planning/codebase/`:**

- Purpose: Generated codebase mapping documents for planning and execution workflows.
- Generated: Yes.
- Committed: Follow the project planning workflow; keep mappings aligned with active source structure.

---

*Structure analysis: 2026-07-25*
