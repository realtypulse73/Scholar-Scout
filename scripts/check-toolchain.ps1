$ErrorActionPreference = 'Continue'

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$ToolRoot = Join-Path $RepoRoot '.tools'
$NodeDir = Get-ChildItem -Path $ToolRoot -Directory -Filter 'node-*-win-x64' -ErrorAction SilentlyContinue |
  Sort-Object Name -Descending |
  Select-Object -First 1
$GitCmd = Join-Path $ToolRoot 'mingit\cmd'
$GhExe = Get-ChildItem -Path (Join-Path $ToolRoot 'gh') -Recurse -Filter 'gh.exe' -ErrorAction SilentlyContinue |
  Select-Object -First 1

if ($NodeDir) {
  $env:PATH = "$($NodeDir.FullName);$env:PATH"
}

if (Test-Path $GitCmd) {
  $env:PATH = "$GitCmd;$env:PATH"
}

if ($GhExe) {
  $env:PATH = "$($GhExe.DirectoryName);$env:PATH"
}

Write-Host 'Node:'
node -v

Write-Host 'npm:'
& (Join-Path $NodeDir.FullName 'npm.cmd') -v

Write-Host 'Git:'
git --version

Write-Host 'GitHub CLI:'
gh --version

Write-Host 'GitHub CLI auth:'
gh auth status

Write-Host 'Prisma Client:'
& (Join-Path $NodeDir.FullName 'npm.cmd') run prisma:generate

Write-Host 'API build:'
& (Join-Path $NodeDir.FullName 'npm.cmd') run build:api

Write-Host 'Web build:'
& (Join-Path $NodeDir.FullName 'npm.cmd') run build:web

Write-Host 'Admin build:'
& (Join-Path $NodeDir.FullName 'npm.cmd') run build:admin

Write-Host 'Docker:'
docker --version
docker compose version
