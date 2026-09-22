---
phase: 07
slug: governed-opportunity-and-support-matching
status: signed-off
nyquist_compliant: true
wave_0_complete: true
created: 2026-09-20
---

# Phase 07 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.3.0 with Next.js integration and Testing Library |
| **Config file** | `apps/web/jest.config.ts` |
| **Quick run command** | `corepack pnpm --filter @scholar-scout/web test -- --runInBand apps/web/__tests__/lib/opportunity-matching.test.ts` |
| **Full suite command** | `corepack pnpm --filter @scholar-scout/web test -- --runInBand` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run the relevant focused Jest test and `corepack pnpm --filter @scholar-scout/web run lint`.
- **After every plan wave:** Run `corepack pnpm --filter @scholar-scout/web test -- --runInBand` and `corepack pnpm --filter @scholar-scout/web run typecheck`.
- **Before `$gsd-verify-work`:** The full suite must be green.
- **Max feedback latency:** 120 seconds.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 07-W0-01 | W0 | 0 | Context D-01/D-02 | T-07-01 | Every programme remains visible when ordinary requested support is undocumented; it ranks lower and shows a verification prompt. | unit | `corepack pnpm --filter @scholar-scout/web test -- --runInBand apps/web/__tests__/lib/opportunity-matching.test.ts` | ✅ | ✅ green |
| 07-W0-02 | W0 | 0 | Context D-03/D-06/D-07 | T-07-02 | Referral-only categories never affect rank, reasons, storage, URL data, analytics, or provider requests. | unit/component | `corepack pnpm --filter @scholar-scout/web test -- --runInBand apps/web/__tests__/lib/opportunity-matching.test.ts apps/web/__tests__/components/SensitiveReferralPanel.test.tsx apps/web/__tests__/components/RecommendationDashboard.test.tsx` | ✅ | ✅ green |
| 07-W0-03 | W0 | 0 | Context D-09/D-10/D-12 | T-07-03 | The view model gives 2–4 reasons and source/date/unknown/verification states without predictive fit language. | unit | `corepack pnpm --filter @scholar-scout/web test -- --runInBand apps/web/__tests__/lib/opportunity-matching.test.ts` | ✅ | ✅ green |
| 07-W0-04 | W0 | 0 | Context D-11 | T-07-04 | Cards expose save, compare, source, and alternate-path actions; no application action exists. | component | `corepack pnpm --filter @scholar-scout/web test -- --runInBand apps/web/__tests__/components/OpportunityMatchCard.test.tsx` | ✅ | ✅ green |
| 07-W0-05 | W0 | 0 | Context D-10/D-12 | T-07-05 | Evidence validation stays backward compatible for legacy records while new governed writes validate field-level evidence. | unit/API | `corepack pnpm --filter @scholar-scout/web test -- --runInBand apps/web/__tests__/lib/admin-programmes.test.ts apps/web/__tests__/api/admin-programmes.test.ts` | ✅ extend | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `apps/web/__tests__/lib/opportunity-matching.test.ts` — governed ordering, visible-results guarantee, taxonomy exclusion, reasons, and evidence states.
- [x] `apps/web/__tests__/components/OpportunityMatchCard.test.tsx` — action contract, plain-language evidence, unknown state, and accessibility.
- [x] `apps/web/__tests__/components/SensitiveReferralPanel.test.tsx` and `apps/web/__tests__/components/RecommendationDashboard.test.tsx` — purpose-specific local consent, decline, reachable entry point, and non-retention behavior.
- [x] Preference/pathway recommendation coverage prevents legacy GPA/access and support-score language from driving governed rank.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Referral-destination ownership and freshness | Context D-04/D-08 | Phase 07 intentionally contains only `.invalid` fixtures, so no public destination exists to review yet. | Before any public referral enablement, complete the per-destination [`07-PRELAUNCH-REFERRAL-RELEASE-GATE.md`](07-PRELAUNCH-REFERRAL-RELEASE-GATE.md) record with the destination label, HTTPS URL, jurisdiction/availability note, owner, review date, accessibility/contact-path review, consent-copy review, and human sign-off. |
| Student-facing wording | Context D-09/D-10/D-12 | Automated tests can assert copy, but a human should assess whether it is genuinely choice-preserving and non-predictive. | Keyboard- and screen-reader-review a card and referral interaction; confirm “verify before applying” and no admission/eligibility/success claim. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies.
- [x] Sampling continuity: no 3 consecutive tasks without automated verify.
- [x] Wave 0 covers all missing references.
- [x] No watch-mode flags.
- [x] Feedback latency < 120 seconds.
- [x] `nyquist_compliant: true` set in frontmatter.

## Final Execution Evidence

- Focused Phase 07 Jest map: **9 suites / 42 tests passed**.
- Production tooling: **24 tests passed**, including the referral release-gate and
  fixture-host allowlist regression.
- Web lint: **passed with zero warnings**.
- Web typecheck: **passed**.
- Phase 7 remains an approved governance-only, pre-launch slice with no new
  milestone requirement. `PROD-07` remains exclusively owned by Phase 8.
- No real referral URL exists in Phase 07. The future public-release precondition is
  [`07-PRELAUNCH-REFERRAL-RELEASE-GATE.md`](07-PRELAUNCH-REFERRAL-RELEASE-GATE.md),
  wired into the production readiness checklist, release runbook, and evidence
  template.

**Approval:** signed off for the Phase 07 test-only scope.
