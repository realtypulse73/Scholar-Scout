# Coding Conventions

**Analysis Date:** 2026-07-25

## Naming Patterns

**Files:**
- Put App Router entry files at their framework-defined names: `page.tsx`, `layout.tsx`, and `route.ts` under `apps/web/app/`, for example `apps/web/app/programmes/[id]/page.tsx` and `apps/web/app/api/admin/programmes/route.ts`.
- Name React component files in PascalCase, matching the component they export: `apps/web/components/onboarding/StepSupportNeeds.tsx`, `apps/web/components/ui/Button.tsx`, and `apps/web/components/shortlist/ShortlistButton.tsx`.
- Name domain-library modules in lowercase kebab case, such as `apps/web/lib/onboarding-validation.ts`, `apps/web/lib/pathway-score.ts`, and `apps/web/lib/server/data-store.ts`.
- Name Node service source entry points `server.mjs`, as in `services/http-data-service/src/server.mjs` and `services/codex-webhook-runner/src/server.mjs`.
- Name tests `*.test.ts`, `*.test.tsx`, or `*.test.mjs`; preserve the production area in the test path, for example `apps/web/__tests__/lib/onboarding-validation.test.ts` for `apps/web/lib/onboarding-validation.ts`.

**Functions:**
- Use camelCase verbs for functions: `validateStep`, `toggleShortlistId`, `readScholarScoutData`, and `createScholarScoutDataService` in `apps/web/lib/onboarding-validation.ts`, `apps/web/lib/shortlist.ts`, `apps/web/lib/server/data-store.ts`, and `services/http-data-service/src/server.mjs`.
- Use `handle*` for request/event helpers and `get*`, `parse*`, `normalize*`, `is*`, `format*`, or `validate*` for their respective operations. Examples include `handleWrite`, `parseShortlist`, `normalizeShortlistIds`, `isPlanStatus`, and `formatCount`.
- Use `on*` names for callback props (`onChange` in `apps/web/components/onboarding/StepSupportNeeds.tsx`) and short action names for local handlers (`toggle` in the same file).

**Variables:**
- Use camelCase for ordinary variables, parameters, state setters, and local arrays: `errorSteps`, `withoutNone`, `currentRevision`, and `fetchMock`.
- Use SCREAMING_SNAKE_CASE for exported/static domain constants, labels, and browser storage keys, for example `TOTAL_STEPS` in `apps/web/lib/onboarding-types.ts`, `SUPPORT_NEEDS` in `apps/web/components/onboarding/StepSupportNeeds.tsx`, and `SHORTLIST_STORAGE_KEY` in `apps/web/lib/shortlist.ts`.
- Keep component-local configuration arrays camelCase where they are not module-wide constants, as in `steps`, `interests`, and `gpaBands` in `apps/web/components/onboarding/OnboardingWizard.tsx`.

**Types:**
- Name interfaces and type aliases in PascalCase: `OnboardingData`, `ValidationError`, `ScholarScoutDataStore`, and `ProgrammeRevisionConflictError` in `apps/web/lib/`.
- Prefer precise union types and `Record` mappings for finite domain values, for example `ShortlistPlanStatus` and `SHORTLIST_PLAN_STATUS_LABELS` in `apps/web/lib/shortlist.ts`.
- Name component-prop interfaces `*Props` when the component name makes that clearer (`ButtonProps`, `StaffGateProps`, `ProgrammeAdminManagerProps`); small step components may use `Props`, as in `apps/web/components/onboarding/StepSupportNeeds.tsx`.

## Code Style

**Formatting:**
- No Prettier or Biome configuration is detected. Match the established source style in `apps/web/components/ui/Button.tsx` and `apps/web/lib/onboarding-validation.ts`: two-space indentation, single quotes, semicolons, trailing commas in multiline lists/calls, and parentheses around multiline function parameters.
- Break long imports, JSX props, object literals, and function calls across lines with one item per line when this preserves readability. `apps/web/app/api/admin/programmes/route.ts` and `apps/web/components/onboarding/StepSupportNeeds.tsx` are the reference patterns.
- Use Tailwind utility strings directly in JSX. Compose conditional class lists with template literals when state controls a small variant, as in `apps/web/components/onboarding/StepSupportNeeds.tsx`; use `classNames` from `apps/web/lib/class-names.ts` for reusable UI primitives, as in `apps/web/components/ui/Button.tsx`.
- Retain accessibility attributes alongside interactive controls (`type`, `aria-*`, visible focus classes) as in `apps/web/components/onboarding/StepSupportNeeds.tsx` and `apps/web/components/ui/Button.tsx`.

**Linting:**
- Run `npm run lint --workspace @scholar-scout/web` for web changes. `apps/web/package.json` runs ESLint for `.ts` and `.tsx` files with `--max-warnings=0`.
- Follow `apps/web/.eslintrc.json`, which extends `next/core-web-vitals` and `next/typescript`; it ignores generated `next-env.d.ts`.
- Keep TypeScript strict. `apps/web/tsconfig.json` enables `strict`, uses `isolatedModules`, and disallows emitted application files with `noEmit`.

## Import Organization

