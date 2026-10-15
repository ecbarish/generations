#!/usr/bin/env python3
"""Checks for docs/plans/wildbond-world/gates.json (WBW-6).

Standalone, no packages:  python3 -m unittest tools/test_wildbond_world_gates.py
It reads files and changes none of them: gates.json, the design doc (docs/plans/wildbond-world-design.md), the game's own
wildbond-godot/data/wildbond.json (BADGES, CAP_TABLE, CAST, MAPS, SCENES), wildbond-godot/scripts/rules.gd (the BOND table)
and wildbond-godot/scripts/main.gd (to see that a story key the file names is a key the game really uses).
If docs/plans/wildbond-world/world-graph.json (WBW-3), knothollow.json (WBW-2) or answering.json (WBW-4) exist, gates.json
is checked against them too. Each of those checks is skipped while its file is not in the tree.

Every rule is a function that takes the parsed file and returns a list of problems, so the tests can run the real file through it
and then run deliberately broken copies and require that each one is caught.
"""
import copy
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GATES = ROOT / "docs/plans/wildbond-world/gates.json"
GRAPH = ROOT / "docs/plans/wildbond-world/world-graph.json"
KNOTHOLLOW = ROOT / "docs/plans/wildbond-world/knothollow.json"
ANSWERING = ROOT / "docs/plans/wildbond-world/answering.json"
DESIGN = ROOT / "docs/plans/wildbond-world-design.md"
GAME = ROOT / "wildbond-godot/data/wildbond.json"
RULES = ROOT / "wildbond-godot/scripts/rules.gd"
MAIN = ROOT / "wildbond-godot/scripts/main.gd"
NOTES = ROOT / "docs/plans/wildbond-world/gates.md"

BADGES = ["thorn", "tide", "ember", "beacon", "reed", "echo", "loom", "horizon"]
LESSONS = ["stone", "tide", "grove", "lantern", "glide", "hush", "daymark"]
LESSON_ELEMENT = {"stone": "Stone", "tide": "Tide", "grove": "Grove", "lantern": "Ember", "glide": "Gale", "hush": "Shade", "daymark": "Radiant"}
KINDS = ["field", "badge", "story", "element"]
BOND_STEPS = {"Friendly": 20, "Loyal": 60, "Devoted": 140}       # the only thresholds a lesson may use (rules.gd BOND)
# Level asked by a lesson, and the cap in force after its teaching badge (the design's section 1 table).
LEVEL_AND_CAP = {"stone": (12, 25), "tide": (18, 35), "glide": (36, 55), "daymark": (64, 70)}
NO_LEVEL = ["grove", "lantern", "hush"]
# Who teaches each lesson. The grove sign is the one teacher who is not a person in CAST.
TEACHERS = {"stone": "isolde", "tide": "nerys", "grove": "antler_sign", "lantern": "toren", "glide": "vessa", "hush": "senna", "daymark": "halen"}
WARDENS = {"thorn": "isolde", "tide": "nerys", "ember": "toren", "beacon": "vessa", "reed": "olan", "echo": "senna", "loom": "halen", "horizon": "rysa"}
# The nine towns with a healer, as map ids. The league keeper is not a Glide destination (the design: Glide never offers the league).
INN_MAPS = ["larkhaven", "thornwood", "lanternquay", "emberfall", "cloudglass", "stillreed", "hollowecho", "sunthread", "farwatch"]
STORY_KEYS = ["depthReturns", "leagueEnding"]
PHASES = [0, 1, 2, 3, 4, 5, 6]
LIFTED = ["WB-WORLD-ORDER"]
KEY_RE = re.compile(r"^(field:(%s)|inn:[a-z_]+|depthReturns|leagueEnding|element:(Stone|Tide))$" % "|".join(LESSONS))


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def game():
    return load(GAME)


def design_headings():
    return {m.group(1).strip() for m in re.finditer(r"^#{2,3} (.+)$", DESIGN.read_text(encoding="utf-8"), re.M)}


def bond_table():
    m = re.search(r"const BOND := (\[\[.*?\]\])", RULES.read_text(encoding="utf-8"))
    return {name: int(n) for name, n in re.findall(r'\["(\w+)",\s*(\d+)\]', m.group(1))}


def cap_after(badge, cap_table):
    return cap_table[BADGES.index(badge) + 1]


# ---------------------------------------------------------------- rules (each returns a list of problems)

def check_lessons(d):
    p = []
    got = [l.get("id") for l in d.get("lessons", [])]
    if got != LESSONS:
        p.append("lessons must be exactly %s in that order, got %s" % (LESSONS, got))
    for l in d.get("lessons", []):
        i = l.get("id")
        t = l.get("teacher")
        if not isinstance(t, dict) or not t.get("id") or not t.get("name"):
            p.append("%s: needs exactly one teacher with an id and a name" % i)
        elif i in TEACHERS and t["id"] != TEACHERS[i]:
            p.append("%s: teacher is %r, the design says %r" % (i, t["id"], TEACHERS[i]))
        if l.get("teachingBadge") not in BADGES:
            p.append("%s: teachingBadge %r is not a BADGES id" % (i, l.get("teachingBadge")))
        if l.get("key") != "field:" + str(i):
            p.append("%s: key must be field:%s" % (i, i))
        if l.get("element") != LESSON_ELEMENT.get(i):
            p.append("%s: element is %r, should be %r" % (i, l.get("element"), LESSON_ELEMENT.get(i)))
        r = l.get("ready") or {}
        if r.get("element") != l.get("element") or r.get("onWalkingTeam") is not True:
            p.append("%s: ready must name the lesson's element and require the partner on the walking team" % i)
        if r.get("mode") not in ("any", "all") or not r.get("conditions"):
            p.append("%s: ready needs a mode (any or all) and at least one condition" % i)
    return p


