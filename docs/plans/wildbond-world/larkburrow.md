# WBW-9: Larkburrow layout, the Home Burrow

This is a planning blueprint, not a map the game loads. The contract is [the WBW-9 guest row](../guest-backlog.md) and sections 2 and 5 of [the world design](../wildbond-world-design.md): section 2, cave 5, and "Loops and the one-way shortcut" for the Home Burrow; the "Who may enter" table and the art table for the 48×48px mouths; "Who lives in the new places" for the missing wild table; and the `sq-nora-bird` row of the errands table. Only this note, `larkburrow.json` and `tools/test_wildbond_world_larkburrow.py` belong to this task. Existing game data is read, never modified. It follows the format of [Knothollow](knothollow.md) and [the Answering Ways](answering.md).

## Schema

The envelope has `id: "larkburrow"`, `map`, `gates`, `zones`, `markers`, `layout` and `integration`. The `map` has the same eight fields as Knothollow's: `name`, `biome`, `start`, `rows`, `exits`, `signs`, `items` and `wild`. Coordinates are zero-based `[x, y]`.

Each exit keeps the current MAPS field names `to`, `x`, `y` and `dir`, plus `landing: "planned"` with all three set to null, as the approved WBW-2 format does. Neither landing is placed here. Millgrass Lane is only a planned map (route 2 in the design's table), and the back of Threadmeet has no placed door on the existing `sunthread` map. `python3 tools/test_wildbond_world_larkburrow.py --runtime-landings` must exit 1 with `planned landing must be resolved before runtime wiring`; the unit suite covers that expected failure too.

Threadmeet's map id is `sunthread` (its name in the world graph is Threadmeet), so the east exit goes to `sunthread`. The west exit goes to `millgrass`.

## The layout

The grid is 28 by 11 tiles. `#` is wall and `.` is floor; `W` and `E` are the two exit tiles. The letters below are overlays from the file and are not tiles: `D` the stone door, `B` Nora's wooden bird, `s` the start.

```
    0123456789012345678901234567
 0  ############################
 1  ############################
 2  #........B.######........###
 3  #....#.....######...#....###
 4  W.............D............E
 5  W.s...........D............E
 6  W.............D............E
 7  #.....#....######....#...###
 8  #..........######........###
 9  ############################
10  ############################
```

- **Both mouths are 3 tiles wide and 3 tiles tall (48×48px).** `W` at `(0,4)` to `(0,6)` is the Millgrass Lane mouth. `E` at `(27,4)` to `(27,6)` is the mouth on the back of Threadmeet. The ceiling is 48px, so mounts may enter, as the design's "Who may enter" table says. The test walks a 2 by 2 body from the west mouth to the east one, as the Answering Ways test does for Undertone's pad. The shut mouth on Millgrass stays this wide even while it is shut; that is the Millgrass map's business and not drawn here.
- **The first room** is the west end, `x 1` to `10`, `y 2` to `8`, with two rock pillars. Start is `(2,5)`, facing right, one tile inside the mouth. A short passage, `x 11` to `13`, runs to the door.
- **The stone door** is three tiles, `(14,4)` to `(14,6)`, as wide as the passage. It is floor with an overlay, never a new glyph, the same as the gates in the other caves. Past it is a short passage and the back room, `x 17` to `24`, then the passage to the Threadmeet mouth.
- **No encounter patch.** The design gives Larkburrow no wild table: the wooden bird is a prop and the burrow is a road. `wild` is an empty list, `biome` is `thornwood` (Larkhaven's country, as Millgrass Lane's), and the test rejects any `"` tile or species. Meadowmantle stays at the Threadmeet nursery.
- **`signs` is an empty dictionary and `items` an empty list.** The design places no sign or pickup here, so none are invented. The bird is a marker, not a bag pickup.

## The door needs both, together

`gates` has two records, `far-door-stone` and `far-door-loom`. They guard the same three tiles with the same witness tile `(18,5)`, one step past the door. A door with two records needs both. Each record names its row in `gates.json`: `larkburrow--sunthread:field:stone` (Stone Break, taught by Isolde) and `larkburrow--sunthread:loom` (the Loom Badge). The test reads `gates.json` and fails if either row, its kind or its key changes.

The test checks the door in two places.

- **In the cave.** With nothing held, the first room, the bird and the Millgrass mouth are reachable; the back room and the Threadmeet mouth are not. Holding only `field:stone`, or only `loom`, changes nothing. With both, every tile is reachable. The door cannot be walked around (a dedicated fixture opens a detour and is rejected). Walking in from the Threadmeet mouth reaches only the back half while the door is shut, so the burrow does not open from the far side by itself.
- **In the world graph.** The Home Burrow loop is Millgrass Lane, Larkburrow, the back of Threadmeet. With every other lesson and badge held, the loop is closed in exactly one of the four combinations of Stone Break and the Loom Badge: both. With either one missing, the `larkburrow--sunthread` link is shut and Larkburrow is a dead end. The test also fails if the graph drops either requirement from that link, or gates the Millgrass link.

The zones list has two overlays: `first-room` (everything open with nothing, including the passage up to the door) and `through-path` (everything the door shuts off). The test checks that they match what the door does, and that together with the door and the exits they cover every floor tile.

## Nora's wooden bird

`markers` holds one entry, the prop `wooden-bird` for `sq-nora-bird`, at `(9,2)`, in the north-east corner of the first room. It needs no field lesson and no badge, in the cave and in the errand: the test reads `errands.json` and requires that the quest's recover step is in `larkburrow`, names the wooden bird and has no badge, field or story requirement. A person on foot reaches the bird with the door shut, which is the late cave phase's "even before the through-path opens". Nothing here makes the bird a pickup, or says how it is drawn or collected.

## Integration

`integration.status` is `unresolved_landings` and `destinations` names both unfinished landings.

- `visible_from_phase` is 1 and `opens_phase` is 6. The design says the mouth on Millgrass Lane is visible in phase 1 and shut, and opens in the late cave phase. The world graph makes the first-room link (`millgrass--larkburrow`) ungated at phase 6, and the test reads both. The shut state lives on the Millgrass map, so it is not drawn here.
- `incoming_requirements` records the Threadmeet side, `field:stone` and the Loom Badge, and nothing at Millgrass. These are wiring requirements for the dev lead, not gates implemented on the existing maps. Entering from the Threadmeet mouth already needs both, because the graph's link does.

## Validation and integration handoff

Run from the repository root:

```sh
python3 -m unittest tools/test_wildbond_world_larkburrow.py
python3 tools/wildbond-export-freshness.py --base origin/main --head HEAD
```

The standalone checker validates the strict planning schema, rectangular rows, TILES glyphs, a non-exit start, the two three-tile mouths on their edges, the two requirement records against `gates.json`, the door as the only way through, the zones, the bird against `errands.json`, the 48×48px mouth and ceiling, a mount walk, and the `world-graph.json` places and links. Dedicated cases reject nulls without `landing: "planned"` and unsafe resolved destinations. A set of malformed copies and edited rows is rejected, and strict JSON loading rejects duplicate keys and non-finite numbers. Nothing is added to CI.

## Not done here, and open for the dev lead and Game Art Director

- **Landing tiles.** Neither is placed. The Millgrass landing waits for that map to exist.
- **The painter and the palette.** The design says the Millgrass arch is drawn in ink outline `#1e1a22`, with inner shade `#2a2e38` that is not a floor, and that the Threadmeet mouth should read as the back of the hall hill. This file records none of that; it stays the Game Art Director's call.
- **The door's look.** "Stone until then" is a rendering decision. The overlay only says where it stands.
- **Cave size.** The 28 by 11 grid is a proposal. The design gives no cave dimensions, only the mouths, so the length and the room shapes are for the dev lead to keep or change. The test only needs each mouth to be 3 tiles wide and the passage to the door to be 3 wide.
- **A mount's footprint.** The test uses a 2 by 2 body, the same as the Answering Ways test. If the engine's mount body is bigger, the passages need widening.
- **Who has the door open.** What teaches Stone Break and how the Loom Badge is earned are in `gates.json` and the design, not here.

This PR makes no engine, runtime, save-format, art, shared-file or pack change. Normal CI and the PR body carry the final-head evidence; a data test passing does not mean the cave is playable.
