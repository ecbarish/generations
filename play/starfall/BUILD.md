# Starfall preview: 2026-10-10

This pack is built from main `28cee8c`. It includes SF2.6 "Starfall's own place" (the frontier stockade town that scrolls,
drawn with the ART-SF pictures), ART-SF-7 (the side-on west gate, plus a smithy and tavern sized to fit their plots), the evening tint and the yard's
footprint.

Only `index.pck` and its byte count in `index.html` were rebuilt, following the Wildbond preview's pack-only refresh
(play/wildbond/BUILD.md). The Godot 4.7.2 engine (`index.js`, `index.wasm`) and the other shell files are unchanged.
`build.json` records the source commit, the `starfall-godot/` tree and the shipped file digests.

To refresh the pack, import the project once with Godot 4.7.2, then run:

    Godot --headless --path starfall-godot --editor --import --quit
    Godot --headless --path starfall-godot --export-pack Web ../play/starfall/index.pck

Then update `"index.pck"` in `fileSizes` in `index.html` to the new byte count. Checked by loading the preview in headless
Chrome with SwiftShader: it starts, the new town draws and Bryn's welcome appears, with no console errors.
