"""WB-REGION-AUDIT: check docs/plans/wildbond-world/region-audit.json against its sources.

Standalone (not in CI): python3 -m unittest tools/test_wildbond_region_audit.py
Reads world-graph.json, the briefs and wildbond-godot/data/wildbond.json; writes nothing.
"""
import json
import os
import unittest
from collections import deque

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORLD = os.path.join(ROOT, "docs", "plans", "wildbond-world")


def load(*parts):
    with open(os.path.join(ROOT, *parts), encoding="utf8") as f:
        return json.load(f)


AUDIT = load("docs", "plans", "wildbond-world", "region-audit.json")
GRAPH = load("docs", "plans", "wildbond-world", "world-graph.json")
GAME = load("wildbond-godot", "data", "wildbond.json")
ORDER = ["thorn", "tide", "ember", "beacon", "reed", "echo", "loom", "horizon"]
LESSON_AFTER = {"stone": "thorn", "grove": "thorn", "tide": "tide", "lantern": "ember",
                "glide": "beacon", "hush": "echo", "daymark": "loom"}
ENCOUNTERS = {"ordinary", "ordinary+special", "special", "none"}


def passable(link, badges, lessons, max_phase, ropes):
    if link["phase"] > max_phase:
        return False
    if link["id"] in ropes and ropes[link["id"]] not in badges:
        return False
    for req in link["gate"]:
        if "badge" in req and req["badge"] not in badges:
            return False
        if "badges" in req and len(badges) < 8:
            return False
        if "field" in req and req["field"] not in lessons:
            return False
        if "story" in req and len(badges) < 8:
            return False
    return True


def reach(badges, lessons, max_phase, ropes):
    seen = {"larkhaven"}
    for _ in range(3):
        queue = deque(seen)
        while queue:
            here = queue.popleft()
            for link in GRAPH["links"]:
                if not passable(link, badges, lessons, max_phase, ropes):
                    continue
                for x, y in ((link["a"], link["b"]), (link["b"], link["a"])):
                    if x != here or y in seen:
                        continue
                    if link.get("oneWay") and x != link["a"]:
                        continue
                    if link.get("needsBothEndsWalked") and not (link["a"] in seen and link["b"] in seen):
                        continue
                    seen.add(y)
                    queue.append(y)
    return seen


def first_reach(max_phase, ropes, lessons_on):
    out = {}
    for n in range(9):
        badges = set(ORDER[:n])
        lessons = {k for k, v in LESSON_AFTER.items() if v in badges} if lessons_on else set()
        for place in reach(badges, lessons, max_phase, ropes):
            out.setdefault(place, n)
    return out


def legacy_exit(frm, to):
    for e in GAME["MAPS"].get(frm, {}).get("exits", {}).values():
        if e["to"] == to:
            return {"x": e["x"], "y": e["y"], "dir": e["dir"]}
    return None


class Coverage(unittest.TestCase):
    def test_every_graph_place_once_and_glassfall_as_link(self):
        graph_ids = [p["id"] for p in GRAPH["places"] if not p.get("isLink")]
        audit_ids = [p["id"] for p in AUDIT["places"]]
        self.assertEqual(len(graph_ids), 46)
        self.assertEqual(sorted(audit_ids), sorted(graph_ids))
        self.assertEqual(len(audit_ids), len(set(audit_ids)))
        self.assertEqual(AUDIT["glassfall"]["id"], "glassfall")
        self.assertIn("glassfall", [l["id"] for l in AUDIT["links"]])
        self.assertNotIn("glassfall", audit_ids)

    def test_every_link_once_with_the_graph_ends_gate_and_phase(self):
        self.assertEqual(len(GRAPH["links"]), 54)
        audit = {l["id"]: l for l in AUDIT["links"]}
        self.assertEqual(len(audit), len(AUDIT["links"]))
        self.assertEqual(sorted(audit), sorted(l["id"] for l in GRAPH["links"]))
        for link in GRAPH["links"]:
            rec = audit[link["id"]]
            self.assertEqual((rec["a"], rec["b"], rec["gate"], rec["phase"]),
                             (link["a"], link["b"], link["gate"], link["phase"]), link["id"])

    def test_connections_list_every_link_touching_a_place(self):
        for p in AUDIT["places"]:
            expected = sorted(l["id"] for l in GRAPH["links"] if p["id"] in (l["a"], l["b"]))
            self.assertEqual(sorted(p["connections"]), expected, p["id"])

    def test_every_place_has_purpose_habitat_sources_and_revisit(self):
        for p in AUDIT["places"] + [AUDIT["glassfall"]]:
            for key in ("purpose", "habitat", "sources"):
                self.assertTrue(p.get(key), (p["id"], key))
        for p in AUDIT["places"]:
            self.assertTrue(p["revisit"], p["id"])


