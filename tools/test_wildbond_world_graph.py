#!/usr/bin/env python3
"""Checks for docs/plans/wildbond-world/world-graph.json (WBW-3).

Standalone, no packages:  python3 -m unittest tools/test_wildbond_world_graph.py
It reads three files and changes none of them: the graph, the design doc's mermaid flowchart (section 2), and the
game's own wildbond-godot/data/wildbond.json (for the 15 current map ids and today's exits). If WBW-2's
docs/plans/wildbond-world/knothollow.json exists, its exits are compared too; if it does not exist yet, that one check is skipped.
"""
import heapq
import json
import re
import unittest
from collections import defaultdict, deque
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GRAPH = ROOT / "docs/plans/wildbond-world/world-graph.json"
DESIGN = ROOT / "docs/plans/wildbond-world-design.md"
GAME = ROOT / "wildbond-godot/data/wildbond.json"
KNOTHOLLOW = ROOT / "docs/plans/wildbond-world/knothollow.json"

CURRENT_15 = ["larkhaven", "thornwood_route", "thornwood", "saltmarsh_route", "saltmarsh", "emberfall", "cloudglass", "stillreed",
              "hollowecho", "sunthread", "farwatch", "league", "spire", "thornwood_grove", "saltmarsh_pool"]
BADGES = ["thorn", "tide", "ember", "beacon", "reed", "echo", "loom", "horizon"]
LESSONS = ["stone", "tide", "grove", "lantern", "glide", "hush", "daymark"]
ELEMENTS = ["Stone", "Tide"]
STORY_KEYS = ["leagueEnding"]            # the only story key a link may ask for (it is already in the save)
# Links that today's game already has between two places that stay in the valley. Every other old exit is replaced by a walk through new places.
PHASE0_LINKS = [("larkhaven", "thornwood_route"), ("thornwood_route", "thornwood"), ("thornwood", "saltmarsh_route"),
                ("saltmarsh_route", "saltmarsh_pool"), ("saltmarsh_route", "saltmarsh"), ("league", "spire")]
# With every badge and element but no field lesson, only the places behind Tide Ride are out of reach. Lessons never lock the main road.
WATER_ONLY = {"greywash", "opengrey", "outershoal", "keelcave", "quietchannels", "lowbell"}
# The design's flowchart does not draw this link, but section 2's prose does (caves, item 3). Keep it explicit.
PROSE_ONLY_LINKS = [("greywash", "keelcave")]

DATA = json.loads(GRAPH.read_text(encoding="utf-8"))
PLACES = {p["id"]: p for p in DATA["places"]}
LINKS = DATA["links"]
NODES = [p["id"] for p in DATA["places"] if not p.get("isLink")]   # Glassfall is drawn as a link, not a place


def pair(a, b):
    return tuple(sorted((a, b)))


def state(badges=(), lessons=(), elements=(), story=()):
    return {"badge": set(badges), "field": set(lessons), "element": set(elements), "story": set(story)}


EVERYTHING = state(BADGES, LESSONS, ELEMENTS, STORY_KEYS)


def met(req, have):
    if "badges" in req:
        return have["badge"] >= set(BADGES)
    for kind in ("badge", "field", "element", "story"):
        if kind in req:
            return req[kind] in have[kind]
    raise AssertionError("unknown requirement %r" % (req,))


def reach(have, start="larkhaven", skip=(), only=None):
    seen, queue = {start}, deque([start])
    while queue:
        here = queue.popleft()
        for link in LINKS:
            if link["id"] in skip or (only is not None and link["id"] not in only) or not all(met(g, have) for g in link["gate"]):
                continue
            for a, b in ((link["a"], link["b"]), (link["b"], link["a"])):
                if a == here and b not in seen and not (link.get("oneWay") and (a, b) != (link["a"], link["b"])):
                    seen.add(b)
                    queue.append(b)
    return seen


def neighbours():
    out = defaultdict(set)
    for link in LINKS:
        out[link["a"]].add(link["b"])
        out[link["b"]].add(link["a"])
    return out


