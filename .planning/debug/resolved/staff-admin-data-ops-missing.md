---
status: resolved
trigger: "After an apparently signed-in staff session, the deployed /admin/programmes view shows an error alert and lacks Data operations."
created: 2026-08-28T22:15:00-04:00
updated: 2026-08-28T18:14:00-04:00
---

# Debug Session: Staff Admin Data Operations Missing

## Symptoms

- expected: An authorized staff session opens `/admin/programmes` without an error and sees the Data operations section.
- actual: The deployed page renders only the admin navigation plus an empty error alert; Data operations is absent.
- errors: Browser DOM exposes an alert with no text; no application details are exposed.
- timeline: Observed during Phase 3 UAT after the fresh preview containing commit `371054b` was deployed.
- reproduction: Sign into the protected preview, sign into Scholar Scout, then open the branch preview `/admin/programmes` route.

## Current Focus

hypothesis: Confirmed configuration omission: the Preview deployment has no `SCHOLARSCOUT_STAFF_EMAILS` variable, so live active-staff authorization correctly fails closed.
test: User-owned Vercel dashboard search for the variable name across environments.
expecting: No variable-name result confirms the active-staff allowlist cannot authorize Preview sessions.
next_action: Operator adds `SCHOLARSCOUT_STAFF_EMAILS` to Preview, redeploys, re-signs in if needed, and reruns Phase-3 UAT; no application change is warranted.
bug_class: bohrbug
reasoning_checkpoint:
  hypothesis: Preview data operations are denied because the required active-staff allowlist variable is absent from the deployed Preview environment.
  confirming_evidence:
    - Signed-in Vercel dashboard search returned no result for the variable name in any environment, including Preview.
    - `requireActiveStaff` fails closed when `SCHOLARSCOUT_STAFF_EMAILS` is absent, and the focused authorization/UI suites pass 15/15.
  falsification_test: Finding the variable assigned to Preview and receiving a 200 capability response with the same session would disprove the configuration-omission hypothesis.
  fix_rationale: Adding the required allowlist to Preview and redeploying supplies the server-side authorization input without weakening the fail-closed boundary.
  blind_spots: End-to-end UAT after operator remediation has not yet been run because external settings were intentionally left unchanged.
  candidate_causes:
    - config: missing Preview `SCHOLARSCOUT_STAFF_EMAILS` assignment (confirmed)
    - code: missing routes or incorrect capability failure rendering (eliminated)
    - environment: stale deployed application revision (eliminated)
    - data: signed-in email excluded from a present allowlist (superseded because the variable is absent entirely)
  and_gate: no; the missing allowlist alone makes every live active-staff check deny access.
tdd_checkpoint: not applicable; no application defect or code fix was identified.

## Evidence

- timestamp: 2026-08-28T23:05:00-04:00
  checked: Phase-0 semantic and durable knowledge-base availability.
  found: No MemPalace tool is available and `.planning/debug/knowledge-base.md` does not exist.
  implication: There is no known-pattern resolution to prioritize; proceed from source and runtime evidence.
- timestamp: 2026-08-28T23:16:00-04:00
  checked: StaffGate, NextAuth callbacks, active-staff boundary, admin page, and route inventory.
  found: `StaffGate` authorizes only `session.user.role === 'staff'`, while all privileged routes call `requireActiveStaff`, which ignores that role and requires the session email to match a strictly parsed current `SCHOLARSCOUT_STAFF_EMAILS` value. All data-operation route files are present in the current tree.
  implication: A stale staff JWT can pass the client gate and then receive deterministic 403 responses from data-operation APIs; the old missing-route concern is not the current implementation state.
- timestamp: 2026-08-28T23:23:00-04:00
  checked: First targeted Jest invocation through the ambient `pnpm` command.
  found: The run was rejected before Jest because the ambient process exposed Node 24.19.0 and pnpm 11.19.0, while the repository requires Node 20.x and pnpm 10.34.5.
  implication: No test result was produced; use an already-installed compatible toolchain rather than weakening engine enforcement.
- timestamp: 2026-08-28T23:27:00-04:00
  checked: Targeted active-staff and ProgrammeAdminManager suites using Node 20.20.2 and pnpm 10.34.5.
  found: Both suites passed (2 suites, 15 tests). The intentional capability-failure path renders the Data operations heading plus populated category and incident text.
  implication: The split authorization contract can produce a denied data-operation state, but it does not by itself reproduce a missing heading or empty alert.
- timestamp: 2026-08-28T23:30:00-04:00
  checked: In-app browser availability for direct preview inspection.
  found: No browser surface is currently available to this session.
  implication: Continue from persisted UAT artifacts and local commit/source evidence; direct deployed inspection may require a later human checkpoint.
- timestamp: 2026-08-28T23:38:00-04:00
  checked: Phase-3 UAT history and commit delta from deployed `371054b` to local HEAD.
  found: UAT stores only the reporter summary, no screenshot/network capture. Application files are identical between `371054b` and HEAD; intervening commits only record UAT evidence.
  implication: The failure is not explained by a deployment using stale application code; exact deployment configuration/runtime evidence is now the differentiator.
- timestamp: 2026-08-28T23:42:00-04:00
  checked: Read-only Vercel project query for Preview variable names.
  found: The CLI has no existing credentials and attempted a device login; the flow was cancelled without authenticating or changing settings.
  implication: Preview variable-name scope cannot be observed from this session without user-owned authentication.
- timestamp: 2026-08-28T23:55:00-04:00
  checked: Provider, Vercel deployment, OAuth handoff, and secret-provider documentation.
  found: The repository contract explicitly requires `SCHOLARSCOUT_STAFF_EMAILS` for staff access and tells operators to apply hosting variables to Production and Preview as appropriate, but contains no completed Preview variable-name inventory.
  implication: The leading config hypothesis is consistent with the documented deployment contract but requires a user-owned dashboard/API-status observation to confirm rather than inference.
- timestamp: 2026-08-28T18:14:00-04:00
  checked: User-owned signed-in Vercel dashboard variable-name search.
  found: `SCHOLARSCOUT_STAFF_EMAILS` returned no results and is absent entirely, including from Preview scope.
  implication: Root cause confirmed. The application is correctly failing closed; remediation is deployment configuration, not source code.

## Eliminated

- hypothesis: The preview was running stale application code or lacked the Phase-3 admin data routes.
  evidence: `371054b` and current HEAD have no application-file diff, and all required admin data route handlers exist in the deployed commit tree.
  timestamp: 2026-08-28T23:38:00-04:00
- hypothesis: ProgrammeAdminManager's ordinary capability-failure UI alone explains an absent Data operations heading and empty alert.
  evidence: The render path always emits the Data operations heading and a populated alert; its targeted component suite passes this contract.
  timestamp: 2026-08-28T23:27:00-04:00

## Resolution

root_cause: The required `SCHOLARSCOUT_STAFF_EMAILS` active-staff allowlist is absent from the Vercel Preview environment, so privileged programme and data-operation routes correctly deny the signed-in session.
fix: No code change. Operator remediation is to add `SCHOLARSCOUT_STAFF_EMAILS` to Preview with the authorized staff identity, redeploy, re-sign in if needed, and rerun Phase-3 UAT.
verification: Root cause confirmed by a signed-in Vercel dashboard variable-name search; focused active-staff and ProgrammeAdminManager tests passed 15/15. Post-remediation deployed UAT remains an operator follow-up because external settings were intentionally not changed.
files_changed: []
