# Wildbond world graph (WBW-3)

This is the connection graph from section 2 of [`wildbond-world-design.md`](../wildbond-world-design.md), written as data. It is a planning file. It does not change the game, the save, the web pack, or any picture, and nothing loads it. The dev lead can read it when wiring exits, `INTERIORS` and the Glide inn list in the WB-WORLD phases.

- Data: [`world-graph.json`](world-graph.json)
- Check: `python3 -m unittest tools/test_wildbond_world_graph.py` (standalone, not in CI)
- Packed Wildbond files: untouched. `python3 tools/wildbond-export-freshness.py --base origin/main --head HEAD` prints `No packed Wildbond game files changed`.

## What the file holds

- **47 places**: 10 towns, 20 routes, 7 caves and 3 water routes (the counts in the design), plus 7 places that are none of those: Saltmarsh Coast (no healer), the Lighthouse Spire, the two pockets (Old Root Grove and Moon Pool), Lampcrown, Outer Shoal, and the Dry Boards (a passage inside the Long Boards). Glassfall is one of the 20 routes but is drawn as an arrow, so it is stored as a link and not as a map. That leaves **46 places on the graph**.
- **54 links**, each with its two ends, its gate, and the phase in which it first opens (`0` means it exists today). Every link is walked both ways except Glassfall, which is the only one with `oneWay` and runs from Highlatch (`cloudglass`) down to Reedhold (`stillreed`).
- **The 15 current map ids are kept as they are** and marked `current`. A new name goes on an old id where the design says so: Warmstep is `emberfall`, Highlatch is `cloudglass`, Reedhold is `stillreed`, Bellstep is `hollowecho`, Threadmeet is `sunthread` and the High Watch is `farwatch`. Everything new gets a new id, taken from the design's route, cave and water tables. Lantern Quay is `lanternquay`.
- **Healers** are on the ten towns. Old Ned and Nelva exist. The other eight keepers are proposals in the design and stay proposals here.
- **`ropesUntilOrder`** lists the badge ropes that today's game puts on the walk and that WB-WORLD-ORDER lifts.

## Gates

A gate is a list of requirements, and a tamer needs all of them. A requirement is one of:

| Requirement | Meaning |
|---|---|
| `badge` | A badge id from `BADGES` (`thorn`, `tide`, `ember`, `beacon`, `reed`, `echo`, `loom`, `horizon`). |
| `badges: "all"` | All eight badges. |
| `field` | A field lesson (`stone`, `tide`, `grove`, `lantern`, `glide`, `hush`, `daymark`). Its save key is `story` key `field:<id>`, which the design already names. |
| `element` | A partner of that element on the walking team, with no lesson needed. Only the two early pockets use it, as today's game does (the design keeps those checks). |
| `story` | A story key that the save already has. Only `leagueEnding`, for the Spire. |

The graph adds **no new save key**. A link that touches a water route needs Tide Ride. The league door (`trialstair--league`) needs all eight badges, and nothing else reaches the league. No gate in the file asks for a lesson on the main road.

## What the test checks

The test reads the graph, the mermaid flowchart in the design doc, and `wildbond-godot/data/wildbond.json` (read only). It checks that:

- the counts are 20 routes, 10 towns, 7 caves and 3 water routes, 47 places in all, with unique ids and names;
- all 15 current map ids are present, marked, phase 0, and the same ids as the game's `MAPS`;
- the phase 0 links are real exits in today's game, and every other old exit is replaced by a walk of at most three new places;
- every link is two-way except Glassfall, which goes down only, refuses the climb back, and needs Glide, while Pass Foot walks both ways;
- everything can be reached from Larkhaven with all lessons, and only the Spire waits for the Champion ending;
- with no lessons at all, the only places out of reach are the six behind Tide Ride, so lessons never lock the main road and the league stays reachable;
- the league needs all eight badges (any seven fail), and a save with only the Thorn and Tide badges walks to Bellstep, Threadmeet and the High Watch, which is WB-WORLD-ORDER's done check;
- the grove still opens on a Stone partner alone and the pool on a Tide partner alone;
- every town has a named healer and no link joins two towns directly (except the Glassfall arrow);
- on the road with no lessons no two healers are more than two routes apart, and with every lesson every place is within three routes of a healer;
- the graph's edges are the design's flowchart edges (as unordered pairs), the labelled arrows carry the gates they name, and Chart Road is the only loop;
- if WBW-2's `knothollow.json` exists, its exits point at the same places as the graph (Rootwater Path and Old Root Grove). It is skipped until that file is on the branch.

