# Wildbond development audit and implementation plan

Task: WB-DEV-AUDIT. Claimed by Codex for Evan, 2026-10-16.

Explicit assignment: audit the current Godot project, preserve the world and saves, and propose a playable vertical slice with mixed original/imported creature support. No mass sprite generation or engine rewrite.

Baseline: `b8493ff05e08073a7255968a83d015bd520d1c28` (current GitHub main when fetched). The Desktop checkout was older (`041627e5`); this audit uses an isolated clone on `codex/wildbond-development-audit`.

Live ownership checked: #491 owns battle/input/HUD fixes and an export; #475 owns sprite-size refits; #312 is reference-only art on hold. None is treated as merged. This task owns this report and its project/session bookkeeping only.

## Recommendation

Keep the existing game. Its world, opening, encounters, raising, evolution and save handling are a substantial foundation. Concentrate development on **Larkhaven → Thornwood → the Thorn Badge → a return to the ranch**, with Saltmarsh as the next destination. Make that loop readable, responsive and worth repeating before adding creatures or regions.

Use Platinum/HGSS as the presentation and round-based battle target, with Emerald as an additional visual reference. Creature generation/art style and battle rules are separate choices: a Generation 1 creature need not use Generation 1 mechanics. Recommend one explicitly defined **Generation 4-inspired** new battle profile, not an accidental mixture of generations. Exact competitive Pokémon simulation is not required for the slice.

Evan's 2026-10-16 direction authorizes planning mixed original/imported species and private user-provided art. That changes the older original-only prototype assumption. It does not authorize publishing those imported assets. This report adds no imported assets, changes no canon and does not implement a new battle loop.

## What was audited, and what the evidence means

The inventory covers all 24 runtime GDScript files, the scene/configuration/export setup, both shaders, the three runtime JSON files, creature art coverage, the shared browser/export pipeline, existing Godot tests/fixtures and relevant world-planning data. Subsystem inspection followed startup, encounter, battle, reward, evolution, ranch and save call paths. The accompanying [inventory script](wildbond-development-audit/inventory.cjs) records script hashes/functions and exposes **every effective species' description, evolution requirements and art availability** in [inventory.json](wildbond-development-audit/inventory.json).

Run it from the repository root:

```powershell
node docs/research/wildbond-development-audit/inventory.cjs
```

This is a source/data audit with automated baseline validation. It is **not a fresh human playthrough**, a score of enjoyment, a verification of the currently deployed site, or proof every late-game route is balanced. Existing reports in [the launch checklist](../plans/launch-wildbond.md) describe a partial first session at 5/10; the open fix-bundle discussion describes later feedback. Neither supplies acceptance for this audit's future slice. The launch checklist is historical evidence, not a live list of unfixed bugs.

### Measured inventory

| Item | Current main |
|---|---|
| Effective creatures | **189**: 119 shared entries + 82 overlay entries − 12 replaced IDs |
| Battle content | **60 moves**, eight move kinds, **seven** single elements, three starters |
| World content | **15 exported maps**, **eight biomes**, eight badges, 30 exported story beats; barn and other interiors also come from Godot code |
| Creature PNG coverage | **11 battle fronts**, **two back files**, 11 overworld idle sheets and 11 walk sheets |
| Back-sprite rendering | **Absent on audited main**, despite Bogsnap/Glimmerwing back files being present |
| Source concentration | `main.gd` 5,275 lines; `battle.gd` 1,662; `phone_shell.gd` 1,168; `figures.gd` 962 |
| Save format | Journey **v2** with explicit v1 migration and newer-save protection |
| Referential checks in this audit | No missing learned moves, element IDs or evolution targets; no evolution cycles; no exact repeated nonempty dex descriptions |

The 12 species overlaps are separate overlay replacements, not repeated keys in one JSON object. Content existence and successful references do not establish design quality.

## Systems: keep, complete or add

“Functional” below means there is an implemented path, supported by the regression suite; it does not mean polished or accepted by a player.

