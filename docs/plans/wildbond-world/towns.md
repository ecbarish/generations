# Wildbond towns, their healers and their shelves

This is WBW-7. It writes the ten towns of [`wildbond-world-design.md`](../wildbond-world-design.md) section 2 ("Towns (10)") as data, in [`towns.json`](towns.json), so the dev lead can wire the eight new inns, Colm's shop and the keepers' shelves (WB-WORLD-1) from one list. It is a planning file. It does not change the game, the save, the web pack or any picture, and nothing loads it.

- Data: [`towns.json`](towns.json)
- Check: `python3 -m unittest tools/test_wildbond_world_towns.py` (standalone, not in CI)
- Packed Wildbond files: untouched. `python3 tools/wildbond-export-freshness.py --base origin/main --head HEAD` prints `No packed Wildbond game files changed`.
- Source: design section 2 (the Towns table and the three-route rule), and section 5 for the door sizes, the waiting pads and the count of interiors. Every town is a node in [`world-graph.json`](world-graph.json) (WBW-3), and the test checks that.

Everything marked `proposed` is a proposal in the design. The nine new keepers (eight healers and Colm) are not canon until the town phase is accepted and their lines are recorded.

## The ten towns

| Town (graph node) | Healer | Healer's room, door and pad | Also indoors | Outdoors | Shelf |
|---|---|---|---|---|---|
| Larkhaven (`larkhaven`) | Old Ned, exists | The Larkhaven Inn, existing door, 2x2 pad | Juniper's Shop, Pip's home (Mira), Nora's cottage, Maren's barn (16x26, existing) | Maren and Pip (read from the game's map; the design names nobody here) | Juniper's shop, exists |
| Thornwood (`thornwood`) | Hedda, proposed | The Gate Loft, 12x24, 2x2 | None | Isolde, at the hawthorn gate | Short |
| Lantern Quay (`lanternquay`), new | Perrin, proposed | The quay inn, 12x24 with the blue door, 2x2 | The net loft, 12x24 | Marit and Cato at the quay. Tobin stays on Saltmarsh Road (`saltmarsh_route`) | Short |
| Warmstep (`emberfall`) | Hest, proposed | The spring-house, 12x24, 3x2 (Hearthcrown's pad on the terrace) | None | Sela on the path outside. Toren above the springs | Short |
| Highlatch (`cloudglass`) | Yarrow, proposed | The lodge (its kitchen), 12x24, 2x2 | None | Vessa on the rope. Ilka at the door | Short |
| Reedhold (`stillreed`), the hub | Juna, proposed | Juna's boathouse inn, 20x24, 2x2 (Stillwake's pad is on the jetty) | Colm's dry-goods shop (12x24), the ferry house (12x24) | Olan at the landing. Tavil with the ropes. Evren in the orchard. The skiff stays scenery | Short for Juna. **Full**, in Colm's shop |
| Bellstep (`hollowecho`) | Iren, proposed | The bell house, 12x24, on the footprint already drawn, 2x2 | None | Veslin at the bell rope. Senna by the resting stones | Short |
| Threadmeet (`sunthread`) | Solla, proposed | The meeting hall, a pair of 24x24 doors, 2x2 | Pell's counter inside the hall (not a coin shop) | Halen on the forecourt | Short |
| The High Watch (`farwatch`) | Quen, proposed | The ledger house, 12x24, 2x2 | None | Sivren on the harbor path. Rysa at the lookout. Delka on the trail | Short |
| Returning Light League (`league`) | Nelva, exists | Nelva's league rest, existing, 2x2 | None (the courts stay the courts) | None named | None |

Counts the test pins down: ten healers (two exist, eight proposed); eleven new interiors, which are the eight healer rooms plus Colm's shop, the ferry house and the net loft (the design's own count in section 5); nine proposed keepers; one full shop; no person standing in two places. Every healer rests a tired team for nothing.

## The shelves

