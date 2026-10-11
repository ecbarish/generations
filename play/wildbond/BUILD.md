# Wildbond preview — 2026-10-10

This pack includes the merged WD3 battle choices, WD4a Thornwood trail, WB5.1 Lighthouse Spire and Champion Warden rematches, and the workbench/caption fixes, from main `0bc8e7b`.

Only `index.pck` and its size in `index.html` were rebuilt. The Godot 4.7.2 engine (`index.js` and `index.wasm`) is unchanged. `build.json` records the source tree and the exact shipped file digests. Game code, save version and game version are unchanged in this refresh.

For a pack-only refresh, import the project with Godot 4.7.2, then run:

    Godot --headless --path wildbond-godot --export-pack Web ../play/wildbond/index.pck

Update the pack byte count in the shell. Exports can differ in bytes between clean imports, so the review workflow verifies and plays the committed pack rather than exporting a different pack during verification.

`tools/wildbond-preview-fixtures.gd` runs the real writer from pre-WD3 commit `26bd1a6f` in an isolated project. It creates synthetic old-format barn, Thornwood and Champion journeys; these are test fixtures, not player saves. Browser checks use response overrides to preload them and inspect the filesystem, never changes to the shipped game. They verify old possessions/creatures, workbench selection, actual browser-storage persistence and reload, the new trail, Spire access, a fresh one-minute journey, and phone rotation. Workbench checks cover 667×375, 1366×768, 1920×1080 and 3440×1440; the phone uses its touch action button.

Review captures are in `docs/screenshots/wildbond-preview/`, with the full set attached to the Actions run. The guide uses the current workbench capture. Review and merge remain with the maintainer; no deployment is performed by this PR.
