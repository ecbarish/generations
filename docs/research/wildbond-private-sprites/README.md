# Wildbond animation and bag follow-up

WB-PRIVATE-SPRITES, Codex / Evan, 2026-10-17. PR #549, stacked on #547. [Play/setup instructions](../../../wildbond-godot/tests/private_sprites/README.md).

The external pilot now contains 31 pinned source files: Pidgey, Vulpix and Wooper battle/overworld art, Emerald trainer walk/run sheets, two item icons, source animation data, credits and notices. The trainer has four-way facing, distance-driven stepping, Shift running and direction-preserving idle. Its original palette-zero editor colour is decoded to transparency in memory; raw bytes remain unchanged. Missing packs retain the animated procedural tamer fallback.

Bogsnap has 16 approved-design-derived animation poses: breathing/blinking idle and three walking views, with mirrored left side poses. It follows sampled player footsteps and steps only while travelling; stopping preserves its view. Battle Bogsnap also breathes/blinks. This is the first animation pass, not eight independently drawn views or final production art. [Source, measured regions, prompts and limitations](../../../wildbond-godot/tests/private_sprites/bogsnap/README.md). The first generation crowded/clipped the cells and was rejected. V2 is not an exact grid: each full-body region is individually measured, with verified transparent margins. Approved starter designs are unchanged.

B/Bag opens an in-game overlay with Berries, Balls and Key Items pockets, quantities, descriptions and a party picker. Ranch Berry retains the half-maximum-HP study heal; Bond Ball retains lure odds. Private Oran Berry/Poke Ball icons are visual aliases, not canonical Oran Berry mechanics. Healthy/fainted/invalid targets cannot consume berries. Healing can target another wounded party member; the default remains the active partner for existing commands. In battle it consumes a turn; outside battle it heals directly. HP and stock carry between encounters during the practice visit; defeat rests the party. Relaunch resets practice state. Bag focus stays inside its controls; Escape/B returns/closes it. Key Items is empty.

All three encounters reuse the turn-based study and return to the same position after escape, victory or catch. Imported stats/types remain proxies using Wildbond's seven elements. Captures are practice results, not saved party additions. The native loader rejects changed hashes, bad paths, original-species replacement, malformed metadata and invalid geometry; failed opens clear stale art.

## Verification

- All 28 suites pass: Wildbond 26,882/0, Starfall 488, Night Market 423 and 23 unchanged save names. The normal suite includes portable gait and healing-target checks.
- Focused runner: 394/0 installed pack; 104/0 missing pack. Checks include frame-rate-independent walking, wall/stop facing, small follower displacements, healthy/fainted/invalid healing targets, selected-party healing and stock, 16 complete Bogsnap regions with clear opaque-alpha margins, trainer transparency, run/item art, all creature directions and battle returns.
- Installer checks 31 pinned file hashes, six battle images, six directional animation grids and two trainer grids. Prior disposable-file corruption/repair verification remains valid; cache hash logic is unchanged.
- Native Compatibility capture exercises real held W/A/S/D and Shift, facing/idle/run, pointer world Bag → Berry → wounded Glimmerwing → one consumed berry, battle Bag/Balls/Close, Fight/moves/Run/Return and Next to each imported species. Trainer transparency and bag wrapping/minimum sizes were corrected and fresh screens inspected.
- Public fallback captures include [walking](captures/walk-up.png), [world bag](captures/bag-world.png), [party selection](captures/bag-party.png), [battle bag](captures/bag-battle.png), [battle](captures/battle.png) and [night/rain](captures/night-rain.png). These contain no private Pokemon/trainer/item artwork. Private captures stay outside Git.
- Existing export rules exclude tests and these assets. Production files, species IDs, save schemas and the public PCK are unchanged. Final CI and handoff are recorded on #549. No author merge/publication.

## Limits

This is a save-free native prototype, not the adventure/browser build. Trees/terrain remain procedural placeholders. There is no complete item catalogue, shopping, sorting, inventory persistence, complete canonical Pokemon combat, touch controls, finished water/occluder handling or mobile/browser performance acceptance. The no-pack tamer is still the procedural fallback. Next improve environment and approved-original animation, then integrate the tested presentation/data boundary with the real journey in a separate step while preserving story, quests and saves.
