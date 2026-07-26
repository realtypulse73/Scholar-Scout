# Vercel Deployment

ScholarScout deploys from the repository root through the Git integration. The committed [`vercel.json`](../vercel.json) defines the install and build commands; Vercel dashboard settings complete the protected production deployment contract.

## Repository Contract

The root `packageManager` selects pnpm 10.34.5. Vercel must use Node 20.x and Corepack so that its build resolves the committed workspace graph exactly as contributors and CI do.

| Setting | Required value | Source |
|---|---|---|
| Framework Preset | Next.js | committed configuration |
| Root Directory | repository root | committed configuration |
| Install Command | `pnpm install --frozen-lockfile --ignore-scripts` | [`vercel.json`](../vercel.json) |
| Build Command | `pnpm build:vercel` | [`vercel.json`](../vercel.json) |
| Output Directory | `apps/web/.next` | [`vercel.json`](../vercel.json) |
| Node Version | 20.x | project runtime contract |

In **Vercel Project Settings → Environment Variables**, add `ENABLE_EXPERIMENTAL_COREPACK=1` for the **Production** environment. This is a dashboard setting, not a committed secret or replacement for `vercel.json`.

## Protected Production Flow

In **Vercel Project Settings → Git**, keep the Git integration connected and set `main` as the Production Branch. Production deployments come only from successful protected merges to `main`; do not use a manual alternate production deployment path.

Before enabling production traffic, configure the matching GitHub ruleset or branch protection as described in [`vercel-permissions-handoff.md`](vercel-permissions-handoff.md). It must require pull requests, require branches to be up to date, restrict direct pushes, and require these six checks:

- `ScholarScout / Web typecheck`
- `ScholarScout / Web lint`
- `ScholarScout / Web Jest`
- `ScholarScout / Web build`
- `ScholarScout / HTTP data-service tests`
- `ScholarScout / Production-tooling tests`

Select those checks only after successful runs have appeared in GitHub. Retain a screenshot or export of the resulting ruleset/branch-protection configuration with the deployment evidence.

## Local Equivalent

After `corepack enable`, the local equivalent of Vercel's committed build path is:

```bash
pnpm install --frozen-lockfile --ignore-scripts
pnpm build:vercel
```

If Docker is unavailable locally, use the supported portable Node/Corepack pnpm path in [`vercel-docker-workaround.md`](vercel-docker-workaround.md). For Vercel project access, Git integration, and external-setting evidence, use [`vercel-permissions-handoff.md`](vercel-permissions-handoff.md).
