# Workbench coordinate guard

WB-GUEST-COORD-GUARD · dot for Adam · 2026-10-19 · [PR #585](https://github.com/ecbarish/generations/pull/585).

[Owner routing](https://github.com/ecbarish/generations/issues/373#issuecomment-6267258938) expressly assigns this narrow repair. The draft was claimed before implementation in `b5091a82a4dd5ce7ea92622eff87e4e406558fdd`. Exact base is #581 `288e07486a79ee2c5813ef7bdab652ba31d03272`; no newer branch or main is substituted. Implementation and test commit: `9303c81df758dba92c9fac299c37bcc4556a5d09`.

## Repair

The [old predicate](https://github.com/ecbarish/generations/blob/288e07486a79ee2c5813ef7bdab652ba31d03272/tools/sprite-workbench/session.gd#L216-L219) accepted the canonical `-9223372036854775808` coordinate because its signed absolute value overflows. An invisible override could then replace the pending session. This was independently reported in [the #581 review](https://github.com/ecbarish/generations/pull/581#pullrequestreview-5570667914).

The [five-line coordinate guard](https://github.com/ecbarish/generations/blob/9303c81df758dba92c9fac299c37bcc4556a5d09/tools/sprite-workbench/session.gd#L218-L222) rejects tokens longer than four characters before integer conversion: every permitted canonical value in the existing inclusive `-512..512` interval fits. It then checks signed bounds directly, without absolute value or vector narrowing. Canonical-string and palette-value checks are retained. All validation still precedes [session adoption](https://github.com/ecbarish/generations/blob/9303c81df758dba92c9fac299c37bcc4556a5d09/tools/sprite-workbench/session.gd#L223-L230); only the failure diagnostic changes on rejection.

## Reproduced and verified

Actual runtime: **Linux Godot 4.6.3.stable.official.7d41c59c4**. Every input/output used unique disposable synthetic directories in isolated XDG application data; real art and player profiles were not opened.

| Standalone suite | Untouched exact base | Repaired code |
| --- | --- | --- |
| Unchanged `dot-safety.gd` | 191 passed / 0 failed | 191 passed / 0 failed |
| Unchanged `safety-fixes.gd` | 60 passed / 0 failed | 60 passed / 0 failed |
| New `dot-coordinate-guard.gd` | 342 passed / 30 failed, exit 1 | 372 passed / 0 failed, exit 0 |

The new suite is byte-identical between baseline and repaired runs. Baseline failures are the ten INT64_MIN paint/erase cases' rejection, state-retention and diagnostic assertions (x/y/both axes; dirty and clean sessions). Baseline oversized decimal strings also produced Godot integer-conversion errors. Repaired runs have no runtime/script errors. A separate read-only reviewer independently reran all three repaired suites with the same passing totals and checked exact-base/diff/test integrity.

[Boundary coverage](https://github.com/ecbarish/generations/blob/9303c81df758dba92c9fac299c37bcc4556a5d09/tools/sprite-workbench/reviews/dot-coordinate-guard.gd#L31-L67) includes both 64-bit extrema and their neighbors, values beyond 64-bit, 32-bit narrowing/wrap magnitudes, ±513, malformed and noncanonical keys, and paint/erase. Repeated failed loads preserve entries, original data, pixel overrides, source path/hash, source image identity/bytes, both undo and redo stacks, dirty state, and cached image/texture identity/bytes. Candidate data contains valid edits before and after the bad coordinate, plus a changed anchor, to expose partial adoption.

[Positive controls](https://github.com/ecbarish/generations/blob/9303c81df758dba92c9fac299c37bcc4556a5d09/tools/sprite-workbench/reviews/dot-coordinate-guard.gd#L69-L101) accept the 49-point signed boundary grid including all ±512 corners. Ordinary negative paint renders in both frames, and negative erase renders in the first. All override keys survive save/reopen; first-frame image bytes, root and bounds also match exactly. Source hashes remain unchanged.

SHA-256 integrity:
- `dot-safety.gd`: `8be25ebd3e4fd4bdea3e538306fe10e4ea56b3a0b038979e33b0e498e5dd3e34`
- `safety-fixes.gd`: `d264d9aac34d5f11f9b874f7b7174cbc70e30a236871e7deec8e28f9ea8429c3`
- `dot-coordinate-guard.gd`: `6be55d1776b39c3e1b75481455d506fc37af0d0283cff0b2c17c5f53affce1af`

From the repository root, with XDG_DATA_HOME, XDG_CACHE_HOME and XDG_CONFIG_HOME pointing to disposable writable directories:

```sh
godot --version
godot --headless --path tools/sprite-workbench --script res://reviews/dot-safety.gd
godot --headless --path tools/sprite-workbench --script res://reviews/safety-fixes.gd
godot --headless --path tools/sprite-workbench --script res://reviews/dot-coordinate-guard.gd
```

## Scope and limits

Only coordinate validation in `session.gd`, the new standalone boundary test, and this report change. No original assertion is removed, weakened or skipped. This does not claim an independent Windows/4.7.2, graphical/pointer, real-art or full local aggregate run; the Windows-only uppercase-path branch does not execute on Linux. Exact-head GitHub CI is reported separately on the PR. The seven #581 repairs remain covered by the unchanged suites.

No UI, artwork, source inputs, player saves/schema, CI, exports, COMMS, START-HERE or versions change. This repair ticks no launch-checklist row and resumes no wider paused work. One owner review handoff; Generations Reviewer owns merge. No merge or publication.
