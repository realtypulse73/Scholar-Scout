# Codebase Structure

**Analysis Date:** 2026-07-21

## Directory Layout

```text
Scholar-Scout-recovery/
|-- .github/                         # Repository automation and workflows
|-- .planning/
|   `-- codebase/                    # GSD-generated codebase reference maps
|-- apps/
|   `-- web/                         # Next.js product application
|       |-- __tests__/               # Jest unit/component/API tests
|       |-- app/                     # App Router pages, layouts, APIs, assets
|       |-- components/              # Feature and reusable React components
|       |-- lib/                     # Product domain and application logic
|       |   `-- server/              # Server-only persistence/orchestration
|       |-- public/                  # Static web assets
|       |-- types/                   # Ambient TypeScript declarations
|       |-- auth.ts                  # NextAuth configuration
|       |-- jest.config.ts           # Test runner configuration
|       |-- next.config.mjs          # Next.js configuration
|       |-- tailwind.config.ts       # Design token/theme configuration
|       `-- tsconfig.json            # TypeScript and @/* alias configuration
|-- docs/                            # Product, deployment, and operations runbooks
|-- packages/                        # Reserved shared workspace packages
|-- reports/                         # Generated readiness/product-ops reports
|-- scripts/                         # Release, provisioning, reporting scripts
|-- services/
|   |-- codex-webhook-runner/        # GitHub issue automation service
|   `-- http-data-service/           # Document persistence service and tests
|-- package.json                     # npm workspace commands and engines
|-- package-lock.json                # Root dependency lockfile
|-- README.md                        # Repository operating guide
`-- vercel.json                      # Vercel build/deployment configuration
```

## Directory Purposes

**`apps/web/app/`:**
- Purpose: Define the web URL tree and server entry points using the Next.js App Router.
- Contains: `page.tsx`, `layout.tsx`, `route.ts`, global CSS, fonts, favicon.
- Key files: `apps/web/app/layout.tsx`, `apps/web/app/page.tsx`, `apps/web/app/globals.css`.
- Route groups are plain directories rather than parenthesized Next.js groups.

**`apps/web/app/api/`:**
- Purpose: Provide the internal HTTP boundary for client mutations and JSON queries.
- Contains: Feed, simulation, advisor, decisions, analytics, account, auth, referral, share, and staff programme handlers.
- Key files: `apps/web/app/api/auth/[...nextauth]/route.ts`, `apps/web/app/api/account/onboarding/route.ts`, `apps/web/app/api/account/shortlist/route.ts`, `apps/web/app/api/advisor-chat/route.ts`.

**`apps/web/components/`:**
- Purpose: Organize React UI by product capability.
- Contains: Feature directories `admin`, `advisor`, `auth`, `creator`, `feed`, `onboarding`, `profile`, `programmes`, `recommendations`, `referrals`, `share`, `shortlist`, `simulation`, `simulations`, and `ui`.
- Key files: `apps/web/components/onboarding/OnboardingWizard.tsx`, `apps/web/components/feed/FeedExperience.tsx`, `apps/web/components/recommendations/RecommendationDashboard.tsx`, `apps/web/components/ui/index.ts`.

**`apps/web/components/ui/`:**
- Purpose: Supply shared visual primitives and consistent interaction/accessibility styling.
- Contains: `Badge.tsx`, `Button.tsx`, `Card.tsx`, `Input.tsx`, and barrel exports.
- Key files: `apps/web/components/ui/index.ts`.

**`apps/web/lib/`:**
- Purpose: Hold framework-light domain types, fixtures, scoring rules, filters, validation, and recommendation logic.
- Contains: One module per concept, generally using named exports.
- Key files: `apps/web/lib/programmes.ts`, `apps/web/lib/preference-matching.ts`, `apps/web/lib/adaptive-recommendations.ts`, `apps/web/lib/platform.ts`, `apps/web/lib/predictive-decisions.ts`.

