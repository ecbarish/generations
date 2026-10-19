#requires -Version 7.3
# Disposable wrapper tests. These fixtures never stand in for actual Godot evidence.
param([Parameter(Mandatory)][string]$ScratchParent)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
$PSNativeCommandArgumentPassing = 'Standard'
if (-not [IO.Path]::IsPathFullyQualified($ScratchParent) -or -not (Test-Path -LiteralPath $ScratchParent -PathType Container)) { throw 'ScratchParent must be an explicit existing directory outside Git, art and profile paths.' }
$homeDir = Join-Path $ScratchParent ('wb-command-tests-' + [guid]::NewGuid().ToString('N'))
$null = New-Item -ItemType Directory -Path $homeDir
$repo = Join-Path $homeDir 'source repo'
$null = New-Item -ItemType Directory -Path (Join-Path $repo 'tools'), (Join-Path $repo 'wildbond-godot/tests/opening_space'), (Join-Path $repo 'wildbond-godot/tests/soft_ground')
$wrapper = Join-Path $repo 'tools/wildbond-chapter-checks.ps1'
Copy-Item -LiteralPath (Join-Path $PSScriptRoot '../tools/wildbond-chapter-checks.ps1') -Destination $wrapper
foreach ($preview in @('opening_space', 'soft_ground')) { Set-Content -LiteralPath (Join-Path $repo "wildbond-godot/tests/$preview/capture.gd") -Value '# disposable fixture only' }
'source sidecar' | Set-Content -LiteralPath (Join-Path $repo 'wildbond-godot/fixture-sidecar.import')
$null = & git -C $repo init -q
$null = & git -C $repo add .
$null = & git -C $repo -c user.name=Fixture -c user.email=fixture@users.noreply.github.com commit -qm fixture
if ($LASTEXITCODE -ne 0) { throw 'Fixture Git initialization failed.' }
$head = & git -C $repo rev-parse HEAD
$pwsh = (Get-Process -Id $PID).Path
$fakeScript = Join-Path $homeDir 'fake-engine.ps1'
@'
$ErrorActionPreference = 'Stop'
# Model a native engine's argv, not pwsh -File's script-parameter binding.
# That binding splits '--pack=C:\temp\optional pack' at the drive colon.
# Read the process arguments after our fixed -File prefix, without joining,
# reparsing or repairing payload tokens. Normalize only the script-path boundary.
$processArgs = [Environment]::GetCommandLineArgs()
$fileIndex = [Array]::IndexOf($processArgs, '-File')
if ($fileIndex -lt 0 -or $fileIndex + 1 -ge $processArgs.Length -or [IO.Path]::GetFullPath($processArgs[$fileIndex + 1]) -ne [IO.Path]::GetFullPath($PSCommandPath)) {
    throw 'Unexpected disposable engine launcher prefix.'
}
$args = @($processArgs | Select-Object -Skip ($fileIndex + 2))
if ($env:WB_COMMAND_FIXTURE_TRACE) { [IO.File]::AppendAllText($env:WB_COMMAND_FIXTURE_TRACE, 'invoked' + [Environment]::NewLine) }
if ($args[0] -eq '--version') {
    if ($env:WB_COMMAND_FIXTURE -eq 'version-error') { exit 23 }
    if ($env:WB_COMMAND_FIXTURE -eq 'wrong-executable') { 'not a godot'; exit 0 }
    if ($env:WB_COMMAND_FIXTURE -eq 'output-appeared') {
        $null = [IO.Directory]::CreateDirectory($env:WB_COMMAND_FIXTURE_OUTPUT)
        [IO.File]::WriteAllText((Join-Path $env:WB_COMMAND_FIXTURE_OUTPUT 'sentinel'), 'caller evidence')
    }
    '4.6.3.stable.fixture'; exit 0
}
if ('--import' -in $args) {
    if ($env:WB_COMMAND_FIXTURE -eq 'import-error') { exit 31 }
    if ($env:WB_COMMAND_FIXTURE -eq 'import-rewrite') {
        $project = $args[[Array]::IndexOf($args, '--path') + 1]
        [IO.File]::WriteAllText((Join-Path $project 'fixture-sidecar.import'), 'unexpected rewrite')
    }
    if ($env:WB_COMMAND_FIXTURE -eq 'import-dirty') {
        $project = $args[[Array]::IndexOf($args, '--path') + 1]
        [IO.File]::WriteAllText((Join-Path $project 'fixture-import-sidecar.txt'), 'import changed source state')
    }
    exit 0
}
$split = [Array]::IndexOf($args, '--')
$output = $args[$split + 1]
[IO.File]::WriteAllText((Join-Path $output 'fixture-args.json'), (ConvertTo-Json -InputObject @($args)))
$runtime = @{}
foreach ($name in @('XDG_DATA_HOME','XDG_CONFIG_HOME','XDG_CACHE_HOME','APPDATA','LOCALAPPDATA')) { $runtime[$name] = [Environment]::GetEnvironmentVariable($name) }
if ($IsMacOS) { $runtime['HOME'] = $env:HOME }
[IO.File]::WriteAllText((Join-Path $output 'fixture-runtime.json'), (ConvertTo-Json $runtime))
if ($env:WB_COMMAND_FIXTURE -eq 'runner-error') { exit 37 }
if ($env:WB_COMMAND_FIXTURE -eq 'no-metrics') { exit 0 }
if ($env:WB_COMMAND_FIXTURE -eq 'bad-metrics') { [IO.File]::WriteAllText((Join-Path $output 'metrics.json'), '{'); exit 0 }
$index = [Array]::IndexOf($args, '--rendering-method')
@{engine='4.6.3.stable.fixture';renderer=$args[$index + 1];passed=1;failed=0} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $output 'metrics.json')
exit 0
'@ | Set-Content -LiteralPath $fakeScript
if ($IsWindows) {
    $fake = Join-Path $homeDir 'fake godot.cmd'
    "@echo off`r`n`"$pwsh`" -NoProfile -File `"$fakeScript`" %*`r`nexit /b %ERRORLEVEL%" | Set-Content -LiteralPath $fake
} else {
    $fake = Join-Path $homeDir 'fake godot'
    # Fixture paths come from our GUID temp root; shell quoting handles spaces.
    "#!/bin/sh`nexec '$($pwsh.Replace("'", "'\''"))' -NoProfile -File '$($fakeScript.Replace("'", "'\''"))' `"`$@`"" | Set-Content -LiteralPath $fake
    & chmod 700 $fake
    if ($LASTEXITCODE -ne 0) { throw 'Cannot make disposable engine executable.' }
}
$count = 0
function Check([bool]$Condition, [string]$Name) {
    if (-not $Condition) { throw "FAIL: $Name" }
    $script:count++
    Write-Output "ok $Name"
}
function Invoke-Wrapper([string[]]$Extra = @(), [string]$Out = '', [string]$Mode = '', [string]$Exe = $fake) {
    if (-not $Out) { $Out = Join-Path $homeDir ('evidence ' + [guid]::NewGuid().ToString('N')) }
    $previous = $env:WB_COMMAND_FIXTURE
    $previousOutput = $env:WB_COMMAND_FIXTURE_OUTPUT
    $env:WB_COMMAND_FIXTURE_OUTPUT = $Out
    $previousTrace = $env:WB_COMMAND_FIXTURE_TRACE
    $trace = Join-Path $homeDir ('trace-' + [guid]::NewGuid().ToString('N'))
    $env:WB_COMMAND_FIXTURE_TRACE = $trace
    $env:WB_COMMAND_FIXTURE = $Mode
    try {
        $lines = @(& $pwsh -NoProfile -NonInteractive -File $wrapper -GodotPath $Exe -OutputPath $Out @Extra 2>&1)
        return @{ code=$LASTEXITCODE; lines=$lines; path=$Out; launched=(Test-Path -LiteralPath $trace) }
    } finally { $env:WB_COMMAND_FIXTURE = $previous; $env:WB_COMMAND_FIXTURE_TRACE = $previousTrace; $env:WB_COMMAND_FIXTURE_OUTPUT = $previousOutput }
}
try {
    $r = Invoke-Wrapper
    Check ($r.code -eq 0) 'default fallback exits zero'
    $summary = Get-Content -LiteralPath (Join-Path $r.path 'summary.json') -Raw | ConvertFrom-Json
    Check ($summary.source_head -eq $head -and -not $summary.source_dirty) 'source HEAD and clean state are accurate'
    Check ($summary.preview -eq 'soft_ground' -and $summary.art -eq 'fallback' -and $summary.renderer -eq 'gl_compatibility') 'default selection and actual renderer are reported'
    Check ($summary.engine -eq '4.6.3.stable.fixture' -and $summary.evidence -eq $r.path) 'actual engine and evidence path are reported'
    $argv = @(Get-Content -LiteralPath (Join-Path $r.path 'fixture-args.json') -Raw | ConvertFrom-Json)
    $runtime = Get-Content -LiteralPath (Join-Path $r.path 'fixture-runtime.json') -Raw | ConvertFrom-Json -AsHashtable
    Check (@($runtime.Values | Where-Object { -not $_.StartsWith($r.path + [IO.Path]::DirectorySeparatorChar) }).Count -eq 0) 'native user-data paths stay inside owned output'
    Check ('--fallback' -in $argv -and $r.path -in $argv) 'fallback and space-containing output are distinct native arguments'
    Check ((@($r.lines | Where-Object { "$_" -like 'Chapter checks: {*' })).Count -eq 1) 'one compact summary is printed'
    Check ((Invoke-Wrapper -Extra @('-Preview','opening_space','-Renderer','forward_plus')).code -eq 0) 'other whitelisted runner and renderer work'
    foreach ($pair in @(@('-Preview','../opening'), @('-Art','arbitrary'), @('-Renderer','dummy'))) {
        Check ((Invoke-Wrapper -Extra $pair).code -ne 0) "refuse unlisted $($pair[0])"
    }
    Check ((Invoke-Wrapper -Exe (Join-Path $homeDir 'missing')).code -ne 0) 'refuse missing executable'
    Check ((Invoke-Wrapper -Out 'relative-output').code -ne 0) 'refuse relative output'
    Check ((Invoke-Wrapper -Out (Join-Path $homeDir 'absent/child')).code -ne 0) 'refuse absent output parent'
    $refusedSource = Invoke-Wrapper -Out (Join-Path $repo 'untracked-evidence')
    Check ($refusedSource.code -ne 0 -and -not $refusedSource.launched) 'refuse source output before executable probe'
    Check ((Invoke-Wrapper -Out (Join-Path $repo '../source repo/traversal')).code -ne 0) 'normalize traversal before source refusal'
    $secondRepo = Join-Path $homeDir 'other-checkout'
    $null = & git init -q $secondRepo
    Check ((Invoke-Wrapper -Out (Join-Path $secondRepo 'evidence')).code -ne 0) 'refuse another Git worktree'
    Check ((Invoke-Wrapper -Out (Join-Path $secondRepo '.git/evidence')).code -ne 0) 'refuse another Git metadata directory'
    Check ((Invoke-Wrapper -Out $r.path).code -ne 0) 'refuse existing evidence without overwriting'
    Check ((Get-Content -LiteralPath (Join-Path $r.path 'summary.json') -Raw | ConvertFrom-Json).exit_code -eq 0) 'existing evidence stays intact'
    $lockedPath = Join-Path $homeDir 'busy-output'
    $lockFile = $lockedPath + '.wb-chapter.lock'
    'caller owned' | Set-Content -LiteralPath $lockFile
    Check ((Invoke-Wrapper -Out $lockedPath).code -ne 0) 'refuse a concurrent or stale output lock'
    Check ((Get-Content -LiteralPath $lockFile -Raw).Trim() -eq 'caller owned') 'do not delete another invocation lock'
    $artFolder = Join-Path $homeDir 'art'
    $null = New-Item -ItemType Directory -Path $artFolder
    Check ((Invoke-Wrapper -Out (Join-Path $artFolder 'capture')).code -ne 0) 'refuse art destination'
    $oldPack = $env:WILDBOND_PRIVATE_PACK
    $env:WILDBOND_PRIVATE_PACK = $homeDir
    try { Check ((Invoke-Wrapper).code -ne 0) 'refuse configured private pack destination even with fallback' }
    finally { $env:WILDBOND_PRIVATE_PACK = $oldPack }
    $oldApp = $env:APPDATA
    $env:APPDATA = $homeDir
    try { Check ((Invoke-Wrapper).code -ne 0) 'refuse operating-system profile destination' }
    finally { $env:APPDATA = $oldApp }
    Check ((Invoke-Wrapper -Mode 'version-error').code -eq 23) 'preserve executable probe error 23'
    $appeared = Invoke-Wrapper -Mode 'output-appeared'
    Check ($appeared.code -ne 0 -and (Get-Content -LiteralPath (Join-Path $appeared.path 'sentinel') -Raw) -eq 'caller evidence') 'refuse newly appeared output without overwriting it'
    Check ((Invoke-Wrapper -Mode 'wrong-executable').code -ne 0) 'refuse non-Godot version'
    $sidecar = Join-Path $repo 'wildbond-godot/fixture-sidecar.import'
    'preexisting local change' | Set-Content -LiteralPath $sidecar
    $preDirty = Invoke-Wrapper -Mode 'import-rewrite'
    Check ($preDirty.code -eq 2 -and (Get-Content -LiteralPath $sidecar -Raw).Trim() -eq 'preexisting local change') 'refuse cold import before rewriting already-dirty source'
    Check (-not (Get-Content -LiteralPath (Join-Path $preDirty.path 'summary.json') -Raw | ConvertFrom-Json).runner_started) 'dirty-source import refusal never starts capture'
    'source sidecar' | Set-Content -LiteralPath $sidecar
    $importFailure = Invoke-Wrapper -Mode 'import-error'
    Check ($importFailure.code -eq 31) 'preserve fresh-cache import error 31'
    Check (-not (Get-Content -LiteralPath (Join-Path $importFailure.path 'summary.json') -Raw | ConvertFrom-Json).runner_started) 'failed import never starts capture'
    $dirtyImport = Invoke-Wrapper -Mode 'import-dirty'
    Check ($dirtyImport.code -eq 3) 'stop if import changes working-tree state'
    Check (Test-Path -LiteralPath (Join-Path $repo 'wildbond-godot/fixture-import-sidecar.txt')) 'do not automatically revert import changes'
    Remove-Item -LiteralPath (Join-Path $repo 'wildbond-godot/fixture-import-sidecar.txt')
    Check ((Invoke-Wrapper -Mode 'runner-error').code -eq 37) 'preserve native runner error 37'
    Check ((Invoke-Wrapper -Mode 'no-metrics').code -eq 3) 'zero exit without evidence is not a pass'
    Check ((Invoke-Wrapper -Mode 'bad-metrics').code -eq 3) 'malformed provenance is not a pass'
    Check ((Invoke-Wrapper -Extra @('-Art','private')).code -ne 0) 'private selection needs explicit pack path'
    $pack = Join-Path $homeDir 'optional pack'
    $null = New-Item -ItemType Directory -Path $pack
    '{}' | Set-Content -LiteralPath (Join-Path $pack 'manifest.json')
    $private = Invoke-Wrapper -Extra @('-Art','private','-PrivatePackPath',$pack)
    Check ($private.code -eq 0) 'explicit private mode forwards a bounded pack argument'
    $privateArgs = @(Get-Content -LiteralPath (Join-Path $private.path 'fixture-args.json') -Raw | ConvertFrom-Json)
    Check ("--pack=$pack" -in $privateArgs -and '--fallback' -notin $privateArgs) 'private art is explicit rather than inherited'
    if (-not $IsWindows) {
        $backslash = Invoke-Wrapper -Out (Join-Path $homeDir 'existing\child')
        Check ($backslash.code -ne 0 -and -not $backslash.launched) 'refuse POSIX backslashes before Godot normalization'
        $quotedPath = Join-Path $homeDir 'evidence "quotes"; [literal]'
        $quoted = Invoke-Wrapper -Out $quotedPath
        Check ($quoted.code -eq 0) 'quoted and shell-looking output remains literal'
        $quotedArgs = @(Get-Content -LiteralPath (Join-Path $quoted.path 'fixture-args.json') -Raw | ConvertFrom-Json)
        Check ($quotedPath -in $quotedArgs) 'exact quoted output reaches the native runner'
        $packAlias = Join-Path $homeDir 'pack-alias'
        $null = New-Item -ItemType SymbolicLink -Path $packAlias -Target $pack
        Check ((Invoke-Wrapper -Extra @('-Art','private','-PrivatePackPath',$packAlias) -Out (Join-Path $pack 'evidence')).code -ne 0) 'refuse private pack alias with output in real art root'
        $link = Join-Path $homeDir 'linked-output'
        $null = New-Item -ItemType SymbolicLink -Path $link -Target $homeDir
        Check ((Invoke-Wrapper -Out (Join-Path $link 'child')).code -ne 0) 'refuse symlink ancestor'
        $dangling = Join-Path $homeDir 'dangling-output'
        $null = New-Item -ItemType SymbolicLink -Path $dangling -Target (Join-Path $homeDir 'absent')
        Check ((Invoke-Wrapper -Out $dangling).code -ne 0) 'refuse dangling output symlink'
        if (Test-Path -LiteralPath '/proc') {
            $unwritable = Invoke-Wrapper -Out '/proc/wb-command-must-not-write'
            Check ($unwritable.code -ne 0 -and -not $unwritable.launched) 'refuse unwritable parent before launching'
        }
    }
    Write-Output "PASS $count disposable wrapper checks; these are not native Godot checks."
} finally {
    # Delete only this test's unique disposable tree, never real profiles/evidence.
    Remove-Item -LiteralPath $homeDir -Recurse -Force
}
