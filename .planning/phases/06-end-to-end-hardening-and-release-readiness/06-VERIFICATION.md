---
phase: 06-end-to-end-hardening-and-release-readiness
verified: 2026-09-18T01:38:11Z
status: gaps_found
score: 4/13 must-haves verified
behavior_unverified: 3
overrides_applied: 0
gaps:
  - truth: "Each browser run owns generated programme records created and removed through the governed catalogue boundary, and fixture mode never serves ordinary seed records."
    status: failed
    reason: "The fixture writes and deletes through the lower-level conditional-mutation primitive, while governed catalogue reads always merge ordinary seed records. The fixture test explicitly expects a seed record to remain."
    artifacts:
      - path: "apps/web/lib/server/e2e-programme-fixture.ts"
        issue: "Uses commitConditionalMutation directly for fixture writes and deletes instead of saveProgrammeRecord/deleteProgrammeRecord."
      - path: "apps/web/lib/server/programme-records.ts"
        issue: "getGovernedProgrammes always merges seed programmes; no fixture-only boundary exists."
    missing:
      - "Route fixture persistence through saveProgrammeRecord and deleteProgrammeRecord."
      - "Make fixture-mode governed reads return only the declared generated records, with a regression test that rejects seed fallback."
  - truth: "A protected Preview student journey passes after lifecycle provisioning and exact cleanup."
    status: failed
    reason: "The only recorded authorized rehearsal stopped at the protected Preview browser lane with fixture-lifecycle-transport-failed; no later successful Preview-browser record exists in the worktree."
    artifacts:
      - path: ".planning/phases/06-end-to-end-hardening-and-release-readiness/06-07-SUMMARY.md"
        issue: "Records Plan 06-07 as blocked and reports the Preview-browser failure."
    missing:
      - "Diagnose and pass the authenticated Preview fixture lifecycle, then retain a scrubbed successful Preview-browser record for the candidate."
  - truth: "A separate Preview outage proof passes, cleans its fixture, restores the base Preview configuration, and is recorded independently."
    status: failed
    reason: "Plan 06-07 states the outage lane was skipped after Preview-browser failure. reports/prelaunch-rehearsal contains no preview-browser.json, preview-outage.json, or release-records.json."
    artifacts:
      - path: "reports/prelaunch-rehearsal"
        issue: "Only legacy readiness/tooling artifacts are present; required Preview lane records are absent."
    missing:
      - "Run the separate outage Preview proof after the baseline Preview succeeds, verify 503-before-write and restoration, and retain its scrubbed record."
  - truth: "The candidate-quality lane records successful immutable install, pnpm test, lint, typecheck, and build before later release lanes."
    status: failed
    reason: "CANDIDATE_QUALITY_COMMANDS does not invoke the required root pnpm test command; it substitutes filtered workspace tests. No completed five-lane candidate record is present."
    artifacts:
      - path: "scripts/prelaunch-rehearsal.mjs"
        issue: "Candidate quality runs filtered test commands rather than root pnpm test."
    missing:
      - "Invoke and record root pnpm test in the prescribed ordered candidate-quality lane, then complete the candidate-bound rehearsal."
  - truth: "Release evidence records distinct successful local-browser, protected Preview-browser, and Preview-outage outcomes with approved identifiers or links."
    status: failed
    reason: "The workflow and schema exist, but the only authoritative Plan 06-07 evidence is a failed Preview-browser result and there is no completed aggregate record."
    artifacts:
      - path: ".planning/phases/06-end-to-end-hardening-and-release-readiness/06-07-SUMMARY.md"
        issue: "Explicitly says the run is not a passing release record and does not complete Plan 06-07."
    missing:
      - "Produce and retain all three independent successful scrubbed browser/outage records plus aggregate release-records.json."
