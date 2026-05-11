# Vercel Deployment

ScholarScout is ready to deploy from the repository root as an npm workspace.

## Project Settings

- Framework Preset: Next.js
- Root Directory: repository root
- Install Command: `npm install --ignore-scripts`
- Build Command: `npm run build:vercel`
- Output Directory: leave default, or use `apps/web/.next` if Vercel asks
- Node Version: 20.x

## Why Root Directory Matters

The workspace lockfile and package metadata live at the repository root. Keeping Vercel pointed at the root lets `npm install` resolve the monorepo correctly, while `npm run build:vercel` builds only the web app.

If Docker is unavailable locally or in a contributor environment, use the explicit Docker-free flow in [`vercel-docker-workaround.md`](vercel-docker-workaround.md). The Vercel project should still deploy from the repository root.

If you need a Vercel owner or admin to grant access, use [`vercel-permissions-handoff.md`](vercel-permissions-handoff.md). It lists the required role, GitHub integration access, environment-variable permissions, and Blob storage permissions.

## Local Equivalent

When Node.js/npm are available locally, this is the same build path Vercel will use:

```bash
npm install --ignore-scripts
npm run build:vercel
```