**`apps/web/lib/server/`:**
- Purpose: Isolate persistence and server orchestration from browser-safe domain modules.
- Contains: Store adapter/account operations, platform event operations, governed catalogue loading.
- Key files: `apps/web/lib/server/data-store.ts`, `apps/web/lib/server/platform-store.ts`, `apps/web/lib/server/programme-records.ts`.

**`apps/web/__tests__/`:**
- Purpose: Test domain modules, route handlers, and React components with Jest.
- Contains: `api/`, `components/`, and `lib/` subdirectories mirroring source concerns.
- Key files: `apps/web/__tests__/api/admin-data-routes.test.ts`, `apps/web/__tests__/lib/preference-matching.test.ts`, `apps/web/__tests__/components/OnboardingWizard.test.tsx`.

**`apps/web/public/`:**
- Purpose: Serve static assets without bundling imports.
- Contains: Simulation SVG illustrations.
- Key files: `apps/web/public/images/simulations/healthcare-floor.svg`, `apps/web/public/images/simulations/cybersecurity-incident.svg`.

**`apps/web/types/`:**
- Purpose: Extend external package types used throughout the app.
- Contains: NextAuth session, user, and token declarations.
- Key files: `apps/web/types/next-auth.d.ts`.

**`services/http-data-service/`:**
- Purpose: Implement the HTTP persistence contract used by the web data-store adapter.
- Contains: Node HTTP server, fixture validator, tests, package metadata, service documentation.
- Key files: `services/http-data-service/src/server.mjs`, `services/http-data-service/test/server.test.mjs`, `services/http-data-service/scripts/validate-fixture.mjs`.

**`services/codex-webhook-runner/`:**
- Purpose: Turn labeled GitHub issue webhooks into Codex job packets.
- Contains: Standalone Node HTTP server and deployment/usage notes.
- Key files: `services/codex-webhook-runner/src/server.mjs`, `services/codex-webhook-runner/README.md`.

**`packages/`:**
- Purpose: Reserve npm workspace locations for extracted shared libraries/configuration.
- Contains: Documentation only.
- Key files: `packages/README.md`.

**`scripts/`:**
- Purpose: Automate environment validation, provisioning, release rehearsal, smoke checks, production reporting, and product operations.
- Contains: Node ESM scripts and Windows portable-Node helpers.
- Key files: `scripts/production-env-check.mjs`, `scripts/prelaunch-rehearsal.mjs`, `scripts/production-smoke.mjs`, `scripts/product-ops-report.mjs`.

**`docs/`:**
- Purpose: Preserve operational procedures and product standards.
- Contains: Deployment, OAuth, persistence, release, incident, and automation runbooks.
- Key files: `docs/scholarscout-rubric.md`, `docs/production-readiness-checklist.md`, `docs/production-release-runbook.md`, `docs/chatgpt-codex-github-sync.md`.

**`reports/`:**
- Purpose: Store generated operational evidence and product-management snapshots.
- Contains: Daily product-ops Markdown/JSON, provisioning notes, prelaunch evidence.
- Key files: `reports/product-ops/latest.md`, `reports/product-ops/dynamic-roadmap.md`, `reports/prelaunch-rehearsal/prelaunch-summary.md`.

## Key File Locations

**Entry Points:**
- `apps/web/app/layout.tsx`: Root HTML, fonts, metadata, and session provider.
- `apps/web/app/page.tsx`: Public landing route.
- `apps/web/app/**/page.tsx`: Product page routes.
- `apps/web/app/api/**/route.ts`: Web API endpoints.
- `services/http-data-service/src/server.mjs`: HTTP data service process.
- `services/codex-webhook-runner/src/server.mjs`: Automation webhook process.

**Configuration:**
- `package.json`: npm workspaces, Node/npm engines, cross-workspace commands.
- `apps/web/package.json`: Next.js app dependencies and scripts.
- `apps/web/tsconfig.json`: TypeScript options and `@/*` source alias.
- `apps/web/next.config.mjs`: Next.js build settings.
- `apps/web/tailwind.config.ts`: Theme colors, spacing, and content scanning.
- `apps/web/postcss.config.mjs`: CSS transformation configuration.
- `apps/web/jest.config.ts`: Jest + ts-jest/jsdom configuration.
- `vercel.json`: Root deployment build wiring.
- `.env.production.example`: Production variable-name template; do not put secret values in committed files.
- `.env.prelaunch.local.example`: Local prelaunch variable-name template; do not put secret values in committed files.

