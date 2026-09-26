---
phase: 13
slug: provider-detail-transition-stories-and-media-safety
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-09-26
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for deterministic safe media selection, source-first provider detail, and finite transition stories.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.3.0 with Testing Library and `next/jest` |
| **Config file** | `apps/web/jest.config.ts` |
| **Quick run command** | `corepack pnpm --filter @scholar-scout/web test -- --runInBand --runTestsByPath <affected paths>` |
| **Full suite command** | `corepack pnpm --filter @scholar-scout/web test -- --runInBand` |
| **Estimated focused-loop runtime** | under 30 seconds |

## Sampling Rate

- **After every task commit:** Run the mapped focused Jest command; run typecheck whenever the snapshot/media types change.
- **After every plan wave:** Run `corepack pnpm --filter @scholar-scout/web run typecheck`, `corepack pnpm --filter @scholar-scout/web run lint`, and the full Jest suite.
- **Before `$gsd-verify-work`:** Full suite must be green and the manual browser review must cover safe selection, factual fallback, keyboard dialog, narrow viewport, and reduced motion.
- **Max feedback latency:** under 30 seconds for focused task loops.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | MEDIA-01, MEDIA-02 | T-13-01, T-13-02, T-13-03 | A reviewed snapshot projection, never raw candidate data or legacy seeds, reaches the detail preview before Facts and sources. | component + App Router page | `corepack pnpm --filter @scholar-scout/web test -- --runInBand --runTestsByPath __tests__/components/CatalogueFocusView.test.tsx __tests__/app/programmes/[id]/page.test.tsx` | ✅ extend | ⬜ pending |
| 13-01-02 | 01 | 1 | MEDIA-01, MEDIA-02 | T-13-01, T-13-02 | Pure D-03 resolver covers local-first, a valid-but-unrenderable embed continuing to an eligible labelled illustration, and factual fallback only when no local or illustration selection passes; snapshots retain only the safe selection. | unit | `corepack pnpm --filter @scholar-scout/web test -- --runInBand --runTestsByPath __tests__/lib/catalogue-publication.test.ts __tests__/lib/catalogue-discovery.test.ts` | ✅ extend | ⬜ pending |
| 13-03-01 | 03 | 1 | MEDIA-03 | T-13-07, T-13-08 | Finite local records and the server page expose controlled factual destinations and a Skip action without account or provider reads. | unit + App Router page | `corepack pnpm --filter @scholar-scout/web test -- --runInBand --runTestsByPath __tests__/lib/transition-stories.test.ts __tests__/app/stories/page.test.tsx` | ❌ created by task | ⬜ pending |
| 13-03-02 | 03 | 1 | MEDIA-03 | T-13-07, T-13-09 | Story DOM order, disclosure, keyboard access, and reduced-motion-safe decoration remain independent of submission, persistence, and timed progression. | component | `corepack pnpm --filter @scholar-scout/web test -- --runInBand --runTestsByPath __tests__/components/TransitionStoryList.test.tsx` | ❌ created by task | ⬜ pending |
| 13-02-01 | 02 | 2 | MEDIA-01, MEDIA-02 | T-13-06 | Optional visual discovery retains all ordinary controls, routes through Scholar Scout detail, and pairs comparable compare and official actions. | component | `corepack pnpm --filter @scholar-scout/web test -- --runInBand --runTestsByPath __tests__/components/CatalogueDiscoveryOverview.test.tsx __tests__/components/CatalogueFocusView.test.tsx` | ✅ extend | ⬜ pending |
| 13-02-02 | 02 | 2 | MEDIA-01, MEDIA-02 | T-13-04, T-13-05 | Only the central visible local preview can play; pause, reduced motion, a labelled illustration selected after a valid-but-unrenderable embed, and total factual fallback preserve complete facts without an embed renderer. | component | `corepack pnpm --filter @scholar-scout/web test -- --runInBand --runTestsByPath __tests__/components/CatalogueDiscoveryOverview.test.tsx __tests__/components/DiscoveryPreviewSlot.test.tsx` | ❌ created by task | ⬜ pending |
| 13-04-01 | 04 | 3 | MEDIA-03 | T-13-07 | The Stories entry is a keyboard-accessible companion to, not a constraint on, factual six-area discovery. | component | `corepack pnpm --filter @scholar-scout/web test -- --runInBand --runTestsByPath __tests__/components/CatalogueDiscoveryOverview.test.tsx` | ✅ extend | ⬜ pending |
| 13-04-02 | 04 | 3 | MEDIA-01, MEDIA-02 | T-13-10, T-13-11, T-13-12 | Cross-surface fixtures prove D-03 priority, complete factual fallback, snapshot-to-detail wiring, disclosure, bounded motion, and unchanged official verification links. | unit + component + page | `corepack pnpm --filter @scholar-scout/web test -- --runInBand --runTestsByPath __tests__/lib/catalogue-publication.test.ts __tests__/lib/catalogue-discovery.test.ts __tests__/components/DiscoveryPreviewSlot.test.tsx __tests__/components/CatalogueFocusView.test.tsx __tests__/app/programmes/[id]/page.test.tsx` | mixed | ⬜ pending |
| 13-04-03 | 04 | 3 | MEDIA-03 | T-13-07, T-13-09 | Finite stories retain visible non-affiliation copy, controlled factual exits, and no personal/provider-outcome framing. | component + page | `corepack pnpm --filter @scholar-scout/web test -- --runInBand --runTestsByPath __tests__/components/TransitionStoryList.test.tsx __tests__/app/stories/page.test.tsx` | ❌ created by task 13-03 | ⬜ pending |

## Wave 0 Requirements

