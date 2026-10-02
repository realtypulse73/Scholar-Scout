---
status: resolved
trigger: "pnpm build:vercel fails after Phase 13.2 because mediainfo.js cannot resolve MediaInfoModule.wasm during the Next.js production build."
created: "2026-10-02"
updated: "2026-10-02"
---

# MediaInfo WASM build failure

## Symptoms

- Expected: `pnpm build:vercel` completes so the approved contributor-media work can be deployed to Preview.
- Actual: The Next.js production build fails while resolving `mediainfo.js` and `MediaInfoModule.wasm`.
- Error: unresolved `MediaInfoModule.wasm` import reported from the `mediainfo.js` package during the build.
- Timeline: Began after Phase 13.2 added server-side MP4 metadata inspection using `mediainfo.js@0.3.8`.
- Reproduction: Run `pnpm build:vercel` from the repository root.

## Current Focus

- hypothesis: The package's browser-oriented WASM entry point is being statically bundled by Next.js despite use being intended for a server-only media-inspection route.
- test: Inspect the installed package export paths and the server import boundary, then use the package-supported Node/server entry point or packaging configuration.
- expecting: A documented server-compatible import/build configuration that leaves the existing media validation behaviour intact.
- next_action: resolved; proceed with the normal Preview-only deployment and manual demonstration verification after the phase workflow completes.

## Evidence

- timestamp: 2026-10-02T09:44:00-04:00; `pnpm build:vercel` failed with `Module not found: Can't resolve 'MediaInfoModule.wasm'` from `mediainfo.js/dist/esm-bundle/index.js`, imported by the server-only contributor-media inspection module.
- timestamp: 2026-10-02T09:45:00-04:00; `mediainfo.js@0.3.8` declares an ESM `module` export that points to `dist/esm-bundle/index.js`; that browser bundle resolves the WASM file as a bare URL import. Its CommonJS `require` export points to the Node-aware `dist/cjs/index.cjs` path.
- timestamp: 2026-10-02T09:47:00-04:00; configuring `serverExternalPackages: ['mediainfo.js']` made Next leave the package external for the server bundle, allowing Node to select its CommonJS path. `pnpm build:vercel` compiled successfully after the change.
- timestamp: 2026-10-02T09:48:00-04:00; focused contributor-media Jest suites passed (33 tests) and web lint passed. The successful Vercel-equivalent build also completed type validation.

## Eliminated

- The Vercel private Blob configuration and contributor-media validation logic were not involved: the failure occurred during static module resolution before any runtime media operation.
- Copying or publishing the dependency's WASM asset was not required; the package's documented Node-compatible CommonJS entry is selected when the server package is externalized.

## Resolution

- root_cause: Next.js selected `mediainfo.js`'s browser-oriented ESM `module` export while bundling a server-only import, and that bundle resolves `MediaInfoModule.wasm` as a bare import that webpack cannot locate.
- fix: Add `mediainfo.js` to `serverExternalPackages` in the web Next.js configuration so the Node runtime resolves the package's CommonJS server entry instead of webpack bundling the browser ESM export.
- verification: `pnpm build:vercel`; `pnpm --filter @scholar-scout/web run test -- --runInBand __tests__/lib/contributor-media.test.ts __tests__/api/contributor-media.test.ts __tests__/api/preview-owner-media-demo.test.ts`; `pnpm --filter @scholar-scout/web run lint`.
- files_changed: apps/web/next.config.mjs; .planning/debug/mediainfo-wasm-build.md
