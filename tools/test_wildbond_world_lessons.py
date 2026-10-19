"""WBW-10's planning-only lesson slips, from world-design section 4.

Run: python3 -m unittest tools/test_wildbond_world_lessons.py
The game, graph, gates and existing cave plans are read-only references. Null
tiles are intentionally unplaced. No teaching, inventory or persistence code is
implemented here; the proposed keepers remain proposals.
"""

from collections import deque
from copy import deepcopy
from itertools import combinations
import json
import math
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
WORLD = ROOT / "docs/plans/wildbond-world"
DATA = WORLD / "lessons.json"
GAME = ROOT / "wildbond-godot/data/wildbond.json"
DESIGN = ROOT / "docs/plans/wildbond-world-design.md"
RULING = "https://github.com/ecbarish/generations/issues/373#issuecomment-6186013258"
# Map aliases and acquisition conditions are section 2/4's contract, not new
# obstacles. In particular, the grove-to-cave door is not the grove slip, and
# a town carving is not Solla's gift. Keelcave needs Tide Ride at its approach.
# Tuple: place, local canonical gate (if any), proposed giver, kind, key.
SOURCES = {
    "slip-standing-stone": ("knothollow", "knothollow-deep-cracks:field:stone", None, "field", "field:stone"),
    "slip-rinse": ("keelcave", None, None, "field", "field:tide"),
    "slip-grove-shelter": ("thornwood_grove", None, None, "field", "field:grove"),
    "slip-ember-mantle": ("kilnvent", "kilnvent-deep-room:field:lantern", None, "field", "field:lantern"),
    "slip-wind-lift": ("crestpath", None, None, None, None),
    "slip-mist-veil": ("answering", "answering-wall-doors:field:hush", None, "field", "field:hush"),
    "slip-bright-care": ("sunthread", None, "Solla", "field", "field:daymark"),
    "slip-helping-paw": ("thornwood", None, "Hedda", "badge", "thorn"),
}
SOURCE_KEYS = {"place", "description", "gate", "person", "requires", "tile", "layoutGate"}
UNSET = object()


def require(condition, message):
    if not condition:
        raise ValueError(message)


def exact_keys(value, keys, label):
    require(isinstance(value, dict) and set(value) == keys, f"{label}: unexpected fields")


def text(value, label):
    require(isinstance(value, str) and bool(value.strip()) and value == value.strip(),
            f"{label}: expected nonempty trimmed text")
    return value


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, f"Duplicate JSON key: {key}")
        result[key] = value
    return result


def reject_constant(value):
    raise ValueError(f"Non-finite JSON number: {value}")


def finite_float(value):
    number = float(value)
    require(math.isfinite(number), f"Non-finite JSON number: {value}")
    return number


def load_json(raw):
    return json.loads(raw, object_pairs_hook=unique_object,
                      parse_constant=reject_constant, parse_float=finite_float)


def read_json(path):
    return load_json(path.read_text(encoding="utf-8"))


def index_records(records, label):
    require(isinstance(records, list), f"{label}: expected a list")
    result = {}
    for entry in records:
        require(isinstance(entry, dict), f"{label}: expected an object")
        key = text(entry.get("id"), f"{label} id")
        require(key not in result, f"{label}: duplicate id {key}")
        result[key] = entry
    return result


def design_slips(design):
    require(isinstance(design, str), "design: expected text")
    section = re.search(r"^## 4\. Tutors and lesson slips\n(.*?)^## 5\.",
                        design, flags=re.M | re.S)
    require(section is not None, "design: section 4 missing")
    rows = []
    for line in section[1].splitlines():
        if not line.startswith("| `slip-"):
            continue
        cells = [part.strip() for part in line.strip().strip("|").split("|")]
        require(len(cells) == 4, "design: malformed slip row")
        match = re.fullmatch(r"`(slip-[a-z-]+)`", cells[0])
        require(match is not None, "design: malformed slip id")
        rows.append((match[1], cells[1], "any" if cells[2] == "Any partner" else cells[2], cells[3]))
    require([row[0] for row in rows] == list(SOURCES), "design: eight slip identities/order changed")
    return rows


def cave_sources():
    result = {}
    for path in sorted(WORLD.glob("*.json")):
        value = read_json(path)
        if isinstance(value, dict) and "id" in value and "map" in value:
            require(value["id"] == path.stem, "cave filename/id mismatch")
            result[path.stem] = value
    return result


