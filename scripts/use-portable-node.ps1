$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$nodeDir = Join-Path $repoRoot '.tools\node-v20.20.2-win-x64'
$nodeExe = Join-Path $nodeDir 'node.exe'
$npmCmd = Join-Path $nodeDir 'npm.cmd'

if (-not (Test-Path -LiteralPath $nodeExe)) {
  throw "Portable Node was not found at $nodeExe. Download and extract Node.js 20.x into .tools first."
}

if (-not (Test-Path -LiteralPath $npmCmd)) {
  throw "Portable npm was not found at $npmCmd."
}

$env:Path = "$nodeDir;$env:Path"
$env:NPM_CONFIG_CACHE = Join-Path $repoRoot '.tools\npm-cache'

Write-Output "Portable Node activated:"
node --version
npm --version
