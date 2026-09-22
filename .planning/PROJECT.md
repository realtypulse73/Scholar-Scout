# Scholar Scout

## What This Is

Scholar Scout is a web application that helps students explore post-secondary pathways, compare programmes, understand fit, and make more informed next-step decisions. It combines a programme catalogue, personalised onboarding and recommendations, simulations, community-oriented features, and optional advisor guidance.

The Regional Opportunity Navigator will make that exploration practical in five official metropolitan areas: Greater Houston, Greater Chicago, Greater Buffalo, Greater Atlanta, and Greater New Orleans. It will cover university, community-college, trade, apprenticeship, employer-linked training, and military-information pathways through source-verified facts and student-controlled comparison.

## Core Value

Students can confidently discover and act on the education pathways that fit their goals and circumstances.

## Business Context

- **Customer**: Students exploring college, career, and programme options; staff curate programme information.
- **Success metric**: Students can complete a trustworthy pathway-discovery journey without exposing their information or losing progress.
- **Strategy notes**: Improve the existing application safely before expanding its feature surface.

## Requirements

### Validated

- ✓ Programme discovery, filtering, and profile-informed ranking — existing
- ✓ Account onboarding and saved shortlist capabilities — existing
- ✓ Interactive simulations, engagement signals, and recommendation support — existing
- ✓ Staff-managed programme catalogue foundation — existing
- ✓ Complete and validate the in-progress school, peer-community, campus-community, and Western New York product work — Phase 5
- ✓ Restore reliable CI, candidate-quality, and Preview rehearsal signals for release decisions — Phase 6

### Active

- [ ] Build a source-verified, freshness-governed opportunity catalogue for the five approved metro areas.
- [ ] Let students browse and compare university, community-college, trade, apprenticeship, employer-linked training, and military-information pathways without suppressing options.
- [ ] Keep ordinary qualifications student-controlled and keep personal circumstances purpose-separated, optional, and referral-only.
- [ ] Distinguish Scholar Scout transition storytelling from verified provider-specific pages and media.

### Out of Scope

- Wholesale replacement of the application stack — preserve delivery momentum and migrate high-risk boundaries incrementally.
- Automated eligibility, admission, placement, pay, loan, or outcome determinations — Scholar Scout will present published facts and verification actions, not make a decision for a student.
- Provider-site scraping, unlicensed provider media, and paid ranking — records must use attributable official or approved sources and preserve organic ranking.

## Context

The application is a Next.js monolith deployed to Vercel, with NextAuth, a programme catalogue, personalised discovery, simulations, and optional OpenAI advisor guidance. Its server state uses a pluggable JSON/HTTP/Vercel Blob whole-document store; migrations remain incremental to protect user data.

Phases 5–7 established governed programme evidence, choice-preserving matching, sensitive referral boundaries, and safe Preview evidence. The v1.1 catalogue will build on that foundation: student-selected ordinary qualifications can help explain published requirements, but every pathway remains browseable. Sensitive circumstances (including re-entry, disability, childcare, health, immigration, or protected characteristics) may only drive an optional, purpose-specific support referral and never ranking, suppression, inference, or provider disclosure.

## Constraints

- **Tech stack**: Retain the Next.js 15, React 18, TypeScript, NextAuth, and Vercel foundation — avoid unnecessary platform churn.
- **Data safety**: Do not risk production data while replacing whole-document persistence — use incremental, tested migration boundaries.
- **Delivery**: Preserve and validate the existing in-progress feature work — do not overwrite or silently absorb it into unrelated changes.
- **Operations**: CI must become a reliable quality gate before it is used for release decisions.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Prioritize security and reliability before broader feature expansion | Public data exposure, anonymous AI spend, broken administrative paths, and failing CI are release blockers | Phase 6 passed |
| Treat the school/community/WNY feature cluster as a separately validated release slice | It has broad scope and should not be obscured by stabilization work | Phase 5 passed |
| Modernize persistence incrementally | A wholesale rewrite would create unacceptable delivery and data-migration risk | — Pending |
| Validate the school/community/WNY release slice through isolated Preview UAT | Preserve privacy and source safety while proving browser, provider, moderation, and assistive-technology behavior | Phase 5 passed |
| Use official metropolitan statistical area boundaries for the regional catalogue | A stable public definition prevents ambiguous area coverage | — Pending research verification |
| Treat military pathways as factual exploration and human verification, not recruitment targeting or eligibility determination | Minors and adults need accurate official information without pressure or unsupported conclusions | — Pending |
| Keep personal circumstances separate from matching | Support can be offered with voluntary, purpose-specific consent without turning sensitive data into a ranking signal | Phase 7 foundation passed |

## Current Milestone: v1.1 Regional Opportunity Navigator

**Goal:** Students in Greater Houston, Greater Chicago, Greater Buffalo, Greater Atlanta, and Greater New Orleans can discover, compare, and verify broad post-secondary and training pathways while retaining control over what personal information informs their experience.

**Target features:**
- Five-metro, official-source catalogue and source-freshness operations.
- Choice-preserving comparison across college, trades, apprenticeships, employer-linked training, and military-information paths.
- Provider-page verification, safe optional support referrals, and inclusive Scholar Scout transition stories.

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-22 after starting milestone v1.1*
