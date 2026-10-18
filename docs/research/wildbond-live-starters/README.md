# Playable original starters

WB-STARTERS-LIVE · Codex / Evan · 2026-10-18 · [PR #560](https://github.com/ecbarish/generations/pull/560), stacked on #559.

## What changed

The native opening chapter now offers **Mosshog, Ripplet and Cindercub** as actual original starters. Pointer/keyboard choice creates a level-five `wildbond:` species record, saves it and attaches the directional follower. Party summaries show its real stats, move PP and animated original portrait. Battles draw front/back art from the measured sprite set with the existing 16-colour/pixel-budget materials, blink/breathing and hit recoil. Wren uses the original partner with the type advantage when the player's lead is an original; existing Pokémon-led behavior remains available. Friendly trainer catching/running restrictions, reward commitment and one-time results are reused.

Existing players keep their Pokémon and can choose **Storage → Meet Starters** once. The original joins an available party slot or, if all six slots are occupied, ranch storage. The new partner does not count as a wild catch, replace/heal the existing team, spend supplies or complete Maren's catch outing. Walk Together uses the normal Lead action; Keep Lead preserves the current leader. Full party plus full storage refuses the grant without consuming it or an individual ID. A saved original-starter individual marker prevents repeated adoption, including after storing the partner. No reset or new-save instruction is needed.

Launch the existing `wildbond-godot/tests/journey/Play First Journey.bat`, or:

```powershell
& $env:GODOT --path wildbond-godot --rendering-method forward_plus res://tests/opening/play.tscn
```

The separate unsaved `tests/starter_sprites/play.tscn` remains an art audition. The actual chapter above now owns saved starter choice and gameplay. Do not run earlier/current chapter writers simultaneously.

## Original data adapter

[original-data.json](../../../wildbond-godot/tests/journey/original-data.json) records the source hash and adaptation policy. Existing original base HP, Attack, Defense, Special Attack, Special Defense and Speed come from the source `wildbond-godot/data/wildbond.json`. Grove/Tide/Ember map to Grass/Water/Fire for the chapter's type chart; starter cards show both world and rules names. Original and imported identities remain separate. The three Pokémon encounter IDs/list and their frozen canonical subset are unchanged.

Seven original hit moves are supported under distinct `wildbond:` move IDs, using original names, powers, physical/special designation and learn levels: Charge, Vine Lash, Tail Whip, Bubble Jet, Bite, Ember Snap and Flame Rush. Mosshog/Ripplet start with two moves; Cindercub starts with two and learns Flame Rush at 11. The original Tail Whip is its source's physical damage move, distinct from Pokémon's zero-power Defense-reducing Tail Whip. This avoids silently changing the original mechanic because its name resembles a Pokémon move.

Chapter policies, not new lore or cartridge claims: medium-slow growth via the existing table; catch rate 45/base XP 60; 35 PP for neutral basic attacks, 25 for the elemental basics and 15 for Flame Rush; accuracy 100%, priority zero. Original cooldown seconds do not become turn counts. Unsupported AOE, utility, guard-break and Scorched effects/learn entries are excluded rather than misrepresented. Existing neutral-IV/zero-EV chapter stat formulas, damage/type rules, berries, catching, XP/leveling, burn/healing and save commitment are reused. Evolution, full original learnsets/abilities and the rest of the original roster are outside this increment.

## Save compatibility

The filename remains `user://wildbond_pokemon_chapter_v1.json`; the checkpoint is now **schema 3** with an `original_starter` individual marker. Schema-two checkpoints are independently validated using [profile_v2.gd](../../../wildbond-godot/tests/journey/profile_v2.gd) and an untouched numerical [schema-two-data.json](../../../wildbond-godot/tests/journey/schema-two-data.json) snapshot, not the mutable expanded catalogue. Migration preserves the complete old record and adds only the schema/marker fields. A separately validated `.pre-v3` retains the first schema-two source before the upgraded write. Reopening never rotates that independent backup. A bad/unreadable backup holds writes and preserves the old primary.

Schema-one migration retains its frozen proxy converter and `.pre-v2` backup, upgrading directly to current schema. Future outer schema 4+, future opening metadata, corrupt/unreadable/oversized records and unrecoverable data keep their conservative write holds. Earlier schema-two builds already reject schema 3 before backup recovery; the version bump prevents those builds from rolling back an original-bearing primary to a Pokémon-only backup. Concurrent old writers remain prohibited.

The original adventure `journey.json` is untouched. Mixed original/Pokémon IDs, HP/status/PP/XP, party/storage order, wallet/items, precise chapter metadata and trainer/item results survive. Schema-two validation remains valid even if the current catalogue is changed in a test. New balance/data changes must respect this saved contract rather than editing old validation snapshots.

## Verification

- **69 integration checks pass** in headless and final native Forward+ private / Compatibility fallback renderer runs. Coverage: source stats/own move identities, growth, type interaction, validated v2→v3 preservation and independent backup, mixed party reload, future/corrupt holds, legacy backup recovery, one-time/capacity-safe adoption, actual old-player Storage offer/lead/store transitions, original→Pokémon shader reset, real pointer selection for all three, original party summaries, actual trainer art/turn/win/XP and saved results.
- Existing **45 rules/migration**, **48 private journey**, **50 opening**, **88 summary** and **328 actor** checks pass. All 28 repository suites pass, including Wildbond 26,976/0, Starfall 488/0, the unchanged 189-species catalogue and 23 save names. Tests only use process-specific profiles and remove their primary/spares/migration backups; they never open the real player profile.
- Native Forward+ private starter choice/summary/battle views and Compatibility fallback views were visually inspected. [Public starter choice](captures/starter-selection.png), [Ripplet trainer battle](captures/ripplet-battle.png), [Cindercub summary](captures/cindercub-summary.png) and the other named captures use original/fallback art only. Actual private-world evidence remains external at `C:/Users/evanb/AppData/Local/Temp/wildbond-live-starters-private/`. No source PNGs changed and no Pokémon artwork/capture is added to Git.

Commands:

```text
Godot --headless --path wildbond-godot --script res://tests/opening/starter_checks.gd [-- --private]
Godot --path wildbond-godot --rendering-method forward_plus --script res://tests/opening/starter_checks.gd -- --private --capture ABSOLUTE_EXTERNAL_OUTPUT
Godot --path wildbond-godot --rendering-method gl_compatibility --script res://tests/opening/starter_checks.gd -- --capture ABSOLUTE_PUBLIC_OUTPUT
```

This remains the native/export-excluded chapter, not a published production replacement. The approved concept identities are unchanged; final sprite art acceptance is separate from successful gameplay integration. No regional geometry, mystery clue, original story progression or production export was changed. Claude's proposed parallel scope is [review-only sprite feedback](CLAUDE-TASK.md); Codex owns this integration. Next gameplay expansion remains the connected Thornwood expedition, after concrete play/review findings are addressed.
