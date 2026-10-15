"""Validate the WBW-2 planning blueprint; this does not load a game map.

Run from the repository root: python3 -m unittest tools/test_wildbond_world_knothollow.py
Destination landings remain explicitly unresolved until the map owner places them.
"""

from collections import deque
from copy import deepcopy
import json
import math
from pathlib import Path
import re
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
BLUEPRINT = ROOT / "docs/plans/wildbond-world/knothollow.json"
GAME = ROOT / "wildbond-godot/data/wildbond.json"
DESIGN = ROOT / "docs/plans/wildbond-world-design.md"
DIRECTIONS = {"up", "down", "left", "right"}
FIELD_KEYS = {"field:stone", "field:grove"}
DESTINATIONS = {"rootwater", "thornwood_grove"}
MAP_KEYS = {"name", "biome", "start", "rows", "exits", "signs", "items", "wild"}


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
    """Four-neighbour BFS; gates overlay walkable glyphs instead of inventing tiles."""
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
    """Pre-wiring gate: no planned marker, and every landing exists and is safe.

    This helper does not wire the blueprint into the engine or validate its other
    runtime systems. The current planning artifact must fail this gate.
    """
    if game is None:
        game = load_json(GAME.read_text(encoding="utf-8"))
    require(isinstance(data, dict) and isinstance(data.get("map"), dict), "runtime map must be an object")
    exits = data["map"].get("exits")
    exact_keys(exits, {"S", "E"}, "runtime exits")
    expected_to = {"S": "rootwater", "E": "thornwood_grove"}
    for glyph, exit_record in exits.items():
        validate_exit_landing(exit_record, runtime=True)
        target = exit_record["to"]
        require(target == expected_to[glyph], "runtime exit target differs from the designed connection")
        require(target in game["MAPS"], "runtime destination map does not exist")
        rows = game["MAPS"][target]["rows"]
        x, y = coordinate([exit_record["x"], exit_record["y"]], len(rows[0]), len(rows), "landing")
        tile = game["TILES"][rows[y][x]]
        require(not tile.get("solid", 0) and not tile.get("exit", 0),
                "runtime landing must be passable and must not immediately exit again")


