# WBW-13: item and berry spots for the 20 routes and the 7 caves

This is a planning file, not data the game loads. The contract is [the WBW-13 guest row](../guest-backlog.md) and section 2 of [the world design](../wildbond-world-design.md): the Routes (20) table, "Caves and depths (7)", and the Grove Wake row of section 1, whose thickets "hide a bend and a patch of berries". Only this note, `finds.json` and `tools/test_wildbond_world_finds.py` belong to this task. Existing game data is read, never modified.

## Shape

The root has `schemaVersion`, `source`, `status` (`proposed`), `items` and `finds`. `finds` is a flat list of 50 spots. Each has an `id` (`<place>-<n>`), a `place` (a route id from the design's table, or a cave id from `world-graph.json`), an `item`, a `count`, a `gate` and `status: "proposed"`. `gate` is `null`, or the id of a field-lesson record in `gates.json` whose own `place` is the same place. There are no tile positions: where a spot lies is the map pass. Every spot is a proposal.

## Items

The five items are the ones the game already hands out as pickups: `lures` and the foods `berries`, `fish`, `grain` and `meat` (`MAPS[*].items[*].give` and `FOODS` in `wildbond.json`). Coins are money and not a find here. The Lantern seed is a 90-coin shop food that no map hands out. Lesson slips stay in `lessons.json` (WBW-10) and are never repeated here. The test rejects anything outside the five.

## Counts

A find never beats the biggest single pickup of its kind already on that country's maps. The test reads `MAPS` and takes, per country, the largest lure pickup and the largest food pickup (Thornwood 3 and 5, Saltmarsh 3 and 5, Emberfall 5 and 5, Cloudglass 5 and 6, Stillreed 6 and 8, Hollowecho 6 and 8, Sunthread 6 and 8, Farwatch 8 and 8). A route's country is its WBW-5 country, or the design's for the four routes WBW-5 does not cover (Thornwood Trail, Saltmarsh Road, Glassfall, Crest Path). A cave's country is the one the design sets it in: Knothollow and Larkburrow in Thornwood, Keelcave off the Saltmarsh side of Greywash Sound, Kilnvent on Ashstair in Emberfall, Lowbell under Stillreed's channels, the Answering Ways in Hollowecho and Trialstair in Farwatch. Totals: 62 lures, 52 berries, 27 fish, 16 grain and 14 meat.

## Gates

Seven finds sit behind a lesson, each at a place where `gates.json` already has a field record for it:

- `thornwood_route-thickets:field:grove` and `rootwater-thickets:field:grove` hold berries, as the design's thickets do (the test checks both);
- `knothollow-deep-cracks:field:stone`, `answering-side-cracks:field:stone` and `trialstair-cracked-landing:field:stone` hold supplies behind Stone Break;
- `kilnvent-deep-room:field:lantern` holds lures past the first room;
- `lowbell-flooded-floor:field:tide` holds lures on the flooded floor.

Every one of the 27 places has at least one find with `gate: null`, and any place with a gated find has at least two finds, so an early player always finds something. A route's own entry gate (Glide for Glassfall, Tide Ride for the Greywash links) is not a find gate: a spot at Glassfall is open, and you only get there with Glide. A gated find uses a record at its own place, so a door between two places (such as Larkburrow's through-path) cannot gate a find.

| Place | Finds | Gates |
|---|---|---|
| `thornwood_route` | 3 berries (gated), 1 lures | `thornwood_route-thickets:field:grove` |
| `millgrass` | 2 berries, 1 lures | none |
| `dewcut` | 2 berries | none |
| `rootwater` | 3 berries (gated), 2 lures | `rootwater-thickets:field:grove` |
| `saltmarsh_route` | 2 fish | none |
| `wrackline` | 3 fish, 2 lures | none |
| `ashstair` | 3 meat, 2 lures | none |
| `sootpath` | 4 meat, 3 lures | none |
| `passfoot` | 4 berries, 3 lures | none |
| `glassfall` | 2 berries | none |
| `crestpath` | 3 lures, 3 berries | none |
| `longboards` | 5 fish, 3 berries | none |
| `orchardfen` | 5 berries, 3 grain | none |
| `latepath` | 4 berries, 3 lures | none |
| `flintcut` | 3 lures, 3 berries | none |
| `ribbonroad` | 5 grain, 4 berries | none |
| `sheltermile` | 4 grain, 4 lures | none |
| `chartroad` | 5 lures, 3 fish | none |
| `seaward` | 6 fish, 4 lures | none |
| `trialroad` | 6 lures, 5 berries | none |
| `knothollow` | 2 lures, 3 berries, 4 meat (gated) | `knothollow-deep-cracks:field:stone` |
| `answering` | 4 berries, 4 lures (gated) | `answering-side-cracks:field:stone` |
| `kilnvent` | 3 meat, 5 lures (gated) | `kilnvent-deep-room:field:lantern` |
| `keelcave` | 4 fish | none |
| `larkburrow` | 2 berries | none |
| `lowbell` | 4 fish, 5 lures (gated) | `lowbell-flooded-floor:field:tide` |
| `trialstair` | 4 lures, 4 grain (gated) | `trialstair-cracked-landing:field:stone` |

## What this does not decide

- **Larkburrow's first room.** `larkburrow.json` (WBW-9, #538) has an empty `items` list because the design puts only Nora's wooden bird there. This file proposes 2 berries in the first room, which is a separate layer and not a contradiction, but the dev lead should keep or drop it.
- **Where each spot is, and how it looks.** The map pass places them. Nothing here says how a spot is drawn, whether a find respawns, or whether it is one pickup or several.
- **The existing pickups.** The 28 pickups placed on the game's maps (coins, lures, berries, foods) are not repeated. Coins are not a find here, so the coin pickups on Thornwood Trail and Saltmarsh Road stay as they are.
- **Price and balance.** These are floors to read against the shop (5 lures cost 50 coins), not tuned values. The ceiling rule only keeps a find from beating what a map already gives.
- **Water-route caves.** Keelcave and Lowbell sit behind Tide Ride at their entries, so their ungated finds are reachable only by a tamer who already has it.

## Validation

Run from the repository root:

```sh
python3 -m unittest tools/test_wildbond_world_finds.py
python3 tools/wildbond-export-freshness.py --base origin/main --head HEAD
```

The standalone checker reads the game's data, the design, `world-graph.json`, `gates.json` and `route-encounters.json`. It checks that every item id exists in the game's item data, every gate id is a field record in `gates.json` at the find's own place, every route has a find, no gated find is the only one at its place, every place is one of the 20 routes or 7 caves, counts are whole numbers within the country ceiling, and the thickets hold berries. About 60 broken copies must fail, and so must changed foods, pickups, gates, graph kinds and design table. Strict JSON loading rejects duplicate keys and non-finite numbers. Nothing is added to CI.

This PR makes no engine, runtime, save-format, art, shared-file or pack change. Normal CI and the PR body carry the final-head evidence; a data test passing does not mean the spots are in the game.
