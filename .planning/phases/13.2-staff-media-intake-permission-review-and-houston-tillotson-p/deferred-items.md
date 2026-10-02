# Deferred Items

## 2026-10-02 — Vercel build import failure

- **Scope:** Phase 13.2 Plan 08 final verification
- **Issue:** `pnpm build:vercel` fails before application compilation because the existing Phase 13.2 media-inspection dependency cannot resolve `MediaInfoModule.wasm` from `mediainfo.js` in `apps/web/lib/server/contributor-media.ts`.
- **Why deferred:** This dependency and server-side import path predate Plan 08; the learner illustration and presentation work does not touch either file. Repairing the package/runtime integration exceeds this plan's scoped UI and safety boundary.
- **Required follow-up:** Repair the existing server-only mediainfo.js/WASM build integration, then rerun `pnpm build:vercel` before release or Preview validation.
