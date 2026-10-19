"""Validate the WBW-15 planning blueprint for Lowbell; this does not load a game map.

Run from the repository root: python3 -m unittest tools/test_wildbond_world_lowbell.py
Standalone, like the WBW-2, WBW-4 and WBW-6 tests: it reads the game's data, the design, gates.json, the world graph and
errands.json, and changes nothing. The one landing, back to The Quiet Channels, stays explicitly unresolved until the map
owner places it.
"""

from collections import deque
from copy import deepcopy
import json
import math
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
BLUEPRINT = ROOT / "docs/plans/wildbond-world/lowbell.json"
GAME = ROOT / "wildbond-godot/data/wildbond.json"
EVOLUTION = ROOT / "wildbond-godot/data/evolution.json"
DESIGN = ROOT / "docs/plans/wildbond-world-design.md"
GATES = ROOT / "docs/plans/wildbond-world/gates.json"
GRAPH = ROOT / "docs/plans/wildbond-world/world-graph.json"
ERRANDS = ROOT / "docs/plans/wildbond-world/errands.json"
DIRECTIONS = {"up", "down", "left", "right"}
KEY = "field:tide"
ENVELOPE = {"id", "map", "gates", "markers", "layout", "integration"}
MAP_KEYS = {"name", "biome", "start", "rows", "exits", "signs", "items", "wild"}
GATE_KEYS = {"id", "door", "key", "at", "beyond"}
MARKER_KEYS = {"id", "kind", "quest", "step", "rings", "at"}
EXIT_TARGETS = {"S": "quietchannels"}  # Lowbell is a dead end under The Quiet Channels (world-graph.json)
WATER_ELEMENTS = {"Tide", "Gale"}
QUEST = "sq-lowbell"
GATE_DOOR = "lowbell-flooded-floor"


def reject_constant(value):
    raise ValueError(f"Non-finite JSON number: {value}")


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"Duplicate JSON key: {key}")
        result[key] = value
    return result


def finite_float(value):
    number = float(value)
    if not math.isfinite(number):
        raise ValueError(f"Non-finite JSON number: {value}")
    return number


def load_json(text):
    return json.loads(text, object_pairs_hook=unique_object, parse_constant=reject_constant,
                      parse_float=finite_float)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def exact_keys(value, keys, label):
    require(isinstance(value, dict) and set(value) == keys, f"{label}: unexpected fields")


def coordinate(value, width, height, label):
    require(isinstance(value, list) and len(value) == 2, f"{label}: expected [x, y]")
    require(all(type(v) is int for v in value), f"{label}: coordinates must be integers")
    x, y = value
    require(0 <= x < width and 0 <= y < height, f"{label}: coordinate out of bounds")
    return x, y


def reachable(rows, tiles, start, blocked=()):
    """Four-neighbour BFS on the grid; a closed gate is an overlay that blocks a walkable tile."""
    width, height = len(rows[0]), len(rows)
    blocked = set(blocked)
    start = tuple(start)
    if start in blocked or tiles[rows[start[1]][start[0]]].get("solid", 0):
        return set()
    seen, queue = {start}, deque([start])
    while queue:
        x, y = queue.popleft()
        for point in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            nx, ny = point
            if not (0 <= nx < width and 0 <= ny < height):
                continue
            if point in seen or point in blocked or tiles[rows[ny][nx]].get("solid", 0):
                continue
            seen.add(point)
            queue.append(point)
    return seen


def body_reachable(rows, tiles, start, size, blocked=()):
    """Where a body `size` tiles wide and tall can stand, as top-left corners. A mount needs room, not a single tile."""
    width, height = len(rows[0]), len(rows)
    blocked = set(blocked)

    def fits(x, y):
        return all(0 <= x + i < width and 0 <= y + j < height and (x + i, y + j) not in blocked
                   and not tiles[rows[y + j][x + i]].get("solid", 0) for i in range(size) for j in range(size))
    start = tuple(start)
    if not fits(*start):
        return set()
    seen, queue = {start}, deque([start])
    while queue:
        x, y = queue.popleft()
        for point in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if point not in seen and fits(*point):
                seen.add(point)
                queue.append(point)
    return seen


def validate_exit_landing(exit_record, *, runtime=False):
    """Only a visibly planned exit may carry null destination fields."""
    require(isinstance(exit_record, dict), "exit must be an object")
    base = {"to", "x", "y", "dir"}
    require(set(exit_record) in (base, base | {"landing"}), "exit: unexpected fields")
    require(isinstance(exit_record["to"], str) and bool(exit_record["to"]), "exit needs a destination id")
    planned = exit_record.get("landing") == "planned"
    if "landing" in exit_record:
        require(planned, "unknown landing marker")
    if planned:
        require(all(exit_record[key] is None for key in ("x", "y", "dir")),
                "planned landing must leave position and arrival direction explicitly null")
        require(not runtime, "planned landing must be resolved before runtime wiring")
    else:
        require(all(type(exit_record[key]) is int and exit_record[key] >= 0 for key in ("x", "y")),
                "unmarked landing requires nonnegative integer x/y")
        require(isinstance(exit_record["dir"], str) and exit_record["dir"] in DIRECTIONS,
                "resolved landing requires an arrival direction")


