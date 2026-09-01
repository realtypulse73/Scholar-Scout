# Phase 6: End-to-End Hardening and Release Readiness - Research

**Researched:** 2026-08-31  
**Domain:** Deterministic browser release checks, resettable non-production fixtures, and protected Preview evidence  
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** The required browser-level critical path is student-only: programme discovery → onboarding → shortlist → recommendation → simulation. Staff and Phase 5 community behavior remain protected by their existing route/component regressions and completed Phase 5 Preview UAT. — **Reversibility:** costly — adding role-specific browser paths later changes fixture, authentication, and release-evidence contracts.
- **D-02:** Use a resettable isolated fixture with generated non-personal student and programme data before each browser run. Never use production records, public identities, or a personal account.
- **D-03:** Assert observable state transitions: each action succeeds and has a visible effect on the next relevant surface. Onboarding must affect recommendations, a shortlist item must persist, and a simulation must show a result. Do not hard-code the whole recommendation order or governed catalogue output.
- **D-04:** Cover one representative interactive student-facing simulation path in the browser. Retain lower-level coverage for the alternative simulation entry point instead of duplicating it in the release journey.
- **D-05:** Keep the browser journey deterministic and isolated, suitable for CI, and run it against a production-like Preview configuration as the release rehearsal. Preview proof supplements rather than replaces the existing protected-main CI and production runbook evidence.
- **D-06:** Capture only non-sensitive evidence: commit, deployment/Preview URL or identifier, UTC timestamp, commands, pass/fail result, and safe error category. Never include credentials, tokens, cookies, exported data, or student content.
- **D-07:** Keep API, webhook, and persistence failure behavior primarily in route/service integration tests. The browser suite proves the connected happy path and only the smallest safe, deterministic user-facing recovery state needed to ensure a failed transition is not falsely reported as success.
- **D-08:** Failure injection and provider-unavailability proof must remain isolated and restore temporary Preview configuration afterward. Failed external boundaries must fail closed without writing records or disclosing provider details.
- **D-09:** A release candidate passes only when the documented clean-install quality commands, automated high-risk coverage, the isolated browser journey, and the production-like rehearsal each pass. A failed or missing item is a failed release gate, not a warning to waive silently. — **Reversibility:** costly — lowering the gate would weaken the repository’s protected-release contract and operational evidence.
- **D-10:** The maintainer-facing release record uses the existing prelaunch evidence structure plus an explicit browser-journey result and links/identifiers for generated artifacts. It must distinguish local rehearsal, Preview validation, and real production evidence.

### the agent's Discretion

- Select the browser automation framework and exact fixture/reset mechanism from repository evidence, preserving the existing Next.js, TypeScript, pnpm, CI, and Vercel foundations.
- Select the smallest representative simulation and the exact safe recovery assertion, provided every decision above and the Phase 6 roadmap criteria remain true.

### Deferred Ideas (OUT OF SCOPE)

- Direct school search remains the separate Phase 999.1 backlog item and is not part of the release-readiness browser journey.
- New staff/community browser workflows, additional simulation entry-point browser coverage, and product expansion are deferred unless a later phase explicitly scopes them.
</user_constraints>

## Project Constraints (from AGENTS.md)

