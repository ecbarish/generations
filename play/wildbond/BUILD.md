# Wildbond preview — 2026-10-11

Pack-only release from merged source `480dfc4acd9799b033d70a250167f9654a29f207` (Wildbond tree `3d1dd863265f233a17fa782995d2c736d31fee11`). Includes #177 registered-door tap acceptance and full-size pad doorway clearance, plus already-merged homes, roof routes, wild-bond/reveal and control notes since the previous `0bc8e7b` preview.

Only `index.pck`, its byte count in `index.html`, and `build.json` change. Existing Godot 4.7.2 JS/WASM engine bytes and save schema stay unchanged. The manifest records the build date, source and all four SHA-256 digests. Pack: 20,370,420 bytes, SHA-256 `6fe636cc62df6824be145acdbfaca002414ba5454fd5441833928fead2697048`.

[Export/browser review](https://github.com/ecbarish/idle-arcade/actions/runs/38163220162) passed 353 checks and 119 nonblank screenshots. All five buildings complete entry, exit and re-entry through real mouse/touch events at 1920×1080, 812×375, 844×390 and 960×540. Twenty fixture-free reloads require a fresh autosave, exact authored landing and preserved partner/possessions; twelve directional holds/releases pass. Existing legacy workbench, move selection, Thornwood, Spire, new-journey and rotation checks remain. Synthetic saves come from the real pre-WD3 writer at `26bd1a6f`; no player saves are used. Review-only response overrides preload fixtures and expose the filesystem, without modifying the pack or game behavior. Physical phone testing is not claimed.

[Screenshots](../../docs/screenshots/wildbond-preview-door-fixes/README.md). The prior failed attempt added an overstrict barn reload coordinate expectation; source `_switch` intentionally restores the barn entrance (11,11). Correcting that expected landing preserved the fresh-save and move assertions.

The final read-only workflow verifies and plays these exact committed bytes without re-exporting. Public release is gated on that run and repo-wide Checks; the main-push live verification downloads the official Pages files and matches every digest before reporting success.

To reproduce a pack-only build: import with Godot 4.7.2, then `Godot --headless --path wildbond-godot --export-pack Web ../play/wildbond/index.pck`. Clean imports can produce different bytes, so release review must use the exact committed pack.
