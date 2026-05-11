# Vercel Permissions Handoff

Use this note to request the access needed to deploy ScholarScout with the Docker-free Vercel workaround, production environment variables, Blob storage, and GitHub-connected deployments.

## Access To Request

Ask the Vercel team owner to add the deployment owner as one of these:

| Vercel plan shape | Minimum role or permissions |
|---|---|
| Hobby or personal project | Project owner account access |
| Pro team | Owner or Member |
| Enterprise team role | Developer with Create Project, Full Production Deployment, and Environment Variable Manager permission groups |
| Enterprise project role | Contributor assigned as Project Administrator on the ScholarScout project |

ScholarScout needs permissions to:

1. Create or access the Vercel project.
2. Connect the GitHub repository `realtypulse73/Scholar-Scout`.
3. Configure the project from the repository root.
4. Set Production and Preview environment variables.
5. Create or connect Vercel Blob storage.
6. Read deployment logs.
7. Redeploy after secrets are added.
8. Promote or verify the production deployment.

## Vercel Project Settings

Use these settings when creating or fixing the Vercel project:

| Setting | Value |
|---|---|
| Framework Preset | Next.js |
| Root Directory | repository root |
| Install Command | `npm install --ignore-scripts` |
| Build Command | `npm run build:vercel` |
| Output Directory | `apps/web/.next` |
| Node Version | 20.x |

These values match [`../vercel.json`](../vercel.json) and the Docker-free workaround in [`vercel-docker-workaround.md`](vercel-docker-workaround.md).

## GitHub Integration Permission

The Vercel GitHub integration must be allowed to read the repository and create deployments for:

```text
realtypulse73/Scholar-Scout
```

If the GitHub app is restricted to selected repositories, the repository owner must explicitly select `Scholar-Scout`.

## Message To Send

```text
Hi, I need Vercel access to deploy ScholarScout from GitHub.

Please add me to the Vercel team/project with permission to create or administer the ScholarScout project, connect the GitHub repository realtypulse73/Scholar-Scout, manage Production and Preview environment variables, create/connect Vercel Blob storage, view deployment logs, and redeploy/promote production builds.

The project should use:
- Framework: Next.js
- Root Directory: repository root
- Install Command: npm install --ignore-scripts
- Build Command: npm run build:vercel
- Output Directory: apps/web/.next
- Node Version: 20.x

The Vercel GitHub integration also needs access to the Scholar-Scout repository.
```

## After Access Is Granted

1. Add provider values from `.env.production.local` to Vercel Environment Variables.
2. Create or connect Vercel Blob and copy the read-write token into `SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN`.
3. Redeploy the project.
4. Run `npm run check:production-env -- --env-file .env.production.local`.
5. Run `npm run smoke:production -- --env-file .env.production.local` against the deployed URL.
