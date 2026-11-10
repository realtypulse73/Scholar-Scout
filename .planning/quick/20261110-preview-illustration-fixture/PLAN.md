---
title: Preview-only original illustration fixture
status: complete
created: 2026-11-10
---

# Preview-only original illustration fixture

## Objective

Make two original, non-affiliated Scholar Scout illustrations available to the existing reviewed-media projection for Preview browser review, while retaining a clean path for approved original provider or contributor content later.

## Boundaries

- Use only newly generated Scholar Scout-owned illustrations; do not copy, trace, or imply affiliation with any school or campus.
- Gate fixture records behind an explicit Preview-only environment switch; production must never receive the records.
- Reuse the existing `illustration` media projection and its non-affiliation disclosure rather than inventing a parallel content model.
- Record that the image fixture can verify visual-card, source-first-detail, and fallback presentation only. It cannot replace the separate real-video motion check.

## Tasks

1. Add the two generated original illustrations to a versioned public fixture path.
2. Add an explicit Preview-only fixture builder and merge it only into the reviewed discovery snapshot when the opt-in gate is enabled.
3. Cover the production-off, Preview-on, non-affiliation, and existing-original-content replacement boundaries with tests.
4. Run focused tests, typecheck, and lint; record the outcome and update project state.

## Validation

- `pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/lib/server/phase13-preview-illustration-fixture.test.ts`
- `pnpm --filter @scholar-scout/web run typecheck`
- `pnpm --filter @scholar-scout/web run lint`
- `git diff --check`
