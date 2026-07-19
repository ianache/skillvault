$ErrorActionPreference = 'Stop'

$entrypointPath = Join-Path $PSScriptRoot '..\docker-entrypoint.sh'
$dockerfilePath = Join-Path $PSScriptRoot '..\Dockerfile'
$composePath = Join-Path $PSScriptRoot '..\docker-compose.yml'
$gitattributesPath = Join-Path $PSScriptRoot '..\.gitattributes'

$entrypoint = [System.IO.File]::ReadAllBytes($entrypointPath)
$dockerfile = [System.IO.File]::ReadAllText($dockerfilePath)
$compose = [System.IO.File]::ReadAllText($composePath)
$gitattributes = if (Test-Path $gitattributesPath) {
  [System.IO.File]::ReadAllText($gitattributesPath)
} else {
  ''
}

if ($entrypoint.Length -lt 2 -or $entrypoint[0] -ne 0x23 -or $entrypoint[1] -ne 0x21) {
  throw 'docker-entrypoint.sh must start with a shebang.'
}

for ($i = 0; $i -lt ($entrypoint.Length - 1); $i++) {
  if ($entrypoint[$i] -eq 0x0D -and $entrypoint[$i + 1] -eq 0x0A) {
    throw 'docker-entrypoint.sh must use LF line endings so the shebang works in Linux containers.'
  }
}

if ($dockerfile -notmatch 'ENTRYPOINT\s+\["/usr/local/bin/docker-entrypoint\.sh"\]') {
  throw 'Dockerfile must use an absolute ENTRYPOINT path for docker-entrypoint.sh.'
}

if ($compose -notmatch '(?ms)^\s+app:\s.*?^\s+build:\s*?\r?\n\s+context:\s+\.\s*?\r?\n\s+dockerfile:\s+Dockerfile') {
  throw 'docker-compose.yml app service must build the local Dockerfile used by docker-compose up app.'
}

if ($gitattributes -notmatch '(?m)^docker-entrypoint\.sh\s+text\s+eol=lf\s*$') {
  throw '.gitattributes must keep docker-entrypoint.sh checked out with LF line endings.'
}

Write-Host 'Docker entrypoint checks passed.'
