"""Validate the WBW-9 planning blueprint for Larkburrow (cave 5, the Home Burrow); this does not load a game map.

Run from the repository root: python3 -m unittest tools/test_wildbond_world_larkburrow.py
Standalone, like the WBW-2, WBW-4 and WBW-6 tests: it reads the game's data, the design, gates.json, errands.json and
world-graph.json and changes nothing. The two destination landings stay explicitly unresolved until the map owner places them.
"""

from collections import deque
from copy import deepcopy
from itertools import chain, combinations
import json
import math
from pathlib import Path
import re
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
BLUEPRINT = ROOT / "docs/plans/wildbond-world/larkburrow.json"
GAME = ROOT / "wildbond-godot/data/wildbond.json"
DESIGN = ROOT / "docs/plans/wildbond-world-design.md"
GATES = ROOT / "docs/plans/wildbond-world/gates.json"
GRAPH = ROOT / "docs/plans/wildbond-world/world-graph.json"
ERRANDS = ROOT / "docs/plans/wildbond-world/errands.json"
DIRECTIONS = {"up", "down", "left", "right"}
ENVELOPE = {"id", "map", "gates", "zones", "markers", "layout", "integration"}
MAP_KEYS = {"name", "biome", "start", "rows", "exits", "signs", "items", "wild"}
GATE_KEYS = {"id", "gate", "kind", "key", "at", "beyond"}
# The two requirements of the far door, in the order the design lists them: Stone Break and the Loom Badge.
REQUIREMENTS = [("far-door-stone", "larkburrow--sunthread:field:stone", "field", "field:stone"),
                ("far-door-loom", "larkburrow--sunthread:loom", "badge", "loom")]
