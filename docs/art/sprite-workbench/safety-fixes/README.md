# Workbench safety repairs

WB-WORKBENCH-SAFETY-FIXES · Codex / root for Evan · 2026-10-19 · [PR #581](https://github.com/ecbarish/generations/pull/581), stacked on #576.

Dot's independent [review #579](https://github.com/ecbarish/generations/pull/579) found seven input/data-integrity defect families. All reproduce on Windows Godot **4.7.2** against base `a9ef87fc38f7290f98e7ae61175216834a729bf5`: **170 pass / 24 fail**, with two script errors. The source-loss reproduction used disposable synthetic inputs only.

## Repairs

| Finding | Result |
|---|---|
| Draft destination/staging/backup collides with source | Before creating folders or opening writes, compare every transaction path with the manifest and all PNG inputs. Normalize absolute paths and Windows case. Refusal preserves edits/history/cache and all input bytes. |
| Huge raw region narrows through Rect2i | Validate finite integer JSON geometry against source dimensions and the 4096 source limit before narrowing. |
| PNG changes after opening | Draft save and export share manifest-plus-all-PNG hash checks. A failed save remains dirty. |
| Missing-step inference indexes malformed references | Validate reference geometry and ink array/value/size before reading or inferring the sample step. |
| Noncanonical frame/coordinate keys drop edits | Reject aliases such as `00`, `+0` and `-0` before committing the new session. Canonical ordinary keys still load. |
| Padded cell cannot reimport | Refuse exports exceeding the existing 512px native-cell reader limit before creating output. A 508px native frame produces a valid 512px padded cell; 509px refuses with an explanation. |
| Palette alpha changes on export | Reject nonopaque palette colours on import. Erase remains the explicit transparent-pixel operation, preserving binary alpha. |

Normal production assets and exported cleanup sessions remain supported. No approved art, source image/measurement, native game code, player save/schema, version or public pack changed. Permanent starter evolution is still separate work.

## Regression evidence

- The independent `reviews/dot-safety.gd` is adopted **unchanged** from dot's report/test head `42cd3b8d5cfbab0860f80efdd08419116babd8c4`; its authorship and report remain linked above. On the repairs it passes **191/0**, with no script errors. The assertion count is conditional: rejecting unsupported palette alpha skips that probe's accepted-alpha export branch. No failing assertion was deleted or weakened.
- Additional `reviews/safety-fixes.gd` passes **60/0**: destination/.tmp/.bak source collisions, Windows case and relative-path aliases, previous destination hashes, full pending-session retention, malformed inference and opaque-palette cases, plus both sides of the 512px padded-cell limit.
- Existing graphical `checks.gd` passes **123/0 on Compatibility** and **123/0 on Forward+**: actual source sheets, edits/undo, backed-up drafts, exact pixel/root export/reimport, pointer/keyboard actions, references, unsaved prompts and four desktop layouts. Fresh [onion/grid capture](onion-grid.png) was inspected; output remains original-art-only.
- All **28 repository suites pass**, including Wildbond 26,976/0, Starfall 488/0, 189 catalogue species, 23 unchanged save names and 21 agent-context checks. Committed export freshness and exact-head CI are recorded in the PR. Exact-head GitHub CI is separate from these local runs.

From the repository root, with Godot 4.7.2:

```powershell
& $env:GODOT --headless --path tools/sprite-workbench --script res://reviews/dot-safety.gd
& $env:GODOT --headless --path tools/sprite-workbench --script res://reviews/safety-fixes.gd
& $env:GODOT --path tools/sprite-workbench --rendering-method gl_compatibility --script res://checks.gd
& $env:GODOT --path tools/sprite-workbench --rendering-method forward_plus --script res://checks.gd
node tools/run-all-checks.cjs
```

Synthetic checks use unique disposable directories under the workbench's application data, never real art or player profiles. Normal GUI tests use process-specific tool output and verify source hashes. Filesystem races and symlink/hardlink identity are outside this bounded filename-collision repair; it is not a general filesystem security boundary.

No launch-checklist item is ticked by this tooling repair. Generations Reviewer owns merge; this work is unpublished.
