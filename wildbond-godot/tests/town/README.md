# Wildbond town study

Open **Play Town.bat** for the native Forward+ demo. It uses the same optional private sprite pack as the Thornwood clearing: Evan's installed Emerald trainer has directional walking/running. No setup or artwork generation is needed on this machine. Without that pack, the original fallback appears; public review captures deliberately use the fallback, not Evan's actual trainer.

WASD/Arrows walk, Shift runs, E uses the nearby door/counter/trail, B opens the bag, Escape opens/closes the pause menu or dismisses dialogue. Enter/Space activates a focused button; arrows/Tab move focus. Buttons also work with the mouse. N toggles night, R toggles rain, T toggles sunset; the menu offers these controls too.

Walk to the **red-roof Partner Center** and press E to enter. Walk up to the counter, press E and choose Restore. It heals the entire practice party, clears status/stages and restores move PP; the six station lights flash. Walk to the entrance mat and press E to leave. The **blue-roof Mart** works the same way: the counter sells Ranch Berries for 40 coins and Bond Balls for 75, into the shared visit bag. The study starts with 300 coins, has no earning economy, and resets on relaunch.

The southern sign leads to a short Thornwood trail. Walk toward the visible creature and press E for the existing turn-based encounter, then return to the exact world position. The south end of the trail returns to town. Party health, bag supplies and wallet stay within this visit only. Houses are exterior props with closed-door dialogue; there are no new NPC schedules, quests or adventure integration.

The town uses original procedural building/interior geometry and UI, plus the already credited CC0 Kenney foliage from the atmosphere study. It borrows Pokemon's readable red healing center/blue shop, framed dialogue, side menu, party HP and bag conventions. It does not copy a Pokemon town map, extracted building model, UI texture or font. The original bag and battle screens are reused rather than rewritten. No new third-party asset downloads occur.

This is an export-excluded native study under `tests/`; production maps, saves, species and the public PCK remain unchanged. No browser/mobile controls or performance acceptance are claimed. Forward+ and Compatibility are tested on desktop. Interiors are cutaway study rooms, not finished furnished maps with a receptionist; the fountain is a simple basin rather than a full water simulation.

## Verify

```text
Godot --headless --path wildbond-godot --script res://tests/town/runner.gd
Godot --headless --path wildbond-godot --script res://tests/town/runner.gd -- --private
```

The normal Godot suite includes the portable checks. Native capture exercises held-key walking, menu clicks, keyboard entry, pointer healing/purchasing and pointer Run/return:

```text
Godot --path wildbond-godot --rendering-method forward_plus --script res://tests/town/capture.gd -- ABSOLUTE_OUTPUT_FOLDER [--fallback]
Godot --path wildbond-godot --rendering-method gl_compatibility --script res://tests/town/capture.gd -- ABSOLUTE_OUTPUT_FOLDER [--fallback]
```

Use `--fallback` for committed captures; keep captures containing private trainer/Pokemon art outside Git. For the full suite without repeated Little Ranch narration, use `node wildbond-godot/tests/private_sprites/quiet-checks.cjs` with the same runtime setup as the standard runner.
