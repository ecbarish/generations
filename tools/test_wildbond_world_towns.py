"""Validate the WBW-7 towns plan (docs/plans/wildbond-world/towns.json). It does not load or change any game.

Run from the repository root: python3 -m unittest tools/test_wildbond_world_towns.py
The test reads world-graph.json (WBW-3), the design's "Towns (10)" table, and wildbond-godot/data/wildbond.json
and scripts/main.gd (read only). Nothing in the game, the save or the web pack is written.
"""

from collections import deque
from copy import deepcopy
import json
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
TOWNS = ROOT / "docs/plans/wildbond-world/towns.json"
GRAPH = ROOT / "docs/plans/wildbond-world/world-graph.json"
DESIGN = ROOT / "docs/plans/wildbond-world-design.md"
GAME = ROOT / "wildbond-godot/data/wildbond.json"
MAIN_GD = ROOT / "wildbond-godot/scripts/main.gd"

TOP_KEYS = {"schemaVersion", "source", "status", "rule", "shelfGoods", "shelfKinds", "towns"}
TOWN_KEYS = {"id", "name", "graphNode", "status", "currentMap", "where", "healer", "rooms", "outdoor", "shelf", "source"}
TOWN_OPTIONAL = {"features", "extraKeepers"}
ROOM_KINDS = {"healer", "shop", "home", "barn", "other"}
STATUSES = {"exists", "proposed"}
GOODS = {"lures", "berries"}
MAX_STEPS = 3
SIZE = re.compile(r"^[0-9]+x[0-9]+$")


def unique_object(pairs):
    out = {}
    for key, value in pairs:
        if key in out:
            raise ValueError(f"Duplicate JSON key: {key}")
        out[key] = value
    return out


def load_json(path):
    return json.loads(Path(path).read_text(encoding="utf8"), object_pairs_hook=unique_object)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def design_rows(design_text):
    """The rows of the design's Towns (10) table, as {town name: the whole row's text}."""
    start = design_text.index("### Towns (10)")
    end = design_text.index("\n### ", start + 5)
    rows = {}
    for line in design_text[start:end].splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if line.startswith("|") and len(cells) == 4 and cells[0] not in ("Town", "---"):
            rows[cells[0]] = {"town": cells[0], "where": cells[1], "healer": cells[2], "also": cells[3],
                              "text": " ".join(cells)}
    return rows


def graph_index(graph):
    places = {p["id"]: p for p in graph["places"]}
    require(len(places) == len(graph["places"]), "graph: duplicate place ids")
    return places


def adjacency(graph, tide_ride):
    """Directed neighbours. Without Tide Ride a link gated by the Tide Ride lesson is not walked."""
    adj = {p["id"]: [] for p in graph["places"]}
    for link in graph["links"]:
        needs_tide = any(req.get("field") == "tide" for req in link["gate"])
        if needs_tide and not tide_ride:
            continue
        adj[link["a"]].append(link["b"])
        if not link.get("oneWay"):
            adj[link["b"]].append(link["a"])
    return adj


def steps_from_towns(graph, healer_towns, tide_ride):
    """Links from the nearest healer town, for every place that can be reached (BFS from all healer towns at once).
    The walk back to a town is what matters, so a one-way link (Glassfall) is walked in the direction it opens."""
    adj = adjacency(graph, tide_ride)
    reverse = {k: [] for k in adj}
    for a, outs in adj.items():
        for b in outs:
            reverse[b].append(a)
    dist = {t: 0 for t in healer_towns}
    queue = deque(healer_towns)
    while queue:
        u = queue.popleft()
        for v in reverse[u]:  # v can walk to u, so v is one step further than u
            if v not in dist:
                dist[v] = dist[u] + 1
                queue.append(v)
    return dist


