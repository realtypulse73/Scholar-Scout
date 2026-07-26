# Vercel Deployment

ScholarScout deploys through the Git integration with `apps/web` configured as the Vercel project Root Directory. The committed [`vercel.json`](../vercel.json) defines the install and build commands; Vercel dashboard settings complete the protected production deployment contract.

## Repository Contract

The root `packageManager` selects pnpm 10.34.5. Vercel must use Node 20.x and Corepack so that its build resolves the committed workspace graph exactly as contributors and CI do. Although Vercel starts build commands in `apps/web`, the committed commands first move two levels up to the workspace root, where the sole `pnpm-lock.yaml` and filtered build script live.

| Setting | Required value | Source |
|---|---|---|
| Framework Preset | Next.js | committed configuration |
| Root Directory | `apps/web` | Vercel Project Settings -> Build and Deployment -> Root Directory |
| Source-file access outside Root Directory | Enabled | Vercel Build Step settings |
| Install Command | `cd ../.. && pnpm install --frozen-lockfile --ignore-scripts` | [`vercel.json`](../vercel.json) |
| Build Command | `cd ../.. && pnpm build:vercel` | [`vercel.json`](../vercel.json) |
| Output Directory | `.next` (relative to `apps/web`) | [`vercel.json`](../vercel.json) |
| Node Version | 20.x | project runtime contract |

In **Vercel Project Settings → Environment Variables**, add `ENABLE_EXPERIMENTAL_COREPACK=1` for the **Production** environment. This is a dashboard setting, not a committed secret or replacement for `vercel.json`.

In **Vercel Project Settings -> Build and Deployment -> Root Directory**, keep Root Directory set to `apps/web`. In the Build Step settings, enable source-file access outside that directory so the committed commands can read the root workspace manifest and lockfile. Do not replace the committed commands with dashboard command overrides.

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

### Post-deploy smoke target

Keep Vercel Standard Protection enabled for dynamic deployment URLs. Those protected URLs can redirect to Vercel SSO, so the post-deploy smoke workflow does not request the deployment URL supplied by the dispatch event. Instead, configure the GitHub Actions repository secret `SCHOLARSCOUT_SMOKE_BASE_URL` to the stable public Production domain:

```text
https://scholar-scout-web.vercel.app/
```

Set or update that secret in **Repository Settings -> Secrets and variables -> Actions -> Secrets** before any intentional production-domain change. The repository-dispatch URL remains in the workflow only as deployment evidence: it groups concurrent smoke runs and appears in a failed-smoke incident with the deployed commit SHA. It is not the smoke request target. Do not add Vercel protection-bypass tokens, credentials, cookies, private deployment URLs, or production data to this configuration or the runbook.

## Local Equivalent

After `corepack enable`, the local equivalent of Vercel's committed app-root build path is:

```bash
cd apps/web
cd ../..
pnpm install --frozen-lockfile --ignore-scripts
pnpm build:vercel
```

The initial directory changes reproduce Vercel starting in `apps/web`; the install and filtered build then run at the workspace root. Vercel publishes `.next` relative to the configured app root, which is `apps/web/.next` in the repository.

If Docker is unavailable locally, use the supported portable Node/Corepack pnpm path in [`vercel-docker-workaround.md`](vercel-docker-workaround.md). For Vercel project access, Git integration, and external-setting evidence, use [`vercel-permissions-handoff.md`](vercel-permissions-handoff.md).
