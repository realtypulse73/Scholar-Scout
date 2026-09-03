# Phase 6: End-to-End Hardening and Release Readiness - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-31
**Phase:** 06-end-to-end-hardening-and-release-readiness
**Areas discussed:** Student critical path, production-like validation, failure-path coverage, release evidence

---

## Student critical path

| Option | Description | Selected |
|--------|-------------|----------|
| Student-only | Discovery → onboarding → shortlist → recommendation → simulation in a signed-in student browser journey. | ✓ |
| Student plus staff | Add a staff moderation/data-operation browser smoke journey. | |
| Two student paths | Add a Phase 5 community report browser path. | |

**User's choice:** Student-only.
**Notes:** Staff/community remain protected by existing route/component regressions and completed Phase 5 Preview UAT.

## Isolated test state

| Option | Description | Selected |
|--------|-------------|----------|
| Resettable fixture | Generated non-personal student/programme data reset before every run. | ✓ |
| Fresh account per run | Normal generated registration for every execution. | |
| Stable seeded account | One Preview-only account with cleanup. | |

**User's choice:** Resettable isolated fixture.
**Notes:** No production data or personal/public identities.

## Browser assertions

| Option | Description | Selected |
|--------|-------------|----------|
| Observable transitions | Prove each action succeeds and its next relevant surface changes. | ✓ |
| Navigation-only smoke | Confirm pages and primary controls open/respond. | |
| Exact-output snapshot | Assert complete recommendation/order output. | |

**User's choice:** Observable state transitions.
**Notes:** Avoid brittle full ranking assertions.

## Simulation scope

| Option | Description | Selected |
|--------|-------------|----------|
| One representative path | Browser-cover one interactive student-facing simulation; retain lower-level alternative-path coverage. | ✓ |
| Both entry points | Browser-cover `/simulate` and `/explore`. | |
| No browser simulation | Rely on component tests only. | |

**User's choice:** One representative path.
**Notes:** The user then authorized the recommended bounded, isolated, Preview-only choices for the remaining Phase 6 areas.

## Production-like validation, failure paths, and release evidence

**User's choice:** Recommended bounded approach, explicitly authorized.

**Notes:** CI remains deterministic; Preview supplies the production-like rehearsal; safe evidence excludes credentials and user data; route/service integration tests retain high-risk failure coverage; provider failure injection is isolated and restored; release is blocked on missing or failed required evidence.

---

## the agent's Discretion

- Select the smallest compatible browser automation and fixture-reset mechanism after research.
- Select exact commands and artifact wiring within the established pnpm, GitHub Actions, Vercel, and release-runbook patterns.

## Deferred Ideas

- Phase 999.1 direct school search remains separate backlog work.
- New product capabilities and expanded staff/community browser suites are outside Phase 6.
