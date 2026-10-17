# Thornwood atmosphere slice

Open **Play Thornwood Atmosphere.bat**. This native Forward+ scene uses real 3D Kenney scenery around sprite actors. It inherits the save-free practice encounters/bag from the private clearing. Without a private pack, original Cindercub appears instead of imported Pokemon. It never loads or writes the adventure save and is excluded from current exports.

WASD/Arrows walk; Shift runs; E meets a nearby creature; B opens the bag; N switches day/night; R toggles rain; T changes the sun angle for sunset. The existing encounter controls return to the same world position. The lanterns and fireflies brighten at night; rain darkens/wets the ground and makes pond ripples. Foreground trees fade when they obstruct the player.

The 15 GLBs are an unchanged subset of Kenney Nature Kit, CC0. `assets/kenney/License.txt` preserves the supplied notice; `sources.json` contains archive and source hashes. Runtime palettes/materials are adjusted for a forest, including removing the source exporter's metallic setting from wood/foliage. World layout and shaders are authored for this study. No PBA scene or shader code is copied.

Forward+ adds SSAO, screen-space reflection and glow. Compatibility also runs, with those effects disabled. This is not a browser delivery or performance acceptance test. Water currently uses an opaque animated material, sky/screen reflections and shore colour; it has no underwater view, swimming, refraction, streaming current or planar reflection. Fog is regular distance fog, not volumetric shafts. Lanterns/fireflies and splash rings are simple study geometry. The scene uses the practice party, not the journey's real map/NPC/quest content. No evolution/art reassignment occurs.

Focused checks:

    Godot --headless --path wildbond-godot --script res://tests/thornwood_environment/runner.gd
    Godot --headless --path wildbond-godot --script res://tests/thornwood_environment/runner.gd -- --private

The normal repository suite can be run silently through `node wildbond-godot/tests/private_sprites/quiet-checks.cjs`. Native capture uses `--script res://tests/thornwood_environment/capture.gd -- ABSOLUTE_OUTPUT_FOLDER [--fallback]`; never publish captures containing private Pokemon art.
