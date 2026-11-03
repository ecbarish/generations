"""Validate the WBW-11 planning data for proposed route trainers; this does not load or change a runtime map.

Run from the repository root: python3 -m unittest tools/test_wildbond_world_trainers.py
Standalone, like the other tools/test_wildbond_world_*.py tests: it reads the game's data, the design, world-graph.json,
gates.json, route-encounters.json and route-encounters.md, and changes nothing. Nothing here is added to CI.
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
WORLD = ROOT / "docs/plans/wildbond-world"
DATA = WORLD / "trainers.json"
GAME = ROOT / "wildbond-godot/data/wildbond.json"
EVOLUTION = ROOT / "wildbond-godot/data/evolution.json"
DESIGN = ROOT / "docs/plans/wildbond-world-design.md"
GRAPH = WORLD / "world-graph.json"
GATES = WORLD / "gates.json"
ENCOUNTERS = WORLD / "route-encounters.json"
ENCOUNTER_NOTES = WORLD / "route-encounters.md"
BADGES = ["thorn", "tide", "ember", "beacon", "reed", "echo", "loom", "horizon"]
ROOT_KEYS = {"schemaVersion", "source", "status", "levelPolicy", "routes"}
POLICY_KEYS = {"unit", "max_offset", "note"}
ROUTE_KEYS = {"name", "badges_first_reachable", "recommended_badges", "trainers"}
TRAINER_KEYS = {"id", "name", "status", "team"}
MEMBER_KEYS = {"species", "level_offset"}
UNIQUE_IDS = {"elderhorn", "breakwatermane", "hearthcrown", "lanterncrest", "stillwake", "undertone",
              "meadowmantle", "watchlight", "veilmote"}
EXCLUDED_SPECIES = UNIQUE_IDS | {"kilnback"}  # WBW-5 also keeps Kilnback out of the roads
# The four routes that WBW-5 gives no table. Their country is the one the design's table puts them in.
EXTRA_ROUTES = {"thornwood_route": "thornwood", "saltmarsh_route": "saltmarsh", "glassfall": "cloudglass", "crestpath": "cloudglass"}
# Recommended-order badge counts for those four; the test derives each one from the graph rather than trusting this table.
EXTRA_FLOORS = {"thornwood_route": 0, "saltmarsh_route": 1, "glassfall": 4, "crestpath": 3}
MIN_LEVEL = 2


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
    """The 20 route ids and names, in the order of section 2's Routes table."""
    section = design.split("### Routes (20)", 1)
    require(len(section) == 2, "design: Routes (20) section missing")
    table = section[1].split("### Towns (10)", 1)[0]
    rows = re.findall(r"^\| \d+ \| `([^`]+)` \| ([^|]+?) \|", table, re.MULTILINE)
    require(len(rows) == 20 and len({r for r, _ in rows}) == 20, "design: the route table is no longer 20 distinct routes")
    return rows


def recommended_floors(notes, encounters):
    """WBW-5's first-visit badge counts for its sixteen routes, read from its note's table."""
    floors = {r: int(f) for r, f in re.findall(r"^\| `([a-z]+)` \| [A-Za-z]+ \| [\d\u2013]+ \| (\d) / \d+", notes, re.MULTILINE)}
    require(set(floors) == set(encounters["routes"]) and len(floors) == 16, "route-encounters.md: floor table changed")
    return floors