def check_distances(graph, healer_towns):
    """No walkable place is more than three steps from a healer. Places behind Tide Ride are counted when it is learned."""
    places = graph_index(graph)
    walk = steps_from_towns(graph, healer_towns, tide_ride=False)
    swim = steps_from_towns(graph, healer_towns, tide_ride=True)
    for pid, place in places.items():
        if place["kind"] == "cave":
            continue  # caves have their own plans; the report in towns.md lists them but the rule is about routes
        if place.get("isLink"):
            continue  # Glassfall is one arrow between two towns, not a place with its own exits (checked below)
        steps = swim.get(pid)
        require(steps is not None, f"{pid}: cannot walk to any healer, even with Tide Ride")
        require(steps <= MAX_STEPS, f"{pid}: {steps} steps from a healer (more than {MAX_STEPS})")
        if pid in walk:
            require(walk[pid] <= MAX_STEPS, f"{pid}: {walk[pid]} steps from a healer on foot (more than {MAX_STEPS})")
        else:
            # not walkable without Tide Ride: it must really be behind a Tide Ride link
            tide_links = [l for l in graph["links"] if any(r.get("field") == "tide" for r in l["gate"]) and pid in (l["a"], l["b"])]
            require(tide_links, f"{pid}: not reachable on foot, and no Tide Ride link explains why")
    for link in graph["links"]:
        if places[link["a"]]["kind"] == "town" and places[link["b"]]["kind"] == "town":
            require(link["id"] == "glassfall", f"{link['id']}: two towns joined with no route between them")
    return walk, swim


