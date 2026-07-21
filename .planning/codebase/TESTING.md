# Testing Patterns

**Analysis Date:** 2026-07-21

## Test Framework

**Runner:**
- Jest 30.3.0 for the Next.js web workspace, with `ts-jest` 29.4.9 available for TypeScript transformation.
- Config: `apps/web/jest.config.ts`
- Node's built-in test runner for services and production tooling in `services/http-data-service/test/server.test.mjs` and `scripts/test-production-tooling.mjs`.

**Assertion Library:**
- Jest `expect`, extended with `@testing-library/jest-dom` from `apps/web/jest.setup.ts`.
- `node:assert/strict` for `.mjs` Node tests.

**Run Commands:**
```bash
npm test                         # Run all workspace tests from the repository root
npm run test --workspace @scholar-scout/web  # Run the Jest web suite
npm run test:watch --workspace @scholar-scout/web  # Run Jest in watch mode
npm run test:production-tooling  # Run production-tooling tests with node:test
npm test --workspace @scholar-scout/http-data-service  # Run HTTP service integration tests
npm run test --workspace @scholar-scout/web -- --coverage  # Generate Jest coverage
```

## Test File Organization

**Location:**
- Keep web tests separate from production code under `apps/web/__tests__/`, divided into `lib/`, `components/`, and `api/` by test boundary.
- Keep service tests in a package-local `test/` directory, as in `services/http-data-service/test/server.test.mjs`.
- Keep operational script tests at `scripts/test-production-tooling.mjs` because they exercise sibling command-line scripts.

**Naming:**
- Use `<subject>.test.ts` for library and API behavior, `<Component>.test.tsx` for React behavior, and `<subject>.test.mjs` for Node ESM packages.

**Structure:**
```text
apps/web/__tests__/
├── api/          # Route-handler tests
├── components/   # React Testing Library tests
└── lib/          # Pure logic and persistence-adapter tests
services/http-data-service/test/ # Node HTTP integration tests
scripts/test-production-tooling.mjs # CLI/operational integration tests
```

## Test Structure

**Suite Organization:**
```typescript
describe('preference matching helpers', () => {
  it('ranks programmes by personalized fit when a profile exists', () => {
    const ranked = rankProgrammesForProfile(programmes, PROFILE);

    expect(ranked[0].id).toBe('north-valley-health');
  });
});
```
This pattern is used in `apps/web/__tests__/lib/preference-matching.test.ts`.

**Patterns:**
- Group behavior by exported module, component, route group, or adapter in `describe` blocks.
- Write test names as observable behavior (`requires`, `returns`, `saves`, `rejects`, `shows`) rather than implementation details.
- Keep Arrange/Act/Assert visually separated with blank lines, following `apps/web/__tests__/lib/data-store.test.ts`.
- Reset mutable global state, injected stores, mocks, local storage, and environment variables in `beforeEach`/`afterEach`; see `apps/web/__tests__/components/OnboardingWizard.test.tsx` and `apps/web/__tests__/lib/data-store.test.ts`.
- Assert outputs and user-visible effects; avoid snapshot tests, which are not used in the current suite.

## Mocking

**Framework:** Jest mocks for web tests; injected fakes and real ephemeral resources for Node integration tests.

**Patterns:**
```typescript
jest.mock('@vercel/blob', () => ({
  get: jest.fn(),
  put: jest.fn(),
}));

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
Use the module-mock and injected in-memory adapter pattern from `apps/web/__tests__/lib/data-store.test.ts`.

**What to Mock:**
- Mock external SDK boundaries (`@vercel/blob`), authentication sessions (`next-auth`), `fetch`, and browser storage where isolation is required.
- Inject a `ScholarScoutDataStore` with `setScholarScoutDataStoreForTests` for persistence behavior rather than writing the application data file.
- Restore all environment changes and global functions after every test in `apps/web/__tests__/lib/data-store.test.ts`.

**What NOT to Mock:**
- Do not mock pure domain logic, static programme data, or helper composition under `apps/web/lib/`; call exported functions directly.
- Do not mock React components under test; render them and interact through accessible roles/text with Testing Library.
- For `services/http-data-service/test/server.test.mjs`, use a real ephemeral HTTP server and temporary directory so routing, authorization, JSON handling, and backup behavior are covered together.

## Fixtures and Factories

**Test Data:**
```typescript
const PROFILE: OnboardingData = {
  gpaBand: '3.0-3.4',
  interests: ['healthcare', 'stem'],
  locationPreference: 'in-state',
  pathwayPreference: '2-year-community-college',
  affordabilitySensitivity: 2,
  supportNeeds: ['financial-aid', 'tutoring'],
};
```
Use explicit typed fixtures like `PROFILE` in `apps/web/__tests__/lib/preference-matching.test.ts`. For complex data, use local factory functions such as `validSnapshot`, `dataWithBackup`, and `jsonRequest` in `apps/web/__tests__/api/admin-data-routes.test.ts`.

**Location:**
- Fixtures and factories are local to each test file; no shared fixtures directory is present.
- Reuse production static datasets such as `programmes` from `apps/web/lib/programmes.ts` when the test is specifically validating behavior against that catalog.

## Coverage

**Requirements:** None enforced. `apps/web/jest.config.ts` selects the V8 provider but defines no thresholds or collection rules. No coverage script exists in `apps/web/package.json`.

**View Coverage:**
```bash
npm run test --workspace @scholar-scout/web -- --coverage
```

## Test Types

**Unit Tests:**
- Pure domain helpers in `apps/web/__tests__/lib/` cover pagination, onboarding validation, matching, shortlist logic, programme administration, local auth, and recommendations.
- React component tests in `apps/web/__tests__/components/` use jsdom and Testing Library to verify accessibility state, validation, navigation, persistence, and callbacks.

**Integration Tests:**
- `apps/web/__tests__/lib/data-store.test.ts` covers persistence adapter selection, blob/HTTP behavior, backup/restore, roles, optimistic revisions, and audit records using injected stores and mocked provider boundaries.
- `apps/web/__tests__/api/admin-data-routes.test.ts` invokes Next.js route handlers directly, supplies `Request` objects, mocks sessions, and checks HTTP statuses and response bodies.
- `services/http-data-service/test/server.test.mjs` starts the actual service on an ephemeral port and writes to a temporary filesystem directory.
- `scripts/test-production-tooling.mjs` invokes production-readiness tooling and checks generated outputs and failure semantics.

**E2E Tests:**
- Not used. No Playwright, Cypress, or browser-level test configuration is present. Add E2E coverage separately for launch-critical sign-in, onboarding, recommendations, shortlist, and staff workflows.

## Common Patterns

**Async Testing:**
```typescript
await expect(getShortlistPlans('student-1')).resolves.toEqual({
  'metro-cybersecurity': {
    status: 'ready-to-apply',
    note: 'Application looks short.',
  },
});
```
Use promise-aware Jest assertions for library calls, as in `apps/web/__tests__/lib/data-store.test.ts`. For component state transitions, use `waitFor` as in `apps/web/__tests__/components/OnboardingWizard.test.tsx`.

**Error Testing:**
```typescript
await expect(
  saveProgrammeRecord('staff-1', staleProgramme),
).rejects.toMatchObject({
  currentRevision: 2,
});
```
Assert typed/domain error details for rejected operations. For API boundaries, assert the response status and JSON error payload, as in `apps/web/__tests__/api/admin-data-routes.test.ts`. For Node services, assert HTTP status and response fields with `node:assert/strict`.

---

*Testing analysis: 2026-07-21*
