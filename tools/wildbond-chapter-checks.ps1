#requires -Version 7.3
<#
.SYNOPSIS
Runs one existing, unsaved Wildbond chapter capture/check runner.
.EXAMPLE
pwsh -File tools/wildbond-chapter-checks.ps1 -GodotPath C:/Godot/Godot_console.exe -OutputPath C:/temp/chapter-run
.NOTES
OutputPath must be a NEW directory under an existing writable parent outside any
Git checkout, art folder or profile location. Private art stays outside Git.
This does not replace: node tools/run-all-checks.cjs
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$GodotPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [ValidateSet('opening_space', 'soft_ground')][string]$Preview = 'soft_ground',
    [ValidateSet('fallback', 'private')][string]$Art = 'fallback',
    [ValidateSet('gl_compatibility', 'forward_plus')][string]$Renderer = 'gl_compatibility',
    [string]$PrivatePackPath
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
# Native nonzero exits are data: preserve them instead of converting to exceptions.
$PSNativeCommandUseErrorActionPreference = $false
$PSNativeCommandArgumentPassing = 'Standard'
$Preview = $Preview.ToLowerInvariant()
$Art = $Art.ToLowerInvariant()
$Renderer = $Renderer.ToLowerInvariant()
$exitCode = 2
$runStarted = $false
$ownedOutput = $false
$outputLock = $null
$savedEnvironment = @{}
$summary = [ordered]@{ source_head = $null; source_dirty = $null; preview = $Preview;
    engine = $null; renderer = $null; art = $null; art_requested = $Art; evidence = $null; exit_code = 2 }

