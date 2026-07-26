---
quick_task: 260726-1db
title: Make the Vercel deployment configuration build Scholar Scout from its monorepo
status: complete
completed: 2026-07-26
commit: 034173e
files_modified:
  - vercel.json
  - docs/vercel-deployment.md
---

# Quick Task 260726-1db Summary

Vercel now keeps `apps/web` as its Root Directory while its committed install and build commands move to the root pnpm workspace.

## Completed Work

- Updated `vercel.json` so Vercel runs the frozen, lifecycle-disabled pnpm install and `build:vercel` from the workspace root after starting in `apps/web`.
- Set Vercel's output directory to `.next`, relative to its configured app root.
- Updated the deployment runbook with the matching Root Directory, Build Step source-file access setting, no-dashboard-command-override requirement, and local app-root verification path.

## Verification

- Passed the `vercel.json` contract assertion for framework, app-root traversal, frozen install options, filtered build command, and `.next` output directory.
- From the app-root context, ran `pnpm install --frozen-lockfile --ignore-scripts` and `pnpm build:vercel` using the documented portable Node/Corepack pnpm 10.34.5 setup. The Next.js production build completed successfully.
- Ran `git diff --check` before commit.

## Deviations

None. The non-interactive verification used `CI=true` and the `pnpm.cmd` Corepack shim because Windows PowerShell execution policy blocks the generated `pnpm.ps1` shim; this is equivalent to Vercel's non-interactive CI environment.

## Commit

- `034173e` `fix(quick-260726-1db): configure Vercel monorepo build`