class Progression(unittest.TestCase):
    def test_stored_reach_matches_the_graph(self):
        ropes = {r["link"]: r["badge"] for r in GRAPH["ropesUntilOrder"]}
        phase1 = first_reach(1, ropes, False)
        final = first_reach(6, {}, True)
        for p in AUDIT["places"]:
            self.assertEqual(p["progression"]["firstReachPhase1Ropes"], phase1.get(p["id"]), p["id"])
            self.assertEqual(p["progression"]["firstReachAfterOrder"], final.get(p["id"]), p["id"])

    def test_orchard_fen_leak_is_real(self):
        """RA-03: with phase-1 ropes, Threadmeet is reached at 4 badges, not 6."""
        ropes = {r["link"]: r["badge"] for r in GRAPH["ropesUntilOrder"]}
        self.assertEqual(first_reach(1, ropes, False)["sunthread"], 4)
        ropes["orchardfen--sunthread"] = "echo"
        self.assertEqual(first_reach(1, ropes, False)["sunthread"], 6)

    def test_answering_has_no_bellstep_link_yet(self):
        """RA-04: until #523 lands, the cave's only graph link is Flintcut."""
        ends = [l for l in GRAPH["links"] if "answering" in (l["a"], l["b"])]
        if len(ends) == 1:
            self.assertEqual({ends[0]["a"], ends[0]["b"]}, {"flintcut", "answering"})
        else:
            self.assertIn({"hollowecho", "answering"}, [{l["a"], l["b"]} for l in ends])

    def test_after_order_two_badges_reach_38_places(self):
        """RA-01's figure."""
        self.assertEqual(len(reach({"thorn", "tide"}, set(), 6, {})), 38)


class Encounters(unittest.TestCase):
    def test_classes_are_valid_and_towns_have_no_ordinary_encounters(self):
        for p in AUDIT["places"]:
            self.assertIn(p["encounters"], ENCOUNTERS, p["id"])
            if p["kind"] == "town":
                self.assertFalse(p["encounters"].startswith("ordinary"), p["id"])
            if "special" in p["encounters"]:
                self.assertTrue(p.get("specialEncounters"), p["id"])

    def test_at_least_half_of_encounter_areas_feature_an_original_spread_out(self):
        areas = [p for p in AUDIT["places"] if p["encounters"].startswith("ordinary")]
        originals = [p for p in areas if p["originalArea"]]
        self.assertEqual(len(areas), 33)
        self.assertGreaterEqual(2 * len(originals), len(areas))
        for p in AUDIT["places"]:
            if p["originalArea"]:
                self.assertTrue(p["encounters"].startswith("ordinary"), p["id"])
        early = {p["progression"]["firstReachPhase1Ropes"] for p in originals} - {None}
        self.assertTrue({0, 1, 2, 3, 4, 5, 7} <= early, early)


class Landings(unittest.TestCase):
    def test_verified_landings_match_todays_exits(self):
        for l in AUDIT["links"]:
            if l["landing"]["status"] == "verified-legacy-2d":
                self.assertEqual(l["phase"], 0, l["id"])
                self.assertEqual(l["landing"]["arriveAtB"], legacy_exit(l["a"], l["b"]), l["id"])
                self.assertEqual(l["landing"]["arriveAtA"], legacy_exit(l["b"], l["a"]), l["id"])

    def test_candidates_are_real_legacy_tiles_and_stay_unresolved(self):
        for l in AUDIT["links"]:
            cand = l["landing"].get("townSideCandidate")
            if cand:
                self.assertEqual(l["landing"]["status"], "unresolved", l["id"])
                tiles = [{"map": e["to"], "x": e["x"], "y": e["y"], "dir": e["dir"]}
                         for m in GAME["MAPS"].values() for e in m["exits"].values()]
                self.assertIn(cand, tiles, l["id"])

    def test_planned_null_briefs_really_keep_null_landings(self):
        for name in ("knothollow.json", "answering.json"):
            path = os.path.join(WORLD, name)
            if not os.path.exists(path):
                continue
            with open(path, encoding="utf8") as f:
                brief = json.load(f)
            for e in brief["map"]["exits"].values():
                self.assertEqual(e.get("landing"), "planned")
                self.assertIsNone(e.get("x"))

    def test_no_landing_is_invented(self):
        for l in AUDIT["links"]:
            if l["landing"]["status"] != "verified-legacy-2d":
                self.assertNotIn("arriveAtA", l["landing"], l["id"])
                self.assertNotIn("arriveAtB", l["landing"], l["id"])


class Issues(unittest.TestCase):
    def test_issue_records_are_complete_and_referenced(self):
        ids = [i["id"] for i in AUDIT["issues"]]
        self.assertEqual(len(ids), len(set(ids)))
        for i in AUDIT["issues"]:
            self.assertIn(i["priority"], {"P0", "P1", "P2", "P3"}, i["id"])
            for key in ("title", "established", "finding", "recommendation", "owner", "sources"):
                self.assertTrue(i.get(key), (i["id"], key))
        for p in AUDIT["places"]:
            expected = [i["id"] for i in AUDIT["issues"] if p["id"] in i["affects"]]
            self.assertEqual(p["issues"], expected, p["id"])
        for l in AUDIT["links"]:
            for ref in l.get("issues", []):
                self.assertIn(ref, ids)


if __name__ == "__main__":
    unittest.main()