**Core Logic:**
- `apps/web/lib/preference-matching.ts`: Baseline six-factor fit algorithm and explanations.
- `apps/web/lib/adaptive-recommendations.ts`: Behavioral/adaptive ranking layer.
- `apps/web/lib/predictive-decisions.ts`: Decision probability and risk estimation.
- `apps/web/lib/platform.ts`: Feed, simulations, recommendation ranker, A/B assignment, decision engine.
- `apps/web/lib/programmes.ts`: Programme schema, seed data, filtering, related items, pagination.
- `apps/web/lib/pathway-recommendations.ts`: Multi-phase pathway action plans.
- `apps/web/lib/recommendation-advisor.ts`: Deterministic advisor message construction.
- `apps/web/lib/server/data-store.ts`: Persistence abstraction and account/governance operations.
- `apps/web/lib/server/platform-store.ts`: Product event/memory/analytics orchestration.

**Authentication and Authorization:**
- `apps/web/auth.ts`: Credentials, GitHub, Google, JWT session callbacks.
- `apps/web/app/api/auth/[...nextauth]/route.ts`: NextAuth HTTP entry point.
- `apps/web/components/auth/StaffGate.tsx`: Staff UI access wrapper.
- `apps/web/types/next-auth.d.ts`: Role/session type augmentation.

**Testing:**
- `apps/web/__tests__/lib/*.test.ts`: Domain unit tests.
- `apps/web/__tests__/components/*.test.tsx`: React behavior tests.
- `apps/web/__tests__/api/*.test.ts`: Route handler tests.
- `services/http-data-service/test/server.test.mjs`: Node service integration tests.
- `scripts/test-production-tooling.mjs`: Node test suite for operational tooling.

**Operations:**
- `docs/production-readiness-checklist.md`: Launch requirements.
- `docs/production-release-runbook.md`: Release sequence.
- `scripts/production-env-check.mjs`: Configuration readiness verification.
- `scripts/prelaunch-rehearsal.mjs`: Prelaunch evidence orchestration.
- `scripts/production-smoke.mjs`: Deployed endpoint verification.

## Naming Conventions

**Files:**
- React components use PascalCase: `apps/web/components/feed/FeedExperience.tsx`.
- App Router files use framework names: `page.tsx`, `layout.tsx`, and `route.ts` under `apps/web/app/`.
- Domain modules use lowercase kebab-case: `apps/web/lib/preference-matching.ts`, `apps/web/lib/onboarding-types.ts`.
- Tests mirror the target name and use `.test.ts` or `.test.tsx`: `apps/web/__tests__/lib/programmes.test.ts`.
- Node services and scripts use ESM `.mjs`: `scripts/production-smoke.mjs`.
- Dated generated reports use ISO dates: `reports/product-ops/2026-07-21.md`.

**Directories:**
- Product feature directories use lowercase nouns: `apps/web/components/recommendations/`, `apps/web/app/shortlist/`.
- Dynamic route segments use brackets: `apps/web/app/programmes/[id]/`, `apps/web/app/u/[username]/`.
- API nesting follows resource/action paths: `apps/web/app/api/account/shortlist/`, `apps/web/app/api/simulations/results/`.
- Workspace projects use lowercase kebab-case: `services/http-data-service/`, `services/codex-webhook-runner/`.

## Where to Add New Code

**New User-Facing Feature:**
- Route composition: `apps/web/app/<feature>/page.tsx`.
- Interactive components: `apps/web/components/<feature>/PascalCaseName.tsx`.
- Pure types/rules: `apps/web/lib/<feature>.ts`.
- Server orchestration: `apps/web/lib/server/<feature>.ts` only when persistence or secrets are required.
- API boundary: `apps/web/app/api/<resource>/route.ts` only when browser-side mutation/query is required.
- Tests: `apps/web/__tests__/components/`, `apps/web/__tests__/lib/`, or `apps/web/__tests__/api/`, mirroring the implementation concern.

