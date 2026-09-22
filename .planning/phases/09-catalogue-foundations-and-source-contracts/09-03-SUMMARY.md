---
phase: 09-catalogue-foundations-and-source-contracts
plan: 03
subsystem: catalogue-domain-contract
tags: [typescript, jest, catalogue, evidence, freshness, wage-context]
requires:
  - plan: 09-01
    provides: Source-date metadata, controlled pathway vocabulary, and injected-clock freshness policy.
provides:
  - Field-level evidence validation with four explicit factual states.
  - Employer-training and occupation-area wage-context contracts that separate evidence from outcome claims.
  - A complete non-sensitive, source-safe first-view opportunity-card boundary.
affects: [phase-10-publication, phase-11-discovery, EVID-01, EVID-02, EVID-05]
tech-stack:
  added: []
  patterns: [pure named TypeScript validators, injected-clock evidence validation, sourced-or-unresolved card facts]
key-files:
  created: []
  modified:
    - apps/web/lib/catalogue-contract.ts
    - apps/web/__tests__/lib/catalogue-contract.test.ts
key-decisions:
  - "Require independently dated evidence and a direct verification action for every material fact; unavailable dates remain explicit non-current evidence."
  - "Represent employer training, wage context, and first-view cards as factual contracts with no employment, provider-quality, eligibility, ranking, or outcome claim fields."
patterns-established:
  - "Fact validators receive an injected clock and return deterministic string errors for malformed, future, stale, or incomplete evidence."
  - "First-view facts are a SourcedFact or a visibly unresolved non-current fact; their aggregate status is derived rather than supplied."
requirements-completed: [EVID-01, EVID-02, EVID-05]
coverage:
  - id: D1
    description: Field-level authority, source-date, review-date, status, direct-action, and freshness validation.
    requirement: EVID-01
    verification:
      - kind: unit
        ref: apps/web/__tests__/lib/catalogue-contract.test.ts#field-level fact evidence
        status: pass
      - kind: other
        ref: pnpm --filter @scholar-scout/web run typecheck
        status: pass
    human_judgment: false
  - id: D2
    description: Explicit current, needs-confirmation, unknown, and conflicting states with dated paid-training and wage-context evidence.
    requirement: EVID-02
    verification:
      - kind: unit
        ref: apps/web/__tests__/lib/catalogue-contract.test.ts#employer training and wage context
        status: pass
      - kind: other
        ref: pnpm --filter @scholar-scout/web run lint
        status: pass
    human_judgment: false
  - id: D3
    description: Dated occupation-and-area wage context remains informational rather than a provider offer or personal forecast.
    requirement: EVID-05
    verification:
      - kind: unit
        ref: apps/web/__tests__/lib/catalogue-contract.test.ts#employer training and wage context
        status: pass
    human_judgment: false
  - id: D4
    description: Complete first-view card facts accept sourced or visible unresolved values and derive their verification status.
    requirement: EVID-01
    verification:
      - kind: unit
        ref: apps/web/__tests__/lib/catalogue-contract.test.ts#opportunity card facts
        status: pass
    human_judgment: false
metrics:
  duration: 7min
  completed: 2026-09-22
  tasks_completed: 3
  files_modified: 2
status: complete
---

# Phase 09 Plan 03: Field Evidence and Source-Safe Card Facts Summary

**Dated, field-level catalogue evidence and a non-sensitive first-view card contract that keeps training-pay and wage context factual rather than predictive.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-09-22T21:13:52Z
- **Completed:** 2026-09-22T21:20:56Z
- **Tasks:** 3/3
- **Files modified:** 2

## Accomplishments

- Added four-state fact evidence validation with required authority, public source attribution, structured source/review dates, direct verification action, and deterministic freshness behavior.
- Added employer-linked-training disclosures that independently validate taught skill, trainee pay, and employment-commitment evidence; `no-published-guarantee` and `unknown` remain explicit.
- Added a separately dated occupation-and-area wage-context record with a fixed informational-only label and no provider, learner, offer, ranking, placement, or forecast fields.
- Added a domain-only D-08 opportunity-card contract for sourced or visibly unresolved location, pathway, skill, payer, cost/tuition, duration, and delivery facts; aggregate verification status is derived from those facts.

## Task Commits

1. **Task 1: Enforce field-level evidence and deterministic freshness** — `7833625` (RED), `5951d73` (GREEN)
2. **Task 2: Separate paid training and wage context from outcome claims** — `eb3c18f` (RED), `d3febd3` (GREEN)
3. **Task 3: Make complete first-view opportunity facts source-safe** — `6e7273a` (RED), `bf58c1c` (GREEN)

## Verification

- `pnpm --filter @scholar-scout/web run test -- catalogue-contract` — passed (21 tests).
- `pnpm --filter @scholar-scout/web run typecheck` — passed.
- `pnpm --filter @scholar-scout/web run lint` — passed.

The checks reported the pre-existing Node 20 versus Node 24 engine warning and Next.js multiple-lockfile warning; neither changed this plan’s files nor caused a verification failure.

## Files Created/Modified

- `apps/web/lib/catalogue-contract.ts` — field evidence, paid-training, wage-context, and source-safe card-fact types and pure validators.
- `apps/web/__tests__/lib/catalogue-contract.test.ts` — fixed-clock regression coverage for evidence, disclosures, and all card-fact states.

## Decisions Made

- Use explicit unavailable source-date metadata only for non-current facts with a direct verification action; it cannot be upgraded to `current`.
- Keep employer training, wage context, and opportunity cards structurally separate from provider-quality, employment, salary, placement, eligibility, ranking, re-entry, identity, qualification, inventory, live-source, route, and UI concerns.
- EVID-02 and EVID-05 automated coverage validates contract shape and policy only; Phase 10 staff review must approve any real source and wording before publication.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Made the invalid wage-label regression fixture type-safe.**
- **Found during:** Task 3 verification
- **Issue:** The negative test’s malformed fixed label could not compile against the intentional literal label contract.
- **Fix:** Narrowly cast only the invalid test input so the runtime validator remains covered without weakening the production type.
- **Files modified:** `apps/web/__tests__/lib/catalogue-contract.test.ts`
- **Verification:** Focused Jest, TypeScript, and lint checks passed.
- **Committed in:** `bf58c1c`

---

**Total deviations:** 1 auto-fixed (Rule 3)
**Impact on plan:** The fix preserved the planned fixed-label safety boundary and added no product surface.

## Issues Encountered

- The local Node runtime is 20.20.2 while the workspace declares Node 24; required tests, typecheck, and lint completed successfully without dependency or configuration changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 10 can reuse the validators to reject unreviewed imports before any staff publication workflow is built.
- No provider inventory, live scraping, persistence, ranking, sensitive/referral data, routes, or UI was introduced.

## Self-Check: PASSED

- Confirmed both owned implementation/test files and this summary exist in the worktree.
- Confirmed all six TDD task commits are present in repository history.

---
*Phase: 09-catalogue-foundations-and-source-contracts*
*Completed: 2026-09-22*
