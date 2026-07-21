# Coding Conventions

**Analysis Date:** 2026-07-21

## Naming Patterns

**Files:**
- Use PascalCase for React component files, matching the exported component: `apps/web/components/onboarding/OnboardingWizard.tsx` and `apps/web/components/ui/Button.tsx`.
- Use lowercase kebab-case for domain modules and route directories: `apps/web/lib/preference-matching.ts`, `apps/web/lib/server/data-store.ts`, and `apps/web/app/api/advisor-chat/route.ts`.
- Use Next.js App Router reserved names (`page.tsx`, `layout.tsx`, `route.ts`) under `apps/web/app/`.
- Name Jest tests `*.test.ts` or `*.test.tsx` and group them by concern under `apps/web/__tests__/lib/`, `apps/web/__tests__/components/`, and `apps/web/__tests__/api/`.
- Name Node service tests `*.test.mjs`, as in `services/http-data-service/test/server.test.mjs`.

**Functions:**
- Use camelCase verbs that state the operation: `rankProgrammesForProfile` in `apps/web/lib/preference-matching.ts`, `saveProgrammeRecord` in `apps/web/lib/server/data-store.ts`, and `validateProgrammeDraft` in `apps/web/lib/admin-programmes.ts`.
- Use `get*`, `save*`, `parse*`, `serialize*`, `validate*`, and `build*` prefixes consistently for queries, mutations, transforms, validation, and assembly.
- Name React components and their default-exported functions in PascalCase, matching their files, as in `apps/web/components/ui/Button.tsx`.
- Name Next.js route handlers with uppercase HTTP verbs (`GET`, `POST`, `DELETE`) in `apps/web/app/api/**/route.ts`.

**Variables:**
- Use camelCase for local values and parameters (`currentRevision`, `programmeId`, `searchParams`).
- Use SCREAMING_SNAKE_CASE for exported constants and stable fixtures: `ONBOARDING_PROFILE_STORAGE_KEY` in `apps/web/lib/preference-matching.ts`, `PROGRAMME_PAGE_SIZE` in `apps/web/lib/pagination.ts`, and `PROFILE` in `apps/web/__tests__/lib/preference-matching.test.ts`.
- Use plural nouns for collections (`programmes`, `auditEvents`, `restoreBackups`) and `*ById` for lookup maps.

**Types:**
- Use PascalCase for type aliases, interfaces, and classes: `OnboardingData` in `apps/web/lib/onboarding-types.ts`, `ProgrammeAdminManagerProps` in `apps/web/components/admin/ProgrammeAdminManager.tsx`, and `ProgrammeRevisionConflictError` in `apps/web/lib/server/data-store.ts`.
- Use `Props` only for small, file-local component contracts; use a component-qualified name for public or complex contracts, as shown in `apps/web/components/onboarding/StepInterests.tsx` and `apps/web/components/programmes/ProgrammeResults.tsx`.
- Use string-literal unions for finite domain states, such as `ProgrammePublicationStatus` in `apps/web/lib/programmes.ts`.

## Code Style

**Formatting:**
- No dedicated Prettier or formatter configuration is present. Preserve the established style in `apps/web/`: two-space indentation, single quotes, semicolons, trailing commas in multiline constructs, and one logical expression per line when wrapping.
- Keep JSX props one per line when a call spans multiple lines, as in `apps/web/components/onboarding/StepInterests.tsx`.
- Prefer early returns over nested conditionals in handlers and validators, as in `apps/web/app/api/admin/programmes/route.ts`.

**Linting:**
- Use ESLint 8 through `npm run lint`; the web workspace config is `apps/web/.eslintrc.json`.
- Follow `next/core-web-vitals` and `next/typescript`; linting is configured with `--max-warnings=0` in `apps/web/package.json`.
- Keep TypeScript strict and no-emit clean according to `apps/web/tsconfig.json`; run `npm run typecheck` before integrating changes.

## Import Organization

