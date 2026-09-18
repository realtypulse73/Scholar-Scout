---
status: awaiting_human_verify
trigger: "Protected Preview fixture lifecycle returns fixture-lifecycle-transport-failed in the GitHub Actions prelaunch rehearsal."
created: 2026-09-09T00:00:00-04:00
updated: 2026-09-17T04:28:00-04:00
---

## Current Focus

bug_class: bohrbug
reasoning_checkpoint:
  hypothesis: "When a local release-lane command fails, runReleaseLane retains the failed record only in memory and --local-only returns 0 before validating it, so Preview lanes run and aggregation later contains only their persisted records."
  confirming_evidence:
    - "The PATH-shadowed pnpm regression exits 0 when the first candidate-quality command exits 1."
    - "runReleaseLane writes only successful records; --local-only returns before aggregateReleaseRecords or any failure exit."
    - "A controlled aggregate preserves all valid local records and emits only the present valid lanes when a local record is absent."
  falsification_test: "After persisting failed lane records and validating local-only records, the same fake pnpm failure would still return exit 0 or produce an unsanitized/missing candidate-quality failure record."
  fix_rationale: "Write the lane record regardless of outcome, then reject a local-only run unless each local lane has a valid candidate-bound passing record. This stops before Preview work while retaining only permitted scrubbed evidence."
  blind_spots: "The artifact cannot identify which real candidate-quality command failed; this repair makes that failure visible and fail-closed but does not claim to repair its unknown external trigger."
  candidate_causes:
    - "code: runReleaseLane omits failed-record persistence and --local-only never turns a non-passing local record into a failing process exit."
    - "environment: an actual candidate-quality command returned nonzero during the authorized run, but the record contract intentionally did not retain its command-level diagnostic."
  and_gate: "yes: the observed two-Preview-lane aggregate required both an actual local command failure and code that swallowed it; this fix addresses the repository-side contributing cause and exposes the external trigger safely."
test: "An authorized maintainer dispatches a fresh candidate rehearsal after these changes are available on the selected immutable candidate."
expecting: "A failed local lane stops the workflow before either Preview runner; a passing local proof persists three candidate-bound records and aggregate retains all five lanes."
next_action: "Await authorized Preview rehearsal confirmation using scrubbed artifact/deployment identifiers only."

## Symptoms

expected: "The GitHub Actions protected Preview runner provisions, verifies, traces, and cleans the generated fixture against the selected immutable Preview candidate."
actual: "Candidate quality, high-risk coverage, and the local browser proof pass; the protected Preview browser lane writes a scrubbed fixture-lifecycle-transport-failed record before the outage lane runs."
errors: "fixture-lifecycle-transport-failed"
started: "Observed during the Phase 6 protected Preview rehearsal on 2026-09-09."
reproduction: "Dispatch the prelaunch-rehearsal workflow for the isolated protected Preview candidate with runner-only fixture capability and deployment-protection material."

## Eliminated

- hypothesis: "The authorized rehearsal checked out a revision different from candidate 294c98c5111fedb537ad951e0ddd2309c7162793."
  evidence: "Scrubbed GitHub Actions metadata for run 35176032342 reports headSha exactly equal to the nominated candidate, so the unpinned checkout is an integrity risk but did not cause this run."
  timestamp: 2026-09-17T03:49:00-04:00

- hypothesis: "The current repository aggregation helper loses valid candidate-quality, high-risk, and local-browser records."
  evidence: "A controlled aggregate-only invocation with all five minimal safe candidate-bound records exited 0 and wrote all five lanes. With only high-risk.json removed, it exited 1 and wrote the remaining four lanes, proving it preserves independently valid local records and fails closed."
  timestamp: 2026-09-17T03:38:00-04:00

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

- timestamp: 2026-09-17T04:04:00-04:00
  observation: "The agent-authored regression was RED before the fix (fake pnpm exited 1 while the local-only runner exited 0) and GREEN after it (runner exits 1 and candidate-quality.json contains only candidateCommit, recordedAt, commands, outcome, and errorCategory)."

- timestamp: 2026-09-17T04:14:00-04:00
  observation: "pnpm test:production-tooling passed all 23 tests after the repair. The scoped diff adds failure persistence and validation; it contains no behavior-deleting shortcut. No Stryker package or configuration exists, so mutation testing is unavailable."

