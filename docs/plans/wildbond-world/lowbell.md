# WBW-15: Lowbell, cave layout and encounters

This is a planning blueprint, not a map the game loads. The contract is [the WBW-15 guest row](../guest-backlog.md) and sections 1, 2, 3, 5 and 7 of [the world design](../wildbond-world-design.md) (cave 6, WB-WORLD-3). Only this note, `lowbell.json` and `tools/test_wildbond_world_lowbell.py` belong to this task. Existing game data is read, never modified. It follows [WBW-2's `knothollow.json`](knothollow.md) and [WBW-4's `answering.json`](answering.md) for the map entry, and its door and key are the ones [`gates.json`](gates.md) (WBW-6) already lists at `lowbell`.

## Schema

The envelope has `id: "lowbell"`, `map`, `gates`, `markers`, `layout` and `integration`. The `map` has the same eight fields as Knothollow's: `name`, `biome` (`stillreed`), `start`, `rows`, `exits`, `signs`, `items` and `wild`. Coordinates are zero-based `[x, y]`. A start also has a direction. The grid is 26 by 16 tiles and uses only existing TILES glyphs: `#` wall, `.` floor, `"` encounter patch, and `S` for the exit tile. Collision comes from the current `TILES[*].solid` values. The gate and marker are overlays on that grid, never new glyphs.

The one exit keeps the current MAPS field names `to`, `x`, `y` and `dir`, plus `landing: "planned"` with all three set to null, as the approved format does. The landing is not placed here. `python3 tools/test_wildbond_world_lowbell.py --runtime-landings` must exit 1 for now, and the unit tests cover that.

## The layout

Below, `#` is wall, `.` floor and `"` an encounter patch. The letters are overlays from the file and are not tiles: `@` the start, `G` the flooded floor (the nine tiles that need Tide Ride) and `B` the bell-count spot. The ruler is the x coordinate.

```
    01234567890123456789012345
 0  ##########################
 1  ##########################
 2  ##########################
 3  ##########################
 4  #################........#
 5  #################....."".#
 6  ##..........#####....."".#
 7  ##."".......#####........#
 8  ##.""........GGG.....B...#
 9  ##......"""..GGG.........#
10  ##......"""..GGG...""....#
11  ##..........#####..""....#
12  ###.#############..""....#
13  ###.######################
14  ###@######################
15  ###S######################
```

- **The mouth** is the single `S` tile in the bottom row (row 15, x 3), 16px wide. The design says the flooded stair is one tile wide for the tamer and a Tide partner, so the stair is a column of three floor tiles with a wall on both sides (rows 12 to 14). `start` is (3,14), facing up. Lowbell is a dead end: this is its only exit.
- **The landing** is the dry hall at the top of the stair: ten by six tiles, with two encounter patches. It needs no key once you are inside, because arriving at all already took Tide Ride (the `quietchannels--lowbell` link is gated, see below).
- **The gate** is one record, `lowbell-flooded-floor`, key `field:tide`: the nine tiles at x 13 to 15, y 8 to 10, which span the whole passage between the landing and the bell chamber. The `beyond` witness is (17,9). The design says the floor needs Tide Ride, and `gates.json` already lists exactly this door (`spot: "The flooded floor"`, phase 6). The flooded floor is modelled the way WBW-4 models its gates: walkable tiles with an overlay. The design's rideable water is a new tile that does not exist in `TILES` yet, and `~` stays solid, so no new glyph is invented.
- **The bell chamber** is the hall beyond the floor, eight by nine tiles, with two encounter patches. It is wholly behind the gate.
- **The marker.** `bell-count` is the one marker, for the `sq-lowbell` errand. It sits at (21,8) in the chamber and is a listening spot, not a creature or a battle. It matches the errand's `listen` step in `errands.json`: the step needs `field:tide`, no badge, the maps `quietchannels` and `lowbell`, and writes `sq:sq-lowbell:step = 1`. The count is then turned in to Veslin in Bellstep (the `hollowecho` map), the errand's `report` step. There is no guardian marker: Stillwake stays on the surface at the Reedhold jetty.

## Encounters

