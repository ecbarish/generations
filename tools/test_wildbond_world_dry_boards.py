#!/usr/bin/env python3
"""WBW-18: planning-only Dry Boards descriptor and directional world-loop checks.

Run: python3 -m unittest tools/test_wildbond_world_dry_boards.py
No packages, runtime imports, writes, or save changes. World-design section 2 and
#373 comment 6186013258 are the contracts. The graph represents the finished,
open-order valley. Its historical ropes are overlaid only in the named pre-order
regression. Before Glide, the Pass Ring is a return walk through Pass Foot, not
a claim that Glassfall can be climbed. 'Does not reach Bellstep' means the passage
does not bypass Olan's gate, not that the ordinary Late Path stops existing.

The descriptor is not a tile map. It preserves the graph's Reedhold approach to
a passage inside Long Boards and leaves all physical landings unresolved. Future
map wiring must resolve them in its own approved contract; no geometric or
playable-map approval is supplied here.
"""
import copy
import itertools
import json
import unittest
from collections import deque
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIR = ROOT / "docs/plans/wildbond-world"
BADGES = ("thorn", "tide", "ember", "beacon", "reed", "echo", "loom", "horizon")
LESSONS = ("stone", "tide", "grove", "lantern", "glide", "hush", "daymark")
SOURCE = "docs/plans/wildbond-world-design.md"
APPEARANCE = "The Dry Boards are a covered walk, lamplit, clearly not a cave."
PASS_WALK = ("cloudglass", "passfoot", "dryboards", "stillreed", "passfoot", "cloudglass")
PASS_GLIDE = ("cloudglass", "stillreed", "dryboards", "passfoot", "cloudglass")
COAST = ("lanternquay", "greywash", "opengrey", "seaward", "farwatch", "sheltermile",
         "sunthread", "ribbonroad", "hollowecho", "latepath", "stillreed", "passfoot",
         "cloudglass", "sootpath", "emberfall", "ashstair", "saltmarsh", "wrackline", "lanternquay")
HOME = ("millgrass", "larkburrow", "sunthread")


def require(ok, message):
    if not ok:
        raise ValueError(message)


def exact_keys(value, keys, where):
    require(type(value) is dict and set(value) == set(keys), where + ": wrong fields or object type")


def same(value, expected, where):
    # bool is a subclass of int; equality alone would accept True as schemaVersion.
    require(type(value) is type(expected) and value == expected, where + ": unexpected value or type")


def load(path):
    def pairs(items):
        out = {}
        for key, value in items:
            require(key not in out, "duplicate JSON key: " + key)
            out[key] = value
        return out

    def invalid_constant(value):
        raise ValueError("non-finite JSON number: " + value)

    return json.loads(path.read_text(encoding="utf-8"), object_pairs_hook=pairs,
                      parse_constant=invalid_constant)