## Places where the design disagrees with itself, and what I did

I did not edit the design. The dev lead can decide each one.

1. **Sootpath's Ember rope.** Today's Emberfall north exit wants the Ember Badge. WB-WORLD-ORDER's list of lifted ropes names the Beacon, Reed, Echo, Loom and Horizon badges and not the Ember Badge, yet its done check says a save with only Thorn and Tide can reach Bellstep, and Bellstep can only be reached through Sootpath. I followed the done check, so Sootpath has no gate here and the rope is listed in `ropesUntilOrder` for the dev lead to confirm.
2. **The flowchart leaves out Keelcave.** The caves list puts Keelcave off Greywash Sound, and the design counts 7 caves, but the flowchart draws only 6. The graph has the link `greywash--keelcave` (marked `extraToFlowchart`), and the test names it as the only link the flowchart lacks. If the flowchart gains Keelcave, the test still passes.
3. **"Horizon Badge" has no rope today.** WB-WORLD-ORDER lists the Horizon Badge among the badges Trial Road asks for, but today's Farwatch exit asks for all eight, not Horizon. I did not add a Horizon rope, and no link uses the `horizon` badge.
4. **Orchard Fen and Ribbon Road ropes.** The design says Orchard Fen and Ribbon Road "stay behind those same later ropes" without naming which badge. I recorded Ribbon Road's Echo rope (today's Hollowecho east exit) and left Orchard Fen out of `ropesUntilOrder`.
5. **A healer-free stretch is longer than three routes when lessons are open.** On the road with no lessons the worst gap is two routes. With every lesson, optional chains open: the Orchard Fen chord (Stone Break), the water (Tide Ride) and Kilnvent's far door (Lantern) make a walk with no town in it, and the longest is Highlatch to the High Watch at six routes (through Sootpath, Kilnvent, Ashstair, the coast, Moon Pool, Greywash Sound, The Open Grey and Seaward Ledge). Nothing forces that walk and every place on it is within three routes of a healer, so I kept the design's rule as "never more than three routes from a healer" and froze the longer pairs in the test so a change shows. If the dev lead wants the rule to cover them, one healer on that chain would fix it.
6. **Element gates are a fourth kind of gate.** The row names a badge, a story key or a field lesson. The grove and the pool read a partner's element and not a lesson (design section 1), so I added `element` for those two links only.
7. **Region and map records are out of this file.** Section 9 also describes Region, Map and Person records (wild tables, tile heights, props). This row asks only for the connection graph, so those are left for later files.

## Links

