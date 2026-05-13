# Issue → Codex → PR Automation Guide

This file defines a near-zero-touch execution pattern.

## Step 1: Issue Creation
Each issue must include:
- Goal
- Files to inspect
- Tasks
- Acceptance criteria

## Step 2: Codex Trigger (Manual or API)
Prompt format:

Repository: realtypulse73/Scholar-Scout
Branch: feature/<issue-number>-<slug>
Implement GitHub issue #<number>
Follow docs/chatgpt-codex-github-sync.md

## Step 3: Codex Responsibilities
- Create branch
- Implement feature
- Run typecheck, lint, tests
- Open PR with summary

## Step 4: CI Enforcement
GitHub Actions must pass before merge.

## Step 5: Merge and Deploy
Merge to main triggers Vercel deployment.

## Optional Automation Extensions
- Use GitHub Apps to auto-trigger Codex
- Use webhooks for external automation
- Add Slack or email notifications
