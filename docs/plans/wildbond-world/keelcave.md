# WBW-14: Keelcave layout and encounters

This is a proposed planning blueprint, not a map loaded by the game. It
fulfills [WBW-14](../guest-backlog.md#wbw-14-keelcavejson-and-keelcavemd)
and follows [world-design section 2, cave 3](../wildbond-world-design.md),
with the Rinse slip from section 4 and the mouth, scale and encounter
contracts from section 5. It uses the Knothollow map envelope, plus named
zone and marker overlays like the other cave blueprints.

Only this note, `keelcave.json` and `tools/test_wildbond_world_keelcave.py`
belong to the task. Game data, world graph, gate list and design are read
without changes. The JSON's `status: "proposed"` describes the authored
layout; it does not assert runtime availability. Keelcave is phase 6 even
though Greywash's first screen opens in phase 2.

## One way in, one way back

Greywash Sound is Keelcave's only neighbour. The graph's two-way
`greywash--keelcave` link requires Tide Ride. The canonical requirement is
`greywash--keelcave:field:tide` in `gates.json`, taught by Nerys after the
Tide Badge. A Tide partner on the walking team must be level 18 or Friendly.
Tide Ride is a field lesson, not the Rinse creature move found inside.

The sole exit record is `S`, to `greywash`. Three adjacent `S` tiles are
one 48px mouth, not three connections. There is no inland entrance, beach
shortcut or passage to another town. The design's beach reference is a
mount/painting instruction at this same waterline mouth; it does not add
a second map connection. The checker rejects any additional incident
Keelcave graph edge, reversed one-way semantics, wrong destination, extra
exit or open border.

`integration.incoming_requirements.greywash` records `field:tide`, and
`integration.approach_gate` gives its canonical gate ID. The separate
`gates` list is empty: the requirement is on the outside approach, and
there is no invented Tide Ride, Lantern or other obstacle inside this dry
cave. The unit test's entry helper verifies all 128 combinations of the
seven field lessons against every graph place. It is not a runtime hook.
The map owner must enforce the requirement at Greywash's reciprocal entry
and maintain a safe return to the water; this blueprint does neither.

## A short, dry walk to the back ledge

The grid is 21 by 15 tiles. Coordinates are zero-based. The start is
`[10,11,"up"]`, clear of the exit, on ordinary dry floor. The mouth occupies
`[9,14]`, `[10,14]` and `[11,14]`; the three-by-three approach just inside it
is clear. A broad chamber leads north through a three-tile-wide neck to
a raised back ledge. The slip marker is at `[10,3]`, eight direct steps
from the start, on ordinary floor in that ledge. The ledge is a descriptive
planning overlay, not a new height or collision mechanic.

The `dry-cave` zone covers every one of the 111 passable tiles, including
the mouth. `back-ledge` is the 21-tile subset at x7–13, y2–4. Its rectangles
are `[x,y,width,height]`. The existing glyphs are `#` rock, `.` ordinary
floor, `"` encounter patches and `S` the return exit. There is no water
tile inside, no change to solid `~`, and no claim that the outside water
has been built. Encounter patches are substrate for the future cave
painter, not a new grass-art instruction.

All passable tiles are reachable from every mouth tile without a lesson
obstacle. The tests also walk a two-by-two mount footprint from each
possible mouth placement to the start and slip, and back. The mouth is
48×48 pixels and the ceiling is 48px, so mounts may enter under section 5's
headroom rule. Those are physical pixel dimensions, not map dimensions.
A beach waiting pad, a keel-scraped arch and its waterline rendering belong
to the later map/art integration. This file does not place them on an
unbuilt Greywash map or add an encounter with Breakwatermane.

The checker's small-cave bounds are at most Knothollow's 29×19 grid. That
is a stated planning guard for this short layout, not a new world rule.
The actual authored grid is smaller in both dimensions.

## The Rinse marker and existing encounters

`markers` contains only `slip-rinse`, kind `lesson-slip`, move `rinse`.
The checker verifies the existing move's identity and the design's Tide
eligibility. The game move record itself has no element field. The marker
must be ordinary floor on the back ledge. `map.items` and `map.signs` are
empty: no bag item, payout, dialogue, new lore or sign is invented.

WBW-10's `lessons.json` is separate and may be unmerged. Its Rinse source
remains Keelcave with a Tide Ride approach and no physical gift gate. Its
null tile meant unplaced at that task's handoff; this blueprint now proposes
`[10,3]` for the later integration owner. This task does not edit that file,
teach a move, consume a slip or write a creature `lessons` field. The
persisted lesson design still waits on Evan's approval.

The `saltmarsh` biome inherits the existing level band 12–22. All ten
Saltmarsh species and weights are copied unchanged: Brineskit 24,
Dunepounce 20, Reedtusk 16, Wrackjaw 14, Kiteskirl 18, Spindriftfoal 8,
Foamglint 3, Poolkit 6, Dewspinner 5 and Saillet 6. The maximum 22 is below
CAP_TABLE's cap 35 after the second, Tide Badge, which is needed for the
approach. There is no map-level or per-species level override. No guardian
or Legend is rolled here; Breakwatermane's meeting stays on the Wrackline
beach. WILD_EXTRA is not imported as a second cave table.

## Unresolved arrival, explicit runtime gate

Greywash has no actual destination map or placed landing on current main.
The exit's `x`, `y` and arrival-facing `dir` therefore remain null with
`landing: "planned"`, following Knothollow's approved planning convention.
`integration.status` is `unresolved_landings`, and its only unresolved
destination is `greywash`. The source-side `S` glyph cannot supply any of
those destination values. No current map start is repurposed as a landing.

The planning validator requires this honest unresolved state. A separate
pre-wiring gate rejects any planned marker, missing map, malformed or
non-rectangular destination grid, unknown glyph, non-integer/out-of-bounds
arrival, solid arrival or immediate-exit arrival. A synthetic safe resolved
fixture proves the gate can pass when actual data exists; it supplies no
coordinates for the real world. It validates landing safety only. It does
not certify reciprocal gates, field-partner readiness, water movement,
mount behavior, rendering or runtime lesson teaching.

Run from the repository root:

```sh
python3 -m unittest tools/test_wildbond_world_keelcave.py
python3 -m unittest discover -s tools -p 'test_wildbond_world_*.py'
python3 tools/wildbond-export-freshness.py --base origin/main --head HEAD
```

The following command must currently exit 1 with `planned landing must
be resolved before runtime wiring`. That intentional gate is covered by
the passing unit suite and does not block the approved planning piece:

```sh
python3 tools/test_wildbond_world_keelcave.py --runtime-landings
```

Validation covers the strict nested schema, duplicate-key/non-finite JSON
rejection, malformed inputs, graph/gate/design drift, sole entrance,
dry/ledge zones, connectivity, mount clearance, marker identity, exact
encounters and cap, and safe versus unresolved landings. The standalone
Python test is not added to CI. Normal aggregate CI and export freshness
are recorded on the exact PR head; a planning pass is not a playable-cave
or screenshot claim.

Before runtime integration, the Wildbond lead must resolve the real
Greywash landing and reciprocal mouth, enforce incoming Tide Ride and its
partner readiness, provide safe water return, wire the slip under the
approved save design, and arrange the painter/mount/phone-silhouette
review. No engine, runtime, save-format, art, shared-file or pack change is
made by this PR. Only Generations Reviewer merges.