- Retain Next.js 15, React 18, TypeScript, NextAuth, and Vercel; avoid platform churn. [VERIFIED: AGENTS.md]
- Protect production data during persistence work; use incremental, tested boundaries. [VERIFIED: AGENTS.md]
- Preserve existing in-progress work and make CI a reliable quality gate before release decisions. [VERIFIED: AGENTS.md]
- Use pnpm 10.34.5 selected through Corepack and the root `pnpm-lock.yaml`; CI/Vercel install with `pnpm install --frozen-lockfile --ignore-scripts`. [VERIFIED: AGENTS.md]
- Keep route authorization and server-only data access on the server; browser code uses pages or `/api` routes. [VERIFIED: AGENTS.md]
- Use strict TypeScript, named domain exports, accessible interactive controls, and the established Jest/component/route test conventions. [VERIFIED: AGENTS.md]

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|---|---|---|
| OPS-04 | High-risk API, webhook, and data-service behaviors have automated route or integration tests, and the product has a minimal end-to-end release check. | Separate integration failure coverage from one isolated Chromium journey; upload browser report/trace artifacts and gate release evidence on their result. [VERIFIED: `.planning/REQUIREMENTS.md`; CITED: https://playwright.dev/docs/ci] |
| PROD-04 | Programme discovery, onboarding, and recommendation journeys remain functional after stabilization work. | Drive the released student path through the governed catalogue, account onboarding/shortlist APIs, recommendations, and one simulation; assert transitions rather than ranking order. [VERIFIED: `.planning/REQUIREMENTS.md`; VERIFIED: `apps/web/app/programmes/page.tsx`, `apps/web/components/recommendations/RecommendationDashboard.tsx`] |
</phase_requirements>

## Summary

Use one Playwright Chromium project as the new browser layer, scoped to a single student release journey. It is the smallest fit for a TypeScript/Next.js/pnpm workspace: its official CI model supports single-worker execution, retries, traces, and a report artifact. Keep the existing Jest route/component suites and native Node HTTP-service tests as the primary proof for API, webhook, persistence, and provider-failure contracts. [CITED: https://playwright.dev/docs/ci] [VERIFIED: `.planning/codebase/TESTING.md`]

The test target must be disposable. A generated fixture mode needs to select a non-production JSON data file or an isolated non-secret Preview Blob path, seed a generated student plus a small deterministic programme set through the governed data path, and reset before every browser run. It must be impossible to enable this mode in `VERCEL_ENV=production`; Phase 5 already establishes the exact Preview-only/restore configuration pattern. [VERIFIED: `docs/phase-5-preview-outage-uat.md`; VERIFIED: `apps/web/lib/server/data-store.ts`]

Preview rehearsal is a release-evidence lane, not a production smoke replacement. Retain the current protected-main CI, readiness workflow, deployment smoke workflow, and production runbook; add a separate Preview browser command that emits a scrubbed result record. A missing or failed required result fails the Phase 6 candidate gate. [VERIFIED: `.github/workflows/ci.yml`; VERIFIED: `docs/production-release-runbook.md`; VERIFIED: `06-CONTEXT.md`]

**Primary recommendation:** Add `@playwright/test` as a root development dependency, run one serialized Chromium journey against generated resettable data, and keep Preview configuration/failure injection isolated, restored, and separately evidenced.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| Student browser journey and visible transition assertions | Browser / Client | Frontend Server (SSR) | Playwright observes rendered UI and navigation; pages obtain governed server data. [VERIFIED: `apps/web/app/programmes/page.tsx`] |
| Fixture activation, seed/reset, and production denial | API / Backend | Database / Storage | Only server code can choose a data adapter/file and must block production activation. [VERIFIED: `apps/web/lib/server/data-store.ts`; VERIFIED: `docs/phase-5-preview-outage-uat.md`] |
| Generated fixture records | Database / Storage | API / Backend | The fixture must be an isolated store/path, never a browser-selected account or production document. [VERIFIED: `apps/web/lib/server/data-store.ts`; VERIFIED: `06-CONTEXT.md`] |
| Failure-injection switch | Frontend Server (SSR) | API / Backend | Preview environment controls the switch, server code makes the unavailable response, and no browser data is written. [VERIFIED: `docs/phase-5-preview-outage-uat.md`] |
| Browser report, trace, and release record | CI / Static artifact storage | CDN / Static | CI produces immutable artifacts; the evidence record only references safe identifiers and outcomes. [CITED: https://playwright.dev/docs/ci; VERIFIED: `docs/prelaunch-evidence-template.md`] |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---|---|---|---|
| `@playwright/test` [ASSUMED] | 1.62.1 (registry observed 2026-08-31) | Browser runner, Chromium automation, retry trace, and HTML report | The official Playwright CI guide specifies CI workers, browser installation, test execution, and report artifacts. [CITED: https://playwright.dev/docs/ci] [VERIFIED: npm registry] |

### Supporting

| Library | Version | Purpose | When to Use |
|---|---|---|---|
| Existing Jest 30.3.0 | Existing | Route/component/unit failure contracts | Keep all API, webhook, persistence, and provider-unavailability logic here; do not move it into browser tests. [VERIFIED: `apps/web/package.json`; VERIFIED: `06-CONTEXT.md`] |
| Node built-in `node:test` | Node 20 | HTTP service and operational scripts | Extend it for real HTTP fixture/service failure behavior and evidence-script tests. [VERIFIED: `.planning/codebase/TESTING.md`] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|---|---|---|
| Playwright | Cypress [ASSUMED] | Cypress could cover browser interaction, but would add a different runner/reporting model with no existing repository use. Playwright has directly verified official CI artifacts and retries guidance for this scope. [CITED: https://playwright.dev/docs/ci] |
| Server-owned fixture reset | Browser-local storage-only reset | Local storage cannot prove server-backed onboarding/shortlist persistence or protect against cross-run server state. [VERIFIED: `apps/web/components/shortlist/ShortlistButton.tsx`; VERIFIED: `apps/web/app/api/account/shortlist/route.ts`] |

**Installation:**

```bash
pnpm add -D -w @playwright/test
pnpm exec playwright install --with-deps chromium
```

**Version verification:** Registry check observed `@playwright/test` version `1.62.1`, modified 2026-08-31; `npm view @playwright/test scripts.postinstall` returned no postinstall script. [VERIFIED: npm registry]

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---|---|---|---|---|---|---|
| `@playwright/test` [ASSUMED] | npm | Created 2020-09-24 | Not collected | Microsoft Playwright docs | Pending seam result | Add a `checkpoint:human-verify` before install; official docs and registry verify existence/current version, but the package-legitimacy seam returned no parseable verdict in this sandbox. [CITED: https://playwright.dev/docs/ci] [VERIFIED: npm registry] |

**Packages removed due to [SLOP] verdict:** none.

**Packages flagged as suspicious [SUS]:** none; the only package requires the human legitimacy checkpoint above because the required seam verdict was unavailable, not because it was rated SUS.

## Architecture Patterns

### System Architecture Diagram

```text
GitHub PR / maintainer command
          |
          v
pnpm E2E command ----> fixture guard (reject VERCEL_ENV=production)
          |                         |
          |                         v
          |                  generated isolated store/path
          |                         |
          v                         v
Playwright Chromium --> Next.js student surfaces --> server-derived actor + governed catalogue
          |                         |
          |                         +--> onboarding / shortlist persistence
          |                         +--> recommendation computation
          |                         +--> one simulation result
          v
observable assertions --> HTML report + retry trace --> scrubbed release-evidence entry

Preview rehearsal: protected Preview URL + generated Preview-only fixture
          |
          +--> optional isolated outage switch --> safe unavailable UI / no write
          +--> restore prior temporary configuration --> record safe result
```

### Recommended Project Structure

```text
apps/web/
├── e2e/
│   └── student-release-journey.spec.ts   # one serialized Chromium critical path
├── lib/server/
│   └── e2e-fixture.ts                    # server-only generated seed/reset + production guard
└── app/api/test-support/                 # only if needed: non-production, token-gated fixture control

scripts/
└── release-evidence.mjs                  # combines safe command/artifact status; never reads secret values

.github/workflows/
└── ci.yml                                # existing quality lanes plus distinct browser job/artifact upload
```

### Pattern 1: Server-owned, fail-closed fixture lifecycle

**What:** Reset a generated fixture at test start, run the journey, then remove/reset it in `finally`; the reset API or helper is server-only, bounded to generated identifiers, and rejects production. [VERIFIED: `docs/phase-5-preview-outage-uat.md`; VERIFIED: `apps/web/lib/server/data-store.ts`]

**When to use:** Every local/CI browser invocation and every Preview rehearsal. Use a unique run identifier/path; do not share a default Preview document across runs. [VERIFIED: `06-CONTEXT.md`; VERIFIED: `docs/phase-5-preview-outage-uat.md`]

**Example:**

```typescript
// Source: repository pattern from docs/phase-5-preview-outage-uat.md
if (process.env.VERCEL_ENV === 'production') {
  throw new Error('E2E fixture mode is unavailable in production.');
}

const fixture = await resetGeneratedE2eFixture({ runId });
try {
  await runBrowserJourney(fixture.baseUrl);
} finally {
  await resetGeneratedE2eFixture({ runId });
}
```

### Pattern 2: Transition-focused single browser tracer

**What:** Assert stable user-visible state after each transition: a programme exists, onboarding completion reaches a changed recommendation surface, a shortlist save is visible after navigation/reload, and a simulation result is rendered. [VERIFIED: `06-CONTEXT.md`; VERIFIED: `apps/web/components/recommendations/RecommendationDashboard.tsx`; VERIFIED: `apps/web/components/simulation/SimulationPlayer.tsx`]

**When to use:** The one student-only release test. Do not assert a fixed catalogue total, full ranking order, provider internals, staff controls, or the alternative simulation entry point. [VERIFIED: `06-CONTEXT.md`]

### Pattern 3: CI evidence without sensitive payloads

**What:** Upload Playwright HTML results and retry traces as CI artifacts; put only commit, deployment ID/URL, UTC time, command, pass/fail, and a safe error category into the release record. [CITED: https://playwright.dev/docs/ci; CITED: https://playwright.dev/docs/trace-viewer-intro; VERIFIED: `docs/prelaunch-evidence-template.md`]

**When to use:** Every CI run and Preview rehearsal. Treat raw screenshots/traces as restricted CI artifacts; do not paste them or any cookies/data into operations notes. [VERIFIED: `06-CONTEXT.md`]

### Anti-Patterns to Avoid

- **Using production or a shared Preview document:** It violates D-02/D-08 and can mix generated activity with real or other-test data. Use a unique generated fixture path per run. [VERIFIED: `06-CONTEXT.md`; VERIFIED: `docs/phase-5-preview-outage-uat.md`]
- **Browser-bypassing server identity:** The existing account routes derive identity from the session; never place user IDs, staff status, or storage keys in test request bodies. [VERIFIED: `apps/web/app/api/account/onboarding/route.ts`; VERIFIED: `apps/web/app/api/account/shortlist/route.ts`]
- **Adding browser tests for every high-risk failure:** This makes a costly, flaky suite and conflicts with D-07. Use route/service integration tests for deterministic failure contracts. [VERIFIED: `06-CONTEXT.md`; VERIFIED: `.planning/codebase/TESTING.md`]
- **Storing a Vercel protection bypass token in a URL, report, or test artifact:** Keep it as a CI secret/header only; Vercel recommends the header form. [CITED: https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Browser protocol driver, auto-waits, retry traces, and HTML reporting | Custom Puppeteer/WebDriver wrapper | Playwright runner/reporting [ASSUMED package] | Browser process lifecycle and actionable diagnostics are already supplied by the official runner. [CITED: https://playwright.dev/docs/ci; CITED: https://playwright.dev/docs/trace-viewer-intro] |
| Production smoke replacement | Another ad-hoc fetch script | Existing `scripts/production-smoke.mjs` and release runbook | The current monitor validates expected public/auth/data-health contracts and retains production-specific evidence. [VERIFIED: `scripts/production-smoke.mjs`; VERIFIED: `docs/production-release-runbook.md`] |
| Fixture reset through client storage | Browser `localStorage` cleanup alone | Server-owned generated data adapter/path reset | The journey must prove account-backed writes and avoid residue outside the browser. [VERIFIED: `apps/web/components/shortlist/ShortlistButton.tsx`; VERIFIED: `apps/web/app/api/account/shortlist/route.ts`] |
| Preview protection weakening | Public Preview exception | Vercel automation bypass header stored in CI secret | It supports automation against protected deployments without making Preview public. [CITED: https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation] |

**Key insight:** The browser test is a narrow release tracer, not a second copy of all lower-level tests or a deployment-control system.

## Common Pitfalls

### Pitfall 1: Fixture state leaks across retries or parallel workers

**What goes wrong:** An earlier run's onboarding/shortlist changes alter a later test's recommendation output.  
**Why it happens:** The application persists server state while only browser state is cleared.  
**How to avoid:** Use a unique generated run ID/store path, reset before each test, single worker in CI, and cleanup in `finally`. Playwright documents a one-worker CI option. [CITED: https://playwright.dev/docs/ci]  
**Warning signs:** Passing locally but order-dependent CI failures or a non-empty fixture before a run. [ASSUMED]

### Pitfall 2: A Preview rehearsal silently targets the wrong environment

**What goes wrong:** A command reaches production, a default Preview document, or an unprotected URL.  
**Why it happens:** Base URLs/paths and temporary environment changes are not explicitly recorded or restored.  
**How to avoid:** Require `VERCEL_ENV=preview`, a generated fixture path, protected URL access, and a finally-style restoration record. Phase 5 already makes Preview-only failure configuration and restoration mandatory. [VERIFIED: `docs/phase-5-preview-outage-uat.md`]  
**Warning signs:** Missing deployment ID, no generated path/run ID, or a config change that cannot name its restoration step. [ASSUMED]

### Pitfall 3: Evidence leaks sensitive test material

**What goes wrong:** Cookies, tokens, a protected-bypass secret, screenshots with student content, or a full persisted document appears in an issue/comment.  
**Why it happens:** Raw test output is used as the release record.  
**How to avoid:** Use the existing prelaunch template's redaction rule; retain only safe metadata in notes and restrict raw reports to CI artifacts. [VERIFIED: `docs/prelaunch-evidence-template.md`; VERIFIED: `06-CONTEXT.md`]  
**Warning signs:** Evidence fields include request headers, response bodies, fixture records, or copied environment output. [ASSUMED]

### Pitfall 4: Flaky browser checks become a release waiver

**What goes wrong:** A rerun hides a state isolation or readiness problem and release proceeds.  
**Why it happens:** Retries are treated as a pass without inspecting failure evidence.  
**How to avoid:** Retain on-first-retry trace/report, categorize failure safely, and make a failed/missing required item fail D-09 rather than becoming advisory. [CITED: https://playwright.dev/docs/trace-viewer-intro; VERIFIED: `06-CONTEXT.md`]  
**Warning signs:** A flaky result, missing artifact, or a report without an explicit final pass/fail. [ASSUMED]

## Code Examples

### Minimal deterministic Playwright configuration

```typescript
// Source: https://playwright.dev/docs/ci and https://playwright.dev/docs/trace-viewer-intro
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './apps/web/e2e',
  fullyParallel: false,
  workers: process.env.CI ? 1 : undefined,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: process.env.SCHOLARSCOUT_E2E_BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

### Transition assertions, not rank snapshots

```typescript
// Source: Phase 6 D-01 through D-04, repository labels must be confirmed in implementation.
await page.goto('/programmes');
await expect(page.getByRole('heading', { name: /programmes/i })).toBeVisible();
await page.getByRole('link', { name: /view details/i }).first().click();
await page.getByRole('button', { name: /save to shortlist/i }).click();
await expect(page.getByRole('button', { name: /saved to shortlist/i })).toBeVisible();

await page.goto('/onboarding');
// Complete generated fixture's stable fields, then prove the next surface changes.
await page.getByRole('button', { name: /finish/i }).click();
await page.goto('/recommendations');
await expect(page.getByText(/adaptive recommendation dashboard/i)).toBeVisible();
await expect(page.getByText(/ranked recommendations/i)).toBeVisible();
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| Jest/component/API tests only; no detected browser layer | A minimal dedicated browser tracer plus existing lower-level suites | Phase 6 | Browser proof can exercise the student path while route/service tests retain deterministic failure coverage. [VERIFIED: `.planning/codebase/TESTING.md`; VERIFIED: `06-CONTEXT.md`] |
| Untargeted Preview proof | Protected, isolated Preview with generated records/path and explicit restore step | Phase 5 | Provides a precedent for Preview-only failure validation without production impact. [VERIFIED: `docs/phase-5-preview-outage-uat.md`] |

**Deprecated/outdated:**

- Treating an E2E run as a replacement for route/service integration tests is out of scope and contradicted by D-07. [VERIFIED: `06-CONTEXT.md`]
- Using the JSON adapter as a production target remains prohibited by the production environment checker. [VERIFIED: `scripts/production-env-check.mjs`]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| A1 | `@playwright/test` will remain the selected dependency after the mandatory legitimacy checkpoint. | Standard Stack / Package Legitimacy | The plan would need to choose an approved browser runner before installation. |
| A2 | A generated fixture can be exposed through a server-only helper or non-production token-gated control without requiring a new public API. | Architecture Patterns | Implementation may need a different internal execution seam. |
| A3 | One CI worker is sufficient for the initial tracer's time budget. | Common Pitfalls | CI duration could require controlled optimization after stable baseline evidence. |

## Open Questions

1. **What non-production authentication seam should the student release journey use?**
   - What we know: The journey needs server-derived student identity, and the app's account routes enforce it. [VERIFIED: `apps/web/app/api/account/onboarding/route.ts`; VERIFIED: `apps/web/app/api/account/shortlist/route.ts`]
   - What's unclear: Whether the fixture can use a safe test-only credentials flow, an existing guest actor, or a Preview-only generated account without leaking a browser credential into evidence.
   - Recommendation: Planner must inspect `auth.ts`, `AuthForm.tsx`, and route tests, then choose one server-owned non-production path. It must reject production and redact credentials/artifacts. [ASSUMED]

2. **Which existing simulation has the smallest stable interactive surface?**
   - What we know: There are two simulation component namespaces; D-04 requires only one browser path. [VERIFIED: `apps/web/components/simulation/SimulationPlayer.tsx`; VERIFIED: `apps/web/components/simulations/SimulationPlayer.tsx`; VERIFIED: `06-CONTEXT.md`]
   - What's unclear: Which page mounts the most deterministic representative entry point.
   - Recommendation: Select the route backed by `apps/web/components/simulation/SimulationPlayer.tsx`, because it saves then links to recommendations, unless route inspection finds the other namespace is the actual current student entry point. [ASSUMED]

3. **How will the protected Preview browser runner receive its Vercel bypass secret?**
   - What we know: Vercel supports an `x-vercel-protection-bypass` header and optional bypass cookie for automated protected deployment tests. [CITED: https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation]
   - What's unclear: Whether project administrators will configure that secret for the CI environment.
   - Recommendation: Make this a maintainer-owned external checkpoint; do not hard-code a bypass, make Preview public, or block local/CI fixture work on it. [ASSUMED]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|---|---|---|---|---|
| Node.js | Next.js, Playwright | ✓ | v20.20.2 | — |
| pnpm | Workspace commands | ✓ | 11.19.0 locally; project requires 10.34.5 | Use Corepack-selected project version; local global version is not authority. [VERIFIED: `package.json`] |
| Corepack | Pinned pnpm selection | ✗ (sandbox invocation failed) | — | CI already invokes `corepack enable`; planner should verify on execution host. [VERIFIED: `.github/workflows/ci.yml`] |
| `@playwright/test` + Chromium | Browser journey | ✗ | — | Install only after package legitimacy checkpoint. |
| GitHub Actions Ubuntu browser dependencies | CI browser job | Not yet configured | — | `pnpm exec playwright install --with-deps chromium` in a distinct CI job. [CITED: https://playwright.dev/docs/ci] |
| Vercel protected Preview + automation bypass secret | Preview rehearsal | External / unverified | — | Human-maintainer checkpoint; local fixture run remains available. [CITED: https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation] |

**Missing dependencies with no fallback:** None for local planning; the Preview automation secret is required only before protected Preview rehearsal.

**Missing dependencies with fallback:** Browser runner/browser binary (install after legitimacy gate); protected Preview bypass secret (local/CI fixture run until maintainer configures it).

## Validation Architecture

### Test Framework

| Property | Value |
|---|---|
| Framework | Jest 30.3.0 + Node `node:test`; add Playwright Chromium after checkpoint. [VERIFIED: `apps/web/package.json`; VERIFIED: `.planning/codebase/TESTING.md`] |
| Config file | `apps/web/jest.config.ts`; `playwright.config.ts` is a Wave 0 gap. |
| Quick run command | `pnpm --filter @scholar-scout/web test --runInBand -- __tests__/api` |
| Full suite command | `pnpm test && pnpm --filter @scholar-scout/web run lint && pnpm --filter @scholar-scout/web run typecheck && pnpm exec playwright test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|---|---|---|---|---|
| OPS-04 | High-risk route/webhook/data-service rejection and no-write behavior | Jest route + Node HTTP integration | `pnpm test` | ✅ existing harness; targeted cases need audit/extension |
| OPS-04 | Minimal student browser release tracer with artifact output | Playwright E2E | `pnpm exec playwright test` | ❌ Wave 0 |
| OPS-04 | Preview-only failure injection restores config and reports safe result | Node operational/integration + maintainer Preview check | `pnpm test:production-tooling` | ✅ operational harness; Preview procedure extension needed |
| PROD-04 | Discovery → onboarding → shortlist → recommendations → one simulation stays connected | Playwright E2E | `pnpm exec playwright test apps/web/e2e/student-release-journey.spec.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** targeted Jest/Node command and `pnpm exec playwright test` once the suite exists.
- **Per wave merge:** `pnpm test`, web lint/typecheck, and the Chromium journey.
- **Phase gate:** Clean install quality commands, high-risk coverage, browser report, and Preview rehearsal all pass; missing evidence is failure. [VERIFIED: `06-CONTEXT.md`]

### Wave 0 Gaps

- [ ] `playwright.config.ts` — single Chromium project, one worker in CI, trace/report output.
- [ ] `apps/web/e2e/student-release-journey.spec.ts` — D-01 through D-04 transition tracer.
- [ ] Server-only generated fixture/reset helper with an unconditional production denial.
- [ ] Distinct CI browser job that installs Chromium and uploads report/test results; do not overload existing Jest job.
- [ ] Scrubbed release-evidence extension that distinguishes local, Preview, and production proof.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V2 Authentication | Yes | Server-derived generated student session/actor; no browser-supplied identity. [VERIFIED: `apps/web/app/api/account/onboarding/route.ts`] |
| V3 Session Management | Yes | Do not publish credentials/cookies in reports; preserve authenticated route contracts. [VERIFIED: `06-CONTEXT.md`] |
| V4 Access Control | Yes | Student-only suite; fixture reset/control denies production and any staff/community scope is excluded. [VERIFIED: `06-CONTEXT.md`] |
| V5 Input Validation | Yes | Fixture controls accept only bounded generated identifiers; integration tests retain invalid-input proof. [VERIFIED: `.planning/codebase/TESTING.md`] |
| V6 Cryptography | Yes | Use Vercel-managed protection-bypass secret only as CI secret/header; do not implement custom bypass or crypto. [CITED: https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation] |

### Known Threat Patterns for browser release checks

| Pattern | STRIDE | Standard Mitigation |
|---|---|---|
| Fixture switch writes production data | Tampering | Fail closed when `VERCEL_ENV=production`; unique non-production data path/run ID. [VERIFIED: `docs/phase-5-preview-outage-uat.md`] |
| Test identity is supplied by browser data | Spoofing | Resolve actor/session on server; no raw user keys in test request body. [VERIFIED: `apps/web/app/api/account/onboarding/route.ts`] |
| Secret/cookie in evidence | Information disclosure | Scrubbed summary only; CI artifact access is separate from release note. [VERIFIED: `docs/prelaunch-evidence-template.md`; VERIFIED: `06-CONTEXT.md`] |
| Preview protection is disabled publicly | Elevation of privilege | Use Vercel automation bypass secret/header, never a broad public exception. [CITED: https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation] |
| Provider outage causes a write or internal disclosure | Tampering / Information disclosure | Existing Preview-only outage pattern, route/service integration test, and visible safe recovery assertion. [VERIFIED: `docs/phase-5-preview-outage-uat.md`; VERIFIED: `06-CONTEXT.md`] |

## Sources

### Primary (HIGH confidence)

- Repository sources: `06-CONTEXT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/PROJECT.md`, `.planning/STATE.md`, `AGENTS.md`, `PROJECT-INDEX.md` — scope, decisions, operational constraints, and requirements. [VERIFIED: repository]
- `docs/phase-5-preview-outage-uat.md` — Preview-only activation, isolated path, evidence, and restoration precedent. [VERIFIED: repository]
- `docs/production-release-runbook.md`, `docs/prelaunch-evidence-template.md`, `.github/workflows/ci.yml`, `.github/workflows/production-readiness.yml`, `.github/workflows/production-monitor.yml` — existing release and evidence lanes. [VERIFIED: repository]
- `apps/web/app/programmes/page.tsx`, onboarding/shortlist/recommendation/simulation components and account routes — actual student journey seams. [VERIFIED: repository]

### Secondary (MEDIUM confidence)

- [Playwright CI](https://playwright.dev/docs/ci) — workers, browser installation, GitHub Actions execution, artifact output. [CITED: https://playwright.dev/docs/ci]
- [Playwright Trace Viewer](https://playwright.dev/docs/trace-viewer-intro) — retry trace and HTML report behavior. [CITED: https://playwright.dev/docs/trace-viewer-intro]
- [Vercel Automation Protection Bypass](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation) — protected Preview automation header/cookie behavior. [CITED: https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation]
- [Vercel environment variables](https://vercel.com/docs/environment-variables) — Preview-scoped variables apply to future Preview deployments. [CITED: https://vercel.com/docs/environment-variables]

### Tertiary (LOW confidence)

- `@playwright/test` selected pending package-legitimacy seam result; registry existence/version observed but that alone is not a legitimacy verdict. [ASSUMED]

## Metadata

**Confidence breakdown:**

- Standard stack: MEDIUM — official Playwright documentation and registry were checked, but the package-legitimacy seam did not return a parsable verdict.
- Architecture: HIGH — constrained by locked Phase 6 decisions and existing fixture/release patterns.
- Pitfalls: MEDIUM — grounded in official CI/Preview documentation plus existing Phase 5 safety constraints; warning signs are implementation assumptions.

**Research date:** 2026-08-31  
**Valid until:** 2026-09-30 for repository architecture; re-check package/version and Vercel automation details immediately before installation or Preview setup.