`biome: "stillreed"` keeps the current `BIOMES.stillreed` level band of 46 to 60. `wild` is the Tide and Gale species of the Stillreed pool, at the weights they already have there: the pool is `BIOMES.stillreed.wild` plus `evolution.json.wild.stillreed`. That gives Reedlet 24, Siltjaw 18, Rillwhisk 18, Gustreed 16, Glassbill 3, Laughrill 5, Fordfoal 5, Reedmaw 2, Channelwyrm 2, Gustchorus 2 and Shellsong 2 (relative weights, total 97). It leaves out Orchardroot, Duskcord, Dawnfoal, Orchardcrown and Seedshroud, which are Grove, Shade and Radiant, to suit a flooded cave. Every species exists in the catalogue. Stillwake, a Legend and unique, is not in `wild`. The test rejects any Legend or unique species, reads the tier from the merged `SPECIES` each time, and also rejects Stillwake by name. `signs` is `{}` and `items` is `[]`: the design gives no cave sign text, and item and berry spots live in WBW-13's `finds.json`, not here.

## Things the Dev Lead should look at

1. **The level cap.** Stillreed's 46 to 60 tops the 4-badge cap of 55 and sits far above the 35 cap after the Tide Badge, which is when Tide Ride is taught. This note only records it. The clamp, and the water-route bands, belong to WBW-16 and the map owner.
2. **The ring count is mine.** The row says the cave "holds the bell-ring count", and the design never says how many rings. I used 4, a placeholder the test only requires to be a small positive integer. Change it to the number you want Veslin to hear.
3. **A one-tile stair means no mounts.** The design gives Lowbell a one-tile stair and 32px of air, so `layout` is a 16 by 32px mouth, a 32px ceiling and `mounts_allowed: false`, and the test shows a 2 by 2 body cannot fit. The mounts wait on the 2 by 2 pad at Reedhold's jetty, which is Reedhold's map, so it is not placed here. `integration.jetty` records both facts.
4. **The graph has no jetty link.** The design says the flooded stair shows from Reedhold's jetty. The world graph links Lowbell only to `quietchannels` (gated by Tide Ride), and the Quiet Channels to `stillreed`. So the exit goes to `quietchannels`, and the jetty's view is a painter's and map owner's job. I did not edit the graph.
5. **The landing is unplaced.** `quietchannels` is a planned water route with no map yet, so the exit's `x`, `y` and `dir` stay null.
6. **Finds are not placed.** WBW-13's `finds.json` (#540, not merged) gives Lowbell two spots by place id, fish with no gate and lures behind `lowbell-flooded-floor:field:tide`. This layout has no item tiles, so the map pass puts the fish on the landing and the lures in the chamber.
7. **My choices where the design is silent**: the room sizes, where the patches sit, where the floor and the listening spot are, and the water-only encounter subset. Move any of them, and the test will tell you if a rule breaks.

## Validation

Run from the repository root:

```sh
python3 -m unittest tools/test_wildbond_world_lowbell.py
python3 tools/wildbond-export-freshness.py --base origin/main --head HEAD
```

The standalone checker validates the strict planning schema, rectangular rows, TILES glyphs, a non-exit start, a BFS from the start that reaches every walkable tile, the single one-tile exit with its three-tile stair, that no second exit or open border exists, and that the exit goes only to `quietchannels` with a marked planned landing. It checks that the stair and landing need no key once inside and that the bell chamber cannot be reached without `field:tide` (the gate cannot be bypassed, and no single overlay tile opens a way round), that the gate is the door `gates.json` lists at `lowbell` with the same key, that the world graph still gates the Quiet Channels link by Tide, that the marker matches the `sq-lowbell` errand in `errands.json`, and that `wild` is exactly the Tide and Gale part of the Stillreed pool, at the same weights, with no Legend or unique species. It also rejects a mount-sized widening of the stair. 122 broken copies must fail, covering identity, exits and landings, rows and border, start, signs, items, species and weights, the gate and marker, the layout and the integration record.

This PR makes no engine, runtime, save-format, art, shared-file or pack change. A data test passing does not mean the cave is playable.
