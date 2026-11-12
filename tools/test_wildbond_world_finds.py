"""Validate the WBW-13 planning data for item and berry spots on the 20 routes and the 7 caves; this does not load or change a map.

Run from the repository root: python3 -m unittest tools/test_wildbond_world_finds.py
Standalone, like the other tools/test_wildbond_world_*.py tests: it reads the game's data, the design, world-graph.json and
gates.json and changes nothing. Nothing here is added to CI.
"""

from copy import deepcopy
import json
import math
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
WORLD = ROOT / "docs/plans/wildbond-world"
DATA = WORLD / "finds.json"
GAME = ROOT / "wildbond-godot/data/wildbond.json"
DESIGN = ROOT / "docs/plans/wildbond-world-design.md"
GRAPH = WORLD / "world-graph.json"
GATES = WORLD / "gates.json"
ENCOUNTERS = WORLD / "route-encounters.json"
ROOT_KEYS = {"schemaVersion", "source", "status", "items", "finds"}
FIND_KEYS = {"id", "place", "item", "count", "gate", "status"}
# Item ids a find may use: the lures and the five foods the game already hands out. Coins are money and not a find here, and
# the Lantern seed is a 90-coin shop food with no pickup anywhere. Lesson slips belong to lessons.json (WBW-10).
ITEMS = ["berries", "fish", "grain", "lures", "meat"]
# The country of each route the WBW-5 table does not cover, and of each cave, as the design places them.
EXTRA_ROUTE_COUNTRY = {"thornwood_route": "thornwood", "saltmarsh_route": "saltmarsh", "glassfall": "cloudglass", "crestpath": "cloudglass"}
CAVE_COUNTRY = {"knothollow": "thornwood", "larkburrow": "thornwood", "keelcave": "saltmarsh", "kilnvent": "emberfall",
                "lowbell": "stillreed", "answering": "hollowecho", "trialstair": "farwatch"}


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


def load(path):
    return load_json(path.read_text(encoding="utf-8"))


def require(condition, message):
    if not condition:
        raise ValueError(message)


def exact_keys(value, keys, label):
    require(isinstance(value, dict) and set(value) == set(keys), f"{label}: unexpected fields")


def design_routes(design):
    section = design.split("### Routes (20)", 1)
    require(len(section) == 2, "design: Routes (20) section missing")
    table = section[1].split("### Towns (10)", 1)[0]
    rows = re.findall(r"^\| \d+ \| `([^`]+)` \|", table, re.MULTILINE)
    require(len(rows) == 20 and len(set(rows)) == 20, "design: the route table is no longer 20 distinct routes")
    return rows


def country_of_map(entry):
    return entry.get("biome") or entry.get("pal")


def ceilings(game):
    """Per country, the biggest single lure pickup and the biggest single food pickup already placed on that country's maps."""
    best = {}
    for entry in game["MAPS"].values():
        country = country_of_map(entry)
        for pickup in entry.get("items", []):
            for item, count in pickup["give"].items():
                kind = "lures" if item == "lures" else "food" if item in game["FOODS"] else None
                if kind and country:
                    row = best.setdefault(country, {"lures": 0, "food": 0})
                    row[kind] = max(row[kind], int(count))
    return best


def place_country(place, encounters):
    if place in encounters["routes"]:
        return encounters["routes"][place]["biome"]
    return EXTRA_ROUTE_COUNTRY.get(place) or CAVE_COUNTRY[place]