def check_keys(d, story_keys_in_game):
    p = []
    seen_ids = set()
    for g in d.get("gates", []):
        gid, kind, key = g.get("id"), g.get("kind"), g.get("key")
        if gid in seen_ids:
            p.append("duplicate gate id %s" % gid)
        seen_ids.add(gid)
        if kind not in KINDS:
            p.append("%s: kind %r is not one of %s" % (gid, kind, KINDS))
            continue
        ok = False
        if kind == "badge":
            ok = key in BADGES
        elif kind == "field":
            ok = isinstance(key, str) and key.startswith("field:") and key[6:] in LESSONS
        elif kind == "element":
            ok = key in ("element:Stone", "element:Tide")
        elif kind == "story":
            ok = key in STORY_KEYS or (isinstance(key, str) and re.match(r"^inn:(%s)$" % "|".join(INN_MAPS), key) is not None)
            if key in STORY_KEYS and key not in story_keys_in_game:
                p.append("%s: story key %s is not one the game uses" % (gid, key))
        if not ok:
            p.append("%s: key %r does not fit kind %s" % (gid, key, kind))
        if kind != "badge" and not KEY_RE.match(str(key)):
            p.append("%s: key %r does not match the allowed pattern" % (gid, key))
    for l in d.get("lessons", []):
        if not KEY_RE.match(str(l.get("key"))):
            p.append("lesson %s: key %r does not match the allowed pattern" % (l.get("id"), l.get("key")))
    return p


def check_bonds(d, bond_table_in_game):
    p = []
    for l in d.get("lessons", []):
        for c in (l.get("ready") or {}).get("conditions", []):
            if c.get("type") == "bond":
                step, n = c.get("step"), c.get("min")
                if n not in BOND_STEPS.values():
                    p.append("%s: bond threshold %r is not 20, 60 or 140" % (l.get("id"), n))
                if bond_table_in_game.get(step) != n:
                    p.append("%s: bond step %r is %r in rules.gd BOND, the file says %r" % (l.get("id"), step, bond_table_in_game.get(step), n))
            elif c.get("type") == "level":
                if not isinstance(c.get("min"), int) or c["min"] < 1:
                    p.append("%s: level %r is not a positive whole number" % (l.get("id"), c.get("min")))
            elif c.get("type") == "scene":
                if not c.get("text"):
                    p.append("%s: a scene condition needs its text" % l.get("id"))
            else:
                p.append("%s: unknown condition type %r" % (l.get("id"), c.get("type")))
    b = d.get("bondSteps", {})
    for name, n in bond_table_in_game.items():
        if b.get(name) != n:
            p.append("bondSteps.%s is %r, rules.gd says %r" % (name, b.get(name), n))
    return p


def check_caps(d, cap_table):
    p = []
    for l in d.get("lessons", []):
        i = l.get("id")
        if l.get("teachingBadge") not in BADGES:
            continue
        cap = cap_after(l["teachingBadge"], cap_table)
        if l.get("capAfterTeachingBadge") != cap:
            p.append("%s: capAfterTeachingBadge is %r, CAP_TABLE says %r" % (i, l.get("capAfterTeachingBadge"), cap))
        levels = [c["min"] for c in l["ready"]["conditions"] if c.get("type") == "level"]
        bonds = [c for c in l["ready"]["conditions"] if c.get("type") == "bond"]
        for lv in levels:
            if lv > cap:
                p.append("%s: ready level %d is above the cap %d after the %s badge" % (i, lv, cap, l["teachingBadge"]))
            if l["ready"]["mode"] != "any" or not bonds:
                p.append("%s: a level needs a bond alternative (mode any), so a tamer who fought early can still be ready" % i)
        if i in LEVEL_AND_CAP:
            if levels != [LEVEL_AND_CAP[i][0]] or cap != LEVEL_AND_CAP[i][1]:
                p.append("%s: expected level %d and cap %d, got %s and %s" % (i, LEVEL_AND_CAP[i][0], LEVEL_AND_CAP[i][1], levels, cap))
        if i in NO_LEVEL and levels:
            p.append("%s: the design gives this lesson no level" % i)
    return p


def check_league(d):
    keys = sorted(g["key"] for g in d.get("gates", []) if g.get("place") == "trialstair--league" and g.get("kind") == "badge")
    return [] if keys == sorted(BADGES) else ["the league door needs all 8 badges, found %s" % keys]


def check_today_elements(d, g):
    p = []
    want = {}
    for m, v in g["MAPS"].items():
        for ex, e in (v.get("exits") or {}).items():
            if "requiresElement" in e:
                want[(m, ex)] = "element:" + e["requiresElement"]
    if len(want) != 2:
        p.append("the game has %d requiresElement exits, expected 2" % len(want))
    have = {}
    for r in d.get("gates", []):
        if r.get("kind") == "element" and r.get("today"):
            have[(r["today"].get("map"), r["today"].get("exit"))] = r["key"]
    if have != want:
        p.append("element gates for today's exits are %s, the game has %s" % (have, want))
    if sorted(r["key"] for r in d.get("gates", []) if r.get("kind") == "element") != sorted(want.values()):
        p.append("the file has element gates other than today's two exits")
    return p


