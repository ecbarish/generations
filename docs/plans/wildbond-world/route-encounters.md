# Route encounter tables (WBW-5)

These are **WB-WORLD-1 planning tables**, before the later open-order phase.
[route-encounters.json](route-encounters.json) supplies the sixteen routes in
[the assigned row](../guest-backlog.md#wbw-5-encounter-tables-for-the-16-new-routes).
Nothing in the game loads this file yet. No runtime map is added or changed.
No save-format, engine, art, packed-file or encounter-rate change is included.
Wildbond & Starfall Dev Lead owns the later wiring; this does not tick a playable-world acceptance check.

## Shape and source contract

The root has exactly `schemaVersion: 1`, `phase: "WB-WORLD-1"` and `routes`.
Each route has exactly `biome`, `lv: [minimum, maximum]` (inclusive integers), and
`wild: [[species, weight], ...]`. There are no gates or persisted fields here.
Each table is nonempty, has no repeated species, and has positive finite weights
with a finite sum. The authored weights total 100 for easy reading. They are
relative weights, not a promise that the engine expects percentages; rescaling
all weights together preserves the distribution.

The catalogue is the merged `SPECIES` in
[wildbond.json](../../../wildbond-godot/data/wildbond.json) and `species` in
[evolution.json](../../../wildbond-godot/data/evolution.json). A country's pool is
`BIOMES[country].wild` plus `evolution.json.wild[country]`, if that key exists.
[`main.gd`](../../../wildbond-godot/scripts/main.gd) loads the latter as `WILD_EXTRA`.
These extras are keyed by **map**, not by biome lookup: each parent country's main
map happens to share its biome ID. Thornwood has no country-keyed extra list.
The `thornwood_grove` extras remain exclusive to that pocket and are not borrowed
for these roads. No seasonal visitors or creatures from another country's table
are introduced.

The nine unique creatures stay out, even if a source table ever names one:
Elderhorn, Breakwatermane, Hearthcrown, Lanterncrest, Stillwake, Undertone,
Meadowmantle, Watchlight and Veilmote. Kilnback is also explicitly excluded by the
row, even though Emberfall's extra list contains it. Greysail is not in the source
catalogue and is not invented here. The test reads the current files each time;
source species removals, unique flags or cap changes cannot silently pass through
a cached catalogue.

## The sixteen tables

Country assignments come directly from the backlog, rather than the destination
town. In particular, Pass Foot uses Cloudglass, and Shelter Mile uses Sunthread.
The selected bands are authored subsets of the safe intersections; neighbouring
roads have different weighted distributions. No new creature habitat or story is
claimed by the weighting.

The **badge floor** is a conservative first-visit safety bound for phase one,
not a new lock to install. Its cap is read from `CAP_TABLE[badge floor]`. The
design's retained ropes and [WBW-6's gate records](gates.json) supply the order.

| Route | Country | Band | Badge floor / cap | Most likely species |
|---|---|---:|---:|---|
| `millgrass` | Thornwood | 2–5 | 0 / 15 | Seedpip |
| `dewcut` | Thornwood | 4–8 | 0 / 15 | Glimmerwing |
| `rootwater` | Thornwood | 7–12 | 0 / 15 | Bogsnap |
| `wrackline` | Saltmarsh | 12–22 | 1 / 25 | Brineskit |
| `ashstair` | Emberfall | 22–28 | 2 / 35 | Slaglet |
| `sootpath` | Emberfall | 26–32 | 3 / 45 | Ashskip |
| `passfoot` | Cloudglass | 32–42 | 4 / 55 | Shalecat |
| `longboards` | Stillreed | 46–52 | 4 / 55 | Reedlet |
| `orchardfen` | Stillreed | 49–55 | 4 / 55, conservative | Orchardroot |
| `latepath` | Hollowecho | 58–60 | 5 / 60 | Hushpup |
| `flintcut` | Hollowecho | 58–60 | 5 / 60 | Flintroot |
| `ribbonroad` | Sunthread | 62–65 | 6 / 65 | Ribbonstride |
| `sheltermile` | Sunthread | 64–68 | 7 / 70 | Hearthrunner |
| `chartroad` | Farwatch | 66–68 | 7 / 70 | Chartwing |
| `seaward` | Farwatch | 66–70 | 7 / 70 | Keeljaw |
| `trialroad` | Farwatch | 68–70 | 7 / 70 | Moorweft |