**New Page:**
- Implementation: `apps/web/app/<route>/page.tsx`.
- Dynamic path: `apps/web/app/<route>/[parameter]/page.tsx`.
- Reusable view: extract to `apps/web/components/<feature>/` rather than growing the page file.

**New API Resource:**
- Handler: `apps/web/app/api/<resource>/route.ts`.
- Domain validation: `apps/web/lib/<resource>-validation.ts` when reusable.
- Persistence: add typed operations to `apps/web/lib/server/data-store.ts` or a focused server module; do not access local files from the route directly.
- Tests: `apps/web/__tests__/api/<resource>-routes.test.ts`.

**New Matching or Algorithm Capability:**
- Core pure function: `apps/web/lib/<capability>.ts`.
- Shared domain types: colocate in the same module unless broadly reused.
- UI explanation: return typed signals/messages from the algorithm and render them in `apps/web/components/recommendations/`.
- Tests: `apps/web/__tests__/lib/<capability>.test.ts`; cover thresholds, ties, missing profile fields, and score clamps.

**New Programme Field:**
- Schema/seed updates: `apps/web/lib/programmes.ts`.
- Admin validation/governance: `apps/web/lib/admin-programmes.ts` and `apps/web/components/admin/ProgrammeAdminManager.tsx`.
- Matching/filter use: the appropriate module under `apps/web/lib/`.
- Persistence/import validation: `apps/web/lib/server/data-store.ts` if serialized records change.
- Tests: update programme, admin, matching, and data-store suites under `apps/web/__tests__/`.

**New Shared Component:**
- Primitive: `apps/web/components/ui/` and export from `apps/web/components/ui/index.ts`.
- Feature-specific component: `apps/web/components/<feature>/` without adding it to the UI barrel.
- Styling: use tokens/classes configured in `apps/web/tailwind.config.ts` and `apps/web/app/globals.css`.

**New Workspace Service:**
- Implementation: `services/<service-name>/` with its own `package.json`.
- Tests: `services/<service-name>/test/`.
- Documentation: `services/<service-name>/README.md` plus an operations runbook in `docs/` when deployed.
- Root integration: expose matching scripts so root `--workspaces --if-present` commands include it.

**New Shared Package:**
- Implementation: `packages/<package-name>/` with a workspace `package.json`.
- Use only after code has at least two real workspace consumers; keep web-only domain code in `apps/web/lib/`.

**Utilities:**
- Browser-safe shared helper: `apps/web/lib/<helper>.ts`; `apps/web/lib/class-names.ts` is the current small utility example.
- Server-only helper: `apps/web/lib/server/<helper>.ts` with `import 'server-only'`.
- Operational helper: `scripts/` when it is a command rather than application runtime code.

## Special Directories

**`.planning/codebase/`:**
- Purpose: Current-state architecture, stack, convention, test, and concern maps consumed by GSD workflows.
- Generated: Yes.
- Committed: Determined by the orchestrating workflow.

**`reports/product-ops/`:**
- Purpose: Daily generated product operations reports and autonomous issue state.
- Generated: Yes.
- Committed: Yes in the current repository.

**`reports/prelaunch-rehearsal/`:**
- Purpose: Store prelaunch evidence output from operational scripts.
- Generated: Yes.
- Committed: Yes for non-secret summaries/evidence.

**`apps/web/app/fonts/`:**
- Purpose: Bundle locally served Geist font assets.
- Generated: No.
- Committed: Yes.

**`apps/web/public/images/simulations/`:**
- Purpose: Static scene artwork used by simulation experiences.
- Generated: No.
- Committed: Yes.

**`data/` (runtime, when present):**
- Purpose: Local JSON adapter documents and HTTP service fixture data/backups.
- Generated: Yes.
- Committed: No; treat user/account documents as runtime data.

**`.next/` and `node_modules/` (runtime, when present):**
- Purpose: Next.js build output and installed dependencies.
- Generated: Yes.
- Committed: No.

---

*Structure analysis: 2026-07-21*
