# Wildbond field lessons and gates

This is WBW-6. It lists every gate in [`wildbond-world-design.md`](../wildbond-world-design.md) as data, in [`gates.json`](gates.json), so the dev lead can wire the exit and obstacle checks and the teaching scenes (WB-WORLD-2 to 6) from one list. It is a planning file. It does not change the game, the save, the web pack or any picture, and nothing loads it. [`world-graph.json`](world-graph.json) (WBW-3) is the map these gates sit on, and this file agrees with it where both exist.

## What is in the file

- **`lessons`**: the seven field lessons, each with one teacher, one teaching badge, the element, the rule for when a partner is ready, the level cap once that badge is in hand, and what the lesson opens.
- **`gates`**: **64 records**, one per requirement: 34 field, 17 badge, 11 story and 2 element. Every record has an `id`, a `door`, a `place`, a `kind`, a `key`, a `teacher`, a `ready` rule, a `phase`, and a `source` (a heading in the design doc). Some have a `spot` (where in the place), a `note`, and `liftedIn`.
- **`badges`, `bondSteps`**: the eight badges with their Wardens and the cap after each, and the five bond steps from `rules.gd`.

A **door** is one obstacle. A door with two records needs both (Larkburrow's through-path needs `field:stone` and the Loom Badge; the reveal stair needs `depthReturns` and `field:hush`; the league door needs all eight badges). Different doors are independent. `place` is a map id from the world graph or a link id (`a--b`), and `phase` is the build phase from section 7 in which the check first applies (0 is what the game does today).

## The four kinds

| Kind | Key | Meaning |
|---|---|---|
| `field` | `field:stone`, `field:tide`, `field:grove`, `field:lantern`, `field:glide`, `field:hush`, `field:daymark` | A lesson. The story key is set when its teacher finishes teaching. |
| `badge` | a BADGES id | The badge is in the save's `badges`. |
| `story` | `depthReturns`, `leagueEnding`, `inn:<map id>` | A key the save's `story` dictionary already holds. `inn:<map id>` is set the first time the player walks through that town's inn door. |
| `element` | `element:Stone`, `element:Tide` | A partner of that element on the walking team, no lesson. Only today's two `requiresElement` exits. It is not a story key and nothing is saved. |

No gate needs a new save field. Every key is a badge, a key already in `story`, or one of the `story` keys section 6 of the design lists for phases 2 to 4 and 6.

## The seven lessons

| Lesson | Key | Element | Teacher | After badge | Ready when | Cap then | Doors |
|---|---|---|---|---|---|---|---|
| Stone Break | `field:stone` | Stone | Isolde | thorn | level 12 or Friendly (bond 20) | 25 | 5 |
| Tide Ride | `field:tide` | Tide | Nerys | tide | level 18 or Friendly (bond 20) | 35 | 10 |
| Grove Wake | `field:grove` | Grove | The antler sign in Old Root Grove | thorn (inferred) | Loyal (bond 60) | 25 | 5 |
| Lantern | `field:lantern` | Ember | Toren | ember | Loyal (bond 60) and Stay the night at the Warmstep spring-house with the Ember partner | 45 | 4 |
| Glide | `field:glide` | Gale | Vessa | beacon | level 36 or Loyal (bond 60) | 55 | 1 |
| Hush | `field:hush` | Shade | Senna | echo | Stand still at a cave mouth until the Shade partner moves first | 65 | 5 |
| Daymark | `field:daymark` | Radiant | Halen | loom | level 64 or Devoted (bond 140) | 70 | 4 |

Notes on the table:

- Where a lesson asks for a level it also offers a bond, so a tamer who fought a Warden early (the order phase) and is under the level cap can still be ready. Grove Wake, Lantern and Hush ask for no level.
- "Cap then" is `CAP_TABLE` at the number of badges held after the teaching badge in the main order (thorn 1 to horizon 8). Stone 12 is under 25, Tide 18 under 35, Glide 36 under 55 and Daymark 64 under 70.
- The bond steps used are only Friendly (20), Loyal (60) and Devoted (140), matching `rules.gd` `BOND`.

## Every gate

| Phase | Door | Place | Where | Needs |
|---|---|---|---|---|
| 0 | `league--spire` | `league--spire` |  | `leagueEnding` |
| 0 | `saltmarsh_route--saltmarsh_pool` | `saltmarsh_route--saltmarsh_pool` |  | `element:Tide` |
| 0 | `thornwood--saltmarsh_route` | `thornwood--saltmarsh_route` |  | `thorn` |
| 1 | `cloudglass--passfoot` | `cloudglass--passfoot` |  | `beacon` (until WB-WORLD-ORDER) |
| 1 | `dewcut--thornwood_grove` | `dewcut--thornwood_grove` |  | `element:Stone` |
| 1 | `emberfall--sootpath` | `emberfall--sootpath` |  | `ember` (until WB-WORLD-ORDER) |
| 1 | `hollowecho--ribbonroad` | `hollowecho--ribbonroad` |  | `echo` (until WB-WORLD-ORDER) |
| 1 | `saltmarsh--ashstair` | `saltmarsh--ashstair` |  | `tide` |
| 1 | `stillreed--latepath` | `stillreed--latepath` |  | `reed` (until WB-WORLD-ORDER) |
| 1 | `sunthread--sheltermile` | `sunthread--sheltermile` |  | `loom` (until WB-WORLD-ORDER) |
| 2 | `knothollow-deep-cracks` | `knothollow` | The deep cracks | `field:stone` |
| 2 | `lanternquay--greywash` | `lanternquay--greywash` |  | `field:tide` |
| 2 | `orchardfen--sootpath` | `orchardfen--sootpath` |  | `field:stone` |
| 2 | `rootwater--knothollow` | `rootwater--knothollow` |  | `thorn` |
| 2 | `rootwater-thickets` | `rootwater` | Thickets that hide a bend and a patch of berries | `field:grove` |
| 2 | `saltmarsh_pool--greywash` | `saltmarsh_pool--greywash` |  | `field:tide` |
| 2 | `sunthread-nursery-gate` | `sunthread` | The nursery gate on the edge of Threadmeet, beside Meadowmantle's ground | `field:grove` |
| 2 | `thornwood_grove--knothollow` | `thornwood_grove--knothollow` |  | `field:grove` |
| 2 | `thornwood_route-thickets` | `thornwood_route` | Thickets that hide a bend and a patch of berries | `field:grove` |
| 3 | `answering-dark-hall` | `answering` | Past the first lit hall; the deeper halls turn you around | `field:lantern` |
| 3 | `answering-side-cracks` | `answering` | Side cracks | `field:stone` |
| 3 | `kilnvent--sootpath` | `kilnvent--sootpath` |  | `field:lantern` |
| 3 | `kilnvent-deep-room` | `kilnvent` | Past the first room | `field:lantern` |
| 4 | `glassfall` | `glassfall` |  | `field:glide` |
| 4 | `glide-inn-cloudglass` | `cloudglass` | Glide's list entry for the Highlatch lodge | `inn:cloudglass` (and `field:glide`) |
| 4 | `glide-inn-emberfall` | `emberfall` | Glide's list entry for the Warmstep spring-house | `inn:emberfall` (and `field:glide`) |
| 4 | `glide-inn-farwatch` | `farwatch` | Glide's list entry for the High Watch ledger house | `inn:farwatch` (and `field:glide`) |
| 4 | `glide-inn-hollowecho` | `hollowecho` | Glide's list entry for the Bellstep bell house | `inn:hollowecho` (and `field:glide`) |
| 4 | `glide-inn-lanternquay` | `lanternquay` | Glide's list entry for the quay inn | `inn:lanternquay` (and `field:glide`) |
| 4 | `glide-inn-larkhaven` | `larkhaven` | Glide's list entry for Old Ned's inn | `inn:larkhaven` (and `field:glide`) |
| 4 | `glide-inn-stillreed` | `stillreed` | Glide's list entry for Reedhold's inn | `inn:stillreed` (and `field:glide`) |
| 4 | `glide-inn-sunthread` | `sunthread` | Glide's list entry for the Threadmeet hall | `inn:sunthread` (and `field:glide`) |
| 4 | `glide-inn-thornwood` | `thornwood` | Glide's list entry for the Gate Loft | `inn:thornwood` (and `field:glide`) |
| 6 | `answering-wall-doors` | `answering` | Doors that look like wall | `field:hush` |
| 6 | `daymark-town-carvings` | none yet | Faded carvings | `field:daymark` |
| 6 | `greymill-stuck-door` | `sunthread` | Greymill's stuck door, a side door off Threadmeet | `field:hush` |
| 6 | `greywash--keelcave` | `greywash--keelcave` |  | `field:tide` |
| 6 | `greywash--opengrey` | `greywash--opengrey` |  | `field:tide` |
| 6 | `hollowecho-reveal-stair` | `hollowecho` | The reveal mouth at tile (19, 8) | `depthReturns` + `field:hush` |
| 6 | `lampcrown-last-stair` | `lampcrown` | The last stair | `field:daymark` |
| 6 | `larkburrow--sunthread` | `larkburrow--sunthread` |  | `field:stone` + `loom` |
| 6 | `latepath-night-path` | `latepath` | A night path, with a carving you can read afterward | `field:hush` |
| 6 | `lowbell-flooded-floor` | `lowbell` | The flooded floor | `field:tide` |
| 6 | `opengrey--outershoal` | `opengrey--outershoal` |  | `field:tide` |
| 6 | `quietchannels--lowbell` | `quietchannels--lowbell` |  | `field:tide` |
| 6 | `seaward--opengrey` | `seaward--opengrey` |  | `field:tide` |
| 6 | `spire-approach-stone` | `spire` | The outdoor stone on the Spire approach | `field:daymark` |
| 6 | `stillreed--quietchannels` | `stillreed--quietchannels` |  | `field:tide` |
| 6 | `trialstair--league` | `trialstair--league` |  | `beacon` + `echo` + `ember` + `horizon` + `loom` + `reed` + `thorn` + `tide` |
| 6 | `trialstair-cracked-landing` | `trialstair` | A cracked landing (a side room) | `field:stone` |
| 6 | `trialstair-flooded-step` | `trialstair` | A flooded step (a side room) | `field:tide` |
| 6 | `trialstair-living-curtain` | `trialstair` | A living curtain (a side room) | `field:grove` |
| 6 | `trialstair-outdoor-stone` | `trialstair` | The last outdoor stone, if you leave and return | `field:daymark` |
| 6 | `trialstair-unlit-flights` | `trialstair` | The unlit flights (a side room) | `field:lantern` |
| 6 | `trialstair-wall-door` | `trialstair` | A wall-door (a side room) | `field:hush` |

## What the test checks

`python3 -m unittest tools/test_wildbond_world_gates.py` (50 tests):

- all seven lessons are present in order, each with one teacher (a person in the game's `CAST`, or the grove's antler sign) and one teaching badge;
- every key fits its kind and the allowed pattern, or is a BADGES id; story keys are keys the game really uses;
- bond thresholds are only 20, 60 or 140 and agree with `rules.gd`;
- each ready level is at or below the cap after its teaching badge, and each has a bond alternative;
- the league needs all eight badges, and removing any one is caught;
- both of today's `requiresElement` exits are element gates;
- every gate has a place, a phase, a source heading that is in the design doc, and the same teacher and ready rule as its lesson;
- the nine healer towns are the Glide inn list, and Glide never offers a cave, a water route, the league or the Spire;
- it agrees with `world-graph.json`, `knothollow.json` and `answering.json` when those files exist, and is skipped for each that does not. The cave-file comparison also runs on a stand-in file, so it is tested before the real files land.

Every rule is also run on deliberately broken copies (a dropped lesson, a wrong teacher, a bond of 50, a level one over its cap, a missing league badge, an unknown key, a moved phase, and so on), and each one is caught.

## Open points

These are places where the design is silent or two parts disagree. I recorded what the design says and left the design doc alone.

1. **Grove Wake has no teaching badge in the design.** Section 1 says the grove itself teaches it at the antler sign and gives no badge. The done check wants one per lesson. I recorded `thorn` and marked it `inferred` (Thorn is the first badge, and phase 2 builds this lesson after Thorn and Tide). If the Dev Lead means a different badge, or none, change `teachingBadge` and the cap changes with it.
2. **Hush's cap is 65, not the 60 you might expect.** Echo is the sixth badge, so `CAP_TABLE[6]` is 65. Hush asks for no level, so nothing depends on it.
3. **Sootpath's Ember rope** is not in WB-WORLD-ORDER's list of ropes it lifts, but its done check needs Sootpath open. I followed the done check, as WBW-3 did, and marked it `liftedIn: WB-WORLD-ORDER`.
4. **Orchard Fen's rope** is not named: the design says Orchard Fen and Ribbon Road "stay behind those same later ropes" without saying which badge. Ribbon Road has the Echo rope. Orchard Fen has no record.
5. **Stone Break at the Orchard Fen rockfall also needs "both ends of that walk" to have been walked.** The design gives no key for that and none is invented, so the record carries it only in its note.
6. **Daymark's faded carvings** are "in towns you have already visited" and the design does not say which towns, so that record has a `scope` and no `place`.
7. **The Spire approach's outdoor stone** is recorded on the `spire` map. The design says only "the Spire approach".
8. **Greymill is not a map** (it is a building off Threadmeet), so its stuck door is a Hush gate on `sunthread` with a `spot`.
9. **The league door** is recorded once, on `trialstair--league` at phase 6, the way the graph has it. Before phase 6 the same all-eight check is Trial Road's last exit (today, Farwatch's north exit); the graph has no link for that, so there is no phase 0 record.
10. **Fishing** (a marked pier with a Tide partner, no lesson) is not a gate record. Kind `element` is today's two exits only, as the row says.
11. **A Lantern, Hush or Tide lesson's scene** (staying the night, standing still, the walk to the water) has no story key beyond `field:<lesson>`, which is set when the teacher finishes. Nothing more is saved.
