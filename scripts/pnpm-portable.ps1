$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$nodeDir = Join-Path $repoRoot '.tools\node-v20.20.2-win-x64'
$nodeExe = Join-Path $nodeDir 'node.exe'
$corepackCmd = Join-Path $nodeDir 'corepack.cmd'
$pnpmCmd = Join-Path $nodeDir 'pnpm.cmd'

if (-not (Test-Path -LiteralPath $nodeExe)) {
  throw "Portable Node was not found at $nodeExe. Download and extract Node.js 20.x into .tools first."
}

if (-not (Test-Path -LiteralPath $corepackCmd)) {
  throw "Portable Corepack was not found at $corepackCmd. Reinstall the portable Node.js 20.x runtime."
}

$env:Path = "$nodeDir;$env:Path"
$env:COREPACK_HOME = Join-Path $repoRoot '.tools\corepack'
$pnpmStore = Join-Path $repoRoot '.pnpm-store'
$env:npm_config_store_dir = $pnpmStore

& $corepackCmd enable --install-directory $nodeDir
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

if (-not (Test-Path -LiteralPath $pnpmCmd)) {
  throw "Corepack did not create the pnpm shim at $pnpmCmd. Reinstall the portable Node.js 20.x runtime."
}

$pnpmArgs = @($args)

if ($pnpmArgs.Count -ge 2 -and $pnpmArgs[0] -eq '-PnpmArgs') {
  $pnpmArgs = $pnpmArgs[1..($pnpmArgs.Count - 1)]
}

& $pnpmCmd @pnpmArgs
exit $LASTEXITCODE
