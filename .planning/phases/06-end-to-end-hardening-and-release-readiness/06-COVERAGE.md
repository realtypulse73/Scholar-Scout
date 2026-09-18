# API Coverage — Phase 6

## GitHub Deployments discovery and read integration — Plans 06-08 and 06-09

Phase 6 now reads the GitHub Deployments REST resource as an independently controlled attestation source for Vercel Git-integrated Preview deployments. It uses native `fetch`; no SDK, Vercel token, write operation, deployment promotion, alias operation, or project-setting mutation is added.

| Integration boundary | Source | Request contract | Trusted output | Failure contract | Automated coverage |
| --- | --- | --- | --- | --- | --- |
| Candidate lookup | GitHub repository Deployments API | Read every bounded page for validated `GITHUB_REPOSITORY`, full candidate SHA, and observed Preview semantics using the step-scoped Actions token with `deployments: read` | Deployment candidates ordered by each deployment's newest matching successful status | Missing, non-2xx, unapproved creator/environment, wrong SHA, stale candidate, or equal-newest timestamp across deployment ids fails before lifecycle traffic; a sole newest deployment id is selected | `scripts/preview-deployment-attestation.test.mjs` |
| Deployment status lookup | GitHub repository Deployment Statuses API | Read paginated status data through repository/id-derived API paths | Newest fresh successful status matching the submitted normalized URL | Missing, stale, malformed, wrong URL, wrong environment, or equal-newest tie fails closed | `scripts/preview-deployment-attestation.test.mjs` |
| Protected baseline tracer | GitHub deployment descriptor -> Playwright/lifecycle runner | Trusted descriptor is resolved before lifecycle request or browser construction | Scrubbed candidate-bound baseline record | Attestation error creates only a safe failed record and sends no lifecycle/browser traffic | `scripts/run-preview-release-tracer.test.mjs` |
| Protected outage tracer | GitHub deployment descriptor -> outage no-write runner | Trusted descriptor is resolved before lifecycle request or campus-note request | Scrubbed candidate-bound outage record | Attestation error creates only a safe failed record and sends no lifecycle/outage traffic | `scripts/run-preview-outage-rehearsal.test.mjs` |

## Preview Blob path boundary — Plan 06-10

The one-time local handoff produces two distinct fixture-bound Preview Blob paths. The server derives the only acceptable path from the enabled fixture id and rejects non-Preview, non-Blob, blank, default, external, shared, or mismatched storage configuration before governed-record work. The workflow contains no shared Blob-path secret mapping; temporary Vercel branch-specific overrides and two Git-integrated Preview deployments are maintainer-operated and restored after the rehearsal.

| Boundary | Contract | Automated coverage |
| --- | --- | --- |
| Provisioning -> local handoff | Baseline and outage maps each contain a unique fixture identity, capability, and `scholarscout/preview/{fixture-id}/data.json` path; report has no generated values | `scripts/provision-preview-rehearsal.test.mjs` |
| Preview runtime -> lifecycle route | Runtime must be Vercel Preview with Blob adapter and an exact fixture-bound path before adapter access | `apps/web/__tests__/lib/server/e2e-programme-fixture.test.ts`, `apps/web/__tests__/app/api/internal/e2e-fixture/route.test.ts` |
| Vercel branch override -> release record | Two explicit URL lanes, trusted attestation, exact cleanup, and override/ref restoration are required before aggregate release success | `scripts/test-production-tooling.mjs` (Plan 06-11) |

## Replan source coverage audit

| Source | ID | Required outcome | Coverage | Status |
| --- | --- | --- | --- | --- |
| GOAL | Phase 6 | Protected, durable student journeys have automated and production-like release proof | Existing 06-01 through 06-07; 06-08 discovery; 06-09 attestation/token; 06-10 path/preflight; 06-11 cleanup gate | COVERED |
| REQ | OPS-04 | Automated high-risk API/webhook/data-service and release checks remain trustworthy | 06-09 attestation tests; 06-10 path/preflight tests; 06-11 tooling/cleanup tests | COVERED |
| REQ | PROD-04 | Discovery, onboarding, shortlist, recommendation, and simulation journey remains functional | Existing 06-03/06-06 tracer gated by 06-09 attestation and 06-10 isolation | COVERED |
| RESEARCH | Preview target isolation | Production-like browser check uses generated records/path, protected Preview, and cleanup | 06-08 observes source, 06-09 attests target, 06-10 binds path, 06-11 restores configuration | COVERED |
| RESEARCH | Failure-proof/evidence discipline | Provider failure fails closed without writes or sensitive evidence | 06-09 safe attestation record, 06-10 no-value handoff/runtime guard, 06-11 safe cleanup record | COVERED |
| CONTEXT | D-01 | Student-only journey remains the release tracer | Existing 06-03/06-06, gated by 06-09 | COVERED |
| CONTEXT | D-02 | Generated non-personal fixture is resettable and isolated | Existing lifecycle plus 06-10 exact fixture/path binding | COVERED |
| CONTEXT | D-03 | Journey asserts visible transitions rather than ranking snapshots | Existing 06-03/06-05/06-06 retained | COVERED |
| CONTEXT | D-04 | One representative simulation path is included | Existing 06-03/06-06 retained | COVERED |
| CONTEXT | D-05 | Deterministic Preview rehearsal supplements CI/runbook | 06-08 discovery, 06-09 target attestation, 06-10 runtime preflight, 06-11 two-lane contract | COVERED |
| CONTEXT | D-06 | Evidence is non-sensitive | 06-08 safe discovery, 06-09 safe descriptors, 06-10 no-value path evidence, 06-11 safe restoration | COVERED |
| CONTEXT | D-07 | Failure behavior remains route/service coverage with smallest browser recovery proof | Existing 06-04 and 06-07 retained; replan does not expand browser scope | COVERED |
| CONTEXT | D-08 | Preview outage is isolated and restored | Existing outage runner plus 06-10 path isolation and 06-11 restoration gate | COVERED |
| CONTEXT | D-09 | All quality, high-risk, browser, Preview lanes are release conditions | Existing aggregation plus 06-09 attestation, 06-10 preflight, and 06-11 cleanup conditions | COVERED |
| CONTEXT | D-10 | Record distinct local, Preview, outage, and production evidence | Existing template/runbook plus 06-09 attestation and 06-11 restoration fields | COVERED |

## Revision sequencing

Plan 06-08 is a blocking read-only discovery gate: no fixed Vercel creator or environment is guessed. Plan 06-09 implements the approved attestation with paginated status selection and step-scoped `github.token`. Plan 06-10 owns server runtime Blob-path isolation and no-write preflight. Plan 06-11 owns workflow/runbook setup, two-lane cleanup, and final aggregation. This separation prevents the configuration handoff from racing the runtime isolation work.
