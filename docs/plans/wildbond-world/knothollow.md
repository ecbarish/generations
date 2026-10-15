# WBW-2: Knothollow layout and encounters

This is a planning blueprint, not a map loaded by the game. The contract is
[the WBW-2 guest row](../guest-backlog.md) and sections 1, 2, 5 and 6 of
[the world design](../wildbond-world-design.md). Only this note,
`knothollow.json` and `tools/test_wildbond_world_knothollow.py` belong to this
task. Existing game data is read, never modified.

## Schema and unresolved destination landings

The envelope contains `id: "knothollow"`, `map`, `gates`, `layout` and
`integration`. The `map` has exactly the eight fields the row requests:
`name`, `biome`, `start`, `rows`, `exits`, `signs`, `items` and `wild`.
Coordinates are zero-based `[x, y]`. A start additionally has a direction.

Each exit retains the current MAPS field names `to`, `x`, `y`, and `dir`,
plus the explicit planning marker `landing: "planned"`.
**Both destination `x`, `y`, and `dir` values are null, as approved for this
planning artifact.** They are not source-side coordinates and
are not an engine-compatible value. Rootwater is only a planned map in
the route table. Old Root Grove exists, but its new back ring and cave
door have no placed landing. Its present `[1, 8]` start belongs to the
trail entrance and must not be repurposed as the new door. An exit's `dir`
is the arrival-facing direction, not necessarily the direction of its source
edge; it cannot be inferred from the `S` or `E` glyph either.

The [Dev Lead's ruling](https://github.com/ecbarish/generations/pull/490#issuecomment-6183963068)
requires the `planned` marker and leaves both landing tiles to WB-WORLD-2.
The [Director's ruling](https://github.com/ecbarish/generations/issues/373#issuecomment-6184111269)
explicitly allows null arrival directions too and approves review of this
planning-only piece. The validator permits null fields only with the
`planned` marker; every unmarked exit requires nonnegative integer `x`/`y`
and a valid arrival direction. A planned record keeps all three null,
rather than mixing a guessed direction with an unresolved position.

This is not a claim that the strict runtime MAPS contract is already complete.
`main.gd` converts exit `x`/`y` to integers; copying these records into the
game would be unsafe. Before wiring, `validate_runtime_landings` rejects
any planned marker, missing or nonintegral position, unknown destination,
out-of-bounds tile, solid tile, or immediate-exit landing. A resolved copy
must pass that gate against the actual destination map data. Passing it
does not implement the rest of the cave's runtime behavior.

`integration.status` is `unresolved_landings`, and `destinations` names
both unfinished destinations. `incoming_requirements` records the Thorn
Badge for the future Rootwater entrance and `field:grove` for the future
grove entrance. Those are wiring requirements, not implemented gates on
the existing maps. Exiting to Rootwater remains possible without a field
lesson; an outbound `locked` sentence would not implement the incoming
badge requirement.

## Walkable layout

The grid is 29 by 19 tiles. It is not 48 by 32 tiles: the design's 48 by
32 measurement is the mouth's physical size in pixels. The three adjacent
`S` tiles at `(3,18)` through `(5,18)` form the 48px-wide mouth. Start is
`(4,16)`, facing up. The single east exit at `(28,6)` leads to the grove.

The front chamber is open from the Rootwater entrance. A root-lined bend
north of it leads toward the grove. The deep supply crack branches east
from the front chamber and stays in Thornwood country. A four-neighbour
walk reaches every passable tile when both lessons are available.

The only glyphs used are existing `#` rock walls, `T` rooted solid edges,
`.` passable floor, `"` encounter patches, and `S`/`E` exit tiles. Collision
comes from the current `TILES[*].solid` values, not from a new collision
alphabet. The symbols are a layout substrate; the cave painter and its
palette remain the dev lead's and Game Art Director's work.

The separate `gates` list has exactly two records. Each record has a story
`key`, its passable substrate tile `at`, and one protected `beyond` witness
tile used by the structural checks:

- `field:stone` at `(13,13)` protects the deeper room, with witness `(20,13)`.
- `field:grove` at `(22,6)` protects the grove route, with witness `(27,6)`.

These are overlay obstacles, never new glyphs. The validator treats each
unlearned gate tile as blocked and checks all four learned-key combinations.
Grove Wake alone opens the grove route. Stone Break alone opens the supply
room. Each closed obstacle is approachable from the front chamber. Neither
can be bypassed, and entering from the grove still cannot bypass Stone
Break. The deep-room witness is not a spawned item, character or new quest
marker.

## Encounters, story and scale

`biome: "thornwood"` inherits the current `BIOMES.thornwood.lv` range of
2–12. `wild` copies the existing eleven Thornwood species and their
weights unchanged: Glimmerwing 22, Pebblepaw 20, Duskweaver 16, Bogsnap 14,
Emberling 12, Gnawhound 12, Galefoal 4, Sunspark 3, Fernruff 6, Bogbough 5,
and Seedpip 6. There is no added map-level or per-species level field.
Species must be in both SPECIES and Thornwood's table. Unique guardians,
including Elderhorn, cannot enter this random table.

`signs` is an empty dictionary and `items` an empty list. The design does
not specify new cave sign text, bag pickups or their payouts, so this task
does not invent them. Bram's scene and the Standing Stone slip remain
future integration work under the existing errand/lesson designs. No lore
clue is placed or explained here.

`layout.mouth_px` is `[48, 32]`, `ceiling_px` is `32`, and
`mounts_allowed` is `false`. The 32px ceiling is below the 48px mount rule:
all mounts wait outside, including Elderthorn and Elderhorn. A waiting pad,
its painting, and physical cave rendering are not implemented by this file.

## Validation and integration handoff

Run from the repository root:

```sh
python3 -m unittest tools/test_wildbond_world_knothollow.py
python3 tools/wildbond-export-freshness.py --base origin/main --head HEAD
```

The explicit pre-wiring command below must currently exit 1 with
`planned landing must be resolved before runtime wiring`. That expected
failure is also covered by the passing unit suite. It is a runtime gate,
not a reason to block this approved planning-only pull.

```sh
python3 tools/test_wildbond_world_knothollow.py --runtime-landings
```

The standalone checker validates the strict planning schema, rectangular
rows, TILES glyphs, non-exit start, all-open BFS coverage, aligned boundary
exits, three-tile mouth, both independent gates and reverse-entry behavior.
It checks encounter identity, duplicates, positive integral weights, no
uniques, unchanged Thornwood weights and the inherited level band. Target
IDs are checked against current MAPS plus the design's numbered route
table; a valid planned ID is not a verified landing. Dedicated cases reject
nulls without `landing: "planned"` and unsafe resolved destinations; a
synthetic valid resolved landing proves the runtime gate can pass once
actual destinations exist. Strict JSON loading
rejects duplicate keys and non-finite numbers. Malformed fixtures and
source-data drift tests run in the same command. Nothing is added to CI.

Before runtime integration, the dev lead must resolve and test both landing
positions and reciprocal exits, wire the incoming Thorn/Grove requirements
and field-key obstacles, and supply the painter, palette and mount-wait
behavior. The separate gate records do not teach lessons or add save fields.
This PR makes no engine, runtime, save-format, art, shared-file or pack
change. Normal CI and the PR body carry the final-head evidence; a data
test passing does not mean the cave is playable.