The design gives each new keeper "a short shelf of lures and berries" and makes Reedhold "the only new full shop". It names no list and no price, so the file adds none. It records only the two goods Juniper sells today, with the game's own prices: 5 lures for 50 coins, and 5 berries at the food table's price (3 coins each, 15 for five). The test reads both from the game (`FOODS.berries.cost` in `wildbond.json` and Juniper's list in `main.gd`) and fails if they drift.

- `existing`: Juniper's shop, as it is.
- `short`: a new keeper's own shelf, in the healer room.
- `full`: Colm's shop in Reedhold, and only that one.

## How far from a healer

The design's rule is that you are never asked to cross more than three routes without a healer. The test measures it on the graph. A **step** is one link in `world-graph.json`, so a route that touches a town is 1 step and a route two links away is 2. A place is **walkable** when you can reach it from a town without a link gated by Tide Ride. The four places that need Tide Ride (Greywash Sound, The Quiet Channels, The Open Grey and Outer Shoal) are counted only once Tide Ride is learned. The test checks both ways, and that the only places off foot are those four.

| Steps from a healer | Places |
|---|---|
| 1 | 18 routes, Greywash Sound, The Quiet Channels, the Lighthouse Spire, the Dry Boards |
| 2 | Dewcut, Saltmarsh Coast, Moon Pool, Lampcrown, The Open Grey (with Tide Ride) |
| 3 | Old Root Grove, and Outer Shoal (with Tide Ride) |

The most anyone is from a healer is 3 steps, at Old Root Grove (grove, Dewcut, Thornwood Trail, Thornwood) and at Outer Shoal. The caves are not routes and the rule is not asserted for them; for the record each is 1 or 2 steps from a healer. Glassfall is one arrow between Highlatch and Reedhold, not a place with exits of its own, so it is checked as a link: it is the only link in the graph that joins two towns with no other place between them, and the test fails if another one appears.

The design's three examples are also tested: Larkhaven to Thornwood is one route (two links, with Thornwood Trail between), the coast to Warmstep is Ashstair (one route), and Lantern Quay is one step off Wrackline.

## What the test checks

- the file has exactly the graph's ten towns in the graph's order, with the graph's names, map ids and healers, and the design's Towns table has the same ten rows and the same healers;
- a current map id is kept (`currentMap` is the town's own id and is in the game's `MAPS`), and Lantern Quay has none;
- every proposed person is new to the game (not in `CAST`), every existing person is in the game, and every outdoor person is named in that town's row of the design;
- exactly one healer room per town, with the healer as its keeper and a 2x2 or 3x2 pad; every new door has a size, and the sizes are the design's (12x24 cottage doors, Juna's 20x24, the hall's 24x24 pair, the barn's 16x26);
- Larkhaven's rooms match the game's three door tiles;
- shelves hold lures and berries only, only Colm's is full, and the prices match the game;
- broken copies of the file fail: a duplicate or missing room, a bad door size or pad, a wrong healer or status, a person in two places, a shelf with coins or two full shops, a town missing from the graph, a link that joins two towns, a road longer than three steps and a Tide Ride walk.

## Where I read the design instead of copying it

1. **Larkhaven's outdoor people.** The design says only "Unchanged". I listed Maren and Pip from the game's `MAPS` and marked them `"source": "game"`. Maren is also the barn's keeper; the test allows her as the one person who is both.
2. **Marit and Cato** are on the Saltmarsh Coast map today. The design puts them at Lantern Quay, "outside", so the file places them there. Wiring moves them.
3. **The ferry house and Juna's inn** are two rooms. The design's Reedhold row lists the ferry house as an indoor place, the door table lists Juna's boathouse inn (20x24) and the ferry house (12x24) separately, and the count of eleven interiors needs both.
4. **Pell's counter** is a feature of the meeting hall, not a twelfth interior.
5. **Pads.** The design says each of the ten healer doors has a 2x2 pad and that Pyremane, Elderhorn and Hearthcrown need 3x2. It places only Hearthcrown at a town (Warmstep's terrace), so only that door is 3x2.
6. **A step is a link**, as above. The design says "routes"; counting links is the one reading that the graph can check.

## Questions for the Wildbond dev lead

- How does a **short shelf** differ from Colm's **full** shop? The design leaves the stock open, and the file does not guess.
- Where do Pyremane's and Elderhorn's 3x2 pads go? If either waits at a town door, that door changes from 2x2.
- Should the **net loft** and the **ferry house** have a person? The design names none.
