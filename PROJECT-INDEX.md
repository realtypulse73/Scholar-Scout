# Scholar Scout Project Document Index

**Purpose:** The durable map of documents that govern Scholar Scout work. Read the applicable entries before planning, editing, reviewing, or releasing.

**Authority rule:** When documents disagree, follow `AGENTS.md` for working rules, `.planning/PROJECT.md` and `.planning/REQUIREMENTS.md` for product intent and requirements, approved ADRs for recorded technical decisions, and current source/configuration for runtime behavior. Historical reports and phase artifacts are evidence, not replacement requirements.

## Start here

| Document | Role | Read when |
|---|---|---|
| [AGENTS.md](AGENTS.md) | Repository instructions, architecture summary, conventions, and required GSD workflow. | Every task. |
| [.planning/PROJECT.md](.planning/PROJECT.md) | Product purpose, constraints, and core value. | Any product, architecture, or scope decision. |
| [.planning/REQUIREMENTS.md](.planning/REQUIREMENTS.md) | Active milestone requirements and traceability. | Planning or verifying roadmap work. |
| [.planning/ROADMAP.md](.planning/ROADMAP.md) | Phase order, goals, dependencies, and success criteria. | Planning, executing, or assessing a phase. |
| [.planning/STATE.md](.planning/STATE.md) | Current progress, decisions, blockers, and quick-task history. | Every GSD task and before resuming work. |
| [README.md](README.md) | Repository overview and developer entry point. | Onboarding or general setup. |

## Architecture and engineering reference

| Document | Role | Read when |
|---|---|---|
| [.planning/codebase/ARCHITECTURE.md](.planning/codebase/ARCHITECTURE.md) | Application layers, data flow, boundaries, and anti-patterns. | Changing system behavior or cross-layer integrations. |
| [.planning/codebase/STACK.md](.planning/codebase/STACK.md) | Supported runtime, dependencies, configuration, and platform requirements. | Installing, upgrading, deploying, or adding dependencies. |
| [.planning/codebase/CONVENTIONS.md](.planning/codebase/CONVENTIONS.md) | Naming, style, imports, errors, tests, and module design rules. | Any code change. |
| [.planning/codebase/STRUCTURE.md](.planning/codebase/STRUCTURE.md) | Repository and feature-area map. | Locating implementation ownership. |
| [.planning/codebase/TESTING.md](.planning/codebase/TESTING.md) | Test suites, commands, and coverage boundaries. | Adding or running tests. |
| [.planning/codebase/INTEGRATIONS.md](.planning/codebase/INTEGRATIONS.md) | External services and integration contracts. | Changing OAuth, storage, Vercel, OpenAI, or GitHub integrations. |
| [.planning/codebase/CONCERNS.md](.planning/codebase/CONCERNS.md) | Known technical risks and debt. | Designing a change that could affect security, persistence, or operations. |
| [docs/adr/0001-node-runtime-upgrade.md](docs/adr/0001-node-runtime-upgrade.md) | Approved Node.js runtime upgrade decision. | Changing Node, CI, deployment, or package-manager policy. |

## Product and recommendation governance

| Document | Role | Read when |
|---|---|---|
| [docs/product-recommendation-governance.md](docs/product-recommendation-governance.md) | Allowed and prohibited recommendation signals, consent boundaries, explanations, and validation gates. | Changing onboarding, ranking, programme data, support referrals, analytics, or AI guidance. |
| [docs/scholarscout-rubric.md](docs/scholarscout-rubric.md) | Product-quality rubric. | Reviewing user experience or product completeness. |
| [.planning/.research/Student Potential Research Framework.md](.planning/.research/Student%20Potential%20Research%20Framework.md) | Research synthesis on contextualized potential measurement and ethical limits. | Considering potential, readiness, biodata, or assessment features. |
| [.planning/.research/Student Opportunity Support Matching.md](.planning/.research/Student%20Opportunity%20Support%20Matching.md) | Research synthesis on opportunity-and-support matching. | Designing referrals, support bundles, or recommendation evaluation. |
| [.planning/.research/Student Opportunity Platform Research Agenda.md](.planning/.research/Student%20Opportunity%20Platform%20Research%20Agenda.md) | Research agenda, evidence priorities, and risky assumptions. | Sequencing product research or validating recommendation claims. |

## Operations, security, and deployment