def flowchart():
    """(label by mermaid id, list of (from id, to id, edge label)) from the first mermaid block in the design doc."""
    text = DESIGN.read_text(encoding="utf-8")
    block = re.search(r"```mermaid\n(.*?)```", text, re.S).group(1)
    labels, edges = {}, []
    pat = re.compile(r"^\s*(\w+)(?:\[([^\]]+)\])?\s*-->(?:\|([^|]+)\|)?\s*(\w+)(?:\[([^\]]+)\])?\s*$")
    for line in block.splitlines():
        m = pat.match(line)
        if not m:
            continue
        a, la, edge, b, lb = m.groups()
        for key, label in ((a, la), (b, lb)):
            if label:
                labels[key] = label
        edges.append((a, b, edge))
    return labels, edges


class Shape(unittest.TestCase):
    def test_counts_match_section_nine(self):
        kinds = defaultdict(int)
        for p in DATA["places"]:
            kinds[p["kind"]] += 1
        self.assertEqual(kinds["route"], 20)
        self.assertEqual(kinds["town"], 10)
        self.assertEqual(kinds["cave"], 7)
        self.assertEqual(kinds["water"], 3)
        self.assertEqual(kinds["other"], 7)
        self.assertEqual(sum(kinds.values()), 47)
        self.assertEqual(len(NODES), 46)

    def test_ids_names_and_phases(self):
        ids = [p["id"] for p in DATA["places"]]
        self.assertEqual(len(ids), len(set(ids)))
        names = [p["name"] for p in DATA["places"]]
        self.assertEqual(len(names), len(set(names)))
        for p in DATA["places"]:
            self.assertRegex(p["id"], r"^[a-z_]+$")
            self.assertIn(p["kind"], ("town", "route", "cave", "water", "other"))
            self.assertIn(p["phase"], range(0, 7))
            if p["kind"] == "other":
                self.assertIn(p["role"], ("coast", "tower", "pocket", "summit", "shoal", "passage"))

    def test_links_are_well_formed(self):
        ids = [l["id"] for l in LINKS]
        self.assertEqual(len(ids), len(set(ids)))
        seen = set()
        for l in LINKS:
            self.assertIn(l["a"], NODES, l["id"])
            self.assertIn(l["b"], NODES, l["id"])
            self.assertNotEqual(l["a"], l["b"], l["id"])
            self.assertNotIn(pair(l["a"], l["b"]), seen, "duplicate link " + l["id"])
            seen.add(pair(l["a"], l["b"]))
            self.assertIn(l["phase"], range(0, 7), l["id"])
            self.assertGreaterEqual(l["phase"], max(PLACES[l["a"]]["phase"], PLACES[l["b"]]["phase"]), l["id"] + " opens before its own places exist")
            for g in l["gate"]:
                self.assertEqual(len(g), 1, l["id"])
                if "badge" in g:
                    self.assertIn(g["badge"], BADGES)
                elif "badges" in g:
                    self.assertEqual(g["badges"], "all")
                elif "field" in g:
                    self.assertIn(g["field"], LESSONS)
                elif "element" in g:
                    self.assertIn(g["element"], ELEMENTS)
                elif "story" in g:
                    self.assertIn(g["story"], STORY_KEYS)
                else:
                    self.fail("unknown gate on " + l["id"])

    def test_every_place_has_a_link(self):
        linked = set()
        for l in LINKS:
            linked.update((l["a"], l["b"]))
        self.assertEqual(set(NODES) - linked, set())

    def test_no_link_joins_two_towns_directly(self):
        towns = {p["id"] for p in DATA["places"] if p["kind"] == "town"}
        for l in LINKS:
            if l["id"] == "glassfall":      # the one link the design draws as an arrow between two towns
                continue
            self.assertFalse(l["a"] in towns and l["b"] in towns, l["id"])

    def test_the_graph_names_no_new_save_field(self):
        for l in LINKS:
            for g in l["gate"]:
                if "story" in g:
                    self.assertIn(g["story"], STORY_KEYS)
        self.assertEqual(DATA["fieldLessons"], LESSONS)
        self.assertEqual(DATA["badges"], BADGES)