def open_places(graph, gates, held):
    """Places and links reachable from Larkhaven holding exactly the badges in `held`, with the ropes down (WB-WORLD-ORDER).

    A field lesson counts as learned once the badge its teacher gives is held. An element gate is a partner on the team and
    needs no badge. A story gate is not assumed. Links named in `ropesUntilOrder` are not gated here: that list is what
    the order phase removes.
    """
    teaching = {lesson["id"]: lesson["teachingBadge"] for lesson in gates["lessons"]}
    held = set(held)

    def passable(link):
        for gate in link["gate"]:
            if "badge" in gate:
                if gate["badge"] not in held:
                    return False
            elif "badges" in gate:
                if set(graph["badges"]) - held:
                    return False
            elif "field" in gate:
                if teaching[gate["field"]] not in held:
                    return False
            elif "element" in gate:
                continue
            else:
                return False
        return True
    open_links = [link for link in graph["links"] if passable(link)]
    adjacency = {}
    for link in open_links:
        adjacency.setdefault(link["a"], []).append(link["b"])
        if not link.get("oneWay"):
            adjacency.setdefault(link["b"], []).append(link["a"])
    seen, queue = {"larkhaven"}, deque(["larkhaven"])
    while queue:
        here = queue.popleft()
        for there in adjacency.get(here, []):
            if there not in seen:
                seen.add(there)
                queue.append(there)
    # A route drawn as one link (Glassfall) is reached when the link is open and its upper end is walked to.
    links = {link["id"] for link in open_links if link["a"] in seen and not link["id"].count("--")}
    return seen | links


def first_reachable_badges(graph, gates, route):
    """The fewest badges, in any order, that reach `route` once the ropes are down. Tide needs Thorn: Nerys is past the Thorn rope."""
    for count in range(len(graph["badges"]) + 1):
        for held in combinations(graph["badges"], count):
            if "tide" in held and "thorn" not in held:
                continue
            if route in open_places(graph, gates, held):
                return count
    raise ValueError(f"{route} cannot be reached with every badge held")


def catalogue(game, evolution):
    return game["SPECIES"] | evolution["species"]


def country_pool(game, evolution, country):
    """BIOMES[country].wild plus evolution.json's extras for that map, as route-encounters.md defines a country's pool."""
    pool = {s if isinstance(s, str) else s[0] for s in game["BIOMES"][country]["wild"]}
    pool |= {s for s, _ in evolution["wild"].get(country, [])}
    return pool


def forbidden_names(game):
    """Every name a trainer here must not reuse: the Wardens, the cast, the story names, and any word in the design or data."""
    words = set()
    words |= {k.lower() for k in game["CAST"]}
    for person in game["CAST"].values():
        words |= {w.lower() for w in re.findall(r"[A-Za-z]+", person["name"])}
    words |= {n.lower() for n in game["STORY_NAMES"] + game["MORE_NAMES"]}
    words.add(game["RIVAL"]["name"].lower())
    for placed in game["MAPS"].values():
        words |= {npc["who"].lower() for npc in placed.get("npcs", [])}
    texts = [DESIGN.read_text(encoding="utf-8")]
    for path in sorted(WORLD.iterdir()):
        if path.suffix in (".json", ".md") and not path.name.startswith("trainers"):
            texts.append(path.read_text(encoding="utf-8"))
    return words, "\n".join(texts).lower()


def resolve(cap, offset):
    return cap + offset