def validate_runtime_landings(data, game=None):
    """Pre-wiring gate: no planned marker, and the landing on the destination map exists and is safe.

    It does not wire the blueprint into the engine or check its other runtime behaviour. The current planning file must fail it.
    """
    if game is None:
        game = load_json(GAME.read_text(encoding="utf-8"))
    require(isinstance(data, dict) and isinstance(data.get("map"), dict), "runtime map must be an object")
    exits = data["map"].get("exits")
    exact_keys(exits, set(EXIT_TARGETS), "runtime exits")
    for glyph, exit_record in exits.items():
        validate_exit_landing(exit_record, runtime=True)
        target = exit_record["to"]
        require(target == EXIT_TARGETS[glyph], "runtime exit target differs from the designed connection")
        require(target in game["MAPS"], "runtime destination map does not exist")
        rows = game["MAPS"][target]["rows"]
        x, y = coordinate([exit_record["x"], exit_record["y"]], len(rows[0]), len(rows), "landing")
        tile = game["TILES"][rows[y][x]]
        require(not tile.get("solid", 0) and not tile.get("exit", 0),
                "runtime landing must be passable and must not immediately exit again")


def merged_species(game, evolution):
    return {**game["SPECIES"], **evolution["species"]}


def stillreed_pool(game, evolution):
    """The Stillreed country's wild pool: BIOMES.stillreed plus the evolution.json extras keyed by the map id."""
    return [list(row) for row in game["BIOMES"]["stillreed"]["wild"]] + [list(row) for row in evolution.get("wild", {}).get("stillreed", [])]