class CurrentMaps(unittest.TestCase):
    def test_all_15_current_map_ids_are_present_and_marked(self):
        marked = sorted(p["id"] for p in DATA["places"] if p.get("current"))
        self.assertEqual(marked, sorted(CURRENT_15))
        for mid in CURRENT_15:
            self.assertIn(mid, PLACES)
            self.assertEqual(PLACES[mid]["phase"], 0, mid)
        for p in DATA["places"]:
            if not p.get("current"):
                self.assertGreaterEqual(p["phase"], 1, p["id"] + " is new, so it cannot be phase 0")

    def test_current_ids_are_the_games_own_ids(self):
        game = json.loads(GAME.read_text(encoding="utf-8"))
        self.assertEqual(sorted(game["MAPS"]), sorted(CURRENT_15))

    def test_phase_zero_links_are_real_exits_today(self):
        game = json.loads(GAME.read_text(encoding="utf-8"))["MAPS"]
        today = {pair(src, ex["to"]) for src, m in game.items() for ex in m.get("exits", {}).values()}
        phase0 = {pair(l["a"], l["b"]) for l in LINKS if l["phase"] == 0}
        self.assertEqual(phase0, {pair(a, b) for a, b in PHASE0_LINKS})
        self.assertLessEqual(phase0, today)

    def test_every_other_old_exit_is_replaced_by_a_short_walk_through_new_places(self):
        game = json.loads(GAME.read_text(encoding="utf-8"))["MAPS"]
        today = {pair(src, ex["to"]) for src, m in game.items() for ex in m.get("exits", {}).values()}
        nxt = neighbours()
        for a, b in sorted(today - {pair(x, y) for x, y in PHASE0_LINKS}):
            # a walk from a to b that passes only through new, non-town places, at most three of them
            queue, found = deque([(a, 0)]), False
            seen = {a}
            while queue and not found:
                here, depth = queue.popleft()
                for n in nxt[here]:
                    if n == b and depth >= 1:
                        found = True
                    elif n not in seen and PLACES[n]["kind"] != "town" and PLACES[n]["phase"] >= 1 and depth < 3 and n != b:
                        seen.add(n)
                        queue.append((n, depth + 1))
            self.assertTrue(found, "no new walk replaces the old exit %s to %s" % (a, b))


class OneWay(unittest.TestCase):
    def test_glassfall_is_the_only_one_way_link_and_goes_down(self):
        one = [l for l in LINKS if l.get("oneWay")]
        self.assertEqual([l["id"] for l in one], ["glassfall"])
        self.assertEqual((one[0]["a"], one[0]["b"]), ("cloudglass", "stillreed"))   # Highlatch down to Reedhold
        self.assertEqual(one[0]["gate"], [{"field": "glide"}])
        self.assertEqual([p["id"] for p in DATA["places"] if p.get("isLink")], ["glassfall"])
        self.assertEqual(PLACES["glassfall"]["kind"], "route")

    def test_every_other_link_is_walked_both_ways(self):
        for l in LINKS:
            if l["id"] == "glassfall":
                continue
            self.assertFalse(l.get("oneWay"), l["id"])
            gate_free = state(BADGES, LESSONS, ELEMENTS, STORY_KEYS)
            self.assertIn(l["a"], reach(gate_free, l["b"], only={l["id"]}), l["id"] + " cannot be walked from b to a")
            self.assertIn(l["b"], reach(gate_free, l["a"], only={l["id"]}), l["id"] + " cannot be walked from a to b")

    def test_glassfall_refuses_the_climb_back_up(self):
        down = reach(EVERYTHING, "cloudglass", only={"glassfall"})
        up = reach(EVERYTHING, "stillreed", only={"glassfall"})
        self.assertEqual(down, {"cloudglass", "stillreed"})
        self.assertEqual(up, {"stillreed"})
        # and without the Glide lesson the drop is shut as well
        no_glide = state(BADGES, [x for x in LESSONS if x != "glide"], ELEMENTS, STORY_KEYS)
        self.assertEqual(reach(no_glide, "cloudglass", only={"glassfall"}), {"cloudglass"})

    def test_pass_foot_still_walks_both_ways_before_glide(self):
        without_glide = state(BADGES, [x for x in LESSONS if x != "glide"], ELEMENTS, STORY_KEYS)
        walk_only = {"cloudglass--passfoot", "passfoot--stillreed"}
        self.assertIn("stillreed", reach(without_glide, "cloudglass", only=walk_only))
        self.assertIn("cloudglass", reach(without_glide, "stillreed", only=walk_only))


