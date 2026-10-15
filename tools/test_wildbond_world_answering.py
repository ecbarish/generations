"""Validate the WBW-4 planning blueprint for the Answering Ways; this does not load a game map.

Run from the repository root: python3 -m unittest tools/test_wildbond_world_answering.py
Standalone, like the WBW-2 and WBW-6 tests: it reads the game's data and the design and changes nothing.
The two destination landings stay explicitly unresolved until the map owner places them.
"""

from collections import deque
from copy import deepcopy
from itertools import combinations
import json
import math
from pathlib import Path
import re
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
BLUEPRINT = ROOT / "docs/plans/wildbond-world/answering.json"
GAME = ROOT / "wildbond-godot/data/wildbond.json"
DESIGN = ROOT / "docs/plans/wildbond-world-design.md"
GATES = ROOT / "docs/plans/wildbond-world/gates.json"
GRAPH = ROOT / "docs/plans/wildbond-world/world-graph.json"
DIRECTIONS = {"up", "down", "left", "right"}
FIELD_KEYS = {"field:lantern", "field:stone", "field:hush"}
ENVELOPE = {"id", "map", "gates", "zones", "markers", "layout", "integration"}
MAP_KEYS = {"name", "biome", "start", "rows", "exits", "signs", "items", "wild"}
GATE_KEYS = {"id", "door", "key", "at", "beyond"}
# The row says "bellstep or flintcut". Bellstep is the existing hollowecho map (world-graph.md), so that is the id used.
EXIT_TARGETS = {"S": "hollowecho", "E": "flintcut"}
REVEAL_MOUTH = (19, 8)  # the hamlet tile that stays the reveal's scenery; the cave's mouth is not this tile
ZONES = [("lit-hall", "lit"), ("lantern-dark", "dark"), ("hush-doors", "hush")]
STONE_QUEST = "sq-senna-stones"


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


def planned_route_ids(design):
    # Only the numbered route table supplies new map IDs. Narrative story IDs do not.
    routes = design.split("| # | Id | Name | Joins |", 1)
    require(len(routes) == 2, "design: route table missing")
    table = routes[1].split("\n\n", 1)[0]
    return set(re.findall(r"^\|\s*\d+\s*\|\s*`([a-z_]+)`", table, re.MULTILINE))


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


