# Wildbond round battle study

Double-click **Play Battle Study.bat** in this folder. It uses Evan's installed Godot; on another computer set `GODOT` to the Godot 4.7.2 console executable. Alternatively run:

```powershell
& 'C:\Users\evanb\Godot\Godot_v4.7.2-stable_win64_console.exe' --path wildbond-godot res://tests/battle_slice/play.tscn
```

Click commands, or use arrow keys/Tab and Enter. Escape returns from moves/party. N mutes sound. Motion can be disabled on the command screen. Continue advances a line immediately; otherwise it advances after reading time. Fight selects a move; hover/focus explains power, element and accuracy. Switch spends a turn. Berries restore half maximum health. Weakening the foe makes catching more likely. Run ends the encounter; Try Again resets the study.

This native desktop prototype is **separate from the adventure**. It never reads or writes a journey. Capturing does not add a creature to a saved party. It is excluded from the committed web export, so opening the public game does not show it.

`rounds.gd` owns combat state and seeded randomness, without nodes, timers, file access or drawing. `view.gd` consumes one applied event at a time, showing its health change and message together. `fixture.gd` adapts real species/stat/move data into copied combatants and restores `Rules.DATA`. A later 3D renderer can consume the same event interface.

The study reuses Muse's supplied background and Cindercub front. **Bogsnap follows Evan's selected `15642.jpg` model sheet**, using a reference-derived transparent Battle Back representation in `approved_bogsnap/`; the ZIP's different Bogsnap and clipped idle extracts are reference-only. Glimmerwing keeps its existing back painting. Bogsnap uses optional gentle whole-sprite motion. Existing sound effects are reused. See `approved_bogsnap/README.md` for the authoritative reference, asset/prompt provenance and hashes, and `muse/README.md` for the source package. This is not production art approval.

This study uses Wildbond's current seven elements and 1.5/0.67 effectiveness. Damage flooring and 1.5 STAB, plus the catch-value/four-shake probability calculation, are now adapted from the supplied Muse functions and checked against original-JS fixtures. The selected demo's placeholder type chart is not imported into the game. It adds rounds, explicit speed ordering, accuracy, finite move uses, switching and command priority. It is **not yet the complete Pokemon ruleset**: abilities, dual typing, status-turn execution, critical hits, trainer/doubles rules, XP/evolution and adventure integration remain separate work. Orb-tier/timing controls and animated catch shakes have not yet been ported; native catching uses the existing three-lure supply and basic timing. The selected attack definitions use their name, power, element and damage category; legacy cooldown/status fields are not executed. Deep Drag is an explicit **study-only** 85-power / 80%-accuracy / 10-use risk/reward variant. Other selected moves are 100%-accuracy / 20-use. Original definitions, individuals, spawn tables and saved battles are unchanged.

Checks:

```powershell
# Pure rules plus real keyboard/menu geometry
Godot --headless --path wildbond-godot --script res://tests/battle_slice/runner.gd
# Also included in the normal Godot rules suite
node tools/run-all-checks.cjs
# Actual rendered pointer flow through moves, switching, escape, retry and victory
Godot --path wildbond-godot --rendering-method gl_compatibility --script res://tests/battle_slice/capture.gd -- C:/absolute/output/folder
```

The focused runner passed **1,433 checks**, including the Muse math comparisons, selected asset/reference hashes and a full-cycle check that rejected poses never enter playback. Human enjoyment and physical-phone acceptance are still unverified. Next gate: Evan plays the study and judges readability, pace and whether move/switch choices are interesting before promoting it into adventure encounters. A two-creature 3D comparison can then reuse the rules without converting the overworld.
