# Larkhaven–Thornwood chapter

Launch `../journey/Play First Journey.bat` or run Godot with `--path wildbond-godot res://tests/opening/play.tscn`.

WASD/Arrows walk, Shift runs, E interacts, B opens the Bag, Escape opens/closes the menu. Tab or the Map button opens the local map; Escape closes it. N/R/T retain the study's day/night/rain/sunset controls. The optional external pack supplies the animated trainer, three sample Pokémon, directional followers and battle front/back sprites. Without it, original placeholder actors remain available for review. No artwork is downloaded by this scene.

Speak to Maren beside the ranch, explore Thornwood Trail north of town, catch a partner, visit the Healing Inn, then return to Maren. The inn restores HP, PP and burns. The shop sells supplies; the ranch door/paddock and menu expose party/storage. Wren in town and Bram on the trail offer optional friendly one-partner battles. Their wins persist; catches and running are disabled during these battles. Losing restores the party beside the inn and permits another attempt. Continue north into Thornwood town after reporting to Maren. Gate Loft restores HP, PP and burns and provides a local return point. Isolde offers a three-partner chapter challenge (Pidgey 6, Wooper 7, Mosshog 8); victory awards the Thorn Badge once and opens a short, bounded Saltmarsh approach. Defeat returns you safely to Gate Loft and permits a retry. These explicitly adapted chapter teams do not replace the canonical production rosters.

The map uses the same cells as walking: Larkhaven → Thornwood is a continuous north road; Millgrass Lane branches west; Dewcut Approach branches east from the trail. The Larkburrow mouth stays blocked. Saltmarsh beyond its short approach and deeper Dewcut are visibly closed until those destinations are built. Thornwood has two closed decorative homes; their porches are reachable, but interiors are not implemented. The farther Stone-partner shelf and later Stone Break + Loom Badge home shortcut are not opened or moved forward.

The chapter retains the existing separate `wildbond_pokemon_chapter_v1.json` filename and now writes schema-three party records. Schema-two data is independently validated/frozen and preserved in `.pre-v3` before upgrade; schema-one migration and `.pre-v2` remain supported. The saved `original_starter` individual marker prevents repeated adoption. Validated optional `opening` metadata now uses nested version two for measured coordinates, Maren/trainer results, one-time pickups, the Thorn Badge and Gate Loft visit. Before the first upgrade write, the complete validated old checkpoint is independently preserved in `.pre-opening-v2`. An invalid existing upgrade backup holds writes. Older chapter records receive defaults and land at the measured town start; party, XP, bag, wallet and catch/healing milestones survive. The frozen pre-town reader holds version-two checkpoints without writing; it cannot continue them. Current builds accept old nested version-one records without losing progress. Interior saves record the measured outdoor doorstep. Invalid world positions fall back to the town start. A future nested checkpoint version holds writes, like a future outer schema. Do not run old and new chapter processes simultaneously. The original adventure save is never opened or overwritten.

Battle outcomes commit on Return to Trail, as before; closing a battle resumes the pre-battle checkpoint. This remains a native chapter built from export-excluded tests, not a deployed replacement for the production adventure. Full registration/heritage/bond presentation, full canonical trainer teams, further regional content, evolution and visual-era progression remain future integration work. The modern rendering is a presentation preview, not a story event restoring depth early.

Checks from repository root:

```text
Godot --headless --path wildbond-godot --script res://tests/opening/checks.gd [-- --private]
Godot --headless --path wildbond-godot --script res://tests/opening/thornwood_checks.gd [-- --private]
Godot --headless --path wildbond-godot --script res://tests/journey/rules_checks.gd
Godot --headless --path wildbond-godot --script res://tests/journey/checks.gd -- --private
Godot --path wildbond-godot --rendering-method forward_plus --script res://tests/opening/capture.gd -- ABSOLUTE_OUTPUT [--fallback]
Godot --path wildbond-godot --rendering-method gl_compatibility --script res://tests/opening/capture.gd -- ABSOLUTE_OUTPUT [--fallback]
```