def graph_index(graph):
    """Validate types before any traversal, and never silently collapse duplicates."""
    require(type(graph) is dict, "graph: expected object")
    require(type(graph.get("places")) is list and graph["places"], "graph: places must be a nonempty list")
    require(type(graph.get("links")) is list and graph["links"], "graph: links must be a nonempty list")
    same(graph.get("badges"), list(BADGES), "graph badges")
    same(graph.get("fieldLessons"), list(LESSONS), "graph field lessons")
    places, links, pairs = {}, {}, set()
    for place in graph["places"]:
        require(type(place) is dict, "place: expected object")
        pid = place.get("id")
        require(type(pid) is str and pid and pid not in places, "duplicate or invalid place id")
        require(type(place.get("phase")) is int and 0 <= place["phase"] <= 6, "place phase")
        require(type(place.get("kind")) is str, "place kind")
        if "isLink" in place:
            require(type(place["isLink"]) is bool, "place isLink")
        places[pid] = place
    required = {"id", "a", "b", "gate", "phase"}
    optional = {"note", "oneWay", "loop", "extraToFlowchart", "needsBothEndsWalked"}
    values = {"badge": BADGES, "badges": ("all",), "field": LESSONS,
              "element": ("Stone", "Tide"), "story": ("leagueEnding",)}
    for link in graph["links"]:
        require(type(link) is dict and required <= set(link) <= required | optional, "link fields")
        lid, a, b = link["id"], link["a"], link["b"]
        require(type(lid) is str and lid and lid not in links, "duplicate or invalid link id")
        require(type(a) is str and type(b) is str and a in places and b in places and a != b,
                "link endpoints")
        require(not places[a].get("isLink") and not places[b].get("isLink"), "link endpoint is not a map node")
        pair = frozenset((a, b))
        require(pair not in pairs, "duplicate link endpoints")
        pairs.add(pair)
        require(type(link["phase"]) is int and max(places[a]["phase"], places[b]["phase"]) <= link["phase"] <= 6,
                "link phase")
        for flag in optional - {"note"}:
            if flag in link:
                require(type(link[flag]) is bool, "link flag: " + flag)
        if "note" in link:
            require(type(link["note"]) is str and link["note"].strip(), "link note")
        require(type(link["gate"]) is list, "link gate")
        seen = set()
        for req in link["gate"]:
            require(type(req) is dict and len(req) == 1, "gate requirement")
            key, val = next(iter(req.items()))
            require(key in values and type(val) is str and val in values[key], "unknown gate")
            require((key, val) not in seen, "duplicate gate requirement")
            seen.add((key, val))
        links[lid] = link
    ropes = graph.get("ropesUntilOrder")
    require(type(ropes) is list, "graph ropes")
    rope_ids = set()
    for rope in ropes:
        require(type(rope) is dict and {"link", "badge"} <= set(rope) <= {"link", "badge", "note"}, "rope fields")
        require(type(rope["link"]) is str and rope["link"] in links and rope["link"] not in rope_ids, "rope link")
        require(type(rope["badge"]) is str and rope["badge"] in BADGES, "rope badge")
        rope_ids.add(rope["link"])
    return places, links


def gate_met(gate, badges=(), lessons=(), elements=(), story=()):
    have = {"badge": set(badges), "field": set(lessons), "element": set(elements), "story": set(story)}
    return all(set(BADGES) <= have["badge"] if kind == "badges" else value in have[kind]
               for req in gate for kind, value in req.items())


def step(links, a, b, badges=(), lessons=(), pre_order=(), elements=(), story=()):
    for link in links.values():
        if (a, b) != (link["a"], link["b"]) and ((a, b) != (link["b"], link["a"]) or link.get("oneWay")):
            continue
        gate = link["gate"] + [{"badge": r["badge"]} for r in pre_order if r["link"] == link["id"]]
        if gate_met(gate, badges, lessons, elements, story):
            return True
    return False


def walk(links, path, badges=(), lessons=()):
    return all(step(links, a, b, badges, lessons) for a, b in zip(path, path[1:]))


def reach(links, start, badges=(), lessons=(), pre_order=(), elements=(), story=()):
    seen, queue = {start}, deque([start])
    while queue:
        here = queue.popleft()
        for link in links.values():
            if here not in (link["a"], link["b"]):
                continue
            there = link["b"] if here == link["a"] else link["a"]
            if there not in seen and step({link["id"]: link}, here, there, badges, lessons, pre_order, elements, story):
                seen.add(there)
                queue.append(there)
    return seen