class Gates(unittest.TestCase):
    def test_everything_is_reachable_from_larkhaven_with_all_lessons(self):
        self.assertEqual(set(NODES) - reach(EVERYTHING), set())

    def test_only_the_spire_waits_for_the_champion_ending(self):
        have = state(BADGES, LESSONS, ELEMENTS, [])
        self.assertEqual(set(NODES) - reach(have), {"spire"})

    def test_lessons_never_lock_the_main_road(self):
        have = state(BADGES, [], ELEMENTS, STORY_KEYS)
        missing = set(NODES) - reach(have)
        self.assertEqual(missing, WATER_ONLY)
        self.assertIn("league", reach(have))
        self.assertIn("trialstair", reach(have))

    def test_the_league_needs_all_eight_badges(self):
        self.assertIn("league", reach(state(BADGES, LESSONS, ELEMENTS, STORY_KEYS)))
        for b in BADGES:
            have = state([x for x in BADGES if x != b], LESSONS, ELEMENTS, STORY_KEYS)
            self.assertNotIn("league", reach(have), "league opened without the %s badge" % b)
            self.assertNotIn("spire", reach(have))
        door = [l for l in LINKS if l["b"] == "league" or l["a"] == "league"]
        self.assertEqual({l["id"] for l in door if {"badges": "all"} in l["gate"]}, {"trialstair--league"})
        self.assertEqual({n for l in door for n in (l["a"], l["b"])} - {"league"}, {"trialstair", "spire"})

    def test_thorn_and_tide_alone_reach_bellstep_and_the_high_watch(self):
        # WB-WORLD-ORDER's done check: a save with only the Thorn and Tide badges can walk to Bellstep and to the High Watch
        have = state(["thorn", "tide"], [], ELEMENTS, [])
        got = reach(have)
        for place in ("hollowecho", "farwatch", "sunthread", "trialroad", "trialstair", "stillreed", "cloudglass", "lanternquay"):
            self.assertIn(place, got, place)
        self.assertNotIn("league", got)

    def test_no_badges_stay_in_the_first_country(self):
        got = reach(state([], [], ELEMENTS, []))
        self.assertIn("thornwood", got)
        self.assertNotIn("saltmarsh_route", got)
        self.assertNotIn("knothollow", got)

    def test_the_two_early_pockets_still_open_on_the_element_alone(self):
        got = reach(state([], [], ELEMENTS, []))
        self.assertIn("thornwood_grove", got)
        self.assertIn("saltmarsh_pool", reach(state(["thorn"], [], ELEMENTS, [])))
        self.assertNotIn("thornwood_grove", reach(state(BADGES, [], ["Tide"], STORY_KEYS)))
        self.assertNotIn("saltmarsh_pool", reach(state(BADGES, [], ["Stone"], STORY_KEYS)))
        # with the lessons, the grove is also reachable from the back (Grove Wake through Knothollow), which is the design's intent
        self.assertIn("thornwood_grove", reach(state(BADGES, LESSONS, ["Tide"], STORY_KEYS)))

    def test_water_needs_tide_ride_and_the_pool_alone_does_not_cross(self):
        no_tide = state(BADGES, [x for x in LESSONS if x != "tide"], ELEMENTS, STORY_KEYS)
        self.assertEqual(set(NODES) - reach(no_tide), WATER_ONLY)
        for l in LINKS:
            if "water" in (PLACES[l["a"]]["kind"], PLACES[l["b"]]["kind"]):
                self.assertIn({"field": "tide"}, l["gate"], l["id"])

    def test_larkburrow_needs_stone_break_and_the_loom_badge_together(self):
        link = next(l for l in LINKS if l["id"] == "larkburrow--sunthread")
        self.assertCountEqual(link["gate"], [{"field": "stone"}, {"badge": "loom"}])
        self.assertEqual(next(l for l in LINKS if l["id"] == "millgrass--larkburrow")["gate"], [])

    def test_orchard_fen_chord_needs_stone_break_and_both_ends_walked(self):
        link = next(l for l in LINKS if l["id"] == "orchardfen--sootpath")
        self.assertEqual(link["gate"], [{"field": "stone"}])
        self.assertTrue(link["needsBothEndsWalked"])

    def test_ropes_until_the_order_phase_are_real_and_lifted_afterward(self):
        by_id = {l["id"]: l for l in LINKS}
        for rope in DATA["ropesUntilOrder"]:
            self.assertIn(rope["link"], by_id)
            self.assertIn(rope["badge"], BADGES)
            self.assertNotIn({"badge": rope["badge"]}, by_id[rope["link"]]["gate"], rope["link"] + " keeps a rope the order phase lifts")


