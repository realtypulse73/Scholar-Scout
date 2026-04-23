$ErrorActionPreference = 'Stop'

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$ToolRoot = Join-Path $RepoRoot '.tools'
New-Item -ItemType Directory -Force -Path $ToolRoot | Out-Null

$Index = Invoke-RestMethod 'https://nodejs.org/dist/index.json'
$Release = $Index |
  Where-Object { $_.lts -ne $false -and $_.files -contains 'win-x64-zip' } |
  Select-Object -First 1

if (-not $Release) {
  throw 'No Node.js LTS Windows x64 zip release found.'
}

$Version = $Release.version
$ZipName = "node-$Version-win-x64.zip"
$ZipPath = Join-Path $ToolRoot $ZipName
$NodeDir = Join-Path $ToolRoot "node-$Version-win-x64"
$Url = "https://nodejs.org/dist/$Version/$ZipName"

if (-not (Test-Path $NodeDir)) {
  Invoke-WebRequest -Uri $Url -OutFile $ZipPath
  Expand-Archive -LiteralPath $ZipPath -DestinationPath $ToolRoot -Force
}

$EnvFile = Join-Path $ToolRoot 'env.ps1'
Set-Content -LiteralPath $EnvFile -Value "`$env:PATH = '$NodeDir;' + `$env:PATH"

$env:PATH = "$NodeDir;$env:PATH"
node -v
& (Join-Path $NodeDir 'npm.cmd') -v