**Order:**
1. External runtime and type imports (`react`, `next-auth`, `next/server`, `@vercel/blob`).
2. Internal `@/` imports, with application-level dependencies before deeper domain modules.
3. Relative imports only when code belongs to the same package and a stable alias is unavailable, as in `services/http-data-service/test/server.test.mjs`.

**Path Aliases:**
- Use `@/*` for files rooted at `apps/web/`, configured in `apps/web/tsconfig.json`; examples include `@/lib/programmes` and `@/components/onboarding/OnboardingWizard`.
- Use `import type` or inline `type` modifiers for type-only imports, as in `apps/web/components/ui/Button.tsx` and `apps/web/__tests__/lib/data-store.test.ts`.

## Error Handling

**Patterns:**
- Validate input and authorization at API boundaries, then return `NextResponse.json` with explicit HTTP status codes, as in `apps/web/app/api/admin/programmes/route.ts`.
- Use domain-specific `Error` subclasses for recoverable conflicts that callers must distinguish, such as `ProgrammeRevisionConflictError` and `ScholarScoutDataRestoreError` in `apps/web/lib/server/data-store.ts`.
- Catch only errors that can be translated or recovered; rethrow unexpected errors so platform handling remains active, as in `apps/web/app/api/admin/programmes/route.ts`.
- Return `null` or an empty normalized value for malformed optional browser storage data, as in `apps/web/lib/preference-matching.ts` and `apps/web/lib/local-auth.ts`.
- In client components, wrap network and storage operations in `try`/`catch` and surface user-readable state; follow `apps/web/components/advisor/AdvisorChat.tsx` and `apps/web/components/admin/ProgrammeAdminManager.tsx`.

## Logging

**Framework:** console

**Patterns:**
- No centralized application logger is present. Use console output primarily in operational scripts and service startup/error paths under `scripts/` and `services/`.
- Avoid logging secrets, bearer tokens, passwords, complete environment values, or persisted user records. Production tooling explicitly checks redaction in `scripts/test-production-tooling.mjs`.
- API routes generally communicate failures through HTTP responses rather than logging, as in `apps/web/app/api/admin/programmes/route.ts`.

## Comments

**When to Comment:**
- Comment only where runtime behavior or environment choice is not self-evident. Keep implementation code readable through names and small helpers, following `apps/web/lib/preference-matching.ts`.
- Use file-level environment directives where required, such as `@jest-environment node` in `apps/web/__tests__/api/admin-data-routes.test.ts`.

**JSDoc/TSDoc:**
- JSDoc is not a routine API-documentation convention. Use it for tool-facing configuration or framework typing only, as in `apps/web/next.config.mjs`; express normal contracts with TypeScript types.

## Function Design

**Size:** Keep domain helpers focused and composable, as in `apps/web/lib/pagination.ts` and `apps/web/lib/onboarding-validation.ts`. Extract normalization, validation, and serialization helpers from route handlers. Large stateful UI modules such as `apps/web/components/admin/ProgrammeAdminManager.tsx` are exceptions, not templates.

**Parameters:** Prefer a single typed object when an operation has multiple related inputs, as in `rankRecommendations` in `apps/web/lib/platform.ts`; use direct scalar parameters for small pure helpers. Type request bodies at the boundary before passing them to domain functions.

**Return Values:** Return typed domain data from library functions; return `null` for legitimate absence; return `NextResponse` from API handlers. Avoid ambiguous sentinel strings. Async data-store functions return promises and are awaited by callers in `apps/web/lib/server/data-store.ts`.

## Module Design

**Exports:**
- Default-export React components and Next.js page components; use named exports for domain functions, constants, types, metadata, and route handlers.
- Keep server-only persistence logic under `apps/web/lib/server/`; do not import it into client components.
- Keep shared domain logic pure where possible in `apps/web/lib/`, so it remains directly unit-testable.

**Barrel Files:**
- Barrel exports are limited to cohesive public UI primitives in `apps/web/components/ui/index.ts`.
- Import domain modules directly rather than creating broad barrels; examples throughout `apps/web/app/` use `@/lib/<module>`.

---

*Convention analysis: 2026-07-21*
