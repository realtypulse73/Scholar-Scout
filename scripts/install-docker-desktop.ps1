$ErrorActionPreference = 'Stop'

$IsAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
  [Security.Principal.WindowsBuiltInRole]::Administrator
)

if (-not $IsAdmin) {
  throw 'Docker Desktop installation requires an elevated Administrator PowerShell session.'
}

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$ToolRoot = Join-Path $RepoRoot '.tools'
New-Item -ItemType Directory -Force -Path $ToolRoot | Out-Null

$Installer = Join-Path $ToolRoot 'Docker Desktop Installer.exe'

if (-not (Test-Path $Installer)) {
  Invoke-WebRequest `
    -Uri 'https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe' `
    -OutFile $Installer
}

Start-Process `
  -FilePath $Installer `
  -Wait `
  -ArgumentList 'install', '--quiet', '--accept-license', '--backend=wsl-2'

$Docker = 'C:\Program Files\Docker\Docker\resources\bin\docker.exe'

if (-not (Test-Path $Docker)) {
  throw 'Docker install completed, but docker.exe was not found. Restart Windows and rerun this script if Docker requested a reboot.'
}

& $Docker --version