EXIT_TARGETS = {"W": "millgrass", "E": "sunthread"}  # Millgrass Lane, and the back of Threadmeet (map id sunthread)
LINK_IDS = {"W": "millgrass--larkburrow", "E": "larkburrow--sunthread"}
ZONES = [("first-room", "open"), ("through-path", "late")]
BIRD_QUEST = "sq-nora-bird"
MOUTH_TILES = 3  # 48px at 16px a tile, both mouths, and the ceiling is 48px too


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
    """Pre-wiring gate: no planned marker, and every landing exists, is passable and does not exit again.

    Millgrass Lane is only a planned map, so it fails this gate until the map owner builds it. The current planning file must fail.
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


def link_open(link, fields, badges):
    """A world-graph link is open when every gate on it is a held field lesson or a held badge."""
    for gate in link["gate"]:
        if "field" in gate:
            if gate["field"] not in fields:
                return False
        elif "badge" in gate:
            if gate["badge"] not in badges:
                return False
        else:
            return False
    return True


def connected(graph, fields, badges, a, b, skip=None):
    """Whether place a reaches place b over open links of the world graph, optionally without one link."""
    adjacency = {}
    for link in graph["links"]:
        if link["id"] == skip or not link_open(link, fields, badges):
            continue
        adjacency.setdefault(link["a"], []).append(link["b"])
        if not link.get("oneWay"):
            adjacency.setdefault(link["b"], []).append(link["a"])
    seen, queue = {a}, deque([a])
    while queue:
        here = queue.popleft()
        for there in adjacency.get(here, []):
            if there not in seen:
                seen.add(there)
                queue.append(there)
    return b in seen


def home_burrow_closed(graph, fields, badges):
    """The Home Burrow loop is closed when Larkburrow is passable and Millgrass reaches Threadmeet through it
    and also reaches it again without it, so the burrow sits on a cycle."""
    link = next(l for l in graph["links"] if l["id"] == "larkburrow--sunthread")
    through = (connected(graph, fields, badges, "millgrass", "larkburrow")
               and link_open(link, fields, badges)
               and connected(graph, fields, badges, "larkburrow", "sunthread"))
    around = connected(graph, fields, badges, "millgrass", "sunthread", skip="larkburrow--sunthread")
    return through and around


def validate(data, game=None, design=None, gates=None, graph=None, errands=None):
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
    exact_keys(data, ENVELOPE, "blueprint")
    require(data["id"] == "larkburrow", "id must be larkburrow")
    m = data["map"]
    exact_keys(m, MAP_KEYS, "map")
    require(m["name"] == "Larkburrow" and m["biome"] == "thornwood", "map identity drift")
    # The design gives Larkburrow no wild table: the wooden bird is a prop and the burrow is a road.
    require(m["wild"] == [], "Larkburrow has no wild table; the wooden bird is a prop")
    require(m["signs"] == {} and m["items"] == [], "the design places no sign or pickup in Larkburrow")
    rows = m["rows"]
    require(isinstance(rows, list) and len(rows) >= 3, "rows must be a nonempty rectangular grid")
    require(all(isinstance(row, str) and row for row in rows), "rows must be nonempty strings")
    width, height = len(rows[0]), len(rows)
    require(width >= 3 and all(len(row) == width for row in rows), "rows must be rectangular")
    tiles = game["TILES"]
    require(all(ch in tiles for row in rows for ch in row), "unknown TILES glyph")
    require(not any(ch == '"' or tiles[ch].get("tall", 0) for row in rows for ch in row), "no encounter patch: there is no wild table")
    start = m["start"]
    require(isinstance(start, list) and len(start) == 3, "start must be [x, y, direction]")
    origin = coordinate(start[:2], width, height, "start")
    require(isinstance(start[2], str) and start[2] in DIRECTIONS, "invalid start direction")
    walkable = {(x, y) for y, row in enumerate(rows) for x, ch in enumerate(row) if not tiles[ch].get("solid", 0)}
    require(origin in walkable and not tiles[rows[origin[1]][origin[0]]].get("exit", 0),
            "start must be a walkable non-exit tile")

    # Exits: Millgrass Lane on the west edge and the back of Threadmeet on the east edge; landings are not invented.
    exact_keys(m["exits"], set(EXIT_TARGETS), "exits")
    valid_targets = set(game["MAPS"]) | planned_route_ids(design)
    graph_ids = {p["id"] for p in graph["places"]}
    links = {l["id"]: l for l in graph["links"]}
    for glyph, exit_record in m["exits"].items():
        validate_exit_landing(exit_record)
        target = exit_record["to"]
        require(target in valid_targets and target in graph_ids, "unknown exit destination")
        require(target == EXIT_TARGETS[glyph], "exits go only to millgrass and sunthread (the back of Threadmeet)")
        require(exit_record.get("landing") == "planned", "both landings must be marked planned")
        link = links[LINK_IDS[glyph]]
        require({link["a"], link["b"]} == {"larkburrow", target}, "an exit must match a world-graph link of Larkburrow")
    actual_exits = {ch for row in rows for ch in row if tiles[ch].get("exit", 0)}
    require(actual_exits == set(m["exits"]), "exit glyph and exit record mismatch")
    exit_points = {(x, y) for x, y in walkable if rows[y][x] in actual_exits}
    for x, y in exit_points:
        require((rows[y][x] == "W" and x == 0) or (rows[y][x] == "E" and x == width - 1), "exit must be on its matching edge")
    mouths = {}
    for glyph in EXIT_TARGETS:
        column = sorted(y for x, y in exit_points if rows[y][x] == glyph)
        require(len(column) == MOUTH_TILES and column == list(range(column[0], column[0] + MOUTH_TILES)),
                "each mouth must be exactly three adjacent exit tiles, 48px")
        mouths[glyph] = column
    for glyph, column in mouths.items():
        edge = 0 if glyph == "W" else width - 1
        inner = 1 if glyph == "W" else width - 2
        require(all((inner, y) in walkable and (inner, y) not in exit_points for y in column),
                "the floor inside a mouth must be open and three tiles wide")
        require((edge, column[0] - 1) not in walkable and (edge, column[-1] + 1) not in walkable, "a mouth is not wider than 48px")

    # Gates: one record per requirement of the far door. Both guard the same tiles, so the door needs both together.
    records = data["gates"]
    require(isinstance(records, list) and len(records) == 2, "the far door has exactly two requirement records")
    sheet = {g["id"]: g for g in gates["gates"] if g["place"] == "larkburrow--sunthread"}
    require(set(sheet) == {r[1] for r in REQUIREMENTS}, "gates.json no longer lists exactly Stone Break and the Loom Badge here")
    door_tiles, beyond_set = None, None
    for gate, (record_id, sheet_id, kind, key) in zip(records, REQUIREMENTS):
        exact_keys(gate, GATE_KEYS, "gate")
        require(gate["id"] == record_id and gate["gate"] == sheet_id, "gate id drift")
        require(gate["kind"] == kind and gate["key"] == key, "gate kind or key drift")
        row = sheet[sheet_id]
        require(row["door"] == "larkburrow--sunthread" and row["kind"] == kind, "gate differs from gates.json")
        require(row["key"] == key, "gate key differs from gates.json for " + sheet_id)
        at = gate["at"]
        require(isinstance(at, list) and len(at) == MOUTH_TILES, "the stone door is as wide as the passage: three tiles")
        tiles_here = {coordinate(t, width, height, gate["id"]) for t in at}
        require(len(tiles_here) == len(at), "duplicate overlay tile in a gate")
        beyond = coordinate(gate["beyond"], width, height, gate["id"] + " beyond")
        require(tiles_here <= walkable and beyond in walkable, "gate tiles and the witness must be walkable")
        require(not (tiles_here & exit_points) and origin not in tiles_here and beyond not in tiles_here,
                "invalid gate location")
        if door_tiles is None:
            door_tiles, beyond_set = tiles_here, beyond
        require(tiles_here == door_tiles and beyond == beyond_set, "both requirements guard the same door, so they share tiles and witness")
    door = door_tiles
    require(len({x for x, _ in door}) == 1, "the stone door is one column")

    # Closed door: the first room, its bird and the Millgrass mouth are reachable with nothing; the far side is not.
    full = reachable(rows, tiles, origin)
    require(full == walkable, "unreachable walkable tile")
    shut = reachable(rows, tiles, origin, door)
    require(set(mouths_tiles(rows, mouths, "W")) <= shut, "an unprepared visitor cannot walk back out to Millgrass Lane")
    require(not (set(mouths_tiles(rows, mouths, "E")) & shut), "the Threadmeet mouth must be unreachable with the door shut")
    require(beyond_set not in shut and beyond_set in full, "the far door can be bypassed or never opens")
    require(any(p in shut for t in door for p in ((t[0] - 1, t[1]), (t[0] + 1, t[1]))), "the stone door must be approachable from the first room")
    # The far side is closed from the Threadmeet side too: from the east mouth, the first room is not reachable with the door shut.
    east_start = (width - 2, mouths["E"][1])
    from_east = reachable(rows, tiles, east_start, door)
    require(not (from_east & shut), "the two halves of the burrow must be separate while the door is shut")

    # Zones are overlays, never new tiles. They split every non-exit, non-door walkable tile into two.
    zones = data["zones"]
    require(isinstance(zones, list) and [(z.get("id"), z.get("kind")) for z in zones if isinstance(z, dict)] == ZONES and len(zones) == 2,
            "zones must be exactly first-room and through-path, in that order")
    zone_tiles = {}
    for zone in zones:
        exact_keys(zone, {"id", "kind", "rects"}, "zone")
        # A rect is a bounding box; only its floor counts, so a pillar inside it stays rock.
        zone_tiles[zone["id"]] = rect_tiles(zone["rects"], width, height, zone["id"]) & walkable
    first, late = zone_tiles["first-room"], zone_tiles["through-path"]
    require(not (first & late) and not ((first | late) & door) and not ((first | late) & exit_points), "zones overlap each other, the door or a mouth")
    require((first | late | door | exit_points) == walkable, "zones must cover the walkable floor")
    require(first == shut - exit_points and origin in first, "the first room is exactly what opens with nothing")
    require(late == full - shut - door - exit_points, "the through-path is exactly what the far door shuts off")

    # Marker: the wooden bird is a prop in the first room and needs no key and no badge.
    markers = data["markers"]
    require(isinstance(markers, list) and len(markers) == 1, "exactly one marker: Nora's wooden bird")
    bird = markers[0]
    exact_keys(bird, {"id", "kind", "quest", "object", "at"}, "bird marker")
    require(bird["id"] == "wooden-bird" and bird["kind"] == "prop" and bird["quest"] == BIRD_QUEST and bird["object"] == "wooden bird",
            "the wooden bird is a prop for sq-nora-bird")
    bird_at = coordinate(bird["at"], width, height, "bird")
    require(bird_at in walkable and bird_at not in door and bird_at not in exit_points and bird_at != origin,
            "the bird must stand on its own open tile")
    require(bird_at in shut and bird_at in first, "the bird is in the first room and needs no field lesson and no badge")
    # The errand is the one in errands.json: its recover step is in Larkburrow and takes no badge, field or story requirement.
    errand = next((e for e in errands["errands"] if e["id"] == BIRD_QUEST), None)
    require(errand is not None, "errands.json no longer lists sq-nora-bird")
    recover = [s for s in errand["steps"] if s["kind"] == "recover"]
    require(len(recover) == 1 and recover[0]["locations"] == [{"map": "larkburrow"}] and recover[0]["object"] == bird["object"],
            "the errand's recover step must be the wooden bird in larkburrow")
    needs = recover[0]["requires"]
    require(needs["badges"] == [] and needs["fields"] == [] and needs["story"] == [], "recovering the bird needs no badge, field lesson or story key")
    require(BIRD_QUEST in design and "Nora's wooden bird" in design, "the design no longer names the wooden bird")

    # A mount (a 2 by 2 body) walks mouth to mouth only with the door open; with it shut it stops at the door.
    layout = data["layout"]
    exact_keys(layout, {"mouth_px", "ceiling_px", "mounts_allowed", "mouths"}, "layout")
    require(layout["mouth_px"] == [48, 48] and all(type(v) is int for v in layout["mouth_px"]), "both mouths are 48 by 48px")
    require(type(layout["ceiling_px"]) is int and layout["ceiling_px"] == 48, "ceiling must be 48px")
    require(layout["mounts_allowed"] is True, "mounts may enter Larkburrow")
    require(layout["mouths"] == {"W": [0, mouths["W"][0]], "E": [width - 1, mouths["E"][0]]}, "mouth positions drift from the rows")
    west_body = (1, mouths["W"][0])
    east_body = (width - 3, mouths["E"][0])
    require(east_body in body_reachable(rows, tiles, west_body, 2), "a 2 by 2 mount cannot walk from the Millgrass mouth to the Threadmeet mouth")
    require(east_body not in body_reachable(rows, tiles, west_body, 2, door), "a mount got past the shut door")
    require(bird_at in reachable(rows, tiles, origin, door), "a person on foot reaches the bird with the door shut")

    # The graph and the design.
    place = next(p for p in graph["places"] if p["id"] == "larkburrow")
    require(place["kind"] == "cave" and place["phase"] == 6, "world graph: Larkburrow is a late (phase 6) cave")
    integration = data["integration"]
    exact_keys(integration, {"status", "destinations", "visible_from_phase", "opens_phase", "incoming_requirements"}, "integration")
    require(integration["status"] == "unresolved_landings", "landing status must remain explicit")
    require(integration["destinations"] == ["millgrass", "sunthread"], "both destination landings must be listed as unresolved")
    require(integration["visible_from_phase"] == 1 and integration["opens_phase"] == place["phase"],
            "the mouth is visible in phase 1 and opens with the late cave phase")
    west_link, east_link = links["millgrass--larkburrow"], links["larkburrow--sunthread"]
    require(west_link["gate"] == [] and west_link["phase"] == 6, "the first room opens to anyone on Millgrass Lane in phase 6")
    require(east_link["gate"] == [{"field": "stone"}, {"badge": "loom"}] and east_link["phase"] == 6,
            "the through-path is gated by Stone Break and the Loom Badge together")
    require(integration["incoming_requirements"] == {"millgrass": {}, "sunthread": {"fields": ["field:stone"], "badges": ["loom"]}},
            "incoming requirements must be Stone Break and the Loom Badge at Threadmeet, none at Millgrass")
    require("visible in phase 1" in design and "Stone Break and the Loom Badge" in design, "design wording changed; recheck section 2")
    return {"width": width, "height": height, "walkable": len(walkable), "first_room": len(first), "through_path": len(late),
            "door_tiles": len(door), "gates": len(records), "markers": len(markers)}


def mouths_tiles(rows, mouths, glyph):
    x = 0 if glyph == "W" else len(rows[0]) - 1
    return [(x, y) for y in mouths[glyph]]


def powerset(items):
    items = list(items)
    return chain.from_iterable(combinations(items, n) for n in range(len(items) + 1))


class LarkburrowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = load_json(BLUEPRINT.read_text(encoding="utf-8"))
        cls.game = load_json(GAME.read_text(encoding="utf-8"))
        cls.design = DESIGN.read_text(encoding="utf-8")
        cls.gates = load_json(GATES.read_text(encoding="utf-8"))
        cls.graph = load_json(GRAPH.read_text(encoding="utf-8"))
        cls.errands = load_json(ERRANDS.read_text(encoding="utf-8"))

    def check(self, data, **kw):
        args = {"game": self.game, "design": self.design, "gates": self.gates, "graph": self.graph, "errands": self.errands}
        args.update(kw)
        return validate(data, **args)

    def open_tiles(self, held):
        """Tiles reachable from the start when only the requirements in `held` are met. The door opens only if both are."""
        m = self.data["map"]
        door = {tuple(t) for t in self.data["gates"][0]["at"]}
        closed = set() if {"field:stone", "loom"} <= set(held) else door
        return reachable(m["rows"], self.game["TILES"], m["start"][:2], closed)

    def test_blueprint_matches_current_game_contract(self):
        result = self.check(self.data)
        self.assertGreater(result["through_path"], 0)
        print("WBW-9 layout:", result)

    def test_validation_does_not_mutate_input(self):
        before = deepcopy(self.data)
        self.check(self.data)
        self.assertEqual(before, self.data)

    def test_the_far_door_opens_only_when_both_requirements_are_held(self):
        east = tuple(self.data["gates"][0]["beyond"])
        exits = {(x, y) for y, row in enumerate(self.data["map"]["rows"]) for x, ch in enumerate(row) if ch == "E"}
        report = {}
        for held in powerset(["field:stone", "loom"]):
            tiles = self.open_tiles(held)
            report[held] = east in tiles
            self.assertEqual(east in tiles, set(held) == {"field:stone", "loom"}, held)
            self.assertEqual(bool(exits & tiles), set(held) == {"field:stone", "loom"}, held)
        print("WBW-9 map, far side reachable by what is held:", {"+".join(k) or "nothing": v for k, v in report.items()})

    def test_the_bird_and_the_millgrass_mouth_need_nothing(self):
        nothing = self.open_tiles(())
        bird = tuple(self.data["markers"][0]["at"])
        self.assertIn(bird, nothing)
        west = {(0, y) for y in range(len(self.data["map"]["rows"])) if self.data["map"]["rows"][y][0] == "W"}
        self.assertTrue(west <= nothing)

    def test_the_home_burrow_loop_is_closed_only_when_both_requirements_are_present(self):
        # Every other lesson and badge is held, so the only open question is Stone Break and the Loom Badge.
        every_field = {g["field"] for l in self.graph["links"] for g in l["gate"] if "field" in g}
        every_badge = {g["badge"] for l in self.graph["links"] for g in l["gate"] if "badge" in g}
        self.assertTrue({"stone"} <= every_field and {"loom"} <= every_badge)
        report = {}
        for held in powerset(["stone", "loom"]):
            fields = every_field - {"stone"} | ({"stone"} & set(held))
            badges = every_badge - {"loom"} | ({"loom"} & set(held))
            report[held] = home_burrow_closed(self.graph, fields, badges)
            self.assertEqual(report[held], set(held) == {"stone", "loom"}, held)
            link = next(l for l in self.graph["links"] if l["id"] == "larkburrow--sunthread")
            self.assertEqual(link_open(link, fields, badges), set(held) == {"stone", "loom"}, held)
        self.assertEqual([k for k, v in report.items() if v], [("stone", "loom")])
        # Larkburrow is reachable, and the first room is open, with Stone Break and the Loom Badge both missing.
        fields, badges = every_field - {"stone"}, every_badge - {"loom"}
        self.assertTrue(connected(self.graph, fields, badges, "millgrass", "larkburrow"))
        self.assertFalse(home_burrow_closed(self.graph, fields, badges))
        self.assertTrue(connected(self.graph, set(), set(), "millgrass", "larkburrow"))
        print("WBW-9 graph, Home Burrow loop closed when these are held:", {"+".join(k) or "neither": v for k, v in report.items()})

    def test_the_bird_errand_is_the_one_errands_json_lists(self):
        errand = next(e for e in self.errands["errands"] if e["id"] == "sq-nora-bird")
        self.assertEqual(errand["town"]["map"], "larkhaven")
        changed = deepcopy(self.errands)
        for e in changed["errands"]:
            if e["id"] == "sq-nora-bird":
                e["steps"][1]["locations"] = [{"map": "thornwood"}]
        with self.assertRaises(ValueError):
            self.check(self.data, errands=changed)
        gated = deepcopy(self.errands)
        for e in gated["errands"]:
            if e["id"] == "sq-nora-bird":
                e["steps"][1]["requires"]["badges"] = ["loom"]
        with self.assertRaises(ValueError):
            self.check(self.data, errands=gated)

    def test_gate_records_are_the_ones_gates_json_lists(self):
        sheet = {g["id"]: (g["kind"], g["key"], g["door"]) for g in self.gates["gates"] if g["place"] == "larkburrow--sunthread"}
        self.assertEqual(sheet, {"larkburrow--sunthread:field:stone": ("field", "field:stone", "larkburrow--sunthread"),
                                 "larkburrow--sunthread:loom": ("badge", "loom", "larkburrow--sunthread")})
        removed = deepcopy(self.gates)
        removed["gates"] = [g for g in removed["gates"] if g["id"] != "larkburrow--sunthread:loom"]
        with self.assertRaises(ValueError):
            self.check(self.data, gates=removed)
        changed = deepcopy(self.gates)
        for g in changed["gates"]:
            if g["id"] == "larkburrow--sunthread:field:stone":
                g["key"] = "field:glide"
        with self.assertRaises(ValueError):
            self.check(self.data, gates=changed)

    def test_a_graph_that_drops_a_requirement_is_rejected(self):
        for drop in ({"field": "stone"}, {"badge": "loom"}):
            graph = deepcopy(self.graph)
            for link in graph["links"]:
                if link["id"] == "larkburrow--sunthread":
                    link["gate"] = [g for g in link["gate"] if g != drop]
            with self.subTest(drop=drop), self.assertRaises(ValueError):
                self.check(self.data, graph=graph)
        graph = deepcopy(self.graph)
        for link in graph["links"]:
            if link["id"] == "millgrass--larkburrow":
                link["gate"] = [{"field": "stone"}]
        with self.assertRaises(ValueError):
            self.check(self.data, graph=graph)

    def test_a_mount_walks_mouth_to_mouth_only_with_the_door_open(self):
        m = self.data["map"]
        rows, tiles = m["rows"], self.game["TILES"]
        door = {tuple(t) for t in self.data["gates"][0]["at"]}
        west, east = (1, 4), (len(rows[0]) - 3, 4)
        self.assertIn(east, body_reachable(rows, tiles, west, 2))
        self.assertNotIn(east, body_reachable(rows, tiles, west, 2, door))
        # A three-tile-tall body is not what the design promises; the mouths are 48px so a 2 by 2 mount is the contract.
        self.assertEqual(self.data["layout"]["mouth_px"], [48, 48])

    def test_planned_ids_include_millgrass_and_not_story_encounters(self):
        ids = planned_route_ids(self.design)
        self.assertIn("millgrass", ids)
        self.assertNotIn("larkburrow", ids)
        self.assertIn("sunthread", self.game["MAPS"])

    def test_biome_drift_is_rejected(self):
        changed = deepcopy(self.game)
        changed["MAPS"]["larkhaven"]["pal"] = "saltmarsh"
        self.assertIn("thornwood", changed["BIOMES"])
        # The biome only names the country; it adds no wild table and no level band.
        self.assertEqual(self.data["map"]["wild"], [])
        data = deepcopy(self.data)
        data["map"]["biome"] = "hollowecho"
        with self.assertRaises(ValueError):
            self.check(data)

    def test_a_tile_that_stops_being_walkable_in_the_game_is_caught(self):
        changed = deepcopy(self.game)
        changed["TILES"]["."] = {"solid": 1}
        with self.assertRaises(ValueError):
            self.check(self.data, game=changed)

    def test_null_landings_require_the_planned_marker(self):
        for glyph in ("W", "E"):
            data = deepcopy(self.data)
            del data["map"]["exits"][glyph]["landing"]
            with self.subTest(glyph=glyph, case="no marker"), self.assertRaises(ValueError):
                self.check(data)
            data = deepcopy(self.data)
            data["map"]["exits"][glyph].update(x=3, y=None)
            with self.subTest(glyph=glyph, case="half-null"), self.assertRaises(ValueError):
                self.check(data)

    def test_other_exits_require_integer_coordinates_and_arrival_direction(self):
        for glyph, to in (("W", "millgrass"), ("E", "sunthread")):
            for record in ({"to": to, "x": 1, "y": 1}, {"to": to, "x": 1, "y": 1, "dir": "sideways"},
                           {"to": to, "x": 1.5, "y": 1, "dir": "up"}, {"to": to, "x": -1, "y": 1, "dir": "up"}):
                data = deepcopy(self.data)
                data["map"]["exits"][glyph] = record
                with self.subTest(glyph=glyph, record=record), self.assertRaises(ValueError):
                    self.check(data)
        # A fully resolved record is a valid shape; only the planned marker is required while the landing is unknown.
        resolved = {"to": "millgrass", "x": 3, "y": 4, "dir": "left"}
        validate_exit_landing(resolved)

    def test_runtime_wiring_rejects_unresolved_or_unsafe_landings(self):
        with self.assertRaises(ValueError) as caught:
            validate_runtime_landings(self.data, self.game)
        self.assertIn("planned landing must be resolved before runtime wiring", str(caught.exception))
        # Millgrass Lane is only a planned map; a landing there cannot be checked until it exists. The back of Threadmeet can.
        resolved = deepcopy(self.data)
        rows = self.game["MAPS"]["sunthread"]["rows"]
        spot = next((x, y) for y, row in enumerate(rows) for x, ch in enumerate(row)
                    if not self.game["TILES"][ch].get("solid", 0) and not self.game["TILES"][ch].get("exit", 0))
        resolved["map"]["exits"]["E"] = {"to": "sunthread", "x": spot[0], "y": spot[1], "dir": "up"}
        with self.assertRaises(ValueError) as caught:
            validate_runtime_landings(resolved, self.game)
        self.assertIn("planned landing", str(caught.exception))  # the west exit is still planned
        unsafe = deepcopy(resolved)
        for glyph, to in (("W", "sunthread"),):
            unsafe["map"]["exits"][glyph] = {"to": to, "x": 0, "y": 0, "dir": "up"}
        with self.assertRaises(ValueError):
            validate_runtime_landings(unsafe, self.game)

    def test_malformed_data_is_rejected(self):
        cases = []
        h = len(self.data["map"]["rows"])

        def changed(label, path, value):
            data = deepcopy(self.data)
            owner = data
            for part in path[:-1]:
                owner = owner[part]
            owner[path[-1]] = value
            cases.append((label, data))

        def rows_edit(label, *edits):
            data = deepcopy(self.data)
            for (yy, xx, cc) in edits:
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
        for label, path, value in [
            ("id", ["id"], "knothollow"), ("name", ["map", "name"], "Larkhaven Burrow"), ("biome", ["map", "biome"], "hollowecho"),
            ("no rows", ["map", "rows"], []), ("short row", ["map", "rows", 0], "#"), ("null row", ["map", "rows", 0], None),
            ("unknown glyph", ["map", "rows", 0], "?" * 28), ("wrong width", ["map", "rows", 0], "#" * 27),
            ("start short", ["map", "start"], [2, 5]), ("start bool", ["map", "start"], [True, 5, "right"]),
            ("start negative", ["map", "start"], [-1, 5, "right"]), ("start outside", ["map", "start"], [28, 5, "right"]),
            ("start in rock", ["map", "start"], [0, 0, "right"]), ("start on exit", ["map", "start"], [0, 5, "right"]),
            ("start bad dir", ["map", "start"], [2, 5, []]),
            ("exit target", ["map", "exits", "W", "to"], "made_up"), ("swapped targets", ["map", "exits", "W", "to"], "sunthread"),
            ("exit to the old name", ["map", "exits", "E", "to"], "threadmeet"), ("exit to another cave", ["map", "exits", "E", "to"], "kilnvent"),
            ("exit target type", ["map", "exits", "W", "to"], []), ("exit x", ["map", "exits", "W", "x"], 1),
            ("exit marker", ["map", "exits", "W", "landing"], "unknown"), ("exit dir", ["map", "exits", "E", "dir"], "down"),
            ("exit null", ["map", "exits", "E"], None),
            ("sign", ["map", "signs"], {"4,4": "Invented lore"}),
            ("pickup", ["map", "items"], [{"id": "unapproved", "give": {"coins": 1}}]),
            ("wild table", ["map", "wild"], [["glimmerwing", 22]]), ("wild null", ["map", "wild"], None),
            ("no gates", ["gates"], []), ("one gate only", ["gates"], None), ("gate null", ["gates", 0], None),
            ("gate key", ["gates", 0, "key"], "field:tide"), ("gate key type", ["gates", 0, "key"], []),
            ("gate kind", ["gates", 1, "kind"], "field"), ("gate id", ["gates", 0, "id"], "far-door-loom"),
            ("gate sheet id", ["gates", 0, "gate"], "larkburrow--sunthread:field:hush"),
            ("loom key", ["gates", 1, "key"], "thorn"), ("gate at empty", ["gates", 0, "at"], []),
            ("gate at rock", ["gates", 0, "at"], [[0, 0], [1, 0], [2, 0]]), ("gate at float", ["gates", 0, "at"], [[14.0, 4], [14, 5], [14, 6]]),
            ("gate at dup", ["gates", 0, "at"], [[14, 4], [14, 4], [14, 6]]), ("gate at narrow", ["gates", 0, "at"], [[14, 5]]),
            ("gate at exit", ["gates", 0, "at"], [[0, 4], [0, 5], [0, 6]]),
            ("records disagree", ["gates", 1, "at"], [[13, 4], [13, 5], [13, 6]]),
            ("witness disagree", ["gates", 1, "beyond"], [19, 5]),
            ("witness before the door", ["gates", 0, "beyond"], [8, 5]), ("witness in rock", ["gates", 0, "beyond"], [0, 0]),
            ("witness type", ["gates", 0, "beyond"], "18,5"),
            ("zone kind", ["zones", 0, "kind"], "lit"), ("zone order", ["zones"], list(reversed(self.data["zones"]))),
            ("zone gap", ["zones", 1, "rects"], [[17, 2, 8, 7]]), ("zone overlap", ["zones", 0, "rects"], [[1, 2, 10, 7], [11, 4, 6, 3]]),
            ("zone rect type", ["zones", 0, "rects"], [[1, 2, 10]]), ("zone rect bounds", ["zones", 0, "rects"], [[1, 2, 40, 7]]),
            ("zone covers the door", ["zones", 0, "rects"], [[1, 2, 10, 7], [11, 4, 4, 3]]),
            ("no marker", ["markers"], []), ("two markers", ["markers"], self.data["markers"] * 2),
            ("marker kind", ["markers", 0, "kind"], "echo-stone"), ("marker quest", ["markers", 0, "quest"], "sq-senna-stones"),
            ("marker object", ["markers", 0, "object"], "wooden duck"), ("marker id", ["markers", 0, "id"], "bird"),
            ("bird in the wall", ["markers", 0, "at"], [0, 0]), ("bird on the start", ["markers", 0, "at"], [2, 5]),
            ("bird on an exit", ["markers", 0, "at"], [0, 5]), ("bird behind the door", ["markers", 0, "at"], [18, 5]),
            ("bird on the door", ["markers", 0, "at"], [14, 5]), ("bird type", ["markers", 0, "at"], [9.5, 2]),
            ("mouth width", ["layout", "mouth_px"], [32, 48]), ("mouth height", ["layout", "mouth_px"], [48, 32]),
            ("ceiling", ["layout", "ceiling_px"], 32), ("mounts", ["layout", "mounts_allowed"], False),
            ("mouth position", ["layout", "mouths", "E"], [27, 5]), ("layout extra", ["layout", "pad"], [2, 2]),
            ("status", ["integration", "status"], "resolved"), ("destinations", ["integration", "destinations"], ["millgrass"]),
            ("visible phase", ["integration", "visible_from_phase"], 6), ("opens phase", ["integration", "opens_phase"], 3),
            ("incoming loom", ["integration", "incoming_requirements", "sunthread", "badges"], []),
            ("incoming stone", ["integration", "incoming_requirements", "sunthread", "fields"], ["field:grove"]),
            ("incoming millgrass", ["integration", "incoming_requirements", "millgrass"], {"badges": ["thorn"]}),
        ]:
            changed(label, path, value)
        rows_edit("a walled-off pocket", (8, 2, "#"), (7, 1, "#"))
        rows_edit("a pocket nobody reaches", (6, 22, "#"), (6, 21, "#"), (5, 22, "#"), (7, 22, "#"), (6, 23, "."), (5, 23, "#"), (7, 23, "#"), (6, 24, "#"))
        rows_edit("an encounter patch", (3, 3, '"'))
        rows_edit("the first room walled in", (4, 11, "#"), (5, 11, "#"), (6, 11, "#"))
        rows_edit("the door tile is rock", (5, 14, "#"))
        rows_edit("a detour around the door", (3, 13, "."), (3, 14, "."), (3, 15, "."))
        rows_edit("a fourth mouth tile", (3, 0, "W"))
        rows_edit("a mouth only two wide", (6, 0, "#"))
        rows_edit("a mouth on the wrong edge", (5, 27, "W"))
        rows_edit("an exit glyph in the middle", (3, 8, "S"))
        for label, data in cases:
            with self.subTest(label=label), self.assertRaises(ValueError):
                self.check(data)
        print(f"WBW-9 malformed fixtures: {len(cases)} rejected.")

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
