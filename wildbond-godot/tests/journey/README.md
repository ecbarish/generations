> The launcher now opens the measured **Larkhaven–Thornwood chapter**. Its [controls, routes, save policy and limits](../opening/README.md) supersede the generic town/trail presentation below. The old scene remains available for regression checks and does not contain the new geography.

# First Journey: persistent Pokemon-party pilot

Open **Play First Journey.bat**. Evan's existing private pack supplies the animated trainer, three Pokemon, directional followers and battle front/back views. Choose Pidgey, Vulpix or Wooper, explore the town, enter the southern trail, catch a Pokemon and bring the party back to the Center. These three are the installed pilot roster, not the final starter selection.

WASD/Arrows walk, Shift runs, E interacts, B opens the bag, Escape opens/closes menus. Mouse, arrows/Tab and Enter operate choices. The menu provides Party, Bag, Storage, Journey, Save and Close. Party rows let a healthy Pokemon lead or enter storage. Storage has five entries per page and lets you withdraw into a free party slot. The party holds six; storage holds sixty. You must keep a healthy walking partner.

Catches really join the party, with overflow going to storage. A full party and full storage disable catching before a ball is spent. Victory gives 30 coins and a catch gives 20. Center healing restores HP and PP; the Mart's purchases use the shared bag/wallet. Completed battle returns preserve remaining HP and PP rather than refilling uses on every encounter. Defeat returns the restored team beside the Center. The lead Pokemon's own world animation replaces the Bogsnap follower in this pilot.

## Saves

The separate versioned file is **`user://wildbond_pokemon_chapter_v1.json`**, using the project's existing crash-safe writer and `.tmp`/`.bak` recovery. It never reads/writes the original adventure's `journey.json`. Records store unique individual IDs, species IDs, HP/PP, party/box, supplies, coins, completed encounter counters, the catch-and-return goal and a world checkpoint.

The chapter saves after partner choice, services, party/storage changes, map changes, completed battle return, periodic world checkpoints and world exit. **Press Return to Trail after a battle to commit its outcome.** Closing during a battle, including its unreturned result screen, resumes the last complete pre-battle checkpoint. Interior saves resume at the outside doorstep. Corrupt unrecoverable, oversized and newer-version saves are preserved and put the visit into unsaved mode; no default silently replaces them. A valid backup can recover a truncated primary.

## Scope

This is the first durable chapter foundation built on the existing town prototype. It is **not yet the measured Larkhaven map, original opening/story integration or full regional redesign**. It now uses source-backed Pokémon stats, dual typing, a ten-move subset, species catch rates and persistent XP/leveling. Burns, Tail Whip, Sand Attack, Mud Shot and Quick Attack have their documented effects. Full learnsets, abilities, evolution, other statuses and exact cartridge parity remain future work. Half-maximum-HP Ranch Berries and guaranteed escape are still pilot rules. Existing implicit Level 12 records migrate safely; new partners begin at Level 5.

No new artwork is generated or downloaded. Imported images remain in the optional external pack. Without it, original placeholder art makes automated/public review possible; that is not the actual private trainer/roster presentation. Existing original species, story and saves remain untouched in the adventure. New runtime files stay under export-excluded `tests/`, with no public PCK change.

## Verify

```text
Godot --headless --path wildbond-godot --script res://tests/journey/checks.gd
Godot --headless --path wildbond-godot --script res://tests/journey/checks.gd -- --private
Godot --path wildbond-godot --rendering-method forward_plus --script res://tests/journey/capture.gd -- ABSOLUTE_OUTPUT_FOLDER [--fallback]
Godot --path wildbond-godot --rendering-method gl_compatibility --script res://tests/journey/capture.gd -- ABSOLUTE_OUTPUT_FOLDER [--fallback]
```

Checks/captures create only their own process-specific chapter test saves and remove them afterward. They do not touch the player's chapter or adventure. The native capture uses a controlled low-HP encounter and deterministic catch RNG to test pointer Catch/Return, healing, saving and fresh-scene resume; it is regression evidence, not a human playthrough or catch-balance measurement. Use `--fallback` for public captures. The full suite runs quietly with `node wildbond-godot/tests/private_sprites/quiet-checks.cjs`.

## Rules update (WB-POKE-RULES)

This chapter now uses the bounded Pokémon core described in [the rules report](../../../docs/research/wildbond-pokemon-rules/README.md). Fresh partners start at Level 5. Old pilot individuals migrate at their implicit Level 12 with a separate `.pre-v2` backup and retained identities, HP/PP fractions, supplies and progress. The filename remains `wildbond_pokemon_chapter_v1.json`; the payload is now schema 2. Do not run the old and new chapter simultaneously. The original adventure file remains separate.

Victory grants XP to the active surviving partner when returning to the trail. Party details show level and experience remaining. Only the ten documented moves, burn and three stat reductions are supported; there are no abilities, evolution or full cartridge simulation yet. Full HP/PP/status restoration happens at the Center or after defeat.

Additional focused check: `Godot --headless --path wildbond-godot --script res://tests/journey/rules_checks.gd`. Data provenance: `python -B wildbond-godot/tests/journey/normalize_data.py CACHE_DIRECTORY --fetch` (35 pinned cached inputs, no runtime download).