def validate_descriptor(data, graph):
    places, links = graph_index(graph)
    exact_keys(data, ("schemaVersion", "status", "id", "name", "kind", "containedIn", "phase",
                      "source", "placement", "connections", "gate", "oneWay", "integration"), "descriptor")
    for key, value in {"schemaVersion": 1, "status": "proposed", "id": "dryboards", "name": "The Dry Boards",
                       "kind": "passage", "containedIn": "longboards", "phase": 1, "gate": [], "oneWay": False}.items():
        same(data[key], value, key)
    require(places.get("dryboards", {}).get("kind") == "other" and
            places["dryboards"].get("role") == "passage" and places["dryboards"]["phase"] == 1, "graph passage identity")
    require(places.get("longboards", {}).get("kind") == "route" and places["longboards"]["phase"] == 1,
            "graph parent route")
    exact_keys(data["source"], ("file", "section", "parts", "appearance"), "source")
    for key, val in {"file": SOURCE, "section": "2. The connected map", "parts": ["Routes (20)", "Loops and the one-way shortcut"],
                     "appearance": APPEARANCE}.items():
        same(data["source"][key], val, "source " + key)
    placement = {"end": "west", "olanGateSide": "near", "covered": True, "lighting": "lamplit", "dry": True}
    exact_keys(data["placement"], placement, "placement")
    for key, val in placement.items():
        same(data["placement"][key], val, "placement " + key)
    require(type(data["connections"]) is list and len(data["connections"]) == 2, "connections")
    for item, (dest, lid) in zip(data["connections"], (("stillreed", "stillreed--dryboards"), ("passfoot", "dryboards--passfoot"))):
        exact_keys(item, ("to", "link", "x", "y", "dir", "landing"), "connection")
        for key, val in {"to": dest, "link": lid, "x": None, "y": None, "dir": None, "landing": "planned"}.items():
            same(item[key], val, "connection " + key)
        require(dest in places and lid in links, "connection reference")
        require({links[lid]["a"], links[lid]["b"]} == {"dryboards", dest}, "connection endpoints")
        require(links[lid]["phase"] == data["phase"], "connection phase")
    exact_keys(data["integration"], ("status", "standaloneMap", "note"), "integration")
    same(data["integration"]["status"], "planned", "integration status")
    same(data["integration"]["standaloneMap"], False, "standaloneMap")
    require(type(data["integration"]["note"]) is str and data["integration"]["note"].strip(), "integration note")
    require({other for l in links.values() if "dryboards" in (l["a"], l["b"])
             for other in (l["a"], l["b"]) if other != "dryboards"} == {"stillreed", "passfoot"},
            "Dry Boards has a new endpoint or bypass")
    return places, links