def validate(data, game=None, design=None):
    """Raise ValueError for malformed planning data, without mutating any input."""
    if game is None:
        game = load_json(GAME.read_text(encoding="utf-8"))
    if design is None:
        design = DESIGN.read_text(encoding="utf-8")
    exact_keys(data, {"id", "map", "gates", "layout", "integration"}, "blueprint")
    require(data["id"] == "knothollow", "id must be knothollow")
    m = data["map"]
    exact_keys(m, MAP_KEYS, "map")
    require(m["name"] == "Knothollow" and m["biome"] == "thornwood", "map identity drift")
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
    walkable = {(x, y) for y, row in enumerate(rows) for x, ch in enumerate(row)
                if not tiles[ch].get("solid", 0)}
    require(origin in walkable and not tiles[rows[origin[1]][origin[0]]].get("exit", 0),
            "start must be a walkable non-exit tile")
    require(reachable(rows, tiles, origin) == walkable, "unreachable walkable tile")

    # Exact source-side exit glyphs; destination x/y are deliberately not fabricated.
    exact_keys(m["exits"], {"S", "E"}, "exits")
    expected_to = {"S": "rootwater", "E": "thornwood_grove"}
    valid_targets = set(game["MAPS"]) | planned_route_ids(design)
    for glyph, exit_record in m["exits"].items():
        validate_exit_landing(exit_record)
        target = exit_record["to"]
        require(isinstance(target, str) and target in valid_targets, "unknown exit destination")
        require(target == expected_to[glyph], "exit target differs from the designed connection")
    actual_exits = {ch for row in rows for ch in row if tiles[ch].get("exit", 0)}
    require(actual_exits == set(m["exits"]), "exit glyph and exit record mismatch")
    exit_points = {(x, y) for x, y in walkable if rows[y][x] in actual_exits}
    for x, y in exit_points:
        require((rows[y][x] == "S" and y == height - 1) or
                (rows[y][x] == "E" and x == width - 1), "exit must be on its matching edge")
    mouth = sorted((x, y) for x, y in exit_points if rows[y][x] == "S")
    require(len(mouth) == 3 and [x for x, _ in mouth] == list(range(mouth[0][0], mouth[0][0] + 3)),
            "mouth must be three adjacent 16px tiles wide")
    require(len(exit_points - set(mouth)) == 1, "grove exit must be one edge tile")
    # No unregistered open border that could silently become another route.
    require(all((x, y) in exit_points for x, y in walkable
                if x in (0, width - 1) or y in (0, height - 1)), "open border outside exit")

    require(m["signs"] == {}, "sign copy is deferred; no new lore in this layout")
    require(m["items"] == [], "rewards and quest props are deferred")
    wild = m["wild"]
    require(isinstance(wild, list) and wild, "wild must be a nonempty list")
    country = game["BIOMES"]["thornwood"]
    require(country["lv"] == [2, 12], "Thornwood level band must remain 2 to 12")
    allowed = {row[0] for row in country["wild"]}
    seen_species = set()
    for entry in wild:
        require(isinstance(entry, list) and len(entry) == 2, "wild row must be [species, weight]")
        species, weight = entry
        require(isinstance(species, str) and species in game["SPECIES"] and species in allowed,
                "wild species must exist in SPECIES and Thornwood BIOMES")
        require(species != "elderhorn" and not game["SPECIES"][species].get("unique", False),
                "unique guardians cannot appear in wild")
        require(species not in seen_species, "duplicate wild species")
        seen_species.add(species)
        require(type(weight) is int and weight > 0, "wild weight must be a positive integer")
    require(wild == country["wild"], "keep Thornwood's existing table and weights")

    gates = data["gates"]
    require(isinstance(gates, list) and len(gates) == 2, "exactly two field gates required")
    by_key, gate_tiles = {}, set()
    for gate in gates:
        exact_keys(gate, {"key", "at", "beyond"}, "gate")
        key = gate["key"]
        require(isinstance(key, str) and key in FIELD_KEYS and key not in by_key, "invalid or duplicate gate key")
        at = coordinate(gate["at"], width, height, key)
        beyond = coordinate(gate["beyond"], width, height, key + " beyond")
        require(at in walkable and beyond in walkable, "gate and its witness must be walkable")
        require(at not in exit_points and at != origin and at not in gate_tiles, "invalid or duplicate gate location")
        require(beyond != at and beyond != origin, "gate needs a distinct protected witness")
        by_key[key] = (at, beyond)
        gate_tiles.add(at)
    require(set(by_key) == FIELD_KEYS, "missing field gate")
    require(not ({b for _, b in by_key.values()} & gate_tiles), "gate witness cannot be another gate")
    no_lessons = reachable(rows, tiles, origin, gate_tiles)
    require(set(mouth) <= no_lessons, "unlearned visitor cannot return to Rootwater")
    for key, (at, beyond) in by_key.items():
        require(any(p in no_lessons for p in ((at[0]-1, at[1]), (at[0]+1, at[1]),
                                               (at[0], at[1]-1), (at[0], at[1]+1))),
                "closed gate must be approachable from the front chamber")
        without_key = reachable(rows, tiles, origin, {at})
        require(beyond not in without_key, "gate can be bypassed")
        other_closed = gate_tiles - {at}
        require(beyond in reachable(rows, tiles, origin, other_closed), "gate depends on an unrelated lesson")
    grove_exit = exit_points - set(mouth)
    require(grove_exit.isdisjoint(reachable(rows, tiles, origin, {by_key["field:grove"][0]})),
            "grove exit must require Grove Wake")
    require(grove_exit <= reachable(rows, tiles, origin, {by_key["field:stone"][0]}),
            "grove exit must not require Stone Break")
    # From the grove side, Stone Break still protects the deep crack.
    grove_origin = next(iter(grove_exit))
    require(by_key["field:stone"][1] not in reachable(rows, tiles, grove_origin, {by_key["field:stone"][0]}),
            "deep crack bypass from the grove entrance")

    exact_keys(data["layout"], {"mouth_px", "ceiling_px", "mounts_allowed"}, "layout")
    layout = data["layout"]
    require(isinstance(layout["mouth_px"], list) and all(type(v) is int for v in layout["mouth_px"])
            and layout["mouth_px"] == [48, 32], "mouth must be 48 by 32px")
    require(type(layout["ceiling_px"]) is int and layout["ceiling_px"] == 32, "ceiling must be 32px")
    require(layout["mounts_allowed"] is False, "no mount may enter Knothollow")
    exact_keys(data["integration"], {"status", "destinations", "incoming_requirements"}, "integration")
    require(data["integration"]["status"] == "unresolved_landings", "landing status must remain explicit")
    require(data["integration"]["destinations"] == ["rootwater", "thornwood_grove"],
            "both destination landings must be listed as unresolved")
    require(all(exit_record.get("landing") == "planned" for exit_record in m["exits"].values()),
            "both landings listed as unresolved must be explicitly marked planned")
    require(data["integration"]["incoming_requirements"] == {
        "rootwater": {"badge": "thorn"}, "thornwood_grove": {"story": "field:grove"}},
        "future incoming doors must require Thorn Badge and Grove Wake respectively")
    require("thorn" in game["BADGES"], "incoming badge must exist")
    return {"width": width, "height": height, "walkable": len(walkable),
            "front_chamber": len(no_lessons), "species": len(wild), "exit_tiles": len(exit_points)}


class KnothollowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = load_json(BLUEPRINT.read_text(encoding="utf-8"))
        cls.game = load_json(GAME.read_text(encoding="utf-8"))
        cls.design = DESIGN.read_text(encoding="utf-8")

    def check(self, data):
        return validate(data, self.game, self.design)

    def test_blueprint_matches_current_game_contract(self):
        result = self.check(self.data)
        self.assertGreater(result["walkable"], result["front_chamber"])
        print("WBW-2 layout:", result)

    def test_validation_does_not_mutate_input(self):
        before = deepcopy(self.data)
        self.check(self.data)
        self.assertEqual(self.data, before)

    def test_both_entries_reach_every_walkable_tile_with_lessons(self):
        m = self.data["map"]
        all_tiles = reachable(m["rows"], self.game["TILES"], m["start"][:2])
        for y, row in enumerate(m["rows"]):
            for x, glyph in enumerate(row):
                if glyph in m["exits"]:
                    self.assertEqual(reachable(m["rows"], self.game["TILES"], (x, y)), all_tiles)

    def test_all_four_field_key_combinations(self):
        m = self.data["map"]
        gates = {g["key"]: g for g in self.data["gates"]}
        for learned in (set(), {"field:stone"}, {"field:grove"}, FIELD_KEYS):
            blocked = {tuple(g["at"]) for k, g in gates.items() if k not in learned}
            seen = reachable(m["rows"], self.game["TILES"], m["start"][:2], blocked)
            for key, gate in gates.items():
                self.assertEqual(tuple(gate["beyond"]) in seen, key in learned)

    def test_planned_ids_do_not_include_story_encounters(self):
        ids = planned_route_ids(self.design)
        self.assertIn("rootwater", ids)
        self.assertNotIn("elder", ids)
        self.assertNotIn("sq-isolde-path", ids)

    def test_unique_species_rejected_even_if_country_table_is_changed(self):
        game = deepcopy(self.game)
        game["SPECIES"]["pebblepaw"]["unique"] = 1
        with self.assertRaisesRegex(ValueError, "unique guardians"):
            validate(self.data, game, self.design)

    def test_biome_level_drift_is_rejected(self):
        for levels in ([1, 12], [2, 13], [12, 2]):
            game = deepcopy(self.game)
            game["BIOMES"]["thornwood"]["lv"] = levels
            with self.assertRaisesRegex(ValueError, "level band"):
                validate(self.data, game, self.design)

    def test_null_landings_require_the_planned_marker(self):
        for original in self.data["map"]["exits"].values():
            validate_exit_landing(original)
            without_marker = {k: v for k, v in original.items() if k != "landing"}
            with self.assertRaisesRegex(ValueError, "integer x/y"):
                validate_exit_landing(without_marker)
            for marker in (None, False, "", "resolved"):
                broken = {**original, "landing": marker}
                with self.assertRaises(ValueError):
                    validate_exit_landing(broken)
            for key, value in (("x", 1), ("y", 1), ("dir", "up")):
                with self.assertRaises(ValueError):
                    validate_exit_landing({**original, key: value})

    def test_other_exits_require_integer_coordinates_and_arrival_direction(self):
        resolved = {"to": "thornwood_grove", "x": 1, "y": 8, "dir": "right"}
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
        for exit_record in self.data["map"]["exits"].values():
            with self.assertRaisesRegex(ValueError, "resolved before runtime"):
                validate_exit_landing(exit_record, runtime=True)
        resolved = deepcopy(self.data)
        for exit_record in resolved["map"]["exits"].values():
            del exit_record["landing"]
            exit_record.update(x=1, y=8, dir="right")
        with self.assertRaisesRegex(ValueError, "map does not exist"):
            validate_runtime_landings(resolved, self.game)
        fixture = deepcopy(self.game)
        fixture["MAPS"]["rootwater"] = {"rows": ["###", "#.#", "###"]}
        resolved["map"]["exits"]["S"].update(x=1, y=1)
        validate_runtime_landings(resolved, fixture)
        for exits in ({}, {"E": resolved["map"]["exits"]["E"]},
                      {"S": resolved["map"]["exits"]["E"], "E": resolved["map"]["exits"]["E"]}):
            broken = deepcopy(resolved)
            broken["map"]["exits"] = exits
            with self.assertRaises(ValueError):
                validate_runtime_landings(broken, fixture)
        for x, y in ((0, 0), (3, 1), (1, 3), (-1, 1)):
            broken = deepcopy(resolved)
            broken["map"]["exits"]["S"].update(x=x, y=y)
            with self.assertRaises(ValueError):
                validate_runtime_landings(broken, fixture)
        fixture["MAPS"]["rootwater"]["rows"][1] = "#S#"
        with self.assertRaisesRegex(ValueError, "immediately exit"):
            validate_runtime_landings(resolved, fixture)

    def test_malformed_data_is_rejected(self):
        cases = []
        def changed(label, path, value):
            data = deepcopy(self.data)
            owner = data
            for part in path[:-1]:
                owner = owner[part]
            owner[path[-1]] = value
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
        changes = [
            (["id"], "answering"), (["map", "biome"], "hollowecho"),
            (["map", "rows"], []), (["map", "rows", 0], "#"),
            (["map", "rows", 0], None), (["map", "rows", 0], "?" * 29),
            (["map", "rows", 0], "#." + "#" * 27),
            (["map", "start"], [4, 16]), (["map", "start"], [True, 16, "up"]),
            (["map", "start"], [-1, 16, "up"]), (["map", "start"], [29, 16, "up"]),
            (["map", "start"], [0, 0, "up"]), (["map", "start"], [4, 18, "up"]),
            (["map", "start"], [4, 16, []]),
            (["map", "exits", "S", "to"], "made_up"),
            (["map", "exits", "S", "to"], "elder"),
            (["map", "exits", "S", "to"], []),
            (["map", "exits", "S", "x"], 1),
            (["map", "exits", "S", "landing"], "unknown"),
            (["map", "exits", "E", "dir"], "down"),
            (["map", "signs"], {"4,4": "Invented lore"}),
            (["map", "items"], [{"id": "unapproved", "give": {"coins": 1}}]),
            (["map", "wild"], []), (["map", "wild", 0], ["pebblepaw"]),
            (["map", "wild", 0, 0], "elderhorn"), (["map", "wild", 0, 0], "cindercub"),
            (["map", "wild", 0, 0], []),
            (["map", "wild", 0, 1], 0), (["map", "wild", 0, 1], -2),
            (["map", "wild", 0, 1], True), (["map", "wild", 0, 1], 1.5),
            (["map", "wild", 0, 1], "22"),
            (["gates"], []), (["gates", 0], None),
            (["gates", 0, "key"], "field:tide"), (["gates", 0, "key"], []),
            (["gates", 0, "at"], [0, 0]), (["gates", 0, "at"], [4, 16]),
            (["gates", 0, "at"], [4, 18]), (["gates", 0, "at"], [4, 14]),
            (["gates", 0, "at"], [13.0, 13]),
            (["gates", 0, "beyond"], [4, 14]),
            (["gates", 0, "beyond"], [13, 13]),
            (["layout", "mouth_px"], [32, 32]), (["layout", "mouth_px"], [48, 48]),
            (["layout", "ceiling_px"], 48), (["layout", "mounts_allowed"], True),
            (["layout", "mounts_allowed"], 0),
            (["integration", "status"], "ready"), (["integration", "destinations"], ["rootwater"]),
            (["integration", "incoming_requirements"], {}),
        ]
        for path, value in changes:
            changed(str(path), path, value)
        changed("duplicate gate", ["gates", 1], self.data["gates"][0])
        changed("duplicate species", ["map", "wild", 1], self.data["map"]["wild"][0])
        for label, data in cases:
            with self.subTest(label=label), self.assertRaises(ValueError):
                self.check(data)
        print(f"WBW-2 malformed fixtures: {len(cases)} rejected.")

    def test_strict_json_rejects_duplicate_keys_and_nonfinite_numbers(self):
        for text in ('{"id":1,"id":2}', '{"map":{"rows":[],"rows":[]}}',
                     '{"x":NaN}', '{"x":Infinity}', '{"x":-Infinity}',
                     '{"x":1e309}', '{"x":-1e309}'):
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
