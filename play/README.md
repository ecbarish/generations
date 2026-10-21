# Web build of the Godot game

Starfall is exported from `starfall-godot/` with Godot 4.7.2 (single-threaded web template, so it runs on
GitHub Pages without special headers).

From the repository root, with Godot 4.7.2:

    Godot_v4.7.2-stable_win64_console.exe --headless --path starfall-godot --export-release "Web" ../play/starfall/index.html

On Linux or in GitHub Actions, use the official `Godot` 4.7.2 binary. Windows downloads go to `Desktop\Game builds\` (not in
the repo): export with `--export-release "Windows"` and zip the folder.

Wildbond's web build moved with the private Wildbond project and is not in this repository.
