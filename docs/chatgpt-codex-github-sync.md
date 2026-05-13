# ScholarScout ChatGPT ↔ Codex ↔ GitHub Sync Plan

This document makes GitHub the source of truth for work generated in ChatGPT and implemented through Codex.

## Operating Rule

All product strategy, architecture, and code ideas generated in ChatGPT should be mirrored into GitHub as one of the following:

1. A committed document in `docs/`.
2. A GitHub issue describing the build task.
3. A feature branch and pull request containing implementation work.
4. A Codex-ready prompt that references exact repository files and acceptance criteria.

## Source of Truth

| System | Role |
|---|---|
| ChatGPT | Strategy, product design, architecture, drafting, implementation planning, and code generation support. |
| Codex | Repository-aware coding agent for implementation, refactors, tests, and pull requests. |
| GitHub | Permanent source of truth for code, documentation, issues, branches, reviews, and releases. |

## Repository

- GitHub repository: `realtypulse73/Scholar-Scout`
- Default branch: `main`
- Web app workspace: `apps/web`
- Core intelligence engines: `apps/web/lib`
- Product documentation: `docs`

## Current Intelligence Stack To Mirror

The ScholarScout build now includes these intended layers:

1. Authentication and account roles
2. Student onboarding
3. Matching engine
4. Pathway recommendation engine
5. Recommendation dashboard
6. Adaptive recommendation engine
7. Predictive decision engine
8. Institutional intelligence layer
9. Marketplace and monetization layer
10. Investor-ready pitch and institutional dashboard narrative

## Codex Implementation Protocol

When asking Codex to build a feature, use this structure:

```text
Repository: realtypulse73/Scholar-Scout
Branch: feature/<short-feature-name>
Goal: <one sentence>
Files to inspect first:
- apps/web/lib/<relevant-engine>.ts
- apps/web/components/<relevant-component>.tsx
- apps/web/app/<route>/page.tsx

Tasks:
1. <specific implementation step>
2. <specific implementation step>
3. <specific implementation step>

Acceptance criteria:
- npm run typecheck --workspace @scholar-scout/web passes
- npm run lint --workspace @scholar-scout/web passes
- Feature works in the relevant route
- No secrets are committed
- Documentation updated in docs/

Open a PR into main with a concise summary and testing notes.
```

## GitHub Mirroring Protocol

Every meaningful ChatGPT decision should become a GitHub artifact.

### For product strategy
Create or update a file in `docs/`.

### For implementation work
Create a GitHub issue with:

- Goal
- User story
- Technical files affected
- Acceptance criteria
- Test commands

### For code changes
Use a feature branch and PR.

Suggested branch naming:

```text
feature/auth-onboarding-system
feature/matching-engine
feature/pathway-recommendations
feature/recommendation-dashboard
feature/adaptive-recommendations
feature/predictive-decisions
feature/institutional-intelligence
feature/marketplace-layer
feature/investor-dashboard-ui
```

## Current Codex-Ready Backlog

### 1. Integrate adaptive recommendations into dashboard

Goal: Replace static ranking on `/recommendations` with behavior-aware adaptive recommendations.

Files:
- `apps/web/components/recommendations/RecommendationDashboard.tsx`
- `apps/web/lib/adaptive-recommendations.ts`
- `apps/web/lib/shortlist.ts`

Acceptance criteria:
- Dashboard loads shortlist ids and planning statuses.
- Top recommendation uses `adaptiveScore`.
- UI displays `rankReason`.
- No regression to existing programme ranking.

### 2. Integrate predictive decisions into dashboard

Goal: Show likely choice, decision stage, risk level, confidence, and likely next action.

Files:
- `apps/web/components/recommendations/RecommendationDashboard.tsx`
- `apps/web/lib/predictive-decisions.ts`

Acceptance criteria:
- Dashboard shows “Most likely choice.”
- Displays `choiceProbability`, `decisionStage`, `decisionRisk`, and `likelyNextAction`.
- Shows `whyLikely` explanation list.

### 3. Build institutional intelligence dashboard UI

Goal: Create a staff-only `/admin/intelligence` dashboard powered by institutional intelligence.

Files:
- `apps/web/lib/institutional-intelligence.ts`
- `apps/web/app/admin/intelligence/page.tsx`
- `apps/web/components/auth/StaffGate.tsx`

Acceptance criteria:
- Page is staff-gated.
- Shows demand signals, support needs, programme insights, and opportunities.
- Uses current programme and stored user/onboarding data where available.

### 4. Build marketplace monetization scaffolding

Goal: Add a transparent sponsored-pathway model that never overrides fit below eligibility thresholds.

Files:
- `apps/web/lib/marketplace.ts`
- `apps/web/components/recommendations/RecommendationDashboard.tsx`
- `docs/marketplace-monetization-model.md`

Acceptance criteria:
- Sponsored pathways require minimum fit and minimum decision probability.
- Sponsored status is clearly labeled.
- Organic ranking remains available and explainable.

### 5. Build investor pitch deck assets

Goal: Convert the pitch narrative into a deck-ready artifact and visual dashboard mockup guidance.

Files:
- `docs/investor-pitch-revenue-model.md`
- `docs/institutional-dashboard-ui-spec.md`

Acceptance criteria:
- Deck outline includes problem, solution, product, market, moat, business model, ask.
- Institutional dashboard spec includes data cards, charts, and opportunity alerts.

## Environment and Secret Rules

Never commit secrets. Store secrets in Vercel and GitHub Actions only.

Required production auth variables include:

```text
NEXTAUTH_URL
NEXTAUTH_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
SCHOLARSCOUT_STAFF_EMAILS
```

## Human Workflow

1. Discuss strategy in ChatGPT.
2. Mirror the decision into GitHub docs or an issue.
3. Ask Codex to implement against the GitHub issue or this handoff document.
4. Review the PR.
5. Merge to `main`.
6. Redeploy through Vercel.
7. Return to ChatGPT for the next product or business iteration.

## Immediate Next Action

Open GitHub issues for the five Codex-ready backlog items above, then assign Codex or a developer to implement each item as a separate PR.