def coordinate(value, width, height, label):
    require(isinstance(value, list) and len(value) == 2 and
            all(type(v) is int for v in value), f"{label}: expected integer [x, y]")
    x, y = value
    require(0 <= x < width and 0 <= y < height, f"{label}: out of bounds")
    return x, y


def reachable(walkable, start, blocked=()):
    """Four-neighbour planning-grid BFS, not a claim about runtime collision."""
    allowed = walkable - set(blocked)
    if start not in allowed:
        return set()
    seen, queue = {start}, deque([start])
    while queue:
        x, y = queue.popleft()
        for point in ((x-1, y), (x+1, y), (x, y-1), (x, y+1)):
            if point in allowed and point not in seen:
                seen.add(point)
                queue.append(point)
    return seen


def validate_mist_location(source, cave, tiles):
    """The hush-doors zone marks thresholds, NOT the rooms behind them.

    The north gate's existing beyond witness is the source-backed pickup tile.
    Flood-fill its component with the doors shut to identify the niche, then
    prove that both entrances need Hush and no unrelated field lesson for it.
    """
    require(isinstance(cave, dict) and cave.get("id") == "answering", "Answering cave missing")
    m = cave.get("map")
    require(isinstance(m, dict), "Answering map missing")
    rows = m.get("rows")
    require(isinstance(rows, list) and bool(rows) and
            all(isinstance(row, str) and bool(row) for row in rows), "Answering rows malformed")
    width, height = len(rows[0]), len(rows)
    require(all(len(row) == width for row in rows), "Answering rows must be rectangular")
    require(isinstance(tiles, dict), "TILES missing")
    require(all(ch in tiles and isinstance(tiles[ch], dict) for row in rows for ch in row),
            "Answering has an unknown or malformed tile")
    walkable = {(x, y) for y, row in enumerate(rows) for x, ch in enumerate(row)
                if not tiles[ch].get("solid", 0)}
    start = m.get("start")
    require(isinstance(start, list) and len(start) == 3, "Answering start malformed")
    origin = coordinate(start[:2], width, height, "Answering start")
    require(origin in walkable, "Answering start is solid")
    gates = index_records(cave.get("gates"), "Answering gates")
    north = gates.get(source["layoutGate"])
    require(isinstance(north, dict) and north.get("door") == "answering-wall-doors" and
            north.get("key") == "field:hush", "Mist Veil must use the north Hush wall-door")
    target = coordinate(source["tile"], width, height, "Mist Veil tile")
    beyond = coordinate(north.get("beyond"), width, height, "north niche witness")
    require(target == beyond, "Mist Veil must use the north niche's existing beyond tile")
    blocked_by_key, all_gates = {}, set()
    for gate in gates.values():
        key = text(gate.get("key"), "Answering gate key")
        require(key in {"field:stone", "field:lantern", "field:hush"}, "unknown Answering field key")
        at = gate.get("at")
        require(isinstance(at, list) and bool(at), "Answering gate needs tiles")
        points = [coordinate(p, width, height, "Answering gate tile") for p in at]
        require(len(set(points)) == len(points) and not (set(points) & all_gates),
                "Answering gate tiles overlap")
        require(set(points) <= walkable, "Answering gate is on a solid tile")
        all_gates.update(points)
        blocked_by_key.setdefault(key, set()).update(points)
    require(target in walkable and target not in all_gates and
            not tiles[rows[target[1]][target[0]]].get("exit", 0), "Mist Veil is not safe niche floor")
    zones = index_records(cave.get("zones"), "Answering zones")
    hush = zones.get("hush-doors")
    require(isinstance(hush, dict) and hush.get("kind") == "hush", "hush-doors zone missing")
    rects = hush.get("rects")
    require(isinstance(rects, list) and bool(rects), "hush-doors rectangles missing")
    threshold = set()
    for rect in rects:
        require(isinstance(rect, list) and len(rect) == 4 and
                all(type(v) is int for v in rect), "hush-doors rectangle malformed")
        x, y, w, h = rect
        require(w > 0 and h > 0 and x >= 0 and y >= 0 and x+w <= width and y+h <= height,
                "hush-doors rectangle out of bounds")
        threshold.update((xx, yy) for xx in range(x, x+w) for yy in range(y, y+h))
    require(threshold == blocked_by_key.get("field:hush"), "hush-doors must mark exactly Hush thresholds")
    north_points = {tuple(p) for p in north["at"]}
    require(north_points <= threshold and all(target[1] < y for _, y in north_points),
            "Mist Veil must be north of its Hush threshold")
    niche = reachable(walkable, beyond, all_gates)
    require(target in niche and origin not in niche, "north niche is not separated from the first hall")
    require(all(y < min(p[1] for p in north_points) for _, y in niche),
            "north niche leaks outside its north room")
    for marker in index_records(cave.get("markers"), "Answering markers").values():
        point = coordinate(marker.get("at"), width, height, "Answering marker")
        pad = marker.get("pad", [1, 1])
        require(isinstance(pad, list) and len(pad) == 2 and
                all(type(v) is int and v > 0 for v in pad), "Answering marker pad malformed")
        occupied = {(point[0]+i, point[1]+j) for i in range(pad[0]) for j in range(pad[1])}
        require(occupied <= walkable, "Answering marker is not on floor")
        require(not (niche & occupied), "Mist Veil's reserved north niche is not empty")
    for item in index_records(m.get("items"), "Answering pickups").values():
        point = coordinate(item.get("at"), width, height, "Answering pickup")
        require(point in walkable and point not in niche, "a pickup occupies Mist Veil's reserved niche")
    exits = m.get("exits")
    require(isinstance(exits, dict) and set(exits) == {"S", "E"}, "Answering entrances changed")
    entrances = {origin} | {(x, y) for y, row in enumerate(rows) for x, ch in enumerate(row) if ch in exits}
    require(all(any(ch == glyph for row in rows for ch in row) for glyph in exits), "Answering exit missing")
    keys = sorted(blocked_by_key)
    for count in range(len(keys)+1):
        for held in combinations(keys, count):
            blocked = set().union(*(points for key, points in blocked_by_key.items() if key not in held))
            for entrance in entrances:
                require((target in reachable(walkable, entrance, blocked)) == ("field:hush" in held),
                        "Mist Veil must need Hush, and only Hush, from every Answering entrance")
    return len(niche)


