# WBW-11: proposed trainers for the 20 routes

This is a planning file, not data the game loads. The contract is [the WBW-11 guest row](../guest-backlog.md) and section 2 of [the world design](../wildbond-world-design.md): the Routes (20) table, and "Wardens after the first two badges" for WB-WORLD-ORDER. Section 8 says more trainers are wanted ("several on each route"), that where they stand is a map pass, and that new people go through the lore ledger before their lines are canon. Only this note, `trainers.json` and `tools/test_wildbond_world_trainers.py` belong to this task. Existing game data is read, never modified.

## Shape

The root has `schemaVersion`, `source`, `status` (`proposed`), `levelPolicy` and `routes`. `routes` has exactly the 20 ids of the design's table, in its order. Each route has `name`, `badges_first_reachable`, `recommended_badges` and `trainers`. Each trainer has an `id` (`<route>-<n>`), a one-word `name`, `status: "proposed"` and a `team` of one to three `{species, level_offset}`. There are 51 trainers and 112 creatures, with one to four trainers on every route. Every record is a proposal. There are no lines, no tile positions and no sprites. Where a trainer stands, what they say and how they look are the map pass and the lore ledger.

**No Wardens and no named story characters.** The test rejects any name that is a Warden, a `CAST` member, a story or filler name, a placed person on any map, or any word that appears in the design or in the other files under `docs/plans/wildbond-world/`. Names are single invented words, 51 of them, all different. Trainers that the game already places (Bram on the Thornwood Trail, Cato and Marit on the coast, and so on) are not in this file and are not counted. The 16 that exist stay where they are.

## Levels are offsets from the cap

A level is `CAP_TABLE[badges held when the battle starts] + level_offset`. The design picks the level when the battle starts, so only the offset is stored. Every offset is a whole number, zero or below, so no trainer is above the cap for the count the tamer holds. Within a team the offsets never fall from lead to ace.

The offsets are anchored so that, at the route's `recommended_badges`, the levels fall inside the route's own level band and spread across it, ending at the top of the band. That is where the game's 16 placed trainers already sit: each is inside the band of the country it stands in. The band is the route's `lv` in `route-encounters.json` for the 16 routes WBW-5 covers, and its country's `BIOMES` band for the other four (Thornwood Trail, Saltmarsh Road, Glassfall, Crest Path). The table below gives the resolved levels at both counts.

## Badge counts

`badges_first_reachable` is the fewest badges, held in any order, with which the route can be reached once WB-WORLD-ORDER has taken the ropes down. The test recomputes it from `world-graph.json`. The rules it uses:

- the ropes in `ropesUntilOrder` are not gates (that list is what the order phase removes);
- a field lesson counts as learned when the badge its teacher gives is held (`gates.json`), and an element gate needs no badge;
- Tide needs Thorn, because Nerys is past the Thorn rope;
- Glassfall is a one-way link in the graph, not a map, so it counts as reached when the link is open and its upper end is walked to;
- build phases are ignored. It is when the road could be walked, not when it ships.

The result: four routes at 0 badges (the Thornwood Trail, Millgrass Lane, Dewcut, Rootwater Path), two at 1 (Saltmarsh Road, Wrackline), Glassfall at 3 (it waits for Glide, which Vessa teaches after the Beacon Badge), and the other 13 at 2, since after Thorn and Tide every road the order phase frees can be walked.

`recommended_badges` is the count in the recommended order, the first-visit floor that WBW-5 uses for its 16 routes (read from `route-encounters.md`). The other four follow from the graph: the Thornwood Trail 0, Saltmarsh Road 1 (the Thorn rope), Crest Path 3 (off Cloudglass, as Sootpath is), and Glassfall 4 (Glide needs the Beacon Badge). The test checks that `badges_first_reachable` never exceeds it.

