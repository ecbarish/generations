# First Journey: persistent Pokemon-party pilot

Open **Play First Journey.bat**. Evan's existing private pack supplies the animated trainer, three Pokemon, directional followers and battle front/back views. Choose Pidgey, Vulpix or Wooper, explore the town, enter the southern trail, catch a Pokemon and bring the party back to the Center. These three are the installed pilot roster, not the final starter selection.

WASD/Arrows walk, Shift runs, E interacts, B opens the bag, Escape opens/closes menus. Mouse, arrows/Tab and Enter operate choices. The menu provides Party, Bag, Storage, Journey, Save and Close. Party rows let a healthy Pokemon lead or enter storage. Storage has five entries per page and lets you withdraw into a free party slot. The party holds six; storage holds sixty. You must keep a healthy walking partner.

Catches really join the party, with overflow going to storage. A full party and full storage disable catching before a ball is spent. Victory gives 30 coins and a catch gives 20. Center healing restores HP and PP; the Mart's purchases use the shared bag/wallet. Completed battle returns preserve remaining HP and PP rather than refilling uses on every encounter. Defeat returns the restored team beside the Center. The lead Pokemon's own world animation replaces the Bogsnap follower in this pilot.

## Saves

The separate versioned file is **`user://wildbond_pokemon_chapter_v1.json`**, using the project's existing crash-safe writer and `.tmp`/`.bak` recovery. It never reads/writes the original adventure's `journey.json`. Records store unique individual IDs, species IDs, HP/PP, party/box, supplies, coins, completed encounter counters, the catch-and-return goal and a world checkpoint.

The chapter saves after partner choice, services, party/storage changes, map changes, completed battle return, periodic world checkpoints and world exit. **Press Return to Trail after a battle to commit its outcome.** Closing during a battle, including its unreturned result screen, resumes the last complete pre-battle checkpoint. Interior saves resume at the outside doorstep. Corrupt unrecoverable, oversized and newer-version saves are preserved and put the visit into unsaved mode; no default silently replaces them. A valid backup can recover a truncated primary.

## Scope

This is the first durable chapter foundation built on the existing town prototype. It is **not yet the measured Larkhaven map, original opening/story integration or full regional redesign**. It currently reuses Wildbond study combat proxies: seven element aliases, prototype stats/moves, catch odds and half-maximum-HP berries. It does not implement canonical Pokemon typing, abilities, XP, leveling, evolution, complete learnsets or status mechanics. Existing level 12 records are pilot values. The next data pass must migrate this version's proxy records rather than silently reject or reinterpret saves.

No new artwork is generated or downloaded. Imported images remain in the optional external pack. Without it, original placeholder art makes automated/public review possible; that is not the actual private trainer/roster presentation. Existing original species, story and saves remain untouched in the adventure. New runtime files stay under export-excluded `tests/`, with no public PCK change.

## Verify

```text
Godot --headless --path wildbond-godot --script res://tests/journey/checks.gd
Godot --headless --path wildbond-godot --script res://tests/journey/checks.gd -- --private
Godot --path wildbond-godot --rendering-method forward_plus --script res://tests/journey/capture.gd -- ABSOLUTE_OUTPUT_FOLDER [--fallback]
Godot --path wildbond-godot --rendering-method gl_compatibility --script res://tests/journey/capture.gd -- ABSOLUTE_OUTPUT_FOLDER [--fallback]
```

Checks/captures create only their own process-specific chapter test saves and remove them afterward. They do not touch the player's chapter or adventure. The native capture uses a controlled low-HP encounter and deterministic catch RNG to test pointer Catch/Return, healing, saving and fresh-scene resume; it is regression evidence, not a human playthrough or catch-balance measurement. Use `--fallback` for public captures. The full suite runs quietly with `node wildbond-godot/tests/private_sprites/quiet-checks.cjs`.
