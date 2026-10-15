# WBW-4: The Answering Ways, cave layout and encounters

This is a planning blueprint, not a map the game loads. The contract is [the WBW-4 guest row](../guest-backlog.md) and sections 1, 2, 5, 6 and 7 of [the world design](../wildbond-world-design.md) (cave 1, WB-WORLD-3). Only this note, `answering.json` and `tools/test_wildbond_world_answering.py` belong to this task. Existing game data is read, never modified. It follows [WBW-2's `knothollow.json`](knothollow.md) for the map entry, and its doors and keys are the ones [`gates.json`](gates.md) (WBW-6) already lists at `answering`.

## Schema

The envelope has `id: "answering"`, `map`, `gates`, `zones`, `markers`, `layout` and `integration`. The `map` has the same eight fields as Knothollow's: `name`, `biome` (`hollowecho`), `start`, `rows`, `exits`, `signs`, `items` and `wild`. Coordinates are zero-based `[x, y]`. A start also has a direction. The grid is 32 by 22 tiles and uses only existing TILES glyphs: `#` wall, `.` floor, `"` encounter patch, and `S` and `E` exit tiles. Collision comes from the current `TILES[*].solid` values. Gates, zones and markers are overlays on that grid, never new glyphs.

Each exit keeps the current MAPS field names `to`, `x`, `y` and `dir`, plus `landing: "planned"` with all three set to null, as WBW-2's approved format does. Neither landing is placed here. `python3 tools/test_wildbond_world_answering.py --runtime-landings` must exit 1 for now, and the unit tests cover that.

## The layout

Below, `#` is wall, `.` floor, `"` an encounter patch and `,` floor inside the Lantern-dark hall. The letters are overlays from the file and are not tiles: `L` the Lantern line, `K` the two side cracks (Stone Break), `H` the two wall-doors (Hush), `U` Undertone's 2 by 2 pad, and `1`, `2`, `3` the echo stones. The ruler is the x coordinate.

```
    01234567890123456789012345678901
 0  ################################
 1  ################################
 2  ###########...#...##############
 3  ###########...#...#,,,,,,,,,,###
 4  ###########...#...#,,"",,,,,,###
 5  ############K###H##,,",,,,,,,###
 6  ########UU....2...L,,,,,,,,,,###
 7  ########UU........L,,,,,,,"",###
 8  ########..###H#####,,,,"",,",###
 9  ########..##...####,,,,,,,,,,###
10  ########..##.3.#################
11  ########..##...#################
12  ########..######################
13  ######....................######
14  ######."".............."".######
15  ##...#."................".######
16  ##...K.........................E
17  ##...#.........................#
18  ######...............""...######
19  ######..."".........1."...######
20  ######...."...............######
21  ##############SSS###############
```

- **The mouth** is the three `S` tiles in the bottom row (row 21, x 14 to 16). That is 48px wide, with a clear 3 by 3 block above it (48px tall), so it is the 48 by 48 mouth the design asks for, and it is not the hamlet's reveal tile (19, 8). `start` is (15,19), facing up. Mounts may enter (`mounts_allowed: true`, ceiling 48px). The test walks a 2 by 2 body from the mouth to Undertone's pad with no field key.
- **The first hall** is `lit-hall`: the wide chamber behind the mouth, the root-lined bend north of it, and the corridor east to the Lantern line. It needs no field key. Both exits are in it, so the Flintcut link (which has no gate in `gates.json`) stays open.
- **Gates** (five records, one per obstacle, three keys). `answering-dark-hall` is `field:lantern`: the two tiles at x 18, which close the corridor to the **Lantern-dark hall**, a dead-end hall of ten by seven tiles. `answering-side-cracks` is `field:stone`: two single-tile cracks, west of the hall and north of the corridor, each into a small empty niche. `answering-wall-doors` is `field:hush`: two single-tile doors off the corridor, which look like wall until opened. Each gate's `beyond` tile is a witness the test must not reach with that key missing.
- **Zones** are rectangles, not tiles: `lit-hall`, `lantern-dark` (the whole hall behind the Lantern line) and `hush-doors` (exactly the two door tiles).
- **Markers.** `undertone-return` is a story-only marker for `undertone` at the first bend, the corner at (8,6) where the passage from the hall turns from north to east, with a 2 by 2 pad. It does not spawn a creature or start a battle. There are exactly three `echo-stone` markers for `sq-senna-stones`: stone 1 in the first hall at (20,19), stone 2 in the corridor at (14,6), and stone 3, the last, in the south wall-door's niche at (13,10), behind `field:hush`. The first two need no key.

## Encounters

`biome: "hollowecho"` keeps the current `BIOMES.hollowecho` level band of 58 to 64. `wild` copies the existing seven species and weights unchanged: Hushpup 24, Umbrelace 18, Flintroot 18, Ledgewhisk 18, Bellmote 16, Dripdart 14 and Chimespark 3. Every species exists in SPECIES. Undertone, a unique, is not in `wild`, and the test rejects any unique. `signs` is `{}` and `items` is `[]`: the design gives no cave sign text or pickups, so none are invented.

## Things the Dev Lead should look at

1. **The row says "bellstep" but the map id is `hollowecho`.** WBW-3's graph names Bellstep as the existing `hollowecho` hamlet. The file's `S` exit goes to `hollowecho` and the `E` exit to `flintcut`. The graph has only the `flintcut--answering` link and no link from the hamlet, though the design says the cave's mouth is in the hamlet. If you want the hamlet mouth as its own link, the graph needs a `hollowecho--answering` entry. I did not edit the graph.
2. **The level cap.** Hollowecho's 58 to 64 tops the 5-badge cap of 60 (CAP_TABLE), and the 4-badge cap is 55. This note only records it. The clamp is yours.
3. **The echo-stone quest cannot finish before Hush.** Stone 3 needs `field:hush`, which `gates.json` puts in phase 6, so `sq-senna-stones` is done late. If it should be doable earlier, a stone has to move, or the Hush door has to be earlier.
4. **The Mist Veil slip.** The design puts `slip-mist-veil` in the Answering Ways behind Hush. The row does not place it, so the north wall-door's niche is empty and reserved for it. Nothing is placed.
5. **Lantern-dark behaviour is not data here.** "Deeper halls turn you around" and the "two-tile pale path" are the painter's and the runtime's, as is the dark overlay. The dark hall is only a dead-end hall behind the gate, because the design says nothing more about it.
6. **My choices where the design is silent**: where the cracks and doors sit, the size of the niches, and which stones are in the first hall. Move any of them, and the test will tell you if a rule breaks.

## Validation

Run from the repository root:

```sh
python3 -m unittest tools/test_wildbond_world_answering.py
python3 tools/wildbond-export-freshness.py --base origin/main --head HEAD
```

The standalone checker validates the strict planning schema, rectangular rows, TILES glyphs, a non-exit start, a BFS from the start that reaches every walkable, exit, gate and marker tile, and the exits (only the 3-tile `S` mouth to `hollowecho` and one `E` tile to `flintcut`, with no other open border). It checks that the lit first hall and both exits need no field key, that every gate cannot be bypassed and does not depend on another lesson in all eight key combinations, that the Lantern-dark hall is entirely behind the Lantern line, that the zones match, that Undertone's pad is open floor at the first bend and a 2 by 2 body can reach it from the mouth, and that there are exactly three echo stones with the last behind `field:hush`. It also checks the wild table against the game (Hollowecho species only, unchanged weights, no uniques, the 58 to 64 band), that the doors and keys match `gates.json` and the graph's Flintcut link, and the strict JSON loader. Malformed fixtures and source-data drift cases run in the same command. Nothing is added to CI.

This PR makes no engine, runtime, save-format, art, shared-file or pack change. A data test passing does not mean the cave is playable.
