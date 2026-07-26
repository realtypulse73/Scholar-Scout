# Vercel Docker Workaround

ScholarScout does not need Docker for the current frontend deployment path. Vercel builds the Next.js workspace directly from the repository root, which keeps the project moving on machines where Docker Desktop is unavailable or unreliable.

## Vercel Project Settings

The root `packageManager` selects pnpm 10.34.5 through Corepack. Configure the Vercel project to match the committed [`../vercel.json`](../vercel.json):

- Framework Preset: Next.js
- Root Directory: repository root
- Install Command: `pnpm install --frozen-lockfile --ignore-scripts`
- Build Command: `pnpm build:vercel`
- Output Directory: `apps/web/.next`
- Node Version: 20.x
- Production environment variable: `ENABLE_EXPERIMENTAL_COREPACK=1`
- Production Branch: protected `main`

The frozen install avoids lifecycle scripts during cloud installation. The app currently uses pure frontend dependencies and does not rely on package postinstall scripts, so the production build remains the source of truth.

Use the Git integration to deploy only after a protected merge to `main`; do not configure a manual alternate production deployment path. The required GitHub pull-request, up-to-date-branch, direct-push, and six-check rules are documented in [`vercel-permissions-handoff.md`](vercel-permissions-handoff.md).

If the Vercel project or GitHub integration has not been created yet, use [`vercel-permissions-handoff.md`](vercel-permissions-handoff.md) to request the required project, environment-variable, deployment, Blob storage, and repository-integration permissions.

## Local Smoke Test

After `corepack enable`, use this frozen local check before deploying when Docker is not available:

```bash
pnpm install --frozen-lockfile --ignore-scripts
pnpm vercel:docker-free
```

On Windows without global Node/pnpm, use the portable Corepack pnpm wrapper:

```powershell
.\scripts\pnpm-portable.ps1 vercel:docker-free
```

From Command Prompt:

```bat
scripts\pnpm-portable.cmd vercel:docker-free
```

## When to Revisit

Revisit this workaround before adding backend services, Prisma migrations, native image tooling, or any package that depends on a postinstall script. At that point, either remove `--ignore-scripts` or add a dedicated Vercel build step that runs the required generation safely.
