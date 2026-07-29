---
status: resolved
trigger: "Canonical Node 20 / pnpm 10.34.5 test gate fails because apps/web/__tests__/api/register.test.ts cannot resolve its mock of @/lib/server/data-store."
created: 2026-07-28
updated: 2026-07-28
---

# Register Jest Resolver Failure

## Symptoms

- Expected: `pnpm test` under Node 20.20.2 and pnpm 10.34.5 runs the complete web suite after Phase 02 registration changes.
- Actual: the production build succeeds, but Jest fails before executing `register.test.ts` with "Cannot find module '@/lib/server/data-store'".
- Reproduction: run the root test command using the portable Node 20/Corepack pnpm runtime.
- Timeline: introduced by the final Phase 02 registration test; the executor's temporary focused configuration masked the canonical resolver failure.

## Current Focus

- hypothesis: confirmed — the canonical Jest configuration does not map the TypeScript `@/*` alias.
- test: Reproduce through the portable Node 20/Corepack pnpm wrapper, then rerun focused and full web suites after adding the matching Jest resolver rule.
- expecting: The alias mapper resolves `@/lib/server/data-store` and preserves registration boundary coverage.
- next_action: complete

## Evidence

- timestamp: 2026-07-28
  detail: Final pinned test gate passed 213 web tests and failed only `__tests__/api/register.test.ts` at `jest.mock('@/lib/server/data-store', ...)`.
- timestamp: 2026-07-28
  detail: Portable Node 20.20.2/Corepack pnpm 10.34.5 reproduced the failure before test execution: Jest could not resolve `@/lib/server/data-store` from `__tests__/api/register.test.ts`.
- timestamp: 2026-07-28
  detail: `apps/web/tsconfig.json` maps `@/*` to `./*`, while the canonical `apps/web/jest.config.ts` had no `moduleNameMapper`; adding `'^@/(.*)$': '<rootDir>/$1'` aligns Jest resolution with TypeScript.
- timestamp: 2026-07-28
  detail: Portable focused verification passed: `__tests__/api/register.test.ts` (8 tests). Portable full verification passed: 38 suites, 221 tests.

## Eliminated

- The data-store module is present at `apps/web/lib/server/data-store.ts`; the failure is not an absent production module or registration-route defect.

## Resolution

- root_cause: Jest did not know the existing TypeScript `@/*` alias, so `jest.mock('@/lib/server/data-store', ...)` could not resolve its target.
- fix: Added the equivalent `moduleNameMapper` entry to `apps/web/jest.config.ts`.
- verification: Portable Node 20.20.2/Corepack pnpm 10.34.5 focused registration test and complete web suite passed.