| System | Finding | Evidence and next action |
|---|---|---|
| New Game / register / starter / Wren | Functional; repeated polish work exists | `main.gd::_ready`, `_on_signed`, `_on_chosen`, `_after_talk`; `register.gd`, `card.gd`, `howto.gd`, opening tests. Preserve heritage recognition, the fading and choosing a partner. Recheck real click/touch event flow after #491. |
| Walking / doors / NPC interaction | Functional; retain road and roof regressions | `main.gd::route`, `_go`, `_check_doors`, `_tap`, `door_taps.gd`, `roof_routes.gd`, `north_roads.gd`. Map IDs and saved coordinates are compatibility contracts. |
| Wild encounters / trainers / Wardens | Functional | `_explore`, `_wild_table`, `_wild_battle`, `_challenge`; weighted encounters and seasonal tables; trainer sight and badge gates. Early encounter pacing still needs measured play. |
| Combat scheduler | Functional **ATB**, not classic rounds | `battle.gd::_tick`, `rules.gd::atb_rate`: meters/cooldowns progress in seconds, all living allies participate, menus pause play, large enemy moves telegraph. The lead opens ready. Add a round scheduler behind an adapter; do not describe this as already Pokémon-style turns. |
| Damage / criticals / move categories | Functional custom rules | `rules.gd::damage`, `battle.gd::_resolve`; physical/special fields, spread, crits, same-element bonus, guard and area hits exist. These are Wildbond numbers, not exact Generation 4 parity. |
| Accuracy / evasion / PP / priority | Missing as general mechanics | Move fields contain no accuracy, PP or priority; `_resolve` proceeds directly to damage/effects. Add an explicit hit check before any damage/status, then turn priority/usage policy where the selected profile needs them. Missing accuracy must default to always-hit for legacy content. |
| Type effectiveness | Functional custom chart; incompatible with direct Pokémon import | `advantage` uses one `el`, 1.5×/0.67×; no dual types or chart immunity. Keep this chart for legacy battles. A separate Gen-4-inspired profile needs 17 types, dual-type multiplication and zero damage on immunity. Do not reinterpret Tide as Water silently. |
| Status / support / combos | Functional custom effects; incomplete for new rules | `battle_effects.gd`: Soaked, Scorched, Rooted, Sleep, Marked; DOTs, cleanse, guard, haste, slow, heal and combo consumption. Durations are seconds; round mode needs turn counters and a defined residual phase. |
| Traits / abilities / held equipment | Partial | Eight traits with hard-coded effects in stats, bond or damage; seven equipment definitions in `rules.gd::GEAR`; visible gear in figures/sprites. No general ability event interface. Retain these bonuses; add only the hooks and 1–2 passives the slice actually uses. |
| Catching | Functional timing mechanic | `battle.gd::_choose`, `_calm`, `_end`: lures, timing/HP-based help, guided first catch; trainers reject Catch. Preserve Wildbond's earned bond/timing identity. A Pokémon-style catch formula is optional later, not a prerequisite for imported art. |
| Party / ranch storage | Functional **three-member active team** | `_after_wild`, `_take_along`, `_on_card_pick`, `card.gd`, `book.gd`; overflow goes to the ranch, swaps happen there. No traditional six-member party with a single active battler and voluntary in-battle switching. Introduce switching for the round profile without silently expanding old parties. |
| Experience / levels / learning | Functional | `win_xp`, `grow`, `prepare_move_choices`, `move_lessons.gd`; badge caps and up to four equipped moves. Rewards use the Classic journey profile; exported alternative journey settings are not evidence of a working selection UI. Measure grind before changing payouts. |
| Evolution | Functional, including bond/context requirements and presentation | `evolution.json`, `evo_target`, `_check_evolution`, cinematic and hold/defer logic. Level, bond, raising track, place, companion, time, weather and food conditions exist. Do not re-add WB-BOND as missing. |
| Ranch / feeding / breeding / gear | Functional distinctive systems | `_place_ranch`, `_feed`, `_breed_here`, `_lay_egg`, `_egg_step`, `_open_bench`; same-family/hybrid pairing, inherited potential, hatch steps and equipped gear. Preserve and surface these through a return visit. |
| Daily training plans / creature jobs | Mostly data or future work | Export has `REGIMENS`, `TRAIN_CAP`; stats consume optional `train`, but runtime has no general daily-plan/job progression loop that applies these. Feeding, battle XP and move selection do work. Do not promise the browser's daily ranch loop in Godot. |
| Story / quests / later journey | Story progression functional; new errands not wired | Eight regions, rival/guardians, league, homecoming, post-game Spire/rematches and reveal paths in `main.gd`; `wildbond-reveal.json` is loaded. `docs/plans/wildbond-world/` holds newer graph/gates/errands/encounter proposals that runtime never loads. Preserve story flags; this data is not 47 playable places. |
| Calendar / weather / festivals | Functional | `calendar.gd`, `_wild_table`, festival paths, seasonal drawing and NPC lines. Shared copies also exist in Starfall. No need to introduce a new calendar library. |
| Menu / field book / settings / controls | Functional; large phone-specific presentation layer | `pause_menu`, `objective`, `status_bar`, `title`, `book`, `settings`, `controls`, `touch_pad`, `phone_shell`; `turn_card` is the retired rotation gate. Both portrait and landscape need acceptance. Keep all gameplay inside the world/window. |
| Sprites / animations / backgrounds | Partial; highest visual gap | `creature_sprites.gd` supports side sheets and a static battle front; `figures.gd` supplies fallbacks; lunges, hits, HP motion and elemental FX exist. No general battle front/back animation manifest. Only Emberfall/Cloudglass have dedicated highland logic; most other battles share woodland/grass rendering. |
| Music / ambience / SFX / fading | Functional | `sfx.gd`, `_music_tick`, `_ambience_tick`, `fade.gdshader`, `canopy.gdshader`. Reuse the existing sound and effects inventory/credits. |
| Save / Continue | Functional base with known hardening opportunities | `safe_save.gd`, `migrate_save`, `_fix_creature`, `_load_game`, title/Continue fixtures. Temporary/backup recovery and future-version refusal exist. Validation largely checks envelope shape; unknown imported species would reach direct dictionary indexing. Add missing-pack handling before writing imported creatures. |
| Packaging | Functional Web/Windows presets; private-pack isolation missing | Both presets export `all_resources`. Never place private sprites under `res://` and assume Git ignore excludes them from a pack. Current build manifest records source `246d62f5…`; inspect source/pack freshness with the existing tools before any release. No re-export is needed for this documentation PR. |

