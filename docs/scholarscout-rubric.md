# ScholarScout Project Rubric

Use this as the one-page shortcut for judging whether new ScholarScout work fits the project.

## Product Promise

ScholarScout is a rejection-free post-secondary discovery platform. Every feature should help students compare realistic programmes by fit, cost, location, support needs, and life circumstances before they spend time or money applying.

## Current Baseline

| Area | Status | Standard |
|---|---|---|
| Monorepo scaffold | Complete | Root npm workspace owns installs, scripts, lockfile, and Vercel build path |
| Web app | Complete baseline | Next.js App Router, TypeScript, Tailwind, static deployable routes |
| Design tokens | Complete | Use brand, ink, status colors, radius, shadow, and touch spacing from Tailwind config |
| UI primitives | Complete | Prefer shared Button, Input, Card, and Badge before adding one-off controls |
| Landing page | Complete | First screen explains ScholarScout and routes students into onboarding |
| Auth.js baseline | Service-backed baseline | NextAuth credentials provider, optional Google/GitHub OAuth providers, JWT session roles, profile route, staff gate, and protected account/admin APIs |
| Onboarding wizard | Account-backed baseline | Six preference signals with validation, progress, summary, local fallback, and authenticated persistence |
| Programme listing | Complete | Filterable, paginated results using onboarding-driven URL filters, server-ranked account profile ordering, and shared pagination helpers |
| Programme details | Complete | Detail pages show tuition, access, support services, location, next steps, related options, and fit explanations |
| Shortlist | Account-backed decision-support baseline | Students can save programmes, compare practical decision signals, track next actions, planning status, and notes locally or behind an authenticated account |
| Admin programme data | Governed baseline | Staff manage validated programme records with review states, reviewer handoff, source metadata, source confidence, structured source checks, audit history, revision checks, stale-edit recovery, selected-field conflict merging, guidance list diffs, individual guidance-item merge controls, inline guidance conflict editing, data backing visibility, protected data exports, restore dry-run validation, confirmed restore execution with backup-before-restore, backup history browsing, backup restore impact planning, guarded saved-backup restore execution, and backup retention health checks |
| Data persistence | Service-adapter baseline | Account and programme APIs use a replaceable data-store boundary with JSON, HTTP service, and Vercel Blob adapters, operations docs, and a local contract fixture with health and backup behavior |
| Vercel Docker workaround | Complete | Deploy from repo root with `npm install --ignore-scripts` and `npm run build:vercel` |
| Production readiness | Checklist baseline | OAuth, staff allowlist, data-store adapter, provider-specific secret setup, service-token health checks, restore operations, deployment checks, HTTPS env validation, env-file based local rehearsal workaround, tested smoke tooling with network failure reports, transient retries, latency guardrails, smoke provider checks, prelaunch rehearsal artifacts, scheduled monitoring artifacts and summaries, release and incident runbooks, and credential rotation have operator guidance |

## Build Rubric

1. Preserve rejection-free framing. Avoid language that implies students are being screened out.
2. Make every next step practical. Prefer clear CTAs, cost signals, support signals, and comparison-ready data.
3. Keep mobile first. Controls must remain touch-sized and readable on narrow screens.
4. Use existing primitives and tokens. Add abstractions only when repeated product surfaces need them.
5. Put authenticated student data behind account APIs. Keep localStorage only as fallback, cache, or migration bridge.
6. Keep programme data governed. New admin records should flow through protected APIs or a future CMS/service, not only browser drafts.
7. Test the behaviour, not the styling. Add helper tests for matching, validation, filtering, pagination, auth-adjacent state, and critical flows.
8. Keep Vercel deployable without Docker. New dependencies must not silently require postinstall scripts without updating the workaround.

## Definition Of Done

- `npm run lint` passes.
- `npm run typecheck` passes.
- `npm run test` passes.
- `npm run check:production-env` passes with the intended production env loaded.
- `npm run test:production-tooling` passes.
- `npm run build:vercel` passes.
- Backlog notes mention the feature, changed files, and follow-up risks.

## Current Auth And Data Notes

- Auth.js is wired through NextAuth v4 with a credentials provider. OAuth providers still need provider credentials and environment configuration.
- Account data is persisted through a server-side JSON data store by default. Production should replace `SCHOLARSCOUT_DATA_FILE` with a database or governed CMS adapter.
- Onboarding, shortlist, and admin programme records now prefer account APIs when signed in and keep local browser state as a fallback.

## Next Logical Work

1. Provision production secrets for OAuth and Vercel Blob or a compatible hosted HTTP service.
2. Run `npm run rehearse:prelaunch`, or the manual prelaunch rehearsal workflow with the production env loaded before deploy.
3. Follow the production release runbook and run smoke checks against the live deployment after secrets are provisioned, including expected adapter and provider checks.
4. Expand student decision support from account-backed shortlist planning into affordability verification and deadline tracking.
5. Add record-level database or CMS writes when the production data platform is chosen.