def validate(data, *, game=None, graph=None, gates=None, caves=None, design=None):
    """Raise ValueError for invalid planning data; never mutate any input."""
    game = read_json(GAME) if game is None else game
    graph = read_json(WORLD / "world-graph.json") if graph is None else graph
    gates = read_json(WORLD / "gates.json") if gates is None else gates
    caves = cave_sources() if caves is None else caves
    design = DESIGN.read_text(encoding="utf-8") if design is None else design
    exact_keys(data, {"schemaVersion", "source", "note", "slips"}, "lesson plan")
    require(type(data["schemaVersion"]) is int and data["schemaVersion"] == 1, "schemaVersion must be 1")
    require("docs/plans/wildbond-world-design.md" in text(data["source"], "source") and
            "section 4" in data["source"] and RULING in data["source"], "design/ruling provenance missing")
    text(data["note"], "note")
    expected = design_slips(design)
    require(isinstance(game, dict) and all(isinstance(game.get(key), dict)
            for key in ("MOVES", "ELEMENTS", "BADGES", "TILES")), "game reference data malformed")
    require(isinstance(graph, dict), "graph reference malformed")
    places = index_records(graph.get("places"), "graph places")
    require(isinstance(gates, dict), "gate reference malformed")
    gate_ids = index_records(gates.get("gates"), "canonical gates")
    field_keys = set()
    for lesson in index_records(gates.get("lessons"), "field lessons").values():
        key = text(lesson.get("key"), "field lesson key")
        require(key == "field:" + lesson["id"], "field lesson id/key mismatch")
        require(key not in field_keys, "duplicate field lesson key")
        field_keys.add(key)
    require(isinstance(caves, dict), "cave references malformed")
    for place, cave in caves.items():
        require(isinstance(cave, dict) and cave.get("id") == place and
                isinstance(cave.get("map"), dict), "cave reference id/map malformed")
    slips = data["slips"]
    require(isinstance(slips, list) and len(slips) == 8, "exactly eight slips required")
    seen_moves = set()
    for slip, (slip_id, move_name, element, description) in zip(slips, expected):
        exact_keys(slip, {"id", "move", "element", "source"}, "slip")
        require(slip["id"] == slip_id, "slip identity/order differs from section 4")
        move = text(slip["move"], "move id")
        require(move in game["MOVES"] and isinstance(game["MOVES"][move], dict) and
                game["MOVES"][move].get("name") == move_name, "move is missing or differs from section 4")
        require(move not in seen_moves, "duplicate move")
        seen_moves.add(move)
        text(slip["element"], "element")
        require(slip["element"] == element and (element == "any" or element in game["ELEMENTS"]),
                "element differs from section 4 or the catalogue")
        source = slip["source"]
        exact_keys(source, SOURCE_KEYS, "slip source")
        place, gate_id, person, kind, key = SOURCES[slip_id]
        require(source["place"] == place and (place in places or place in caves),
                "source place is missing or differs from the design")
        require(source["description"] == description, "source wording differs from section 4")
        require(source["gate"] == gate_id, "wrong or invented local acquisition gate")
        requirements = source["requires"]
        wanted = [] if kind is None else [{"kind": kind, "key": key}]
        require(isinstance(requirements, list) and len(requirements) == len(wanted),
                "source requirements differ from the design")
        for condition in requirements:
            exact_keys(condition, {"kind", "key"}, "requirement")
            text(condition["kind"], "requirement kind")
            text(condition["key"], "requirement key")
            require(condition["kind"] in {"field", "badge"}, "unknown requirement kind")
            allowed = field_keys if condition["kind"] == "field" else game["BADGES"]
            require(condition["key"] in allowed, "unknown field/badge requirement")
        require(requirements == wanted, "source requirements differ from the design")
        if gate_id is not None:
            record = gate_ids.get(gate_id)
            require(isinstance(record, dict) and record.get("kind") == kind and record.get("key") == key
                    and record.get("place") == place, "canonical acquisition gate has drifted")
            require(isinstance(record.get("door"), str) and gate_id == record["door"] + ":" + key,
                    "canonical gate id/door mismatch")
        if person is None:
            require(source["person"] is None, "found slip must not invent a giver")
        else:
            exact_keys(source["person"], {"name", "status"}, "proposed keeper")
            require(source["person"] == {"name": person, "status": "proposed"}, "keeper is still proposed")
            require(place in places and places[place].get("healer") == person and
                    places[place].get("healerStatus") == "proposed", "keeper/graph proposal mismatch")
        if slip_id == "slip-mist-veil":
            require(source["layoutGate"] == "wall-door-north", "Mist Veil needs the north wall-door")
            validate_mist_location(source, caves.get("answering"), game["TILES"])
        else:
            require(source["tile"] is None and source["layoutGate"] is None,
                    "other slips remain unplaced; do not invent coordinates or layout gates")
    return {"slips": len(slips), "moves": len(seen_moves), "mistVeilTile": [16, 3]}


