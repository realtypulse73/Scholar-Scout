# ScholarScout PRD Recovery

## What This Is

ScholarScout is a rejection-free postsecondary matching platform for students seeking realistic, affordable, and supportive education or training pathways. It compares colleges, community colleges, trade schools, certificates, apprenticeships, military and civil-service routes, online programmes, and selected international options while asking where a student is most likely to get in, afford attendance, stay, finish, and act on the recommendation.

This brownfield recovery rebuilds the June 19, 2026 prelaunch MVP requirements on top of the surviving GitHub codebase. The uploaded PRD is the minimum recovery contract; continuing research and evidence may improve implementation, safety, clarity, reliability, and launch readiness without weakening that contract.

## Core Value

Give each student an explainable, evidence-backed pathway ranking that balances access, affordability, persistence, completion, support, and actionable next steps without using protected traits to reduce opportunity.

## Business Context

- **Primary users**: High-school students, first-generation and low-income students, students with uneven academic records, trade-bound students, adult learners, and students comparing multiple pathway types.
- **Secondary users**: Parents, counselors, college-access organizations, workforce agencies, institutions, and recruiters.
- **Initial validation**: A controlled pilot with 25–50 students across New York, Texas, Illinois, Washington, D.C., and Jamaica.
- **Success metric**: Students complete onboarding, receive trusted recommendations, take documented pathway actions, and provide outcome data that can calibrate ScholarFit safely.

## Requirements

### Validated

- ✓ Next.js student and staff application shell with home, onboarding, programme discovery, details, recommendations, shortlist, feed, simulations, advisor, profile, authentication, and administrative routes — existing.
- ✓ Explainable baseline matching, adaptive recommendations, predictive decisions, and simulation-derived recommendation signals — existing.
- ✓ Programme catalogue and governed programme-management workflow with publication, revision, conflict, audit, backup, and restore concepts — existing.
- ✓ Account-backed onboarding and shortlist persistence with pluggable JSON, HTTP, and Vercel Blob storage adapters — existing.
- ✓ Feed, simulation, memory, analytics, referral, share, experimentation, and advisor foundations — existing.
- ✓ Production-readiness scripts, environment checks, release rehearsal, smoke tests, runbooks, and CI foundations — existing.

### Active

- [ ] Establish one canonical, deterministic, versioned match-intelligence contract covering inputs, weights, outputs, confidence, explanations, audit metadata, and promotion state.
- [ ] Restore the PRD scoring outputs and profiles, including admission/access, completion, financial stress, environment/support fit, climate risk, psychological/isolation risk, confidence intervals, match bands, and ScholarFit.
- [ ] Enforce protected-trait guardrails so protected characteristics can support fairness audits and resource matching but never lower rank, suppress opportunity, predict ability, or route students away from valuable pathways.
- [ ] Restore prediction snapshots, outcome records, ranking metrics, bootstrap confidence intervals, cohort/regime slices, calibration buckets, version comparison, human review, and approved activation through an Accuracy Lab.
- [ ] Restore Game of Five, durable student/support messaging, scoring calibration, scoring audit, red-team testing, and criteria-management surfaces.
- [ ] Replace spoofable client identities and fragmented browser/server state with authenticated identity, explicit anonymous-session migration, schema validation, authorization, rate limits, and audit coverage.
- [ ] Move programme and algorithm governance toward versioned records with provenance, effective dates, publication state, and review history.
- [ ] Add unit, integration, browser-journey, accessibility, concurrency, fairness, drift, calibration, and performance verification appropriate to pilot risk.
- [ ] Configure durable production storage, authentication providers, monitoring, privacy/compliance controls, verified programme data, and controlled pilot operations.
- [ ] Preserve and improve existing working experiences while meeting every uploaded PRD requirement.
- [ ] Commit and push every completed, verified recovery increment to `recovery/prd-rebuild` without publishing secrets, generated caches, or failing work.

