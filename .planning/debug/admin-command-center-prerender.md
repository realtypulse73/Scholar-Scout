---
status: resolved
trigger: "Vercel Preview build at commit 3961ebb fails while pre-rendering /admin/command-center because ScholarScout stored data could not be read safely."
created: "2026-10-03"
updated: "2026-10-03"
---

# Admin command-center prerender failure

## Symptoms

- Expected: `pnpm build:vercel` completes without reading private governed programme data at build time; `/admin/command-center` reads it only for an authorized runtime request.
- Actual: Vercel Preview fails after 39 seconds while pre-rendering `/admin/command-center`.
- Error: `ScholarScoutDataStoreReadError` with category `invalid-data`, followed by `Export encountered an error on /admin/command-center/page`.
- Timeline: This appeared after the preceding `/admin/programmes` runtime-rendering repair was deployed as commit `3961ebb`.
- Reproduction: Build the Preview branch with the configured durable-data environment.

## Current Focus

- hypothesis: `apps/web/app/admin/command-center/page.tsx` reads governed programme data but is eligible for static evaluation during `next build`.
- test: Compare its rendering configuration with other private, durable-data-backed admin pages and reproduce with the Vercel-equivalent build.
- expecting: The command-center route is not prerendered and runtime authorization/data behavior remains unchanged.
- next_action: none

## Evidence

- timestamp: 2026-10-03 — Vercel failed at commit `3961ebb` while pre-rendering `/admin/command-center`; its failure was a `ScholarScoutDataStoreReadError` with category `invalid-data`.
- timestamp: 2026-10-03 — `command-center/page.tsx` calls `getGovernedProgrammes()` but had no `dynamic` rendering export. The other private admin pages with durable reads, including the immediately preceding `/admin/programmes` repair, export `dynamic = 'force-dynamic'`.

## Eliminated


## Resolution

- root_cause: The command-center admin route was statically evaluated during the build even though it reads governed durable catalogue data; the Preview Blob payload is intentionally rejected as unreadable during that build-time read.
- fix: Mark the command-center page `force-dynamic`, keeping its existing authorization and data behavior for runtime requests while preventing build-time data access.
- verification: `pnpm --filter @scholar-scout/web run test -- --runInBand __tests__/api/admin-runtime-boundaries.test.ts` passed (5 tests); `pnpm build:vercel` passed; `apps/web/.next/prerender-manifest.json` omits `/admin/command-center` and the runtime server bundle is present. Local Node 20 emitted only the known Node 24 engine warning; Vercel uses Node 24.x.
- files_changed: `apps/web/app/admin/command-center/page.tsx`, `apps/web/__tests__/api/admin-runtime-boundaries.test.ts`.