class LessonPlanTests(unittest.TestCase):
    def setUp(self):
        self.data = read_json(DATA)
        self.refs = {"game": read_json(GAME), "graph": read_json(WORLD / "world-graph.json"),
                     "gates": read_json(WORLD / "gates.json"), "caves": cave_sources(),
                     "design": DESIGN.read_text(encoding="utf-8")}

    def check(self, data=UNSET, **refs):
        return validate(self.data if data is UNSET else data, **(self.refs | refs))

    def rejects(self, data=UNSET, **refs):
        with self.assertRaises(ValueError):
            self.check(data, **refs)

    def test_complete_source_matched_plan(self):
        self.assertEqual(self.check(), {"slips": 8, "moves": 8, "mistVeilTile": [16, 3]})

    def test_validator_is_read_only(self):
        before = deepcopy((self.data, self.refs))
        self.check()
        self.assertEqual((self.data, self.refs), before)

    def test_strict_json(self):
        for raw in ('{"id":1,"id":2}', '{"a":{"x":0,"x":1}}', 'NaN', 'Infinity',
                    '-Infinity', '1e999', '{"x":}', '[1,]', '{} {}'):
            with self.subTest(raw=raw), self.assertRaises(ValueError):
                load_json(raw)

    def test_schema_rejects_every_missing_or_extra_field(self):
        # Exercise every object, including nested requirements and proposed people.
        def paths(value, path=()):
            if isinstance(value, dict):
                yield path, value
                for key, child in value.items():
                    yield from paths(child, path+(key,))
            elif isinstance(value, list):
                for index, child in enumerate(value):
                    yield from paths(child, path+(index,))
        count = 0
        for path, value in paths(self.data):
            for key in list(value) + ["unexpected", "lessons"]:
                fixture = deepcopy(self.data)
                target = fixture
                for part in path:
                    target = target[part]
                if key in value:
                    del target[key]
                else:
                    target[key] = []
                with self.subTest(path=path, key=key):
                    self.rejects(fixture)
                count += 1
        print(f"WBW-10 missing/extra fields: {count} rejected.")

    def test_nested_types_and_scalars(self):
        bad = [None, True, False, 0, 1, -1, 1.5, "", " ", [], {}, ["unknown"], {"x": 1}]
        def paths(value, path=()):
            yield path, value
            if isinstance(value, dict):
                for key, child in value.items():
                    yield from paths(child, path+(key,))
            elif isinstance(value, list):
                for index, child in enumerate(value):
                    yield from paths(child, path+(index,))
        count = 0
        for path, original in paths(self.data):
            for replacement in bad:
                # A freeform nonempty note is valid, and exact nulls/empty lists are intentional.
                if type(replacement) is type(original) and replacement == original:
                    continue
                fixture = deepcopy(self.data)
                if not path:
                    fixture = replacement
                else:
                    target = fixture
                    for part in path[:-1]:
                        target = target[part]
                    target[path[-1]] = replacement
                with self.subTest(path=path, replacement=replacement):
                    self.rejects(fixture)
                count += 1
        print(f"WBW-10 nested malformed values: {count} rejected.")

    def test_eight_identities_and_distinct_moves(self):
        for mode in ("missing", "extra", "duplicate", "swap", "wrong-move", "wrong-element"):
            fixture = deepcopy(self.data)
            slips = fixture["slips"]
            if mode == "missing": slips.pop()
            if mode == "extra": slips.append(deepcopy(slips[0]))
            if mode == "duplicate": slips[1] = deepcopy(slips[0])
            if mode == "swap": slips[0], slips[1] = slips[1], slips[0]
            if mode == "wrong-move": slips[0]["move"] = "mistVeil"
            if mode == "wrong-element": slips[0]["element"] = "Tide"
            with self.subTest(mode=mode): self.rejects(fixture)

    def test_no_invented_locations_gates_or_people(self):
        changes = [(0, "place", "bellstep"), (1, "place", "greywash"),
                   (2, "gate", "thornwood_grove--knothollow:field:grove"),
                   (5, "gate", "answering-wall-doors"), (5, "gate", "wall-door-north"),
                   (6, "gate", "daymark-town-carvings:field:daymark"),
                   (6, "person", {"name": "Solla", "status": "accepted"}),
                   (7, "place", "gate-loft"), (7, "person", {"name": "Isolde", "status": "proposed"})]
        for index, key, value in changes:
            fixture = deepcopy(self.data)
            fixture["slips"][index]["source"][key] = value
            with self.subTest(index=index, key=key): self.rejects(fixture)
        for index in range(8):
            if index == 5: continue
            fixture = deepcopy(self.data)
            fixture["slips"][index]["source"]["tile"] = [16, 3]
            self.rejects(fixture)

    def test_source_conditions_are_not_optional(self):
        for index, slip in enumerate(self.data["slips"]):
            fixture = deepcopy(self.data)
            source = fixture["slips"][index]["source"]
            source["requires"] = [] if source["requires"] else [{"kind": "field", "key": "field:glide"}]
            with self.subTest(index=index): self.rejects(fixture)

    def test_moves_elements_badges_and_field_keys_really_exist(self):
        for slip in self.data["slips"]:
            game = deepcopy(self.refs["game"])
            del game["MOVES"][slip["move"]]
            self.rejects(game=game)
            game = deepcopy(self.refs["game"])
            game["MOVES"][slip["move"]]["name"] = "Unrelated move"
            self.rejects(game=game)
        game = deepcopy(self.refs["game"]); del game["ELEMENTS"]["Stone"]
        self.rejects(game=game)
        game = deepcopy(self.refs["game"]); del game["BADGES"]["thorn"]
        self.rejects(game=game)
        for key in ("stone", "tide", "grove", "lantern", "hush", "daymark"):
            gates = deepcopy(self.refs["gates"])
            gates["lessons"] = [row for row in gates["lessons"] if row["id"] != key]
            self.rejects(gates=gates)

    def test_places_must_be_in_graph_or_present_cave_plan(self):
        for slip in self.data["slips"]:
            place = slip["source"]["place"]
            graph, caves = deepcopy(self.refs["graph"]), deepcopy(self.refs["caves"])
            graph["places"] = [row for row in graph["places"] if row["id"] != place]
            caves.pop(place, None)
            with self.subTest(place=place): self.rejects(graph=graph, caves=caves)
        graph = deepcopy(self.refs["graph"])
        graph["places"] = [row for row in graph["places"] if row["id"] != "knothollow"]
        self.check(graph=graph)  # Existing cave plan is an expressly allowed alternative.

    def test_canonical_gate_drift_and_proposed_people(self):
        for gate_id in (row[1] for row in SOURCES.values() if row[1]):
            for field in ("id", "door", "place", "kind", "key"):
                gates = deepcopy(self.refs["gates"])
                row = next(g for g in gates["gates"] if g["id"] == gate_id)
                row[field] = "wrong"
                with self.subTest(gate=gate_id, field=field): self.rejects(gates=gates)
        for place in ("sunthread", "thornwood"):
            for field in ("healer", "healerStatus"):
                graph = deepcopy(self.refs["graph"])
                next(p for p in graph["places"] if p["id"] == place)[field] = "wrong"
                self.rejects(graph=graph)

    def test_design_drift_cannot_silently_pass(self):
        design = self.refs["design"]
        for old, new in (("| `slip-rinse`", "| `slip-other`"),
                         ("| Rinse | Tide |", "| Mist Veil | Tide |"),
                         ("| Rinse | Tide |", "| Rinse | Stone |"),
                         ("| Crest Path, on the way to Lampcrown |", "| Glassfall |"),
                         ("## 4. Tutors and lesson slips", "## 4. Missing")):
            self.assertIn(old, design)
            self.rejects(design=design.replace(old, new, 1))

    def test_mist_uses_reserved_north_niche_not_door_or_south_stone(self):
        for point in ([16, 5], [13, 10], [15, 19], [19, 8], [0, 0], [16, 2],
                      [-1, 3], [32, 3], [16, 22], [True, 3], [16.0, 3], [16], [16, 3, 0]):
            fixture = deepcopy(self.data)
            fixture["slips"][5]["source"]["tile"] = point
            with self.subTest(point=point): self.rejects(fixture)
        source = self.data["slips"][5]["source"]
        self.assertEqual(validate_mist_location(source, self.refs["caves"]["answering"],
                                               self.refs["game"]["TILES"]), 9)

    def test_mist_reference_geometry_and_occupancy_drift(self):
        for mode in ("missing", "south", "wrong-key", "unknown-gate", "blocked", "bypass", "zone", "occupied", "item", "ragged"):
            caves = deepcopy(self.refs["caves"])
            cave = caves["answering"]
            north = next(g for g in cave["gates"] if g["id"] == "wall-door-north")
            if mode == "missing": del caves["answering"]
            if mode == "south": north["beyond"] = [13, 10]
            if mode == "wrong-key": north["key"] = "field:stone"
            if mode == "unknown-gate": north["id"] = "wall-door-other"
            if mode == "blocked":
                row = cave["map"]["rows"][3]; cave["map"]["rows"][3] = row[:16]+"#"+row[17:]
            if mode == "bypass":
                row = cave["map"]["rows"][5]; cave["map"]["rows"][5] = row[:15]+"."+row[16:]
            if mode == "zone": next(z for z in cave["zones"] if z["id"] == "hush-doors")["rects"] = [[15, 2, 3, 3]]
            if mode == "occupied": cave["markers"].append({"id": "other", "at": [16, 3]})
            if mode == "item": cave["map"]["items"] = [{"id": "taken", "at": [16, 3], "give": {"berries": 1}}]
            if mode == "ragged": cave["map"]["rows"][0] = "#"
            with self.subTest(mode=mode): self.rejects(caves=caves)

    def test_unrelated_pickup_does_not_change_the_reserved_niche(self):
        caves = deepcopy(self.refs["caves"])
        caves["answering"]["map"]["items"] = [{"id": "elsewhere", "at": [10, 16], "give": {"berries": 1}}]
        self.check(caves=caves)

    def test_reference_collections_reject_malformed_and_duplicate_ids(self):
        for ref, key in (("graph", "places"), ("gates", "gates"), ("gates", "lessons")):
            for value in (None, {}, [None], [{}], [{"id": []}]):
                fixture = deepcopy(self.refs[ref]); fixture[key] = value
                self.rejects(**{ref: fixture})
            fixture = deepcopy(self.refs[ref]); fixture[key].append(deepcopy(fixture[key][0]))
            self.rejects(**{ref: fixture})


if __name__ == "__main__":
    unittest.main()