def rect_tiles(rects, width, height, label):
    require(isinstance(rects, list) and rects, f"{label}: rects must be a nonempty list")
    out = set()
    for rect in rects:
        require(isinstance(rect, list) and len(rect) == 4 and all(type(v) is int for v in rect), f"{label}: a rect is [x, y, w, h]")
        x, y, w, h = rect
        require(w >= 1 and h >= 1 and 0 <= x and 0 <= y and x + w <= width and y + h <= height, f"{label}: rect out of bounds")
        out |= {(x + i, y + j) for i in range(w) for j in range(h)}
    return out


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
    """Pre-wiring gate: no planned marker, every landing exists and is safe, and the hamlet landing is not the reveal tile.

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
        require(not (target == "hollowecho" and (x, y) == REVEAL_MOUTH),
                "the cave mouth must not be the reveal mouth at (19, 8)")


def validate(data, game=None, design=None, gates=None):
    """Raise ValueError for malformed planning data, without mutating any input. Returns a short summary."""
    if game is None:
        game = load_json(GAME.read_text(encoding="utf-8"))
    if design is None:
        design = DESIGN.read_text(encoding="utf-8")
    if gates is None:
        gates = load_json(GATES.read_text(encoding="utf-8"))
    exact_keys(data, ENVELOPE, "blueprint")
    require(data["id"] == "answering", "id must be answering")
    m = data["map"]
    exact_keys(m, MAP_KEYS, "map")
    require(m["name"] == "The Answering Ways" and m["biome"] == "hollowecho", "map identity drift")
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

    # Exits: only Bellstep (the hamlet's map, id hollowecho) and Flintcut. Destination x/y are not invented.
    exact_keys(m["exits"], set(EXIT_TARGETS), "exits")
    valid_targets = set(game["MAPS"]) | planned_route_ids(design)
    for glyph, exit_record in m["exits"].items():
        validate_exit_landing(exit_record)
        target = exit_record["to"]
        require(target in valid_targets, "unknown exit destination")
        require(target == EXIT_TARGETS[glyph], "exit goes only to bellstep (hollowecho) or flintcut, as designed")
        require(all(exit_record.get("landing") == "planned" for _ in (0,)), "both landings must be marked planned")
    actual_exits = {ch for row in rows for ch in row if tiles[ch].get("exit", 0)}
    require(actual_exits == set(m["exits"]), "exit glyph and exit record mismatch")
    exit_points = {(x, y) for x, y in walkable if rows[y][x] in actual_exits}
    for x, y in exit_points:
        require((rows[y][x] == "S" and y == height - 1) or (rows[y][x] == "E" and x == width - 1),
                "exit must be on its matching edge")
    mouth = sorted((x, y) for x, y in exit_points if rows[y][x] == "S")
    require(len(mouth) == 3 and [x for x, _ in mouth] == list(range(mouth[0][0], mouth[0][0] + 3)),
            "mouth must be three adjacent 16px tiles wide (48px)")
    require(all((x, y) in walkable for x in range(mouth[0][0], mouth[0][0] + 3) for y in range(height - 4, height - 1)),
            "mouth needs a clear block three tiles tall (48px) above it")
    require(len(exit_points - set(mouth)) == 1, "the Flintcut exit must be one edge tile")
    require(all((x, y) in exit_points for x, y in walkable if x in (0, width - 1) or y in (0, height - 1)),
            "open border outside exit")

    require(m["signs"] == {}, "sign copy is deferred; no new lore in this layout")
    require(m["items"] == [], "rewards and quest props are deferred")

    wild = m["wild"]
    require(isinstance(wild, list) and wild, "wild must be a nonempty list")
    country = game["BIOMES"]["hollowecho"]
    require(country["lv"] == [58, 64], "Hollowecho level band must remain 58 to 64")
    allowed = {row[0] for row in country["wild"]}
    seen_species = set()
    for entry in wild:
        require(isinstance(entry, list) and len(entry) == 2, "wild row must be [species, weight]")
        species, weight = entry
        require(isinstance(species, str) and species in game["SPECIES"] and species in allowed,
                "wild species must exist in SPECIES and Hollowecho BIOMES")
        require(species != "undertone" and not game["SPECIES"][species].get("unique", False),
                "unique guardians cannot appear in wild (Undertone is not in wild)")
        require(species not in seen_species, "duplicate wild species")
        seen_species.add(species)
        require(type(weight) is int and weight > 0, "wild weight must be a positive integer")
    require(wild == country["wild"], "keep Hollowecho's existing table and weights")

    # Gates: one record per obstacle. `at` tiles are walkable substrate with an overlay; `beyond` is a protected witness.
    records = data["gates"]
    require(isinstance(records, list) and records, "gates must be a nonempty list")
    record_ids, closed_all, tiles_by_record = set(), set(), []
    for gate in records:
        exact_keys(gate, GATE_KEYS, "gate")
        require(isinstance(gate["id"], str) and gate["id"] and gate["id"] not in record_ids, "invalid or duplicate gate id")
        record_ids.add(gate["id"])
        require(isinstance(gate["key"], str) and gate["key"] in FIELD_KEYS, "invalid gate key")
        at = gate["at"]
        require(isinstance(at, list) and at, "gate needs at least one overlay tile")
        gate_tiles = {coordinate(t, width, height, gate["id"]) for t in at}
        require(len(gate_tiles) == len(at), "duplicate overlay tile in a gate")
        beyond = coordinate(gate["beyond"], width, height, gate["id"] + " beyond")
        require(gate_tiles <= walkable and beyond in walkable, "gate tiles and the witness must be walkable")
        require(not (gate_tiles & exit_points) and origin not in gate_tiles and beyond != origin and beyond not in gate_tiles,
                "invalid gate location")
        require(not (gate_tiles & closed_all), "two gates share an overlay tile")
        closed_all |= gate_tiles
        tiles_by_record.append((gate, gate_tiles, beyond))
    require({g["key"] for g in records} == FIELD_KEYS, "all three field keys need a gate")
    require(not ({b for _, _, b in tiles_by_record} & closed_all), "a witness cannot be another gate's tile")
    # Each door is a door that gates.json (WBW-6) already lists at this place, with the same key.
    sheet = {g["door"]: g["key"] for g in gates["gates"] if g["place"] == "answering"}
    require(set(sheet.values()) == FIELD_KEYS, "gates.json no longer lists the three answering doors")
    require({g["door"] for g in records} == set(sheet), "gates must cover exactly the doors gates.json lists at answering")
    for gate in records:
        require(sheet[gate["door"]] == gate["key"], "gate key differs from gates.json for " + gate["door"])

    # Everything is reachable once all gates open; nothing needed for the first hall.
    require(reachable(rows, tiles, origin) == walkable, "unreachable walkable tile")
    none_open = reachable(rows, tiles, origin, closed_all)
    require(set(mouth) <= none_open, "an unlearned visitor cannot return to the hamlet")
    require(exit_points <= none_open, "both exits must need no field key")
    for gate, gate_tiles, beyond in tiles_by_record:
        require(any(p in none_open for t in gate_tiles for p in ((t[0] - 1, t[1]), (t[0] + 1, t[1]), (t[0], t[1] - 1), (t[0], t[1] + 1))),
                "closed gate must be approachable from the first hall")
        require(beyond not in reachable(rows, tiles, origin, closed_all) and beyond not in reachable(rows, tiles, origin, gate_tiles),
                "gate can be bypassed")
        others = closed_all - gate_tiles
        require(beyond in reachable(rows, tiles, origin, others), "gate depends on an unrelated lesson")

    # Zones are overlays, never new tiles.
    zones = data["zones"]
    require(isinstance(zones, list) and [(z.get("id"), z.get("kind")) for z in zones if isinstance(z, dict)] == ZONES and len(zones) == 3,
            "zones must be exactly lit-hall, lantern-dark and hush-doors, in that order")
    zone_tiles = {}
    for zone in zones:
        exact_keys(zone, {"id", "kind", "rects"}, "zone")
        zone_tiles[zone["id"]] = rect_tiles(zone["rects"], width, height, zone["id"])
    lit, dark, hush = zone_tiles["lit-hall"], zone_tiles["lantern-dark"], zone_tiles["hush-doors"]
    require(not (lit & dark) and not (lit & closed_all) and not (dark & closed_all), "zones overlap each other or a gate tile")
    require(lit <= walkable and dark <= walkable, "a lit or dark zone covers a wall")
    require(origin in lit and lit <= none_open, "the lit first hall must need no field key")
    lantern = next(t for g, t, _ in tiles_by_record if g["key"] == "field:lantern")
    stone_hush = closed_all - lantern
    after_lantern = reachable(rows, tiles, origin, closed_all - lantern)
    require(not (dark & none_open), "the Lantern-dark area must be behind the Lantern gate")
    require(dark <= after_lantern, "the whole Lantern-dark area must open with Lantern alone")
    require(not (dark & reachable(rows, tiles, origin, lantern)), "the dark area can be entered without Lantern")
    require(not (dark & exit_points) and origin not in dark, "no exit or start in the dark area")
    require(hush == {t for g, ts, _ in tiles_by_record if g["key"] == "field:hush" for t in ts}, "hush-doors zone must be exactly the hush gate tiles")
    del stone_hush

    # Markers: the Undertone story marker at the first bend, and exactly three echo stones, the last behind Hush.
    markers = data["markers"]
    require(isinstance(markers, list) and len(markers) == 4, "four markers required: Undertone's return and three echo stones")
    by_id = {}
    for marker in markers:
        require(isinstance(marker, dict) and isinstance(marker.get("id"), str) and marker["id"] not in by_id, "invalid or duplicate marker")
        by_id[marker["id"]] = marker
    require(list(by_id) == ["undertone-return", "echo-stone-1", "echo-stone-2", "echo-stone-3"], "marker ids or order drift")
    marker_tiles = set()
    undertone = by_id["undertone-return"]
    exact_keys(undertone, {"id", "kind", "story", "at", "pad"}, "undertone marker")
    require(undertone["kind"] == "story" and undertone["story"] == "undertone" and "undertone" in game["SPECIES"],
            "Undertone's marker must be a story-only marker for undertone")
    require(undertone["pad"] == [2, 2], "Undertone needs a 2 by 2 pad")
    pad_at = coordinate(undertone["at"], width, height, "undertone")
    pad_tiles = {(pad_at[0] + i, pad_at[1] + j) for i in range(2) for j in range(2)}
    require(pad_tiles <= walkable and not (pad_tiles & closed_all) and not (pad_tiles & exit_points), "Undertone's pad must be open floor")
    require(pad_at in lit, "Undertone waits at the first bend, inside the lit first hall")
    marker_tiles.add(pad_at)
    stones = []
    for index, name in enumerate(("echo-stone-1", "echo-stone-2", "echo-stone-3"), start=1):
        marker = by_id[name]
        exact_keys(marker, {"id", "kind", "quest", "order", "at"}, name)
        require(marker["kind"] == "echo-stone" and marker["quest"] == STONE_QUEST and marker["order"] == index, name + ": kind, quest or order drift")
        require(STONE_QUEST in design, "the design no longer names the echo-stone quest")
        at = coordinate(marker["at"], width, height, name)
        require(at in walkable and at not in closed_all and at not in exit_points and at != origin and at not in marker_tiles,
                name + ": stone must stand on its own open tile")
        require(rows[at[1]][at[0]] != '"', name + ": stone must not sit in an encounter patch")
        marker_tiles.add(at)
        stones.append(at)
    hush_tiles = {t for g, ts, _ in tiles_by_record if g["key"] == "field:hush" for t in ts}
    for first_two in stones[:2]:
        require(first_two in none_open, "the first two echo stones need no field key")
    require(stones[2] not in none_open and stones[2] not in reachable(rows, tiles, origin, hush_tiles),
            "the last echo stone must be behind field:hush")
    require(stones[2] in reachable(rows, tiles, origin, closed_all - hush_tiles), "the last echo stone must need only Hush")
    require(marker_tiles <= walkable, "a marker is on a wall")

    # Anything may follow Undertone in: a 2 by 2 body goes from the mouth to Undertone's pad with no field key.
    layout = data["layout"]
    exact_keys(layout, {"mouth_px", "ceiling_px", "mounts_allowed"}, "layout")
    require(isinstance(layout["mouth_px"], list) and all(type(v) is int for v in layout["mouth_px"]) and layout["mouth_px"] == [48, 48],
            "mouth must be 48 by 48px")
    require(type(layout["ceiling_px"]) is int and layout["ceiling_px"] == 48, "ceiling must be 48px")
    require(layout["mounts_allowed"] is True, "mounts may enter the Answering Ways")
    body = body_reachable(rows, tiles, (mouth[0][0], height - 3), 2, closed_all)
    require(pad_at in body, "a 2 by 2 mount cannot walk from the mouth to Undertone's pad")

    exact_keys(data["integration"], {"status", "destinations", "incoming_requirements", "excluded_hamlet_tile"}, "integration")
    integration = data["integration"]
    require(integration["status"] == "unresolved_landings", "landing status must remain explicit")
    require(integration["destinations"] == ["hollowecho", "flintcut"], "both destination landings must be listed as unresolved")
    require(integration["excluded_hamlet_tile"] == list(REVEAL_MOUTH), "the cave mouth is not the reveal mouth at (19, 8)")
    # Neither way in has a gate in gates.json (the link is open), so no incoming requirement is recorded.
    linked = [g for g in gates["gates"] if g["place"] and "--" in g["place"] and "answering" in g["place"].split("--")]
    require(integration["incoming_requirements"] == {} and not linked, "the way in from Flintcut has no gate in gates.json")
    return {"width": width, "height": height, "walkable": len(walkable), "first_hall": len(none_open), "species": len(wild),
            "gates": len(records), "zones": len(zones), "markers": len(markers)}


class AnsweringTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = load_json(BLUEPRINT.read_text(encoding="utf-8"))
        cls.game = load_json(GAME.read_text(encoding="utf-8"))
        cls.design = DESIGN.read_text(encoding="utf-8")
        cls.gates = load_json(GATES.read_text(encoding="utf-8"))

    def check(self, data, game=None, gates=None):
        return validate(data, game or self.game, self.design, gates or self.gates)

    def keys_open(self, keys):
        m = self.data["map"]
        closed = {tuple(t) for g in self.data["gates"] if g["key"] not in keys for t in g["at"]}
        return reachable(m["rows"], self.game["TILES"], m["start"][:2], closed)

    def test_blueprint_matches_current_game_contract(self):
        result = self.check(self.data)
        self.assertGreater(result["walkable"], result["first_hall"])
        print("WBW-4 layout:", result)

    def test_validation_does_not_mutate_input(self):
        before = deepcopy(self.data)
        self.check(self.data)
        self.assertEqual(self.data, before)

    def test_the_whole_cave_is_reachable_and_both_exits_reach_every_tile(self):
        m = self.data["map"]
        tiles = self.game["TILES"]
        everything = reachable(m["rows"], tiles, m["start"][:2])
        walkable = {(x, y) for y, row in enumerate(m["rows"]) for x, ch in enumerate(row) if not tiles[ch].get("solid", 0)}
        self.assertEqual(everything, walkable)
        for y, row in enumerate(m["rows"]):
            for x, glyph in enumerate(row):
                if glyph in m["exits"]:
                    self.assertEqual(reachable(m["rows"], tiles, (x, y)), everything)
        for gate in self.data["gates"]:
            for t in gate["at"]:
                self.assertIn(tuple(t), everything)
        for marker in self.data["markers"]:
            self.assertIn(tuple(marker["at"]), everything)

    def test_every_combination_of_the_three_field_keys(self):
        keys = sorted(FIELD_KEYS)
        zones = {z["id"]: rect_tiles(z["rects"], 32, 22, z["id"]) for z in self.data["zones"]}
        stones = [tuple(mk["at"]) for mk in self.data["markers"] if mk["kind"] == "echo-stone"]
        for count in range(4):
            for learned in combinations(keys, count):
                with self.subTest(learned=learned):
                    seen = self.keys_open(set(learned))
                    self.assertTrue(zones["lit-hall"] <= seen)
                    self.assertEqual(bool(zones["lantern-dark"] & seen), "field:lantern" in learned)
                    self.assertEqual(zones["lantern-dark"] <= seen, "field:lantern" in learned)
                    for gate in self.data["gates"]:
                        self.assertEqual(tuple(gate["beyond"]) in seen, gate["key"] in learned, gate["id"])
                    self.assertEqual(stones[2] in seen, "field:hush" in learned)
                    self.assertTrue(stones[0] in seen and stones[1] in seen)

    def test_the_first_hall_needs_no_key_and_neither_does_either_exit(self):
        seen = self.keys_open(set())
        m = self.data["map"]
        for y, row in enumerate(m["rows"]):
            for x, glyph in enumerate(row):
                if glyph in m["exits"]:
                    self.assertIn((x, y), seen)
        self.assertIn(tuple(m["start"][:2]), seen)

    def test_a_mount_can_walk_from_the_mouth_to_undertones_pad(self):
        m = self.data["map"]
        closed = {tuple(t) for g in self.data["gates"] for t in g["at"]}
        mouth_x = min(x for y, row in enumerate(m["rows"]) for x, ch in enumerate(row) if ch == "S")
        body = body_reachable(m["rows"], self.game["TILES"], (mouth_x, len(m["rows"]) - 3), 2, closed)
        pad = next(tuple(mk["at"]) for mk in self.data["markers"] if mk["id"] == "undertone-return")
        self.assertIn(pad, body)
        # A one-tile-wide neck would stop a mount: narrow the bend passage and the 2 by 2 walk must fail.
        narrow = list(m["rows"])
        narrow[9] = narrow[9][:9] + "#" + narrow[9][10:]
        self.assertNotIn(pad, body_reachable(narrow, self.game["TILES"], (mouth_x, len(narrow) - 3), 2, closed))
        self.assertIn(pad, reachable(narrow, self.game["TILES"], self.data["map"]["start"][:2], closed))  # a person still fits

    def test_undertone_is_a_story_marker_and_is_not_wild(self):
        wild = {row[0] for row in self.data["map"]["wild"]}
        self.assertNotIn("undertone", wild)
        self.assertTrue(self.game["SPECIES"]["undertone"].get("unique"))
        self.assertEqual(wild, {row[0] for row in self.game["BIOMES"]["hollowecho"]["wild"]})
        self.assertFalse(any(self.game["SPECIES"][s].get("unique") for s in wild))

    def test_exactly_three_echo_stones_and_the_last_is_behind_hush(self):
        stones = [mk for mk in self.data["markers"] if mk["kind"] == "echo-stone"]
        self.assertEqual([s["order"] for s in stones], [1, 2, 3])
        last = tuple(stones[2]["at"])
        self.assertNotIn(last, self.keys_open(set()))
        self.assertNotIn(last, self.keys_open({"field:lantern", "field:stone"}))
        self.assertIn(last, self.keys_open({"field:hush"}))

    def test_gate_doors_and_keys_are_the_ones_gates_json_lists(self):
        sheet = {g["door"]: g["key"] for g in self.gates["gates"] if g["place"] == "answering"}
        self.assertEqual(sheet, {"answering-dark-hall": "field:lantern", "answering-side-cracks": "field:stone",
                                 "answering-wall-doors": "field:hush"})
        self.assertEqual({g["door"] for g in self.data["gates"]}, set(sheet))
        changed = deepcopy(self.gates)
        for g in changed["gates"]:
            if g["door"] == "answering-wall-doors":
                g["key"] = "field:glide"
        with self.assertRaises(ValueError):
            self.check(self.data, gates=changed)
        removed = deepcopy(self.gates)
        removed["gates"] = [g for g in removed["gates"] if g["door"] != "answering-side-cracks"]
        with self.assertRaises(ValueError):
            self.check(self.data, gates=removed)

    @unittest.skipUnless(GRAPH.exists(), "WBW-3's world-graph.json is not on this branch")
    def test_agrees_with_the_world_graph(self):
        graph = load_json(GRAPH.read_text(encoding="utf-8"))
        place = next(p for p in graph["places"] if p["id"] == "answering")
        self.assertEqual((place["kind"], place["phase"]), ("cave", 3))
        link = next(l for l in graph["links"] if {l["a"], l["b"]} == {"flintcut", "answering"})
        self.assertEqual(link["gate"], [])
        ids = {p["id"] for p in graph["places"]}
        self.assertTrue(set(self.data["integration"]["destinations"]) <= ids)
        bellstep = next(p for p in graph["places"] if p["id"] == "hollowecho")
        self.assertEqual(bellstep["name"], "Bellstep")

    def test_planned_ids_include_flintcut_and_not_story_encounters(self):
        ids = planned_route_ids(self.design)
        self.assertIn("flintcut", ids)
        self.assertNotIn("elder", ids)
        self.assertIn("hollowecho", self.game["MAPS"])

    def test_unique_species_rejected_even_if_the_country_table_is_changed(self):
        game = deepcopy(self.game)
        game["SPECIES"]["bellmote"]["unique"] = 1
        with self.assertRaisesRegex(ValueError, "unique guardians"):
            validate(self.data, game, self.design, self.gates)

    def test_biome_drift_is_rejected(self):
        for levels in ([57, 64], [58, 65], [64, 58]):
            game = deepcopy(self.game)
            game["BIOMES"]["hollowecho"]["lv"] = levels
            with self.assertRaisesRegex(ValueError, "level band"):
                validate(self.data, game, self.design, self.gates)
        game = deepcopy(self.game)
        game["BIOMES"]["hollowecho"]["wild"][0][1] = 25
        with self.assertRaisesRegex(ValueError, "existing table"):
            validate(self.data, game, self.design, self.gates)

    def test_a_tile_that_stops_being_walkable_in_the_game_is_caught(self):
        game = deepcopy(self.game)
        game["TILES"]["."]["solid"] = 1
        with self.assertRaises(ValueError):
            validate(self.data, game, self.design, self.gates)

    def test_null_landings_require_the_planned_marker(self):
        for original in self.data["map"]["exits"].values():
            validate_exit_landing(original)
            without_marker = {k: v for k, v in original.items() if k != "landing"}
            with self.assertRaisesRegex(ValueError, "integer x/y"):
                validate_exit_landing(without_marker)
            for marker in (None, False, "", "resolved"):
                with self.assertRaises(ValueError):
                    validate_exit_landing({**original, "landing": marker})
            for key, value in (("x", 1), ("y", 1), ("dir", "up")):
                with self.assertRaises(ValueError):
                    validate_exit_landing({**original, key: value})

    def test_other_exits_require_integer_coordinates_and_arrival_direction(self):
        resolved = {"to": "hollowecho", "x": 1, "y": 8, "dir": "right"}
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
        for exit_record in resolved["map"]["exits"].values():
            del exit_record["landing"]
            exit_record.update(x=1, y=1, dir="right")
        with self.assertRaisesRegex(ValueError, "map does not exist"):
            validate_runtime_landings(resolved, self.game)  # Flintcut is only a planned map
        fixture = deepcopy(self.game)
        fixture["MAPS"]["flintcut"] = {"rows": ["###", "#.#", "###"]}
        fixture["MAPS"]["hollowecho"] = {"rows": ["#" * 30] + ["#" + "." * 28 + "#" for _ in range(12)] + ["#" * 30]}
        validate_runtime_landings(resolved, fixture)
        for x, y in ((0, 0), (30, 1), (1, 14), (-1, 1)):
            broken = deepcopy(resolved)
            broken["map"]["exits"]["S"].update(x=x, y=y)
            with self.assertRaises(ValueError):
                validate_runtime_landings(broken, fixture)
        reveal = deepcopy(resolved)
        reveal["map"]["exits"]["S"].update(x=19, y=8)
        with self.assertRaisesRegex(ValueError, "reveal mouth"):
            validate_runtime_landings(reveal, fixture)
        fixture["MAPS"]["flintcut"]["rows"][1] = "#E#"
        with self.assertRaisesRegex(ValueError, "immediately exit"):
            validate_runtime_landings(resolved, fixture)
        for exits in ({}, {"E": resolved["map"]["exits"]["E"]}):
            broken = deepcopy(resolved)
            broken["map"]["exits"] = exits
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

        def rows_edit(label, y, x, ch, *more):
            data = deepcopy(self.data)
            for (yy, xx, cc) in ((y, x, ch),) + more:
                row = data["map"]["rows"][yy]
                data["map"]["rows"][yy] = row[:xx] + cc + row[xx + 1:]
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
            (["id"], "knothollow"), (["map", "name"], "Answering Ways"), (["map", "biome"], "thornwood"),
            (["map", "rows"], []), (["map", "rows", 0], "#"), (["map", "rows", 0], None), (["map", "rows", 0], "?" * 32),
            (["map", "rows", 0], "#." + "#" * 30),
            (["map", "start"], [15, 19]), (["map", "start"], [True, 19, "up"]), (["map", "start"], [-1, 19, "up"]),
            (["map", "start"], [32, 19, "up"]), (["map", "start"], [0, 0, "up"]), (["map", "start"], [15, 21, "up"]),
            (["map", "start"], [15, 19, []]),
            (["map", "exits", "S", "to"], "made_up"), (["map", "exits", "S", "to"], "flintcut"),
            (["map", "exits", "S", "to"], "bellstep"), (["map", "exits", "E", "to"], "hollowecho"),
            (["map", "exits", "E", "to"], "kilnvent"), (["map", "exits", "S", "to"], []),
            (["map", "exits", "S", "x"], 1), (["map", "exits", "S", "landing"], "unknown"),
            (["map", "exits", "E", "dir"], "down"), (["map", "exits", "E"], None),
            (["map", "signs"], {"4,4": "Invented lore"}),
            (["map", "items"], [{"id": "unapproved", "give": {"coins": 1}}]),
            (["map", "wild"], []), (["map", "wild", 0], ["hushpup"]), (["map", "wild", 0, 0], "undertone"),
            (["map", "wild", 0, 0], "cindercub"), (["map", "wild", 0, 0], []),
            (["map", "wild", 0, 1], 0), (["map", "wild", 0, 1], -2), (["map", "wild", 0, 1], True),
            (["map", "wild", 0, 1], 1.5), (["map", "wild", 0, 1], "24"),
            (["gates"], []), (["gates", 0], None), (["gates", 0, "key"], "field:tide"), (["gates", 0, "key"], []),
            (["gates", 0, "key"], "field:stone"), (["gates", 0, "door"], "answering-nothing"),
            (["gates", 0, "id"], "side-crack-west"), (["gates", 0, "at"], []), (["gates", 0, "at"], [[0, 0]]),
            (["gates", 0, "at"], [[15, 19]]), (["gates", 0, "at"], [[15, 21]]), (["gates", 0, "at"], [[18.0, 6]]),
            (["gates", 0, "at"], [[18, 6], [18, 6]]), (["gates", 0, "at"], [[18, 6]]),
            (["gates", 0, "beyond"], [8, 6]), (["gates", 0, "beyond"], [18, 6]), (["gates", 0, "beyond"], [0, 0]),
            (["gates", 1, "at"], [[13, 8]]), (["gates", 1, "beyond"], [6, 14]),
            (["zones"], []), (["zones", 0, "id"], "first-hall"), (["zones", 0, "kind"], "dark"),
            (["zones", 0, "rects"], []), (["zones", 0, "rects"], [[0, 0, 40, 40]]), (["zones", 0, "rects"], [[8, 6, 0, 2]]),
            (["zones", 0, "rects"], [[6, 13, 20, 8], [19, 3, 3, 3]]),
            (["zones", 1, "rects"], [[19, 3, 10, 8]]), (["zones", 1, "rects"], [[0, 0, 5, 5]]),
            (["zones", 2, "rects"], [[13, 8, 1, 1]]), (["zones", 2, "rects"], [[13, 8, 1, 1], [16, 5, 1, 1], [5, 16, 1, 1]]),
            (["markers"], []), (["markers", 0, "story"], "elder"), (["markers", 0, "kind"], "echo-stone"),
            (["markers", 0, "pad"], [1, 1]), (["markers", 0, "at"], [7, 6]), (["markers", 0, "at"], [9, 12]),
            (["markers", 0, "at"], [20, 4]), (["markers", 0, "at"], [0, 0]),
            (["markers", 1, "order"], 2), (["markers", 1, "quest"], "sq-other"), (["markers", 1, "kind"], "story"),
            (["markers", 1, "at"], [15, 19]), (["markers", 1, "at"], [18, 6]), (["markers", 1, "at"], [0, 0]),
            (["markers", 1, "at"], [31, 16]), (["markers", 1, "at"], [7, 14]),
            (["markers", 3, "at"], [14, 6]), (["markers", 3, "at"], [20, 19]), (["markers", 3, "at"], [3, 16]),
            (["markers", 3, "at"], [12, 3]), (["markers", 3, "at"], [22, 6]), (["markers", 3, "order"], 1),
            (["layout", "mouth_px"], [48, 32]), (["layout", "mouth_px"], [32, 48]), (["layout", "ceiling_px"], 32),
            (["layout", "mounts_allowed"], False), (["layout", "mounts_allowed"], 1),
            (["integration", "status"], "ready"), (["integration", "destinations"], ["hollowecho"]),
            (["integration", "destinations"], ["flintcut", "hollowecho"]),
            (["integration", "incoming_requirements"], {"flintcut": {"badge": "echo"}}),
            (["integration", "excluded_hamlet_tile"], [20, 8]),
        ]
        for path, value in changes:
            changed(str(path) + " = " + str(value)[:30], path, value)
        data = deepcopy(self.data)
        data["markers"] = data["markers"] + [{"id": "echo-stone-4", "kind": "echo-stone", "quest": STONE_QUEST, "order": 4, "at": [10, 19]}]
        cases.append(("a fourth echo stone", data))
        data = deepcopy(self.data)
        data["markers"] = data["markers"][:3]
        cases.append(("only two echo stones", data))
        data = deepcopy(self.data)
        data["markers"][1], data["markers"][2] = data["markers"][2], data["markers"][1]
        cases.append(("echo stones out of order", data))
        changed("duplicate gate id", ["gates", 1], self.data["gates"][0])
        changed("duplicate species", ["map", "wild", 1], self.data["map"]["wild"][0])
        rows_edit("a wall opened in the border", 0, 5, ".")
        rows_edit("a second mouth tile closed", 21, 15, "#")
        rows_edit("the mouth widened", 21, 17, "S")
        rows_edit("a stray exit tile", 3, 31, "E")
        rows_edit("an exit on the wrong edge", 10, 31, "S")
        rows_edit("the dark hall opened to the lit hall", 10, 20, ".", (11, 20, "."), (12, 20, "."))
        rows_edit("a bypass around the Lantern line", 8, 18, ".", (8, 17, "."))
        rows_edit("a bypass around a side crack", 15, 5, ".")
        rows_edit("a bypass around a wall door", 8, 12, ".")
        rows_edit("a walled-off pocket", 3, 5, ".")
        rows_edit("the first bend walled shut", 9, 8, "#")
        for label, data in cases:
            with self.subTest(label=label), self.assertRaises(ValueError):
                self.check(data)
        print(f"WBW-4 malformed fixtures: {len(cases)} rejected.")

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
