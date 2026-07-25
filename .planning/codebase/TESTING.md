# Testing Patterns

**Analysis Date:** 2026-07-25

## Test Framework

**Runner:**
- Jest `^30.3.0` runs the Next.js web suite. Its configuration is `apps/web/jest.config.ts`, which uses `next/jest.js`, the `jsdom` environment, and the V8 coverage provider.
- Node's built-in `node:test` runs the HTTP service suite in `services/http-data-service/test/server.test.mjs` and the production-tooling suite in `scripts/test-production-tooling.mjs`.
- API route tests that need server APIs opt into Node explicitly with `/** @jest-environment node */`, as in `apps/web/__tests__/api/admin-data-routes.test.ts`.

**Assertion Library:**
- Web unit/component/API tests use Jest `expect` plus `@testing-library/jest-dom`, loaded by `apps/web/jest.setup.ts`.
- React tests use `@testing-library/react` (`render`, `screen`, `fireEvent`, and `waitFor`).
- Node tests use `node:assert/strict` as shown in `services/http-data-service/test/server.test.mjs` and `scripts/test-production-tooling.mjs`.

**Run Commands:**
```bash
npm test                                                        # Run workspace test scripts (web Jest and HTTP service node:test)
npm run test --workspace @scholar-scout/web                     # Run the web Jest suite
npm run test --workspace @scholar-scout/web -- --watch          # Watch the web Jest suite
npm run test --workspace @scholar-scout/web -- --coverage       # Produce web Jest V8 coverage
npm run test --workspace @scholar-scout/http-data-service       # Run HTTP-service integration tests
npm run test:production-tooling                                 # Run root Node tests for production scripts
```

The configured web test script is `jest --config jest.config.ts` in `apps/web/package.json`; `test:watch` also exists there. No coverage command, coverage directory, or coverage threshold is configured in `apps/web/package.json` or `apps/web/jest.config.ts`.

## Test File Organization

**Location:**
- Put web tests in `apps/web/__tests__/`, organized by the exercised layer: `lib/`, `components/`, and `api/`.
- Keep the test filename tied to the module/component behavior, for example `apps/web/__tests__/lib/shortlist.test.ts`, `apps/web/__tests__/components/StepSupportNeeds.test.tsx`, and `apps/web/__tests__/api/admin-data-routes.test.ts`.
- Put the Node HTTP service test in its service-local `test/` directory: `services/http-data-service/test/server.test.mjs`.
- Keep production-script tests at `scripts/test-production-tooling.mjs`, beside the scripts under test.

**Naming:**
- Use `*.test.ts` for TypeScript library/API tests, `*.test.tsx` for React component tests, and `*.test.mjs` for Node ESM tests.
- Name top-level `describe` blocks after the public subject: `describe('validateStep', ...)` in `apps/web/__tests__/lib/onboarding-validation.test.ts`, `describe('StepSupportNeeds', ...)` in `apps/web/__tests__/components/StepSupportNeeds.test.tsx`, and `describe('ScholarScout HTTP data service fixture', ...)` in `services/http-data-service/test/server.test.mjs`.

**Structure:**
```text
apps/web/
├── __tests__/
│   ├── api/          # App Router route-handler tests
│   ├── components/   # React component interaction/render tests
│   └── lib/          # Pure domain and server-library tests
├── jest.config.ts
└── jest.setup.ts

services/http-data-service/
└── test/             # Node HTTP integration tests

scripts/
└── test-production-tooling.mjs  # Node tests for operational scripts
```

## Test Structure

**Suite Organization:**
```typescript
// Pattern from apps/web/__tests__/lib/onboarding-validation.test.ts
describe('validateStep', () => {
  it('requires interests and pathway on step 1', () => {
    expect(validateStep(1, INITIAL_ONBOARDING_DATA)).toMatch(/interest/i);
    expect(validateStep(1, completeStepOne)).toBeNull();
  });
});

describe('validateAll', () => {
  it('returns empty array when all required fields are filled', () => {
    expect(validateAll(FULL_DATA)).toEqual([]);
  });
});
```

**Patterns:**
- Use behavior-focused `it` descriptions written in present tense, such as `it('selecting "none" clears all other selections', ...)` in `apps/web/__tests__/components/StepSupportNeeds.test.tsx`.
- Define immutable, representative module-level data for pure unit tests (`FULL_DATA` in `apps/web/__tests__/lib/onboarding-validation.test.ts`) and clone it when a test needs mutability.
- Reset shared browser, module, environment, dependency-injection, and global state in `afterEach`/`beforeEach`. Examples include `window.localStorage.clear()` in `apps/web/__tests__/components/OnboardingWizard.test.tsx` and restoration of the test data store, environment variables, `fetch`, and mocks in `apps/web/__tests__/lib/data-store.test.ts`.
- Assert observable output: rendered accessibility roles/text for components, exact status and JSON shape for API/service routes, and persisted data for storage operations.

## Mocking

**Framework:** Jest mock APIs (`jest.fn`, `jest.mock`, `jest.mocked`, and `jest.restoreAllMocks`) in the web suite.

**Patterns:**
```typescript
// Module-boundary mock from apps/web/__tests__/api/admin-data-routes.test.ts
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

const getSessionMock = jest.mocked(getServerSession);

afterEach(() => {
  getSessionMock.mockReset();
});
```

