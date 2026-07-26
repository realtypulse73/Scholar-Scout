# Vercel Permissions Handoff

Use this note to request the access needed to deploy ScholarScout through its protected GitHub-to-Vercel production flow. The repository commits the build commands; Vercel and GitHub dashboard controls remain maintainer-owned configuration.

## Access To Request

Ask the Vercel team owner to add the deployment owner as one of these:

| Vercel plan shape | Minimum role or permissions |
|---|---|
| Hobby or personal project | Project owner account access |
| Pro team | Owner or Member |
| Enterprise team role | Developer with Create Project, Full Production Deployment, and Environment Variable Manager permission groups |
| Enterprise project role | Contributor assigned as Project Administrator on the ScholarScout project |

ScholarScout needs permission to:

1. Create or access the Vercel project.
2. Connect the GitHub repository `realtypulse73/Scholar-Scout`.
3. Configure the project from the repository root.
4. Set Production and Preview environment variables.
5. Create or connect Vercel Blob storage.
6. Read deployment logs.
7. Verify deployments after secrets are added.

## Vercel Project Settings

Use these settings when creating or correcting the Vercel project:

| Setting | Value |
|---|---|
| Framework Preset | Next.js |
| Root Directory | repository root |
| Install Command | `pnpm install --frozen-lockfile --ignore-scripts` |
| Build Command | `pnpm build:vercel` |
| Output Directory | `apps/web/.next` |
| Node Version | 20.x |
| Production environment variable | `ENABLE_EXPERIMENTAL_COREPACK=1` |
| Production Branch | `main` |

The command values are committed in [`../vercel.json`](../vercel.json); the Corepack environment variable and production branch are Vercel dashboard settings. Keep Git integration connected and do not configure a manual alternate production deployment path.

## GitHub Main Protection

In GitHub **Settings → Rules → Rulesets** (or branch protection), create or update the protection that targets `main`. Before Vercel can deploy production from `main`, require all of the following:

1. Pull requests before merging.
2. Branches to be up to date before merging.
3. Direct pushes restricted, with any bypass list limited to explicitly accountable repository administrators.
4. These required status checks, with exact spelling:
   - `ScholarScout / Web typecheck`
   - `ScholarScout / Web lint`
   - `ScholarScout / Web Jest`
   - `ScholarScout / Web build`
   - `ScholarScout / HTTP data-service tests`
   - `ScholarScout / Production-tooling tests`

GitHub can select a status check only after it has appeared in a successful run. Open or update a draft pull request first, confirm all six `ScholarScout / …` checks succeed, then select them in the ruleset. Retain a screenshot or export proving the target branch, pull-request rule, up-to-date requirement, direct-push restriction, and all six selected checks.

## GitHub Integration Permission

The Vercel GitHub integration must be allowed to read the repository and create deployments for:

```text
realtypulse73/Scholar-Scout
```

If the GitHub app is restricted to selected repositories, the repository owner must explicitly select `Scholar-Scout`.

## Message To Send

```text
Hi, I need Vercel access to deploy ScholarScout from GitHub.

Please add me to the Vercel team/project with permission to create or administer the ScholarScout project, connect the GitHub repository realtypulse73/Scholar-Scout, manage Production and Preview environment variables, create/connect Vercel Blob storage, view deployment logs, and verify production builds.

The project should use:
- Framework: Next.js
- Root Directory: repository root
- Install Command: pnpm install --frozen-lockfile --ignore-scripts
- Build Command: pnpm build:vercel
- Output Directory: apps/web/.next
- Node Version: 20.x
- Production environment variable: ENABLE_EXPERIMENTAL_COREPACK=1
- Production Branch: main

The Vercel GitHub integration also needs access to the Scholar-Scout repository. Please protect main with pull requests, up-to-date branches, restricted direct pushes, and the six documented ScholarScout checks before production deploys are enabled.
```

## After Access Is Granted

1. Add provider values from `.env.production.local` to Vercel Environment Variables.
2. Add `ENABLE_EXPERIMENTAL_COREPACK=1` to the **Production** environment.
3. Create or connect Vercel Blob and copy the read-write token into `SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN`.
4. Confirm the GitHub ruleset has the six successful required checks before allowing a protected merge to `main`.
5. After the protected merge, retain the Vercel production build log showing Corepack, the frozen install, and `pnpm build:vercel`.
6. Run `pnpm check:production-env -- --env-file .env.production.local`.
7. Run `pnpm smoke:production -- --env-file .env.production.local` against the deployed URL.
