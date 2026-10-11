# Web builds of the Godot games

Exported from `wildbond-godot/` and `starfall-godot/` with Godot 4.7.2 (single-threaded web template, so they run on
GitHub Pages without special headers). Linked from playtest.html. Rebuild after changes worth showing (a milestone, a new area, a fix friends asked for), not after every commit: each
rebuilt pack adds 20 MB to the repository's history forever (docs/learning/web-and-shipping.md):

    Godot_v4.7.2-stable_win64_console.exe --headless --path wildbond-godot --export-release "Web" ../play/wildbond/index.html
    Godot_v4.7.2-stable_win64_console.exe --headless --path starfall-godot --export-release "Web" ../play/starfall/index.html

The engine file (index.wasm, about 38 MB) is the same for both and between rebuilds, so git stores it once; only
index.pck (the game itself) changes. Windows downloads go to `Desktop\Game builds\` (not in the repo): export with
`--export-release "Windows"` and zip the folder.

Wildbond’s 2026-10-10 pack refresh and exact-build verification are documented in [wildbond/BUILD.md](wildbond/BUILD.md).
