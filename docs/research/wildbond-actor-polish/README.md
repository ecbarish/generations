# Matching NPC and creature presentation

WB-ACTOR-POLISH · Codex / Evan · 2026-10-17 · [PR #556](https://github.com/ecbarish/generations/pull/556), stacked on #555. Evan asked to use better Pokémon NPC placeholders because the procedural people looked rough beside the imported trainer.

## Completed pass

All six current chapter roles now have appearances from the same pinned Emerald source family as Brendan:

| Wildbond role | Temporary source appearance |
| --- | --- |
| Keeper Maren | Mom |
| Wren | May walking |
| Pip | Little Boy |
| Bram | Hiker |
| Healing Inn staff | Nurse |
| Shop staff | Mart Employee |

These are appearance aliases, not story replacements. Maren/Wren/Pip/Bram retain their own names, dialogue, authored anchors, interactions and saved results. Original dialogue/data is untouched. An unassigned future person uses the private forager appearance until given a deliberate role. Old procedural review actors remain only when the optional pack/role is unavailable.

Outdoor people turn toward a nearby player and use actual direction/step frames during small movements within 0.32 metres of their anchor. Motion follows travelled distance; paused/dialogue actors do not walk in place. Adults and the shorter child keep their source proportions. The nurse's four-frame source maps correctly to the shared facing interface and uses its real bow during healing. Source poses are not guessed from an equal-width sheet assumption. Per-frame used-pixel bounds establish feet, so changing a walk pose does not lift the character off the ground. NPC lighting tint agrees with the player at day/night. Labels become readable when nearby.

Pidgey, Vulpix and Wooper retain the installed eight-direction Idle/Walk animations and Platinum battle views. A stable neutral Idle pose plus the existing intended display height determines world pixel scale for each species; animated poses never resize the actor. A wild Pokémon now takes actual small steps when playing Walk and settles/faces a nearby player, replacing the earlier stationary walk-loop choice. Follower and wild presentation use the same scale policy. Foreground foliage fades more strongly around nearby actors, and service counters are waist-height so staff faces/upper bodies are visible.

This improves all **current chapter actors** and supplies reusable roles. It does not redesign/import the entire original 189-species catalogue, choose final starters or replace production NPCs in the old adventure. No new battle mechanics, party records, save fields, quests or world topology are introduced. The chapter remains native and export-excluded.

## Private intake and sources

The existing importer adds six raw indexed PNGs and two original picture/graphics-layout headers to the external pack. The source is [pret/pokeemerald](https://github.com/pret/pokeemerald/tree/731ad5bfd6e6f265508d0efcca0ba42f9dcf5881/graphics/object_events/pics/people) at revision `731ad5bfd6e6f265508d0efcca0ba42f9dcf5881`, matching the current trainer. The [importer](../../../tools/wildbond-private-sprites.py) records exact URLs, byte hashes, role mappings, canvas sizes, frame indices, used bounds and ground anchors in the external manifest. Its credits retain original owners and source provenance. No source PNG or imported-art capture is added to Git or public exports.

The pack now contains **50 verified files**, six NPC roles and the same three species. Palette-index-zero editor backgrounds decode to transparency in memory; the downloaded PNG bytes remain unchanged. The loader verifies hashes, bounded roles/grids/frame maps, whole-number bounds, actual decoded used rectangles, feet and display size before publishing the optional pack. A failed import clears NPC and creature-scale caches atomically. Older packs without NPC metadata remain valid. The nurse's four-frame canvas and child's 16-pixel canvas are handled separately from nine-frame 32-pixel adult sheets.

Run the existing Setup Private Sprites launcher to install/repair these optional roles on another machine. Offline verification remains `python -B tools/wildbond-private-sprites.py --root YOUR_PRIVATE_PACK --check`.

## Verification and evidence

All **28 repository suites pass**, including Wildbond **26,976/0**, Starfall **488/0**, the unchanged original catalogue and 23 save names. Fourteen new portable loader checks cover NPC transparency, source pose/foot/facing metadata, malformed grids/maps/anchors/bounds/scale/types/traversal/bow, atomic clearing and old-pack compatibility. The private sprite/clearing runner passes **435/0**.

The focused actor suite passes **328/0**: every role/pose and measured foot, all three species' Idle/Walk directions and stable scale, actual nearby-facing/back pose, bounded distance-driven movement and return, paused feet, all current opening/service roles, real wild displacement/settling, nurse bow with unchanged healing, day/night tint, preserved identity and external-only assets. The complete opening quest/save/trainer suite still passes **50/0**. Checks/captures use process-specific unsaved/test scenes, not the real player save. No existing save format or adventure data changed.

Native Forward+ and Compatibility captures show all six roles, the nurse bow and the three creatures; both sets were inspected. Foliage/counter adjustments were made after spotting hidden actors in the first captures. Private actual-art evidence is retained outside Git at:

- `C:/Users/evanb/AppData/Local/Temp/wildbond-actors-final-private/`
- `C:/Users/evanb/AppData/Local/Temp/wildbond-actors-compat-private/`

The named views are `town-actors`, `maren`, `wren`, `pip`, `bram`, `healer`, `healer-bow`, `shopkeeper`, and `creature-pidgey/vulpix/wooper`. Earlier private captures in `wildbond-opening-private` retain the rough-actor baseline. The public fallback still uses original art; it is not evidence of the private replacement's appearance. Rendering brightness differs between Godot backends. Human art/fun acceptance, mobile/low-end performance and publication are not claimed. Independent private visual review remains pending.

Focused commands: `res://tests/opening/actor_checks.gd`, `res://tests/opening/actor_capture.gd` (same renderer/output arguments as the opening capture), and `res://tests/opening/checks.gd -- --private`. Normal quiet aggregate, offline pack verification, Godot import, whitespace and export freshness are recorded at handoff. The existing chapter launcher opens the upgraded build.
