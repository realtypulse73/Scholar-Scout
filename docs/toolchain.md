# Local Toolchain

This workspace uses project-local tooling under `.tools/` so the app can run even when system Node/npm/Git/GitHub CLI are unavailable.

## Activate Node/npm/Git/gh

From the repo root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\activate-toolchain.ps1
```

This prepends the local Node, Git, and GitHub CLI directories to `PATH` for the current PowerShell session, points GitHub CLI at the repo-local `.local/gh` config directory, and prints active tool versions.

To run one command with the local toolchain without changing your parent shell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\with-toolchain.ps1 git status
powershell -ExecutionPolicy Bypass -File .\scripts\with-toolchain.ps1 gh auth status
```

To reinstall or update the project-local Node/npm toolchain:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-node-toolchain.ps1
```

To reinstall or update the project-local Git/GitHub CLI toolchain:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-git-gh-toolchain.ps1
```

To authenticate GitHub CLI after activation:

```powershell
gh auth login --hostname github.com --git-protocol https --web
```

To check the available toolchain:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-toolchain.ps1
```

## Docker Desktop

Docker is not installed in this shell. Docker Desktop is a system-level Windows install that requires administrator privileges and acceptance of Docker's subscription terms.

From an elevated Administrator PowerShell session:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-docker-desktop.ps1
```

After Docker Desktop is installed and running:

```powershell
npm run db:up
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```
