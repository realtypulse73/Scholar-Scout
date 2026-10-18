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

hypothesis: "The externalized mediainfo.js runtime dynamically reads MediaInfoModule.wasm, but Vercel's function trace does not include or resolve that asset. The current catch-all inspection boundary hides the safe failure category."
test: "Narrow the completion-route trace to the WASM asset; preserve fail-closed inspection and surface only a non-sensitive internal category in tests."
expecting: "The existing fresh package can be re-inspected on the new Preview deployment without replacing its private objects."
next_action: "Add the narrow trace inclusion and inspected-result category, then run focused tests and deploy Preview."

## Evidence

- timestamp: "2026-10-18"
  observation: "The latest package contains both expected private objects. The video is video/mp4, 18.4 MB, and 16 seconds; the poster is image/png and 1.08 MB. Both are within the approved limits."
- timestamp: "2026-10-18"
  observation: "Vercel logs show successful prepare, both signed upload callbacks, and completion on the current Preview deployment. The completion route collapses every storage/WASM/metadata failure to Action needed without recording a safe category."
- timestamp: "2026-10-18"
  observation: "mediainfo.js is externalized to use its Node-aware CommonJS entry, which dynamically loads MediaInfoModule.wasm. Next.js documents outputFileTracingIncludes for runtime files that static tracing cannot infer."

## Resolution

root_cause: "The externalized mediainfo.js CommonJS loader dynamically reads MediaInfoModule.wasm, which was not present in the contributor completion route's server trace. The prior catch-all inspection boundary returned Action needed without a non-sensitive operational category. The first Preview deployment used pnpm's workspace junction and Vercel rejected the resulting serverless package as containing a symlink."
fix: "Trace from the workspace root and include the narrow physical pnpm package glob for the contributor completion route; preserve the categorized, non-sensitive inspection outcomes."
verification: "Focused contributor-media route tests pass (28 tests), typecheck and lint pass, and the Vercel-equivalent build completes with the workspace trace root. A focused test re-inspects the same already-stored package and transitions it to Ready for review without replacement upload objects. The corrected physical-package trace requires a fresh Preview deployment."
files_changed:
  - "apps/web/next.config.mjs"
  - "apps/web/lib/server/contributor-media.ts"
  - "apps/web/__tests__/api/contributor-media.test.ts"
  - ".planning/debug/preview-media-inspection-runtime.md"
