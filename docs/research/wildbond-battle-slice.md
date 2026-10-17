# WB-BATTLE-SLICE: a playable round battle

Claimed by Codex for Evan, 2026-10-17, after Evan approved a sprite battle first and a separate two-creature 3D comparison later. Explicit current request; not an expansion of the old cycle.

Build one isolated, save-free Godot battle scene using existing Wildbond sprites and species. Separate deterministic combat state from drawing. First scope: one active partner versus one wild foe, move accuracy and round order, switching, a berry, catching, escape, and a result/retry screen. No new story, copied Pokemon files, purchases or mass art generation.

Owned paths: `wildbond-godot/tests/battle_slice/`, this report, PROJECTS task row and START-HERE Session log. The scene is a native playable prototype in the export-excluded test area: it does not replace the saved adventure or contend with #544's pending web pack. Base on #544 to retain #491 and #545 fixes. After hands-on acceptance, promote the rules and hook into encounters in a separate reviewed step.

Done when the standalone scene is playable with keyboard and pointer, combat checks cover real outcome and invalid-action boundaries, screenshots are inspected, and the existing aggregate remains green. A human must still judge enjoyment.

## Implemented study

The native scene now supports Fight/move selection, speed-ordered rounds, accuracy, move uses and an exhaustion fallback, switching (including forced replacement), berries, HP-dependent catch odds, escape and retry. Events apply one action at a time. Knockouts cancel pending attacks and no enemy acts while the player chooses. Invalid commands preserve supplies, state and RNG. Existing original front/back art, seven-element effectiveness and sound effects are reused.

The focused runner passes **392 checks**, including real keyboard activation, menu target geometry, both catch outcomes across 100 seeds, and completed battles across 30 seeds. A separate real-rendering run uses actual pointer presses through Fight, moves, Switch, escape, retry and victory. Seven captures are retained in `docs/screenshots/wildbond-battle-slice/`. Inspection caught and corrected overlapping native button minimum sizes, health animation carrying the previous partner's value into a switch, and a null element label.

Launch and limitations are in `wildbond-godot/tests/battle_slice/README.md`. This is a native desktop study, not a public web update or proof of human enjoyment. New status/ability/dual-type behavior, adventure rewards and encounters, private Pokemon assets and 3D are not implemented in this step. Deep Drag's risk/reward tuning is study-only; no original move definition or adventure save is changed. Existing #544 pack bytes and metadata remain untouched.

All **28 repository suites pass**, including **25,795 Wildbond checks**, Starfall 488, Night Market 423, catalogue freshness and save-name preservation. The separate focused scene/input runner passes 392. Final-head CI is pending. Reviewer merges only after dependencies and final checks pass; no author merge or deployment.

## Reuse gate before extending the study

Evan reiterated the original reuse-first direction while this study was being completed. No external engine has been integrated into this prototype. Existing Wildbond art, data and audio are reused. Do not let the small round model grow into a parallel full simulator without a concrete comparison first.

Verified primary sources on 2026-10-17:

- [Pokemon Showdown](https://github.com/smogon/pokemon-showdown/blob/master/sim/README.md), [MIT code license](https://github.com/smogon/pokemon-showdown/blob/master/LICENSE): the leading candidate for generation-aware battle rules and reference fixtures. It is a Node/TypeScript simulator rather than a drop-in Godot scene. Compare a narrow attributed rules adapter against a simulator bridge before adding full status/ability coverage. No copied code or package dependency is included here.
- [Pokemon Essentials](https://github.com/Maruno17/pokemon-essentials), [official repository license](https://github.com/Maruno17/pokemon-essentials/blob/master/LICENSE): substantial RPG systems, but targets RPG Maker XP; the current official repository uses CC BY-NC-SA 4.0. Its README excludes Graphics/Audio. Do not confuse the unrelated MIT-named repository in search results with this upstream project, or assume the engine license covers Pokemon assets. Assess whole-engine migration only as an explicit alternative to preserving Godot, not a casual plugin installation.
- [Godot PokeWilds port](https://github.com/ThomsenDrake/poke-wilds-gd): Godot 4, AGPL-3.0; describes itself as an incomplete early alpha and explicitly lists missing battle switching. Evaluate individual applicable systems if needed; not established as a more complete battle foundation than Wildbond.
- [GDQuest Open RPG](https://github.com/gdquest-demos/godot-open-rpg): Godot turn-based demo, useful for state/presentation patterns; not a finished Pokemon rules engine. The original audit #543 retains its broader comparison.

For art, retain usable generated Wildbond material and stable creature identities. Adopt third-party original fan art/models only with their applicable permissions and provenance. User-provided Pokemon appearances remain separate private packs under the original request; a public fan-game download is not a blanket asset license. A generated reference image is not an animated 3D model: rigs, animation and model consistency still need an actual asset pipeline.
