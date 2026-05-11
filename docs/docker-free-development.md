# Docker-Free Development

ScholarScout can move forward without Docker for the current frontend scope. The app is a Node/npm workspace, so local development only needs Node.js 18+ and npm 10+.

## One-Time Setup

```bash
npm install
```

If Node/npm are unavailable on Windows, use the repo-local portable Node workaround:

```powershell
. .\scripts\use-portable-node.ps1
npm install --ignore-scripts
```

If the leading dot command is confusing or your terminal rejects it, run npm through the portable wrapper instead:

```powershell
.\scripts\npm-portable.ps1 install --ignore-scripts
.\scripts\npm-portable.ps1 run build:vercel
```

For a one-command Vercel smoke test, run:

```powershell
.\scripts\npm-portable.ps1 run vercel:docker-free
```

From Command Prompt, use:

```bat
scripts\npm-portable.cmd install --ignore-scripts
scripts\npm-portable.cmd run build:vercel
scripts\npm-portable.cmd run vercel:docker-free
```

## Daily Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
npm run build:vercel
```

The root scripts forward to the workspace packages. To target only the web app, use:

```bash
npm run dev --workspace @scholar-scout/web
npm run test --workspace @scholar-scout/web
```

## Current Local Limitation

In the current Codex desktop sandbox, the bundled `node.exe` is denied by Windows execution policy and `npm` is not on PATH. The portable Node workaround keeps the runtime inside `.tools` and prepends it to PATH for the current shell.

## Practical Workaround

- Keep frontend work in `apps/web`.
- Use static data, local state, and unit/component tests while backend services are not yet needed.
- Defer database, queue, and service orchestration decisions until the project reaches matching engine or CMS work.
- If a future service expects Docker, add a native Windows setup script next to it before making Docker the only path.