| Link | Between | Gate when the valley is finished | Opens in phase |
|---|---|---|---|
| `larkhaven--thornwood_route` | Larkhaven ↔ Thornwood Trail | none | today |
| `larkhaven--millgrass` | Larkhaven ↔ Millgrass Lane | none | 1 |
| `millgrass--larkburrow` | Millgrass Lane ↔ Larkburrow | none | 6 |
| `thornwood_route--dewcut` | Thornwood Trail ↔ Dewcut | none | 1 |
| `dewcut--thornwood_grove` | Dewcut ↔ Old Root Grove | a Stone partner | 1 |
| `thornwood_route--thornwood` | Thornwood Trail ↔ Thornwood | none | today |
| `thornwood--rootwater` | Thornwood ↔ Rootwater Path | none | 1 |
| `rootwater--knothollow` | Rootwater Path ↔ Knothollow | Thorn Badge | 2 |
| `thornwood_grove--knothollow` | Old Root Grove ↔ Knothollow | Grove Wake | 2 |
| `thornwood--saltmarsh_route` | Thornwood ↔ Saltmarsh Road | Thorn Badge | today |
| `saltmarsh_route--saltmarsh_pool` | Saltmarsh Road ↔ Moon Pool | a Tide partner | today |
| `saltmarsh_route--saltmarsh` | Saltmarsh Road ↔ Saltmarsh Coast | none | today |
| `saltmarsh--wrackline` | Saltmarsh Coast ↔ Wrackline | none | 1 |
| `wrackline--lanternquay` | Wrackline ↔ Lantern Quay | none | 1 |
| `saltmarsh_pool--greywash` | Moon Pool ↔ Greywash Sound | Tide Ride | 2 |
| `lanternquay--greywash` | Lantern Quay ↔ Greywash Sound | Tide Ride | 2 |
| `saltmarsh--ashstair` | Saltmarsh Coast ↔ Ashstair | Tide Badge | 1 |
| `ashstair--kilnvent` | Ashstair ↔ Kilnvent | none | 3 |
| `ashstair--emberfall` | Ashstair ↔ Warmstep | none | 1 |
| `emberfall--sootpath` | Warmstep ↔ Sootpath | none | 1 |
| `kilnvent--sootpath` | Kilnvent ↔ Sootpath | Lantern | 3 |
| `sootpath--cloudglass` | Sootpath ↔ Highlatch | none | 1 |
| `cloudglass--crestpath` | Highlatch ↔ Crest Path | none | 6 |
| `crestpath--lampcrown` | Crest Path ↔ Lampcrown | none | 6 |
| `glassfall` | Highlatch → Reedhold | Glide | 4 |
| `cloudglass--passfoot` | Highlatch ↔ Pass Foot | none | 1 |
| `passfoot--stillreed` | Pass Foot ↔ Reedhold | none | 1 |
| `stillreed--dryboards` | Reedhold ↔ The Dry Boards | none | 1 |
| `dryboards--passfoot` | The Dry Boards ↔ Pass Foot | none | 1 |
| `stillreed--longboards` | Reedhold ↔ The Long Boards | none | 1 |
| `stillreed--latepath` | Reedhold ↔ The Late Path | none | 1 |
| `stillreed--orchardfen` | Reedhold ↔ Orchard Fen | none | 1 |
| `orchardfen--sootpath` | Orchard Fen ↔ Sootpath | Stone Break | 2 |
| `orchardfen--sunthread` | Orchard Fen ↔ Threadmeet | none | 1 |
| `latepath--hollowecho` | The Late Path ↔ Bellstep | none | 1 |
| `hollowecho--flintcut` | Bellstep ↔ Flintcut | none | 1 |
| `flintcut--answering` | Flintcut ↔ The Answering Ways | none | 3 |
| `hollowecho--ribbonroad` | Bellstep ↔ Ribbon Road | none | 1 |
| `ribbonroad--sunthread` | Ribbon Road ↔ Threadmeet | none | 1 |
| `larkburrow--sunthread` | Larkburrow ↔ Threadmeet | Stone Break and Loom Badge | 6 |
| `sunthread--sheltermile` | Threadmeet ↔ Shelter Mile | none | 1 |
| `sheltermile--farwatch` | Shelter Mile ↔ The High Watch | none | 1 |
| `farwatch--chartroad` | The High Watch ↔ Chart Road | none | 1 |
| `farwatch--seaward` | The High Watch ↔ Seaward Ledge | none | 1 |
| `seaward--opengrey` | Seaward Ledge ↔ The Open Grey | Tide Ride | 6 |
| `greywash--opengrey` | Greywash Sound ↔ The Open Grey | Tide Ride | 6 |
| `opengrey--outershoal` | The Open Grey ↔ Outer Shoal | Tide Ride | 6 |
| `greywash--keelcave` | Greywash Sound ↔ Keelcave | Tide Ride | 6 |
| `farwatch--trialroad` | The High Watch ↔ Trial Road | none | 1 |
| `trialroad--trialstair` | Trial Road ↔ Trialstair | none | 6 |
| `trialstair--league` | Trialstair ↔ Returning Light League | all eight badges | 6 |
| `league--spire` | Returning Light League ↔ The Lighthouse Spire | story key leagueEnding | today |
| `stillreed--quietchannels` | Reedhold ↔ The Quiet Channels | Tide Ride | 6 |
| `quietchannels--lowbell` | The Quiet Channels ↔ Lowbell | Tide Ride | 6 |

## Places

