# Vercel Docker Workaround

ScholarScout does not need Docker for the current frontend deployment path. Vercel can build the Next.js workspace directly from the repository root, which keeps the project moving on machines where Docker Desktop is unavailable or unreliable.

## Vercel Project Settings

- Framework Preset: Next.js
- Root Directory: repository root
- Install Command: `npm install --ignore-scripts`
- Build Command: `npm run build:vercel`
- Output Directory: `apps/web/.next`
- Node Version: 20.x

The `--ignore-scripts` install command avoids local native install hooks during the cloud install step. The app currently uses pure frontend dependencies and does not rely on package postinstall scripts, so the production build remains the source of truth.

If the Vercel project or GitHub integration has not been created yet, use [`vercel-permissions-handoff.md`](vercel-permissions-handoff.md) to request the required project, environment-variable, deployment, Blob storage, and repository-integration permissions.

## Local Smoke Test

Use this command before deploying when Docker is not available:

```bash
npm run vercel:docker-free
```

On Windows without global Node/npm, use the portable wrapper:

```powershell
.\scripts\npm-portable.ps1 run vercel:docker-free
```

From Command Prompt:

```bat
scripts\npm-portable.cmd run vercel:docker-free
```

## When to Revisit

Revisit this workaround before adding backend services, Prisma migrations, native image tooling, or any package that depends on a postinstall script. At that point, either remove `--ignore-scripts` or add a dedicated Vercel build step that runs the required generation safely.
