# Wildbond region audit (WB-REGION-AUDIT)

Claude, independent review for Evan, 2026-10-18. Data: [region-audit.json](region-audit.json). Check:
`python3 -m unittest tools/test_wildbond_region_audit.py`.

This audit reviews the whole region plan before encounters are finalised across it. It does not write encounter tables
(Codex owns the encounter proposal and the first Thornwood tables), redesign the graph, fill in unknown landings, add lore,
or touch runtime files, sprites or saves. Every recommendation below is a **proposal** for the owner named with it.

**Sources read** (branch `codex/wildbond-private-library`, PR #563, head `d2d985d4`):

- The handoff, AGENTS.md, AI-START.md, the reference guide and the cast guide.
- [world-graph.json](world-graph.json) and [world-graph.md](world-graph.md), plus [wildbond-world-design.md](../wildbond-world-design.md)
  (§1, §2, §7, §9).
- [gates](gates.md), [Knothollow](knothollow.md), [the Answering Ways](answering.md),
  [route encounters](route-encounters.md) and [errands](errands-schema.md).
- The [layout study](../../research/wildbond-layout/README.md) and the
  [opening chapter](../../research/wildbond-opening-chapter/README.md).
- `wildbond-godot/data/wildbond.json`, for today's maps, exits and countries.
- The open region PRs #523 (Dry Boards, which adds the ruled Answering edge), #537 (towns), #538 (Larkburrow), #539
  (trainers) and #540 (finds), read as pending proposals.

**How to read the labels.**

- **Established** means it exists in today's game data, or Evan approved it.
- **Planned** means it is in the merged world design or graph. The design itself says it is not canon until each phase is built.
- **Proposal** means an open PR or a recommendation in this audit.

The early research skeleton (#452) and the old original-only wild tables are **historical**.

## The short version

The plan is sound. It is one connected valley with a clear hub (Reedhold, seven links) and nine independent loops. Every
place is within three links of a healer, the league needs all eight badges, and no lesson ever locks the main road. Four
things need deciding before encounter tables are final:

1. **RA-01 (P0, decided by Evan 2026-10-18: scale to badges).** After WB-WORLD-ORDER, 38 of the 46 map nodes are reachable
   with just two badges and a level cap of 35. Fixed country bands (32–72) don't fit that. Wardens already scale to the
   badges held, and wild levels should do the same.
2. **RA-02 (P0): fix what counts as an encounter area.** One graph place id is one area. This audit counts **33**, so
   Evan's rule needs **17 or more with a Wildbond original**. It recommends 18, spread across every country, the water and
   badge counts 0 to 7.
3. **RA-03 (P1): Orchard Fen has no rope.** In the WB-WORLD-1 world, Threadmeet opens at 4 badges instead of 6. One rope
   record fixes it, and the test proves both the leak and the fix.
4. **RA-04 (P1): the Answering Ways is missing its Bellstep mouth.** The lead's ruled edge is already in PR #523.

The first expedition (RA-08) works as an out-and-back, but it has nowhere to arrive yet. The best next build is Thornwood
the town, with Isolde and the Gate Loft healer together.

## Counts

- **46 map nodes**: 10 towns, 19 walkable routes, 7 caves, 3 water routes, and 7 other places (a coast, a tower, two pockets,
  a summit, a shoal and a passage).
- **Glassfall** is the 20th route. It is stored as a link only, so it is counted once.
- **54 links**: 6 exist today (phase 0), 27 open in phase 1, 5 in phase 2, 3 in phase 3, 1 in phase 4 and 12 in phase 6.
  Glassfall is the only one-way link. PR #523 would make it 55.
- **Encounter classes**:
  - ordinary: 27 places
  - ordinary + special: 6
  - special only: 8 (seven towns with a Legend site or first meeting, and Lampcrown)
  - none: 5 (Larkhaven, Lantern Quay, the league, the Spire and the Dry Boards)
  - Glassfall: none
- **Landings**:
  - 6 are verified 2D landings today.
  - 5 are deliberately null in briefs.
  - 15 have only a town-side tile from today's game as a candidate.
  - 28 have no evidence at all.

## 1. Purpose, habitat, connections and progression

Each place's record is under **Every place** below. Three patterns matter:

- **Today's region screens become towns.** Eight of the current maps keep their ids and become towns, so a save standing on
  them still loads. They hold most of today's tall grass (31 to 113 tiles each), and the Legends' first meetings count
  explores by country. RA-11 keeps both working: towns get no grass, and new routes keep their parent country's id.
- **Roads are inserted between towns.** Ashstair, Sootpath, Pass Foot, The Late Path, Ribbon Road, Shelter Mile and Trial
  Road sit where today's direct exits are. The town-side tile of each old exit exists and is listed in the JSON as a
  candidate landing only (RA-07).
- **Progression has two shapes.** With today's ropes, the towns open at 0, 0, 1, 2, 3, 4, 5, 7 badges in the main order,
  except Threadmeet, which leaks to 4 (RA-03). After WB-WORLD-ORDER, everything outside the water, the league and the
  Spire opens with Thorn and Tide. Lessons then decide depth, not access, which is what the design intends.

## 2. Loops, shortcuts, healing and reasons to revisit

**Loops.** The graph has nine independent cycles. Each named loop and when it opens:

| Loop | Route | Opens with |
|---|---|---|
| Knothollow ring | Thornwood Trail, Dewcut, Old Root Grove, Knothollow, Rootwater Path, Thornwood | Thorn Badge, a Stone partner, Grove Wake (phase 2) |
| Moon Pool ring | Saltmarsh Road, Moon Pool, Greywash Sound, Lantern Quay, Wrackline, Saltmarsh Coast | Tide Ride (phase 2) |
| Kilnvent chord | Ashstair, Kilnvent, Sootpath, Warmstep | Lantern (phase 3) |
| Pass Ring, with the Glassfall gift | Highlatch, Pass Foot or the Dry Boards, Reedhold | Walkable from phase 1; Glassfall needs Glide (phase 4) |
| Orchard Fen chord | Reedhold, Orchard Fen, Sootpath | Stone Break, both ends walked (phase 2) |
| Hills ring | Reedhold, The Late Path, Bellstep, Ribbon Road, Threadmeet, Orchard Fen | Phase 1 |
| Coast Ring | Lantern Quay or Moon Pool, Greywash, The Open Grey, Seaward Ledge, the High Watch and the road home | Tide Ride (phase 6) |
| Home Burrow | Millgrass Lane, Larkburrow, Threadmeet | Stone Break and the Loom Badge (phase 6) |
| Chart Road | The High Watch and back | A self-loop on one link (RA-19) |

**Dead ends.** Eight places have a single link: the Answering Ways, Chart Road, Keelcave, Lampcrown, The Long Boards,
Lowbell, Outer Shoal and the Spire. All are optional depths, apart from three:

- The Answering Ways needs its Bellstep mouth (RA-04).
- The Long Boards hides the Dry Boards it contains (RA-12).
- Chart Road is a deliberate loop.

**Healing.** Without lessons, nothing is more than 2 links from a healer except Old Root Grove, at 3. With every lesson,
Outer Shoal is also at 3. That holds only if the eight proposed keepers exist. Thornwood's Hedda matters most, because she
serves the first destination (RA-10).

**Revisit reasons.** Every place has at least one, listed in the JSON:

- lesson obstacles: thickets, cracks, dark halls and wall-doors
- the nine Legend return sites
- the ten errands
- two fishing piers
- Glide inns
- Warden rematches and the Spire

## 3. Missing or contradictory connections, gates and landings

**Missing or contradictory:**

- RA-03: Orchard Fen's rope.
- RA-04: the Answering Ways' mouth.
- RA-05: the Trial Road to league link before phase 6.
- RA-06: Sootpath's Ember rope.
- RA-12: the Long Boards and the Dry Boards.
- RA-13: Greymill.
- RA-14: Keelcave in the flowchart.
- RA-15: the errand place ids.

**Gates** otherwise agree across the graph, gates.json and the cave briefs. Grove Wake's badge is the one inference left
(RA-09).

**Landings are left unresolved on purpose (RA-07).** The six phase-0 links have verified 2D landings: every arrival tile
is in bounds, off the map edge, and the reverse exit exists. The native chapter is a single continuous grid, so its
Larkhaven-to-Trail seam needs no landing. Legacy 2D tiles are not native coordinates. Each landing is resolved when its
place is drafted with the location template, on the runtime that will use it.

## 4. Ordinary, special or no encounters

The audit's classing rules (a proposal; the tables stay Codex's):

- **Towns: no ordinary encounters.** Special sites stay where the design puts them: Hearthcrown's spring terrace, the
  Stillwake jetty, the Meadowmantle nursery, and the first meetings that count explores.
- **Ordinary encounters:** every route, cave and water route, plus Saltmarsh Coast, both pockets and Outer Shoal. Fishing
  piers use their map's table.
- **Special encounters** are the nine Legends' return sites and today's first meetings. All nine Legends are Wildbond
  originals already. The Greymill roamer waits for Evan's yes on Greysail.
- **No encounters:** Larkhaven, Lantern Quay, the league, the Spire (trainers only), the Dry Boards and Glassfall.

**Originals in at least half the areas.**

- Recommended areas (18 of 33):
  - Thornwood Trail, Rootwater Path, Old Root Grove and Knothollow
  - Moon Pool, Wrackline and Greywash Sound
  - Ashstair, Kilnvent, Sootpath and Pass Foot
  - Orchard Fen, Lowbell, The Late Path, the Answering Ways and Ribbon Road
  - Chart Road and Trialstair
- That spreads originals across all eight countries and the water, and across first-reach badge counts 0 to 7.
- **One original can live in neighbouring habitats.** For example, the Thornwood trio of Trail, Rootwater and Knothollow
  can share one, as Evan allows.
- **The audit names no species.** Bogsnap is the established standout to keep, but its evolution placement is unsettled.
  Codex may swap areas as long as the count and the spread hold, and the validator checks both.

## 5. The first Larkhaven–Thornwood expedition

What works today in the native chapter:

- Maren sends you out from the ranch.
- Thornwood Trail has grass, Bram and an item detour.
- You catch a partner, rest at Old Ned's inn and report back to Maren for a one-time reward.
- Wren and Bram give optional battles.
- Millgrass Lane and the Dewcut approach show the world is bigger, with Larkburrow's shut mouth and closed boundaries.

That is a complete small loop of story (out, catch, heal, report), even though the walk is out-and-back.

What's missing is an arrival. The graph's next step is Thornwood the town, Isolde's hawthorn gate and the first badge, but
it isn't built, and its healer is only proposed. Until then the outing turns back in the middle of the trail. The first
**walking** loop needs three things, which puts it in the middle of the early game:

- the Thorn Badge, for Knothollow's front door
- a Stone partner, for the Dewcut shelf
- Grove Wake, which needs a Loyal Grove partner

**Recommendation (RA-08, RA-10).**

- Build Thornwood the town next, as the destination: Isolde, the badge, and the Gate Loft healer in one step.
- Keep the return on the same trail, the shape every first route in the genre uses.
- Keep the visible promises for later: Larkburrow, the Dewcut shelf and Rootwater's cave door.
- Make the Knothollow ring the first reward loop, and confirm that Grove Wake comes with the Thorn Badge (RA-09, decided by Evan 2026-10-18: after the Thorn Badge).


## Every place

Columns: **Built** says whether the map exists in today's game (established) or is planned. **Reach** is the badge count at which the place is first reachable, in the main badge order: with today's ropes in the WB-WORLD-1 world / after WB-WORLD-ORDER with each lesson learned after its badge (– means not reachable in that state). **Heal** is the number of links to the nearest healer town without field lessons, counting the eight proposed keepers as healers (– means a lesson is needed to get there). **Original** marks the areas this audit recommends for a Wildbond original. Full purpose, habitat, revisit reasons and sources for each place are in the JSON.

### Larkhaven and Thornwood country

| Place | Kind | Built | Reach | Heal | Encounters | Original | Issues |
|---|---|---|---|---|---|---|---|
| **Larkhaven** (`larkhaven`) | town | today | 0 / 0 | 0 | none |  | RA-08 |
| **Thornwood Trail** (`thornwood_route`) | route | today | 0 / 0 | 1 | ordinary | yes | RA-08, RA-20 |
| **Millgrass Lane** (`millgrass`) | route | phase 1 | 0 / 0 | 1 | ordinary |  | RA-08 |
| **Larkburrow** (`larkburrow`) | cave | phase 6 | – / 0 | 2 | ordinary |  |  |
| **Dewcut** (`dewcut`) | route | phase 1 | 0 / 0 | 2 | ordinary |  | RA-08, RA-10 |
| **Old Root Grove** (`thornwood_grove`) | pocket | today | 0 / 0 | 3 | ordinary+special | yes | RA-08, RA-09, RA-10, RA-16 |
| **Thornwood** (`thornwood`) | town | today | 0 / 0 | 0 | special |  | RA-08, RA-10, RA-11, RA-20 |
| **Rootwater Path** (`rootwater`) | route | phase 1 | 0 / 0 | 1 | ordinary | yes | RA-08, RA-10 |
| **Knothollow** (`knothollow`) | cave | phase 2 | – / 1 | 2 | ordinary | yes | RA-08, RA-09, RA-17 |

- **Larkhaven**: Home town: Maren's ranch, Old Ned's inn (healer, exists), Juniper's shop; start and return point of every early outing. *Habitat:* Town, no grass in the current map. *Links:* Thornwood Trail, Millgrass Lane. Healer: Old Ned (exists). *Revisit:* Ranch and party storage; Old Ned's inn; Nora's errand (sq-nora-bird); Home Burrow return from Threadmeet (phase 6).
- **Thornwood Trail**: First route (exists; in the native chapter): Larkhaven north to Thornwood; Bram forages here; Dewcut branches east. *Habitat:* Forest trail with tall grass and an item detour (country thornwood). *Links:* Larkhaven, Dewcut, Thornwood. *Revisit:* Grove Wake thickets hide a bend and berries; Bram's rematch/patch.
- **Millgrass Lane**: West lane out of Larkhaven to the visible, shut Larkburrow mouth: the early promise of the Home Burrow. *Habitat:* Meadow lane (name and design: 'the west lane'); country thornwood in the historical tables. *Links:* Larkhaven, Larkburrow (phase 6). *Revisit:* Larkburrow first room and Nora's wooden bird (phase 6); Home Burrow exit.
- **Larkburrow**: Home the long way: first room with Nora's wooden bird is open from Millgrass Lane in phase 6; the through-path to Threadmeet needs Stone Break and the Loom Badge. *Habitat:* Burrow under the meadow. *Links:* Millgrass Lane (phase 6), Threadmeet (Stone Break, Loom Badge, phase 6). *Revisit:* Home Burrow loop; Nora's errand.
- **Dewcut**: Short meadow spur off the trail to the Old Root Grove shelf; takes over today's Stone-partner door. *Habitat:* Short meadow (design route table). *Links:* Thornwood Trail, Old Root Grove (a Stone partner). *Revisit:* Grove shelf with a Stone partner; Knothollow ring via the grove back ring.
- **Old Root Grove**: Old Root Grove pocket (exists): Stone partner shelf; Grove Wake taught at the antler sign; back ring opens into Knothollow. *Habitat:* Old grove (country thornwood) with its own extra species today. *Links:* Dewcut (a Stone partner), Knothollow (Grove Wake, phase 2). Special: Elderhorn return site among the oldest trees, on the Stone-partner side. *Revisit:* Grove Wake; Back ring to Knothollow.
- **Thornwood**: First Warden town: Isolde at the hawthorn gate (Thorn Badge); gains the Gate Loft and Hedda (healer, proposed) in phase 1. *Habitat:* Thornwood forest settlement; today's map carries 113 tall-grass tiles (country thornwood). *Links:* Thornwood Trail, Rootwater Path, Saltmarsh Road (Thorn Badge). Healer: Hedda (proposed). Special: Elderhorn first meeting (thornwood country, 20 explores) is unchanged; its return site is Old Root Grove. *Revisit:* Isolde's errand via Knothollow (sq-isolde-path); Gate Loft tutor (WB-WORLD-5); Rootwater/Knothollow ring.
- **Rootwater Path**: Thornwood to Knothollow; Bram's flooding stream where the mushrooms grow; the cave front door is a Thorn Badge test. *Habitat:* Stream path that floods (design names table). *Links:* Thornwood, Knothollow (Thorn Badge, phase 2). *Revisit:* Knothollow front door (Thorn Badge); Grove Wake thickets.
- **Knothollow**: Hollow under the roots between Rootwater Path (Thorn Badge supply test) and Old Root Grove's back ring (Grove Wake); Stone Break deep cracks. *Habitat:* Root cave in Thornwood country. *Links:* Rootwater Path (Thorn Badge, phase 2), Old Root Grove (Grove Wake, phase 2). *Revisit:* Deep cracks (Stone Break); Isolde's errand.

### The coast

| Place | Kind | Built | Reach | Heal | Encounters | Original | Issues |
|---|---|---|---|---|---|---|---|
| **Saltmarsh Road** (`saltmarsh_route`) | route | today | 1 / 1 | 1 | ordinary |  | RA-15 |
| **Moon Pool** (`saltmarsh_pool`) | pocket | today | 1 / 1 | 2 | ordinary | yes |  |
| **Saltmarsh Coast** (`saltmarsh`) | coast | today | 1 / 1 | 2 | ordinary+special |  | RA-11 |
| **Wrackline** (`wrackline`) | route | phase 1 | 1 / 1 | 1 | ordinary+special | yes |  |
| **Lantern Quay** (`lanternquay`) | town | phase 1 | 1 / 1 | 0 | none |  | RA-15 |
| **Greywash Sound** (`greywash`) | water | phase 2 | – / 2 | – | ordinary | yes | RA-14 |
| **Keelcave** (`keelcave`) | cave | phase 6 | – / 2 | – | ordinary |  | RA-14 |

- **Saltmarsh Road**: Thornwood to Saltmarsh Coast past the Thorn gate (exists); Tobin; Moon Pool on its west side. *Habitat:* Marsh road (country saltmarsh), 119 tall-grass tiles today. *Links:* Thornwood (Thorn Badge), Moon Pool (a Tide partner), Saltmarsh Coast. *Revisit:* Moon Pool (Tide partner).
- **Moon Pool**: Moon Pool pocket (exists): Tide partner door; Tide Ride opens its far lip onto Greywash Sound so it stops being a dead end. *Habitat:* Moonlit pool (country saltmarsh) with its own extra species today. *Links:* Saltmarsh Road (a Tide partner), Greywash Sound (Tide Ride, phase 2). *Revisit:* Far lip to Greywash (Tide Ride).
- **Saltmarsh Coast**: Saltmarsh Coast (exists): Nerys's flats (Tide Badge); junction to Wrackline and Ashstair; no healer, so not a town. *Habitat:* Flooding coastal flats, 72 tall-grass tiles today (country saltmarsh). *Links:* Saltmarsh Road, Wrackline, Ashstair (Tide Badge). Special: Breakwatermane first meeting at 14 explores is unchanged. *Revisit:* Wrackline and Lantern Quay; Ashstair.
- **Wrackline**: Coast to Lantern Quay along the tide line where Cato walks; the early fishing pier. *Habitat:* Tide line of weed and shells (design names table). *Links:* Saltmarsh Coast, Lantern Quay. Special: Breakwatermane return site on the beach where the tide draws back; Fishing pier (Tide partner, map's wild table). *Revisit:* Fishing after Tobin; Breakwatermane site.
- **Lantern Quay**: New coast town at the end of Wrackline: quay inn under the lighthouse (Perrin, proposed), net loft; Tide Ride entry to Greywash Sound. *Habitat:* Harbour town. *Links:* Wrackline, Greywash Sound (Tide Ride, phase 2). Healer: Perrin (proposed). *Revisit:* Greywash Sound launch (Tide Ride); Glide inn; Tobin's tally errand ends here (sq-tobin-tally).
- **Greywash Sound**: Mid-game rideable water: first screen in phase 2 loops Moon Pool to Lantern Quay; grows to The Open Grey in phase 6; Keelcave opens off it. *Habitat:* Grey sound (water route). *Links:* Moon Pool (Tide Ride, phase 2), Lantern Quay (Tide Ride, phase 2), The Open Grey (Tide Ride, phase 6), Keelcave (Tide Ride, phase 6). *Revisit:* Coast Ring; Keelcave.
- **Keelcave**: Short dry sea cave off Greywash Sound; a Tide lesson slip on the back ledge. *Habitat:* Sea cave a keel could scrape. *Links:* Greywash Sound (Tide Ride, phase 6). *Revisit:* Lesson slip (WB-WORLD-5); Breakwatermane may enter.

### Ember country and the pass

| Place | Kind | Built | Reach | Heal | Encounters | Original | Issues |
|---|---|---|---|---|---|---|---|
| **Ashstair** (`ashstair`) | route | phase 1 | 2 / 2 | 1 | ordinary | yes |  |
| **Kilnvent** (`kilnvent`) | cave | phase 3 | – / 2 | 2 | ordinary | yes |  |
| **Warmstep** (`emberfall`) | town | today | 2 / 2 | 0 | special |  | RA-06, RA-11 |
| **Sootpath** (`sootpath`) | route | phase 1 | 3 / 2 | 1 | ordinary | yes | RA-06 |
| **Highlatch** (`cloudglass`) | town | today | 3 / 2 | 0 | special |  | RA-11 |
| **Crest Path** (`crestpath`) | route | phase 6 | – / 2 | 1 | ordinary |  |  |
| **Lampcrown** (`lampcrown`) | summit | phase 6 | – / 2 | 2 | special |  |  |
| **Pass Foot** (`passfoot`) | route | phase 1 | 4 / 2 | 1 | ordinary | yes |  |

- **Ashstair**: The climb from Saltmarsh Coast to Warmstep behind the Tide Badge; Kilnvent's mouth sits on it. *Habitat:* Climb off the coast toward the warm springs; first real tile heights. *Links:* Saltmarsh Coast (Tide Badge), Kilnvent (phase 3), Warmstep. *Revisit:* Kilnvent (phase 3).
- **Kilnvent**: Cave between Tide and Ember country on Ashstair; first room opens with Ashstair, the warm dark needs Lantern; far door to Sootpath. *Habitat:* Warm volcanic dark, Toren's kiln country. *Links:* Ashstair (phase 3), Sootpath (Lantern, phase 3). *Revisit:* Lantern deep room; Sootpath far door; Sela's stone.
- **Warmstep**: Warmstep: the springs and spring-house (Hest, proposed); Toren (Ember Badge) teaches Lantern here. *Habitat:* Warm highland springs; today's map carries 109 tall-grass tiles (country emberfall). *Links:* Ashstair, Sootpath (Ember Badge rope until WB-WORLD-ORDER). Healer: Hest (proposed). Special: Hearthcrown return site on the spring terrace (outdoors); Hearthcrown first meeting at 14 explores is unchanged. *Revisit:* Lantern lesson night; Sela's errand (sq-sela-warmth); Glide inn.
- **Sootpath**: Warmstep to Highlatch past the vent; Kilnvent's far door and the Orchard Fen rockfall chord arrive here. *Habitat:* Path past the vent toward the pass. *Links:* Warmstep (Ember Badge rope until WB-WORLD-ORDER), Kilnvent (Lantern, phase 3), Highlatch, Orchard Fen (Stone Break, phase 2). *Revisit:* Kilnvent far door (Lantern); Orchard Fen chord (Stone Break).
- **Highlatch**: Highlatch: Vessa's shelter and lodge (Yarrow, proposed), Beacon Badge, Glide lesson; junction of Sootpath, Pass Foot, Crest Path and Glassfall. *Habitat:* High pass in cloud; today's map carries 108 tall-grass tiles (country cloudglass). *Links:* Sootpath, Crest Path (phase 6), Reedhold (Glide, down only, phase 4), Pass Foot (Beacon Badge rope until WB-WORLD-ORDER). Healer: Yarrow (proposed). Special: Lanterncrest surface meeting already exists and is kept. *Revisit:* Glide and Glassfall; Crest Path to Lampcrown (phase 6); Vessa's errand (sq-vessa-beacon).
- **Crest Path**: Up from Highlatch to Lampcrown (phase 6). *Habitat:* Summit trail. *Links:* Highlatch (phase 6), Lampcrown (phase 6). *Revisit:* Lampcrown and Lanterncrest's return.
- **Lampcrown**: Summit under Lanterncrest's sky (phase 6); the return to Lanterncrest and the view of Kilnvent's warmth; last stair needs Daymark. *Habitat:* High rock summit with a clear 4x4 pad. *Links:* Crest Path (phase 6). Special: Lanterncrest return. *Revisit:* Daymark last stair.
- **Pass Foot**: Highlatch down to Reedhold and back: the slow way that stays after Glassfall; the Pass Ring's walk. *Habitat:* Mountain descent (country cloudglass in the historical tables). *Links:* Highlatch (Beacon Badge rope until WB-WORLD-ORDER), Reedhold, The Dry Boards. *Revisit:* Pass Ring return climb.

### The basin hub

| Place | Kind | Built | Reach | Heal | Encounters | Original | Issues |
|---|---|---|---|---|---|---|---|
| **Reedhold** (`stillreed`) | town | today | 4 / 2 | 0 | special |  | RA-11 |
| **The Dry Boards** (`dryboards`) | passage | phase 1 | 4 / 2 | 1 | none |  | RA-12 |
| **The Long Boards** (`longboards`) | route | phase 1 | 4 / 2 | 1 | ordinary |  | RA-12 |
| **Orchard Fen** (`orchardfen`) | route | phase 1 | 4 / 2 | 1 | ordinary | yes | RA-03 |
| **The Quiet Channels** (`quietchannels`) | water | phase 6 | – / 2 | – | ordinary |  |  |
| **Lowbell** (`lowbell`) | cave | phase 6 | – / 2 | – | ordinary | yes |  |

- **Reedhold**: Reedhold, the hub (seven links): Olan's ferry landing (Reed Badge), Juna (healer, proposed), Colm's shop (the only new full shop, proposed), ferry house. *Habitat:* Basin landing among reeds and channels; today's map carries 61 tall-grass tiles (country stillreed). *Links:* Highlatch (Glide, down only, phase 4), Pass Foot, The Dry Boards, The Long Boards, The Late Path (Reed Badge rope until WB-WORLD-ORDER), Orchard Fen, The Quiet Channels (Tide Ride, phase 6). Healer: Juna (proposed). Special: Stillwake return site at the Reedhold jetty; the surface meeting at 14 explores stays. *Revisit:* Quiet Channels to Lowbell (Tide Ride); Lowbell errand (sq-lowbell); Glassfall landing; Glide inn.
- **The Dry Boards**: Covered passage inside the Long Boards that returns a tamer from Reedhold to Pass Foot without climbing Glassfall. *Habitat:* Passage, not a route or cave. *Links:* Reedhold, Pass Foot. *Revisit:* Pass Ring return.
- **The Long Boards**: Reedhold toward the west boardwalk; the Dry Boards passage lies inside its maps. *Habitat:* Boardwalk over basin water. *Links:* Reedhold. *Revisit:* Dry Boards back to Pass Foot.
- **Orchard Fen**: Reedhold to Threadmeet over Evren's raised orchard ground; a rockfall branch returns to Sootpath after Stone Break. *Habitat:* Orchard on raised fen ground. *Links:* Reedhold, Sootpath (Stone Break, phase 2), Threadmeet. *Revisit:* Rockfall chord to Sootpath.
- **The Quiet Channels**: Reedhold's jetty to Lowbell; you and a Tide partner cross while the skiff stays tied. *Habitat:* Basin channels (water route). *Links:* Reedhold (Tide Ride, phase 6), Lowbell (Tide Ride, phase 6). *Revisit:* Lowbell.
- **Lowbell**: A bell under the water below The Quiet Channels; Stillwake's deep water and the bell errand, not a second guardian. *Habitat:* Flooded shrine floor (Tide Ride). *Links:* The Quiet Channels (Tide Ride, phase 6). *Revisit:* Bell errand (sq-lowbell).

### The hills and the commons

| Place | Kind | Built | Reach | Heal | Encounters | Original | Issues |
|---|---|---|---|---|---|---|---|
| **The Late Path** (`latepath`) | route | phase 1 | 5 / 2 | 1 | ordinary+special | yes |  |
| **Bellstep** (`hollowecho`) | town | today | 5 / 2 | 0 | special |  | RA-04, RA-11 |
| **Flintcut** (`flintcut`) | route | phase 1 | 5 / 2 | 1 | ordinary |  |  |
| **The Answering Ways** (`answering`) | cave | phase 3 | – / 2 | 2 | ordinary+special | yes | RA-04, RA-17 |
| **Ribbon Road** (`ribbonroad`) | route | phase 1 | 4 / 2 | 1 | ordinary | yes | RA-03 |
| **Threadmeet** (`sunthread`) | town | today | 4 / 2 | 0 | special |  | RA-03, RA-11, RA-13 |
| **Shelter Mile** (`sheltermile`) | route | phase 1 | 7 / 2 | 1 | ordinary |  |  |

- **The Late Path**: Reedhold to Bellstep through Senna's country, where echoes answer late; a Hush night path with a carving. *Habitat:* Echoing ridge path. *Links:* Reedhold (Reed Badge rope until WB-WORLD-ORDER), Bellstep. Special: Veilmote nest ledge on the Hush night path (site only; no meeting exists yet). *Revisit:* Night path (Hush).
- **Bellstep**: Bellstep: Senna (Echo Badge), Veslin's bell, the bell house (Iren, proposed); mouth of the Answering Ways; the reveal mouth at (19, 8) stays scenery until depthReturns. *Habitat:* Hill hamlet over caves; today's map carries 57 tall-grass tiles (country hollowecho). *Links:* The Late Path, Flintcut, Ribbon Road (Echo Badge rope until WB-WORLD-ORDER). Healer: Iren (proposed). Special: Undertone first meeting beside the hamlet bell at 14 explores is unchanged; its return is the cave. *Revisit:* The Answering Ways; Senna's echo stones (sq-senna-stones; last stone needs Hush); Reveal stair (depthReturns + Hush).
- **Flintcut**: Bellstep to the Answering Ways' second door; Flintroot clears loose stone. *Habitat:* Quarry track. *Links:* Bellstep, The Answering Ways (phase 3). *Revisit:* Answering Ways.
- **The Answering Ways**: First enterable cave (Bellstep mouth, not the reveal tile); lit first hall, deeper halls need Lantern; Stone Break cracks; Hush wall-doors. *Habitat:* Echoing caverns lit by Bellmote-light near the mouth. *Links:* Flintcut (phase 3). Special: Undertone return site at the first bend. *Revisit:* Lantern halls; Stone Break cracks; Hush doors and Mist Veil niche.
- **Ribbon Road**: Bellstep to Threadmeet so the hills and the commons meet twice; Ribbonstride's ribbons. *Habitat:* Loom road with ribbon posts. *Links:* Bellstep (Echo Badge rope until WB-WORLD-ORDER), Threadmeet. *Revisit:* Second hills-to-commons crossing.
- **Threadmeet**: Threadmeet: Halen (Loom Badge) at the hall (Solla, proposed); Pell's counter; nursery gate (Grove Wake); Greymill's stuck door (Hush); far end of Larkburrow. *Habitat:* Commons and fields; today's map carries 64 tall-grass tiles (country sunthread). *Links:* Orchard Fen, Ribbon Road, Larkburrow (Stone Break, Loom Badge, phase 6), Shelter Mile (Loom Badge rope until WB-WORLD-ORDER). Healer: Solla (proposed). Special: Meadowmantle return site at the nursery, outdoors; Greymill roamer only if Evan approves Greysail (not added). *Revisit:* Halen's passing-along (sq-halen-passing); Nursery gate; Greymill; Home Burrow.
- **Shelter Mile**: Threadmeet to the High Watch along the shelter ties. *Habitat:* Road of shelter ties (not a market street). *Links:* Threadmeet (Loom Badge rope until WB-WORLD-ORDER), The High Watch. *Revisit:* Daymark at a shelter tie (Halen).

### The High Watch, the sea and the end

| Place | Kind | Built | Reach | Heal | Encounters | Original | Issues |
|---|---|---|---|---|---|---|---|
| **The High Watch** (`farwatch`) | town | today | 7 / 2 | 0 | special |  | RA-11, RA-19 |
| **Chart Road** (`chartroad`) | route | phase 1 | 7 / 2 | 1 | ordinary | yes | RA-19 |
| **Seaward Ledge** (`seaward`) | route | phase 1 | 7 / 2 | 1 | ordinary+special |  |  |
| **The Open Grey** (`opengrey`) | water | phase 6 | – / 2 | – | ordinary |  | RA-16 |
| **Outer Shoal** (`outershoal`) | shoal | phase 6 | – / 2 | – | ordinary |  | RA-15, RA-16 |
| **Trial Road** (`trialroad`) | route | phase 1 | 7 / 2 | 1 | ordinary |  | RA-05 |
| **Trialstair** (`trialstair`) | cave | phase 6 | – / 2 | 1 | ordinary | yes | RA-05 |
| **Returning Light League** (`league`) | town | today | – / 8 | 0 | none |  | RA-05 |
| **The Lighthouse Spire** (`spire`) | tower | today | – / 8 | 1 | none |  |  |

- **The High Watch**: The High Watch: Rysa (Horizon Badge), the ledger house (Quen, proposed); gateway to Chart Road, Seaward Ledge and Trial Road. *Habitat:* Coastal lookout; today's map carries 31 tall-grass tiles (country farwatch). *Links:* Shelter Mile, Chart Road, Seaward Ledge, Trial Road. Healer: Quen (proposed). Special: Watchlight first meeting at 14 explores unchanged; its return site is the harbour light on Seaward Ledge. *Revisit:* Rysa's errand (sq-rysa-skiffs); Coast Ring end point; Glide inn.
- **Chart Road**: Lookout loop that leaves the High Watch and returns to it; Delka writes where a plan changed. *Habitat:* Lookout ground. *Links:* The High Watch. *Revisit:* Loop walk; Delka.
- **Seaward Ledge**: The High Watch down to the pier and The Open Grey; second fishing pier. *Habitat:* Cliff walk to the pier. *Links:* The High Watch, The Open Grey (Tide Ride, phase 6). Special: Watchlight return site at the harbour light; Fishing pier. *Revisit:* Open Grey (Tide Ride); Fishing.
- **The Open Grey**: Third water route: Seaward Ledge to Outer Shoal and the far end of Greywash Sound; closes the Coast Ring. *Habitat:* Open sea (water route). *Links:* Seaward Ledge (Tide Ride, phase 6), Greywash Sound (Tide Ride, phase 6), Outer Shoal (Tide Ride, phase 6). *Revisit:* Outer Shoal; Coast Ring.
- **Outer Shoal**: The islands Farwatch's lore points at (phase 6); a later boat to a second region after leagueEnding. *Habitat:* Shoal islands. *Links:* The Open Grey (Tide Ride, phase 6). *Revisit:* Second-region boat (separate design doc).
- **Trial Road**: Last road from the High Watch to the league; Trialstair is inserted in phase 6. *Habitat:* Victory road. *Links:* The High Watch, Trialstair (phase 6). *Revisit:* Trialstair side rooms.
- **Trialstair**: Last cave before the league (phase 6): main stair with all eight badges, side rooms per lesson with slips and a rest. *Habitat:* Victory cave. *Links:* Trial Road (phase 6), Returning Light League (all eight badges, phase 6). *Revisit:* Lesson side rooms.
- **Returning Light League**: Returning Light League: Nelva (healer, exists) and the courts; needs all eight badges. *Habitat:* League grounds. *Links:* Trialstair (all eight badges, phase 6), The Lighthouse Spire (after the Champion ending). Healer: Nelva (exists). *Revisit:* Rematches; Spire after the ending; Orla's reflection errand (sq-spire-memory).
- **The Lighthouse Spire**: The Lighthouse Spire after the Champion ending: Orla's floors and the Spire regulars. *Habitat:* Tower. *Links:* Returning Light League (after the Champion ending). Special: Daymark outdoor stone on the approach; SPIRE_REGULARS trainer encounters, not wild. *Revisit:* Post-game floors.

### Glassfall (a link, not a map)

- **Glassfall** (`glassfall`, Highlatch to Reedhold, down only, Glide): One-way descent from Highlatch to Reedhold after Glide; the gift inside the Pass Ring. *Habitat:* Drawn as an arrow, not a map. *Encounters:* none. Counted as a link. If the dev lead builds it as a map (graph note), classify it then; a descent map with no grass needs no encounter table.

## Issues and recommended resolutions

P0 blocks finalising encounters. P1 must be settled before the affected phase is built. P2 should be fixed when the file is next touched. P3 is a note.

### RA-01 (P0, encounters): Wild levels have no policy once the later roads open after two badges

- **Established:** WB-WORLD-ORDER opens the later roads after the Thorn and Tide Badges; Wardens scale to badges held; CAP_TABLE caps a 2-badge team at 35; the historical country bands run 32 to 72.
- **Finding:** After ORDER, 38 of the 46 map nodes are reachable with only Thorn and Tide and no lessons. Fixed per-country bands would put the later roads above the cap. route-encounters.md (integration 3) and PR #539 both flag it; nothing decides it.
- **Recommendation (proposal):** Decide one rule before finalising tables: each encounter area stores a relative band, and the level is chosen when the encounter starts from the badges held, clamped to CAP_TABLE, the same way Wardens already scale. Areas reachable at 0 or 1 badge keep fixed low bands.
- **Decided:** Evan, 2026-10-18: scale to badges (the recommended rule). Wild levels follow the badges held, like the Wardens; early roads keep fixed low bands.
- **Owner:** Decided by Evan; Codex applies it in the encounter proposal. **Sources:** wildbond-world-design.md §2 Wardens, route-encounters.md, PR #539.

### RA-02 (P0, encounters): Encounter areas need a fixed denominator tied to graph ids

- **Established:** The native chapter joins Larkhaven, Thornwood Trail, Millgrass Lane and the Dewcut approach in one continuous grid. Evan's rule counts encounter areas.
- **Finding:** Without a fixed list, the at-least-half-originals rule cannot be checked, and grass inside one grid can blur two graph places.
- **Recommendation (proposal):** An encounter area is one graph place id. Tag every grass patch, cave floor and water surface with the place id it belongs to. The denominator is the 33 places this audit classes as ordinary (including ordinary+special); at least 17 need an original. This audit marks 18 recommended areas across every country and the water. Codex may swap areas if both counts and the spread still hold.
- **Owner:** Codex. **Sources:** WILDBOND-HANDOFF.md, opening chapter README.

### RA-03 (P1, progression): Orchard Fen has no rope, so Threadmeet opens two badges early in WB-WORLD-1

- **Established:** WB-WORLD-1 keeps today's ropes and says Orchard Fen and Ribbon Road stay behind the later ropes so Threadmeet does not open early. Today Sunthread is behind the Echo Badge.
- **Finding:** Computed on the graph with phase-1 ropes: Reedhold (4 badges) to Orchard Fen to Threadmeet reaches Threadmeet and Ribbon Road at 4 badges instead of 6. gates.md open point 4 and route-encounters.md integration 1 flag it unresolved.
- **Recommendation (proposal):** Add {link: orchardfen--sunthread, badge: echo} to ropesUntilOrder (today's Hollowecho to Sunthread rope, placed at the Threadmeet end). Orchard Fen itself stays walkable from Reedhold. WB-WORLD-ORDER lifts it with the others.
- **Owner:** Graph owner / Wildbond dev lead. **Sources:** wildbond-world-design.md §7 WB-WORLD-1, gates.md, route-encounters.md.

### RA-04 (P1, connections): The Answering Ways has no link from Bellstep, its own mouth

- **Established:** The design puts the first cave's mouth in the hamlet (not tile 19, 8). answering.json has an S exit to hollowecho. The lead ruled the edge on #373.
- **Finding:** The graph has only flintcut--answering, so the cave is a dead end from Flintcut and the mouth Bellstep is promised is missing.
- **Recommendation (proposal):** Adopt PR #523's ungated two-way phase-3 hollowecho--answering edge (the ruled change). The graph then has 55 links.
- **Owner:** Graph owner via PR #523. **Sources:** answering.md point 1, PR #523, #373 ruling.

### RA-05 (P1, connections): Trial Road's direct way into the league before phase 6 is only a note

- **Established:** The design keeps Trial Road reaching the league until Trialstair is inserted in phase 6. Today's Farwatch north exit asks for all eight badges.
- **Finding:** The graph has no link for phases 1 to 5, so a validator cannot show the ending stays reachable then (gates.md open point 9).
- **Recommendation (proposal):** Record a trialroad--league link (gate: all eight badges, phase 1) marked as replaced by trialstair in phase 6, or add a phase-range field the tests honour. Do not move the league door.
- **Owner:** Graph owner. **Sources:** wildbond-world-design.md §2 Routes, gates.md open point 9.

### RA-06 (P1, progression): Sootpath's Ember rope is assumed lifted but not named

- **Established:** Today's Emberfall north exit asks for the Ember Badge. WB-WORLD-ORDER's lifted list omits it, but its done check needs Sootpath open after two badges.
- **Finding:** The graph and gates file follow the done check; the design text still disagrees with itself.
- **Recommendation (proposal):** Keep ember on emberfall--sootpath until WB-WORLD-ORDER, and add the Ember rope to that phase's lifted list when the design is next edited.
- **Owner:** Wildbond dev lead confirms. **Sources:** world-graph.md question 1, gates.md open point 3.

### RA-07 (P1, landings): Most arrival landings are unknown and must stay unknown until each grid is measured

- **Established:** Six phase-0 links have verified 2D landings. Knothollow, the Answering Ways and Larkburrow briefs keep landings null with landing: planned.
- **Finding:** See the per-link landing status counts in region-audit.md. The native chapter's grid uses different coordinates, so legacy tiles are not native landings.
- **Recommendation (proposal):** Resolve each landing when its place is drafted with location-template.md, on the runtime that will use it, and keep the runtime-landing validators rejecting nulls at wiring. The per-link status is recorded here; none is filled in.
- **Owner:** Whoever builds each place. **Sources:** knothollow.md, answering.md, wildbond-layout README, location-template.md.

### RA-08 (P1, first-expedition): The first expedition is an out-and-back with no destination yet and no loop until Grove Wake

- **Established:** The native chapter plays Maren's catch, inn and return. Deeper Thornwood and Dewcut have closed boundaries. In the graph, Rootwater and Dewcut are spurs until the Thorn Badge and Grove Wake join them through Knothollow.
- **Finding:** Larkhaven to Thornwood Trail and back is a sound first outing, but Thornwood (the town) is not built in the chapter, so there is no Warden, healer or arrival moment at the far end. The first loop (Trail, Dewcut, Old Root Grove, Knothollow, Rootwater, Thornwood) needs the Thorn Badge and Grove Wake (bond 60), so it may come late.
- **Recommendation (proposal):** Next, build Thornwood (the town) as the destination: Isolde at the hawthorn gate and the Gate Loft healer together, so the outing ends with a rest and a goal. Keep the return home on the same trail (the classic first-route shape) and keep the visible future access: Larkburrow's shut mouth, the Dewcut shelf, Rootwater's cave door. Treat the Knothollow ring as the first loop and confirm Grove Wake's timing (RA-09).
- **Owner:** Codex (chapter); Evan for pacing. **Sources:** opening chapter README, world-graph.json, gates.json.

### RA-10 (P1, healing): Thornwood's healer is a proposal; the first destination has no rest yet

- **Established:** Hedda and the Gate Loft are proposed for phase 1. Old Ned's inn exists.
- **Finding:** The three-step healer rule holds early only if Hedda exists; Old Root Grove is already at three steps.
- **Recommendation (proposal):** Ship the Gate Loft healer with the first Thornwood town build (RA-08). The other proposed keepers follow their town phases.
- **Owner:** Codex (chapter). **Sources:** wildbond-world-design.md §2 Towns.

### RA-09 (P2, progression): Grove Wake's teaching badge is inferred, and it sets when the first loop opens

- **Established:** The grove teaches Grove Wake at the antler sign; the design gives no badge. gates.json records thorn as inferred.
- **Finding:** If Grove Wake is later than Thorn, the Knothollow ring opens later still.
- **Recommendation (proposal):** Record thorn as decided rather than inferred in gates.json when it is next edited.
- **Decided:** Evan, 2026-10-18: Grove Wake is learnable after the Thorn Badge (still needing a Loyal Grove partner).
- **Owner:** Decided by Evan; gates.json owner records it. **Sources:** gates.md open point 1.

### RA-11 (P2, encounters): Today's region screens become towns but hold most of today's grass and the Legends' first meetings

- **Established:** Eight current maps become towns (31 to 113 tall-grass tiles each), and Saltmarsh Coast keeps 72. Legends' first meetings fire on explores counted by country (biome id), not map (main.gd explored_in).
- **Finding:** Creature-game towns usually have no grass; removing it is safe only if the same country's routes keep counting explores.
- **Recommendation (proposal):** Towns get no ordinary encounters in new layouts. Each new route keeps its parent country's biome id, so explore-driven first meetings still fire. Check each Legend threshold stays reachable. Old saves on removed grass use hard rule 1's nudge.
- **Owner:** Codex (encounter data) and the map builder. **Sources:** wildbond-world-design.md §2 Guardians, wildbond.json MAPS, main.gd explored_in.

### RA-12 (P2, connections): The Long Boards is a dead end although the Dry Boards are inside it

- **Established:** The design places the Dry Boards inside the Long Boards maps. The graph links dryboards to stillreed and passfoot, never to longboards.
- **Finding:** longboards has one link (Reedhold). The data hides that the Dry Boards are reached through it.
- **Recommendation (proposal):** Record longboards as the Dry Boards' parent (a field or note), or describe the Reedhold to Dry Boards link as the Long Boards' west end, following PR #523's descriptor. No new route.
- **Owner:** Graph owner via PR #523. **Sources:** wildbond-world-design.md §2 Routes, PR #523.

### RA-13 (P2, connections): Greymill is named but has no node

- **Established:** Greymill is a side door off Threadmeet with a Hush stuck door; gates.json places it as a spot on sunthread.
- **Finding:** Encounter and finds work could treat it as a missing map.
- **Recommendation (proposal):** Keep it a Threadmeet sub-area, not a node. Class it as no encounters until Evan approves Greysail.
- **Owner:** Graph owner. **Sources:** wildbond-world-design.md §2 Guardians, gates.md open point 8.

### RA-14 (P2, consistency): Keelcave is in the prose and graph but not the flowchart

- **Established:** The caves list puts Keelcave off Greywash Sound; the graph marks greywash--keelcave extraToFlowchart.
- **Finding:** The design text disagrees with itself.
- **Recommendation (proposal):** The prose and graph stand. Add Keelcave to the flowchart the next time the design doc is edited.
- **Owner:** Design doc owner. **Sources:** world-graph.md question 2.

### RA-15 (P2, consistency): errands.json treats Lantern Quay and Outer Shoal as unassigned places

- **Established:** The graph assigns lanternquay and outershoal.
- **Finding:** Tobin's errand is anchored on saltmarsh_route with a named place although the ids exist.
- **Recommendation (proposal):** Use the graph ids in errands.json when it is next revised.
- **Owner:** Errands data owner. **Sources:** errands-schema.md.

### RA-17 (P2, encounters): Existing wild lists are historical, original-only tables

- **Established:** route-encounters.json (WBW-5), knothollow.json and answering.json copy the legacy BIOMES lists of original species.
- **Finding:** Evan's current direction makes Pokémon the main reusable roster with originals in at least half the areas.
- **Recommendation (proposal):** Label those wild lists historical. Use their level bands only as evidence. Codex's proposal supersedes them.
- **Owner:** Codex. **Sources:** route-encounters.md, knothollow.md, answering.md, WILDBOND-HANDOFF.md.

### RA-16 (P3, healing): Optional lesson chains are long without a town

- **Established:** With every lesson, the longest town-free walk is six routes (world-graph.md question 5); every place stays within three steps of a healer.
- **Finding:** Old Root Grove and Outer Shoal sit at three steps, the limit.
- **Recommendation (proposal):** Accept: nothing forces the long walk. Revisit only if playtests show tired teams on the Coast Ring.
- **Owner:** None now. **Sources:** world-graph.md question 5, PR #537.

### RA-18 (P3, consistency): Glassfall appears both as a place and as a link

- **Established:** The graph stores glassfall in places with isLink and in links.
- **Finding:** Counting places without skipping isLink gives 47.
- **Recommendation (proposal):** Keep it. Consumers skip isLink; this audit counts it once, as the link.
- **Owner:** None. **Sources:** world-graph.md.

### RA-19 (P3, landings): Chart Road's loop is one link but needs two High Watch landings

- **Established:** farwatch--chartroad has loop: true.
- **Finding:** One record cannot carry the out and back arrival tiles.
- **Recommendation (proposal):** At wiring, give Chart Road two exits into the High Watch and record both landings.
- **Owner:** Map builder. **Sources:** world-graph.json.

### RA-20 (P3, consistency): Use the graph's names for Thornwood the town and Thornwood Trail

- **Established:** The graph separates thornwood_route (Thornwood Trail) and thornwood (the town).
- **Finding:** Chapter notes say 'deeper Thornwood' for both.
- **Recommendation (proposal):** Name the place id in tickets and reports.
- **Owner:** Everyone. **Sources:** opening chapter README, WILDBOND-HANDOFF.md.

## Established facts versus this audit's proposals

**Established, and unchanged by this audit:**

- The 15 current map ids and their exits.
- The eight Wardens and their badge order.
- The Thorn-then-Tide rule and the league needing all eight badges.
- The two element pockets.
- Old Ned and Nelva as healers.
- The approved starter trio and Bogsnap as a standout.
- The nine Legends and their first meetings.
- Every place id in the graph.

**Planned (merged plans, not canon):**

- The graph's other 31 places and 48 links.
- The seven lessons and their teachers.
- The eight proposed keepers.
- The errands and the briefs.

**Proposed here:** every *Recommendation* above, the encounter classes, and the 18 recommended original areas. None is
applied to any other file.

## Validation

```text
python3 -m unittest tools/test_wildbond_region_audit.py
```

The test reads the graph, the cave briefs and `wildbond.json`. It checks that:

- Every graph place appears exactly once and Glassfall appears as a link.
- All 54 links carry the graph's ends, gate and phase, and each place lists every link that touches it.
- The stored reach numbers match a fresh walk of the graph, and the Orchard Fen leak and its one-record fix both hold.
- 38 places are reachable after WB-WORLD-ORDER with two badges.
- Towns have no ordinary encounters.
- At least half the 33 areas have an original, spread over badge counts 0 to 7.
- Verified landings equal today's exits, and candidates are real exit tiles that stay unresolved.
- The briefs' landings really are null, and no landing is invented.
- Every issue is complete and cross-referenced.
