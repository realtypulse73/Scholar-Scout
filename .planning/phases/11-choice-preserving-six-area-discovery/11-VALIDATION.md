# Phase 11 Validation Plan — Choice-Preserving Six-Area Discovery

**Status:** Approved implementation and acceptance matrix
**Phase goal:** Any student can browse, filter, save, compare, and verify the governed six-area catalogue through accessible, source-first discovery surfaces.

## Automated Task Map

Every implementation task has a focused executable check. The final matrix repeats all focused suites, then runs the complete web suite, typecheck, and lint.

| Plan / task | Behavior proved | Focused automated verification | Test ownership |
|---|---|---|---|
| 11-01 / Task 1 | A public `/programmes` page maps only a published snapshot record to a browser-safe factual card with detail, save, compare, and official verification actions. | `corepack pnpm --filter @scholar-scout/web test -- --runInBand __tests__/lib/catalogue-discovery.test.ts __tests__/components/CatalogueDiscoveryOverview.test.tsx` | `apps/web/__tests__/lib/catalogue-discovery.test.ts`, `apps/web/__tests__/components/CatalogueDiscoveryOverview.test.tsx` |
| 11-01 / Task 2 | Allowed URL filters, all six pathways, coverage disclosure, stable neutral order, reset, malformed-query fallback, and honest empty states work without profile or passive signals. | `corepack pnpm --filter @scholar-scout/web test -- --runInBand __tests__/lib/catalogue-discovery.test.ts __tests__/components/CatalogueDiscoveryOverview.test.tsx` | `apps/web/__tests__/lib/catalogue-discovery.test.ts`, `apps/web/__tests__/components/CatalogueDiscoveryOverview.test.tsx` |
| 11-02 / Task 1 | Scannable source-first cards show the required overview facts, status/source/official action, `See all facts and sources`, alternate route, save, and compare without a personal-outcome claim. | `corepack pnpm --filter @scholar-scout/web test -- --runInBand __tests__/components/CatalogueOpportunityCard.test.tsx __tests__/components/CatalogueDiscoveryOverview.test.tsx` | `apps/web/__tests__/components/CatalogueOpportunityCard.test.tsx`, `apps/web/__tests__/components/CatalogueDiscoveryOverview.test.tsx` |
| 11-02 / Task 2 | The focused route and metadata use only the current published snapshot; no legacy static IDs or seed fallback appear. Focus navigation is finite and the preview is explicitly non-media. | `corepack pnpm --filter @scholar-scout/web test -- --runInBand __tests__/components/CatalogueFocusView.test.tsx __tests__/app/programmes/[id]/page.test.tsx __tests__/lib/catalogue-discovery.test.ts` | `apps/web/__tests__/components/CatalogueFocusView.test.tsx`, `apps/web/__tests__/app/programmes/[id]/page.test.tsx`, `apps/web/__tests__/lib/catalogue-discovery.test.ts` |
| 11-03 / Task 1 | A browser-saved ID resolves only to a public snapshot item for unauthenticated factual comparison. | `corepack pnpm --filter @scholar-scout/web test -- --runInBand __tests__/components/CatalogueComparison.test.tsx` | `apps/web/__tests__/components/CatalogueComparison.test.tsx` |
| 11-03 / Task 2 | Multiple and unavailable saved IDs remain visible; factual evidence and remove actions work in a responsive comparison without a winner or outcome claim. | `corepack pnpm --filter @scholar-scout/web test -- --runInBand __tests__/components/CatalogueComparison.test.tsx` | `apps/web/__tests__/components/CatalogueComparison.test.tsx` |
| 11-04 / Task 1 | Overview filters/cards have labels, live result/error state, text-based fact status, keyboard-native actions, external-link context, and bounded small-width structures. | `corepack pnpm --filter @scholar-scout/web test -- --runInBand __tests__/components/CatalogueDiscoveryOverview.test.tsx __tests__/components/CatalogueOpportunityCard.test.tsx` | `apps/web/__tests__/components/CatalogueDiscoveryOverview.test.tsx`, `apps/web/__tests__/components/CatalogueOpportunityCard.test.tsx` |
| 11-04 / Task 2 | Focus/detail and the intentionally non-media preview retain named finite controls, evidence prose, narrow-width layout classes, and reduced-motion continuity. | `corepack pnpm --filter @scholar-scout/web test -- --runInBand __tests__/components/CatalogueFocusView.test.tsx` | `apps/web/__tests__/components/CatalogueFocusView.test.tsx` |
| 11-04 / Task 3 | Current/unavailable comparison cards retain accessible controls and bounded reflow; the complete Phase 11 regression matrix remains coherent. | `corepack pnpm --filter @scholar-scout/web test -- --runInBand __tests__/components/CatalogueComparison.test.tsx __tests__/components/CatalogueDiscoveryOverview.test.tsx __tests__/components/CatalogueOpportunityCard.test.tsx __tests__/components/CatalogueFocusView.test.tsx __tests__/lib/catalogue-discovery.test.ts __tests__/app/programmes/[id]/page.test.tsx` | All Phase 11 suites above |

