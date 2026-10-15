# Web builds of the Godot games

Exported from `wildbond-godot/` and `starfall-godot/` with Godot 4.7.2 (single-threaded web template, so they run on
GitHub Pages without special headers). Linked from playtest.html. Each rebuilt pack adds about 20 MB to the
repository's history forever (docs/learning/web-and-shipping.md), so keep the Godot edits and the one new pack in
the same pull request.

The live Wildbond page serves `play/wildbond/`. `tools/godot-export.ps1` does not build that preview: it copies
browser JSON into `wildbond-godot/data/`. The preview is a Godot pack export written to `play/wildbond/index.pck`.
The pack's byte count goes in `play/wildbond/index.html`, and `play/wildbond/build.json` records the source
commit and the pack hash. The main-branch live check downloads those files and matches them to `build.json`, so
that record has to stay accurate. `index.js` and `index.wasm` stay unchanged.

A pull request or a commit on main that changes the packed game
has to export that pack again, or `tools/wildbond-export-freshness.py` fails. The packed game is everything under
`wildbond-godot/` except `tests/`, `frames/`, `.godot/`, `export/`, Markdown notes, and Windows `.bat` launchers.
That includes scripts, scenes, assets, shaders, data, `tools/`, `project.godot`, `export_presets.cfg`, and
`default_bus_layout.tres`. Edits that only touch the excluded files can keep the existing pack.

From the repository root, with Godot 4.7.2:

    Godot_v4.7.2-stable_win64_console.exe --headless --path wildbond-godot --editor --import --quit
    Godot_v4.7.2-stable_win64_console.exe --headless --path wildbond-godot --export-pack Web "%CD%\play\wildbond\index.pck"

On Linux or in GitHub Actions, use the official `Godot` 4.7.2 binary and `"$PWD/play/wildbond/index.pck"`.
This pack-only export keeps the existing `index.js` and `index.wasm`. A full `--export-release "Web"` rewrites the
shell; use the pack-only command when refreshing the game.

Then set the single `"index.pck"` byte count in `play/wildbond/index.html` to the new file size. Update
`play/wildbond/build.json`: `built` (the UTC date), `source_commit` (the commit you exported), `source_tree`
from `git rev-parse HEAD:wildbond-godot`, and the sha256 of `index.html`, `index.js`, `index.pck`, and
`index.wasm`. `source_tree` has to equal the `wildbond-godot` tree of the commit that contains the new pack.
A later merge that leaves that tree unchanged can keep the earlier `source_commit`. Commit `index.pck`,
`index.html`, and `build.json` together. Check the result with:

    python3 tools/wildbond-export-freshness.py --base origin/main --head HEAD

`tools/wildbond-preview-manifest.py stage` writes the same shell count and manifest inside the preview workflow.
It needs `GITHUB_REPOSITORY` and `GITHUB_RUN_ID`, so a local refresh edits the three files directly.

Starfall still uses a full web export:

    Godot_v4.7.2-stable_win64_console.exe --headless --path starfall-godot --export-release "Web" ../play/starfall/index.html

The engine file (index.wasm, about 38 MB) is the same for both games and between Wildbond pack refreshes, so git
stores it once; only index.pck (the game itself) changes. Windows downloads go to `Desktop\Game builds\` (not in
the repo): export with `--export-release "Windows"` and zip the folder.

Wildbond’s 2026-10-10 pack refresh and exact-build verification are documented in [wildbond/BUILD.md](wildbond/BUILD.md).
