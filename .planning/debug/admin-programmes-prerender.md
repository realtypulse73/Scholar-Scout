---
status: resolved
trigger: "Vercel Preview build fails while pre-rendering /admin/programmes because Scholar Scout stored data is invalid or unreadable."
created: "2026-10-02"
updated: "2026-10-03"
---

# Admin programmes prerender failure

## Symptoms

- Expected: `pnpm build:vercel` completes without reading private catalogue state at build time, and the admin programmes page reads data only for an authorized runtime request.
- Actual: Vercel Preview reports that pre-rendering `/admin/programmes` fails because Scholar Scout stored data is invalid or unreadable.
- Error: Next.js pre-rendering failure for the private administrator route due to a durable-data read.
- Timeline: The issue appeared on the first Vercel Preview deployment after Phase 13.2.
- Reproduction: Deploy the current validated branch to Vercel Preview with its durable-data environment configured.

## Current Focus

- hypothesis: `apps/web/app/admin/programmes/page.tsx` is statically evaluated during `next build` while sibling data-backed admin pages opt into runtime-only rendering.
- test: Compare route rendering configuration and verify a focused dynamic-rendering fix with the Vercel-equivalent build.
- expecting: Build does not access durable catalogue data; the authorized runtime page behavior remains unchanged.
- next_action: verification complete

## Evidence

- timestamp: 2026-10-03; `AdminProgrammesPage` reads governed durable catalogue state but had no runtime-rendering export, unlike the sibling private admin pages.
- timestamp: 2026-10-03; extending the existing admin runtime-boundary suite to cover `/admin/programmes` failed before the fix because its `dynamic` export was `undefined`.
- timestamp: 2026-10-03; after adding the runtime-only export, the focused suite passed all four private-admin route assertions.
- timestamp: 2026-10-03; the Vercel-equivalent build completed its Next.js build output, and the generated prerender manifest contains no `/admin/programmes` entry or static HTML file.

## Eliminated

## Resolution

- root_cause: The durable-data-backed `/admin/programmes` page was eligible for static evaluation during `next build`, which forced an unreadable Preview catalogue access during pre-rendering.
- fix: Marked the page `force-dynamic` and extended the existing private-admin runtime-boundary regression test to cover it.
- verification: Focused Jest regression test passes; web typecheck and lint pass; the Vercel-equivalent Next.js build produced no static `/admin/programmes` artifact.
- files_changed: apps/web/app/admin/programmes/page.tsx; apps/web/__tests__/api/admin-runtime-boundaries.test.ts