| Route | Name | First reachable | Recommended | Trainers | Offsets | Levels at recommended | Levels at first reachable |
|---|---|---:|---:|---:|---|---|---|
| `thornwood_route` | Thornwood Trail | 0 | 0 | 2 | -11 to -3 | 4–12 | 4–12 |
| `millgrass` | Millgrass Lane | 0 | 0 | 2 | -11 to -10 | 4–5 | 4–5 |
| `dewcut` | Dewcut | 0 | 0 | 1 | -9 to -7 | 6–8 | 6–8 |
| `rootwater` | Rootwater Path | 0 | 0 | 3 | -6 to -3 | 9–12 | 9–12 |
| `saltmarsh_route` | Saltmarsh Road | 1 | 1 | 2 | -11 to -3 | 14–22 | 14–22 |
| `wrackline` | Wrackline | 1 | 1 | 3 | -11 to -3 | 14–22 | 14–22 |
| `ashstair` | Ashstair | 2 | 2 | 3 | -12 to -7 | 23–28 | 23–28 |
| `sootpath` | Sootpath | 2 | 3 | 3 | -18 to -13 | 27–32 | 17–22 |
| `passfoot` | Pass Foot | 2 | 4 | 3 | -21 to -13 | 34–42 | 14–22 |
| `glassfall` | Glassfall | 3 | 4 | 1 | -18 to -13 | 37–42 | 27–32 |
| `crestpath` | Crest Path | 2 | 3 | 2 | -11 to -3 | 34–42 | 24–32 |
| `longboards` | The Long Boards | 2 | 4 | 3 | -8 to -3 | 47–52 | 27–32 |
| `orchardfen` | Orchard Fen | 2 | 4 | 3 | -4 to 0 | 51–55 | 31–35 |
| `latepath` | The Late Path | 2 | 5 | 3 | -2 to 0 | 58–60 | 33–35 |
| `flintcut` | Flintcut | 2 | 5 | 2 | -2 to 0 | 58–60 | 33–35 |
| `ribbonroad` | Ribbon Road | 2 | 6 | 3 | -3 to 0 | 62–65 | 32–35 |
| `sheltermile` | Shelter Mile | 2 | 7 | 3 | -5 to -2 | 65–68 | 30–33 |
| `chartroad` | Chart Road | 2 | 7 | 2 | -4 to -2 | 66–68 | 31–33 |
| `seaward` | Seaward Ledge | 2 | 7 | 3 | -3 to 0 | 67–70 | 32–35 |
| `trialroad` | Trial Road | 2 | 7 | 4 | -2 to 0 | 68–70 | 33–35 |

## Creatures

Every species is in the game's catalogue (`SPECIES` plus `evolution.json`'s `species`), is not one of the nine uniques, and is not Kilnback, which WBW-5 also keeps off the roads. Every species is in the route's country pool, `BIOMES[country].wild` plus the `evolution.json` extras for that map, as `route-encounters.md` defines it. Most are drawn from the route's own WBW-5 table, so a trainer fields what you meet in the grass. No creature appears twice on one team.

## What this does not decide

- **Levels when a road is walked early.** Under WB-WORLD-ORDER a tamer with two badges can reach Sootpath or Trial Road. A trainer there is then `cap(2) + offset`, so Sootpath's trainers are 17–22 and Pass Foot's are 14–22, below the road's wild levels of 26–32 and 32–42. That is the same gap [route-encounters.md](route-encounters.md) flags for the wild tables (its integration decision 3): the order phase needs one level policy for roads, and this file stays consistent with whichever the dev lead picks only if it is offsets from the cap. If the dev lead wants early arrivals fought harder, the offsets are the one thing to change.
- **Orchard Fen's rope.** The graph still has the Orchard Fen rockfall as a chord, so a graph walk with the ropes up reaches Pass Foot at 3 badges, not 4. `recommended_badges` uses WBW-5's conservative floor, as that file does, and does not resolve the rope.
- **Placement and count.** Where each trainer stands, how many a given map can hold, whether they see the tamer at distance 1 or 5, and rematches are a map pass (section 8). Nothing here says how a win is recorded; the save already has `beaten`.
- **Names and lore.** All 51 names are proposals. They go through the lore ledger before they are canon.
- **Party of three.** The party stops at three, so a team of three is the largest. Section 8 leaves a party of six to Evan.

## Validation

Run from the repository root:

```sh
python3 -m unittest tools/test_wildbond_world_trainers.py
python3 tools/wildbond-export-freshness.py --base origin/main --head HEAD
```

The standalone checker reads the game's data, the design, `world-graph.json`, `gates.json`, `route-encounters.json` and `route-encounters.md`. It checks that every route in the design is present (and no other), that each route is a place or link in the graph, that `badges_first_reachable` matches the graph, that each team is one to three catalogue species from the right country with no unique or Kilnback, that offsets are whole numbers at or below zero, that levels stay inside the route's band at its recommended count and inside 2 to the cap wherever the route can be met, that names are unique and reuse no person, and that every trainer is proposed. About 80 broken copies must fail, and so must changed caps, species, graph links and design table. Strict JSON loading rejects duplicate keys and non-finite numbers. Nothing is added to CI.

This PR makes no engine, runtime, save-format, art, shared-file or pack change. Normal CI and the PR body carry the final-head evidence; a data test passing does not mean the trainers are in the game.
