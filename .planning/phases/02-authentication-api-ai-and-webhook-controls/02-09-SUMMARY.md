---
phase: 02-authentication-api-ai-and-webhook-controls
plan: 09
subsystem: webhook-security
tags: [github-webhooks, hmac, node-http, agent-dispatch, security]
requires:
  - phase: 02-authentication-api-ai-and-webhook-controls
    provides: "Phase security policy defining D-13 through D-16 webhook controls."
provides:
  - "Fail-closed raw GitHub webhook validation with a 64 KiB ingress bound."
  - "Repository, event-action, and label allowlists before external side effects."
  - "Bearer-authenticated, 16 KiB-bounded agent dispatches with a ten-second timeout."
affects: [webhook-automation, release-operations, external-integrations]
tech-stack:
  added: []
  patterns:
    - "Export standalone Node HTTP services as injectable factories and keep environment loading/listening at the executable edge."
    - "Authenticate raw external input before JSON parsing, then validate qualification before side effects."
key-files:
  created:
    - services/codex-webhook-runner/test/server.test.mjs
  modified:
    - services/codex-webhook-runner/src/server.mjs
    - services/codex-webhook-runner/package.json
    - services/codex-webhook-runner/README.md
key-decisions:
  - "Missing or malformed webhook signatures return a safe 503 while health remains observable."
  - "Agent delivery requires both its endpoint and a server-only bearer token; an endpoint alone never dispatches."
  - "Job fields are sanitized and UTF-8 bounded before an outbound request is constructed."
patterns-established:
  - "Use injected fetch and configuration seams for real HTTP service regression tests without live GitHub or agent calls."
requirements-completed: [SEC-04]
coverage:
  - id: D1
    description: "Webhook delivery rejects absent or invalid HMAC secrets, oversize raw input, and nonqualifying repositories/events/labels without external side effects."
    requirement: SEC-04
    verification:
      - kind: integration
        ref: "services/codex-webhook-runner/test/server.test.mjs#Codex webhook runner"
        status: pass
    human_judgment: false
  - id: D2
    description: "Qualifying issue jobs use a required bearer token, sanitized 16 KiB packet, and ten-second abort timeout."
    requirement: SEC-04
    verification:
      - kind: integration
        ref: "services/codex-webhook-runner/test/server.test.mjs#sends a bounded sanitized job packet with bearer authentication and a ten-second abort"
        status: pass
    human_judgment: false
duration: 5min
completed: 2026-07-27
status: complete
---

# Phase 2 Plan 09: Harden and Test the GitHub Webhook Runner Summary

**The standalone webhook runner now authenticates and bounds raw GitHub input before sending only validated, bearer-protected agent jobs.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-07-27T22:03:44-04:00
- **Completed:** 2026-07-27T22:09:06-04:00
- **Tasks:** 3/3
- **Files modified:** 4

## Accomplishments

- Exported an injectable Node HTTP runner that keeps health observable but rejects missing, malformed, oversized, or nonqualifying webhook deliveries before side effects.
- Added real HTTP regression coverage for raw HMAC validation, configured repository/issue-label filtering, 64 KiB ingress limits, and safe external failures.
- Required a bearer token, 16 KiB sanitized UTF-8 job packet, and ten-second abort for every agent dispatch; documented the deployment contract and test command.

## Task Commits

1. **Task 1: Make the runner injectable and fail closed on raw webhook input** - `1033c53` (TDD RED), `e25a638` (feat)
2. **Task 2: Bound and authenticate outbound job dispatch** - `e12f7f2` (TDD RED), `5b54774` (feat)
3. **Task 3: Document the hardened service contract** - `6cc0ce6` (docs)

## Files Created/Modified

- `services/codex-webhook-runner/src/server.mjs` - Injectable fail-closed HTTP service with HMAC, qualification, packet, and dispatch controls.
- `services/codex-webhook-runner/test/server.test.mjs` - Real HTTP regression suite using injected fetch/configuration fakes.
- `services/codex-webhook-runner/package.json` - Supported Node test script.
- `services/codex-webhook-runner/README.md` - Required configuration, security limits, health behavior, and operational commands.

## Decisions Made

- Reject absent or invalid signature configurations with `503` rather than accepting untrusted delivery traffic.
- Treat agent bearer authentication as mandatory whenever an agent endpoint is configured; GitHub commenting remains independently controlled by its configured token.
- Bound text by UTF-8 encoded bytes after sanitization to preserve the 16 KiB outbound request limit.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Preserved the HTTP error response for oversized streamed bodies**
- **Found during:** Task 1
- **Issue:** Destroying the request socket on the first byte beyond 64 KiB caused clients to receive a connection failure instead of the intended `413` response.
- **Fix:** Drained the request after rejecting it so the handler can return the safe bounded-body response.
- **Files modified:** `services/codex-webhook-runner/src/server.mjs`
- **Verification:** The real HTTP oversized-body regression test passes.
- **Committed in:** `e25a638`

**Total deviations:** 1 auto-fixed (1 request-handling bug).

## Issues Encountered

- The sandbox could not resolve the approved portable Node 20 runtime under the user profile. The required Node 20 commands were run with approved elevated filesystem access; no external credentials were accessed or printed.

## User Setup Required

No new provider provisioning is required. Deployment configuration must supply the server-only secret, repository name, agent endpoint, and agent bearer token documented in `services/codex-webhook-runner/README.md`.

## Next Phase Readiness

- SEC-04 has automated integration coverage and a fail-closed service contract.
- Future automation changes should retain the raw-input-to-qualification-to-authenticated-dispatch order.

## Known Stubs

None.

## Self-Check: PASSED

- Required source, test, package, and README files exist.
- TDD gate commits exist: `1033c53`, `e25a638`, `e12f7f2`, and `5b54774`.
- `corepack pnpm --filter @scholar-scout/codex-webhook-runner test` passed with 8 tests.

---
*Phase: 02-authentication-api-ai-and-webhook-controls*
*Completed: 2026-07-27*
