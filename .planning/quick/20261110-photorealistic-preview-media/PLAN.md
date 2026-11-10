---
title: Photorealistic Preview fixture media
status: complete
created: 2026-11-10
---

# Photorealistic Preview fixture media

## Objective

Replace the two Preview-only generic illustrations with original photorealistic learning scenes that clearly match their pathway subjects, without representing a real school, campus, provider, or person.

## Boundaries

- Keep the explicit Preview-only fixture gate, non-affiliation disclosure, unknown factual state, and production-off behavior unchanged.
- Keep versioned prior image assets rather than overwriting them.
- Use a generic applied-health practice scene and a generic welding-and-fabrication practice scene.
- Do not imply that imagery verifies a provider offer or replace the separate real-video motion UAT.

## Tasks

1. Add the two original photorealistic images as versioned Preview fixture assets.
2. Update the fixture labels, alternative text, and image paths to describe the new training scenes accurately.
3. Extend the focused fixture test and run test, typecheck, lint, and whitespace validation.

## Validation

- `pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/lib/catalogue-publication.test.ts __tests__/lib/catalogue-discovery.test.ts __tests__/components/DiscoveryPreviewSlot.test.tsx __tests__/components/CatalogueFocusView.test.tsx __tests__/lib/server/phase13-preview-illustration-fixture.test.ts`
- `pnpm --filter @scholar-scout/web run typecheck`
- `pnpm --filter @scholar-scout/web run lint`
- `git diff --check`
