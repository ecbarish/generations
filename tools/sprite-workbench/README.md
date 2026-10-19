# Sprite Workbench

A standalone local Godot 4.7.2 tool in Generations. Open **Play Sprite Workbench.bat**. The launcher uses `GODOT` when set, otherwise Evan's installed Godot. Command-line launch from the repository root:

```powershell
& $env:GODOT --path tools/sprite-workbench res://workbench.tscn
```

The tool starts with Thicketboar, Thornback and Mega Thornback measurements from #573. **Base trio** loads Mosshog, Ripplet and Cindercub. **Open measurements** accepts the existing measured `frames.json` format with PNGs relative to that file. Source PNGs and measurements are read-only inputs; this first version uses existing measured regions rather than guessing a grid from an arbitrary poster.

## Working on a sprite

1. Choose a creature and frame. Previous/Next or arrow keys step through all source frames. Play or Space loops the selected front/back pair or four-frame walking direction; FPS controls playback speed.
2. Use neighbouring-frame overlays to see drift: magenta is the previous pose and cyan the next, aligned on the same root. The gold line is the ground, and the cyan cross is the root.
3. Adjust **Root X** (body left/right) and **Ground Y** (feet height), in source pixels. **Apply offset to this cycle** applies that offset in native-pixel units to the other poses in the same group, relative to their original roots. It does not copy one frame's crop coordinates onto unrelated poses.
4. Choose a palette swatch, select Paint or Erase, and draw on the enlarged native frame. One drag is one Undo action. Undo/Redo, Ctrl+Z and Ctrl+Shift+Z retain up to 100 operations. Reset selected frame restores its original anchor and removes its pixel edits. Native pixel edits are tied to the root-aligned grid; review them after changing anchors.
5. Toggle the pixel grid or original source view. The lower corner always shows a **1× native preview**. **Reference PNG** optionally displays a single external sprite (up to 256×256) at 1× beside it. Reference art stays in memory and is excluded from drafts and exported atlases.
6. **Save draft** (Ctrl+S) writes anchors and pixel edits separately, with a backup when replacing an existing draft. **Open draft** verifies exact original manifest/PNG hashes before restoring it. Unsaved edits prompt before replacing a session or closing the tool.
7. **Export atlas** creates a new versioned folder under the tool's own `user://exports`. **Show export** opens that folder. Each export includes `atlas.png`, a reloadable `frames.json`, and `edit-session.json` for resuming cleanup against the originals.

Keyboard shortcuts work outside text/number fields and file dialogs.

Scroll the left controls to reach the palette, Undo/Redo and reset at smaller desktop sizes. This is a desktop production tool, not an in-game editor.

## Output contract

All poses of the selected creature share one padded native cell and ground/body anchor. Four columns (two for the Mega pair) retain original frame order. Metadata uses sample_step 1, an exact atlas hash, the original source hash, the same sixteen-colour palette and measured cell regions. It can be reopened through Open measurements. Playback speed and optional reference art are preview settings, not animation or game rules.

Native output uses deterministic nearest-colour selection in sRGB, binary alpha at 0.5, root-aligned sampling and explicit pixel overrides. Export preserves the workbench's native pixels exactly; it does not claim parity with the older GPU shader's colour conversion. Original high-resolution generated PNGs are never rewritten.

Drafts for repository inputs store a repository-relative manifest reference, so they can move to another checkout with identical source hashes. External inputs retain an absolute manifest path. Source changes after opening block save/export rather than silently accepting different art. A failed source/draft import leaves the current session intact. The tool bounds manifests, source image memory, regions, anchors, sample resolution and atlas size.

Drafts and exports use the separate **Wildbond Sprite Workbench** application-data folder. The tool never opens a Wildbond player profile, changes a live species record or installs exported art into the game. Exports still need visual review and deliberate gameplay integration. No generated artwork or paid service is used by the workbench itself.

## Verification

Run the dedicated checks with a graphical Godot renderer:

```powershell
& $env:GODOT --path tools/sprite-workbench --script res://checks.gd -- --capture C:/absolute/evidence-folder
```

The checks use the real family/base sheets and isolated process-specific tool output. They verify bounded palettes and binary alpha; anchor editing/cycle offsets; paint/erase/undo/redo; backed-up and portable drafts; invalid/future/stale-input rejection without state loss; exact atlas pixels/roots and repeated versioned exports; unchanged source bytes; real pointer playback/painting/Undo; optional references; unsaved-change protection; and four desktop layouts. They require a rendering display for pointer/canvas and capture checks.

[Evidence and review report](../../docs/art/sprite-workbench/README.md).

Safety limits: palette entries must be opaque (use Erase for transparent pixels); padded export cells must fit the 512px native reader limit. Draft save checks all source hashes and protects the destination, staging and backup paths from colliding with any source input. See [independent findings and repairs](../../docs/art/sprite-workbench/safety-fixes/README.md).