def validate(doc, graph, game, design_text, main_gd_text):
    require(isinstance(doc, dict) and set(doc) == TOP_KEYS, "towns.json: unexpected top-level fields")
    require(doc["schemaVersion"] == 1, "towns.json: schemaVersion must be 1")
    places = graph_index(graph)
    graph_towns = [p for p in graph["places"] if p["kind"] == "town"]
    towns = doc["towns"]
    require(isinstance(towns, list) and len(towns) == 10, "towns.json: expected 10 towns")
    require([t["id"] for t in towns] == [p["id"] for p in graph_towns], "towns.json: towns must be the graph's ten towns, in its order")
    rows = design_rows(design_text)
    require(len(rows) == 10, "the design's Towns table should have 10 rows")
    cast = game["CAST"]
    room_ids, outdoor_ids, keeper_ids, proposed_people = set(), set(), set(), set()
    proposed_rooms = {"healer": 0, "shop": 0, "other": 0}
    healer_count = {"exists": 0, "proposed": 0}
    full_shelves = 0

    def known_person(person, label):
        pid, name = person["id"], person["name"]
        if person["status"] == "exists":
            in_cast = pid in cast and name in cast[pid]["name"]
            in_main = re.search(r'"%s": \{ "name": "%s"' % (re.escape(pid), re.escape(name)), main_gd_text) is not None
            require(in_cast or in_main, f"{label}: {name} is marked as existing but is not in the game")
        else:
            require(pid not in cast, f"{label}: {name} is marked proposed but the game already has {pid}")
            proposed_people.add(pid)

    for town in towns:
        label = town["id"]
        require(set(town) - TOWN_OPTIONAL == TOWN_KEYS and set(town) <= TOWN_KEYS | TOWN_OPTIONAL, f"{label}: unexpected fields")
        node = places.get(town["graphNode"])
        require(node is not None and node["kind"] == "town" and town["graphNode"] == town["id"], f"{label}: not a town in the graph")
        require(town["name"] == node["name"], f"{label}: name differs from the graph")
        require(town["status"] in ("exists", "new"), f"{label}: bad status")
        if node.get("current"):
            require(town["status"] == "exists" and town["currentMap"] == town["id"] and town["id"] in game["MAPS"], f"{label}: a current map id is kept")
        else:
            require(town["status"] == "new" and town["currentMap"] is None and town["id"] not in game["MAPS"], f"{label}: a new town has no map yet")
        row = rows.get(town["name"])
        require(row is not None, f"{label}: no row in the design's Towns table")
        h = town["healer"]
        require(set(h) == {"id", "name", "status", "room", "restsTeam", "cost"}, f"{label}: healer fields")
        require(h["name"] == node["healer"] and h["status"] == node["healerStatus"], f"{label}: healer differs from the graph")
        require(row["healer"].startswith(h["name"]), f"{label}: healer is not the design's")
        require(h["restsTeam"] is True and h["cost"] == 0, f"{label}: a healer rests a tired team for nothing")
        require(h["status"] in STATUSES, f"{label}: bad healer status")
        healer_count[h["status"]] += 1
        known_person(h, label)
        rooms = town["rooms"]
        require(isinstance(rooms, list) and rooms, f"{label}: no rooms")
        healer_rooms = [r for r in rooms if r["kind"] == "healer"]
        require(len(healer_rooms) == 1 and healer_rooms[0]["id"] == h["room"], f"{label}: exactly one healer room, and it is the healer's")
        for r in rooms:
            rl = f"{label}/{r['id']}"
            optional = {"mapDoor", "pad", "keeper", "note"}
            require({"id", "name", "kind", "status", "door", "designMention"} <= set(r) <= {"id", "name", "kind", "status", "door", "designMention"} | optional, f"{rl}: unexpected fields")
            require(r["id"] not in room_ids, f"{rl}: duplicate room id")
            room_ids.add(r["id"])
            require(r["kind"] in ROOM_KINDS and r["status"] in STATUSES, f"{rl}: bad kind or status")
            require(set(r["door"]) == {"size"}, f"{rl}: door fields")
            size = r["door"]["size"]
            if r["status"] == "proposed":
                require(isinstance(size, str) and SIZE.match(size), f"{rl}: a new door needs a size")
                proposed_rooms[r["kind"]] = proposed_rooms.get(r["kind"], 0) + 1
            else:
                require(size is None or SIZE.match(size), f"{rl}: bad door size")
            require(r["designMention"] in row["text"], f"{rl}: the design's row for {town['name']} does not mention '{r['designMention']}'")
            if r["kind"] == "healer":
                require(r.get("pad") in ("2x2", "3x2"), f"{rl}: a healer door has a 2x2 or 3x2 waiting pad")
                require(r.get("keeper") == h["id"], f"{rl}: the healer keeps the healer room")
            else:
                require("pad" not in r, f"{rl}: only healer doors have a pad")
            if "mapDoor" in r:
                require(r["status"] == "exists" and town["currentMap"] == "larkhaven", f"{rl}: only Larkhaven's rooms are in the game today")
                doors = game["MAPS"]["larkhaven"]["doors"]
                require(f"{r['mapDoor'][0]},{r['mapDoor'][1]}" in doors, f"{rl}: not a door on Larkhaven's map")
            if "keeper" in r:
                keeper_ids.add(r["keeper"])
        for p in town["outdoor"]:
            ol = f"{label}/{p['id']}"
            require({"id", "name", "status", "where"} <= set(p) <= {"id", "name", "status", "where", "note", "source"}, f"{ol}: unexpected fields")
            require(p["status"] in STATUSES, f"{ol}: bad status")
            require(p["where"] in places, f"{ol}: where is not a graph node")
            require(p["id"] not in outdoor_ids, f"{ol}: stands outdoors in two places")
            outdoor_ids.add(p["id"])
            known_person(p, ol)
            if p.get("source") != "game":
                require(p["name"] in row["text"], f"{ol}: the design's row for {town['name']} does not name {p['name']}")
        for extra in town.get("extraKeepers", []):
            known_person(extra, f"{label}/{extra['id']}")
            require(any(r["id"] == extra["room"] for r in rooms), f"{label}: extra keeper's room")
            keeper_ids.add(extra["id"])
        s = town["shelf"]
        if s is None:
            require(town["id"] == "league", f"{label}: only the league has no shelf")
        else:
            require(set(s) == {"keeper", "kind", "status", "room", "goods"}, f"{label}: shelf fields")
            require(s["kind"] in ("existing", "short", "full") and s["status"] in STATUSES, f"{label}: bad shelf kind or status")
            require(isinstance(s["goods"], list) and s["goods"] and set(s["goods"]) <= GOODS and len(set(s["goods"])) == len(s["goods"]),
                    f"{label}: a shelf holds lures and berries only")
            shelf_room = next((r for r in rooms if r["id"] == s["room"]), None)
            require(shelf_room is not None, f"{label}: shelf room is not in the town")
            if s["kind"] == "full":
                full_shelves += 1
                require(town["id"] == "stillreed" and shelf_room["kind"] == "shop" and s["keeper"] == "colm", "only Colm's shop is a full shop")
            elif s["kind"] == "short":
                require(s["keeper"] == h["id"] and shelf_room["kind"] == "healer", f"{label}: a short shelf is the healer's own")
            else:
                require(town["id"] == "larkhaven" and s["status"] == "exists", "only Larkhaven's shop exists today")
            require((s["kind"] == "existing") == (s["status"] == "exists"), f"{label}: shelf status and kind disagree")
        for feature in town.get("features", []):
            require(set(feature) >= {"id", "kind", "note"}, f"{label}: feature fields")
    require(healer_count == {"exists": 2, "proposed": 8}, "ten healers: two exist (Ned, Nelva), eight are proposed")
    require(full_shelves == 1, "Reedhold is the only new full shop")
    require(proposed_rooms == {"healer": 8, "shop": 1, "other": 2}, "eleven new interiors: eight healer rooms, Colm's shop, the ferry house and the net loft")
    require(keeper_ids.isdisjoint(outdoor_ids - {"maren"}), "a person is both a keeper and an outdoor person")
    require(len(proposed_people) == 9, "nine keepers are proposals (eight healers and Colm)")
    shelf_goods = doc["shelfGoods"]
    require(set(shelf_goods) == GOODS, "shelfGoods: lures and berries only")
    require(game["FOODS"]["berries"]["cost"] * shelf_goods["berries"]["bundle"] == shelf_goods["berries"]["cost"], "berries cost differs from the game's food table")
    require(re.search(r'"5 lures",\s*"give":\s*\{\s*"lures":\s*5\s*\},\s*"cost":\s*%d' % shelf_goods["lures"]["cost"], main_gd_text) is not None, "lures price differs from Juniper's shop")
    healer_towns = [t["id"] for t in towns]
    check_distances(graph, healer_towns)
    # the design's own worked examples
    adj = adjacency(graph, tide_ride=False)
    require("lanternquay" in adj["wrackline"], "Lantern Quay is one step off Wrackline")
    require("thornwood_route" in adj["larkhaven"] and "thornwood" in adj["thornwood_route"], "Larkhaven to Thornwood is one route")
    require("ashstair" in adj["saltmarsh"] and "emberfall" in adj["ashstair"], "the coast to Warmstep is Ashstair, one route")
    return True


