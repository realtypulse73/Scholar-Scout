---
status: investigating
trigger: "After the private admin prerender fixes, Vercel Preview at commit 1dfd4df fails while pre-rendering /recommendations because ScholarScout stored data could not be read safely."
created: "2026-10-03"
updated: "2026-10-03"
---

# Governed page prerender boundaries

## Symptoms

- Expected: Pages that read governed durable programme data at request time do not read it during the Vercel build.
- Actual: Vercel Preview now fails on `/recommendations` after prior repairs deferred `/admin/programmes` and `/admin/command-center`.
- Error: `ScholarScoutDataStoreReadError` with category `invalid-data`, followed by an export failure for `/recommendations`.
- Timeline: The new error appeared at commit `1dfd4df`, after the prior two route-specific repairs.
- Reproduction: Deploy the Preview branch with the configured durable-data environment.

## Current Focus

- hypothesis: The static `/recommendations` page invokes `getGovernedProgrammes`, which reads the durable catalogue during Vercel's build; pages already made request-bound or made dynamic by auth/route parameters are not part of this failure.
- test: Add an explicit runtime boundary to `/recommendations`, then build with an unreadable local datastore and inspect the generated prerender manifest.
- expecting: The full Vercel-equivalent build completes without reading the unreadable datastore, and `/recommendations` is absent from static prerender routes.
- next_action: validate the final Vercel-equivalent build and commit the focused repair

## Evidence

- timestamp: 2026-10-03 — Vercel Preview at `1dfd4df` failed while prerendering `/recommendations` with `ScholarScoutDataStoreReadError` category `invalid-data`.
- timestamp: 2026-10-03 — Inventory found six pages that directly read governed programmes. The admin programme and command-center pages already export `dynamic = 'force-dynamic'`; the catalogue pages already do likewise. `/peer-community` and `/contribute/media` are request-bound by session/cookie reads, and `/schools/[slug]` has no static parameter generator. `/recommendations` was the only static route with a direct governed data read and no runtime boundary.
- timestamp: 2026-10-03 — Focused Jest regression passed after adding the `/recommendations` runtime boundary.
- timestamp: 2026-10-03 — A Vercel-equivalent build with `SCHOLARSCOUT_DATA_FILE` pointed at the unreadable local `debug.log` completed and generated `apps/web/.next/prerender-manifest.json`; `/recommendations` was absent from its static `routes` collection.


## Eliminated


## Resolution

- root_cause: `/recommendations` directly called `getGovernedProgrammes` but did not opt out of static prerendering, causing Vercel to read the configured durable document during the build.
- fix: Export `dynamic = 'force-dynamic'` from `/recommendations` and cover that request-time boundary with a focused regression test.
- verification: Focused Jest, web lint, and Vercel-equivalent build with an unreadable datastore; the prerender manifest excludes `/recommendations`.
- files_changed: apps/web/app/recommendations/page.tsx; apps/web/__tests__/api/governed-page-runtime-boundaries.test.ts; .planning/debug/governed-page-prerender-boundaries.md