All runtime scripts are accounted for above: `main`, `battle`, `battle_effects`, `rules`, `safe_save`, `calendar`, `creature_sprites`, `figures`, `sfx`, `register`, `card`, `shop`, `move_lessons`, `turn_card`, `book`, `title`, `howto`, `settings`, `controls`, `touch_pad`, `phone_shell`, `pause_menu`, `objective`, `status_bar`. `tools/paint_tiles.gd` is an authoring helper, not a missing gameplay system.

### Most useful engineering observations

1. **Separate decisions from drawing first.** `_resolve` currently changes health, applies effects, creates text and triggers visuals together. A small `BattleAction → BattleEvent[]` seam makes misses, switching, abilities and sprite timing testable without replacing the world or all combat code.
2. **Do not import by move name.** Wildbond's `tailWhip` is a damaging move (power 38), unlike the expected Pokémon behavior. Names and familiar art do not establish mechanical equivalence; namespace move IDs and require an explicit conversion.
3. **Avoid broad module extraction.** Extract only the battle resolver/registry seams needed by the next ticket. Splitting 5,275 lines into many files is not itself progress toward a fun session.
4. **Preserve new world work as input.** The newer world graph intentionally keeps the 15 current map IDs. Reuse its briefs when those locations are implemented; do not replace the established world with a library's demo maps.