The original biome bands are Thornwood 2–12, Saltmarsh 12–22, Emberfall 22–32,
Cloudglass 32–42, Stillreed 46–60, Hollowecho 58–64, Sunthread 62–68 and Farwatch
66–72. Thus the new Stillreed, Hollowecho, Ribbon Road and Farwatch tables do not
inherit levels above their first-visit caps.

The early Rootwater walk is accessible without a badge. The Thorn Badge guards
its **Knothollow exit**, in phase two, rather than the route itself. Trial Road
is reachable from the High Watch with seven badges; the all-eight check is at
its last exit to the league before phase six, as
[the gate notes](gates.md#open-points) explain. Its encounters use
the seven-badge cap, even when the tamer has not yet earned Horizon.

## Integration decisions that remain with the map owner

1. **Orchard Fen's rope is still unspecified.**
   [World-design phase one](../wildbond-world-design.md#wb-world-1--towns-and-the-routes-between-them)
   requires Orchard Fen and Ribbon Road to stay behind the later ropes so
   Threadmeet cannot open early. Neither the merged graph nor gate list names
   Orchard Fen's exact badge and placement; their notes already flag this.
   This file safely assumes the Reedhold-side walk could open at four badges
   and caps it at 55. That does not resolve the shortcut or prove phase-one
   world reachability. The map owner must place the intended rope before wiring.
2. **The current level consumer ignores a route-level `lv`.** `_wild_table()`
   already accepts a map's `wild` pair array, but `_wild_battle()` still reads
   `BIOMES[MAPS[map_name].biome].lv`. Copying only the `wild` rows would lose the
   cap protection above. WB-WORLD-1 must explicitly consume each route's band
   and test actual encounters. For these new IDs there are currently no keyed
   WILD_EXTRA entries; avoid appending a second copy of extras already authored
   into the new table. Recheck seasonal precedence if seasonal tables are added.
3. **WB-WORLD-ORDER needs a separate encounter-level decision.**
   [The open-order phase](../wildbond-world-design.md#wb-world-order--the-later-wardens-in-any-order)
   makes the later roads reachable after Thorn and Tide, when the cap is 35.
   Cloudglass would then permit only 32–35. Stillreed's 46, Hollowecho's 58,
   Sunthread's 62 and Farwatch's 66 lower bounds exceed 35, leaving no valid
   intersection for nine routes. Warden scaling alone does not fix wild levels.
   Do not lower biome floors, add new ropes or call these phase-one bands safe
   for open order. The standalone validator rejects a consumer phase other than
   WB-WORLD-1. The future owner must choose and test a new level policy.

These are integration warnings, not requests to expand this three-file task.
The tables remain reviewable planning data while the owner resolves the future
wiring. No runtime-readiness or player balance/feel claim is made.

## Checks

Run from the repository root:

```sh
python3 -m unittest tools/test_wildbond_world_route_encounters.py
python3 tools/wildbond-export-freshness.py --base origin/main --head HEAD
```

The standalone suite checks exact backlog IDs and country assignments, the
committed design's route list, source species and extras, all exclusions, pair
shape, finite positive weights, inclusive levels and conservative badge caps.
It cross-checks the existing WBW-3 and WBW-6 files, with explicit skips only when
those files are absent. Both files are present on the base used here.

It also checks malformed nested records, missing and foreign routes, bools used
as numbers, duplicates, out-of-country species, in-country Kilnback, overflow,
source-cap/species changes, strict JSON parsing, input immutability and the
open-order incompatibility. Tables sum to 100 and differ in their authored
probabilities, while fractional rescaling is valid. The PR records exact-head
standalone output, independent review and the normal CI evidence. This new Python
suite is not automatically included in normal CI. Old-save regressions remain
in the unchanged normal aggregate; these files do not touch the loader or writer.