**Order:**
1. Framework, third-party, and Node built-in imports (`next-auth`, `next/server`, `react`, `node:http`) as in `apps/web/app/api/admin/programmes/route.ts` and `services/http-data-service/src/server.mjs`.
2. Project-root aliases (`@/auth`, `@/lib/*`, `@/components/*`) in web code.
3. Relative imports only for adjacent modules, such as `./OnboardingSummary` in `apps/web/components/onboarding/OnboardingWizard.tsx` or `../src/server.mjs` in `services/http-data-service/test/server.test.mjs`.
- Use `import type` for type-only imports when they are separate from runtime imports, as in `apps/web/lib/onboarding-validation.ts` and `apps/web/components/ui/Button.tsx`. A mixed runtime/type import is also used where it improves locality, as in `apps/web/app/api/admin/programmes/route.ts`.

**Path Aliases:**
- In `apps/web`, use `@/*` for files rooted at `apps/web/`, configured in `apps/web/tsconfig.json`. Prefer `@/lib/...`, `@/components/...`, and `@/app/...` over long relative paths.
- Do not use the `@/` alias from Node services; they use standard relative imports and `node:` built-ins.

## Error Handling

**Patterns:**
- Pure validation functions return domain-friendly sentinel values instead of throwing for expected invalid user input: `validateStep` returns `ValidationError | null`, while `validateAll` returns error step numbers in `apps/web/lib/onboarding-validation.ts`.
- Throw `Error` for violated configuration or persistence invariants, and use a dedicated error class when callers need structured recovery. `apps/web/lib/server/data-store.ts` throws configuration/validation errors and exposes `ProgrammeRevisionConflictError`, which `apps/web/app/api/admin/programmes/route.ts` converts to a `409` JSON response.
- In route handlers, authenticate/validate early and return `NextResponse.json` with an explicit HTTP status for expected failures. Follow the `403`, `400`, and `409` branches in `apps/web/app/api/admin/programmes/route.ts`; let unexpected errors propagate to the framework rather than masking them.
- In client fetch flows, reject a non-OK response with its user-facing message and catch it into component state, as in `apps/web/components/peer-community/PeerCommunity.tsx` and `apps/web/components/advisor/AdvisorChat.tsx`.
- In Node HTTP services, catch request-level operational failures and return a non-sensitive JSON error with the appropriate status. `services/http-data-service/src/server.mjs` maps malformed JSON to `400` and unexpected failures to `500`.

## Logging

**Framework:** `console` in standalone Node service entry points; no application-wide logging abstraction is detected.

**Patterns:**
- Log server startup with `console.log`, as in `services/http-data-service/src/server.mjs` and `services/codex-webhook-runner/src/server.mjs`.
- Use `console.warn` only for configuration degradation that allows the service to continue, as in `services/codex-webhook-runner/src/server.mjs`.
- Do not add routine `console` logging to web components or App Router handlers; return structured responses and surface UI errors instead.

## Comments

**When to Comment:**
- Use short inline comments to explain a non-obvious rule or branch, not to restate the code. The exclusivity behavior in `apps/web/components/onboarding/StepSupportNeeds.tsx` and the optional validation rule in `apps/web/lib/onboarding-validation.ts` are the pattern.
- Keep generated framework files untouched. `apps/web/next-env.d.ts` explicitly marks itself as generated.

**JSDoc/TSDoc:**
- Add concise JSDoc to exported domain functions whose contract or units are not self-evident. `apps/web/lib/onboarding-validation.ts`, `apps/web/lib/outcome-profiles.ts`, `apps/web/lib/fairness-audit.ts`, and `apps/web/lib/pathway-score.ts` document return semantics and assumptions.
- Avoid JSDoc for simple components or obvious value objects; use expressive types and names there.

## Function Design

**Size:**
- Keep reusable domain logic as small exported pure functions with private helpers beneath them, as in `apps/web/lib/shortlist.ts` and `apps/web/lib/shadow-mode.ts`.
- Keep route exports limited to HTTP-method handlers (`GET`, `POST`, `DELETE`) and delegate validation/storage to `apps/web/lib/`, as demonstrated by `apps/web/app/api/admin/programmes/route.ts`.
- When a feature component requires several tightly coupled render helpers, keep them private in the same file, following `apps/web/components/onboarding/OnboardingWizard.tsx`.

**Parameters:**
- Give public functions explicit TypeScript parameter and return types when the result is not evident from a primitive, especially for domain data and type guards (`apps/web/lib/onboarding-validation.ts`, `apps/web/lib/shortlist.ts`).
- Prefer a typed object parameter for multi-option construction, as in `createScholarScoutDataService` in `services/http-data-service/src/server.mjs`.

**Return Values:**
- Return `null` for an absent optional result or successful validation; return `[]` for an empty result collection; reserve thrown errors for invalid invariant/configuration states.
- Use JSON objects with stable `ok`, `error`, `errors`, `records`, or named payload fields for API responses, as in `apps/web/app/api/admin/programmes/route.ts` and `services/http-data-service/src/server.mjs`.

## Module Design

**Exports:**
- Prefer named exports for library functions, domain types, constants, and route handlers, as in `apps/web/lib/onboarding-validation.ts` and `apps/web/lib/server/data-store.ts`.
- Default-export single React components, as in `apps/web/components/ui/Button.tsx` and `apps/web/components/onboarding/StepSupportNeeds.tsx`.
- Keep server-only data access under `apps/web/lib/server/` and import it only from server routes/pages or server-side helpers.

**Barrel Files:**
- Use a focused barrel only for cohesive UI primitives: `apps/web/components/ui/index.ts` re-exports the UI components.
- Do not introduce broad feature- or application-wide barrels; import domain modules from their explicit `@/lib/...` paths.

---

*Convention analysis: 2026-07-25*