| Id | Name | Kind | Phase | Notes |
|---|---|---|---|---|
| `cloudglass` | Highlatch | town | today | Healer: Yarrow (proposed). The existing pass keeps the id cloudglass. Sign says "Cloudglass Pass" today. |
| `emberfall` | Warmstep | town | today | Healer: Hest (proposed). The existing highland screen keeps the id emberfall. Sign says "Emberfall Highlands" today. |
| `farwatch` | The High Watch | town | today | Healer: Quen (proposed). The existing reach keeps the id farwatch. Sign says "Farwatch Reach" today. |
| `hollowecho` | Bellstep | town | today | Healer: Iren (proposed). The existing hamlet keeps the id hollowecho. Sign says "Hollowecho Hills" today. |
| `larkhaven` | Larkhaven | town | today | Healer: Old Ned (exists). |
| `league` | Returning Light League | town | today | Healer: Nelva (exists). |
| `stillreed` | Reedhold | town | today | Healer: Juna (proposed). The hub. The existing basin landing keeps the id stillreed. Sign says "Stillreed Basin" today. |
| `sunthread` | Threadmeet | town | today | Healer: Solla (proposed). The existing commons keeps the id sunthread. Sign says "Sunthread Commons" today. |
| `thornwood` | Thornwood | town | today | Healer: Hedda (proposed). Gains the Gate Loft in phase 1. |
| `lanternquay` | Lantern Quay | town | 1 | Healer: Perrin (proposed). New, at the end of Wrackline. |
| `saltmarsh_route` | Saltmarsh Road | route | today |  |
| `thornwood_route` | Thornwood Trail | route | today |  |
| `ashstair` | Ashstair | route | 1 |  |
| `chartroad` | Chart Road | route | 1 | A loop of lookout ground that leaves the High Watch and returns to it. |
| `dewcut` | Dewcut | route | 1 |  |
| `flintcut` | Flintcut | route | 1 |  |
| `latepath` | The Late Path | route | 1 |  |
| `longboards` | The Long Boards | route | 1 |  |
| `millgrass` | Millgrass Lane | route | 1 |  |
| `orchardfen` | Orchard Fen | route | 1 |  |
| `passfoot` | Pass Foot | route | 1 |  |
| `ribbonroad` | Ribbon Road | route | 1 |  |
| `rootwater` | Rootwater Path | route | 1 |  |
| `seaward` | Seaward Ledge | route | 1 |  |
| `sheltermile` | Shelter Mile | route | 1 |  |
| `sootpath` | Sootpath | route | 1 |  |
| `trialroad` | Trial Road | route | 1 |  |
| `wrackline` | Wrackline | route | 1 |  |
| `glassfall` | Glassfall | route | 4 | Drawn as one arrow in the design, so it is the link highlatch to stillreed (down only) and not a map. Split it into a map and two links if the dev lead builds one. |
| `crestpath` | Crest Path | route | 6 |  |
| `knothollow` | Knothollow | cave | 2 | Front door from Rootwater Path; Grove Wake opens the back of Old Root Grove into it. |
| `answering` | The Answering Ways | cave | 3 | Mouth is the hamlet's, not tile (19, 8). |
| `kilnvent` | Kilnvent | cave | 3 | Mouth is a shut trailhead on Ashstair from phase 1. |
| `keelcave` | Keelcave | cave | 6 | Off Greywash Sound. The design's flowchart does not draw it; the prose does. |
| `larkburrow` | Larkburrow | cave | 6 | Mouth on Millgrass Lane is visible and shut from phase 1. |
| `lowbell` | Lowbell | cave | 6 | Under The Quiet Channels. |
| `trialstair` | Trialstair | cave | 6 | Until phase 6 Trial Road reaches the league directly. |
| `greywash` | Greywash Sound | water | 2 | First screen opens in phase 2; it grows east in phase 6. |
| `opengrey` | The Open Grey | water | 6 |  |
| `quietchannels` | The Quiet Channels | water | 6 |  |
| `saltmarsh` | Saltmarsh Coast | other (coast) | today | No healer, so not one of the ten towns. |
| `saltmarsh_pool` | Moon Pool | other (pocket) | today |  |
| `spire` | The Lighthouse Spire | other (tower) | today |  |
| `thornwood_grove` | Old Root Grove | other (pocket) | today |  |
| `dryboards` | The Dry Boards | other (passage) | 1 | A passage inside the Long Boards maps, not a route or a cave. |
| `lampcrown` | Lampcrown | other (summit) | 6 |  |
| `outershoal` | Outer Shoal | other (shoal) | 6 |  |
