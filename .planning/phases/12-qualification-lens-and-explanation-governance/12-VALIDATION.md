---
phase: 12
slug: qualification-lens-and-explanation-governance
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-09-24
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for private qualifications, source-based explanations, and all-visible ordering.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.3.0 with Testing Library and `next/jest` |
| **Config file** | `apps/web/jest.config.ts` |
| **Quick run command** | `corepack pnpm --filter @scholar-scout/web test -- --runInBand qualification` |
| **Full suite command** | `corepack pnpm --filter @scholar-scout/web test -- --runInBand` |
| **Estimated focused-loop runtime** | under 30 seconds |

## Sampling Rate

- **After every task commit:** Run the focused qualification tests and typecheck when domain types move.
- **After every plan wave:** Run `corepack pnpm --filter @scholar-scout/web run lint`, `typecheck`, and the full Jest suite.
- **Before `$gsd-verify-work`:** Full suite must be green and the manual browser check must cover the qualification form and blue verification rows.
- **Max feedback latency:** under 30 seconds for focused task loops; reserve the full suite for wave completion.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | MATCH-01, MATCH-04 | T-12-01 | Only bounded account-owned qualification fields persist; extra/prohibited fields and guest access are rejected. | unit + API | `corepack pnpm --filter @scholar-scout/web test -- --runInBand qualification-record account-qualification-routes` | ❌ W0 | ⬜ pending |
| 12-01-02 | 01 | 1 | MATCH-01, MATCH-04 | T-12-02, T-12-03, T-12-04 | Account isolation, conditional conflicts, legacy normalization, and no-guest-migration behavior retain privacy boundaries. | unit + API | `corepack pnpm --filter @scholar-scout/web test -- --runInBand qualification-record account-qualification-routes student-records` | ❌ W0 | ⬜ pending |
| 12-01-03 | 01 | 1 | MATCH-01, MATCH-04 | T-12-02 | Account form states retain draft, explicit keyword, clear-confirmation, and accessible private controls. | component | `corepack pnpm --filter @scholar-scout/web test -- --runInBand QualificationRecordForm` | ❌ W0 | ⬜ pending |
| 12-04-01 | 04 | 2 | MATCH-01, MATCH-03, MATCH-04 | T-12-13, T-12-14, T-12-15 | Existing governed intake publishes only sourced exact-key requirements and evidence to the reviewed snapshot. | unit + server | `corepack pnpm --filter @scholar-scout/web test -- --runInBand --runTestsByPath __tests__/lib/catalogue-publication.test.ts __tests__/lib/server/catalogue-publications.test.ts` | ❌ W0 | ⬜ pending |
| 12-04-02 | 04 | 2 | MATCH-01, MATCH-03, MATCH-04 | T-12-13, T-12-14 | Manager guidance and rejection paths preserve atomic private intake and the active reviewed snapshot. | component + unit + server | `corepack pnpm --filter @scholar-scout/web test -- --runInBand --runTestsByPath __tests__/components/CataloguePublicationManager.test.tsx __tests__/lib/catalogue-publication.test.ts __tests__/lib/server/catalogue-publications.test.ts` | ❌ W0 | ⬜ pending |
| 12-02-01 | 02 | 3 | MATCH-01, MATCH-02, MATCH-03, MATCH-04 | T-12-05, T-12-06, T-12-08 | Snapshot evidence produces a note-free explanation and a deterministic checked-requirement ordering path. | unit | `corepack pnpm --filter @scholar-scout/web test -- --runInBand qualification-lens catalogue-publication catalogue-discovery` | ❌ W0 | ⬜ pending |
| 12-02-02 | 02 | 3 | MATCH-01, MATCH-02, MATCH-03, MATCH-04 | T-12-06, T-12-07, T-12-08 | Three-bucket ordering retains every filtered ID while uncertainty remains verification data, never a penalty. | unit | `corepack pnpm --filter @scholar-scout/web test -- --runInBand qualification-lens catalogue-discovery` | ❌ W0 | ⬜ pending |
| 12-02-03 | 02 | 3 | MATCH-01, MATCH-02, MATCH-03, MATCH-04 | T-12-05, T-12-06, T-12-08 | Documented support and source/action DTO regressions preserve the non-predictive governed-evidence boundary. | unit | `corepack pnpm --filter @scholar-scout/web test -- --runInBand qualification-lens catalogue-publication catalogue-discovery` | ❌ W0 | ⬜ pending |
| 12-03-01 | 03 | 4 | MATCH-01, MATCH-02, MATCH-03, MATCH-04 | T-12-09, T-12-10, T-12-11 | Programmes account entry, transient normal/qualifications-first order, card explanation, and retained choice actions work end to end. | component | `corepack pnpm --filter @scholar-scout/web test -- --runInBand QualificationRecordForm CatalogueOpportunityCard CatalogueDiscoveryOverview` | ❌ W0 | ⬜ pending |
| 12-03-02 | 03 | 4 | MATCH-01, MATCH-02, MATCH-03, MATCH-04 | T-12-10, T-12-11, T-12-12 | Programmes cards render checked, keyword, uncertainty, source/action, and documented-support states without changing visibility. | component | `corepack pnpm --filter @scholar-scout/web test -- --runInBand CatalogueOpportunityCard CatalogueDiscoveryOverview` | ❌ W0 | ⬜ pending |
| 12-03-03 | 03 | 4 | MATCH-01, MATCH-02, MATCH-03, MATCH-04 | T-12-09, T-12-10, T-12-11, T-12-12 | Programmes overview/card loading, long-text, keyboard, order, and non-predictive-copy regressions remain accessible. | component | `corepack pnpm --filter @scholar-scout/web test -- --runInBand QualificationRecordForm CatalogueOpportunityCard CatalogueDiscoveryOverview` | ❌ W0 | ⬜ pending |
| 12-05-01 | 05 | 5 | MATCH-02, MATCH-03, MATCH-04 | T-12-16, T-12-17 | Detail composition renders the reviewed note-free DTO with source, date, action, and retained choice controls. | component | `corepack pnpm --filter @scholar-scout/web test -- --runInBand --runTestsByPath __tests__/components/CatalogueFocusView.test.tsx` | ❌ W0 | ⬜ pending |
| 12-05-02 | 05 | 5 | MATCH-02, MATCH-03, MATCH-04 | T-12-16, T-12-17, T-12-18 | Shortlist comparison receives the shared explanation and preserves accessible source-first controls. | component | `corepack pnpm --filter @scholar-scout/web test -- --runInBand --runTestsByPath __tests__/components/CatalogueFocusView.test.tsx __tests__/components/CatalogueComparison.test.tsx` | ❌ W0 | ⬜ pending |

