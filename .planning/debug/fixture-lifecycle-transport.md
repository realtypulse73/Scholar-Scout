---
status: blocked-external-verification
trigger: "Protected Preview fixture lifecycle returns fixture-lifecycle-transport-failed in the GitHub Actions prelaunch rehearsal."
created: 2026-09-09T00:00:00-04:00
updated: 2026-09-10T00:00:00-04:00
---

## Current Focus

bug_class: heisenbug-mandelbug
hypothesis: "No repository-side root cause remains supported. The latest fixture-provision-failed response is either a deployed lifecycle enablement/ID/capability mismatch (4xx), a Vercel protection redirect (3xx), or a deployed durable-adapter write failure (5xx); the scrubbed record now preserves only that safe response class."
test: "All candidate-matched lifecycle sources and focused route, fixture-persistence, protection, tracer, and outage tests were executed; no semantic knowledge-base match exists."
expecting: "An authorized maintainer must verify the selected Preview's deployment-local lifecycle mapping and adapter write readiness without exposing values, then rerun the isolated rehearsal."
next_action: "Await maintainer verification of the selected Preview deployment's one-time fixture enablement, valid fixture ID/capability match, and durable-adapter write access; capture only approved safe status/evidence and rerun the rehearsal."

## Symptoms

expected: "The GitHub Actions protected Preview runner provisions, verifies, traces, and cleans the generated fixture against the selected immutable Preview candidate."
actual: "Candidate quality, high-risk coverage, and the local browser proof pass; the protected Preview browser lane writes a scrubbed fixture-lifecycle-transport-failed record before the outage lane runs."
errors: "fixture-lifecycle-transport-failed"
started: "Observed during the Phase 6 protected Preview rehearsal on 2026-09-09."
reproduction: "Dispatch the prelaunch-rehearsal workflow for the isolated protected Preview candidate with runner-only fixture capability and deployment-protection material."

## Eliminated

- hypothesis: "The current internal fixture route deterministically rejects a valid no-body lifecycle POST before persistence."
  evidence: "The focused guarded route suite passed all 7 tests, including Content-Length: 0 acceptance while body-bearing and browser-shaped requests remain rejected."
  timestamp: 2026-09-10T00:00:00-04:00
- hypothesis: "Generated fixture creation, verification, or cleanup deterministically fails in repository persistence code."
  evidence: "The in-memory fixture suite passed both tests for creating, verifying, and cleaning only the declared generated records through the governed catalogue."
  timestamp: 2026-09-10T00:00:00-04:00
- hypothesis: "The latest failure is caused by stale or different candidate lifecycle source code."
  evidence: "All workflow, runner, route, fixture, programme-record, persistence-operation, and data-store sources match candidate f0fbfe9."
  timestamp: 2026-09-10T00:00:00-04:00
- hypothesis: "The browser-only bypass-cookie redirect regression still causes the latest failure."
  evidence: "The 19 direct lifecycle/protection/tracer/outage tests pass with direct requests carrying only x-vercel-protection-bypass and browser contexts retaining cookie setup; the latest category is provision, not transport."
  timestamp: 2026-09-10T00:00:00-04:00

## Evidence

- timestamp: 2026-09-10T00:00:00-04:00
  observation: "The direct lifecycle/protection/tracer/outage Node suites passed all 20 tests. They verify manual redirects, direct-only bypass headers, browser-only cookie setup, lifecycle cleanup, and that a failed lifecycle request records only redirected, rejected, or server-failed—not a raw status, response body, secret, fixture, or student data."
- timestamp: 2026-09-10T00:00:00-04:00
  observation: "No debug knowledge base exists, and no MemPalace recall connector is available in this session, so there is no matching prior resolution to test."
- timestamp: 2026-09-10T00:00:00-04:00
  observation: "Focused generated-fixture Jest suite passed: 1 suite, 2 tests. The repository's programme-record persistence path can create, verify, and remove the isolated fixture deterministically against the governed catalogue."
- timestamp: 2026-09-10T00:00:00-04:00
  observation: "Focused internal fixture-route Jest suite passed: 1 suite, 7 tests. The repository route accepts the valid no-body Node transport contract and preserves its rejection of body-bearing/browser-shaped requests."
- timestamp: 2026-09-10T00:00:00-04:00
  observation: "All relevant workflow, runner, route, fixture, programme-record, persistence-operation, and data-store files match f0fbfe9. Fixture persistence is a read/mutate/conditional-write sequence; its only repository-level failure modes here are adapter read/write failure or write conflict, both dependent on the deployed adapter state rather than a change since the candidate Preview."
- timestamp: 2026-09-10T00:00:00-04:00
  observation: "The candidate's workflow, direct lifecycle runner, and protected tracer sources match f0fbfe9 despite the workflow checkout lacking an explicit candidate ref. Thus a runner-source mismatch does not explain this failed candidate, though pinning checkout remains a separate integrity improvement."
