# One command for the existing chapter checks

WB-GUEST-CHAPTER-CHECK-COMMAND, dot for Adam (abarish-dev), 2026-10-19.
[Draft #593](https://github.com/ecbarish/generations/pull/593), based exactly on
[#591](https://github.com/ecbarish/generations/pull/591) at
`c94e856bcd78737db915fbbfb2ea783bbd8ea3e6`, targeting `codex/wildbond-soft-ground`.
[Owner assignment](https://github.com/ecbarish/generations/issues/373#issuecomment-6271496254).

**Status: 47 disposable wrapper checks pass; native/aggregate gates remain blocked.**
The script has been executed on Linux with a fake native-engine fixture. This is
not an actual fallback capture, aggregate pass, visual acceptance, merge or release.
The user explicitly authorized publishing these three files and updating draft
#593 at 16:48 UTC, after the initial publication action was blocked. This report
accompanies that scoped implementation; native validation remains outstanding.

## Use

Requires PowerShell **7.3+**, Git, a Godot 4 executable and its graphical rendering
capabilities. Use an existing writable parent outside source, art and profile
folders. The final output directory must not exist. For example, after creating
`C:/temp` yourself:

```powershell
pwsh -NoProfile -File tools/wildbond-chapter-checks.ps1 `
  -GodotPath 'C:/Godot/Godot_console.exe' `
  -OutputPath 'C:/temp/wb-soft-check-001'
```

Defaults: `-Preview soft_ground -Art fallback -Renderer gl_compatibility`.
The only other preview is `opening_space`; the only other renderer is
`forward_plus`. Both previews run their existing `capture.gd` unchanged, including
the existing map/interaction/no-save checks and six screenshots. No checks are
reimplemented here. No compact/baseline/hard-edge modes, extra CLI pass-through,
CI integration, paid calls or model calls are added.

Private art is explicitly opt-in and requires a pack path:

```powershell
pwsh -NoProfile -File tools/wildbond-chapter-checks.ps1 `
  -GodotPath 'C:/Godot/Godot_console.exe' `
  -OutputPath 'C:/temp/wb-private-check-001' `
  -Preview opening_space -Renderer forward_plus `
  -Art private -PrivatePackPath 'D:/Wildbond/private-sprites/v1'
```

Private captures stay local and outside Git. The wrapper neither copies nor
publishes evidence. A missing/invalid pack remains a failure of the existing
runner's art-mode check; a requested mode is not reported as verified on failure.

## Safety and provenance

- Godot/output paths must be explicit absolute filesystem paths. The executable,
  runner, Git HEAD, destination and writable parent are checked before launch.
- Output must be new. Current/other Git worktrees, Git metadata, named art/profile
  directories, configured private pack roots and operating-system profile roots
  are refused. Symlink/junction/reparse components are refused in output and
  protected roots. POSIX backslashes and Windows device/UNC/short-name/trailing
  dot/space aliases are deliberately unsupported. Use physical ordinary paths.
- A sibling exclusive `.wb-chapter.lock` serializes wrapper calls for one output.
  A pre-existing lock is refused and never deleted. If an interrupted process
  leaves its lock, first verify no run is active, then use a fresh output name.
  The caller must own and keep the parent directory stable; this is not a sandbox
  against another process replacing directories while the command runs.
- Godot data/config/cache environment paths, and HOME on macOS, are redirected
  beneath this run's output and restored afterward. The inherited previews also
  select a unique disposable profile and disable writes. No real profile is read
  by this wrapper. Private pack configuration is resolved explicitly before
  redirecting environment paths.
- A missing `.godot` cache triggers the same headless import prerequisite used by
  the existing aggregate. Import errors stop capture and preserve their exit.
  Import can regenerate tracked sidecars. Cold-cache import first requires a
  clean project subtree, so an already-dirty file cannot be silently rewritten.
  Any changed Git working-tree state after import stops this wrapper for inspection,
  with no automatic revert or deletion.
- Native arguments are passed as separate values with PowerShell Standard native
  argument handling. No command string is evaluated.
- `metrics.json` remains the native runner's report. `godot.log`, optional
  `import.log`, `summary.json` and its one-line stdout copy record exact source
  HEAD/dirty state, actual engine/renderer from native metrics, verified/requested
  art mode, evidence location, whether capture started and final exit code.
- Nonzero executable-version, import and capture exits are preserved. Preflight
  failures use 2; a zero native exit without usable provenance or a wrapper
  bookkeeping failure uses 3. An underlying nonzero native exit wins over later
  report errors. Rejected parameter values are PowerShell binding failures.

## Disposable tests

Choose an explicit scratch parent outside Git, art and OS profile locations.
Windows's default `%LOCALAPPDATA%/Temp` and macOS's `/var` symlink are intentionally
not assumed safe. Examples:

```powershell
pwsh -NoProfile -File tests/wildbond-chapter-checks.ps1 -ScratchParent C:/temp
# Linux: -ScratchParent /tmp
# macOS: use an existing physical path such as /private/tmp.
```

The fixture creates its own temporary Git checkout and fake executable. It covers
whitelisted routing/defaults, explicit arguments and provenance, runtime-data
isolation, invalid choices, absent/relative/nonwritable paths, source traversal,
other repositories/Git metadata, art/profile roots, existing evidence/locks,
output appearing during preflight, symlink aliases, POSIX quoting/backslashes,
private-mode selection, exact version/import/capture failure codes and missing or
malformed metrics. Only this test's GUID-named fixture tree is removed. Fixture
passes are not actual Godot passes.

## Verification and remaining gates

Platform inspected: Debian 13 x86_64, Node and Chromium installed. Actual installed
engine: `4.6.3.stable.official.7d41c59c4`. The inherited #589/#591 reports used Godot
4.7.2 and an RTX 4090; their results are not reproduced by this task and cannot be
attributed to this wrapper.

- Independent source review identified and corrected art-root symlink aliases,
  macOS profile isolation, native quote handling, Git metadata destinations,
  Godot POSIX backslash normalization, Windows path aliases and output locking.
- `git diff --check`: passed. Existing capture runners and runtime files are
  unchanged. No `.agents/skills` were present in the exact base tree.
- Existing focused `agent-context` check: 21 passed. This is not a wrapper check
  and not the aggregate gate.
- PowerShell execution: **45/47 disposable wrapper checks passed**, 2026-10-19
  16:46 UTC, PowerShell **7.6.7**, Debian 13 x86_64. The user approved the official
  Microsoft temporary installation. Package SHA256 matched
  `24d0fca8c904c65aa92e1bd80afde57f97c6921ba54d37b8fda7cd348e559296`.
  The installation and its own cache/config/data remain isolated under `/tmp`;
  nothing was installed on the user's computer. Windows/macOS execution is untested.
- Actual fallback capture: **not run**. Existing Xorg cannot create listening
  sockets (EPERM). The supported escalation fails before execution because the
  runtime cannot create its protected file on a read-only filesystem. No access
  restriction was bypassed and no dummy-driver/headless image is called a capture.
- Full unchanged `node tools/run-all-checks.cjs`: attempted with explicit installed
  `GODOT`; exits **2** when Chromium cannot launch, before any suite runs. This is
  **blocked, not passed**. No suite was disabled or existing test changed.

The tested local source is claim HEAD
`8530596356b93c89b75ecb26b0f3665afb230afe` plus the uncommitted scoped files:

| File | SHA256 of actually tested bytes |
| --- | --- |
| `tools/wildbond-chapter-checks.ps1` | `f9e7f6d4dfcbf8f6583812d1f01d08ad6187a4bc66126242052ba4fbf798b0c5` |
| `tests/wildbond-chapter-checks.ps1` | `e9caed4c83a49d3f92a5509d89c02386c896b0e581cf41573e0e91ae4d61be43` |

The exact fixture command was `pwsh -NoProfile -NonInteractive -File
tests/wildbond-chapter-checks.ps1 -ScratchParent /tmp`, using the isolated official
PowerShell executable and redirected XDG/cache environment. Result: `PASS 47
disposable wrapper checks; these are not native Godot checks.` After the first 45-case pass, final source review identified the already-dirty
import case. The cold-import guard and two regression checks were added; all 47
checks then passed against the hashes above. The real native
and full final gates must still be attached to the eventual exact implementation
commit. [The initial publication blocker, now resolved by user approval](https://github.com/ecbarish/generations/issues/373#issuecomment-6271850079)
and [the owner's available Windows validation route](https://github.com/ecbarish/generations/issues/373#issuecomment-6272282266)
are recorded on #373. The PR handoff supplies the exact published head for that validation.

The required final gate remains:

```powershell
$env:GODOT = 'C:/Godot/Godot_console.exe'
node tools/run-all-checks.cjs
```

Before ready-for-review: verify the published bytes, demonstrate one actual
fallback run through this wrapper on the exact published implementation head,
inspect the native captures/metrics, and run the full aggregate against that same
head. Record failures and platform/engine limits without substituting inherited
#591 evidence. The [runtime blocker and owner evidence request](https://github.com/ecbarish/generations/issues/373#issuecomment-6271667449)
are on #373. Wider #541/backlog pause, Grok's fence repair, shared documents,
CI/runtime/assets/schema changes, author merge and publication remain outside scope.
