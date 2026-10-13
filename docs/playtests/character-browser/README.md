# CHAR-BROWSER1: portable character-bench launcher

Adam approved this bounded fix and authorized merging [PR #318](https://github.com/ecbarish/generations/pull/318) on 2026-10-13. Tooling only; no gameplay or artwork release.

## Change

`CHROME_PATH` still wins, including an invalid explicit path (the launch should report that error, not silently choose another browser). Otherwise the existing Windows Chrome path is used only if it exists; when absent, `undefined` lets Playwright launch bundled Chromium. Requiring the script for its focused test no longer runs the visual bench.

The existing bench assertions and three viewports are unchanged. No model, artwork, game, save format, rig, clip, or equipment behavior changed.

An additive PR-only, read-only Actions workflow installs the repository's existing Playwright pin (1.56.1), tests selection, serves the checkout and runs the full online bench with CHROME_PATH unset. It needs the existing external THREE CDN. Fresh screenshots/checks are uploaded as artifacts, not committed; old tracked output is cleared in the disposable CI checkout so it cannot masquerade as this run's evidence. The offline aggregate workflow is unchanged.

## Verified implementation: c478155bb508757e075517e4208e51b8f8a707f2

- Seven focused selection cases pass locally and on CI: explicit override with either installed-path condition; nonexistent explicit override preserved without probing; unset/empty override with Windows Chrome present or absent.
- [Character library review](https://github.com/ecbarish/generations/actions/runs/38458378115): **113/113 existing checks pass** with bundled Chromium on Ubuntu. 37 checks each at 390×844, 1440×1000 and 3440×1440, plus both failed-resource recovery cases.
- Preserved coverage: male/female models and every clip binding; reduced-motion freeze; travel/ranger composites; finite skinned vertices; moving-hand sword attachment and forward blade direction; weapon removal; four views; explicit Play/Pause; untouched storage sentinel; no horizontal overflow, script errors or binding warnings; failed female-model and THREE loads show recovery UI.
- [Full aggregate](https://github.com/ecbarish/generations/actions/runs/38458377912): **all 22 suites pass**, including Wildbond Godot 1,643/1,643 and Starfall Godot 272/272. No assertion was weakened or skipped.
- [Fresh screenshots and checks.json](https://github.com/ecbarish/generations/actions/runs/38458378115/artifacts/11843829295), retained for 14 days. Downloaded and verified 113 recorded checks; all three front-view screenshots inspected. CI runs on the PR merge ref containing the named implementation head and base 1247a8b.
- Independent read-only review found no blocking defects and confirmed the full bench body is byte-identical to base.

## Limits and final status

Local full-browser execution was attempted but blocked before assertions by Chromium `socket() failed: Operation not permitted`; an official bundled-browser download also returned an invalid archive. Four non-browser aggregate suites passed locally. Successful CI above supplies the actual browser/Godot verification, not a claim that local browser tests passed.

This is source-rig/UI regression evidence, not production garment acceptance, physical-device/Safari validation or a performance benchmark. Final documentation-only head CI is recorded in the PR's current checks and Tower block. Adam authorized merge; main was reconciled without changing the character implementation or assertions. Current exact-head checks, merge commit and post-merge verification are maintained in PR #318's Tower block.