Checks create only process-specific saves and clean them up. Capture never saves and uses isolated paths, controlled battles and camera placements. It also verifies held-key walking and pointer map input. These checks do not establish human fun, mobile delivery or low-end performance.

## Original starters

New players choose Mosshog, Ripplet or Cindercub. These are actual `wildbond:` species records with their own bounded original stat/move adapter, follower art, summaries, battle views, XP and saved progress. Existing Pokémon parties remain intact; Storage → Meet Starters grants one original into the party or storage without counting it as a wild catch. Choose Walk Together to make it the lead. Evolution/full original learnsets remain future work. See [integration report](../../../docs/research/wildbond-live-starters/README.md) and `starter_checks.gd` for migration/selection/battle cases.

## Party summary

Menu → Party → select a partner now opens its summary: actual types, HP/condition, calculated stats, experience progress and supported move details/PP. Select moves by keyboard or pointer; Previous/Next browses the team; Back restores the party list. Lead/Store retain their existing actions and safety restrictions. Escape closes the menu. The optional private pack provides portraits. `summary_checks.gd` verifies the UI and existing profile round trip; `-- --capture ABSOLUTE_OUTPUT` saves a native capture (add `--private` only for external private evidence).

## Private actor pass

The current six NPC roles now use the same pinned Emerald source family as the player: caretaker/Mom, rival/May, child/Little Boy, forager/Hiker, healer/Nurse and shopkeeper/Mart Employee. Wildbond names/dialogue remain unchanged. The four original outdoor people face nearby players and take small distance-driven steps close to their existing anchors; dialogue/menus pause pacing. Isolde faces nearby players from her stationary Warden post using the existing caretaker appearance. Nurse uses its real four-frame mapping and bow, not the nine-frame walker layout. Adult/child canvas sizes and per-frame feet are validated. Future unnamed/unassigned people default to the private forager role until given a deliberate visual role. Missing packs keep original procedural review placeholders.

The three installed Pokémon use fixed scale derived from their neutral Idle pose and existing display-height metadata, with source timing/directions/ground anchors retained. Wild creatures play Walk only while displaced and settle near the player. Nearby actors get stronger foliage fading, and service counters are waist-height so staff remain visible. No party/save/story or battle-stat change.

`Godot --headless --path wildbond-godot --script res://tests/opening/actor_checks.gd` verifies the installed actors. `actor_capture.gd` accepts the same output/renderer arguments as `capture.gd` and shows all current roles, the nurse bow and all three creatures. Captures containing imported art stay external.

## Thornwood destination

See [implementation and evidence](../../../docs/research/wildbond-thornwood-destination/README.md). `thornwood_checks.gd` verifies connected walking, actual challenge buttons, sequential opponents, local healing, defeat/retry, one-time rewards, gate collision/reload and old-reader/future-save protection. Add `-- --capture ABSOLUTE_OUTPUT` for isolated native captures; add `--private` only for external private evidence. `profile_before_town.gd` is a frozen test-only prior reader, with its source commit recorded in the file.

## Populated centers and sight lines

Healing Inn / Gate Loft has two waiting visitors and a nurse, plus an Inn Neighbor and Trail Walker outdoors. These reuse the installed complete Pokemon NPC roles; use the real private pack to judge art quality. Eleven actors share six roles. Visitors can be spoken to without occupying door thresholds, center service approach or exit. A closer indoor camera shows the people more clearly. All six buildings fade their complete geometry/signs if they obstruct the player, follower, nearby people or an entrance approach, and return to solid when clear. Collision is unchanged. `centers_checks.gd` checks the populated rooms and camera rays; `-- --private --capture EXTERNAL_OUTPUT` creates private evidence. Without the pack, generic test art remains and battles label it TEST ART. [Report](../../../docs/research/wildbond-lived-in-centers/README.md).