def validate_loops(graph, answering):
    places, links = graph_index(graph)
    needed = set(PASS_WALK + PASS_GLIDE + COAST + HOME + ("longboards", "answering", "flintcut"))
    require(needed <= set(places), "missing loop place")
    # Full paths, not global reachability: the inland road must not disguise a closed water edge.
    for path, label in ((PASS_WALK, "Pass Ring before Glide"), (COAST, "Coast Ring"), (HOME, "Home Burrow")):
        for a, b in zip(path, path[1:]):
            require(any({l["a"], l["b"]} == {a, b} for l in links.values()), label + ": missing path edge")
    require(walk(links, PASS_WALK) and walk(links, PASS_WALK[::-1]), "Pass Ring needs no lesson or later badge")
    require(walk(links, ("stillreed", "longboards")) and walk(links, ("longboards", "stillreed")), "Long Boards approach")
    glass = links.get("glassfall", {})
    require((glass.get("a"), glass.get("b")) == ("cloudglass", "stillreed") and glass.get("oneWay") is True,
            "Glassfall must only go down")
    same(glass.get("gate"), [{"field": "glide"}], "Glassfall gate")
    require(walk(links, PASS_GLIDE, lessons=("glide",)) and not walk(links, PASS_GLIDE[::-1], lessons=LESSONS),
            "Glassfall direction in the ring")
    require(not step(links, "cloudglass", "stillreed", BADGES), "Glassfall needs Glide")
    require([l["id"] for l in links.values() if l.get("oneWay")] == ["glassfall"], "unexpected one-way edge")
    for a, b in zip(COAST, COAST[1:]):
        link = next(l for l in links.values() if {l["a"], l["b"]} == {a, b})
        require(not link.get("oneWay"), "Coast Ring must walk both ways")
        expected = [{"field": "tide"}] if a in ("greywash", "opengrey") or b in ("greywash", "opengrey") else (
            [{"badge": "tide"}] if {a, b} == {"saltmarsh", "ashstair"} else [])
        same(link["gate"], expected, "Coast Ring gate " + link["id"])
    require(walk(links, COAST, ("thorn", "tide"), ("tide",)) and walk(links, COAST[::-1], ("thorn", "tide"), ("tide",)),
            "Coast Ring preserves open-order access; no invented Horizon lock")
    require(not walk(links, COAST, BADGES, [x for x in LESSONS if x != "tide"]), "Coast Ring needs Tide Ride")
    same(links.get("millgrass--larkburrow", {}).get("gate"), [], "Home Burrow first room is open")
    home = links.get("larkburrow--sunthread", {})
    same(home.get("gate"), [{"field": "stone"}, {"badge": "loom"}], "Home Burrow combined gate")
    for stone, loom in itertools.product((False, True), repeat=2):
        badges = [b for b in BADGES if b != "loom" or loom]
        lessons = [x for x in LESSONS if x != "stone" or stone]
        for path in (HOME, HOME[::-1]):
            require(walk(links, path, badges, lessons) == (stone and loom), "Home Burrow needs both keys, both ways")
    # All other badges and lessons make this an adversarial bypass check. Before
    # the order phase, neither Olan's nor the reverse Echo rope may be sidestepped.
    ropes = graph["ropesUntilOrder"]
    require(any(r["link"] == "stillreed--latepath" and r["badge"] == "reed" for r in ropes), "missing Olan rope")
    require(any(r["link"] == "hollowecho--ribbonroad" and r["badge"] == "echo" for r in ropes), "missing reverse Echo rope")
    require("hollowecho" not in reach(links, "dryboards", [b for b in BADGES if b not in ("reed", "echo")],
                                     LESSONS, ropes, ("Stone", "Tide"), ("leagueEnding",)),
            "Dry Boards bypasses Olan's gate before the order phase")
    # Once the later ropes are deliberately lifted, the ordinary Late Path still works.
    require("hollowecho" in reach(links, "dryboards", ("thorn", "tide")), "open-order road must stay open")
    require(type(answering) is dict and type(answering.get("map")) is dict, "Answering source")
    exits = answering["map"].get("exits")
    require(type(exits) is dict and set(exits) == {"S", "E"}, "Answering mouths")
    for label, dest in (("S", "hollowecho"), ("E", "flintcut")):
        require(type(exits[label]) is dict and exits[label].get("to") == dest, "Answering source target")
        lid = dest + "--answering"
        link = links.get(lid, {})
        require((link.get("a"), link.get("b")) == (dest, "answering") and link.get("phase") == 3,
                "Answering edge identity")
        same(link.get("gate"), [], "Answering lit mouth has no lesson gate")
        require(step(links, dest, "answering") and step(links, "answering", dest), "Answering mouth must walk both ways")
    require(links["hollowecho--answering"].get("extraToFlowchart") is True, "flag the mandated prose-only mouth")
    return links


def validate(data, graph, answering):
    validate_descriptor(data, graph)
    return validate_loops(graph, answering)


def mutations(value, path=()):
    yield path, value
    if type(value) is dict:
        for key, child in value.items():
            yield from mutations(child, path + (key,))
    elif type(value) is list:
        for i, child in enumerate(value):
            yield from mutations(child, path + (i,))


def replace(value, path, new):
    if not path:
        return new
    out = copy.deepcopy(value)
    parent = out
    for key in path[:-1]:
        parent = parent[key]
    parent[path[-1]] = new
    return out