- [ ] Confirm `corepack pnpm install --frozen-lockfile --ignore-scripts` has completed when `node_modules` is absent; Jest is already the project test framework.
- [ ] `apps/web/__tests__/components/DiscoveryPreviewSlot.test.tsx` — create in task 13-02-02 before changing local-preview and fallback presentation.
- [ ] `apps/web/__tests__/lib/transition-stories.test.ts`, `apps/web/__tests__/components/TransitionStoryList.test.tsx`, and `apps/web/__tests__/app/stories/page.test.tsx` — create in the first red step of tasks 13-03-01 and 13-03-02.
- [ ] Extend existing publication, discovery, detail-component, and provider-detail-page suites in tasks 13-01-01 and 13-01-02 before production implementation.

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Rights evidence and non-affiliation language communicate correctly | MEDIA-01, MEDIA-02 | A reviewer must judge the real selected local/illustrative presentation and its disclosure in context. | Open a valid local-media record, an illustration-eligible record, a valid-but-unrenderable embed candidate paired with an eligible illustration, and a no-selection record. Confirm the page keeps Facts and sources directly after the slot; the embed path shows the labelled illustration and no renderer; the dialog works by keyboard; and no provider affiliation is implied. |
| Motion, responsive layout, and story clarity | MEDIA-01, MEDIA-03 | Visual timing, viewport reflow, and comprehension cannot be completely proven in jsdom. | At phone and tablet widths, confirm one center-visible local card alone may move, its pause control works, reduced motion leaves still readable facts, Stories is skippable, and transition copy cannot read as provider testimony. |

## Source Coverage Audit

| Source | ID | Feature or constraint | Plan | Status | Notes |
|--------|----|-----------------------|------|--------|-------|
| GOAL | Phase 13 | Source-first provider detail and finite accessible Scholar Scout context | 01–04 | COVERED | The tracer proves snapshot-to-detail; later plans expand discovery, motion, and stories. |
| REQ | MEDIA-01 | Rights-evidenced provider media | 01, 02, 04 | COVERED | Resolver persists only a safe local/illustration projection and provider detail renders it. |
| REQ | MEDIA-02 | Factual fallback for unsafe or unsupported media | 01, 02, 04 | COVERED | Resolver test matrix includes malformed states, valid-but-unrenderable embed continuation to an eligible illustration, and fallback only when no safe local or illustration selection exists. |
| REQ | MEDIA-03 | Finite inclusive non-authoritative stories | 03, 04 | COVERED | Local text-first records, controlled factual exits, and story regressions are planned. |
| RESEARCH | local-only presentation | Avoid remote provider loading and defer embed renderer | 01, 02, 04 | COVERED | A valid embed is considered but cannot render in Phase 13; resolver evaluation continues to an eligible labelled illustration, and no client renderer receives an embed URL. |
| RESEARCH | snapshot integrity | Retain only validated public media data | 01, 04 | COVERED | Publication and discovery tests prove raw candidates do not cross the snapshot boundary. |
| RESEARCH | motion safety | One local preview maximum with a visible pause and reduced-motion stop | 02, 04 | COVERED | Central visibility coordinator and regression matrix preserve the scoped D-06 exception. |
| RESEARCH | text-first stories | Avoid unreviewed people imagery and personal testimony | 03, 04 | COVERED | Stories use finite local editorial records and visible non-affiliation wording. |
| CONTEXT | D-01 | Immediate local preview before factual detail | 01 | COVERED | The tracer passes selected local projection to `DiscoveryPreviewSlot`, immediately followed by Facts and sources. |
| CONTEXT | D-02 | Stored current rights evidence and student-facing labels | 01, 04 | COVERED | Resolver and disclosure tests require valid status, evidence, review date, labels, attribution, and alt text. |
| CONTEXT | D-03 | Exact local → embed → illustration → factual order | 01, 04 | COVERED | Pure resolver tests cover all precedence combinations; a valid-but-unrenderable embed continues to an eligible labelled illustration, with factual fallback only if neither local nor illustration passes. |
| CONTEXT | D-04 | Embed rendering needs separate validation and student control | 01, 02 | COVERED | Phase 13 creates no embed render contract; stored valid embed evidence is evaluated without an embed payload, then resolution continues to an eligible illustration or factual fallback. |
| CONTEXT | D-05 | Optional visual explorer and dedicated Stories destination | 02, 03, 04 | COVERED | Both in-discovery companion link and public Stories route remain optional. |
| CONTEXT | D-06 | Only one central visible local loop may move | 02, 04 | COVERED | The plan has one overview-owned coordinator, visible control, and reduced-motion stop without a multi-card exception. |
| CONTEXT | D-07 | Finite inclusive general Scholar Scout context | 03, 04 | COVERED | Text-first local records are skippable and non-authoritative. |
| CONTEXT | D-08 | Scholar Scout detail first, then verified facts and choices | 01, 02 | COVERED | Page-level test wires the projection before the existing factual section and detail actions. |
| CONTEXT | D-09 | Equal Compare and official-site actions | 02, 04 | COVERED | Component tests enforce sibling action hierarchy and separate official browsing context. |
| CONTEXT | D-10 | About-media dialog and quiet nearby non-affiliation statement | 01, 04 | COVERED | Accessible dialog and disclosure regression coverage are part of the tracer and safety matrix. |

## Validation Sign-Off

- [ ] All tasks have automated verification or mapped Wave 0 dependencies.
- [ ] Sampling continuity: no three consecutive tasks lack automated verification.
- [ ] Wave 0 maps every missing test file to its creating task and confirms existing Jest setup.
- [ ] No watch-mode flags.
- [ ] Focused task-loop feedback latency is under 30 seconds.
- [ ] `nyquist_compliant: true` set after validation.

**Approval:** pending