- timestamp: 2026-09-17T04:20:00-04:00
  observation: "Revert-and-reconfirm passed: reversing only the local-only validation and failed-record persistence hunk made the focused regression fail again with an incorrect zero exit; reapplying the same hunk made it pass."

- timestamp: 2026-09-17T04:28:00-04:00
  observation: "Final verification passed: pnpm test:production-tooling completed 23/23 after the controlled reapply, and git diff --check reported no whitespace errors. The synthetic workspace aggregate fixture was removed after inspection."

- timestamp: 2026-09-17T03:49:00-04:00
  observation: "runReleaseLane returns a failed in-memory record without writing its lane JSON. In --local-only mode, main immediately returns after the lane sequence and never calls aggregateReleaseRecords or sets a nonzero exit code for a failed record. Thus an early failed candidate-quality command leaves all local evidence absent while the workflow step is marked successful; later Preview records can be the only serialized aggregate fields. GitHub run 35176032342 headSha equals candidate 294c98c5111fedb537ad951e0ddd2309c7162793, eliminating source-checkout mismatch for this run."

- timestamp: 2026-09-17T03:38:00-04:00
  observation: "Focused aggregate-only reproduction: five valid minimal scrubbed records produced a successful release-records.json with all five lanes. Removing only high-risk.json produced the expected fail-closed exit and release-records.json with candidate-quality, local-browser, preview-browser, and preview-outage. Therefore the actual two-Preview-lane artifact requires every local record to have been absent or invalid before aggregate execution; it is not reproduced by the current writer/loader/aggregator."

- timestamp: 2026-09-17T03:27:00-04:00
  observation: "The first aggregate-only harness did not reach repository code because this sandbox rejects Node path resolution under the system Temp parent with EPERM. The five scrubbed fixture files were present, but no release-records.json was written. This is an environment limitation of the diagnostic setup, not evidence about release-record behavior."

- timestamp: 2026-09-17T03:20:00-04:00
  observation: "The protected Preview and outage CLI runners only create the parent directory and write their explicitly requested preview-browser.json or preview-outage.json files. The lifecycle helper performs HTTP POST/GET/DELETE only. None of those repository paths removes, renames, or overwrites candidate-quality.json, high-risk.json, or local-browser.json."

- timestamp: 2026-09-17T03:12:00-04:00
  observation: "The single-job workflow runs local proof, protected Preview browser proof, Preview outage proof, and aggregate-only in order using the same reports/prelaunch-rehearsal directory. Successful local lanes write candidate-quality.json, high-risk.json, and local-browser.json; aggregate loads exactly those files. Its JSON serialization omits an undefined local property, explaining why the retained release-records.json can contain only the two Preview records when the three local loads fail validation or their files are absent."

- timestamp: 2026-09-17T02:55:00-04:00
  observation: "Authorized Preview-only rehearsal 35176032342 passed candidate quality, high-risk, local-browser, protected Preview-browser, and Preview-outage/restoration steps. Its aggregate step still failed. The retained scrubbed artifact showed passed Preview records bound to candidate 294c98c5111fedb537ad951e0ddd2309c7162793, but no candidate-quality, high-risk, or local-browser records; release-records.json therefore contained only the two Preview lanes."

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

root_cause: "An actual candidate-quality command failed, and the repository release gate neither persisted its scrubbed failed record nor exited nonzero in --local-only mode. That allowed Preview proof to run and produced an aggregate containing only Preview records."
fix: "runReleaseLane now persists its scrubbed record on success or failure, and --local-only validates all three local candidate-bound records before returning; missing or failed evidence now exits nonzero before Preview work."
oracle_type: "specified (D-09 requires missing or failed candidate-quality, high-risk, or local-browser proof to exit nonzero before later release lanes can pass)."
verification:
  target_test: { result: pass }
  mutation_check: { result: skipped, reason_if_skipped: "No Stryker package or configuration exists in this repository." }
  no_op_deletion: { result: pass, deletion_justified_by_rca: false }
  adjacent_tests: { result: pass, suites_run: ["pnpm test:production-tooling (23 passing)"] }
  revert_and_reconfirm: { result: pass, bug_returned_on_revert: true, fixed_on_reapply: true }
  guardrail_verdict: accepted
files_changed: ["scripts/test-production-tooling.mjs", ".planning/debug/fixture-lifecycle-transport.md"]