class DryBoards(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = load(DIR / "dry-boards.json")
        cls.graph = load(DIR / "world-graph.json")
        cls.answering = load(DIR / "answering.json")

    def reject(self, data=None, graph=None, answering=None):
        with self.assertRaises(ValueError):
            validate(self.data if data is None else data, self.graph if graph is None else graph,
                     self.answering if answering is None else answering)

    def test_real_descriptor_and_graph_contracts(self):
        validate(self.data, self.graph, self.answering)

    def test_source_anchors_still_exist(self):
        text = (ROOT / SOURCE).read_text(encoding="utf-8")
        for anchor in ("## 2. The connected map", "### Routes (20)", "### Loops and the one-way shortcut", APPEARANCE,
                       "They connect Pass Foot to the west end of the boards", "The Dry Boards are on the near side of Olan's gate."):
            self.assertIn(anchor, text)
        backlog = (ROOT / "docs/plans/guest-backlog.md").read_text(encoding="utf-8")
        self.assertIn("add the edge `hollowecho--answering` to world-graph.json", backlog)

    def test_all_badge_and_lesson_combinations_keep_the_loop_keys(self):
        _, links = graph_index(self.graph)
        home_edges = {lid: links[lid] for lid in ("millgrass--larkburrow", "larkburrow--sunthread")}
        for mask in range(1 << len(BADGES)):
            badges = [b for i, b in enumerate(BADGES) if mask & (1 << i)]
            for lm in range(1 << len(LESSONS)):
                lessons = [x for i, x in enumerate(LESSONS) if lm & (1 << i)]
                expected = "loom" in badges and "stone" in lessons
                self.assertEqual(walk(home_edges, HOME, badges, lessons), expected)
                self.assertEqual(walk(home_edges, HOME[::-1], badges, lessons), expected)
        for lm in range(1 << len(LESSONS)):
            lessons = [x for i, x in enumerate(LESSONS) if lm & (1 << i)]
            self.assertEqual(walk(links, COAST, BADGES, lessons), "tide" in lessons)
            self.assertEqual(walk(links, COAST[::-1], BADGES, lessons), "tide" in lessons)
            self.assertTrue(walk(links, PASS_WALK, BADGES, lessons))
            self.assertTrue(walk(links, PASS_WALK[::-1], BADGES, lessons))

    def test_every_required_loop_edge_is_actually_observed(self):
        links = validate(self.data, self.graph, self.answering)
        ids = {l["id"] for l in links.values() if any({l["a"], l["b"]} == {a, b}
               for p in (PASS_WALK, COAST, HOME) for a, b in zip(p, p[1:]))}
        ids |= {"glassfall", "stillreed--longboards", "hollowecho--answering", "flintcut--answering"}
        for lid in sorted(ids):
            bad = copy.deepcopy(self.graph)
            bad["links"] = [l for l in bad["links"] if l["id"] != lid]
            with self.subTest(edge=lid):
                self.reject(graph=bad)

    def test_every_passage_field_rejects_wrong_types(self):
        tested = 0
        for path, original in mutations(self.data):
            for bad in (None, True, 4, 1.5, "wrong", [], {}):
                if type(bad) is type(original):
                    continue
                with self.subTest(path=path, bad=bad):
                    # The root None must not be interpreted as the helper's default.
                    with self.assertRaises(ValueError):
                        validate(replace(self.data, path, bad), self.graph, self.answering)
                tested += 1
        self.assertGreater(tested, 250)

    def test_every_passage_object_rejects_missing_and_extra_fields(self):
        for path, value in mutations(self.data):
            if type(value) is dict:
                for key in value:
                    bad = copy.deepcopy(value)
                    del bad[key]
                    self.reject(data=replace(self.data, path, bad))
                self.reject(data=replace(self.data, path, dict(value, unexpected=True)))

    def test_planning_and_source_semantic_mutants(self):
        for path, value in ((('status',), 'ready'), (('kind',), 'cave'), (('containedIn',), 'hollowecho'),
                            (('placement', 'end'), 'east'), (('placement', 'olanGateSide'), 'far'),
                            (('placement', 'covered'), False), (('placement', 'dry'), False),
                            (('placement', 'lighting'), 'dark'), (('oneWay',), True),
                            (('integration', 'standaloneMap'), True), (('integration', 'status'), 'ready'),
                            (('source', 'file'), 'wrong.md'), (('gate',), [{'field': 'lantern'}])):
            self.reject(data=replace(self.data, path, value))
        for i in range(2):
            for key, value in (("x", 0), ("y", 0), ("dir", "up"), ("landing", "resolved"), ("to", "hollowecho")):
                self.reject(data=replace(self.data, ("connections", i, key), value))

    def test_graph_types_duplicates_and_gate_mutants(self):
        for path in (("links",), ("places",), ("ropesUntilOrder",), ("links", 0),
                     ("links", 0, "gate"), ("links", 0, "a"), ("links", 0, "phase")):
            original = self.graph
            for key in path:
                original = original[key]
            for bad in (None, True, 3, "wrong", [], {}):
                if type(bad) is not type(original):
                    with self.subTest(path=path, bad=bad):
                        self.reject(graph=replace(self.graph, path, bad))
        for key in ("links", "places", "ropesUntilOrder"):
            bad = copy.deepcopy(self.graph)
            bad[key].append(copy.deepcopy(bad[key][0]))
            self.reject(graph=bad)
        bad_gates = ([{}], [None], [{"field": "flight"}], [{"field": "tide", "badge": "loom"}],
                     [{"field": True}], [{"field": "tide"}, {"field": "tide"}])
        for gates in bad_gates:
            self.reject(graph=replace(self.graph, ("links", 0, "gate"), gates))

    def test_targeted_loop_and_answering_regressions(self):
        def changed(lid, key, value):
            bad = copy.deepcopy(self.graph)
            next(l for l in bad["links"] if l["id"] == lid)[key] = value
            return bad
        for lid, key, value in (("glassfall", "oneWay", False), ("glassfall", "gate", []),
                                ("dryboards--passfoot", "oneWay", True),
                                ("dryboards--passfoot", "phase", 3),
                                ("dryboards--passfoot", "gate", [{"field": "glide"}]),
                                ("greywash--opengrey", "gate", []),
                                ("greywash--opengrey", "gate", [{"badge": "horizon"}, {"field": "tide"}]),
                                ("millgrass--larkburrow", "gate", [{"field": "tide"}]),
                                ("larkburrow--sunthread", "gate", [{"field": "stone"}]),
                                ("larkburrow--sunthread", "gate", [{"badge": "loom"}]),
                                ("hollowecho--answering", "gate", [{"field": "lantern"}]),
                                ("hollowecho--answering", "oneWay", True),
                                ("flintcut--answering", "oneWay", True),
                                ("hollowecho--answering", "phase", 4),
                                ("hollowecho--answering", "extraToFlowchart", False)):
            with self.subTest(lid=lid, key=key):
                self.reject(graph=changed(lid, key, value))
        for other in ("hollowecho", "latepath", "flintcut", "answering"):
            bad = copy.deepcopy(self.graph)
            bad["links"].append({"id": "dryboards--" + other, "a": "dryboards", "b": other, "gate": [], "phase": 3})
            self.reject(graph=bad)
        # A bypass outside the two passage mouths is caught by the full pre-order traversal.
        bad = copy.deepcopy(self.graph)
        bad["links"].append({"id": "longboards--flintcut", "a": "longboards", "b": "flintcut", "gate": [], "phase": 3})
        self.reject(graph=bad)
        for gate in ([{"element": "Stone"}], [{"element": "Tide"}], [{"story": "leagueEnding"}]):
            bad["links"][-1]["gate"] = gate
            self.reject(graph=bad)
        for label in ("S", "E"):
            self.reject(answering=replace(self.answering, ("map", "exits", label, "to"), "longboards"))

    def test_loader_rejects_duplicate_keys_and_nonfinite_numbers(self):
        class Text:
            def __init__(self, text):
                self.text = text
            def read_text(self, **_):
                return self.text
        for value in ('{"a":1,"a":2}', '{"nested":{"x":0,"x":1}}', '{"x":NaN}', '{"x":Infinity}',
                      '{"x":-Infinity}', '{', '[1,]'):
            with self.assertRaises(ValueError):
                load(Text(value))


if __name__ == "__main__":
    unittest.main()