class Healers(unittest.TestCase):
    def towns(self):
        return {p["id"] for p in DATA["places"] if p["kind"] == "town"}

    def test_every_town_has_a_named_healer(self):
        for p in DATA["places"]:
            if p["kind"] == "town":
                self.assertTrue(p["healer"].strip(), p["id"])
                self.assertIn(p["healerStatus"], ("exists", "proposed"))
            else:
                self.assertNotIn("healer", p)
        self.assertEqual({p["id"] for p in DATA["places"] if p.get("healerStatus") == "exists"}, {"larkhaven", "league"})

    def cost(self, node):
        return 1 if PLACES[node]["kind"] in ("route", "water") else 0

    def stretches(self, have):
        """Cheapest healer-free walk (routes counted) between each pair of towns, through no third town, with these gates open."""
        towns, nxt = self.towns(), defaultdict(set)
        for l in LINKS:
            if all(met(g, have) for g in l["gate"]):
                nxt[l["a"]].add(l["b"])
                nxt[l["b"]].add(l["a"])
        out = {}
        for src in sorted(towns):
            best, heap = {src: 0}, [(0, src)]
            while heap:
                d, here = heapq.heappop(heap)
                if d > best.get(here, 99) or (here in towns and here != src):
                    continue
                for n in nxt[here]:
                    nd = d + self.cost(n)
                    if nd < best.get(n, 99):
                        best[n] = nd
                        heapq.heappush(heap, (nd, n))
            for t in towns - {src}:
                if t in best:
                    out[pair(src, t)] = best[t]
        return out

    def test_no_stretch_between_healers_has_more_than_three_routes_on_the_road_with_no_lessons(self):
        road = self.stretches(state(BADGES, [], ELEMENTS, STORY_KEYS))
        self.assertTrue(road)
        for (a, b), n in sorted(road.items()):
            self.assertLessEqual(n, 3, "%s to %s crosses %d routes without a healer" % (a, b, n))
        self.assertEqual(max(road.values()), 2)

    def test_longer_healer_free_walks_exist_only_with_lessons_and_are_listed(self):
        # With every lesson, some chains of routes avoid every town: the Orchard Fen chord (Stone Break), the water (Tide Ride) and
        # Kilnvent's far door (Lantern). They are optional and none is on the road above. The test freezes the list so a change shows.
        longer = {k: n for k, n in self.stretches(EVERYTHING).items() if n > 3}
        self.assertEqual(sorted(longer.items()), sorted({
            pair("cloudglass", "farwatch"): 6, pair("emberfall", "farwatch"): 5, pair("farwatch", "stillreed"): 7,
            pair("farwatch", "thornwood"): 4, pair("lanternquay", "stillreed"): 4, pair("lanternquay", "sunthread"): 4,
            pair("stillreed", "thornwood"): 4, pair("sunthread", "thornwood"): 4}.items()))
        for lesson in ("stone", "tide", "lantern"):
            only_one = state(BADGES, [lesson], ELEMENTS, STORY_KEYS)
            self.assertLessEqual(max(self.stretches(only_one).values()), 6)

    def test_every_place_is_within_three_routes_of_a_healer(self):
        towns, nxt = self.towns(), neighbours()
        best, heap = {t: 0 for t in towns}, [(0, t) for t in towns]
        heapq.heapify(heap)
        while heap:
            d, here = heapq.heappop(heap)
            if d > best[here]:
                continue
            for n in nxt[here]:
                nd = d + self.cost(n)
                if nd < best.get(n, 99):
                    best[n] = nd
                    heapq.heappush(heap, (nd, n))
        for n in NODES:
            self.assertLessEqual(best[n], 3, n)