| Document | Role | Read when |
|---|---|---|
| [docs/docker-free-development.md](docs/docker-free-development.md) | Supported local development path. | Setting up or troubleshooting local development. |
| [docs/automated-pipeline.md](docs/automated-pipeline.md) | CI and automated operational pipeline overview. | Changing CI, release checks, or automation. |
| [docs/production-readiness-checklist.md](docs/production-readiness-checklist.md) | Preconditions for production readiness. | Preparing a release. |
| [docs/production-release-runbook.md](docs/production-release-runbook.md) | Release procedure and evidence expectations. | Releasing or rehearsing a release. |
| [docs/prelaunch-evidence-template.md](docs/prelaunch-evidence-template.md) | Template for recording release evidence. | Completing release evidence. |
| [docs/production-incident-response.md](docs/production-incident-response.md) | Incident triage and recovery process. | Handling a production incident or smoke failure. |
| [docs/production-secret-provider-notes.md](docs/production-secret-provider-notes.md) | Production secret-management expectations. | Configuring secrets or reviewing exposure risk. |
| [docs/vercel-deployment.md](docs/vercel-deployment.md) | Vercel build and deployment configuration. | Deploying or diagnosing Vercel builds. |
| [docs/vercel-permissions-handoff.md](docs/vercel-permissions-handoff.md) | Maintainer-owned Vercel access actions. | A deployment is blocked by permissions. |
| [docs/vercel-docker-workaround.md](docs/vercel-docker-workaround.md) | Historical Vercel/Docker workaround. | Docker-related deployment issues only. |
| [docs/http-data-adapter-runbook.md](docs/http-data-adapter-runbook.md) | HTTP persistence adapter contract and operations. | Using or operating the HTTP data adapter. |
| [docs/vercel-blob-data-adapter.md](docs/vercel-blob-data-adapter.md) | Vercel Blob persistence adapter configuration. | Using or operating Blob-backed persistence. |

## Identity, integrations, and handoffs

| Document | Role | Read when |
|---|---|---|
| [docs/github-oauth-first-handoff.md](docs/github-oauth-first-handoff.md) | GitHub OAuth setup handoff. | Configuring GitHub sign-in. |
| [docs/google-oauth-permissions-handoff.md](docs/google-oauth-permissions-handoff.md) | Google OAuth setup and permission handoff. | Configuring Google sign-in. |
| [docs/chatgpt-codex-github-sync.md](docs/chatgpt-codex-github-sync.md) | ChatGPT, Codex, and GitHub coordination plan. | Changing the automation/coordination workflow. |
| [docs/codex-backlog.md](docs/codex-backlog.md) | Deferred Codex work items. | Selecting follow-up work outside the active roadmap. |
| [services/README.md](services/README.md) | Service workspace overview. | Working in a standalone service. |
| [services/http-data-service/README.md](services/http-data-service/README.md) | HTTP data service fixture usage. | Developing or running the HTTP data service. |
| [services/codex-webhook-runner/README.md](services/codex-webhook-runner/README.md) | GitHub webhook runner usage. | Developing or operating the webhook runner. |
| [packages/README.md](packages/README.md) | Shared-package workspace notes. | Adding or changing shared packages. |

## Configuration and environment references

| Document | Role | Read when |
|---|---|---|
| [package.json](package.json) and [pnpm-workspace.yaml](pnpm-workspace.yaml) | Workspace scripts, package-manager pin, and workspace topology. | Running commands or changing dependencies. |
| [vercel.json](vercel.json) | Vercel build configuration. | Changing deployment behavior. |
| [.env.prelaunch.local.example](.env.prelaunch.local.example) | Non-secret prelaunch environment-variable template. | Preparing a local prelaunch check. |
| [.env.production.example](.env.production.example) | Non-secret production environment-variable template. | Preparing production configuration. |
| [.planning/config.json](.planning/config.json) | GSD workflow settings. | Changing GSD execution behavior. |

## Planning artifacts and historical evidence

| Location | Role | Read when |
|---|---|---|
| [.planning/phases/](.planning/phases/) | Phase context, research, plans, validation, summaries, and verification evidence. | Resuming or auditing a specific phase. |
| [.planning/quick/](.planning/quick/) | Small-task plans and summaries. | Resuming or auditing a quick task. |
| [reports/environment-provisioning.md](reports/environment-provisioning.md) and [reports/production-provider-setup.md](reports/production-provider-setup.md) | Environment and provider setup evidence. | Recreating infrastructure setup or resolving an operational handoff. |
| [reports/prelaunch-rehearsal/](reports/prelaunch-rehearsal/) | Prelaunch rehearsal results. | Reviewing release readiness evidence. |
| [reports/product-ops/](reports/product-ops/) | Dated product-operations logs and snapshots. | Investigating history; read `latest.md` first. |

## Maintenance

- Add or update an entry when a document becomes a source of truth, changes its authority, or is required for a recurring workflow.
- Keep entries concise: one role and one “read when” trigger.
- Do not index generated build outputs, package lockfiles beyond the configuration entry above, or daily reports individually.
- When a document is superseded, retain the old entry only as historical evidence and point to its replacement.
