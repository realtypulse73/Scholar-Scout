---
status: fixing
trigger: "A fresh valid private contributor-media package reaches completion in Preview but is returned as Action needed."
created: "2026-10-18"
updated: "2026-10-18"
---

# Preview media inspection runtime

## Symptoms

- Expected: a valid MP4 and poster in the connected private Blob store pass server inspection and transition to `Ready for review`.
- Actual: Preview completion returns `Action needed` after both direct-upload callbacks and the completion route return 200.
- Reproduction: submit the configured contributor's fresh two-file package on Preview.

## Current Focus

hypothesis: "Resolved. The externalized mediainfo.js runtime dynamically reads MediaInfoModule.wasm, so the completion route needs the physical package asset traced for Vercel."
test: "Provide an authenticated, owner-scoped reinspection action that reads only the existing Action needed package server-side and never accepts client object identifiers."
expecting: "The existing fresh package can be re-inspected on Preview without replacing its private objects."
next_action: "Deploy the owner-scoped reinspection action to Preview and have the signed-in contributor select it once."

## Evidence

- timestamp: "2026-10-18"
  observation: "The latest package contains both expected private objects. The video is video/mp4, 18.4 MB, and 16 seconds; the poster is image/png and 1.08 MB. Both are within the approved limits."
- timestamp: "2026-10-18"
  observation: "Vercel logs show successful prepare, both signed upload callbacks, and completion on the current Preview deployment. The completion route collapses every storage/WASM/metadata failure to Action needed without recording a safe category."
- timestamp: "2026-10-18"
  observation: "mediainfo.js is externalized to use its Node-aware CommonJS entry, which dynamically loads MediaInfoModule.wasm. Next.js documents outputFileTracingIncludes for runtime files that static tracing cannot infer."

## Resolution

root_cause: "The externalized mediainfo.js CommonJS loader dynamically reads MediaInfoModule.wasm, which was not present in the contributor completion route's server trace. The prior catch-all inspection boundary returned Action needed without a non-sensitive operational category. The first Preview deployment used pnpm's workspace junction and Vercel rejected the resulting serverless package as containing a symlink."
fix: "Trace from the workspace root and include the narrow physical pnpm package glob for the contributor completion route; preserve categorized, non-sensitive inspection outcomes. Add an authenticated owner-scoped reinspection route and Action needed UI control that reuses the existing server-side package rather than requesting new files."
verification: "Focused contributor-media route tests pass (29 tests), lint and typecheck pass, and the Vercel-equivalent build completes. The reinspection test proves an already-stored package transitions to Ready for review without replacement upload objects. The prior physical trace correction is Ready on Preview; the reinspection action requires a fresh Preview deployment."
files_changed:
  - "apps/web/next.config.mjs"
  - "apps/web/app/api/contributor-media/reinspect/route.ts"
  - "apps/web/components/contributor-media/ContributorMediaIntake.tsx"
  - "apps/web/lib/server/contributor-media.ts"
  - "apps/web/__tests__/api/contributor-media.test.ts"
  - ".planning/debug/preview-media-inspection-runtime.md"