class Base(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.doc = load_json(TOWNS)
        cls.graph = load_json(GRAPH)
        cls.game = load_json(GAME)
        cls.design = DESIGN.read_text(encoding="utf8")
        cls.main_gd = MAIN_GD.read_text(encoding="utf8")

    def run_validate(self, doc=None, graph=None):
        return validate(doc if doc is not None else self.doc, graph if graph is not None else self.graph, self.game, self.design, self.main_gd)

    def town(self, doc, tid):
        return next(t for t in doc["towns"] if t["id"] == tid)

    def assertRejected(self, mutate, graph_mutate=None):
        doc, graph = deepcopy(self.doc), deepcopy(self.graph)
        mutate(doc)
        if graph_mutate:
            graph_mutate(graph)
        with self.assertRaises(ValueError):
            validate(doc, graph, self.game, self.design, self.main_gd)


class TheFile(Base):
    def test_the_file_passes(self):
        self.assertTrue(self.run_validate())

    def test_ten_towns_in_the_graphs_order_with_the_graphs_names(self):
        self.assertEqual([t["id"] for t in self.doc["towns"]], [p["id"] for p in self.graph["places"] if p["kind"] == "town"])
        self.assertEqual(len(self.doc["towns"]), 10)

    def test_every_town_is_in_the_graph(self):
        ids = {p["id"] for p in self.graph["places"] if p["kind"] == "town"}
        for t in self.doc["towns"]:
            self.assertIn(t["graphNode"], ids)

    def test_the_design_table_has_the_same_ten_towns_and_healers(self):
        rows = design_rows(self.design)
        self.assertEqual([t["name"] for t in self.doc["towns"]], list(rows))
        for t in self.doc["towns"]:
            self.assertTrue(rows[t["name"]]["healer"].startswith(t["healer"]["name"]), t["id"])

    def test_two_healers_exist_and_eight_are_proposed(self):
        statuses = [t["healer"]["status"] for t in self.doc["towns"]]
        self.assertEqual(sorted(statuses), ["exists", "exists"] + ["proposed"] * 8)
        self.assertEqual({t["healer"]["name"] for t in self.doc["towns"] if t["healer"]["status"] == "exists"}, {"Old Ned", "Nelva"})

    def test_every_proposed_person_is_marked_proposed_and_is_new_to_the_game(self):
        cast = self.game["CAST"]
        proposed = []
        for t in self.doc["towns"]:
            for p in [t["healer"]] + t["outdoor"] + t.get("extraKeepers", []):
                if p["status"] == "proposed":
                    proposed.append(p["id"])
                    self.assertNotIn(p["id"], cast)
        self.assertEqual(sorted(set(proposed)), sorted(["hedda", "perrin", "hest", "yarrow", "juna", "colm", "iren", "solla", "quen"]))

    def test_outdoor_people_are_named_by_the_design_row_and_stay_outside(self):
        rows = design_rows(self.design)
        for t in self.doc["towns"]:
            for p in t["outdoor"]:
                if p.get("source") != "game":
                    self.assertIn(p["name"], rows[t["name"]]["text"])
        keepers = {r["keeper"] for t in self.doc["towns"] for r in t["rooms"] if "keeper" in r}
        outdoors = {p["id"] for t in self.doc["towns"] for p in t["outdoor"]}
        self.assertEqual(keepers & outdoors, {"maren"})  # Maren keeps the barn door but is on the lane today; see towns.md

    def test_no_save_key_or_new_field_is_named(self):
        text = TOWNS.read_text(encoding="utf8")
        for word in ("saveVersion", "SAVE_V", "story key", "storyKeys"):
            self.assertNotIn(word, text)


class Rooms(Base):
    def test_eleven_new_interiors(self):
        new = [r for t in self.doc["towns"] for r in t["rooms"] if r["status"] == "proposed"]
        self.assertEqual(len(new), 11)
        self.assertEqual(sorted(r["kind"] for r in new), ["healer"] * 8 + ["other"] * 2 + ["shop"])

    def test_ten_healer_doors_each_with_a_pad(self):
        healer_rooms = [r for t in self.doc["towns"] for r in t["rooms"] if r["kind"] == "healer"]
        self.assertEqual(len(healer_rooms), 10)
        self.assertEqual(sorted(r["pad"] for r in healer_rooms), ["2x2"] * 9 + ["3x2"])
        self.assertEqual(next(r["pad"] for r in self.town(self.doc, "emberfall")["rooms"]), "3x2")

    def test_door_sizes_are_the_designs(self):
        sizes = {r["id"]: r["door"]["size"] for t in self.doc["towns"] for r in t["rooms"]}
        self.assertEqual(sizes["boathouse_inn"], "20x24")
        self.assertEqual(sizes["meeting_hall"], "24x24")
        self.assertEqual(sizes["barn"], "16x26")
        for rid in ("gate_loft", "quay_inn", "net_loft", "spring_house", "lodge", "colms_shop", "ferry_house", "bell_house", "ledger_house"):
            self.assertEqual(sizes[rid], "12x24", rid)

    def test_larkhaven_rooms_are_the_games_doors(self):
        doors = self.game["MAPS"]["larkhaven"]["doors"]
        mapped = {tuple(r["mapDoor"]): r["id"] for r in self.town(self.doc, "larkhaven")["rooms"] if "mapDoor" in r}
        self.assertEqual({f"{x},{y}": rid for (x, y), rid in mapped.items()}, {"4,4": "inn", "18,4": "shop", "7,10": "barn"})
        self.assertEqual(set(doors.values()), {"inn", "shop", "ranch"})

    def test_room_ids_are_unique_across_the_file(self):
        ids = [r["id"] for t in self.doc["towns"] for r in t["rooms"]]
        self.assertEqual(len(ids), len(set(ids)))

    def test_broken_rooms_are_caught(self):
        self.assertRejected(lambda d: self.town(d, "thornwood")["rooms"][0]["door"].update(size="12 by 24"))
        self.assertRejected(lambda d: self.town(d, "thornwood")["rooms"][0].pop("pad"))
        self.assertRejected(lambda d: self.town(d, "thornwood")["rooms"][0].update(pad="1x1"))
        self.assertRejected(lambda d: self.town(d, "lanternquay")["rooms"].pop())  # a new interior is missing
        self.assertRejected(lambda d: self.town(d, "lanternquay")["rooms"].append(dict(self.town(d, "lanternquay")["rooms"][1], id="extra")))
        self.assertRejected(lambda d: self.town(d, "stillreed")["rooms"][1].update(designMention="Ned"))
        self.assertRejected(lambda d: self.town(d, "larkhaven")["rooms"][0].update(mapDoor=[1, 1]))
        self.assertRejected(lambda d: self.town(d, "thornwood")["rooms"].append(dict(self.town(d, "thornwood")["rooms"][0], id="second", name="A second healer room")))


class Shelves(Base):
    def test_only_reedhold_has_a_full_shop_and_it_is_colms(self):
        full = [(t["id"], t["shelf"]["keeper"]) for t in self.doc["towns"] if t["shelf"] and t["shelf"]["kind"] == "full"]
        self.assertEqual(full, [("stillreed", "colm")])

    def test_every_shelf_is_lures_and_berries_only(self):
        for t in self.doc["towns"]:
            if t["shelf"]:
                self.assertLessEqual(set(t["shelf"]["goods"]), {"lures", "berries"}, t["id"])
        self.assertEqual(set(self.doc["shelfGoods"]), {"lures", "berries"})

    def test_prices_are_the_games(self):
        self.assertEqual(self.game["FOODS"]["berries"]["cost"] * 5, self.doc["shelfGoods"]["berries"]["cost"])
        self.assertIn('"5 lures", "give": { "lures": 5 }, "cost": 50', self.main_gd)

    def test_eight_new_keepers_keep_a_short_shelf_and_the_league_has_none(self):
        kinds = {t["id"]: (t["shelf"] or {}).get("kind") for t in self.doc["towns"]}
        self.assertEqual(sorted(k for k in kinds.values() if k), ["existing", "full"] + ["short"] * 7)
        self.assertIsNone(self.town(self.doc, "league")["shelf"])

    def test_broken_shelves_are_caught(self):
        self.assertRejected(lambda d: self.town(d, "thornwood")["shelf"]["goods"].append("coins"))
        self.assertRejected(lambda d: self.town(d, "thornwood")["shelf"].update(kind="full"))
        self.assertRejected(lambda d: self.town(d, "thornwood")["shelf"].update(goods=[]))
        self.assertRejected(lambda d: self.town(d, "thornwood")["shelf"].update(keeper="isolde"))
        self.assertRejected(lambda d: d["shelfGoods"]["berries"].update(cost=99))
        self.assertRejected(lambda d: d["shelfGoods"]["lures"].update(cost=49))
        self.assertRejected(lambda d: self.town(d, "league").update(shelf=self.town(d, "thornwood")["shelf"]))


class People(Base):
    def test_existing_people_are_in_the_game(self):
        cast = self.game["CAST"]
        for t in self.doc["towns"]:
            for p in [t["healer"]] + t["outdoor"]:
                if p["status"] == "exists" and p["id"] not in ("ned", "juniper", "pip_mum", "pip_gran"):
                    self.assertIn(p["id"], cast, p["id"])

    def test_nobody_is_asked_to_stand_in_two_places(self):
        seen = set()
        for t in self.doc["towns"]:
            for p in t["outdoor"]:
                self.assertNotIn(p["id"], seen)
                seen.add(p["id"])

    def test_broken_people_are_caught(self):
        self.assertRejected(lambda d: self.town(d, "thornwood")["healer"].update(name="Hedwig"))
        self.assertRejected(lambda d: self.town(d, "thornwood")["healer"].update(status="exists"))
        self.assertRejected(lambda d: self.town(d, "thornwood")["outdoor"][0].update(status="proposed"))
        self.assertRejected(lambda d: self.town(d, "thornwood")["outdoor"][0].update(name="Isolda"))
        self.assertRejected(lambda d: self.town(d, "thornwood")["outdoor"][0].update(where="nowhere"))
        self.assertRejected(lambda d: self.town(d, "emberfall")["outdoor"].append(dict(self.town(d, "emberfall")["outdoor"][0])))
        self.assertRejected(lambda d: self.town(d, "thornwood")["healer"].update(cost=5))
        self.assertRejected(lambda d: self.town(d, "thornwood")["healer"].update(restsTeam=False))


class Distances(Base):
    def setUp(self):
        self.healer_towns = [t["id"] for t in self.doc["towns"]]

    def test_no_walkable_place_is_more_than_three_steps_from_a_healer(self):
        walk, swim = check_distances(self.graph, self.healer_towns)
        places = {p["id"]: p for p in self.graph["places"]}
        for pid, steps in walk.items():
            if places[pid]["kind"] != "cave":
                self.assertLessEqual(steps, 3, pid)
        self.assertLessEqual(max(s for p, s in swim.items() if places[p]["kind"] != "cave"), 3)

    def test_the_places_not_walkable_without_tide_ride_are_the_tide_ones(self):
        walk, swim = check_distances(self.graph, self.healer_towns)
        places = {p["id"]: p for p in self.graph["places"]}
        off_foot = {p for p in places if places[p]["kind"] != "cave" and not places[p].get("isLink") and p not in walk}
        self.assertEqual(off_foot, {"greywash", "quietchannels", "opengrey", "outershoal"})
        self.assertTrue(all(places[p]["kind"] == "water" or p == "outershoal" for p in off_foot))

    def test_the_designs_worked_examples(self):
        adj = adjacency(self.graph, tide_ride=False)
        self.assertIn("lanternquay", adj["wrackline"])
        self.assertEqual(steps_from_towns(self.graph, ["larkhaven"], False)["thornwood"], 2)  # one route between two towns
        self.assertEqual(steps_from_towns(self.graph, ["emberfall"], False)["saltmarsh"], 2)

    def test_glassfall_is_the_only_link_between_two_towns(self):
        places = {p["id"]: p for p in self.graph["places"]}
        joins = [l["id"] for l in self.graph["links"] if places[l["a"]]["kind"] == "town" and places[l["b"]]["kind"] == "town"]
        self.assertEqual(joins, ["glassfall"])

    def test_a_town_without_a_healer_would_break_the_rule(self):
        # Lantern Quay and Warmstep together cover the coast. Without them the Wrackline and Ashstair side is too far.
        far = [p for p in self.healer_towns if p not in ("lanternquay", "emberfall", "stillreed", "cloudglass")]
        with self.assertRaises(ValueError):
            check_distances(self.graph, far)

    def test_a_long_road_is_caught(self):
        graph = deepcopy(self.graph)
        graph["places"] += [{"id": f"extra{i}", "name": f"Extra {i}", "kind": "route", "phase": 1} for i in range(4)]
        links = [("larkhaven", "extra0"), ("extra0", "extra1"), ("extra1", "extra2"), ("extra2", "extra3")]
        graph["links"] += [{"a": a, "b": b, "gate": [], "phase": 1, "id": f"{a}--{b}"} for a, b in links]
        with self.assertRaises(ValueError):
            check_distances(graph, self.healer_towns)

    def test_a_walk_over_a_tide_link_is_not_walkable(self):
        walk, _ = check_distances(self.graph, self.healer_towns)
        self.assertNotIn("greywash", walk)
        self.assertNotIn("opengrey", walk)

    def test_two_towns_joined_with_no_route_are_caught(self):
        graph = deepcopy(self.graph)
        graph["links"].append({"a": "larkhaven", "b": "thornwood", "gate": [], "phase": 1, "id": "larkhaven--thornwood"})
        with self.assertRaises(ValueError):
            check_distances(graph, self.healer_towns)

    def test_whole_file_with_a_broken_graph_is_caught(self):
        graph = deepcopy(self.graph)
        graph["places"] = [p for p in graph["places"] if p["id"] != "lanternquay"]
        graph["links"] = [l for l in graph["links"] if "lanternquay" not in (l["a"], l["b"])]
        with self.assertRaises(ValueError):
            validate(self.doc, graph, self.game, self.design, self.main_gd)


class Shape(Base):
    def test_malformed_files_are_caught(self):
        self.assertRejected(lambda d: d.update(extra=1))
        self.assertRejected(lambda d: d["towns"].pop())
        self.assertRejected(lambda d: d["towns"].reverse())
        self.assertRejected(lambda d: self.town(d, "thornwood").update(graphNode="thorn"))
        self.assertRejected(lambda d: self.town(d, "thornwood").update(name="Thorn"))
        self.assertRejected(lambda d: self.town(d, "thornwood").update(currentMap=None))
        self.assertRejected(lambda d: self.town(d, "lanternquay").update(currentMap="lanternquay"))
        self.assertRejected(lambda d: self.town(d, "thornwood").update(extra=True))
        self.assertRejected(lambda d: d.update(schemaVersion=2))

    def test_duplicate_keys_are_rejected(self):
        with self.assertRaises(ValueError):
            json.loads('{"a": 1, "a": 2}', object_pairs_hook=unique_object)


if __name__ == "__main__":
    unittest.main()