def validate(data, game=None, evolution=None, design=None, graph=None, gates=None, encounters=None, notes=None):
    """Raise ValueError for malformed planning data, without mutating any input. Returns a short summary."""
    game = game if game is not None else load(GAME)
    evolution = evolution if evolution is not None else load(EVOLUTION)
    design = design if design is not None else DESIGN.read_text(encoding="utf-8")
    graph = graph if graph is not None else load(GRAPH)
    gates = gates if gates is not None else load(GATES)
    encounters = encounters if encounters is not None else load(ENCOUNTERS)
    notes = notes if notes is not None else ENCOUNTER_NOTES.read_text(encoding="utf-8")
    caps = game["CAP_TABLE"]
    require(list(game["BADGES"]) == BADGES and list(graph["badges"]) == BADGES and len(caps) == len(BADGES) + 1,
            "badge progression changed; reconcile the caps")
    exact_keys(data, ROOT_KEYS, "trainers")
    require(data["schemaVersion"] == 1 and data["status"] == "proposed", "schemaVersion 1 and a proposed status")
    require(isinstance(data["source"], str) and "wildbond-world-design.md" in data["source"], "source must name the design")
    policy = data["levelPolicy"]
    exact_keys(policy, POLICY_KEYS, "levelPolicy")
    require(policy["max_offset"] == 0 and type(policy["max_offset"]) is int, "levels stay inside the cap: the largest offset is 0")
    require(isinstance(policy["unit"], str) and "CAP_TABLE" in policy["unit"] and isinstance(policy["note"], str), "levelPolicy text")

    # Every route in the design's table, in order, and no other.
    expected = design_routes(design)
    routes = data["routes"]
    require(isinstance(routes, dict) and list(routes) == [r for r, _ in expected], "routes must be exactly the 20 in the design, in order")
    graph_ids = {p["id"] for p in graph["places"]} | {l["id"] for l in graph["links"]}
    floors = recommended_floors(notes, encounters)
    floors.update(EXTRA_FLOORS)
    # The four extra floors follow from the graph: Crest Path hangs off Cloudglass beside Pass Foot's far side; Glassfall needs Glide.
    teaching = {lesson["id"]: lesson["teachingBadge"] for lesson in gates["lessons"]}
    thorn_rope = next(l for l in graph["links"] if l["id"] == "thornwood--saltmarsh_route")
    require(floors["thornwood_route"] == 0 and thorn_rope["gate"] == [{"badge": "thorn"}]
            and floors["saltmarsh_route"] == BADGES.index("thorn") + 1
            and floors["crestpath"] == floors["sootpath"] and floors["glassfall"] == BADGES.index(teaching["glide"]) + 1,
            "the four routes without a WBW-5 floor no longer follow from the graph and the lessons")
    names, ids, corpus = set(), set(), forbidden_names(game)
    forbidden, text = corpus
    species_table = catalogue(game, evolution)
    total, members, spread = 0, 0, {}
    for (route, name), (key, record) in zip(expected, routes.items()):
        exact_keys(record, ROUTE_KEYS, key)
        require(record["name"] == name, f"{key}: name differs from the design's table")
        require(key in graph_ids, f"{key}: not a place or link in world-graph.json")
        first = record["badges_first_reachable"]
        require(type(first) is int and 0 <= first <= len(BADGES), f"{key}: badges_first_reachable must be an integer from 0 to 8")
        require(first == first_reachable_badges(graph, gates, key), f"{key}: badges_first_reachable differs from the graph under WB-WORLD-ORDER")
        anchor = record["recommended_badges"]
        require(type(anchor) is int and anchor == floors[key], f"{key}: recommended_badges differs from WBW-5's first-visit floor")
        require(first <= anchor, f"{key}: a route cannot open later under open order than in the recommended order")
        trainers = record["trainers"]
        require(isinstance(trainers, list) and 1 <= len(trainers) <= 4, f"{key}: one to four trainers")
        if key in encounters["routes"]:
            country, band = encounters["routes"][key]["biome"], encounters["routes"][key]["lv"]
        else:
            country = EXTRA_ROUTES[key]
            band = game["BIOMES"][country]["lv"]
        pool = country_pool(game, evolution, country) - EXCLUDED_SPECIES
        lo, hi = band
        for index, trainer in enumerate(trainers, start=1):
            exact_keys(trainer, TRAINER_KEYS, f"{key} trainer")
            require(trainer["id"] == f"{key}-{index}" and trainer["id"] not in ids, f"{key}: trainer ids run {key}-1, {key}-2 and so on")
            ids.add(trainer["id"])
            require(trainer["status"] == "proposed", f"{trainer['id']}: every trainer here is proposed")
            who = trainer["name"]
            require(isinstance(who, str) and re.fullmatch(r"[A-Z][a-z]{2,11}", who) is not None, f"{trainer['id']}: a name is one capitalised word")
            low = who.lower()
            require(low not in names, f"{who}: two trainers share a name")
            names.add(low)
            require(low not in forbidden and re.search(r"\b" + re.escape(low) + r"\b", text) is None,
                    f"{who}: reuses a Warden, cast, story or other named person")
            team = trainer["team"]
            require(isinstance(team, list) and 1 <= len(team) <= 3, f"{trainer['id']}: a team is one to three")
            seen_species, last = set(), None
            for member in team:
                exact_keys(member, MEMBER_KEYS, f"{trainer['id']} member")
                species, offset = member["species"], member["level_offset"]
                require(isinstance(species, str) and species in species_table, f"{trainer['id']}: species is not in the catalogue")
                require(species not in EXCLUDED_SPECIES and not species_table[species].get("unique", False),
                        f"{trainer['id']}: no unique creature, and no Kilnback")
                require(species in pool, f"{trainer['id']}: {species} is not in {country}'s pool")
                require(species not in seen_species, f"{trainer['id']}: a creature twice on one team")
                seen_species.add(species)
                require(type(offset) is int and offset <= policy["max_offset"], f"{trainer['id']}: the offset must be a whole number, zero or below")
                at_anchor = resolve(caps[anchor], offset)
                require(lo <= at_anchor <= hi, f"{trainer['id']}: level {at_anchor} at {anchor} badges is outside the route's band {lo} to {hi}")
                at_first = resolve(caps[first], offset)
                require(MIN_LEVEL <= at_first <= caps[first], f"{trainer['id']}: level {at_first} at {first} badges is outside 2 to the cap")
                require(last is None or offset >= last, f"{trainer['id']}: the team runs lead to ace, so offsets do not fall")
                last = offset
                members += 1
        total += len(trainers)
        spread[key] = (first, anchor)
    return {"routes": len(routes), "trainers": total, "creatures": members, "names": len(names)}


class TrainerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = load(DATA)
        cls.game = load(GAME)
        cls.evolution = load(EVOLUTION)
        cls.design = DESIGN.read_text(encoding="utf-8")
        cls.graph = load(GRAPH)
        cls.gates = load(GATES)
        cls.encounters = load(ENCOUNTERS)
        cls.notes = ENCOUNTER_NOTES.read_text(encoding="utf-8")

    def check(self, data, **kw):
        args = {"game": self.game, "evolution": self.evolution, "design": self.design, "graph": self.graph,
                "gates": self.gates, "encounters": self.encounters, "notes": self.notes}
        args.update(kw)
        return validate(data, **args)

    def test_blueprint_matches_the_design_and_the_game(self):
        result = self.check(self.data)
        self.assertEqual(result["routes"], 20)
        print("WBW-11 trainers:", result)

    def test_validation_does_not_mutate_input(self):
        before = deepcopy(self.data)
        self.check(self.data)
        self.assertEqual(before, self.data)

    def test_no_route_is_missing_and_each_has_one_to_four_trainers(self):
        expected = [r for r, _ in design_routes(self.design)]
        self.assertEqual(list(self.data["routes"]), expected)
        counts = {r: len(v["trainers"]) for r, v in self.data["routes"].items()}
        self.assertTrue(all(1 <= n <= 4 for n in counts.values()), counts)
        print("WBW-11 trainers per route:", counts)

    def test_every_team_is_one_to_three_of_catalogue_species(self):
        table = catalogue(self.game, self.evolution)
        for route, record in self.data["routes"].items():
            for trainer in record["trainers"]:
                self.assertTrue(1 <= len(trainer["team"]) <= 3, trainer["id"])
                for member in trainer["team"]:
                    self.assertIn(member["species"], table, trainer["id"])
                    self.assertFalse(table[member["species"]].get("unique", False), trainer["id"])

    def test_first_reachable_counts_come_from_the_graph_with_the_ropes_down(self):
        got = {r: v["badges_first_reachable"] for r, v in self.data["routes"].items()}
        for route, count in got.items():
            self.assertEqual(first_reachable_badges(self.graph, self.gates, route), count, route)
        # After Thorn and Tide, every road the order phase frees is walkable; only Glassfall waits for Vessa's Glide.
        self.assertEqual({r for r, n in got.items() if n == 0}, {"thornwood_route", "millgrass", "dewcut", "rootwater"})
        self.assertEqual({r for r, n in got.items() if n == 1}, {"saltmarsh_route", "wrackline"})
        self.assertEqual({r for r, n in got.items() if n == 3}, {"glassfall"})
        self.assertEqual({r for r, n in got.items() if n == 2}, set(got) - {"thornwood_route", "millgrass", "dewcut", "rootwater",
                                                                           "saltmarsh_route", "wrackline", "glassfall"})
        print("WBW-11 badges at first reach, ropes down:", got)

    def test_each_rope_that_the_order_phase_removes_would_have_cost_more_badges(self):
        ropes = {r["link"]: r["badge"] for r in self.graph["ropesUntilOrder"]}
        self.assertEqual(set(ropes.values()), {"ember", "beacon", "reed", "echo", "loom"})
        for route, record in self.data["routes"].items():
            self.assertLessEqual(record["badges_first_reachable"], record["recommended_badges"], route)
        self.assertLess(self.data["routes"]["trialroad"]["badges_first_reachable"], self.data["routes"]["trialroad"]["recommended_badges"])

    def test_levels_stay_inside_the_cap_at_every_badge_count_a_route_can_be_met(self):
        caps = self.game["CAP_TABLE"]
        for route, record in self.data["routes"].items():
            for count in range(record["badges_first_reachable"], len(BADGES) + 1):
                for trainer in record["trainers"]:
                    for member in trainer["team"]:
                        level = caps[count] + member["level_offset"]
                        self.assertLessEqual(level, caps[count], trainer["id"])
                        self.assertGreaterEqual(level, MIN_LEVEL, trainer["id"])
        # Same trainer, more badges, higher level: the offset is the whole of what is stored.
        trainer = self.data["routes"]["trialroad"]["trainers"][-1]
        low, high = (caps[2] + trainer["team"][0]["level_offset"], caps[7] + trainer["team"][0]["level_offset"])
        self.assertLess(low, high)

    def test_levels_sit_in_each_routes_own_band_at_the_recommended_count(self):
        caps = self.game["CAP_TABLE"]
        report = {}
        for route, record in self.data["routes"].items():
            band = self.encounters["routes"][route]["lv"] if route in self.encounters["routes"] else self.game["BIOMES"][EXTRA_ROUTES[route]]["lv"]
            levels = [caps[record["recommended_badges"]] + m["level_offset"] for t in record["trainers"] for m in t["team"]]
            self.assertTrue(band[0] <= min(levels) and max(levels) <= band[1], route)
            report[route] = (min(levels), max(levels))
        print("WBW-11 levels at the recommended badge count:", report)

    def test_no_warden_story_character_or_existing_person_is_reused(self):
        forbidden, text = forbidden_names(self.game)
        for warden in ("isolde", "nerys", "toren", "vessa", "olan", "senna", "halen", "rysa"):
            self.assertIsNotNone(re.search(r"\b" + warden + r"\b", text), warden)
        names = [t["name"].lower() for r in self.data["routes"].values() for t in r["trainers"]]
        self.assertEqual(len(names), len(set(names)))
        for name in names:
            self.assertNotIn(name, forbidden)
            self.assertIsNone(re.search(r"\b" + name + r"\b", text), name)
        placed = {npc["who"].lower() for m in self.game["MAPS"].values() for npc in m.get("npcs", []) if "trainer" in npc}
        self.assertTrue(placed and not (placed & set(names)))

    def test_every_trainer_is_proposed_and_carries_no_lines(self):
        for record in self.data["routes"].values():
            for trainer in record["trainers"]:
                self.assertEqual(set(trainer), TRAINER_KEYS)
                self.assertEqual(trainer["status"], "proposed")

    def test_every_route_is_a_place_or_link_in_the_graph(self):
        ids = {p["id"] for p in self.graph["places"]} | {l["id"] for l in self.graph["links"]}
        self.assertTrue(set(self.data["routes"]) <= ids)
        glassfall = next(l for l in self.graph["links"] if l["id"] == "glassfall")
        self.assertTrue(glassfall.get("oneWay"))

    def test_the_four_routes_without_a_wbw5_table_are_the_ones_the_design_adds(self):
        self.assertEqual(set(self.data["routes"]) - set(self.encounters["routes"]), set(EXTRA_ROUTES))
        self.assertEqual(len(self.encounters["routes"]), 16)

    def test_source_changes_are_not_hidden(self):
        changed = deepcopy(self.game)
        changed["CAP_TABLE"][4] = 50
        with self.assertRaises(ValueError):
            self.check(self.data, game=changed)
        shallow = deepcopy(self.game)
        shallow["CAP_TABLE"][2] = 20  # Pass Foot opens at two badges; an offset of -21 would then be below level 2
        with self.assertRaises(ValueError):
            self.check(self.data, game=shallow)
        gone = deepcopy(self.game)
        del gone["SPECIES"][self.data["routes"]["millgrass"]["trainers"][0]["team"][0]["species"]]
        with self.assertRaises(ValueError):
            self.check(self.data, game=gone)
        unique = deepcopy(self.game)
        unique["SPECIES"][self.data["routes"]["millgrass"]["trainers"][0]["team"][0]["species"]]["unique"] = True
        with self.assertRaises(ValueError):
            self.check(self.data, game=unique)
        # A route that stops being listed in the design is caught.
        with self.assertRaises(ValueError):
            self.check(self.data, design=self.design.replace("| 20 | `trialroad` |", "| 20 | `trialroadx` |"))

    def test_a_graph_that_changes_who_can_reach_a_route_is_caught(self):
        graph = deepcopy(self.graph)
        for link in graph["links"]:
            if link["id"] == "saltmarsh--ashstair":
                link["gate"] = []
        with self.assertRaises(ValueError):
            self.check(self.data, graph=graph)
        graph = deepcopy(self.graph)
        for link in graph["links"]:
            if link["id"] == "glassfall":
                link["gate"] = []
        with self.assertRaises(ValueError):
            self.check(self.data, graph=graph)

    def test_malformed_data_is_rejected(self):
        cases = []
        first = self.data["routes"]["millgrass"]

        def changed(label, path, value):
            data = deepcopy(self.data)
            owner = data
            for part in path[:-1]:
                owner = owner[part]
            owner[path[-1]] = value
            cases.append((label, data))
        for value in (None, [], "trainers", 1, True):
            cases.append(("bad root", value))
        for key in self.data:
            data = deepcopy(self.data)
            del data[key]
            cases.append(("missing " + key, data))
        data = deepcopy(self.data)
        data["extra"] = 1
        cases.append(("extra root key", data))
        for key in ROUTE_KEYS:
            data = deepcopy(self.data)
            del data["routes"]["millgrass"][key]
            cases.append(("missing route key " + key, data))
        for key in TRAINER_KEYS:
            data = deepcopy(self.data)
            del data["routes"]["millgrass"]["trainers"][0][key]
            cases.append(("missing trainer key " + key, data))
        for key in MEMBER_KEYS:
            data = deepcopy(self.data)
            del data["routes"]["millgrass"]["trainers"][0]["team"][0][key]
            cases.append(("missing member key " + key, data))
        data = deepcopy(self.data)
        del data["routes"]["trialroad"]
        cases.append(("a route missing", data))
        data = deepcopy(self.data)
        data["routes"]["madeup"] = data["routes"].pop("trialroad")
        cases.append(("a foreign route", data))
        data = deepcopy(self.data)
        data["routes"] = dict(reversed(list(data["routes"].items())))
        cases.append(("routes out of order", data))
        m = ["routes", "millgrass"]
        t = m + ["trainers", 0]
        mem = t + ["team", 0]
        for label, path, value in [
            ("status", ["status"], "canon"), ("version", ["schemaVersion"], 2), ("source", ["source"], "somewhere"),
            ("policy offset", ["levelPolicy", "max_offset"], 1), ("policy offset type", ["levelPolicy", "max_offset"], False),
            ("policy unit", ["levelPolicy", "unit"], "a fixed level"), ("policy extra", ["levelPolicy", "fixed"], 5),
            ("route name", m + ["name"], "Millgrass Road"),
            ("first reachable", m + ["badges_first_reachable"], 1), ("first reachable type", m + ["badges_first_reachable"], "0"),
            ("first reachable bool", m + ["badges_first_reachable"], False), ("first reachable big", m + ["badges_first_reachable"], 9),
            ("recommended", m + ["recommended_badges"], 1), ("recommended type", m + ["recommended_badges"], None),
            ("no trainers", m + ["trainers"], []), ("five trainers", m + ["trainers"], first["trainers"] * 3),
            ("trainers type", m + ["trainers"], None),
            ("trainer id", t + ["id"], "millgrass-2"), ("trainer id style", t + ["id"], "m1"),
            ("trainer status", t + ["status"], "canon"), ("trainer status missing", t + ["status"], None),
            ("name empty", t + ["name"], ""), ("name two words", t + ["name"], "Old Aubin"), ("name type", t + ["name"], 5),
            ("name lowercase", t + ["name"], "aubin"), ("name digits", t + ["name"], "Aubin2"),
            ("name is a warden", t + ["name"], "Isolde"), ("name is nerys", t + ["name"], "Nerys"),
            ("name is a cast member", t + ["name"], "Maren"), ("name is the rival", t + ["name"], "Wren"),
            ("name is a placed trainer", t + ["name"], "Bram"), ("name is a story name", t + ["name"], "Rowan"),
            ("name is a village name", t + ["name"], "Nora"), ("name is a keeper", t + ["name"], "Hedda"),
            ("name duplicates another trainer", t + ["name"], first["trainers"][1]["name"]),
            ("name differs only by case", t + ["name"], first["trainers"][1]["name"].upper()),
            ("empty team", t + ["team"], []), ("team of four", t + ["team"], first["trainers"][1]["team"] * 2),
            ("team type", t + ["team"], "seedpip"), ("team null", t + ["team"], None),
            ("species unknown", mem + ["species"], "madeup"), ("species type", mem + ["species"], 5),
            ("species unique", mem + ["species"], "undertone"), ("species kilnback", mem + ["species"], "kilnback"),
            ("species of another country", mem + ["species"], "brineskit"), ("species null", mem + ["species"], None),
            ("offset positive", mem + ["level_offset"], 1), ("offset zero too high", mem + ["level_offset"], 0),
            ("offset float", mem + ["level_offset"], -11.5), ("offset bool", mem + ["level_offset"], True),
            ("offset string", mem + ["level_offset"], "-11"), ("offset too low", mem + ["level_offset"], -14),
            ("offset null", mem + ["level_offset"], None), ("offset huge", mem + ["level_offset"], -99),
            ("member extra", mem + ["level"], 5),
        ]:
            changed(label, path, value)
        data = deepcopy(self.data)
        data["routes"]["millgrass"]["trainers"][1]["team"][1]["species"] = data["routes"]["millgrass"]["trainers"][1]["team"][0]["species"]
        cases.append(("a creature twice on a team", data))
        data = deepcopy(self.data)
        team = data["routes"]["thornwood_route"]["trainers"][1]["team"]
        team[0]["level_offset"], team[1]["level_offset"] = team[1]["level_offset"], team[0]["level_offset"]
        cases.append(("a team that falls from lead to ace", data))
        data = deepcopy(self.data)
        data["routes"]["thornwood_route"]["trainers"][0]["team"][0]["level_offset"] = -14
        cases.append(("a level under the band", data))
        data = deepcopy(self.data)
        data["routes"]["millgrass"]["trainers"][1]["team"][-1]["level_offset"] = -9
        cases.append(("a level over the band", data))
        for label, data in cases:
            with self.subTest(label=label), self.assertRaises(ValueError):
                self.check(data)
        print(f"WBW-11 malformed fixtures: {len(cases)} rejected.")

    def test_strict_json_rejects_duplicate_keys_and_nonfinite_numbers(self):
        for text in ('{"id":1,"id":2}', '{"routes":{"millgrass":{},"millgrass":{}}}', '{"x":NaN}', '{"x":Infinity}',
                     '{"x":-Infinity}', '{"x":1e309}', '{"x":-1e309}'):
            with self.subTest(text=text), self.assertRaises(ValueError):
                load_json(text)


if __name__ == "__main__":
    unittest.main()