def validate(data, game=None, design=None, gates=None, graph=None, errands=None, evolution=None):
    """Raise ValueError for malformed planning data, without mutating any input. Returns a short summary."""
    if game is None:
        game = load_json(GAME.read_text(encoding="utf-8"))
    if design is None:
        design = DESIGN.read_text(encoding="utf-8")
    if gates is None:
        gates = load_json(GATES.read_text(encoding="utf-8"))
    if graph is None:
        graph = load_json(GRAPH.read_text(encoding="utf-8"))
    if errands is None:
        errands = load_json(ERRANDS.read_text(encoding="utf-8"))
    if evolution is None:
        evolution = load_json(EVOLUTION.read_text(encoding="utf-8"))
    exact_keys(data, ENVELOPE, "blueprint")
    require(data["id"] == "lowbell", "id must be lowbell")
    require("6. **Lowbell** (`lowbell`)" in design, "the design no longer lists Lowbell as cave 6")
    m = data["map"]
    exact_keys(m, MAP_KEYS, "map")
    require(m["name"] == "Lowbell" and m["biome"] == "stillreed", "map identity drift")
    rows = m["rows"]
    require(isinstance(rows, list) and len(rows) >= 3, "rows must be a nonempty rectangular grid")
    require(all(isinstance(row, str) and row for row in rows), "rows must be nonempty strings")
    width, height = len(rows[0]), len(rows)
    require(width >= 3 and all(len(row) == width for row in rows), "rows must be rectangular")
    tiles = game["TILES"]
    require(all(ch in tiles for row in rows for ch in row), "unknown TILES glyph")
    start = m["start"]
    require(isinstance(start, list) and len(start) == 3, "start must be [x, y, direction]")
    origin = coordinate(start[:2], width, height, "start")
    require(isinstance(start[2], str) and start[2] in DIRECTIONS, "invalid start direction")
    walkable = {(x, y) for y, row in enumerate(rows) for x, ch in enumerate(row) if not tiles[ch].get("solid", 0)}
    require(origin in walkable and not tiles[rows[origin[1]][origin[0]]].get("exit", 0),
            "start must be a walkable non-exit tile")

    # One way in and out: the Quiet Channels. Lowbell is a dead end, so there is no second exit.
    exact_keys(m["exits"], set(EXIT_TARGETS), "exits")
    place_ids = {p["id"] for p in graph["places"]}
    for glyph, exit_record in m["exits"].items():
        validate_exit_landing(exit_record)
        require(exit_record["to"] in place_ids, "unknown exit destination")
        require(exit_record["to"] == EXIT_TARGETS[glyph], "exit goes only to quietchannels, as designed")
        require(exit_record.get("landing") == "planned", "the landing must be marked planned")
    actual_exits = {ch for row in rows for ch in row if tiles[ch].get("exit", 0)}
    require(actual_exits == set(m["exits"]), "exit glyph and exit record mismatch")
    exit_points = {(x, y) for x, y in walkable if rows[y][x] in actual_exits}
    require(len(exit_points) == 1, "the mouth is one tile (16px) wide")
    (mx, my), = exit_points
    require(rows[my][mx] == "S" and my == height - 1, "the mouth must be the S tile on the bottom edge")
    solid = lambda x, y: (x, y) not in walkable
    require(all((mx, y) in walkable and solid(mx - 1, y) and solid(mx + 1, y) for y in range(height - 4, height - 1)),
            "the flooded stair must be a walkable column one tile wide, three tiles long")
    require(all((x, y) in exit_points or not (x in (0, width - 1) or y in (0, height - 1)) for x, y in walkable),
            "open border outside the mouth")
    require(origin == (mx, my - 1), "start is the tile just inside the mouth")

    require(m["signs"] == {}, "sign copy is deferred; no new lore in this layout")
    require(m["items"] == [], "finds belong to WBW-13's finds.json, not this layout")

    # Encounters: the Tide and Gale members of the Stillreed pool, at their source weights, and never a Legend or unique.
    species = merged_species(game, evolution)
    require(game["BIOMES"]["stillreed"]["lv"] == [46, 60], "Stillreed level band must remain 46 to 60")
    pool = stillreed_pool(game, evolution)
    wild = m["wild"]
    require(isinstance(wild, list) and wild, "wild must be a nonempty list")
    seen_species = set()
    for entry in wild:
        require(isinstance(entry, list) and len(entry) == 2, "wild row must be [species, weight]")
        name, weight = entry
        require(isinstance(name, str) and name in species, "wild species must exist in the catalogue")
        info = species[name]
        require(info.get("tier") != "Legend" and not info.get("unique", False) and name != "stillwake",
                "no Legend or unique guardian may appear in Lowbell's encounters (Stillwake stays on the surface)")
        require(name not in seen_species, "duplicate wild species")
        seen_species.add(name)
        require(type(weight) is int and weight > 0, "wild weight must be a positive integer")
        require(info.get("el") in WATER_ELEMENTS, "Lowbell's encounters are Tide and Gale species")
    expected = [row for row in pool if species[row[0]].get("el") in WATER_ELEMENTS
                and species[row[0]].get("tier") != "Legend" and not species[row[0]].get("unique", False)]
    require(wild == expected, "wild must be the Tide and Gale species of the Stillreed pool at their existing weights")

    # The one gate: the flooded floor, the door gates.json already lists at lowbell, with the same key.
    records = data["gates"]
    require(isinstance(records, list) and len(records) == 1, "exactly one gate: the flooded floor")
    gate = records[0]
    exact_keys(gate, GATE_KEYS, "gate")
    require(gate["id"] == GATE_DOOR and gate["door"] == GATE_DOOR and gate["key"] == KEY, "gate identity or key drift")
    sheet = {g["door"]: g["key"] for g in gates["gates"] if g["place"] == "lowbell"}
    require(sheet == {GATE_DOOR: KEY}, "gates.json no longer lists the flooded floor as Lowbell's only door")
    at = gate["at"]
    require(isinstance(at, list) and at, "gate needs at least one overlay tile")
    closed = {coordinate(t, width, height, "gate") for t in at}
    require(len(closed) == len(at), "duplicate overlay tile in the gate")
    beyond = coordinate(gate["beyond"], width, height, "beyond")
    require(closed <= walkable and beyond in walkable, "gate tiles and the witness must be walkable")
    require(not (closed & exit_points) and origin not in closed and beyond not in closed and beyond != origin,
            "invalid gate location")
    require(all(rows[y][x] != '"' for x, y in closed), "the flooded floor is not an encounter patch")

    # Everything is reachable once the floor is rideable; without Tide Ride the landing is, and the chamber is not.
    require(reachable(rows, tiles, origin) == walkable, "unreachable walkable tile")
    dry = reachable(rows, tiles, origin, closed)
    require(exit_points <= dry and origin in dry, "the stair and landing must need no key once inside")
    require(beyond not in dry, "the flooded floor can be bypassed")
    require(any(p in dry for t in closed for p in ((t[0] - 1, t[1]), (t[0] + 1, t[1]), (t[0], t[1] - 1), (t[0], t[1] + 1))),
            "the flooded floor must be approachable from the landing")
    chamber = walkable - dry - closed
    require(len(chamber) > 0 and beyond in chamber, "the bell chamber must lie wholly behind the flooded floor")
    require(len(dry) >= 20, "the landing must hold a real room")

    # The bell: one listening spot behind the flooded floor, matching the sq-lowbell errand step.
    markers = data["markers"]
    require(isinstance(markers, list) and len(markers) == 1, "exactly one marker: the bell-ring count")
    marker = markers[0]
    exact_keys(marker, MARKER_KEYS, "marker")
    require(marker["id"] == "bell-count" and marker["kind"] == "bell-count" and marker["quest"] == QUEST, "marker identity drift")
    require(type(marker["step"]) is int and marker["step"] == 1, "the count is taken at the quest's step 1")
    require(type(marker["rings"]) is int and 1 <= marker["rings"] <= 12, "rings must be a small positive integer")
    spot = coordinate(marker["at"], width, height, "bell-count")
    require(spot in chamber and spot != origin and rows[spot[1]][spot[0]] != '"',
            "the bell count is taken in the chamber, behind the flooded floor, off an encounter patch")
    errand = next((e for e in errands["errands"] if e["id"] == QUEST), None)
    require(errand is not None and errand["town"]["map"] == "stillreed" and errand["giver"] == "tavil", "sq-lowbell moved")
    listen = [s for s in errand["steps"] if s["kind"] == "listen"]
    require(len(listen) == 1, "sq-lowbell must have one listen step")
    require(sorted(loc["map"] for loc in listen[0]["locations"]) == ["lowbell", "quietchannels"], "the listen step moved")
    require(listen[0]["requires"]["fields"] == [KEY] and listen[0]["requires"]["badges"] == [], "the listen step's key changed")
    require(listen[0]["write"] == {"key": "sq:sq-lowbell:step", "value": marker["step"]}, "the listen step's story write changed")
    report = [s for s in errand["steps"] if s["kind"] == "report"]
    require(len(report) == 1 and report[0]["actors"] == ["veslin"] and report[0]["locations"] == [{"map": "hollowecho"}],
            "the count is still turned in to Veslin in Bellstep (hollowecho)")

    # Layout: a one-tile stair and 32px of air; no mount goes in, they wait on the jetty pad at Reedhold.
    layout = data["layout"]
    exact_keys(layout, {"mouth_px", "ceiling_px", "mounts_allowed"}, "layout")
    require(isinstance(layout["mouth_px"], list) and all(type(v) is int for v in layout["mouth_px"])
            and layout["mouth_px"] == [16, 32], "mouth must be one tile wide and 32px tall")
    require(type(layout["ceiling_px"]) is int and layout["ceiling_px"] == 32, "ceiling must be 32px of air")
    require(layout["mounts_allowed"] is False, "mounts wait at the jetty pad and do not enter Lowbell")
    require("32px of air above the water" in design and "2×2 pad at Reedhold's jetty" in design,
            "the design no longer gives Lowbell's headroom and mount pad")
    body = body_reachable(rows, tiles, (mx, my - 2), 2)
    require(not (body & dry - {origin}), "a 2 by 2 mount must not fit through the stair")

    # The way in: the Quiet Channels link needs Tide Ride, and the door is already in gates.json.
    integration = data["integration"]
    exact_keys(integration, {"status", "destinations", "incoming_requirements", "jetty"}, "integration")
    require(integration["status"] == "unresolved_landings", "landing status must remain explicit")
    require(integration["destinations"] == ["quietchannels"], "the one destination landing must be listed as unresolved")
    require(integration["incoming_requirements"] == {"quietchannels": {"field": KEY}}, "incoming requirement drift")
    link = [l for l in graph["links"] if {l["a"], l["b"]} == {"quietchannels", "lowbell"}]
    require(len(link) == 1 and link[0]["gate"] == [{"field": "tide"}], "the world graph's Quiet Channels link needs Tide Ride")
    require(any(g["place"] == "quietchannels--lowbell" and g["key"] == KEY for g in gates["gates"]),
            "gates.json no longer lists the Quiet Channels link")
    require(next(p for p in graph["places"] if p["id"] == "lowbell")["kind"] == "cave", "Lowbell is no longer a cave")
    require(integration["jetty"] == {"sight_from": "stillreed", "mount_pad_tiles": [2, 2]}, "jetty record drift")
    require("stillreed" in place_ids, "the jetty's map is not in the graph")
    return {"width": width, "height": height, "walkable": len(walkable), "landing": len(dry), "chamber": len(chamber),
            "species": len(wild), "gate_tiles": len(closed), "rings": marker["rings"]}


class LowbellTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = load_json(BLUEPRINT.read_text(encoding="utf-8"))
        cls.game = load_json(GAME.read_text(encoding="utf-8"))
        cls.design = DESIGN.read_text(encoding="utf-8")
        cls.gates = load_json(GATES.read_text(encoding="utf-8"))
        cls.graph = load_json(GRAPH.read_text(encoding="utf-8"))
        cls.errands = load_json(ERRANDS.read_text(encoding="utf-8"))
        cls.evolution = load_json(EVOLUTION.read_text(encoding="utf-8"))

    def check(self, data, **override):
        sources = dict(game=self.game, design=self.design, gates=self.gates, graph=self.graph,
                       errands=self.errands, evolution=self.evolution)
        sources.update(override)
        return validate(data, **sources)

    def open_tiles(self, with_tide):
        m = self.data["map"]
        closed = set() if with_tide else {tuple(t) for g in self.data["gates"] for t in g["at"]}
        return reachable(m["rows"], self.game["TILES"], m["start"][:2], closed)

    def test_blueprint_matches_current_game_contract(self):
        result = self.check(self.data)
        self.assertGreater(result["chamber"], 0)
        print("WBW-15 layout:", result)

    def test_validation_does_not_mutate_input(self):
        before = deepcopy(self.data)
        self.check(self.data)
        self.assertEqual(self.data, before)

    def test_the_whole_cave_is_reachable_and_it_is_a_dead_end(self):
        m = self.data["map"]
        tiles = self.game["TILES"]
        walkable = {(x, y) for y, row in enumerate(m["rows"]) for x, ch in enumerate(row) if not tiles[ch].get("solid", 0)}
        self.assertEqual(self.open_tiles(True), walkable)
        exits = [(x, y) for y, row in enumerate(m["rows"]) for x, ch in enumerate(row) if tiles[ch].get("exit", 0)]
        self.assertEqual(len(exits), 1)
        self.assertEqual(reachable(m["rows"], tiles, exits[0]), walkable)

    def test_without_tide_ride_you_reach_the_landing_and_not_the_bell(self):
        dry, wet = self.open_tiles(False), self.open_tiles(True)
        marker = tuple(self.data["markers"][0]["at"])
        gate = self.data["gates"][0]
        self.assertNotIn(marker, dry)
        self.assertIn(marker, wet)
        self.assertNotIn(tuple(gate["beyond"]), dry)
        self.assertIn(tuple(gate["beyond"]), wet)
        for tile in map(tuple, gate["at"]):
            self.assertNotIn(tile, dry)
        self.assertTrue(dry)
        # the floor spans the passage: leaving any single overlay tile open still gives no way round
        m = self.data["map"]
        tiles = self.game["TILES"]
        for t in map(tuple, gate["at"]):
            closed = {tuple(g) for g in gate["at"]} - {t}
            self.assertNotIn(tuple(gate["beyond"]), reachable(m["rows"], tiles, m["start"][:2], closed), t)

    def test_the_stair_is_one_tile_wide_and_no_mount_fits(self):
        m = self.data["map"]
        tiles = self.game["TILES"]
        self.assertFalse(self.data["layout"]["mounts_allowed"])
        mouth = next((x, y) for y, row in enumerate(m["rows"]) for x, ch in enumerate(row) if ch == "S")
        body = body_reachable(m["rows"], tiles, (mouth[0], mouth[1] - 2), 2)
        self.assertFalse(body & self.open_tiles(False) - {tuple(m["start"][:2])})
        # Widen the stair by one tile and a 2 by 2 body walks in: the check has teeth.
        wide = list(m["rows"])
        for y in (12, 13, 14):
            wide[y] = wide[y][:4] + "." + wide[y][5:]
        self.assertTrue(body_reachable(wide, tiles, (mouth[0], mouth[1] - 2), 2))
        with self.assertRaises(ValueError):
            self.check({**deepcopy(self.data), "map": {**deepcopy(self.data["map"]), "rows": wide}})

    def test_the_bell_marker_matches_the_sq_lowbell_errand(self):
        marker = self.data["markers"][0]
        errand = next(e for e in self.errands["errands"] if e["id"] == QUEST)
        listen = next(s for s in errand["steps"] if s["kind"] == "listen")
        report = next(s for s in errand["steps"] if s["kind"] == "report")
        self.assertEqual(listen["write"], {"key": "sq:sq-lowbell:step", "value": marker["step"]})
        self.assertEqual(listen["requires"]["fields"], [KEY])
        self.assertEqual(report["actors"], ["veslin"])
        self.assertGreaterEqual(marker["rings"], 1)
        changed = deepcopy(self.errands)
        next(e for e in changed["errands"] if e["id"] == QUEST)["steps"][1]["write"]["value"] = 2
        with self.assertRaises(ValueError):
            self.check(self.data, errands=changed)
        moved = deepcopy(self.errands)
        next(e for e in moved["errands"] if e["id"] == QUEST)["steps"][2]["actors"] = ["senna"]
        with self.assertRaises(ValueError):
            self.check(self.data, errands=moved)

    def test_no_legend_or_unique_species_in_the_encounter_list(self):
        species = {**self.game["SPECIES"], **self.evolution["species"]}
        wild = {row[0] for row in self.data["map"]["wild"]}
        self.assertNotIn("stillwake", wild)
        self.assertFalse([s for s in wild if species[s].get("tier") == "Legend" or species[s].get("unique")])
        legends = sorted(k for k, v in species.items() if v.get("tier") == "Legend" or v.get("unique"))
        self.assertEqual(len(legends), 9)
        for legend in legends:
            data = deepcopy(self.data)
            data["map"]["wild"].append([legend, 1])
            with self.subTest(legend=legend), self.assertRaises(ValueError):
                self.check(data)
        # a species that becomes a Legend in the source is caught even when the file still lists it
        game = deepcopy(self.game)
        game["SPECIES"]["reedlet"]["tier"] = "Legend"
        with self.assertRaisesRegex(ValueError, "Legend or unique"):
            self.check(self.data, game=game)
        evolution = deepcopy(self.evolution)
        evolution["species"]["reedmaw"]["unique"] = 1
        with self.assertRaisesRegex(ValueError, "Legend or unique"):
            self.check(self.data, evolution=evolution)

    def test_encounters_are_the_water_species_of_the_stillreed_pool(self):
        species = {**self.game["SPECIES"], **self.evolution["species"]}
        pool = stillreed_pool(self.game, self.evolution)
        wild = self.data["map"]["wild"]
        self.assertEqual({r[0] for r in wild}, {r[0] for r in pool if species[r[0]]["el"] in WATER_ELEMENTS})
        self.assertTrue(all(row in pool for row in wild))
        self.assertTrue(all(species[r[0]]["el"] in WATER_ELEMENTS for r in wild))
        game = deepcopy(self.game)
        game["BIOMES"]["stillreed"]["wild"][0][1] = 25
        with self.assertRaisesRegex(ValueError, "existing weights"):
            self.check(self.data, game=game)
        for levels in ([45, 60], [46, 61], [60, 46]):
            game = deepcopy(self.game)
            game["BIOMES"]["stillreed"]["lv"] = levels
            with self.assertRaisesRegex(ValueError, "level band"):
                self.check(self.data, game=game)

    def test_the_gate_is_the_door_gates_json_lists_at_lowbell(self):
        sheet = {g["door"]: g["key"] for g in self.gates["gates"] if g["place"] == "lowbell"}
        self.assertEqual(sheet, {GATE_DOOR: KEY})
        for change in (lambda g: g.update(key="field:stone"), lambda g: g.update(door="lowbell-other")):
            changed = deepcopy(self.gates)
            change(next(g for g in changed["gates"] if g["door"] == GATE_DOOR))
            with self.assertRaises(ValueError):
                self.check(self.data, gates=changed)
        extra = deepcopy(self.gates)
        extra["gates"].append({**next(g for g in extra["gates"] if g["door"] == GATE_DOOR), "door": "lowbell-second", "id": "lowbell-second"})
        with self.assertRaises(ValueError):
            self.check(self.data, gates=extra)

    def test_agrees_with_the_world_graph(self):
        place = next(p for p in self.graph["places"] if p["id"] == "lowbell")
        self.assertEqual((place["kind"], place["phase"]), ("cave", 6))
        links = [l for l in self.graph["links"] if "lowbell" in (l["a"], l["b"])]
        self.assertEqual(len(links), 1, "Lowbell is a dead end: one link")
        self.assertEqual({links[0]["a"], links[0]["b"]}, {"quietchannels", "lowbell"})
        self.assertEqual(links[0]["gate"], [{"field": "tide"}])
        ids = {p["id"] for p in self.graph["places"]}
        self.assertTrue(set(self.data["integration"]["destinations"]) <= ids)
        for change in (lambda l: l.update(gate=[]), lambda l: l.update(gate=[{"field": "stone"}])):
            changed = deepcopy(self.graph)
            change(next(l for l in changed["links"] if {l["a"], l["b"]} == {"quietchannels", "lowbell"}))
            with self.assertRaises(ValueError):
                self.check(self.data, graph=changed)

    def test_a_tile_that_stops_being_walkable_in_the_game_is_caught(self):
        game = deepcopy(self.game)
        game["TILES"]["."]["solid"] = 1
        with self.assertRaises(ValueError):
            self.check(self.data, game=game)

    def test_null_landings_require_the_planned_marker(self):
        original = self.data["map"]["exits"]["S"]
        validate_exit_landing(original)
        with self.assertRaisesRegex(ValueError, "integer x/y"):
            validate_exit_landing({k: v for k, v in original.items() if k != "landing"})
        for marker in (None, False, "", "resolved"):
            with self.assertRaises(ValueError):
                validate_exit_landing({**original, "landing": marker})
        for key, value in (("x", 1), ("y", 1), ("dir", "up")):
            with self.assertRaises(ValueError):
                validate_exit_landing({**original, key: value})

    def test_other_exits_require_integer_coordinates_and_arrival_direction(self):
        resolved = {"to": "quietchannels", "x": 1, "y": 8, "dir": "right"}
        validate_exit_landing(resolved, runtime=True)
        for key in ("x", "y"):
            for value in (None, True, -1, 1.0, "1", [], {}):
                with self.subTest(key=key, value=value), self.assertRaises(ValueError):
                    validate_exit_landing({**resolved, key: value})
        for value in (None, "north", 1, []):
            with self.assertRaises(ValueError):
                validate_exit_landing({**resolved, "dir": value})

    def test_runtime_wiring_rejects_unresolved_or_unsafe_landings(self):
        with self.assertRaisesRegex(ValueError, "resolved before runtime"):
            validate_runtime_landings(self.data, self.game)
        resolved = deepcopy(self.data)
        del resolved["map"]["exits"]["S"]["landing"]
        resolved["map"]["exits"]["S"].update(x=1, y=1, dir="right")
        with self.assertRaisesRegex(ValueError, "map does not exist"):
            validate_runtime_landings(resolved, self.game)  # The Quiet Channels is only a planned map
        fixture = deepcopy(self.game)
        fixture["MAPS"]["quietchannels"] = {"rows": ["#####", "#...#", "#...#", "#####"]}
        validate_runtime_landings(resolved, fixture)
        for x, y in ((0, 0), (5, 1), (1, 4), (-1, 1)):
            broken = deepcopy(resolved)
            broken["map"]["exits"]["S"].update(x=x, y=y)
            with self.assertRaises(ValueError):
                validate_runtime_landings(broken, fixture)
        fixture["MAPS"]["quietchannels"]["rows"][1] = "#E..#"
        with self.assertRaisesRegex(ValueError, "immediately exit"):
            validate_runtime_landings(resolved, fixture)
        broken = deepcopy(resolved)
        broken["map"]["exits"] = {}
        with self.assertRaises(ValueError):
            validate_runtime_landings(broken, self.game)

    def test_malformed_data_is_rejected(self):
        cases = []

        def changed(label, path, value):
            data = deepcopy(self.data)
            owner = data
            for part in path[:-1]:
                owner = owner[part]
            owner[path[-1]] = value
            cases.append((label, data))

        def rows_edit(label, *edits):
            data = deepcopy(self.data)
            for (y, x, ch) in edits:
                row = data["map"]["rows"][y]
                data["map"]["rows"][y] = row[:x] + ch + row[x + 1:]
            cases.append((label, data))
        for value in (None, [], "map", 1, True):
            cases.append(("bad root", value))
        for key in self.data:
            data = deepcopy(self.data)
            del data[key]
            cases.append(("missing " + key, data))
        for key in MAP_KEYS:
            data = deepcopy(self.data)
            del data["map"][key]
            cases.append(("missing map " + key, data))
        data = deepcopy(self.data)
        data["extra"] = 1
        cases.append(("extra envelope key", data))
        changes = [
            (["id"], "answering"), (["map", "name"], "Lowbell Cave"), (["map", "biome"], "hollowecho"),
            (["map", "rows"], []), (["map", "rows", 0], "#"), (["map", "rows", 0], None), (["map", "rows", 0], "?" * 26),
            (["map", "start"], [3, 14]), (["map", "start"], [True, 14, "up"]), (["map", "start"], [-1, 14, "up"]),
            (["map", "start"], [26, 14, "up"]), (["map", "start"], [0, 0, "up"]), (["map", "start"], [3, 15, "up"]),
            (["map", "start"], [3, 14, []]), (["map", "start"], [4, 9, "up"]),
            (["map", "exits", "S", "to"], "made_up"), (["map", "exits", "S", "to"], "stillreed"),
            (["map", "exits", "S", "to"], "lowbell"), (["map", "exits", "S", "to"], []),
            (["map", "exits", "S", "x"], 1), (["map", "exits", "S", "landing"], "unknown"),
            (["map", "exits", "S", "dir"], "down"), (["map", "exits", "S"], None), (["map", "exits"], {}),
            (["map", "signs"], {"4,4": "Invented lore"}),
            (["map", "items"], [{"id": "unapproved", "give": {"berries": 1}}]),
            (["map", "wild"], []), (["map", "wild", 0], ["reedlet"]), (["map", "wild", 0, 0], "stillwake"),
            (["map", "wild", 0, 0], "cindercub"), (["map", "wild", 0, 0], "orchardroot"), (["map", "wild", 0, 0], []),
            (["map", "wild", 0, 1], 0), (["map", "wild", 0, 1], -2), (["map", "wild", 0, 1], True),
            (["map", "wild", 0, 1], 1.5), (["map", "wild", 0, 1], "24"), (["map", "wild", 0, 1], 25),
            (["gates"], []), (["gates", 0], None), (["gates", 0, "key"], "field:stone"), (["gates", 0, "key"], []),
            (["gates", 0, "door"], "lowbell-nothing"), (["gates", 0, "id"], "other"), (["gates", 0, "at"], []),
            (["gates", 0, "at"], [[0, 0]]), (["gates", 0, "at"], [[3, 14]]), (["gates", 0, "at"], [[3, 15]]),
            (["gates", 0, "at"], [[13.0, 8]]), (["gates", 0, "at"], [[13, 8], [13, 8]]),
            (["gates", 0, "at"], [[13, 8], [13, 9]]), (["gates", 0, "at"], [[13, 9], [14, 9], [15, 9]]),
            (["gates", 0, "beyond"], [11, 9]), (["gates", 0, "beyond"], [13, 9]), (["gates", 0, "beyond"], [0, 0]),
            (["gates", 0, "beyond"], [3, 14]),
            (["markers"], []), (["markers", 0], None), (["markers", 0, "id"], "bell"), (["markers", 0, "kind"], "echo-stone"),
            (["markers", 0, "quest"], "sq-senna-stones"), (["markers", 0, "step"], 2), (["markers", 0, "step"], True),
            (["markers", 0, "rings"], 0), (["markers", 0, "rings"], 13), (["markers", 0, "rings"], 4.0), (["markers", 0, "rings"], "4"),
            (["markers", 0, "at"], [5, 8]), (["markers", 0, "at"], [3, 14]), (["markers", 0, "at"], [0, 0]),
            (["markers", 0, "at"], [12, 9]), (["markers", 0, "at"], [22, 5]), (["markers", 0, "at"], [14, 9]),
            (["markers", 0, "at"], [21.0, 8]), (["markers", 0, "at"], [26, 8]),
            (["layout", "mouth_px"], [48, 32]), (["layout", "mouth_px"], [16, 48]), (["layout", "ceiling_px"], 48),
            (["layout", "ceiling_px"], 16), (["layout", "mounts_allowed"], True), (["layout", "mounts_allowed"], 0),
            (["integration", "status"], "ready"), (["integration", "destinations"], ["stillreed"]),
            (["integration", "destinations"], []), (["integration", "destinations"], ["quietchannels", "stillreed"]),
            (["integration", "incoming_requirements"], {}), (["integration", "incoming_requirements"], {"quietchannels": {"badge": "reed"}}),
            (["integration", "jetty"], {"sight_from": "hollowecho", "mount_pad_tiles": [2, 2]}),
            (["integration", "jetty"], {"sight_from": "stillreed", "mount_pad_tiles": [1, 1]}),
        ]
        for path, value in changes:
            changed(str(path) + " = " + str(value)[:30], path, value)
        data = deepcopy(self.data)
        data["markers"] = data["markers"] + [deepcopy(data["markers"][0])]
        cases.append(("a second bell marker", data))
        data = deepcopy(self.data)
        data["markers"].append({"id": "stillwake", "kind": "guardian", "quest": QUEST, "step": 1, "rings": 1, "at": [20, 5]})
        cases.append(("a guardian marker", data))
        changed("duplicate species", ["map", "wild", 1], self.data["map"]["wild"][0])
        rows_edit("a wall opened in the border", (0, 5, "."))
        rows_edit("the mouth widened", (15, 4, "S"))
        rows_edit("a stray exit tile", (4, 25, "E"))
        rows_edit("an exit on the wrong edge", (10, 25, "S"))
        rows_edit("a bypass below the flooded floor", *[(11, x, ".") for x in range(12, 17)])
        rows_edit("a bypass above the flooded floor", *[(7, x, ".") for x in range(11, 19)])
        rows_edit("the stair widened", (13, 4, "."), (14, 4, "."))
        rows_edit("a walled-off pocket", (2, 5, "."))
        rows_edit("the passage walled shut", (8, 12, "#"), (9, 12, "#"), (10, 12, "#"))
        rows_edit("the bell chamber opened to the landing", *[(12, x, ".") for x in range(11, 17)])
        for label, data in cases:
            with self.subTest(label=label), self.assertRaises(ValueError):
                self.check(data)
        print(f"WBW-15 malformed fixtures: {len(cases)} rejected.")

    def test_design_agrees_with_the_blueprint(self):
        for phrase in ("Under The Quiet Channels.", "Stillwake stays the basin's guardian on the surface",
                       "where you go back to hear the bell, not a second guardian", "`sq-lowbell` | Reedhold | Tavil, then Olan",
                       "Bring the count of the rings back to Veslin in Bellstep"):
            self.assertIn(phrase, self.design)
        self.assertIn("6. **Lowbell** (`lowbell`)", self.design)

    def test_strict_json_rejects_duplicate_keys_and_nonfinite_numbers(self):
        for text in ('{"id":1,"id":2}', '{"map":{"rows":[],"rows":[]}}', '{"x":NaN}', '{"x":Infinity}',
                     '{"x":-Infinity}', '{"x":1e309}', '{"x":-1e309}'):
            with self.subTest(text=text), self.assertRaises(ValueError):
                load_json(text)


if __name__ == "__main__":
    if sys.argv[1:] == ["--runtime-landings"]:
        try:
            validate_runtime_landings(load_json(BLUEPRINT.read_text(encoding="utf-8")))
        except ValueError as error:
            raise SystemExit(f"Runtime landing gate: {error}") from error
        print("Runtime landing gate passed; other integration checks still apply.")
    else:
        unittest.main()
