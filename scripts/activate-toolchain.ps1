$ToolRoot = Join-Path $PSScriptRoot '..\.tools'
$GhConfigDir = Join-Path $PSScriptRoot '..\.local\gh'
$NodeDir = Get-ChildItem -Path $ToolRoot -Directory -Filter 'node-*-win-x64' |
  Sort-Object Name -Descending |
  Select-Object -First 1
$GitCmd = Join-Path $ToolRoot 'mingit\cmd'
$GhExe = Get-ChildItem -Path (Join-Path $ToolRoot 'gh') -Recurse -Filter 'gh.exe' -ErrorAction SilentlyContinue |
  Select-Object -First 1

if (-not $NodeDir) {
  throw 'Node.js is not installed in .tools. Run the local toolchain setup first.'
}

$PathParts = @($NodeDir.FullName)

if (Test-Path $GitCmd) {
  $PathParts += $GitCmd
}

if ($GhExe) {
  $PathParts += $GhExe.DirectoryName
}

$env:PATH = "$($PathParts -join ';');$env:PATH"

if (-not (Test-Path $GhConfigDir)) {
  New-Item -ItemType Directory -Path $GhConfigDir -Force | Out-Null
}

$env:GH_CONFIG_DIR = (Resolve-Path $GhConfigDir).Path

node -v
& (Join-Path $NodeDir.FullName 'npm.cmd') -v

if (Get-Command git -ErrorAction SilentlyContinue) {
  git --version
}

if (Get-Command gh -ErrorAction SilentlyContinue) {
  gh --version
  Write-Host "GH_CONFIG_DIR=$env:GH_CONFIG_DIR"
}