### Out of Scope

- Public, unsupervised launch before a controlled pilot and privacy/compliance review — the product may handle minors and sensitive educational data.
- Claims that ScholarFit guarantees admission, affordability, persistence, completion, or career outcomes — outputs remain estimates with evidence and uncertainty.
- Using protected traits or socioeconomic proxies to reduce opportunity or infer lower ability — prohibited by the product guardrails.
- Fully automated algorithm activation without human review, evaluation evidence, audit history, and rollback — unsafe for high-impact recommendations.
- Broad international production coverage before source quality, legal requirements, and pilot operations are proven — exploratory catalogue support may remain.

## Context

- The original June 19 local source was lost before it was pushed to GitHub; only the PRD and the current repository remain.
- Recovery work occurs in `C:\Users\judge\Crim Clock\Scholar-Scout-recovery` on branch `recovery/prd-rebuild`.
- The current algorithm is fragmented across `apps/web/lib/preference-matching.ts`, `apps/web/lib/adaptive-recommendations.ts`, `apps/web/lib/predictive-decisions.ts`, `apps/web/lib/platform.ts`, and simulation signal modules.
- The current app uses hard-coded programme and scoring inputs, multiple identity/state paths, and whole-document storage that is vulnerable to lost concurrent updates.
- The codebase map in `.planning/codebase/` is the evidence baseline for architecture, integrations, conventions, testing, and risks.
- Exploration remains active throughout recovery: research can improve the implementation and roadmap, but cannot silently remove PRD commitments.

## Constraints

- **Recovery fidelity**: Every capability in the uploaded June 19 PRD must be represented by a testable requirement and roadmap phase.
- **Fairness**: Protected traits may only be used for auditing, support/resource matching, aggregate calibration, and transparent explanations; they cannot reduce opportunity.
- **Explainability**: Rankings must expose model version, material inputs, component scores, uncertainty, reasons, and audit metadata.
- **Governance**: Algorithm and criteria changes require draft/active separation, evaluation, human approval, version history, rollback, and immutable evidence.
- **Privacy and minors**: No live pilot with sensitive student data until identity, authorization, retention, consent, export/deletion, and compliance controls are reviewed.
- **Brownfield compatibility**: Preserve useful working features and repository conventions while replacing fragile foundations incrementally.
- **Source control**: Verified increments are committed atomically and pushed promptly to the recovery branch; secrets and generated artifacts remain untracked.
- **Pilot first**: Launch readiness means a controlled 25–50-student pilot, not immediate unrestricted public availability.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Treat the uploaded PRD as the minimum recovery contract | The original implementation is unavailable, so the PRD is the authoritative record of lost scope | — Pending |
| Keep research and exploration active | Recovery should improve safety, architecture, usability, and evidence rather than merely recreate fragile code | — Pending |
| Consolidate matching behind one versioned contract | Fragmented weights and thresholds cannot be reproduced, audited, calibrated, or promoted safely | — Pending |
| Require human-reviewed algorithm activation | High-impact recommendation changes need evidence, approval, rollback, and auditability | — Pending |
| Use a controlled pilot as the launch milestone | Real programme and outcome data are required before broader claims or rollout | — Pending |
| Push verified checkpoints to `recovery/prd-rebuild` | Prevents another loss of local-only work while keeping unfinished work off `main` | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition**:
1. Move validated requirements to Validated with a phase reference.
2. Move invalidated requirements to Out of Scope with a reason.
3. Add newly discovered requirements without silently removing PRD commitments.
4. Record decisions and their outcomes.
5. Update the product description if implementation evidence changes it.

**After each milestone**:
1. Review all requirements and constraints.
2. Confirm the core value still drives prioritization.
3. Reassess pilot readiness, risks, and deferred scope.
4. Update context with verification, user feedback, and metrics.

---
*Last updated: 2026-07-21 after recovery-project initialization*