## Reuse: preferred code and researched candidates

Reuse `rules.gd` for existing growth/bond/breeding/evolution, `safe_save.gd` for writes/recovery, current input/settings/calendar, world data/export, procedural fallback figures and licensed FX/audio. Existing catalogue, save, opening, phone, pack-freshness and world-schema tools are more useful immediately than a replacement framework.

The following primary sources were checked on 2026-10-16. These are selection recommendations, not installed dependencies or verified ports. Pin a specific upstream revision and retain its notice before copying code.

| Candidate | Verified fit | Recommendation |
|---|---|---|
| [Pokémon Showdown simulator](https://github.com/smogon/pokemon-showdown/blob/master/sim/README.md), [MIT notice](https://github.com/smogon/pokemon-showdown/blob/master/LICENSE) | Documented Node simulation API and CLI; useful generation mechanics and test cases. Its documentation does not promise direct browser use. | Use as a **development reference/oracle** for selected Gen-4 fixtures; adapt small licensed rules with attribution where worthwhile. Do not require a Node service to play the Godot web game. A full port is a separate project. |
| [Smogon damage calculator](https://github.com/smogon/damage-calc), [license](https://github.com/smogon/damage-calc/blob/master/LICENSE) | MIT; generation-aware damage package with a server/browser API. It does not supply an RPG, catch loop or full turn resolver. | Best narrow reuse candidate for offline expected-damage fixtures and selected formula adaptation. First compare one representative physical, special, critical, resisted and immune hit. Wildbond's legacy formula remains distinct. |
| [GDQuest Godot Open RPG](https://github.com/gdquest-demos/godot-open-rpg), [license](https://github.com/gdquest-demos/godot-open-rpg/blob/main/LICENSE) | Godot 4 turn-based demo, MIT code; explicitly a work in progress and learning reference. | Borrow action/state/presentation patterns after file-level review. Not a proven drop-in monster RPG and not grounds for replacing working maps, UI or saves. |
| [Pokémon Essentials](https://github.com/Maruno17/pokemon-essentials) | RPG Maker XP project, not Godot. | Reject as the foundation: engine conversion would erase the efficiency advantage. Do not assume visible source means unrestricted reusable code or art. |
| [PokéAPI sprite layout](https://github.com/PokeAPI/sprites) and [data documentation](https://pokeapi.co/docs/v2) | Useful generation/version/front/back naming and metadata reference. | Optional offline import adapter for user-supplied files. A publicly downloadable image or API code license is not evidence that Wildbond may redistribute that image. No automatic bulk download. |
| [Godot SpriteFrames](https://docs.godotengine.org/en/stable/classes/class_spriteframes.html) and [runtime image loading](https://docs.godotengine.org/en/stable/tutorials/io/runtime_file_loading_and_saving.html) | Engine primitives already cover timed frames and local texture loading. | Prefer these to a new animation/import plugin. Preserve GIF frame durations during offline conversion to PNG sheets; runtime packs use data and image files. |

The efficient choice is **keep Wildbond's engine and adapt narrow, verified pieces**, with a deterministic test oracle. A full simulator bridge adds deployment and rules-integration work without supplying Wildbond's world, ranch or art.

## Creature-data contract

### Separate species, individuals, rules and appearance

- **Species definition:** stable identity, descriptions, family/breeding groups, stats, learnset and evolution graph. Definitions never hold current HP or XP.
- **Individual creature:** current `sp`, nickname, level, XP, potential, temperament, traits, bond, raising, training, gear, equipped moves and parentage. Preserve all of these on load/evolution.
- **Battle profile:** damage/type/status/scheduler policy. Start with `wildbond-legacy` and an isolated `gen4-inspired` profile. One battle uses one profile for both teams. Keep legacy values unchanged; an original species needs an explicit profile entry before joining a mixed round battle.
- **Appearance pack:** assets and animation metadata for an existing species. A sprite replacement need not change species identity, stats or the save format. A new-species pack registers additional definitions independently.

Use JSON as the authoring/interchange format, normalize it once into a validated runtime registry, and optionally expose typed Godot Resources at the boundary later. Keep the current browser export plus Godot overlay until the registry adapter passes parity; do not rewrite both sources at once.

### Stable IDs and legacy behavior

Canonical registry IDs can be `wildbond:bogsnap` and `pokemon:0001`, with separately namespaced moves/abilities. **Do not mass-rename existing save keys**: an adapter resolves the old bare `bogsnap` to `wildbond:bogsnap`; legacy saves continue writing their supported representation until an explicit migration is tested. IDs never depend on display names, sprite filenames or array order.

The next registry increment must normalize old fields without changing their values: `hp/pow/grd/spd/wit/spi` map to HP/Attack/Defense/Speed/Special Attack/Special Defense; `el` becomes the legacy type list of length one; missing accuracy is always-hit; missing ability means no ability. Current rarity and bond stat bonuses remain part of the legacy profile.

Example **proposed normalized definition**, not a replacement already loaded by the game:

```json
{
  "schema_version": 1,
  "id": "wildbond:bogsnap",
  "legacy_ids": ["bogsnap"],
  "origin": {"kind": "wildbond", "source_id": "bogsnap"},
  "name": "Bogsnap",
  "family": "croc",
  "description": "It waits in still water for hours without moving.",
  "base_stats": {"hp": 58, "attack": 62, "defense": 55, "speed": 35, "special_attack": 40, "special_defense": 48},
  "profiles": {
    "wildbond-legacy": {"types": ["Tide"], "ability_ids": []}
  },
  "learnset": [{"level": 1, "move_id": "wildbond:bite"}, {"level": 6, "move_id": "wildbond:bubbleJet"}],
  "evolutions": [{"to": "wildbond:stillmaw", "conditions": {"level": 18, "bond_stage": 1}}],
  "appearance_id": "wildbond:bogsnap/default"
}
```

The example learnset is abbreviated; the adapter preserves all six current lessons. No Gen-4-inspired Bogsnap typing is approved by this example. Add that mapping deliberately, along with original creatures' breeding compatibility. Imported Pokémon retain source generation, form and source dex number; private species packs provide stats, one/two types, move definitions, ability references, learnsets, breeding groups and evolution conditions. A sprite-only pack must not invent those fields.

Do not let Pokémon egg-group rules replace Wildbond's family/hybrid rules. Store separate compatibility policies. Retain Wildbond's original bond/raising/context evolution conditions; support level, item, friendship, time, party and explicit trade substitutes only as each selected imported line requires them. No need to implement every evolution method for the slice.

### Missing-pack and validation behavior

Validate unique canonical IDs/aliases, known types and moves, finite bounded stats, level thresholds, evolution targets/cycles and required appearance views. Reject an invalid new pack before changing the active registry. Public builds load built-in content only; importing is explicit.

If a previously saved private species is unavailable, preserve its full raw record and show a missing-pack notice/placeholder. Never delete it, substitute a different species or pass it to `DATA.SPECIES[c.sp]`. Keep a public-compatible backup and refuse destructive saving until unresolved team/egg records can be retained safely. A removed appearance-only pack falls back to the original artwork without changing the creature.

## Art and animation organization

**Do not move existing PNGs first.** Add manifest-backed lookup to `creature_sprites.gd`, falling back to today's filenames and then procedural figures. Accept #491's back/placement work once reviewed rather than building a competing loader.

```text
res://data/creatures/                 proposed built-in registry/manifests
res://assets/creatures/battle/        current fronts/backs retained
res://assets/creatures/               current side idle/walk sheets retained
res://assets/battle/backgrounds/
  thornwood/                         sky, far trees, ground, ally/foe bases
  saltmarsh/                         coast/sea layers, not woodland grass
  emberfall/                         reuse original ridge/steam look
res://assets/battle/effects/          future manifests; current assets/fx stays usable
user://content_packs/<pack-id>/      private data, sprites and manifest; outside res://
```

Each appearance manifest records species/form, front/back/icon/overworld paths, sheet dimensions and frame rectangles, per-frame durations, loop flags, facing, feet/baseline and visible bounds, display scale, gear/tamer anchors, source/hash and distribution classification. Use clip names `idle`, `enter`, `attack`, `hit`, `faint`; a one-frame clip is valid. Include a `back` view explicitly: **flipping a front does not create a back**. A missing back falls back visibly to the existing figure/side pose until art is supplied.

Use original dimensions, transparent padding and a logical feet anchor. Existing fronts are 64×64; imported Gen-4 assets may be 80×80 and must be fitted deliberately, not blindly stretched or cropped. Preserve pixel filtering and consistent apparent scale. Validate opaque bounds against HP panels, message/command boxes, multi-creature positions and the phone layout. Keep equipment anchors per appearance so a different-sized imported sprite does not inherit a broken harness or tamer seat.

Battle events drive hit flashes, lunges, HP drains, fainting and sound in a defined order. Input may advance the current line but must not skip the next damage/faint event. Respect reduced motion. Short authored entrance/hit frames plus existing effects are sufficient; continuous animation for 189 species is not a slice requirement.

Backgrounds are keyed by **battle environment/biome**, not creature origin. Pokémon and original creatures both stand in Thornwood or Saltmarsh. Start with two original environment profiles and reuse the highland code later. Do not import copyrighted game backgrounds.

Private packs stay outside the Git checkout and public `res://` tree, with local provenance recorded by the user. Load data/images through Godot's runtime APIs; do not load executable scripts from a pack. A desktop picker copies approved local files to `user://`; browser import uses a file-upload flow and persistent user storage, with an explicit backup/export option. Web persistence/reload must be tested, not inferred from desktop behavior.

Public export verification must assert that only permitted built-in assets enter the PCK, and that private pack IDs, image bytes and saved journeys do not enter release artifacts. Git ignore alone cannot enforce this because the current presets export all resources. Keep private save exports separate from public builds too.

## Creature direction: a small quality pass

Keep the 189 definitions and old saves. Stop expanding the sprite backlog. Use the per-species inventory to review silhouette, description, evolution payoff, habitat and combat role together; no automatic deletion or invented originality score.

| Existing line | Recommendation for the first review |
|---|---|
| **Bogsnap → Stillmaw** | Retain. Patient still-water croc, low Speed and a Tide setup/control learnset form a coherent identity. Review whether Stillmaw's silhouette visibly pays off the quiet-pool theme. Existing Bogsnap front/back makes this the best nonstarter pipeline pilot. |
| Cindercub → Smoulderpup → Blazefang | Retain as the warm, fast physical starter line. Assess all three forms together; polish existing art instead of adding another final form. |
| Ripplet → Riverwisp → Tidewyrm | Retain as the river line; distinguish the intermediate stage and keep its established bond-gated final evolution. Check long bodies, baseline and panel clearance. |
| Mosshog → Thicketboar → Thornback | Retain as the grove/boar line; emphasize an increasingly convincing moss/wood silhouette and defensive role. Reuse the open sprite-refit review. |
| Glimmerwing and selected early wilds | Inspect alongside the starters for scale and readability; choose supporting encounters from the real Thornwood table. Existing front/back files are useful, but not proof of finished animation. |
| Remaining catalogue | Preserve as data/fallbacks and triage later. Exact dex text is unique in this snapshot, but that does not establish visual or gameplay uniqueness. Do not generate a front/back pair for every entry by default. |

For the slice, polish the three first-stage starters, Bogsnap and the few actual opponents that a newcomer meets. Review later evolution art without making completion of all lines a first-session blocker. A private imported sprite pilot can use **one** supplied species/appearance; no bundle of 493 creatures is required.

## Incremental implementation roadmap

These are **proposed follow-on tickets**, not newly claimed backlog work. Preserve the current launch/world owners and cycle quota; PM can bundle only where the work remains safe and reviewable. Each row ends with tested behavior, and a release gate remains separate from a merge.

| Order / ticket | Small deliverable and likely files | Depends on | Acceptance |
|---|---|---|---|
| **0 — WB-DEV-AUDIT (this PR)** | Report, all-species diagnostic inventory and baseline evidence. No gameplay/export/save changes. | Current main and live ownership check | Counts and references reproducible; existing aggregate run recorded with honest limits. |
| **1 — WB-SLICE-BASELINE** | Reconcile #491/#475 through their owners; reproduce opening, menu, message, catch, north-road and Continue behavior on the selected source and exported pack. Use existing opening/phone/pack tools. | Reviewed fix bundle/art as applicable | Same tested source and pack; all three starter openings reach first catch without help; no action fires twice; HP/text agree; real quit/Continue returns safely. Fix only reproduced failures. |
| **2 — WB-REGISTRY** | Add a read-only registry/legacy adapter and definition validation, leaving the old save and gameplay fields intact. Narrow new scripts/data tests; do not re-author the catalogue. | 1 for integration; can develop with synthetic fixtures earlier | All 189 species normalize with unchanged stats/moves/evolution results; aliases collide safely; bad definitions fail cleanly; a synthetic imported species can coexist. |
| **3 — WB-BATTLE-ACTIONS** | Extract a deterministic action resolver/event list from `_resolve`; keep current ATB scheduler and renderer working. Inject RNG rolls. | 2 | Fixed-seed legacy outcomes, rewards, status/gear/bond interactions and catch behavior stay equivalent; action events present once in order; no save changes. |
| **4 — WB-ROUND-SLICE** | Add round command collection, one active creature per side, target/switch choice, action priority/Speed ties, hit checks and residual phase behind the new profile. Keep current party capacity initially. | 3 | One complete wild and trainer fight; no real-time timers decide round outcomes; a miss applies neither damage nor status; faint/catch/end stop remaining invalid actions; switch costs the defined turn. Legacy battles still pass. |
| **5 — WB-TYPES-STATUS** | Gen-4-inspired type table, dual types, 1–2 useful statuses and passive hooks; define PP/limited-use policy and a safe fallback action if all moves are unavailable. Add only the slice's moves/passives. | 4 | Neutral/resisted/super-effective/immune fixtures; physical/special distinction; end-turn status timing independent of frame rate; cleanse/faint/order interactions; one passive triggers once at its documented hook. No claim of full Gen-4 parity. |
| **6 — WB-APPEARANCE-PACK** | Manifest-backed front/back animation and one local user-provided appearance/species pilot, plus one original (Bogsnap). Runtime file import, registry and missing-pack behavior. | 2; sprite placement from 1; events from 3 | Idle/enter/hit/faint play with stable feet and gear; missing art falls back; malformed manifest fails before activation; reload preserves private creatures; public PCK inspection contains none of the supplied private files. Desktop first, web acceptance separately. |
| **7 — WB-SLICE-LOOK** | Thornwood and Saltmarsh original battle environments; consistent command/text/HP layout and selected creature motion. Reuse current FX/audio. | 3, 6 | Desktop 1366×768 and 1920×1080, ultrawide 3440×1440, phone portrait 390×844 and landscape 844×390: no overlap/cropping, clear facing, readable moves/results, keyboard/mouse/touch usable. Art director review. |
| **8 — WB-SLICE-PACING** | Tune the existing first route/Warden/return loop; surface feeding, swap, gear and move selection. No new region, quest canon or daily-jobs system. | 4–7 | New player reaches partner in ≤3 minutes; measure first battle/catch/badge and healing gaps; first badge aimed at a 30–45 minute session, adjusted from measured play rather than promised. Player makes a useful non-damage choice and has a reason to return to Maren. |
| **9 — WB-SLICE-ACCEPT** | Export the selected tested source once, complete regression/save/pack gates and play the slice. | 8 | Fresh save to Thorn Badge; lose/recover, catch to full party, ranch swap, learn/evolve fixture and quit/reload tested. Evan/Playtester rates fun ≥7/10 under the current launch bar and wants another session. Automated checks alone cannot pass this row. |

Steps 4–5 initially remain opt-in/testing for existing journeys. New-game default changes only after the slice passes. Keep the legacy battle profile until a tested transition preserves the intended old-journey behavior. Do not maintain two unrelated copies of the whole game; share registry, creatures, world, saves and presentation through the small seams above.

After acceptance, apply the same battle and art pipeline to **Saltmarsh**, then **Emberfall**, then later regions in journey order. Complete training plans/jobs only when the ranch return loop proves enjoyable. Broader abilities, every imported evolution method, roster expansion and a complete competitive simulator wait. Re-measure the full journey's level/bond pacing before declaring the existing eight-area content finished.

## Save and release guardrails for each increment

Keep `user://journey.json`, game identity and current map/story IDs. Preserve v1→v2 retired-form migration: Pyremane→Blazefang, Deeptide→Tidewyrm, Elderthorn→Thornback. Preserve nicknames, XP, potential, raising/hold data, eggs, gear, dex marks, badges, calendar, ranch contents and saved location. Do not revive the retired forms as new IDs accidentally.

Prefer additive defaults/registry lookup over a format bump. If a serialized battle-profile/pack field becomes necessary, explicitly version and test it before adoption; never use a new loader to overwrite a future-version save. Keep combat-only timers/status out of persistent creature definitions unless a separately tested persistence policy requires them.

Run frozen fixtures `wb-c2-pre-change.json` and `evo1-retired-forms.json`, current v2 round trips, malformed-primary/backup recovery and newer-version refusal. Add missing-pack tests for team, ranch, egg and dex entries before imported species persistence. Check a second save after import/removal to catch unintended species substitution. Existing tests use `no_save`/temporary paths; never use Evan's actual journey as a fixture.

For runtime changes, run the required aggregate suite and the affected focused checks, then validate source/pack freshness. Rebuild `play/wildbond` only in the designated export PR after main is reconciled. Keep evidence tied to full commit IDs. Merge, web-pack build, deployment and live verification are different statuses.

## Validation of this audit

The read-only inventory ran successfully: 189 effective species, 60 moves, 24 runtime scripts and **zero reference/cycle findings** within its stated scope. It intentionally reports incomplete art as coverage, not as failed content.

The full aggregate invocation finished with **26 passing suites and two failures**. One was a partial local Godot import cache left by interrupting the sandbox-blocked attempt. Completing `Godot --headless --path wildbond-godot --import` repaired that cache without tracked changes. The focused rerun then passed **19,717 Wildbond Godot checks, zero failed**, including the suite's save/migration fixtures.

The remaining failure reproduces on unchanged baseline code: **Night Market, “Ready to hire 568x320: Back and cash fit beside each other without overlap.”** It failed in both the aggregate and focused rerun. The other 26 suites passed in the aggregate, including Wildbond Classic (3,254), Starfall Godot (488), catalogue (189 species), save names (23), asset library and agent context. Thus 27 of the 28 suites have passing evidence across these runs, but **there is no all-green aggregate run**. This documentation/diagnostic task does not repair another game's layout or weaken its checks. PR #543 remains draft pending the normal check gate.

Commands and the detailed outcome are retained in [checks.md](wildbond-development-audit/checks.md). Initially the clone lacked a Playwright module lookup; using the bundled Node modules resolved that. Sandboxed Chrome could not reach localhost; the authorized unsandboxed rerun is the baseline evidence. Those setup failures are not counted as game regressions.

No game code, save format, asset, web pack or release version was changed by this task. The first implementation increment is the read-only inventory tool; battle and import systems above remain planned.