```typescript
// Dependency injection plus cleanup from apps/web/__tests__/lib/data-store.test.ts
const store = new MemoryDataStore();
setScholarScoutDataStoreForTests(store);

afterEach(() => {
  setScholarScoutDataStoreForTests(null);
  globalThis.fetch = originalFetch;
  jest.restoreAllMocks();
});
```

**What to Mock:**
- Mock external adapters and framework authentication at their module boundaries: `@vercel/blob` in `apps/web/__tests__/lib/data-store.test.ts` and `next-auth` in `apps/web/__tests__/api/admin-data-routes.test.ts`.
- Use `jest.fn()` for callback props in isolated component tests, then assert arguments, as in `apps/web/__tests__/components/StepSupportNeeds.test.tsx`.
- Replace `globalThis.fetch` only for the HTTP-adapter unit boundary, and restore it after each test as in `apps/web/__tests__/lib/data-store.test.ts`.

**What NOT to Mock:**
- Do not mock pure business logic. Import and exercise public functions from `apps/web/lib/` directly, as in `apps/web/__tests__/lib/onboarding-validation.test.ts` and `apps/web/__tests__/lib/shortlist.test.ts`.
- Do not mock the Node HTTP server's request path. `services/http-data-service/test/server.test.mjs` starts a real in-process server on an ephemeral port and calls it with `fetch`.
- Do not rely on ambient test state. Inject `ScholarScoutDataStore` through `setScholarScoutDataStoreForTests` and reset it afterward.

## Fixtures and Factories

**Test Data:**
```typescript
// Representative in-memory store pattern from apps/web/__tests__/lib/data-store.test.ts
class MemoryDataStore implements ScholarScoutDataStore {
  data = cloneData(initialData);

  async read() {
    return cloneData(this.data);
  }

  async write(data: ScholarScoutData) {
    this.data = cloneData(data);
  }
}
```

- Define small scenario builders/helpers in the test file when their data is specific to that route, such as `staffSession`, `validSnapshot`, `dataWithBackup`, `jsonRequest`, and `routeContext` in `apps/web/__tests__/api/admin-data-routes.test.ts`.
- Use `mkdtemp` with `os.tmpdir()` for filesystem fixtures, start servers on port `0`, and remove the temp directory in `after`, following `services/http-data-service/test/server.test.mjs`.

**Location:**
- Shared fixture/factory directories are not detected. Keep focused fixtures alongside the corresponding test file until a genuinely cross-suite fixture emerges.

## Coverage

**Requirements:** No coverage threshold or CI-enforced coverage requirement is detected. `apps/web/jest.config.ts` selects V8 as the provider but does not configure collection, reporters, or thresholds.

**View Coverage:**
```bash
npm run test --workspace @scholar-scout/web -- --coverage
```

## Test Types

**Unit Tests:**
- Test pure, deterministic library functions under `apps/web/lib/` with direct inputs and exact/partial Jest assertions. Examples include `apps/web/__tests__/lib/onboarding-validation.test.ts`, `apps/web/__tests__/lib/pagination.test.ts`, and `apps/web/__tests__/lib/pathway-score.test.ts`.
- Include invalid-input, empty-state, and boundary cases alongside normal scenarios. `apps/web/__tests__/lib/onboarding-validation.test.ts` tests unknown steps and empty/complete onboarding records.

**Integration Tests:**
- Exercise App Router route-handler exports directly with real `Request` objects, mocked authentication, and an injected in-memory store in `apps/web/__tests__/api/admin-data-routes.test.ts`.
- Exercise the HTTP data service over real HTTP with temporary filesystem storage in `services/http-data-service/test/server.test.mjs`.
- Exercise operational scripts by spawning Node subprocesses and creating temporary HTTP servers/files in `scripts/test-production-tooling.mjs`.

**E2E Tests:**
- Not detected. No Playwright, Cypress, or browser-automation configuration/files are present.

## Common Patterns

**Async Testing:**
```typescript
// React async UI assertion from apps/web/__tests__/components/OnboardingWizard.test.tsx
await waitFor(() => {
  expect(screen.getByText(/you're all set/i)).toBeInTheDocument();
});

// Promise assertion from apps/web/__tests__/api/admin-data-routes.test.ts
await expect(jsonBody(response)).resolves.toMatchObject({ ok: true });
```

- Mark tests `async` and await route handlers, fetch calls, subprocess helpers, and `waitFor`; do not use arbitrary timeouts.
- In Node suites, use `before`/`after` for server lifecycle and await both `listen` and `close`, as in `services/http-data-service/test/server.test.mjs`.

**Error Testing:**
```typescript
// Expected rejected domain operation from apps/web/__tests__/lib/data-store.test.ts
await expect(saveProgrammeRecord('staff-1', staleProgramme)).rejects.toMatchObject({
  currentRevision: 2,
});

// Expected API failure from apps/web/__tests__/api/admin-data-routes.test.ts
expect(response.status).toBe(400);
await expect(jsonBody(response)).resolves.toMatchObject({
  error: expect.any(String),
});
```

- Assert the externally visible failure contract: status codes and response shape for APIs, `rejects`/`toThrow` for library invariants, and accessible error text for components.
- Do not assert implementation-only error internals unless they are part of a structured recovery contract, such as the revision fields tested in `apps/web/__tests__/lib/data-store.test.ts`.

---

*Testing analysis: 2026-07-25*
