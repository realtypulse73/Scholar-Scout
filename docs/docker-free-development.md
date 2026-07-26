# Docker-Free Development

ScholarScout can move forward without Docker for the current frontend scope. The app is a Node 20.x/pnpm workspace. The root `packageManager` selects pnpm 10.34.5 through Corepack.

## One-Time Setup

```bash
corepack enable
pnpm install --frozen-lockfile --ignore-scripts
```

If Node/pnpm are unavailable on Windows, use the repo-local portable Node/Corepack workaround:

```powershell
. .\scripts\use-portable-node.ps1
pnpm install --frozen-lockfile --ignore-scripts
```

If the leading dot command is confusing or your terminal rejects it, run pnpm through the portable wrapper instead:

```powershell
.\scripts\pnpm-portable.ps1 install --frozen-lockfile --ignore-scripts
.\scripts\pnpm-portable.ps1 build:vercel
```

For a one-command Vercel smoke test, run:

```powershell
.\scripts\pnpm-portable.ps1 vercel:docker-free
```

From Command Prompt, use:

```bat
scripts\pnpm-portable.cmd install --frozen-lockfile --ignore-scripts
scripts\pnpm-portable.cmd build:vercel
scripts\pnpm-portable.cmd vercel:docker-free
```

## Daily Commands

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm build:vercel
```

The root scripts forward to the workspace packages. To target only the web app, use:

```bash
pnpm --filter @scholar-scout/web dev
pnpm --filter @scholar-scout/web test
```

## Current Local Limitation

In the current Codex desktop sandbox, the bundled `node.exe` may be denied by Windows execution policy and pnpm is not on PATH. The portable Node/Corepack workaround keeps the runtime inside `.tools` and prepends it to PATH for the current shell.

## Practical Workaround

- Keep frontend work in `apps/web`.
- Use static data, local state, and unit/component tests while backend services are not yet needed.
- Defer database, queue, and service orchestration decisions until the project reaches matching engine or CMS work.
- If a future service expects Docker, add a native Windows setup script next to it before making Docker the only path.