behavior_unverified_items:
  - truth: "The owned local Chromium journey completes discovery, onboarding, shortlist persistence, recommendation, and simulation."
    test: "Run node scripts/run-e2e-fixture.mjs --spec apps/web/e2e/student-release-journey.spec.ts --project chromium in an authorized environment."
    expected: "One generated student completes the journey and the runner deletes only its own fixture records and temporary directory."
    why_human: "The current verification environment must not start the Next server or browser; source and unit tests cannot exercise the full browser/state path."
  - truth: "The browser obtains its guest actor solely through the shared context cookie jar."
    test: "During the owned Chromium journey, verify the initial page-request onboarding call establishes the actor and no caller-supplied identity/credential is used."
    expected: "Onboarding/profile persistence follows the one HttpOnly context cookie without exposing its value."
    why_human: "The Playwright implementation is present, but its live cookie transition was not executed in this verification run."
  - truth: "A maintainer can run the documented production-like release checks end to end and identify a failed external-boundary safeguard before release."
    test: "Dispatch the protected Preview rehearsal for one candidate after the corrected lifecycle and candidate-quality lane are deployed."
    expected: "The gate records every required lane or fails closed with a scrubbed, lane-specific category before release."
    why_human: "This requires authorized Vercel Preview configuration and runner-only secrets; no successful current execution evidence exists."
---

# Phase 6: End-to-End Hardening and Release Readiness — Verification Report

**Phase Goal:** Maintainers can release a production-like Scholar Scout build knowing high-risk boundaries and core student discovery journeys have passed automated and end-to-end checks.

**Verified:** 2026-09-18T01:38:11Z  
**Status:** gaps_found  
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | High-risk API, webhook, and persistence failure contracts have automated proof. | ✓ VERIFIED | Focused web tests: 32/32; webhook service: 9/9; HTTP data service: 13/13; all passed in this verification. |
| 2 | A maintainer has a fail-closed, documented release-check runner that distinguishes its lanes. | ✓ VERIFIED | `scripts/prelaunch-rehearsal.mjs` requires five named records; workflow orders local proof before Preview lanes; `pnpm test:production-tooling` passed 23/23. |
| 3 | The fixed lifecycle transport is capability-gated, production-denied, no-body, and rejects browser-shaped requests before adapter access. | ✓ VERIFIED | Route authorization checks and 30 Node launcher/protection/lifecycle tests passed. |
| 4 | Chromium is configured as a single-worker owned-launcher CI lane with bounded diagnostics. | ✓ VERIFIED | `playwright.config.ts` sets one worker; CI invokes `run-e2e-fixture.mjs` and uploads diagnostics with seven-day retention. |
| 5 | Package provenance for the exact installed browser dependency was approved before installation. | ? UNCERTAIN | `package.json` pins `@playwright/test@1.63.0`, but approval timing and maintainer judgment are not independently provable from source; 06-01 summary is not treated as evidence. |
| 6 | Every fixture creates/removes generated records through the governed catalogue boundary and fixture mode excludes ordinary seed records. | ✗ FAILED | The fixture directly calls `commitConditionalMutation` at `e2e-programme-fixture.ts:123,149`; `getGovernedProgrammes` unconditionally merges seeds at `programme-records.ts:90-92`; its test expects a seed record at `e2e-programme-fixture.test.ts:94,102`. |
| 7 | One owned HTTPS Next process and its exact temporary JSON directory are used for the local browser lane. | ✓ VERIFIED | `run-e2e-fixture.mjs` creates one `mkdtemp` directory, forces JSON child settings, and cleans the same lifecycle/directory; targeted lifecycle tests passed. |
| 8 | A student completes discovery, onboarding, shortlist persistence, recommendation, and simulation in the owned local Chromium run. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | The shared journey contains all transitions in `scripts/student-release-journey.mjs`, but no live browser run was performed here. |
| 9 | The browser establishes the guest actor only through the context cookie jar. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | The journey uses `page.request.get('/api/account/onboarding')` and contains no supplied identity, but its runtime cookie transition was not exercised here. |
| 10 | Protected Preview transport rejects invalid metadata, capability, or bypass material without leaking secrets. | ✓ VERIFIED | Supervisor/protection unit tests passed; the runner creates in-memory protection headers/context options and scrubs outcomes. |
| 11 | The protected Preview student journey passes after fixture provisioning and cleanup. | ✗ FAILED | 06-07 records both authorized runs stopping at Preview-browser with `fixture-lifecycle-transport-failed`; no later passing record exists. |
| 12 | A separate Preview outage proof passes, cleans its fixture, restores baseline Preview, and records its own result. | ✗ FAILED | The same 06-07 record says the outage lane was skipped; required result records are absent from `reports/prelaunch-rehearsal`. |
| 13 | Candidate quality runs the prescribed immutable install, root `pnpm test`, lint, typecheck, and build before all required Preview records pass. | ✗ FAILED | `CANDIDATE_QUALITY_COMMANDS` substitutes filtered workspace test commands for root `pnpm test`; the final five-lane release record is absent. |

