[CmdletBinding()]
param(
    [string]$StartUrl = 'https://ai.seaboxdata.com/#/home/config-system-monitor',
    [switch]$DryRun,
    [switch]$NoApiBodies,
    [ValidateRange(0, 10)]
    [int]$MaxDetailsPerState = 4,
    [ValidateRange(1, 50)]
    [int]$MaxTablePages = 10,
    [ValidateRange(1, 300)]
    [int]$MaxRecords = 300,
    [string]$ResumeOutput
)

$ErrorActionPreference = 'Stop'
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$captureScript = Join-Path $scriptRoot 'capture-system-management-details.mjs'

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Node.js was not found. Install Node.js 20 or newer first.'
}

$arguments = @($captureScript, '--start-url', $StartUrl, '--max-details', "$MaxDetailsPerState", '--max-table-pages', "$MaxTablePages", '--max-records', "$MaxRecords")
if ($DryRun) { $arguments += '--dry-run' }
if ($NoApiBodies) { $arguments += '--no-api-bodies' }
if ($ResumeOutput) { $arguments += @('--resume-output', $ResumeOutput) }

& node @arguments
if ($LASTEXITCODE -ne 0) {
    throw "Capture script exited with code $LASTEXITCODE"
}