- timestamp: 2026-09-10T00:00:00-04:00
  observation: "Fixture provisioning requires deployment-local SCHOLARSCOUT_E2E_FIXTURE, fixture ID, and capability values; the workflow supplies only runner capabilities. The provisioner deliberately instructs an authorized maintainer to map the deployment-local values separately. A mismatch or absent value therefore yields a non-OK route result outside repository control."
- timestamp: 2026-09-10T00:00:00-04:00
  observation: "The direct lifecycle request uses HTTPS, no body, manual redirects, a normalized bearer capability, the protocol header, and only x-vercel-protection-bypass. The deployed route permits the no-body Content-Length: 0 form and then POST invokes fixture persistence. Therefore fixture-provision-failed means a non-OK direct POST, but the scrubbed record does not reveal whether it was route denial (403) or an unhandled persistence failure (5xx)."
- timestamp: 2026-09-10T00:00:00-04:00
  observation: "The rehearsal workflow sets GITHUB_SHA from its candidate input but its checkout step does not pin ref to that input. This is a repository candidate-integrity risk, but it has not yet been shown to differ for the failed candidate."
- timestamp: 2026-09-10T00:00:00-04:00
  observation: "The lifecycle route, lifecycle transport, preview-protection helper, Preview tracer, outage runner, and their tests have no uncommitted changes. Commit f0fbfe9 contains the most recent direct/browser header separation; therefore the new failure cannot be attributed to an uncommitted partial application of that fix."
- timestamp: 2026-09-10T00:00:00-04:00
  observation: "Project configuration defines no agent-specific skills and no project skill directories are present. The worktree contains unrelated user modifications and untracked artifacts, so this investigation must limit edits to fixture-lifecycle files and the existing debug record."
- timestamp: 2026-09-10T00:00:00-04:00
  observation: "A complete static review reconfirmed that provision-preview-rehearsal.mjs only creates a local handoff and a scrubbed instruction report; it cannot set Preview deployment variables. The deployed route can therefore return 403 when the maintainer-owned enablement/ID/capability mapping is absent or mismatched, while a configured route can still surface an unhandled adapter write as 5xx. The runner intentionally records neither response detail, so repository inspection cannot distinguish those two external branches."
- timestamp: 2026-09-09T06:00:00Z
  observation: "The existing GitHub Actions run recorded fixture-lifecycle-transport-failed without disclosing a raw exception; its job log contained no additional safe network detail."
- timestamp: 2026-09-09T06:00:00Z
  observation: "A synthetic unauthenticated request to the selected protected Preview was redirected to Vercel login rather than the lifecycle endpoint. No real capability or bypass value was used."
- timestamp: 2026-09-09T06:00:00Z
  observation: "Focused lifecycle tests (18) and production-tooling tests (22) pass after redirect and opaque-value handling coverage was added."
- timestamp: 2026-09-09T06:00:00Z
  observation: "A managed-bypass lifecycle probe reached the protected application but POST/DELETE were denied while GET reached fixture verification. The strict route rejects every Content-Length header."
- timestamp: 2026-09-09T06:00:00Z
  observation: "The route regression with Content-Length: 0 and exact runner headers passes after allowing only that zero-length value; body-bearing input remains denied."
- timestamp: 2026-09-09T06:00:00Z
  observation: "The hardened manual-redirect transport continued to record provisioning failure because the lifecycle request also carried x-vercel-set-bypass-cookie. Vercel uses that browser-only header to redirect after setting a cookie."
- timestamp: 2026-09-09T06:00:00Z
  observation: "Nineteen focused lifecycle/protection/tracer tests and twenty-two production-tooling tests pass after separating direct lifecycle headers from browser context headers."
- timestamp: 2026-09-09T06:00:00Z
  observation: "Fresh isolated baseline and outage Previews for candidate f0fbfe970851f2b1d849862145c7ba3ef57c3215 were Ready. The authorized workflow reached the protected browser lane but recorded only fixture-provision-failed; the outage and aggregation lanes remained fail-closed and did not run."

## Resolution

root_cause: "The previous Content-Length and browser-cookie transport defects are fixed. The latest fixture-provision-failed result is not reproducible in candidate-matched repository code; its unobserved cause remains either deployed Preview lifecycle configuration/capability mismatch or the selected Preview durable-adapter write failure."
fix: "The lifecycle error classifier now records only a scrubbed HTTP-status class when a response exists: redirected (3xx), rejected (4xx), or server-failed (5xx). It retains the generic failure category for absent or non-HTTP transport failures."
verification: "Focused lifecycle/protection/tracer/outage Node tests (20 passed) and production-tooling tests (22 passed). The protected Preview rehearsal remains blocked until a fresh candidate reports the safe class; its record still omits the raw status, response body, and all sensitive material."
files_changed: [".planning/debug/fixture-lifecycle-transport.md"]
