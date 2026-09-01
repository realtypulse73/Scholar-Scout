# Phase 6: End-to-End Hardening and Release Readiness - Context

**Gathered:** 2026-08-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 6 proves that the protected, durable Scholar Scout experience can be released safely. It adds a minimal, repeatable browser-level student journey, fills high-risk automated route/integration coverage, and records production-like release evidence. It does not add product capabilities, replace existing staff/community coverage, use production data, or supersede the Phase 5 live-UAT evidence.

</domain>

<decisions>
## Implementation Decisions

### Required student release journey
- **D-01:** The required browser-level critical path is student-only: programme discovery → onboarding → shortlist → recommendation → simulation. Staff and Phase 5 community behavior remain protected by their existing route/component regressions and completed Phase 5 Preview UAT. — **Reversibility:** costly — adding role-specific browser paths later changes fixture, authentication, and release-evidence contracts.
- **D-02:** Use a resettable isolated fixture with generated non-personal student and programme data before each browser run. Never use production records, public identities, or a personal account.
- **D-03:** Assert observable state transitions: each action succeeds and has a visible effect on the next relevant surface. Onboarding must affect recommendations, a shortlist item must persist, and a simulation must show a result. Do not hard-code the whole recommendation order or governed catalogue output.
- **D-04:** Cover one representative interactive student-facing simulation path in the browser. Retain lower-level coverage for the alternative simulation entry point instead of duplicating it in the release journey.

### Production-like validation boundary
- **D-05:** Keep the browser journey deterministic and isolated, suitable for CI, and run it against a production-like Preview configuration as the release rehearsal. Preview proof supplements rather than replaces the existing protected-main CI and production runbook evidence.
- **D-06:** Capture only non-sensitive evidence: commit, deployment/Preview URL or identifier, UTC timestamp, commands, pass/fail result, and safe error category. Never include credentials, tokens, cookies, exported data, or student content.

### Failure-path coverage
- **D-07:** Keep API, webhook, and persistence failure behavior primarily in route/service integration tests. The browser suite proves the connected happy path and only the smallest safe, deterministic user-facing recovery state needed to ensure a failed transition is not falsely reported as success.
- **D-08:** Failure injection and provider-unavailability proof must remain isolated and restore temporary Preview configuration afterward. Failed external boundaries must fail closed without writing records or disclosing provider details.

### Release decision evidence
- **D-09:** A release candidate passes only when the documented clean-install quality commands, automated high-risk coverage, the isolated browser journey, and the production-like rehearsal each pass. A failed or missing item is a failed release gate, not a warning to waive silently. — **Reversibility:** costly — lowering the gate would weaken the repository’s protected-release contract and operational evidence.
- **D-10:** The maintainer-facing release record uses the existing prelaunch evidence structure plus an explicit browser-journey result and links/identifiers for generated artifacts. It must distinguish local rehearsal, Preview validation, and real production evidence.

### the agent's Discretion
- Select the browser automation framework and exact fixture/reset mechanism from repository evidence, preserving the existing Next.js, TypeScript, pnpm, CI, and Vercel foundations.
- Select the smallest representative simulation and the exact safe recovery assertion, provided every decision above and the Phase 6 roadmap criteria remain true.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and verified predecessor
- `.planning/ROADMAP.md` — authoritative Phase 6 goal, requirements, success criteria, and risk.
- `.planning/REQUIREMENTS.md` — OPS-04, PROD-04, acceptance criteria, and definition of done.
- `.planning/PROJECT.md` — data-safety, delivery, and operational constraints.
- `.planning/STATE.md` — current transition position and deferred external Phase 1 evidence.
- `.planning/phases/05-school-community-and-wny-release-slice/05-VERIFICATION.md` — completed Phase 5 automated and live-UAT evidence that Phase 6 must retain rather than duplicate.
- `.planning/phases/04-incremental-durable-persistence-boundaries/04-CONTEXT.md` — bounded persistence and conflict-safety constraints that the release journey must preserve.

### Release and test operations
- `PROJECT-INDEX.md` — canonical source map and release-document routing.
- `.planning/codebase/TESTING.md` — established web/service test commands and current coverage boundaries.
- `.planning/codebase/INTEGRATIONS.md` — Vercel, NextAuth, Blob/HTTP adapter, OpenAI, and webhook integration contracts.
- `.planning/codebase/ARCHITECTURE.md` — browser/server boundaries, governed catalogue path, and persistence architecture.
- `docs/production-release-runbook.md` — pinned dependency, production-like rehearsal, smoke, monitoring, and evidence requirements.
- `docs/prelaunch-evidence-template.md` — safe release-evidence fields and prohibited secret/data content.
- `docs/phase-5-preview-outage-uat.md` — established Preview-only isolation and restoration pattern for provider failure checks.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/web/__tests__/` and `apps/web/jest.config.ts`: established unit, component, and API route test harnesses for lower-level high-risk behavior.
- `apps/web/app/programmes/page.tsx`, `apps/web/components/onboarding/OnboardingWizard.tsx`, `apps/web/components/programmes/ProgrammeResults.tsx`, shortlist components, recommendation routes, and simulation entry points: connected student journey seams to exercise without redesigning product behavior.
- Existing prelaunch and production-smoke scripts/workflows: release-evidence and artifact conventions to extend rather than replace.

### Established Patterns
- Server routes derive identity from the authenticated session and return safe structured failures; browser tests must not inject ownership or staff identity through request bodies.
- The governed programme boundary supplies student-facing catalogue data; test setup must not bypass it with a parallel source.
- Preview-only UAT uses generated accounts/data, captures safe evidence, and restores temporary configuration after failure injection.

### Integration Points
- Root package scripts and `.github/workflows/` are the CI/rehearsal entry points.
- Vercel Preview is the production-like browser target; real production deployment remains governed by the existing production-release runbook.
- The Phase 5 shared quota/outage evidence and staff moderation flow remain prerequisite evidence, not new browser-suite scope.

</code_context>

<specifics>
## Specific Ideas

- The release check should show a student’s connected path changing state across discovery, onboarding, saved choices, recommendations, and one simulation without asserting unstable full ranking output.

</specifics>

<deferred>
## Deferred Ideas

- Direct school search remains the separate Phase 999.1 backlog item and is not part of the release-readiness browser journey.
- New staff/community browser workflows, additional simulation entry-point browser coverage, and product expansion are deferred unless a later phase explicitly scopes them.

</deferred>

---

*Phase: 06-end-to-end-hardening-and-release-readiness*
*Context gathered: 2026-08-31*