function Absolute-Path([string]$Value) {
    if ([string]::IsNullOrWhiteSpace($Value) -or -not [IO.Path]::IsPathFullyQualified($Value)) {
        throw 'Paths must be explicit, fully qualified filesystem paths.'
    }
    if ($IsWindows -and ($Value -notmatch '^[A-Za-z]:[\\/]' -or $Value -match '~[0-9]' -or $Value.Substring(2).Contains(':') -or (($Value -split '[\\/]') -match '[. ]$'))) {
        throw 'Use ordinary Windows drive paths without device, UNC, short-name or trailing-dot/space aliases.'
    }
    if (-not $IsWindows -and $Value.Contains('\')) { throw 'Godot normalizes backslashes; POSIX paths containing them are refused.' }
    return [IO.Path]::GetFullPath($Value).TrimEnd([IO.Path]::DirectorySeparatorChar)
}
function Inside-Path([string]$Child, [string]$Parent) {
    $comparison = if ($IsWindows -or $IsMacOS) { [StringComparison]::OrdinalIgnoreCase } else { [StringComparison]::Ordinal }
    return $Child.Equals($Parent, $comparison) -or $Child.StartsWith($Parent.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar, $comparison)
}
function No-Links([string]$Path) {
    # Check every existing component, including dangling links and Windows junctions.
    $cursor = $Path
    while ($cursor) {
        $item = Get-Item -LiteralPath $cursor -Force -ErrorAction SilentlyContinue
        if ($null -ne $item -and ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
            throw "Linked output paths are refused: $cursor"
        }
        $parent = [IO.Path]::GetDirectoryName($cursor)
        if ($parent -eq $cursor) { break }
        $cursor = $parent
    }
}
try {
    $root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
    $root = Absolute-Path $root
    $project = Join-Path $root 'wildbond-godot'
    $runner = Join-Path $project "tests/$Preview/capture.gd"
    if (-not (Test-Path -LiteralPath $runner -PathType Leaf)) { throw "Existing runner is missing: $runner" }
    $head = @(& git -C $root rev-parse --verify HEAD 2>$null)
    if ($LASTEXITCODE -ne 0 -or $head.Count -ne 1 -or $head[0] -notmatch '^[0-9a-f]{40}$') { throw 'Cannot establish source HEAD.' }
    $summary.source_head = $head[0]
    $dirty = @(& git -C $root status --porcelain --untracked-files=normal 2>$null)
    if ($LASTEXITCODE -ne 0) { throw 'Cannot establish source working-tree state.' }
    $summary.source_dirty = $dirty.Count -gt 0

    $exe = Absolute-Path $GodotPath
    if (-not (Test-Path -LiteralPath $exe -PathType Leaf)) { throw 'Godot executable does not exist.' }
    $application = Get-Command -Name ([WildcardPattern]::Escape($exe)) -CommandType Application -ErrorAction Stop
    if ($null -eq $application) { throw 'GodotPath must name an executable application.' }
    $output = Absolute-Path $OutputPath
    No-Links $output
    if (Test-Path -LiteralPath $output) { throw 'OutputPath must not already exist; previous evidence is never overwritten.' }
    $parent = [IO.Path]::GetDirectoryName($output)
    if (-not (Test-Path -LiteralPath $parent -PathType Container)) { throw 'OutputPath needs an existing parent directory.' }
    if ((Inside-Path $output $root) -or (Inside-Path $root $output)) { throw 'Outputs in or above the source checkout are refused.' }
    # Refuse any checkout, including ignored/untracked art paths in another repo.
    $null = & git -C $parent rev-parse --absolute-git-dir 2>$null
    if ($LASTEXITCODE -eq 0) { throw 'Outputs inside Git worktrees are refused.' }
    if (($output -split '[/\\]') -match '^(?i:art|assets|profiles?|app_userdata|private-sprites|private-library|\.godot)$') {
        throw 'Art and profile output locations are refused.'
    }
    $protected = @(
        $(if ($HOME) { Join-Path $HOME '.local/share/godot' }),
        $(if ($HOME) { Join-Path $HOME 'Library/Application Support/Godot' }),
        $env:APPDATA, $env:LOCALAPPDATA,
        $(if ($env:XDG_DATA_HOME) { Join-Path $env:XDG_DATA_HOME 'godot' }),
        $env:WILDBOND_PRIVATE_PACK
    )
    if ($Art -eq 'private') {
        $pack = Absolute-Path $PrivatePackPath
        if (-not (Test-Path -LiteralPath (Join-Path $pack 'manifest.json') -PathType Leaf)) { throw 'Private art requires an explicit existing PrivatePackPath containing manifest.json.' }
        $protected += $pack
    } elseif ($PrivatePackPath) { throw 'PrivatePackPath is only valid with -Art private.' }
    # Protect a configured local art root even when this invocation uses fallback.
    $locator = Join-Path $project 'tests/private_sprites/local-pack.json'
    if (Test-Path -LiteralPath $locator -PathType Leaf) {
        $localPack = Get-Content -LiteralPath $locator -Raw | ConvertFrom-Json
        if ($localPack.PSObject.Properties['root']) { $protected += [string]$localPack.root }
    }
    foreach ($location in $protected) {
        if ($location -and [IO.Path]::IsPathFullyQualified($location)) {
            $protectedRoot = Absolute-Path $location
            No-Links $protectedRoot
            if (Inside-Path $output $protectedRoot) {
                throw 'Outputs in configured art or operating-system profile locations are refused.'
            }
        }
    }
    # Exclusive writable probe before starting even --version. Never remove caller files.
    $probe = Join-Path $parent ('.wb-write-probe-' + [guid]::NewGuid().ToString('N'))
    $stream = $null
    try { $stream = [IO.File]::Open($probe, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::None) }
    finally { if ($null -ne $stream) { $stream.Dispose(); [IO.File]::Delete($probe) } }
    $version = @(& $exe --version)
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) { throw "Godot --version exited $exitCode." }
    $exitCode = 2
    if ($version.Count -ne 1 -or $version[0] -notmatch '^4\.\d+(?:\.\d+)?\.') { throw 'Executable did not identify itself as Godot 4.' }
    $summary.engine = $version[0].Trim()
    # An exclusive sibling lock serializes wrapper invocations for the same path.
    # The caller must keep the parent stable; this is not an adversarial filesystem sandbox.
    $lockPath = $output + '.wb-chapter.lock'
    $outputLock = [IO.File]::Open($lockPath, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::None)
    No-Links $output
    if (Test-Path -LiteralPath $output) { throw 'OutputPath appeared during preflight; refusing it.' }
    $null = [IO.Directory]::CreateDirectory($output)
    $ownedOutput = $true
    $summary.evidence = $output
    $environmentNames = @('XDG_DATA_HOME', 'XDG_CONFIG_HOME', 'XDG_CACHE_HOME', 'APPDATA', 'LOCALAPPDATA')
    if ($IsMacOS) { $environmentNames += 'HOME' }
    foreach ($name in $environmentNames) {
        $savedEnvironment[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
        $isolated = Join-Path $output "runtime/$name"
        $null = [IO.Directory]::CreateDirectory($isolated)
        [Environment]::SetEnvironmentVariable($name, $isolated, 'Process')
    }
    # Match the existing aggregate's cold-checkout import prerequisite.
    if (-not (Test-Path -LiteralPath (Join-Path $project '.godot') -PathType Container)) {
        $projectChanges = @(& git -C $root status --porcelain --untracked-files=all -- wildbond-godot 2>$null)
        if ($LASTEXITCODE -ne 0 -or $projectChanges.Count -gt 0) { throw 'Cold-cache import needs a clean project subtree; preserve and inspect local changes first.' }
        & $exe --headless --path $project --import --log-file (Join-Path $output 'import.log')
        $exitCode = $LASTEXITCODE
        if ($exitCode -ne 0) { throw "Godot import exited $exitCode." }
        $exitCode = 3
        $afterImport = @(& git -C $root status --porcelain --untracked-files=normal 2>$null)
        if ($LASTEXITCODE -ne 0) { throw 'Cannot verify source state after import.' }
        $summary.source_dirty = $afterImport.Count -gt 0
        if (($afterImport -join "`n") -ne ($dirty -join "`n")) { throw 'Import changed source working-tree state; inspect it before capturing. No files were reverted.' }
        $exitCode = 2
    }
    $nativeArgs = @('--path', $project, '--rendering-method', $Renderer,
        '--log-file', (Join-Path $output 'godot.log'), '--script', "res://tests/$Preview/capture.gd", '--', $output)
    if ($Art -eq 'fallback') { $nativeArgs += '--fallback' }
    else { $nativeArgs += "--pack=$pack" }
    $runStarted = $true
    & $exe @nativeArgs
    $exitCode = $LASTEXITCODE
    # Runner-produced metrics give actual renderer/engine, including engine fallback.
    $metricsPath = Join-Path $output 'metrics.json'
    if (Test-Path -LiteralPath $metricsPath -PathType Leaf) {
        $metrics = Get-Content -LiteralPath $metricsPath -Raw | ConvertFrom-Json
        $summary.renderer = $metrics.renderer
        $summary.engine = $metrics.engine
        if ($exitCode -eq 0) { $summary.art = $Art }
    } elseif ($exitCode -eq 0) { $exitCode = 3; throw 'Runner exited zero without metrics.json; provenance is incomplete.' }
} catch {
    if ($exitCode -eq 0) { $exitCode = 3 }
    [Console]::Error.WriteLine('Chapter checks: ' + $_.Exception.Message)
} finally {
    foreach ($name in $savedEnvironment.Keys) { [Environment]::SetEnvironmentVariable($name, $savedEnvironment[$name], 'Process') }
    if ($null -ne $outputLock) {
        try { $outputLock.Dispose(); [IO.File]::Delete($lockPath) }
        catch { [Console]::Error.WriteLine('Could not release output lock: ' + $_.Exception.Message); if ($exitCode -eq 0) { $exitCode = 3 } }
    }
    $summary.exit_code = $exitCode
    $summary['runner_started'] = $runStarted
    $json = $summary | ConvertTo-Json -Compress
    if ($ownedOutput) {
        try { [IO.File]::WriteAllText((Join-Path $output 'summary.json'), $json + [Environment]::NewLine) }
        catch { [Console]::Error.WriteLine('Could not save summary: ' + $_.Exception.Message); if ($exitCode -eq 0) { $exitCode = 3; $summary.exit_code = 3; $json = $summary | ConvertTo-Json -Compress } }
    }
    Write-Output "Chapter checks: $json"
}
exit $exitCode
