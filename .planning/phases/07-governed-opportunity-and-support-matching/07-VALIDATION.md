---
phase: 07
slug: governed-opportunity-and-support-matching
status: draft
nyquist_compliant: false
wave_0_complete: false
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
| 07-W0-01 | W0 | 0 | Context D-01/D-02 | T-07-01 | Every programme remains visible when ordinary requested support is undocumented; it ranks lower and shows a verification prompt. | unit | `corepack pnpm --filter @scholar-scout/web test -- --runInBand apps/web/__tests__/lib/opportunity-matching.test.ts` | ❌ Wave 0 | ⬜ pending |
| 07-W0-02 | W0 | 0 | Context D-03/D-06/D-07 | T-07-02 | Referral-only categories never affect rank, reasons, storage, URL data, analytics, or provider requests. | unit/component | `corepack pnpm --filter @scholar-scout/web test -- --runInBand apps/web/__tests__/lib/opportunity-matching.test.ts apps/web/__tests__/components/SensitiveReferralPanel.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 07-W0-03 | W0 | 0 | Context D-09/D-10/D-12 | T-07-03 | The view model gives 2–4 reasons and source/date/unknown/verification states without predictive fit language. | unit | `corepack pnpm --filter @scholar-scout/web test -- --runInBand apps/web/__tests__/lib/opportunity-matching.test.ts` | ❌ Wave 0 | ⬜ pending |
| 07-W0-04 | W0 | 0 | Context D-11 | T-07-04 | Cards expose save, compare, source, and alternate-path actions; no application action exists. | component | `corepack pnpm --filter @scholar-scout/web test -- --runInBand apps/web/__tests__/components/OpportunityMatchCard.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 07-W0-05 | W0 | 0 | Context D-10/D-12 | T-07-05 | Evidence validation stays backward compatible for legacy records while new governed writes validate field-level evidence. | unit/API | `corepack pnpm --filter @scholar-scout/web test -- --runInBand apps/web/__tests__/lib/admin-programmes.test.ts apps/web/__tests__/api/admin-programmes.test.ts` | ✅ extend | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/web/__tests__/lib/opportunity-matching.test.ts` — governed ordering, visible-results guarantee, taxonomy exclusion, reasons, and evidence states.
- [ ] `apps/web/__tests__/components/OpportunityMatchCard.test.tsx` — action contract, plain-language evidence, unknown state, and accessibility.
- [ ] `apps/web/__tests__/components/SensitiveReferralPanel.test.tsx` — purpose-specific consent and non-retention behavior.
- [ ] Extend preference/pathway recommendation tests so the legacy GPA/access and support-score language cannot drive rank.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Referral-destination ownership and freshness | Context D-04/D-08 | Product/advisor owner must confirm each allowlisted human/provider destination; the repository has no current directory or owner policy. | Confirm the destination label, HTTPS URL, jurisdiction/availability note, owner, and review date before enabling the referral panel. |
| Student-facing wording | Context D-09/D-10/D-12 | Automated tests can assert copy, but a human should assess whether it is genuinely choice-preserving and non-predictive. | Keyboard- and screen-reader-review a card and referral interaction; confirm “verify before applying” and no admission/eligibility/success claim. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies.
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify.
- [ ] Wave 0 covers all missing references.
- [ ] No watch-mode flags.
- [ ] Feedback latency < 120 seconds.
- [ ] `nyquist_compliant: true` set in frontmatter.

**Approval:** pending
