# Starfall preview: 2026-10-11

This pack is built from main `fa44b3a`. It includes SF2.6 "Starfall's own place" (the frontier stockade town that scrolls,
drawn with the ART-SF pictures), ART-SF-7 (the side-on west gate, plus a smithy and tavern sized to fit their plots), the evening tint, the yard's
footprint, SF2.7 "See the wilds sooner" (the short stretch outside the west gate), SF2.8 "Something by hand every day" (the lantern round and Odo, sparring and Ilse), SF2.18 "No mandatory chores" and SF2.20 (Tamsin easier to reach).

Only `index.pck` and its byte count in `index.html` were rebuilt, following the Wildbond preview's pack-only refresh
(play/wildbond/BUILD.md). The Godot 4.7.2 engine (`index.js`, `index.wasm`) and the other shell files are unchanged.
`build.json` records the source commit, the `starfall-godot/` tree and the shipped file digests.

To refresh the pack, import the project once with Godot 4.7.2, then run:

    Godot --headless --path starfall-godot --editor --import --quit
    Godot --headless --path starfall-godot --export-pack Web ../play/starfall/index.pck

Then update `"index.pck"` in `fileSizes` in `index.html` to the new byte count. Checked by loading the preview in headless
Chrome with SwiftShader: it starts, the town draws and Bryn's welcome appears, with no console errors, and you can walk out of the west gate onto the trail.