def check_shape(d, headings, cast_ids, graph_ids=None):
    p = []
    ids = {g["id"] for g in d["gates"]}
    lessons = {l["id"]: l for l in d["lessons"]}
    doors = {}
    for g in d["gates"]:
        gid = g.get("id")
        for f in ("id", "door", "place", "kind", "key", "teacher", "ready", "phase", "source"):
            if f not in g:
                p.append("%s: missing %s" % (gid, f))
        if g.get("phase") not in PHASES:
            p.append("%s: phase %r is not 0 to 6" % (gid, g.get("phase")))
        if g.get("liftedIn") not in (None, *LIFTED):
            p.append("%s: liftedIn %r is not a known phase name" % (gid, g.get("liftedIn")))
        if g.get("place") is None and not g.get("scope"):
            p.append("%s: no place and no scope" % gid)
        s = g.get("source") or {}
        if s.get("heading") not in headings:
            p.append("%s: source heading %r is not a heading in the design doc" % (gid, s.get("heading")))
        doors.setdefault(g.get("door"), []).append(g)
        if g.get("kind") == "field":
            L = lessons.get(str(g.get("key"))[6:])
            if L is None:
                continue
            if g.get("teacher") != L["teacher"]["id"]:
                p.append("%s: teacher %r differs from the lesson's %r" % (gid, g.get("teacher"), L["teacher"]["id"]))
            if g.get("ready") != L["ready"]:
                p.append("%s: ready rule differs from the lesson's" % gid)
        else:
            if g.get("teacher") is not None:
                p.append("%s: only a field gate has a teacher" % gid)
        if g.get("kind") == "badge" and g.get("ready") != {"badge": g.get("key")}:
            p.append("%s: a badge gate's ready rule is that badge" % gid)
        if g.get("kind") == "story" and g.get("ready") != {"story": g.get("key")}:
            p.append("%s: a story gate's ready rule is that key" % gid)
        for k in g.get("alsoNeeds", []):
            if k not in {l["key"] for l in d["lessons"]}:
                p.append("%s: alsoNeeds %r is not a lesson key" % (gid, k))
    for door, rs in doors.items():
        if len({(r["place"], r["phase"]) for r in rs}) != 1:
            p.append("door %s: its records disagree on place or phase" % door)
        if len({r["key"] for r in rs}) != len(rs):
            p.append("door %s asks for the same key twice" % door)
    for l in d["lessons"]:
        s = l.get("source") or {}
        if s.get("heading") not in headings:
            p.append("lesson %s: source heading is not in the design doc" % l["id"])
        if l["teacher"]["id"] != "antler_sign" and l["teacher"]["id"] not in cast_ids:
            p.append("lesson %s: teacher %r is not in CAST" % (l["id"], l["teacher"]["id"]))
        if not any(g["kind"] == "field" and g["key"] == l["key"] for g in d["gates"]):
            p.append("lesson %s: no gate uses it" % l["id"])
    for b in d["badges"]:
        if b["warden"] not in cast_ids or WARDENS.get(b["id"]) != b["warden"]:
            p.append("badge %s: warden %r" % (b["id"], b["warden"]))
    if [b["id"] for b in d["badges"]] != BADGES:
        p.append("badges must list the eight BADGES ids in order")
    if graph_ids is not None:
        for g in d["gates"]:
            if g.get("place") is not None and g["place"] not in graph_ids:
                p.append("%s: place %r is not in the world graph" % (g["id"], g["place"]))
    return p


def check_inns(d):
    have = sorted(g["key"][4:] for g in d["gates"] if g["kind"] == "story" and g["key"].startswith("inn:"))
    p = [] if have == sorted(INN_MAPS) else ["inn gates must be exactly the nine healer towns %s, got %s" % (sorted(INN_MAPS), have)]
    for g in d["gates"]:
        if g["kind"] == "story" and g["key"].startswith("inn:"):
            if g["place"] != g["key"][4:] or g.get("alsoNeeds") != ["field:glide"] or g["phase"] != 4:
                p.append("%s: an inn gate sits on its own map, also needs field:glide, and is phase 4" % g["id"])
    return p


def graph_gate_set(link, ropes):
    out = set()
    for g in link["gate"]:
        (k, v), = g.items()
        if k == "badges":
            out |= {("badge", b) for b in BADGES}
        elif k == "badge":
            out.add(("badge", v))
        elif k == "field":
            out.add(("field", "field:" + v))
        elif k == "element":
            out.add(("element", "element:" + v))
        elif k == "story":
            out.add(("story", v))
    if link["id"] in ropes:
        out.add(("badge", ropes[link["id"]]))
    return out