def validate(data, game=None, design=None, graph=None, gates=None, encounters=None):
    """Raise ValueError for malformed planning data, without mutating any input. Returns a short summary."""
    game = game if game is not None else load(GAME)
    design = design if design is not None else DESIGN.read_text(encoding="utf-8")
    graph = graph if graph is not None else load(GRAPH)
    gates = gates if gates is not None else load(GATES)
    encounters = encounters if encounters is not None else load(ENCOUNTERS)
    exact_keys(data, ROOT_KEYS, "finds")
    require(data["schemaVersion"] == 1 and data["status"] == "proposed", "schemaVersion 1 and a proposed status")
    require(isinstance(data["source"], str) and "wildbond-world-design.md" in data["source"], "source must name the design")
    # Items: only ones the game already has, never coins, never a slip.
    require(data["items"] == ITEMS, "the item list must be the five the game already hands out")
    require(all(item == "lures" or item in game["FOODS"] for item in ITEMS) and "lanternseed" not in ITEMS, "an item is not in the game's item data")
    handed_out = {item for entry in game["MAPS"].values() for pickup in entry.get("items", []) for item in pickup["give"]}
    require(set(ITEMS) <= handed_out, "an item no map hands out today")
    routes = design_routes(design)
    caves = {p["id"] for p in graph["places"] if p["kind"] == "cave"}
    require(len(caves) == 7 and caves == set(CAVE_COUNTRY), "the design's seven caves changed; reconcile CAVE_COUNTRY")
    graph_ids = {p["id"] for p in graph["places"]} | {l["id"] for l in graph["links"]}
    require(set(routes) | caves <= graph_ids, "a route or cave is missing from world-graph.json")
    require(set(routes) - set(encounters["routes"]) == set(EXTRA_ROUTE_COUNTRY), "the four routes without a WBW-5 table changed")
    field_gates = {g["id"]: g for g in gates["gates"] if g["kind"] == "field"}
    caps = ceilings(game)
    finds = data["finds"]
    require(isinstance(finds, list) and finds, "finds must be a nonempty list")
    ids, seen_spot, by_place = set(), set(), {}
    for find in finds:
        exact_keys(find, FIND_KEYS, "find")
        place = find["place"]
        require(isinstance(place, str) and place in set(routes) | caves, f"{place}: not one of the 20 routes or 7 caves")
        require(find["status"] == "proposed", f"{place}: every find here is proposed")
        index = len(by_place.get(place, [])) + 1
        require(find["id"] == f"{place}-{index}" and find["id"] not in ids, f"{place}: find ids run {place}-1, {place}-2 and so on")
        ids.add(find["id"])
        item = find["item"]
        require(isinstance(item, str) and item in ITEMS, f"{find['id']}: item is not one the game already hands out")
        count, gate = find["count"], find["gate"]
        require(type(count) is int and count >= 1, f"{find['id']}: count must be a whole number, one or more")
        country = place_country(place, encounters)
        limit = caps[country]["lures" if item == "lures" else "food"]
        require(count <= limit, f"{find['id']}: {count} is more than the largest pickup of that kind on {country}'s maps ({limit})")
        if gate is not None:
            require(isinstance(gate, str) and gate in field_gates, f"{find['id']}: gate is not a field gate in gates.json")
            require(field_gates[gate]["place"] == place, f"{find['id']}: gate {gate} is at {field_gates[gate]['place']}, not {place}")
        spot = (place, item, gate)
        require(spot not in seen_spot, f"{find['id']}: the same item behind the same gate twice at {place}")
        seen_spot.add(spot)
        by_place.setdefault(place, []).append(find)
    # Every route has a find, and no place's gated find is its only one: an early player always finds something.
    require(set(routes) <= set(by_place), "a route has no find: " + ", ".join(sorted(set(routes) - set(by_place))))
    require(set(by_place) == set(routes) | caves, "every one of the 20 routes and 7 caves has a find")
    for place, here in by_place.items():
        require(any(f["gate"] is None for f in here), f"{place}: its only finds are behind a lesson")
    # The design's thickets hide a patch of berries, so those two gated finds are berries.
    thicket = {"thornwood_route-thickets:field:grove": "thornwood_route", "rootwater-thickets:field:grove": "rootwater"}
    require("a bend and a patch of berries" in design, "design wording changed; recheck the thickets")
    for gate_id, place in thicket.items():
        require(gate_id in field_gates and field_gates[gate_id]["place"] == place, "gates.json no longer lists the thickets")
        require(any(f["gate"] == gate_id and f["item"] == "berries" for f in by_place[place]), f"{place}: the thickets must hold berries")
    return {"routes": len(routes), "caves": len(caves), "finds": len(finds), "gated": sum(f["gate"] is not None for f in finds)}


class FindsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = load(DATA)
        cls.game = load(GAME)
        cls.design = DESIGN.read_text(encoding="utf-8")
        cls.graph = load(GRAPH)
        cls.gates = load(GATES)
        cls.encounters = load(ENCOUNTERS)

    def check(self, data, **kw):
        args = {"game": self.game, "design": self.design, "graph": self.graph, "gates": self.gates, "encounters": self.encounters}
        args.update(kw)
        return validate(data, **args)

    def by_place(self):
        out = {}
        for find in self.data["finds"]:
            out.setdefault(find["place"], []).append(find)
        return out

    def test_blueprint_matches_the_design_and_the_game(self):
        result = self.check(self.data)
        self.assertEqual((result["routes"], result["caves"]), (20, 7))
        print("WBW-13 finds:", result)

    def test_validation_does_not_mutate_input(self):
        before = deepcopy(self.data)
        self.check(self.data)
        self.assertEqual(before, self.data)

    def test_every_item_id_exists_in_the_games_item_data(self):
        for find in self.data["finds"]:
            self.assertTrue(find["item"] == "lures" or find["item"] in self.game["FOODS"], find["id"])
        self.assertNotIn("coins", {f["item"] for f in self.data["finds"]})
        self.assertFalse([f for f in self.data["finds"] if f["item"].startswith("slip")])

    def test_every_gate_id_is_in_gates_json(self):
        listed = {g["id"]: g for g in self.gates["gates"]}
        gated = [f for f in self.data["finds"] if f["gate"] is not None]
        self.assertTrue(gated)
        for find in gated:
            self.assertIn(find["gate"], listed, find["id"])
            self.assertEqual(listed[find["gate"]]["kind"], "field", find["id"])
            self.assertEqual(listed[find["gate"]]["place"], find["place"], find["id"])
        print("WBW-13 gated finds:", {f["id"]: f["gate"] for f in gated})

    def test_every_route_has_at_least_one_find(self):
        by_place = self.by_place()
        counts = {r: len(by_place[r]) for r in design_routes(self.design)}
        self.assertTrue(all(n >= 1 for n in counts.values()), counts)
        print("WBW-13 finds per route:", counts)

    def test_no_gated_find_is_the_only_find_on_its_place(self):
        for place, finds in self.by_place().items():
            self.assertTrue(any(f["gate"] is None for f in finds), place)
            if any(f["gate"] is not None for f in finds):
                self.assertGreaterEqual(len(finds), 2, place)

    def test_counts_never_beat_the_biggest_pickup_already_on_that_country(self):
        caps = ceilings(self.game)
        self.assertEqual(caps["thornwood"], {"lures": 3, "food": 5})
        self.assertEqual(caps["farwatch"], {"lures": 8, "food": 8})
        for find in self.data["finds"]:
            country = place_country(find["place"], self.encounters)
            self.assertLessEqual(find["count"], caps[country]["lures" if find["item"] == "lures" else "food"], find["id"])

    def test_every_cave_and_route_is_in_the_graph(self):
        ids = {p["id"] for p in self.graph["places"]} | {l["id"] for l in self.graph["links"]}
        self.assertTrue({f["place"] for f in self.data["finds"]} <= ids)
        caves = {p["id"] for p in self.graph["places"] if p["kind"] == "cave"}
        self.assertEqual(caves, set(CAVE_COUNTRY))
        self.assertEqual(len(caves), 7)

    def test_the_grove_thickets_hold_berries(self):
        by_place = self.by_place()
        for place in ("thornwood_route", "rootwater"):
            self.assertIn(("berries", f"{place}-thickets:field:grove"), {(f["item"], f["gate"]) for f in by_place[place]})

    def test_source_changes_are_not_hidden(self):
        low = deepcopy(self.game)
        for entry in low["MAPS"].values():
            for pickup in entry.get("items", []):
                if "berries" in pickup["give"]:
                    pickup["give"]["berries"] = 1
        with self.assertRaises(ValueError):
            self.check(self.data, game=low)
        foods = deepcopy(self.game)
        del foods["FOODS"]["fish"]
        with self.assertRaises(ValueError):
            self.check(self.data, game=foods)
        with self.assertRaises(ValueError):
            self.check(self.data, design=self.design.replace("| 20 | `trialroad` |", "| 20 | `trialroadx` |"))
        gates = deepcopy(self.gates)
        gates["gates"] = [g for g in gates["gates"] if g["id"] != "rootwater-thickets:field:grove"]
        with self.assertRaises(ValueError):
            self.check(self.data, gates=gates)
        graph = deepcopy(self.graph)
        for place in graph["places"]:
            if place["id"] == "lowbell":
                place["kind"] = "route"
        with self.assertRaises(ValueError):
            self.check(self.data, graph=graph)

    def test_malformed_data_is_rejected(self):
        cases = []
        finds = self.data["finds"]
        first = finds[0]

        def changed(label, path, value):
            data = deepcopy(self.data)
            owner = data
            for part in path[:-1]:
                owner = owner[part]
            owner[path[-1]] = value
            cases.append((label, data))
        for value in (None, [], "finds", 1, True):
            cases.append(("bad root", value))
        for key in self.data:
            data = deepcopy(self.data)
            del data[key]
            cases.append(("missing " + key, data))
        data = deepcopy(self.data)
        data["extra"] = 1
        cases.append(("extra root key", data))
        for key in FIND_KEYS:
            data = deepcopy(self.data)
            del data["finds"][0][key]
            cases.append(("missing find key " + key, data))
        data = deepcopy(self.data)
        data["finds"][0]["extra"] = 1
        cases.append(("extra find key", data))
        data = deepcopy(self.data)
        data["finds"] = [f for f in finds if f["place"] != "trialroad"]
        cases.append(("a route with no find", data))
        data = deepcopy(self.data)
        data["finds"] = [f for f in finds if f["place"] != "lowbell"]
        cases.append(("a cave with no find", data))
        data = deepcopy(self.data)
        data["finds"] = [f for f in finds if f["place"] != "latepath"] + [dict(first, id="latepath-1", place="latepath", item="berries", count=4,
                                                                           gate="latepath-night-path:field:hush")]
        cases.append(("a route whose only find is gated", data))
        data = deepcopy(self.data)
        data["finds"] = [f for f in finds if not (f["place"] == "rootwater" and f["gate"] is None)]
        cases.append(("a place left with only a gated find", data))
        for label, path, value in [
            ("status", ["status"], "canon"), ("version", ["schemaVersion"], 2), ("source", ["source"], "somewhere"),
            ("items", ["items"], ["berries", "coins"]), ("items short", ["items"], ["berries"]), ("items slip", ["items"], ITEMS + ["slip-rinse"]),
            ("finds type", ["finds"], None), ("finds empty", ["finds"], []), ("find null", ["finds", 0], None),
            ("find id", ["finds", 0, "id"], "thornwood_route-2"), ("find id style", ["finds", 0, "id"], "f1"),
            ("find status", ["finds", 0, "status"], "canon"),
            ("place unknown", ["finds", 0, "place"], "madeup"), ("place a town", ["finds", 0, "place"], "larkhaven"),
            ("place type", ["finds", 0, "place"], None), ("place a link of a route", ["finds", 0, "place"], "saltmarsh--ashstair"),
            ("item coins", ["finds", 0, "item"], "coins"), ("item lanternseed", ["finds", 0, "item"], "lanternseed"),
            ("item a slip", ["finds", 0, "item"], "slip-mist-veil"), ("item unknown", ["finds", 0, "item"], "dewdrop"),
            ("item type", ["finds", 0, "item"], None),
            ("count zero", ["finds", 0, "count"], 0), ("count negative", ["finds", 0, "count"], -1), ("count float", ["finds", 0, "count"], 1.5),
            ("count bool", ["finds", 0, "count"], True), ("count string", ["finds", 0, "count"], "2"), ("count null", ["finds", 0, "count"], None),
            ("count over the country's biggest", ["finds", 0, "count"], 99),
            ("gate unknown", ["finds", 0, "gate"], "thornwood_route-thickets:field:glide"), ("gate empty", ["finds", 0, "gate"], ""),
            ("gate a badge gate", ["finds", 0, "gate"], "cloudglass--passfoot:beacon"), ("gate at another place", ["finds", 0, "gate"], "rootwater-thickets:field:grove"),
            ("gate type", ["finds", 0, "gate"], 5), ("gate a list", ["finds", 0, "gate"], ["thornwood_route-thickets:field:grove"]),
        ]:
            changed(label, path, value)
        # An ungated copy of a gated find's item at the same place is allowed once; twice is not.
        data = deepcopy(self.data)
        data["finds"].insert(1, dict(first, id="thornwood_route-2"))
        cases.append(("the same spot twice", data))
        data = deepcopy(self.data)
        thorn = [f for f in data["finds"] if f["place"] == "thornwood_route"]
        thorn[0]["item"] = "meat"
        cases.append(("the grove thickets without berries", data))
        for label, data in cases:
            with self.subTest(label=label), self.assertRaises(ValueError):
                self.check(data)
        print(f"WBW-13 malformed fixtures: {len(cases)} rejected.")

    def test_strict_json_rejects_duplicate_keys_and_nonfinite_numbers(self):
        for text in ('{"id":1,"id":2}', '{"finds":[{"id":1,"id":2}]}', '{"x":NaN}', '{"x":Infinity}',
                     '{"x":-Infinity}', '{"x":1e309}', '{"x":-1e309}'):
            with self.subTest(text=text), self.assertRaises(ValueError):
                load_json(text)


if __name__ == "__main__":
    unittest.main()
