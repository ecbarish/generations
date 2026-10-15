# WBW-8: Kilnvent layout and encounters

This is a planning blueprint. Nothing in the game loads it. The contract is
[WBW-8 in the guest backlog](../guest-backlog.md#wbw-8-kilnventjson-plus-kilnventmd)
and [world design section 2, cave 4](../wildbond-world-design.md#caves-and-depths-7-hollowecho-first).
Sections 1, 3, 4, 5 and the WB-WORLD-3 phase supply the lesson, errand, slip,
scale and implementation boundaries. Only `kilnvent.json`, this note and
`tools/test_wildbond_world_kilnvent.py` belong to this task.

## Format and connection contract

The map keeps Knothollow's eight fields: `name`, `biome`, `start`, `rows`,
`exits`, `signs`, `items`, and `wild`. Coordinates are zero-based. Gate,
lighting-zone and marker overlays live outside the map, following the
Answering Ways precedent. They are planning metadata, not engine features.

The entrance is on Ashstair and the far door leads to Sootpath. Both are
world-graph nodes with phase-three links. There is no local badge gate at
the Ashstair mouth: Tide is required upstream on Saltmarsh–Ashstair. The
mouth stays a shut trailhead in earlier phases and opens in WB-WORLD-3.
The JSON describes that later open cave; it does not open the mouth today.

Both exits retain `x: null`, `y: null`, `dir: null`, and `landing: "planned"`.
Those fields belong to destination arrival tiles and facing directions,
not the source-side S/E glyphs. Neither new route has a placed landing;
no coordinate or facing direction is guessed. `integration.status` is
`unresolved_landings`. This preserves the
[WBW-2 landing contract](knothollow.md#schema-and-unresolved-destination-landings)
and its explicit distinction from an engine-ready MAPS entry.

`incoming_requirements` records `sootpath: ["field:lantern"]`. Later wiring
must check that requirement before entering from Sootpath, and put the
reciprocal cave arrival outside its closed gate. It must not spawn a player
past the gate. The internal barrier also blocks a reverse walk in this plan.
The standalone runtime-landing gate checks actual destination tiles, but
cannot prove reciprocal placement or implement the incoming check.

## Layout and annotations

The grid is 31×21 tiles. The design's 48×48 measurement describes the mouth
in pixels, not the grid dimensions. The southern mouth is three S tiles at
(4,20)–(6,20), with a clear three-tile-wide approach above it. The start is
(5,17), facing up. The Sootpath doorway is three E tiles at (30,6)–(30,8).
Its three-tile height is a layout choice that leaves generous mount clearance.

Only existing glyphs are used: `#` solid wall, `.` floor, `"` encounter
patches, and `S`/`E` exits. The existing TILES collision definitions remain
unchanged. This annotated sketch uses letters only as labels; they are not
additional JSON tile glyphs:

```text
                           Sootpath
     solid hill       +------------EEE
                      | deep room | F
                      | slip      |  |
                      |           |  |
                      | stone     |  |
  +-----------+--D----+-----------+  |
  | lit room  |
  |           |  D = deep-room Lantern barrier
  | start     |  F = far-door Lantern barrier
  +--SSS------+  The JSON is the precise grid.
     Ashstair
```

The exact room and prop coordinates are choices made for this blueprint;
the source design names their relationship rather than tile positions.
The lit chamber has 98 walkable tiles. The warm-dark chamber has 145.
Two narrow barriers and a six-tile Sootpath-side threshold account for the
remaining walkable tiles, for 254 in total. There are no isolated pockets.

The gate records use the exact canonical IDs in `gates.json`:

- `kilnvent-deep-room:field:lantern`, door `kilnvent-deep-room`: tiles
  (15,12) and (15,13); protected witness (20,12)
- `kilnvent--sootpath:field:lantern`, door `kilnvent--sootpath`: tiles
  (28,6)–(28,8); protected witness (29,7)

Both keys are `field:lantern`, taught by Toren. Without it, the whole lit
chamber and return to Ashstair are available, but neither the warm-dark
chamber nor the onward exit is accessible. The Sootpath-side threshold
ends at the closed far-door barrier; entering from there cannot reach the
deep room or either marker. With Lantern, every passable tile is connected
from both entrances. No Stone, Hush or Grove requirement is invented.

Lighting zones are separate overlays. `lit-chamber` covers exactly the
ungated first chamber, and `warm-dark` covers the protected deep chamber.
Gate tiles and the outer Sootpath threshold are separate boundary space.
Darkness and the warm centre must later be overlay effects, as design §5
requires. No darker floor, red-floor fill, palette or painting is authored.
Before Lantern, a future renderer must keep the tamer's tile and its eight
neighbours readable; it must still show the way back. This data does not
supply that renderer or its screenshots.

The mouth and ceiling are 48px and `mounts_allowed` is true. A 2×2-tile
footprint conservatively encloses a 30px mount. Tests prove it can enter
the lit room, reach both deep markers with Lantern, and traverse the far
door in either direction. Hearthcrown remains at the spring terrace;
allowing mount clearance does not place a guardian in this cave.

## Existing slip, errand and encounters

Two distinct ordinary-floor markers sit in the warm-dark zone:

- `slip-ember-mantle`, at (21,5), references the existing `emberMantle` move
- `sela-warm-stone`, at (24,12), references `sq-sela-warmth`

The stone is the recover stage of the existing errand, not completion.
`errands.json` already requires Lantern at Kilnvent and records
`sq:sq-sela-warmth:step = 1`; returning to Sela is a separate step.
The markers write nothing. The map's `items` and `signs` stay empty, so
no inventory reward, dialogue, new clue or save field is introduced.
The warmth remains unexplained. These are placements for later wiring,
not claims that phase-five slip teaching or phase-seven errands are playable.

The country is Emberfall. Its existing level band **22–32** fits both
Tide's two-badge cap **35** and Ember's three-badge cap **45**. The test reads
those caps and badge counts from current sources. No per-route level
field or invented scaling rule is needed.

The twelve entries and weights are unchanged from `BIOMES.emberfall.wild`:
Slaglet 24, Ashskip 20, Cragskein 16, Ventwhisk 16, Thermwing 14,
Screegrin 10, Glowmote 3, Cairnclasp 6, Kilnchirp 6, Hearthlaugh 2,
Flintpup 6 and Cinderstitch 4. Runtime `WILD_EXTRA` is keyed by map ID;
Emberfall's extras do not automatically transfer to a new Kilnvent map.
No unique guardian is rolled, and Kilnback remains excluded and unsigned
because its locked height does not exist. Both chambers contain encounter
patches, away from the markers and gate substrate.

## Checks and integration handoff

From the repository root:

```sh
python3 -m unittest tools/test_wildbond_world_kilnvent.py
python3 tools/wildbond-export-freshness.py --base origin/main --head HEAD
```

The standalone test needs only Python's standard library. It checks strict
JSON, exact schema, current graph/gate/errand/move/species references, level
caps, all-open BFS, both entry directions under all sixteen combinations
of Lantern and three unrelated lessons, each individual barrier, lighting
coverage, marker positions and 2×2 mount clearance. Mutated nested values,
missing/extra fields, invalid geometry, bypasses and source drift must fail.
It does not add itself to CI; the standalone output and normal CI evidence
are reported separately on the pull request.

This pre-wiring check must currently exit 1:

```sh
python3 tools/test_wildbond_world_kilnvent.py --runtime-landings
```

It reports `planned landing must be resolved before runtime wiring`.
Tests also prove that valid synthetic resolved landings pass, while null,
nonintegral, absent, out-of-bounds, solid and immediate-exit landings fail.
Passing the landing check later still does not implement lighting, gate
lessons, mount behavior, markers or reciprocal transitions.

Wildbond & Starfall Dev Lead owns those runtime steps. No engine, save,
new art, pack, shared file, workflow, COMMS, START-HERE or DEVELOPMENT-PATH
change is made here. This plan closes no playable-game launch checklist row.