def check_graph(d, graph):
    p = []
    ropes = {r["link"]: r["badge"] for r in graph["ropesUntilOrder"]}
    links = {l["id"]: l for l in graph["links"]}
    by_place = {}
    for g in d["gates"]:
        by_place.setdefault(g["place"], set()).add((g["kind"], g["key"]))
    for lid, l in links.items():
        want = graph_gate_set(l, ropes)
        have = by_place.get(lid, set())
        if want != have:
            p.append("link %s: the graph's gates are %s, gates.json has %s" % (lid, sorted(want), sorted(have)))
    for g in d["gates"]:
        if g["place"] in links:
            if g["phase"] != links[g["place"]]["phase"]:
                p.append("%s: phase %s, the graph's link is phase %s" % (g["id"], g["phase"], links[g["place"]]["phase"]))
            if g["kind"] == "badge" and g["place"] in ropes and not g.get("liftedIn"):
                p.append("%s: a rope the graph says is lifted by the order phase must say so" % g["id"])
    towns = {x["id"] for x in graph["places"] if x.get("kind") == "town"}
    inns = {g["place"] for g in d["gates"] if g["kind"] == "story" and g["key"].startswith("inn:")}
    if inns != towns - {"league"}:
        p.append("inn gates are on %s, the graph's healer towns (without the league) are %s" % (sorted(inns), sorted(towns - {"league"})))
    return p


def check_exit_file(d, f, place):
    """A cave file (WBW-2's or WBW-4's) lists its own gates and the requirements on the ways in. Both must match gates.json."""
    p = []
    here = {g["key"] for g in d["gates"] if g["place"] == place}
    links = {}
    for g in d["gates"]:
        if g["place"] and "--" in g["place"] and place in g["place"].split("--"):
            other = [x for x in g["place"].split("--") if x != place][0]
            links.setdefault(other, set()).add((g["kind"], g["key"]))
    # A gate inside the cave can be a door on one of the cave's links (the grove's back ring is a link, and also a gate in Knothollow).
    here |= {g["key"] for g in d["gates"] if g["place"] and "--" in g["place"] and place in g["place"].split("--")}
    for g in f.get("gates", []):
        if g.get("key") not in here:
            p.append("%s's gate %r is not a gate at %s in gates.json" % (place, g.get("key"), place))
    inc = (f.get("integration") or {}).get("incoming_requirements") or {}
    for dest, req in inc.items():
        for k, v in req.items():
            want = ("badge", v) if k == "badge" else ("field" if v.startswith("field:") else "story", v)
            if want not in links.get(dest, set()):
                p.append("the way in from %s needs %s in %s, gates.json has %s there" % (dest, v, f.get("id"), sorted(links.get(dest, set()))))
    return p


# ---------------------------------------------------------------- the real file

