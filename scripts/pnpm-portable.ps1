$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$nodeDir = Join-Path $repoRoot '.tools\node-v20.20.2-win-x64'
$nodeExe = Join-Path $nodeDir 'node.exe'
$corepackCmd = Join-Path $nodeDir 'corepack.cmd'

if (-not (Test-Path -LiteralPath $nodeExe)) {
  throw "Portable Node was not found at $nodeExe. Download and extract Node.js 20.x into .tools first."
}

if (-not (Test-Path -LiteralPath $corepackCmd)) {
  throw "Portable Corepack was not found at $corepackCmd. Reinstall the portable Node.js 20.x runtime."
}

$env:Path = "$nodeDir;$env:Path"
$env:COREPACK_HOME = Join-Path $repoRoot '.tools\corepack'
$pnpmStore = Join-Path $repoRoot '.pnpm-store'

& $corepackCmd enable --install-directory $nodeDir
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

$pnpmArgs = @($args)

if ($pnpmArgs.Count -ge 2 -and $pnpmArgs[0] -eq '-PnpmArgs') {
  $pnpmArgs = $pnpmArgs[1..($pnpmArgs.Count - 1)]
}

& $corepackCmd pnpm --store-dir $pnpmStore @pnpmArgs
exit $LASTEXITCODE
