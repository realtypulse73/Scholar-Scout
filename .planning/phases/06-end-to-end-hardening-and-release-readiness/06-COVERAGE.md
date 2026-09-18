# API Coverage — Phase 6

> Full coverage by default. Opt-outs are explicit, reasoned decisions.

| capability | decision | reason |
|---|---|---|
| GitHub Deployments REST: list candidate Preview deployments | INTEGRATE | |
| GitHub Deployments REST: list selected deployment statuses | INTEGRATE | |
| GitHub Deployments REST: create, update, or delete deployments | OPT-OUT | The rehearsal verifies Vercel-created deployments; it must not mutate, promote, or remove deployments. |
| GitHub Deployments REST: environments, policies, and protection rules | OPT-OUT | Temporary Vercel branch configuration remains an authorized maintainer action and is never automated through this read-only integration. |
| GitHub Deployments REST: deployment payload or raw-status retention | OPT-OUT | Release evidence may retain only the approved scrubbed descriptor and must exclude provider payloads. |
| Vercel REST API, SDK, or CLI deployment management | OPT-OUT | The repair uses the GitHub deployment records produced by the existing Vercel Git integration and assumes no Vercel token. |
| Browser-direct GitHub Deployment access | OPT-OUT | The short-lived GitHub token and all deployment lookup remain in the runner process. |

## Integration contract

Plan 06-08 is a blocking read-only discovery step. It observes one actual Git-integrated Vercel Preview deployment and records the accepted non-secret provider creator and environment semantics plus the Phase-6-owned 15-minute status freshness policy. If the repository has no suitable independent GitHub deployment/status evidence, planning requires a new independently controlled source; it never falls back to workflow metadata.

Plan 06-09 implements the two integrated GitHub REST reads with a `deployments: read` Actions permission. The workflow passes `github.token` only to the attestation step. The resolver pages through matching candidate deployments and statuses, selects the sole newest fresh matching deployment/status pair, and fails closed on an equal-newest tie, wrong URL/SHA/environment, malformed data, stale/invalid/future timestamps, or provider failure. It returns only the safe candidate, normalized target, deployment identifier, and timestamp; it never writes a deployment or releases the token/payload to evidence.

Plans 06-10 and 06-11 do not add another external API. They enforce the fixture-derived Blob path in the existing server/runtime boundary and require temporary Vercel branch-scoped configuration, two attested URLs, and verified cleanup of Vercel overrides/refs plus the matching GitHub Actions secrets.

## Automated coverage

- `scripts/preview-deployment-attestation.test.mjs` covers pagination, the newest qualifying deployment/status pair, equal-newest ties, non-tied multiple deployments, status history, URL/SHA/environment mismatches, exact 15-minute freshness boundary, stale/invalid/future timestamps, and no token/payload disclosure.
- `scripts/run-preview-release-tracer.test.mjs` and `scripts/run-preview-outage-rehearsal.test.mjs` prove attestation is completed before lifecycle, browser, or outage traffic and that the token cannot cross to a child process or evidence record.
- `apps/web/__tests__/lib/server/e2e-programme-fixture.test.ts` and `apps/web/__tests__/app/api/internal/e2e-fixture/route.test.ts` prove Blob-path isolation is enforced before adapter work.
- `scripts/test-production-tooling.mjs` proves the workflow has read-only deployment permission, explicit token wiring, no shared path/metadata fallback, two-lane preflight, and required branch/secret/ref cleanup.