class Base(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.d = load(GATES)
        cls.g = game()
        cls.headings = design_headings()
        cls.cast = set(cls.g["CAST"])
        cls.bonds = bond_table()
        cls.story_keys = {k for k in STORY_KEYS if k in cls.g["SCENES"] or re.search(r'story_done\.has\("%s"\)' % k, MAIN.read_text(encoding="utf-8"))}

    def mutant(self, edit):
        d = copy.deepcopy(self.d)
        edit(d)
        return d


class Lessons(Base):
    def test_all_seven_lessons_have_one_teacher_and_one_teaching_badge(self):
        self.assertEqual(check_lessons(self.d), [])
        self.assertEqual([l["id"] for l in self.d["lessons"]], LESSONS)
        for l in self.d["lessons"]:
            self.assertIn(l["teachingBadge"], BADGES)
            self.assertIsInstance(l["teacher"]["id"], str)

    def test_the_teachers_and_badges_are_the_designs(self):
        got = {l["id"]: (l["teacher"]["id"], l["teachingBadge"]) for l in self.d["lessons"]}
        self.assertEqual(got, {"stone": ("isolde", "thorn"), "tide": ("nerys", "tide"), "grove": ("antler_sign", "thorn"),
                               "lantern": ("toren", "ember"), "glide": ("vessa", "beacon"), "hush": ("senna", "echo"), "daymark": ("halen", "loom")})

    def test_grove_wake_badge_is_marked_as_inferred(self):
        grove = [l for l in self.d["lessons"] if l["id"] == "grove"][0]
        self.assertIn("inferred", grove["teachingBadgeNote"])
        self.assertTrue(all("teachingBadgeNote" not in l for l in self.d["lessons"] if l["id"] != "grove"))

    def test_teachers_who_are_people_exist_in_the_game(self):
        for l in self.d["lessons"]:
            if l["teacher"]["id"] != "antler_sign":
                self.assertIn(l["teacher"]["id"], self.cast)

    def test_broken_lessons_are_caught(self):
        edits = {
            "a lesson dropped": lambda d: d["lessons"].pop(),
            "lessons out of order": lambda d: d["lessons"].reverse(),
            "no teacher": lambda d: d["lessons"][0].pop("teacher"),
            "empty teacher id": lambda d: d["lessons"][1]["teacher"].update(id=""),
            "wrong teacher": lambda d: d["lessons"][0]["teacher"].update(id="nerys"),
            "bad teaching badge": lambda d: d["lessons"][2].update(teachingBadge="bell"),
            "no teaching badge": lambda d: d["lessons"][3].pop("teachingBadge"),
            "wrong element": lambda d: d["lessons"][4].update(element="Tide"),
            "partner need dropped": lambda d: d["lessons"][0]["ready"].update(onWalkingTeam=False),
            "no conditions": lambda d: d["lessons"][5]["ready"].update(conditions=[]),
            "bad mode": lambda d: d["lessons"][0]["ready"].update(mode="some"),
            "wrong key": lambda d: d["lessons"][6].update(key="field:daymarks"),
        }
        for name, e in edits.items():
            with self.subTest(name):
                self.assertTrue(check_lessons(self.mutant(e)), name)


class Keys(Base):
    def test_every_key_matches_the_allowed_pattern_or_is_a_badges_id(self):
        self.assertEqual(check_keys(self.d, self.story_keys), [])
        for g in self.d["gates"]:
            self.assertTrue(g["key"] in BADGES or KEY_RE.match(g["key"]), g["key"])

    def test_badge_ids_are_the_games_badges(self):
        self.assertEqual(list(self.g["BADGES"]), BADGES)

    def test_story_keys_are_keys_the_game_already_uses(self):
        self.assertEqual(self.story_keys, set(STORY_KEYS))
        used = {g["key"] for g in self.d["gates"] if g["kind"] == "story" and not g["key"].startswith("inn:")}
        self.assertEqual(used, set(STORY_KEYS))

    def test_no_gate_names_a_save_field_other_than_story_and_badges(self):
        # Section 6 of the design: phases 2 to 6 add only story keys. Nothing here may need a new save field.
        for g in self.d["gates"]:
            self.assertIn(g["kind"], KINDS)
            if g["kind"] == "story":
                self.assertTrue(g["key"] in STORY_KEYS or g["key"].startswith("inn:"))
        self.assertNotIn("lessons", json.dumps([g["key"] for g in self.d["gates"]]))

    def test_broken_keys_are_caught(self):
        edits = {
            "unknown kind": lambda d: d["gates"][0].update(kind="rope"),
            "a field key for the wrong lesson": lambda d: next(g for g in d["gates"] if g["kind"] == "field").update(key="field:swim"),
            "a badge that does not exist": lambda d: next(g for g in d["gates"] if g["kind"] == "badge").update(key="bell"),
            "an inn on a map that has none": lambda d: next(g for g in d["gates"] if g["key"].startswith("inn:")).update(key="inn:spire"),
            "a new story key": lambda d: next(g for g in d["gates"] if g["kind"] == "story").update(key="sq:x:done"),
            "an element nobody checks": lambda d: next(g for g in d["gates"] if g["kind"] == "element").update(key="element:Gale"),
            "a field key under a badge kind": lambda d: next(g for g in d["gates"] if g["kind"] == "badge").update(key="field:stone"),
            "duplicate id": lambda d: d["gates"][1].update(id=d["gates"][0]["id"]),
            "lesson key off pattern": lambda d: d["lessons"][0].update(key="field:Stone"),
        }
        for name, e in edits.items():
            with self.subTest(name):
                self.assertTrue(check_keys(self.mutant(e), self.story_keys), name)


class Bonds(Base):
    def test_bond_thresholds_are_only_20_60_or_140_and_match_rules_gd(self):
        self.assertEqual(check_bonds(self.d, self.bonds), [])
        found = {c["min"] for l in self.d["lessons"] for c in l["ready"]["conditions"] if c["type"] == "bond"}
        self.assertEqual(found, {20, 60, 140})

    def test_rules_gd_bond_table_is_what_the_test_thinks(self):
        self.assertEqual(self.bonds, {"Wary": 0, "Friendly": 20, "Loyal": 60, "Devoted": 140, "Bonded": 280})

    def test_which_lessons_use_which_bond(self):
        got = {l["id"]: [c["step"] for c in l["ready"]["conditions"] if c["type"] == "bond"] for l in self.d["lessons"]}
        self.assertEqual(got, {"stone": ["Friendly"], "tide": ["Friendly"], "grove": ["Loyal"], "lantern": ["Loyal"],
                               "glide": ["Loyal"], "hush": [], "daymark": ["Devoted"]})

    def test_broken_bonds_are_caught(self):
        def setbond(i, **kw):
            def e(d):
                c = [c for c in d["lessons"][i]["ready"]["conditions"] if c["type"] == "bond"][0]
                c.update(kw)
            return e
        edits = {
            "a bond of 50": setbond(0, min=50),
            "a bond of 280": setbond(6, min=280, step="Bonded"),
            "a bond whose name and number disagree": setbond(2, step="Devoted"),
            "an unknown step": setbond(1, step="Fond"),
            "a changed table": lambda d: d["bondSteps"].update(Loyal=70),
            "an unknown condition": lambda d: d["lessons"][5]["ready"]["conditions"].append({"type": "mood"}),
            "a zero level": lambda d: d["lessons"][0]["ready"]["conditions"][0].update(min=0),
            "a scene with no text": lambda d: d["lessons"][5]["ready"]["conditions"][0].update(text=""),
        }
        for name, e in edits.items():
            with self.subTest(name):
                self.assertTrue(check_bonds(self.mutant(e), self.bonds), name)


class Caps(Base):
    def test_each_ready_level_is_at_or_below_the_cap_after_its_teaching_badge(self):
        self.assertEqual(check_caps(self.d, self.g["CAP_TABLE"]), [])
        got = {}
        for l in self.d["lessons"]:
            for c in l["ready"]["conditions"]:
                if c["type"] == "level":
                    got[l["id"]] = (c["min"], l["capAfterTeachingBadge"])
        self.assertEqual(got, LEVEL_AND_CAP)

    def test_every_level_has_a_bond_alternative(self):
        for l in self.d["lessons"]:
            kinds = [c["type"] for c in l["ready"]["conditions"]]
            if "level" in kinds:
                self.assertIn("bond", kinds, l["id"])
                self.assertEqual(l["ready"]["mode"], "any", l["id"])

    def test_lessons_without_a_level_have_none(self):
        for l in self.d["lessons"]:
            if l["id"] in NO_LEVEL:
                self.assertNotIn("level", [c["type"] for c in l["ready"]["conditions"]])

    def test_the_cap_table_is_the_games(self):
        self.assertEqual(self.g["CAP_TABLE"], [15, 25, 35, 45, 55, 60, 65, 70, 75])
        self.assertEqual({l["id"]: l["capAfterTeachingBadge"] for l in self.d["lessons"]},
                         {"stone": 25, "tide": 35, "grove": 25, "lantern": 45, "glide": 55, "hush": 65, "daymark": 70})

    def test_broken_levels_are_caught(self):
        def level(i, n):
            return lambda d: [c for c in d["lessons"][i]["ready"]["conditions"] if c["type"] == "level"][0].update(min=n)
        edits = {
            "stone one over the cap": level(0, 26),
            "tide one over the cap": level(1, 36),
            "glide one over the cap": level(4, 56),
            "daymark one over the cap": level(6, 71),
            "stone changed but under the cap": level(0, 13),
            "teaching badge moved earlier": lambda d: d["lessons"][6].update(teachingBadge="echo"),
            "a stale cap": lambda d: d["lessons"][4].update(capAfterTeachingBadge=45),
            "a level with no bond alternative": lambda d: d["lessons"][0]["ready"].update(conditions=[d["lessons"][0]["ready"]["conditions"][0]]),
            "a level on a lesson that has none": lambda d: d["lessons"][2]["ready"]["conditions"].append({"type": "level", "min": 5}),
        }
        for name, e in edits.items():
            with self.subTest(name):
                self.assertTrue(check_caps(self.mutant(e), self.g["CAP_TABLE"]), name)


class League(Base):
    def test_the_league_needs_all_eight_badges(self):
        self.assertEqual(check_league(self.d), [])

    def test_any_seven_badges_fail(self):
        for b in BADGES:
            with self.subTest(b):
                d = self.mutant(lambda d: d.update(gates=[g for g in d["gates"] if not (g["place"] == "trialstair--league" and g["key"] == b)]))
                self.assertTrue(check_league(d))

    def test_a_ninth_requirement_or_a_wrong_kind_fails(self):
        d = self.mutant(lambda d: next(g for g in d["gates"] if g["place"] == "trialstair--league").update(kind="field"))
        self.assertTrue(check_league(d))

    def test_the_league_gates_share_one_door_and_phase_6(self):
        rs = [g for g in self.d["gates"] if g["place"] == "trialstair--league"]
        self.assertEqual({g["door"] for g in rs}, {"trialstair--league"})
        self.assertEqual({g["phase"] for g in rs}, {6})
        self.assertEqual(len(rs), 8)

    def test_the_spire_still_needs_the_champion_ending(self):
        rs = [g for g in self.d["gates"] if g["place"] == "league--spire"]
        self.assertEqual([(g["kind"], g["key"], g["phase"]) for g in rs], [("story", "leagueEnding", 0)])
        self.assertEqual(self.g["MAPS"]["league"]["exits"]["W"]["to"], "spire")


class TodaysElementExits(Base):
    def test_both_existing_requires_element_exits_appear(self):
        self.assertEqual(check_today_elements(self.d, self.g), [])
        self.assertEqual({(r["today"]["map"], r["today"]["exit"], r["key"]) for r in self.d["gates"] if r["kind"] == "element"},
                         {("thornwood_route", "E", "element:Stone"), ("saltmarsh_route", "W", "element:Tide")})

    def test_element_gates_need_no_lesson(self):
        for r in self.d["gates"]:
            if r["kind"] == "element":
                self.assertIsNone(r["teacher"])
                self.assertNotIn("alsoNeeds", r)
                self.assertTrue(r["ready"]["onWalkingTeam"])

    def test_broken_element_gates_are_caught(self):
        def drop(d):
            d["gates"] = [g for g in d["gates"] if g["kind"] != "element" or g["key"] != "element:Tide"]
        edits = {
            "the Tide pocket dropped": drop,
            "wrong exit": lambda d: next(g for g in d["gates"] if g["kind"] == "element").update(today={"map": "thornwood_route", "exit": "N"}),
            "wrong element": lambda d: next(g for g in d["gates"] if g["key"] == "element:Stone").update(key="element:Tide"),
            "a third element gate": lambda d: d["gates"].append(dict(d["gates"][0], id="x", kind="element", key="element:Stone", today=None)),
        }
        for name, e in edits.items():
            with self.subTest(name):
                self.assertTrue(check_today_elements(self.mutant(e), self.g), name)


class Shape(Base):
    def test_the_file_is_well_formed(self):
        self.assertEqual(self.d["schemaVersion"], 1)
        self.assertEqual(check_shape(self.d, self.headings, self.cast), [])

    def test_every_gate_has_a_source_heading_that_is_in_the_design_doc(self):
        text = DESIGN.read_text(encoding="utf-8")
        for g in self.d["gates"]:
            part = g["source"].get("part")
            if part:
                self.assertIn(part, text, g["id"])

    def test_inn_gates_are_the_nine_healer_towns(self):
        self.assertEqual(check_inns(self.d), [])

    def test_counts(self):
        kinds = {k: len([g for g in self.d["gates"] if g["kind"] == k]) for k in KINDS}
        self.assertEqual(kinds, {"field": 34, "badge": 17, "story": 11, "element": 2})
        self.assertEqual(len(self.d["gates"]), 64)

    def test_every_lesson_gates_at_least_one_door(self):
        for l in LESSONS:
            self.assertTrue([g for g in self.d["gates"] if g["key"] == "field:" + l], l)

    def test_no_lesson_gate_is_before_its_phase(self):
        first = {"stone": 2, "tide": 2, "grove": 2, "lantern": 3, "glide": 4, "hush": 6, "daymark": 6}
        for g in self.d["gates"]:
            if g["kind"] == "field":
                self.assertGreaterEqual(g["phase"], first[g["key"][6:]], g["id"])

    def test_glide_has_one_way_glassfall_and_no_cave_or_league(self):
        glide = [g for g in self.d["gates"] if g["key"] == "field:glide"]
        self.assertEqual([g["place"] for g in glide], ["glassfall"])
        for g in self.d["gates"]:
            if "field:glide" in g.get("alsoNeeds", []):
                self.assertNotIn(g["place"], ["kilnvent", "knothollow", "answering", "lowbell", "keelcave", "trialstair", "league", "spire"])

    def test_the_orders_ropes_are_marked_as_lifted(self):
        ropes = [g for g in self.d["gates"] if g.get("liftedIn")]
        self.assertEqual(sorted(g["key"] for g in ropes), ["beacon", "echo", "ember", "loom", "reed"])
        self.assertTrue(all(g["kind"] == "badge" and g["phase"] == 1 for g in ropes))

    def test_the_two_gates_on_the_through_burrow_share_one_door(self):
        rs = [g for g in self.d["gates"] if g["door"] == "larkburrow--sunthread"]
        self.assertEqual(sorted(g["key"] for g in rs), ["field:stone", "loom"])

    def test_the_reveal_stair_needs_the_reveal_and_hush(self):
        rs = [g for g in self.d["gates"] if g["door"] == "hollowecho-reveal-stair"]
        self.assertEqual(sorted(g["key"] for g in rs), ["depthReturns", "field:hush"])

    def test_broken_gates_are_caught(self):
        def g0(d, **kw):
            d["gates"][0].update(**kw)
        edits = {
            "missing field": lambda d: d["gates"][0].pop("phase"),
            "phase 9": lambda d: g0(d, phase=9),
            "unknown liftedIn": lambda d: g0(d, liftedIn="LATER"),
            "no place and no scope": lambda d: g0(d, place=None),
            "heading not in the design": lambda d: g0(d, source={"heading": "9. Nothing"}),
            "teacher on a badge gate": lambda d: g0(d, teacher="isolde"),
            "ready rule drifted from its lesson": lambda d: next(g for g in d["gates"] if g["kind"] == "field")["ready"].update(mode="all" if next(g for g in d["gates"] if g["kind"] == "field")["ready"]["mode"] == "any" else "any"),
            "teacher differs from the lesson": lambda d: next(g for g in d["gates"] if g["kind"] == "field").update(teacher="halen"),
            "a door that disagrees on phase": lambda d: next(g for g in d["gates"] if g["door"] == "larkburrow--sunthread").update(phase=5),
            "the same key twice on a door": lambda d: next(g for g in d["gates"] if g["door"] == "larkburrow--sunthread").update(key="loom") or d["gates"].append(dict(next(g for g in d["gates"] if g["id"] == "larkburrow--sunthread:loom"), id="dup")),
            "an unused lesson": lambda d: d["gates"].__setitem__(slice(None), [g for g in d["gates"] if g["key"] != "field:daymark"]),
            "a teacher not in CAST": lambda d: d["lessons"][0]["teacher"].update(id="nobody"),
            "an inn dropped": lambda d: d["gates"].__setitem__(slice(None), [g for g in d["gates"] if g["key"] != "inn:farwatch"]),
            "an inn that does not need Glide": lambda d: next(g for g in d["gates"] if g["key"] == "inn:larkhaven").update(alsoNeeds=[]),
        }
        for name, e in edits.items():
            with self.subTest(name):
                m = self.mutant(e)
                try:
                    found = check_shape(m, self.headings, self.cast) + check_inns(m)
                except Exception:
                    found = ["raised"]
                self.assertTrue(found, name)


@unittest.skipUnless(GRAPH.exists(), "WBW-3's world-graph.json is not on this branch yet")
class AgreesWithTheWorldGraph(Base):
    def test_gates_match_the_graphs_links_places_and_phases(self):
        graph = load(GRAPH)
        self.assertEqual(check_graph(self.d, graph), [])
        ids = {p["id"] for p in graph["places"]} | {l["id"] for l in graph["links"]}
        self.assertEqual(check_shape(self.d, self.headings, self.cast, graph_ids=ids), [])

    def test_broken_copies_are_caught(self):
        graph = load(GRAPH)
        edits = {
            "a gate dropped": lambda d: d["gates"].__setitem__(slice(None), [g for g in d["gates"] if g["id"] != "glassfall:field:glide"]),
            "a gate with the wrong key": lambda d: next(g for g in d["gates"] if g["id"] == "orchardfen--sootpath:field:stone").update(key="field:tide"),
            "a phase that moved": lambda d: next(g for g in d["gates"] if g["id"] == "kilnvent--sootpath:field:lantern").update(phase=2),
            "a rope that no longer says the order phase lifts it": lambda d: next(g for g in d["gates"] if g["id"] == "cloudglass--passfoot:beacon").pop("liftedIn"),
            "an invented gate on an open link": lambda d: d["gates"].append(dict(d["gates"][0], id="y", place="larkhaven--millgrass", door="y")),
        }
        for name, e in edits.items():
            with self.subTest(name):
                self.assertTrue(check_graph(self.mutant(e), graph), name)
        ids = {p["id"] for p in graph["places"]} | {l["id"] for l in graph["links"]}
        d = self.mutant(lambda d: next(g for g in d["gates"] if g["kind"] == "field").update(place="nowhere"))
        self.assertTrue(check_shape(d, self.headings, self.cast, graph_ids=ids))


class CaveFiles(Base):
    """The agreement check, run on a stand-in cave file so it is tested even while WBW-2's and WBW-4's real files are not here."""

    FILE = {"id": "knothollow", "gates": [{"key": "field:stone"}, {"key": "field:grove"}],
            "integration": {"incoming_requirements": {"rootwater": {"badge": "thorn"}, "thornwood_grove": {"story": "field:grove"}}}}

    def test_a_matching_file_has_no_problems(self):
        self.assertEqual(check_exit_file(self.d, self.FILE, "knothollow"), [])

    def test_the_stone_crack_is_a_gate_at_knothollow_and_the_grove_key_is_on_its_back_door(self):
        self.assertIn(("field:stone"), {g["key"] for g in self.d["gates"] if g["place"] == "knothollow"})
        self.assertIn(("field", "field:grove"), {(g["kind"], g["key"]) for g in self.d["gates"] if g["place"] == "thornwood_grove--knothollow"})

    def test_a_file_that_disagrees_is_caught(self):
        bad = {
            "a gate gates.json does not have": dict(self.FILE, gates=[{"key": "field:hush"}]),
            "a front door badge that is wrong": dict(self.FILE, integration={"incoming_requirements": {"rootwater": {"badge": "tide"}}}),
            "a back door key that is wrong": dict(self.FILE, integration={"incoming_requirements": {"thornwood_grove": {"story": "field:stone"}}}),
            "a way in that does not exist": dict(self.FILE, integration={"incoming_requirements": {"larkhaven": {"badge": "thorn"}}}),
        }
        for name, f in bad.items():
            with self.subTest(name):
                self.assertTrue(check_exit_file(self.d, f, "knothollow"), name)

    def test_an_answering_ways_file_with_the_rows_gates_matches(self):
        f = {"id": "answering", "gates": [{"key": "field:lantern"}, {"key": "field:stone"}, {"key": "field:hush"}]}
        self.assertEqual(check_exit_file(self.d, f, "answering"), [])
        self.assertTrue(check_exit_file(self.d, {"id": "answering", "gates": [{"key": "field:glide"}]}, "answering"))

    @unittest.skipUnless(KNOTHOLLOW.exists(), "WBW-2's knothollow.json is not on this branch yet")
    def test_the_real_knothollow_file_agrees(self):
        self.assertEqual(check_exit_file(self.d, load(KNOTHOLLOW), "knothollow"), [])

    @unittest.skipUnless(ANSWERING.exists(), "WBW-4's answering.json is not on this branch yet")
    def test_the_real_answering_file_agrees(self):
        self.assertEqual(check_exit_file(self.d, load(ANSWERING), "answering"), [])


class Notes(Base):
    def test_gates_md_lists_every_door_and_every_lesson(self):
        text = NOTES.read_text(encoding="utf-8")
        for door in {g["door"] for g in self.d["gates"]}:
            self.assertIn("`%s`" % door, text, door)
        for l in self.d["lessons"]:
            self.assertIn("`%s`" % l["key"], text)
        self.assertIn("%d records" % len(self.d["gates"]), text)

    def test_gates_md_names_its_open_points(self):
        text = NOTES.read_text(encoding="utf-8")
        self.assertIn("## Open points", text)
        self.assertIn("inferred", text)


class Rules(Base):
    def test_the_file_makes_no_change_to_the_game_or_the_save(self):
        # Reads only. The three files WBW-6 adds are the whole change; this test cannot see the diff, so it checks the file's own claim.
        self.assertNotIn("SAVE_V", json.dumps(self.d))
        self.assertTrue(all(g["kind"] != "story" or g["key"] in STORY_KEYS or g["key"].startswith("inn:") for g in self.d["gates"]))

    def test_the_design_doc_still_has_the_headings_the_file_cites(self):
        for h in ("1. Field abilities", "2. The connected map", "Where the valley is today", "WB-WORLD-1 — Towns and the routes between them"):
            self.assertIn(h, self.headings)


if __name__ == "__main__":
    unittest.main()