class DesignDoc(unittest.TestCase):
    def setUp(self):
        self.labels, self.edges = flowchart()
        self.by_name = {p["name"]: p["id"] for p in DATA["places"]}

    def test_every_flowchart_label_is_a_place(self):
        for key, label in self.labels.items():
            self.assertIn(label, self.by_name, "flowchart place %s (%s) is not in the graph" % (key, label))

    def test_the_edges_match_the_flowchart(self):
        drawn = {pair(self.by_name[self.labels[a]], self.by_name[self.labels[b]]) for a, b, _ in self.edges}
        data = {pair(l["a"], l["b"]) for l in LINKS}
        prose = {pair(a, b) for a, b in PROSE_ONLY_LINKS}
        self.assertEqual(data - drawn, prose - drawn, "links the flowchart does not draw")
        self.assertEqual(drawn - data, set(), "flowchart links the graph lacks")
        flagged = {pair(l["a"], l["b"]) for l in LINKS if l.get("extraToFlowchart")}
        self.assertEqual(flagged, prose)

    def test_the_places_match_the_flowchart(self):
        drawn = {self.by_name[label] for label in self.labels.values()}
        prose_only = {x for a, b in PROSE_ONLY_LINKS for x in (a, b)}
        self.assertEqual(set(NODES) - drawn - prose_only, set())
        self.assertEqual(drawn - set(NODES), set())
        self.assertIn(len(drawn), (45, 46))   # 46 once the flowchart also draws Keelcave

    def test_labelled_arrows_match_the_gates(self):
        want = {"Grove Wake": [{"field": "grove"}], "Tide Ride": [{"field": "tide"}], "Glassfall one way": [{"field": "glide"}],
                "Stone Break, both ends walked": [{"field": "stone"}], "Stone Break and Loom Badge": [{"field": "stone"}, {"badge": "loom"}]}
        by_pair = {pair(l["a"], l["b"]): l for l in LINKS}
        seen = set()
        for a, b, label in self.edges:
            if not label:
                continue
            self.assertIn(label, want, "a new arrow label needs a rule here")
            link = by_pair[pair(self.by_name[self.labels[a]], self.by_name[self.labels[b]])]
            self.assertCountEqual(link["gate"], want[label], label)
            seen.add(label)
            if label == "Glassfall one way":
                self.assertTrue(link["oneWay"])
                self.assertEqual((link["a"], link["b"]), (self.by_name[self.labels[a]], self.by_name[self.labels[b]]))
        self.assertEqual(seen, set(want))

    def test_chart_road_is_drawn_as_a_loop_and_only_it(self):
        both = {pair(self.by_name[self.labels[a]], self.by_name[self.labels[b]]) for a, b, _ in self.edges
                if any(x == b and y == a for x, y, _ in self.edges)}
        loops = {pair(l["a"], l["b"]) for l in LINKS if l.get("loop")}
        self.assertEqual(both, loops)
        self.assertEqual(loops, {pair("farwatch", "chartroad")})

    def test_the_design_doc_still_says_20_10_7_3(self):
        text = DESIGN.read_text(encoding="utf-8")
        for heading in ("### Routes (20)", "### Towns (10)", "### Caves and depths (7)", "### Water routes (3)"):
            self.assertIn(heading, text)


