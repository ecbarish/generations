# Builds the Wildbond Godot trial for sharing:
#   Web:     play/wildbond/ (a page friends open from the arcade site: https://ecbarish.github.io/generations/play/wildbond/)
#   Windows: wildbond-godot/export/Wildbond.exe (one file to zip and send)
# Needs Godot's export templates once: in Godot, Editor > Manage Export Templates > Download and Install.
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File tools\godot-build.ps1 [-Target Web|Windows|All]
param([string]$Target = 'All')
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$proj = Join-Path $root 'wildbond-godot'
$godot = Get-ChildItem "$env:USERPROFILE\Godot" -Filter 'Godot_v4*_win64_console.exe' -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $godot) { Write-Error 'Godot 4 was not found in your user folder\Godot.'; exit 1 }
$ver = ($godot.Name -replace '^Godot_v', '' -replace '_win64_console\.exe$', '') -replace '-', '.'
$templates = Join-Path $env:APPDATA "Godot\export_templates\$ver"
if (-not (Test-Path $templates)) {
  Write-Output "Godot's export templates ($ver) aren't installed yet. Open Godot, then Editor > Manage Export Templates > Download and Install, and run this again."
  exit 1
}
& $godot.FullName --headless --path $proj --import | Out-Null
if ($Target -in 'Web', 'All') {
  New-Item -ItemType Directory -Force (Join-Path $root 'play\wildbond') | Out-Null
  & $godot.FullName --headless --path $proj --export-release 'Web' (Join-Path $root 'play\wildbond\index.html')
  Write-Output 'Web build: play\wildbond\ (commit and push it, then share https://ecbarish.github.io/generations/play/wildbond/)'
}
if ($Target -in 'Windows', 'All') {
  New-Item -ItemType Directory -Force (Join-Path $proj 'export') | Out-Null
  & $godot.FullName --headless --path $proj --export-release 'Windows' (Join-Path $proj 'export\Wildbond.exe')
  Compress-Archive -Force (Join-Path $proj 'export\Wildbond.exe') (Join-Path $proj 'export\Wildbond-trial-windows.zip')
  Write-Output 'Windows build: wildbond-godot\export\Wildbond-trial-windows.zip (send this file; Windows may warn that it is from an unknown publisher: More info > Run anyway)'
}