## Wave 0 Requirements

- [ ] `apps/web/__tests__/lib/qualification-record.test.ts` — exact-key parsing, bounds, privacy, prohibited-key rejection, legacy normalization.
- [ ] `apps/web/__tests__/lib/qualification-lens.test.ts` — deterministic buckets, stable ties, ID preservation, stale/unknown/conflicting rows, explicit-keyword boundary.
- [ ] `apps/web/__tests__/api/account-qualification-routes.test.ts` — account ownership, guest denial, payload limits, 400/409 behavior, no owner override.
- [ ] `apps/web/__tests__/components/QualificationRecordForm.test.tsx` — labels, focus, live status, limits, no automatic keyword extraction.
- [ ] Extend catalogue/store tests for shared source/date/action, documented-support-only copy, account isolation, and no guest migration.

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Plain-language reading order and responsive clarity | MATCH-03 | Reading level and distraction are visual/content judgments. | On Account and Programmes, save a record, switch order, and inspect the short explanation before expanded detail at narrow and desktop widths. |
| Blue verification treatment is not color-only | MATCH-03 | Requires keyboard, screen-reader, and visual inspection. | Find a stale or unknown requirement; confirm the `Needs verification` text/icon/date/action are visible and focusable without relying on blue. |

## Validation Sign-Off

- [ ] All tasks have automated verification or Wave 0 dependencies.
- [ ] Sampling continuity: no three consecutive tasks without automated verification.
- [ ] Wave 0 covers all phase requirements.
- [ ] No watch-mode flags.
- [ ] Focused task-loop feedback latency is under 30 seconds.
- [ ] `nyquist_compliant: true` set after validation.

**Approval:** pending
