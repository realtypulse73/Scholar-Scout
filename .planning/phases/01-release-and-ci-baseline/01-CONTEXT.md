# Phase 1: Release and CI Baseline - Context

**Gathered:** 2026-07-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Make Scholar Scout's dependency installation, continuous-integration checks, protected-main release flow, and post-deploy verification trustworthy. This phase establishes the delivery baseline only; it does not add product features or change the application persistence model.

</domain>

<decisions>
## Implementation Decisions

### Package-manager standard
- **D-01:** Migrate Scholar Scout to pnpm in Phase 1; npm is no longer a supported installation path after the migration.
- **D-02:** Pin the pnpm version through the root `packageManager` field and enable Corepack so local development, CI, and Vercel use the same version.
- **D-03:** Keep one authoritative root `pnpm-lock.yaml`; remove the root `package-lock.json` and `apps/web/pnpm-lock.yaml`.
- **D-04:** Regenerate and review the root lockfile from the declared workspace manifests rather than adopting the existing untracked lockfile.
- **D-05:** Require frozen-lockfile installs locally, in CI, and on Vercel. Local pnpm caches are ignored, never committed, and are not deleted automatically.

### Required PR checks
- **D-06:** Every pull request runs the full relevant suite: web build, typecheck, lint, Jest tests, HTTP data-service tests, and production-tooling tests.
- **D-07:** Expose checks as separate named CI jobs so each failure is independently visible and unaffected checks can run concurrently.
- **D-08:** Treat build/typecheck/test failures and every lint warning as merge-blocking.
- **D-09:** Run the same quality checks on pull requests and pushes to `main`.

### Release gate
- **D-10:** Protect `main` with GitHub branch protection or rulesets requiring the named CI checks before merge.
- **D-11:** Trigger production deployment only after a successful protected merge to `main`.
- **D-12:** Run automated smoke checks after every production deployment.
- **D-13:** A failed post-deploy smoke check alerts maintainers and follows a documented human rollback procedure; do not auto-rollback while compatible data changes are still evolving.

### Cleanup boundary
- **D-14:** Make the pnpm migration atomic: update package metadata, CI workflows, Vercel configuration, development/deployment documentation, and `.gitignore` together; remove obsolete npm references and stale lockfiles in the same change.

### the agent's Discretion

No decisions were delegated. Planners may choose the exact pnpm version compatible with Node 20 and the exact CI job topology, provided all locked guarantees above hold.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements
- `.planning/ROADMAP.md` — Phase 1 goal, OPS-01/OPS-05 coverage, success criteria, and release-risk boundary.
- `.planning/PROJECT.md` — product constraints: preserve the stack, data safety, current delivery work, and reliable CI.
- `.planning/REQUIREMENTS.md` — OPS-01 and OPS-05 acceptance criteria plus the project-wide definition of done.
- `.planning/STATE.md` — current focus and recorded blockers.
- `.planning/config.json` — sequential execution, Git-tracked planning, and verification preferences.

### Existing delivery architecture
- `.planning/codebase/STACK.md` — Node 20/npm 10 declaration, workspace layout, current lockfile ambiguity, Vercel build path, and supported services.
- `.planning/codebase/ARCHITECTURE.md` — Next.js application and standalone-service boundaries that CI must cover.
- `.planning/codebase/INTEGRATIONS.md` — Vercel hosting plus existing production-readiness and smoke-monitor workflows.
- `.planning/codebase/CONCERNS.md` — the broken CrimClock CI job and package-manager/lockfile ambiguity that this phase resolves.

### Implementation entry points
- `package.json` — root workspaces, engine, scripts, and package-manager declaration.
- `.github/workflows/ci.yml` — current pull-request and push quality workflow, including the unrelated CrimClock job.
- `vercel.json` — current installation and build commands.
- `docs/vercel-deployment.md` — Vercel deployment instructions that must match the chosen package-manager path.
- `.github/workflows/production-readiness.yml` — current production-readiness checks.
- `.github/workflows/production-monitor.yml` — current scheduled smoke-monitor workflow.
- `scripts/production-smoke.mjs` — smoke-check behavior and failure reporting.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Root npm workspace scripts in `package.json`: the migration should preserve equivalent commands rather than change application code.
- Production readiness and smoke scripts in `scripts/`: extend the existing operational checks for post-deploy verification rather than creating a parallel release system.

### Established Patterns
- Next.js web quality lives in the `@scholar-scout/web` workspace; the HTTP data service and production tooling have their own executable tests.
- Vercel builds from repository root, so the package-manager command must be valid for the entire workspace rather than just `apps/web`.
- GitHub Actions already separates CI, production readiness, and periodic production monitoring; preserve that conceptual boundary while making status names and release gates coherent.

### Integration Points
- `.github/workflows/ci.yml` is the primary PR and main-branch quality gate.
- `package.json`, `pnpm-workspace.yaml` if needed, root lockfile, `.gitignore`, `vercel.json`, and deployment documentation must move together.
- GitHub branch protection/rulesets and Vercel production-deployment settings require documented external configuration in addition to repository changes.

</code_context>

<specifics>
## Specific Ideas

- Use a deliberate human rollback after a failed post-deploy smoke check instead of automatic rollback.
- Do not accept the currently untracked pnpm lockfile without regenerating and reviewing it.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 1 scope.

</deferred>

---

*Phase: 1-release-and-ci-baseline*
*Context gathered: 2026-07-25*