## Requirement and Safety Assertions

| Requirement | Automated assertions |
|---|---|
| DISC-01 | Unauthenticated browse, detail, save, comparison, and stored official action; no account/profile gate or live provider request. |
| DISC-02 | Same reviewed record facts travel through overview, focused route, and comparison with provider, type, place/delivery, reasons, facts to verify, source/date/state, alternate route, and official action. |
| DISC-03 | URL parser only accepts controlled filters; all six pathway choices and coverage states remain visible; stable ordering is driven only by selected metro and explicit filters. |
| DISC-04 | Native controls, labels, landmarks, live/status prose, external-link context, bounded layout classes, reduced-motion styling, and comparison's labelled overflow exception are covered by component tests. |

## Final Automated Matrix

Run from the repository root after all Phase 11 plans finish:

```powershell
corepack pnpm --filter @scholar-scout/web test -- --runInBand __tests__/lib/catalogue-discovery.test.ts __tests__/components/CatalogueDiscoveryOverview.test.tsx __tests__/components/CatalogueOpportunityCard.test.tsx __tests__/components/CatalogueFocusView.test.tsx __tests__/components/CatalogueComparison.test.tsx __tests__/app/programmes/[id]/page.test.tsx
corepack pnpm --filter @scholar-scout/web test -- --runInBand
corepack pnpm --filter @scholar-scout/web run typecheck
corepack pnpm --filter @scholar-scout/web run lint
```

## Final Human Acceptance — Responsive and Assistive Technology

Use a fixture or reviewed public snapshot with at least two records, one non-current fact, and one saved ID unavailable from the current snapshot. No provider-site access or provider data editing is required.

Repeat the following at **320 CSS pixels with 400% zoom**, **375px**, and **768px**:

1. Open `/programmes`; use only `Tab`, `Shift+Tab`, `Enter`, `Space`, and native select controls to change metro/filter state, reset it, open a card, save a choice, open the official action, and reach comparison.
2. Confirm every interactive control has a visible focus indication, every status/empty message is readable as text, and the `See all facts and sources` link is discoverable without a pointer.
3. In the focused route, tab through Back, Previous, Next, save/compare, alternate, and official-source actions. Confirm navigation never changes the record until its explicit link is activated.
4. In comparison, confirm current and unavailable saved choices are separately labelled, factual evidence is readable, and removal affects only the selected saved ID.
5. Inspect the document viewport: the overview, card, focused route, preview disclosure, and mobile/tablet comparison must not require document-level horizontal scrolling. A desktop-only comparison data region may scroll only when it is explicitly labelled as such.
6. With a screen reader enabled, verify landmark/headings, filter/result announcements, fact-status text, preview disclosure, unavailable-choice notice, and official-link leaving-site context have understandable names. Color alone must not convey a material status.
7. Emulate `prefers-reduced-motion: reduce`; confirm all facts, controls, status disclosures, and the non-media preview remain in the same reading order while optional focus decoration is absent.

Record the viewport/device, browser, screen reader where used, pass/fail result, and any observed overflow, focus, or announcement defect in `11-04-SUMMARY.md` or its follow-up repair evidence.
