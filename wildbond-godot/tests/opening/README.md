# Larkhaven–Thornwood chapter

Launch `../journey/Play First Journey.bat` or run Godot with `--path wildbond-godot res://tests/opening/play.tscn`.

WASD/Arrows walk, Shift runs, E interacts, B opens the Bag, Escape opens/closes the menu. Tab or the Map button opens the local map; Escape closes it. N/R/T retain the study's day/night/rain/sunset controls. The optional external pack supplies the animated trainer, three sample Pokémon, directional followers and battle front/back sprites. Without it, original placeholder actors remain available for review. No artwork is downloaded by this scene.

Speak to Maren beside the ranch, explore Thornwood north of town, catch a partner, visit the Healing Inn, then return to Maren. The inn restores HP, PP and burns. The shop sells supplies; the ranch door/paddock and menu expose party/storage. Wren in town and Bram on the trail offer optional friendly one-partner battles. Their wins persist; catches and running are disabled during these battles. Losing restores the party beside the inn and permits another attempt. The three sample species are not the final starter selection, and these adapted teams do not replace their production rosters.

The map uses the same cells as walking: Larkhaven → Thornwood is a continuous north road; Millgrass Lane branches west; Dewcut Approach branches east from the trail. The Larkburrow mouth stays blocked. Deeper Thornwood and Dewcut are visibly closed until those destinations are built. The farther Stone-partner shelf and later Stone Break + Loom Badge home shortcut are not opened or moved forward.

The chapter retains the existing separate `wildbond_pokemon_chapter_v1.json` filename and schema-two party records. New validated optional `opening` metadata holds measured coordinates, Maren/trainer results and one-time pickups. Older chapter records receive defaults and land at the measured town start; party, XP, bag, wallet and catch/healing milestones survive. Older builds can use a safe generic-town checkpoint without interpreting the new coordinates. Interior saves record the measured outdoor doorstep. Invalid world positions fall back to the town start. A future nested checkpoint version holds writes, like a future outer schema. Do not run old and new chapter processes simultaneously. The original adventure save is never opened or overwritten.

Battle outcomes commit on Return to Trail, as before; closing a battle resumes the pre-battle checkpoint. This remains a native chapter built from export-excluded tests, not a deployed replacement for the production adventure. Full registration/heritage/bond presentation, trainer teams, further regional content, evolution and visual-era progression remain future integration work. The modern rendering is a presentation preview, not a story event restoring depth early.

Checks from repository root:

```text
Godot --headless --path wildbond-godot --script res://tests/opening/checks.gd [-- --private]
Godot --headless --path wildbond-godot --script res://tests/journey/rules_checks.gd
Godot --headless --path wildbond-godot --script res://tests/journey/checks.gd -- --private
Godot --path wildbond-godot --rendering-method forward_plus --script res://tests/opening/capture.gd -- ABSOLUTE_OUTPUT [--fallback]
Godot --path wildbond-godot --rendering-method gl_compatibility --script res://tests/opening/capture.gd -- ABSOLUTE_OUTPUT [--fallback]
```

Checks create only process-specific saves and clean them up. Capture never saves and uses isolated paths, controlled battles and camera placements. It also verifies held-key walking and pointer map input. These checks do not establish human fun, mobile delivery or low-end performance.
