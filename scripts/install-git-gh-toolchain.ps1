$ErrorActionPreference = 'Stop'

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$ToolRoot = Join-Path $RepoRoot '.tools'
New-Item -ItemType Directory -Force -Path $ToolRoot | Out-Null

$GitRelease = Invoke-RestMethod 'https://api.github.com/repos/git-for-windows/git/releases/latest'
$GitAsset = $GitRelease.assets |
  Where-Object { $_.name -match '^MinGit-.*-64-bit\.zip$' } |
  Select-Object -First 1

if (-not $GitAsset) {
  throw 'Could not find latest MinGit 64-bit zip asset.'
}

$GitZip = Join-Path $ToolRoot $GitAsset.name
$GitDir = Join-Path $ToolRoot 'mingit'

Invoke-WebRequest -Uri $GitAsset.browser_download_url -OutFile $GitZip

if (Test-Path $GitDir) {
  Remove-Item -LiteralPath $GitDir -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $GitDir | Out-Null
Expand-Archive -LiteralPath $GitZip -DestinationPath $GitDir -Force

$GhRelease = Invoke-RestMethod 'https://api.github.com/repos/cli/cli/releases/latest'
$GhAsset = $GhRelease.assets |
  Where-Object { $_.name -match '^gh_.*_windows_amd64\.zip$' } |
  Select-Object -First 1

if (-not $GhAsset) {
  throw 'Could not find latest GitHub CLI Windows amd64 zip asset.'
}

$GhZip = Join-Path $ToolRoot $GhAsset.name
$GhRoot = Join-Path $ToolRoot 'gh'

Invoke-WebRequest -Uri $GhAsset.browser_download_url -OutFile $GhZip

if (Test-Path $GhRoot) {
  Remove-Item -LiteralPath $GhRoot -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $GhRoot | Out-Null
Expand-Archive -LiteralPath $GhZip -DestinationPath $GhRoot -Force

$GitCmd = Join-Path $GitDir 'cmd'
$GhExe = Get-ChildItem -Path $GhRoot -Recurse -Filter 'gh.exe' |
  Select-Object -First 1

$env:PATH = "$GitCmd;$($GhExe.DirectoryName);$env:PATH"

git --version
gh --version

