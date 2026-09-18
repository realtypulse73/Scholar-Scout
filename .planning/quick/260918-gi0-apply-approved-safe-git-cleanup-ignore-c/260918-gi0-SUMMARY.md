---
quick_task: 260918-gi0
title: Apply approved safe Git cleanup and ignore confirmed local artifacts
status: complete
completed: 2026-09-18
---

# Quick Task 260918-gi0 Summary

Committed the approved programme-discovery and rehearsal work without staging unrelated files, then recorded the four approved local-artifact ignore rules in a separate commit.

## Commits

- `662edd7` — `feat: refine programme discovery and rehearsal tooling`
  - Contains exactly the 14 approved tracked content files.
- `c791a73` — `chore: ignore approved local artifacts`
  - Contains only `.gitignore` with `.worktrees/`, `tmp/`, `dev-server.log`, and `output/pdf/`.

## Verification

- Verified the content-commit staged file list exactly matched the 14-file allowlist.
- Ran `git diff --cached --check` before each commit and `git diff --check` after commits successfully.
- Confirmed all four approved targets are ignored with `git check-ignore`.
- Confirmed commit file boundaries with `git show --name-only`.
- Pushed normally to `origin/codex/phase-1-release-uat`; final ahead/behind status is `0/0`.

## Preserved Working State

No branches, files, or stashes were deleted or discarded. The remaining untracked paths were deliberately left untouched:

- `.planning/phases/08-matching-algorithm-improvement/`
- `.planning/quick/260916-tsa-refresh-scholar-scout-page-imagery-with-/`
- `.planning/quick/260916-u0w-apply-the-configured-modern-geist-typefa/`
- `.planning/quick/260916-u27-add-rural-and-inner-city-learning-backdr/`
- `.planning/quick/260916-u7l-replace-stylized-ambient-imagery-with-ph/`
- `.planning/quick/260916-uc9-add-clear-photoreal-school-and-training-/`
- `.planning/quick/260916-ujk-add-a-scholar-scout-watermark-to-the-rot/`
- `.planning/research/`
- `.planning/quick/260918-gi0-apply-approved-safe-git-cleanup-ignore-c/`
- `apps/web/.gitignore`
- `apps/web/components/layout/`
- `apps/web/public/images/campuses/`
- `reports/preview-rehearsal-provisioning.md`

The existing unstaged `apps/web/components/feed/PathCard.tsx` and `apps/web/lib/platform.ts` were also preserved outside both commits.
