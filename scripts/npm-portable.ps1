$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$nodeDir = Join-Path $repoRoot '.tools\node-v20.20.2-win-x64'
$nodeExe = Join-Path $nodeDir 'node.exe'
$npmCli = Join-Path $nodeDir 'node_modules\npm\bin\npm-cli.js'

if (-not (Test-Path -LiteralPath $nodeExe)) {
  throw "Portable Node was not found at $nodeExe."
}

if (-not (Test-Path -LiteralPath $npmCli)) {
  throw "Portable npm CLI was not found at $npmCli."
}

$env:Path = "$nodeDir;$env:Path"
$env:NPM_CONFIG_CACHE = Join-Path $repoRoot '.tools\npm-cache'

$npmArgs = @($args)

if ($npmArgs.Count -ge 2 -and $npmArgs[0] -eq '-NpmArgs') {
  $npmArgs = $npmArgs[1..($npmArgs.Count - 1)]
}

& $nodeExe $npmCli @npmArgs
exit $LASTEXITCODE