def exit_targets(exits):
    """The set of places a MAPS-shaped exits block leads to.

    A MAPS exit is {"to": place, "x": .., "y": .., "dir": ..}, keyed by a label such as "S" or "E"; only its "to" counts, never "dir".
    A bare string value is also accepted as a target (a legacy exit written as just the place id). The block may be a dict of exits
    or a list of them. Anything else is an error, so a malformed file fails loudly and is not read as "no exits".
    """
    items = exits.values() if isinstance(exits, dict) else exits
    if not isinstance(items, (list, type({}.values()))):
        raise ValueError("exits must be a dict or a list, got %r" % type(exits).__name__)
    targets = set()
    for e in items:
        if isinstance(e, str):
            targets.add(e)
        elif isinstance(e, dict) and isinstance(e.get("to"), str):
            targets.add(e["to"])
        else:
            raise ValueError("an exit needs a string \"to\" (or to be a plain place id): %r" % (e,))
    return targets


class ExitTargets(unittest.TestCase):
    """The reader WBW-2's agreement check uses, tested on its own so it does not wait for knothollow.json."""

    def test_only_the_to_value_of_a_maps_exit_counts(self):
        exits = {"S": {"to": "rootwater", "x": 1, "y": 1, "dir": "down"}, "E": {"to": "thornwood_grove", "x": 1, "y": 8, "dir": "right"}}
        self.assertEqual(exit_targets(exits), {"rootwater", "thornwood_grove"})

    def test_dir_values_are_never_read_as_places(self):
        got = exit_targets({"N": {"to": "larkhaven", "x": 0, "y": 0, "dir": "up"}})
        self.assertEqual(got, {"larkhaven"})
        self.assertNotIn("up", got)

    def test_a_bare_string_exit_is_a_legacy_target(self):
        self.assertEqual(exit_targets({"W": "larkhaven", "E": {"to": "rootwater", "dir": "right"}}), {"larkhaven", "rootwater"})

    def test_a_list_of_exits_works_too(self):
        self.assertEqual(exit_targets([{"to": "a", "dir": "up"}, {"to": "b", "dir": "down"}]), {"a", "b"})

    def test_two_exits_to_one_place_count_once(self):
        self.assertEqual(exit_targets({"N": {"to": "a", "dir": "up"}, "S": {"to": "a", "dir": "down"}}), {"a"})

    def test_an_empty_block_is_no_targets(self):
        self.assertEqual(exit_targets({}), set())

    def test_malformed_exits_are_errors_not_silence(self):
        for bad in ({"S": {"x": 1, "dir": "down"}}, {"S": {"to": 5}}, {"S": 7}, {"S": None}, "rootwater", 3):
            with self.assertRaises(ValueError, msg=repr(bad)):
                exit_targets(bad)

    def test_the_old_nested_walk_would_have_got_it_wrong(self):
        # The first version of this check collected every nested string. Kept as a mutant so the reader cannot slide back to it.
        def nested(v, out):
            if isinstance(v, dict):
                if "to" in v:
                    out.add(v["to"])
                for x in v.values():
                    nested(x, out)
            elif isinstance(v, str):
                out.add(v)
            return out
        exits = {"S": {"to": "rootwater", "x": 1, "y": 1, "dir": "down"}, "E": {"to": "thornwood_grove", "x": 1, "y": 8, "dir": "right"}}
        self.assertNotEqual(nested(exits, set()), exit_targets(exits))
        self.assertEqual(len(nested(exits, set())), 4)


class KnothollowAgreement(unittest.TestCase):
    def test_wbw2_exits_agree_with_the_graph_if_that_file_exists(self):
        if not KNOTHOLLOW.exists():
            self.skipTest("WBW-2's knothollow.json is not on this branch yet")
        data = json.loads(KNOTHOLLOW.read_text(encoding="utf-8"))
        exits = data.get("exits", data.get("map", {}).get("exits"))
        self.assertIsNotNone(exits, "knothollow.json has no exits")
        self.assertEqual(exit_targets(exits), neighbours()["knothollow"])


if __name__ == "__main__":
    unittest.main()