**Score:** 4/13 truths verified (3 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `scripts/run-e2e-fixture.mjs` | Owned local HTTPS/JSON browser launcher | ✓ VERIFIED | Substantive; invoked by CI and implements a per-run lifecycle. |
| `scripts/e2e-fixture-lifecycle.mjs` + route | Fixed capability lifecycle transport | ✓ VERIFIED | Route link is exercised by focused tests; no-body/protection checks are substantive. |
| `apps/web/lib/server/e2e-programme-fixture.ts` | Governed fixture create/read/delete without seeds | ✗ STUB AGAINST CONTRACT | It is substantive code but bypasses the required governed write/delete boundary and cannot prevent seed fallback. |
| `playwright.config.ts` + student journey | Serialized protected student tracer | ⚠️ PRESENT, BEHAVIOR UNVERIFIED | Wired from CI/local launcher; no live run performed in this verification. |
| `scripts/run-preview-release-tracer.mjs` | Candidate-bound protected Preview tracer | ⚠️ PARTIAL | Static transport tests pass, but recorded external execution failed at fixture provisioning. |
| `scripts/prelaunch-rehearsal.mjs` + workflow | Complete candidate release gate | ✗ PARTIAL | Five-lane schema and orchestration exist, but candidate quality is not the prescribed command sequence and the external lanes lack passing records. |
| `docs/prelaunch-evidence-template.md` + `docs/production-release-runbook.md` | Separate, scrubbed evidence guidance | ✓ VERIFIED | Documents distinguish local, Preview-browser, Preview-outage, and production evidence. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| Lifecycle supervisor | Internal fixture route | Capability + protocol header | ✓ WIRED | `createLifecycleRequest` targets `/api/internal/e2e-fixture`; 30 focused Node tests passed. |
| Fixture lifecycle | Governed programme operations | Create/read/delete only through programme-record API | ✗ NOT WIRED | Reads use `getGovernedProgrammes`, but writes/deletes bypass `saveProgrammeRecord`/`deleteProgrammeRecord`. |
| Student journey | Onboarding route | Shared Playwright context request | ⚠️ WIRED, behavior unverified | `page.request.get('/api/account/onboarding')` is present; live cookie/session behavior was not run. |
| CI browser job | Local launcher | `run-e2e-fixture.mjs` | ✓ WIRED | `.github/workflows/ci.yml:169` invokes the owned launcher. |
| Preview workflow | Preview supervisor/outage runner | Candidate-bound workflow steps | ✓ WIRED | Workflow invokes both scripts in sequence, but execution evidence shows it stops before outage. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| E2E fixture programme lifecycle | Generated programme records | Direct conditional mutation, then `getGovernedProgrammes` | Records are persisted, but normal seed data is always merged | ✗ HOLLOW FOR FIXTURE CONTRACT |
| Student journey | Programme/onboarding/shortlist/recommendation state | Owned app routes through browser context | Source and selectors are wired; live transition not executed here | ⚠️ BEHAVIOR UNVERIFIED |
| Preview release gate | Candidate-bound lane records | Local runner plus external Preview/outage runners | Only legacy local readiness files exist; required Preview aggregate absent | ✗ DISCONNECTED FROM COMPLETED RELEASE EVIDENCE |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Fixture/protection lifecycle unit behavior | `node --test scripts/run-e2e-fixture.test.mjs scripts/e2e-fixture-lifecycle.test.mjs scripts/preview-deployment-protection.test.mjs scripts/run-preview-release-tracer.test.mjs` | 30 passed | ✓ PASS |
| High-risk web routes and fixture route | Focused Jest command for six Phase 6 suites | 32 passed | ✓ PASS |
| Webhook/data-service failure paths | Two service test commands | 9 webhook + 13 HTTP tests passed | ✓ PASS |
| Release-gate schema/fail-closed logic | `pnpm test:production-tooling` | 23 passed | ✓ PASS |
| Local Chromium and protected Preview behavior | Not run | Starting server/browser or Vercel Preview requires an authorized environment | ? SKIP |

### Probe Execution

No phase probe scripts were declared or found. Step 7c: SKIPPED.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| OPS-04 | 06-01 through 06-07 | High-risk route/integration tests plus minimal end-to-end release check | ✗ BLOCKED | Automated lower-level coverage is present, but governed fixture and completed E2E/rehearsal proof are not. |
| PROD-04 | 06-02, 06-03, 06-05 through 06-07 | Discovery, onboarding, and recommendation journeys remain functional | ✗ BLOCKED | Journey code is wired, but its fixture violates required data isolation and the protected Preview journey has documented failure/no subsequent passing evidence. |

No orphaned Phase 6 requirements were found: the plans claim both OPS-04 and PROD-04.

### Deferred Items

None. The only later roadmap entry, Phase 7, has no planned goal or success criteria that specifically cover fixture isolation, candidate-quality command parity, or the missing protected Preview/outage evidence. These remain Phase 6 gaps.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `apps/web/lib/server/e2e-programme-fixture.ts` | 123, 149 | Direct persistence primitive used instead of required governed programme API | 🛑 Blocker | Breaks the fixture security/data-boundary contract. |
| `apps/web/lib/server/programme-records.ts` | 90-92 | Unconditional seed merge while fixture mode is active | 🛑 Blocker | Browser data is not the declared isolated fixture catalogue. |
| `scripts/prelaunch-rehearsal.mjs` | 11-18 | Candidate-quality test substitution | 🛑 Blocker | Required root `pnpm test` is never executed/recorded. |
| `06-UAT.md` | 42-48 | Claims Preview and paired rehearsal pass despite Plan 06-07 blocked evidence and absent records | ⚠️ Warning | UAT is not reliable evidence for release completion. |

No unresolved `TBD`, `FIXME`, or `XXX` debt markers were found in the reviewed production artifacts. The `return null` in `run-e2e-fixture.mjs:119` is the intentional non-Windows stop-command branch, not a stub.

## Human Verification Needs

1. **Package provenance approval**

**Test:** The maintainer who approved `@playwright/test@1.63.0` should reconfirm the exact reviewed registry/repository release and the pre-install decision.

**Expected:** The approval is independently recorded with reviewer, timestamp, integrity/repository evidence, and applies to the currently pinned version.

**Why human:** Package legitimacy and human approval timing cannot be established from source code or lockfile content.

2. **Corrected end-to-end and Preview rehearsal**

**Test:** After closing the listed gaps, execute the owned Chromium command and dispatch the authorized Preview rehearsal for one immutable candidate.

**Expected:** Local browser, Preview browser, and separate outage/restoration records all pass, are candidate-bound/scrubbed, and aggregate without replacing production evidence.

**Why human:** This requires browser execution, authorized Preview deployment controls, and runner-only secrets.

## Gaps Summary

Phase 6 is not release-ready. The most fundamental data-isolation contract is contradicted by the implementation: generated fixture records bypass the governed programme mutation API, and ordinary seed records are deliberately retained in the test's asserted result. Separately, the sole recorded Preview rehearsal failed before the outage/aggregate lanes, so the UAT's later pass claims cannot close the absence of candidate-bound passing records. The release runner also fails the stated candidate-quality contract by not running root `pnpm test`.

These are **BLOCKER** gaps for OPS-04 and PROD-04. The next action is to plan/implement the fixture-boundary and candidate-quality corrections, then repeat the authorized Preview rehearsal and retain its scrubbed five-lane evidence.

---

_Verified: 2026-09-18T01:38:11Z_  
_Verifier: the agent (gsd-verifier)_
