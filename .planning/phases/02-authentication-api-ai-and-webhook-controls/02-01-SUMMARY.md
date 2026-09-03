---
phase: 02-authentication-api-ai-and-webhook-controls
plan: 01
subsystem: security-infrastructure
tags: [upstash, redis, rate-limiting, npm-provenance, vercel]
requires:
  - phase: 01-release-and-ci-baseline
    provides: "Corepack-pinned pnpm workflow and immutable lockfile contract"
provides:
  - "Maintainer-approved provenance record for the pinned Upstash Redis and rate-limit packages"
  - "Provisioned Vercel-managed Redis service for production and preview rate-limit reservations"
  - "Canonical managed environment-variable names for the Plan 02-02 limiter adapter"
affects: [02-02, advisor-controls, credential-rate-limits]
tech-stack:
  added: []
  patterns:
    - "Verify package provenance and provider provisioning before installing security-critical dependencies."
    - "Keep provider credentials server-side and document only names, scopes, and non-secret operational facts."
key-files:
  created:
    - .planning/phases/02-authentication-api-ai-and-webhook-controls/02-01-SUMMARY.md
  modified: []
key-decisions:
  - "Use the Vercel-managed Upstash Redis integration in iad1 for atomic rate-limit reservations."
  - "Plan 02-02 must read Vercel's integration-managed REST API variable names rather than assuming custom aliases."
patterns-established:
  - "Record exact package version, source repository, publication date, integrity hash, and lifecycle-script review before installation."
requirements-completed: [SEC-03, SEC-05]
coverage:
  - id: D1
    description: "Pinned Upstash package provenance is reviewed before the dependencies enter the workspace."
    requirement: SEC-03
    verification:
      - kind: manual_procedural
        ref: "npm registry metadata review for @upstash/redis@1.38.0 and @upstash/ratelimit@2.0.8"
        status: pass
    human_judgment: true
    rationale: "Registry ownership and release provenance require maintainer review."
  - id: D2
    description: "Production and preview have a server-side Upstash Redis provider contract without repository credentials."
    requirement: SEC-05
    verification:
      - kind: manual_procedural
        ref: "Vercel Upstash integration configuration for scholar-scout-web"
        status: pass
    human_judgment: true
    rationale: "Provider creation and environment-scope confirmation require dashboard authority."
duration: 1 day
completed: 2026-07-27
status: complete
---

# Phase 2 Plan 01: Atomic Counter Provenance Summary

**Approved, integrity-pinned Upstash packages and a Vercel-managed Redis contract now unblock the fail-closed rate-limit adapter.**

## Performance

- **Duration:** 1 day, including maintainer provider provisioning
- **Started:** 2026-07-26 (package provenance review)
- **Completed:** 2026-07-27
- **Tasks:** 1/1
- **Files modified:** 1

## Accomplishments

- Verified the fixed releases against npm registry metadata and official Upstash source repositories before dependency installation.
- Confirmed the production provider prerequisite: the managed free Redis database `scholar-scout-rate-limits` is in `iad1`, linked to Vercel project `scholar-scout-web` for Production and Preview only.
- Recorded the Vercel-managed REST variable names Plan 02-02 must consume without exposing a credential.

## Provenance Record

| Package | Version | Publisher | Repository | Release date (UTC) | `dist.integrity` | Lifecycle scripts |
| --- | --- | --- | --- | --- | --- | --- |
| `@upstash/redis` | `1.38.0` | GitHub Actions | `https://github.com/upstash/redis-js` | 2026-05-05 | `sha512-wu+dZBptlLy0+MCUEoHmzrY/TnmgDey3+c7EbIGwrLqAvkP8yi5MWZHYGIFtAygmL4Bkz2TdFu+eU0vFPncIcg==` | None (`preinstall`, `install`, `postinstall`, `prepare`, and related lifecycle hooks absent) |
| `@upstash/ratelimit` | `2.0.8` | cahidarda | `https://github.com/upstash/ratelimit-js` | 2026-01-12 | `sha512-YSTMBJ1YIxsoPkUMX/P4DDks/xV5YYCswWMamU8ZIfK9ly6ppjRnVOyBhMDXBmzjODm4UQKcxsJPvaeFAijp5w==` | None (`preinstall`, `install`, `postinstall`, `prepare`, and related lifecycle hooks absent) |

Reviewed on 2026-07-26 by the maintainer-authorized executor. The npm registry and the official `upstash` GitHub organization establish the approved provenance. Plan 02-02 must install exactly these releases and preserve their recorded integrity evidence in the root lockfile.

## Provider Provisioning Record

- **Provider/database:** Vercel-managed Upstash Redis, `scholar-scout-rate-limits` (free tier)
- **Region:** `iad1`
- **Owner/project:** Vercel project `scholar-scout-web`
- **Environment scope:** Production and Preview only; Development remains unchecked.
- **Credential handling:** No credential was read, committed, or written to a local environment file.

### Vercel Integration Naming Variance

Vercel does not permit renaming integration-managed variables. Plan 02-02 must consume these server-only managed names, rather than the generic aliases anticipated during planning:

- `UPSTASH_REDIS_REST_KV_REST_API_URL`
- `UPSTASH_REDIS_REST_KV_REST_API_TOKEN`

The integration also manages `UPSTASH_REDIS_REST_REDIS_URL`, `UPSTASH_REDIS_REST_KV_URL`, and `UPSTASH_REDIS_REST_KV_REST_API_READ_ONLY_TOKEN`. They are not substitutes for the read/write REST URL/token pair used by the atomic limiter. None may be exposed to browser code.

## Task Commits

No code or package files changed for the checkpoint task. The plan metadata commit records this approval evidence.

## Files Created/Modified

- `.planning/phases/02-authentication-api-ai-and-webhook-controls/02-01-SUMMARY.md` - Package provenance, provider provisioning, and managed environment-name handoff.

## Decisions Made

- Use the provisioned Vercel Upstash integration for cross-instance, atomic reservations; whole-document persistence and process memory remain unsuitable counters.
- Treat the Vercel-managed REST URL/token names as the production and preview contract for Plan 02-02. Do not create repository aliases or place secrets in example files.

## Deviations from Plan

None - plan executed exactly as written. Package installation remains correctly owned by Plan 02-02.

## Issues Encountered

- Provider console access was unavailable to the executor, so provisioning was completed by the maintainer and its non-secret evidence was supplied for this record.

## Known Stubs

None.

## Next Phase Readiness

- Plan 02-02 is unblocked to add exactly `@upstash/redis@1.38.0` and `@upstash/ratelimit@2.0.8` and consume the managed Vercel REST URL/token names server-side.
- Production verification may proceed with the provisioned provider; credentials remain exclusively in Vercel Production and Preview configuration.

## Self-Check: PASSED

- The provenance and provisioning summary exists at the required phase path.
- No task code commit was expected because this plan contained only the approved external checkpoint.

---
*Phase: 02-authentication-api-ai-and-webhook-controls*
*Completed: 2026-07-27*
