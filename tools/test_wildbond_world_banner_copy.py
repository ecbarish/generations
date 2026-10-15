#!/usr/bin/env python3
"""WBW-12 proposed copy, source fidelity, current-map safety and estimated fit.

Run: python3 -m unittest tools/test_wildbond_world_banner_copy.py
Only reads repository files. No Godot/font packages, runtime changes or saves.
The estimate reserves 8px padding and one full 8px em per printable ASCII
character: (344 - 8) // 8 = 42 characters on one line. It is not a pixel
measurement or accessibility approval; the clarity PR must render the copy.
"""
import copy
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COPY = ROOT / "docs/plans/wildbond-world/banner-copy.json"
SOURCE = "docs/plans/wildbond-world-design.md"
BADGES = ["thorn", "tide", "ember", "beacon", "reed", "echo", "loom", "horizon"]
WARDENS = ["isolde", "nerys", "toren", "vessa", "olan", "senna", "halen", "rysa"]
PATHS = [
    ["larkhaven", "thornwood_route", "thornwood"],
    ["thornwood", "saltmarsh_route", "saltmarsh"],
    ["saltmarsh", "emberfall"], ["emberfall", "cloudglass"],
    ["cloudglass", "stillreed"], ["stillreed", "hollowecho"],
    ["hollowecho", "sunthread"], ["sunthread", "farwatch"], ["farwatch", "league"],
]
DIRECTIONS = ["N", "N", "E", "N", "E", "E", "E", "E", "N"]
CARDINALS = {"N": "north", "E": "east"}
CURRENT_WALKS = {2: "high road", 4: "ferry path", 5: "hill trail",
                 6: "gathering trail", 7: "coastal road", 8: "league road"}
PLANNED = [
    ["thornwood_route", "thornwood"],
    ["thornwood", "saltmarsh_route", "saltmarsh"],
    ["saltmarsh", "ashstair", "emberfall"], ["emberfall", "cloudglass"],
    ["cloudglass", "passfoot", "stillreed"], ["stillreed", "latepath", "hollowecho"],
    ["ribbonroad", "orchardfen", "sunthread"], ["sheltermile", "farwatch"],
    ["farwatch", "trialroad", "trialstair", "league"],
]
INTEGRATION_KEYS = {"owner", "selection", "opening", "order", "champion", "letters", "copy", "review"}
FIT = {"method": "conservative-character-estimate", "widthPx": 344,
       "horizontalPaddingPx": 8, "fontSizePx": 8, "estimatedAdvancePx": 8,
       "maxBannerCharacters": 42, "maxBannerLines": 1}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def strict_json(text):
    def pairs(items):
        result = {}
        for key, value in items:
            require(key not in result, "duplicate JSON key: " + key)
            result[key] = value
        return result

    def nonfinite(value):
        raise ValueError("non-finite JSON number: " + value)

    return json.loads(text, object_pairs_hook=pairs, parse_constant=nonfinite)


def load_sources():
    return {
        "design": (ROOT / SOURCE).read_text(encoding="utf-8"),
        "graph": strict_json((ROOT / "docs/plans/wildbond-world/world-graph.json").read_text()),
        "game": strict_json((ROOT / "wildbond-godot/data/wildbond.json").read_text()),
        "main": (ROOT / "wildbond-godot/scripts/main.gd").read_text(),
        "objective": (ROOT / "wildbond-godot/scripts/objective.gd").read_text(),
    }


def keys(value, expected, label):
    require(type(value) is dict and set(value) == set(expected), label + " keys")


def text(value, label):
    require(type(value) is str and bool(value.strip()) and value == value.strip(), label + " text")


def sentence(value, label, starter=False):
    text(value, label)
    require(re.fullmatch(r"[A-Z][A-Za-z0-9 ,;:'{}-]*\.", value) is not None,
            label + " must be one plain ASCII sentence with one final period")
    require("  " not in value, label + " repeated whitespace")
    placeholders = re.findall(r"\{[^{}]*\}", value)
    require(placeholders == (["{starter}"] if starter else []), label + " placeholders")
    stripped = value.replace("{starter}", "") if starter else value
    require("{" not in stripped and "}" not in stripped, label + " malformed placeholder")


def fits_banner(value):
    """Independent fixed budget; changing data cannot weaken the estimate."""
    return type(value) is str and value.isascii() and len(value) <= (344 - 8) // 8


def normalized(value):
    return re.sub(r"[^a-z0-9]", "", value.lower())


def source_table(design):
    section = design.split("## 3. Town stories, the banner, and the errand list\n", 1)
    require(len(section) == 2, "source section 3 is missing")
    section = section[1].split("### One errand in each town", 1)[0]
    rows = re.findall(r"^\| ([0-8]) \| (.*?) \| (.*?) \|$", section, re.M)
    require([int(row[0]) for row in rows] == list(range(9)), "source table counts/order")
    return [{"banner": re.sub(r" \(already.*\)$", "", b),
             "maren": re.sub(r" \(already.*\)$", "", m)} for _, b, m in rows]


def validate(data, sources=None):
    """Raise ValueError on a malformed copy contract or drift in its read-only sources."""
    sources = load_sources() if sources is None else sources
    keys(data, {"schemaVersion", "status", "source", "fit", "integration", "entries"}, "root")
    require(type(data["schemaVersion"]) is int and data["schemaVersion"] == 1, "schema version")
    require(data["status"] == "proposed", "copy remains proposed")
    require(data["source"] == SOURCE + " (section 3, banner table and before-routes paragraph)", "source anchor")
    keys(data["fit"], set(FIT) | {"note"}, "fit")
    for key, expected in FIT.items():
        require(type(data["fit"][key]) is type(expected) and data["fit"][key] == expected, "fit " + key)
    text(data["fit"]["note"], "fit note")
    require("estimate" in data["fit"]["note"] and "not a measurement" in data["fit"]["note"], "fit caveat")
    keys(data["integration"], INTEGRATION_KEYS, "integration")
    for key, value in data["integration"].items():
        text(value, "integration " + key)
    source_rows = source_table(sources["design"])
    graph, game = sources["graph"], sources["game"]
    require(graph["badges"] == BADGES and all(b in game["BADGES"] for b in BADGES), "source badge order")
    places = {p["id"]: p for p in graph["places"]}
    require(len(places) == len(graph["places"]), "source duplicate places")
    built_match = re.search(r"^const BUILT := (\[.*?\])", sources["main"], re.M)
    require(built_match is not None, "source BUILT is missing")
    built = strict_json(built_match.group(1))
    require(len(built) == len(set(built)) and set(built) == set(game["MAPS"]), "source BUILT/maps disagree")
    require(re.search(r"var width := 344\.0", sources["main"]) is not None, "walking width changed")
    require(re.search(r"var px := 7 if battle.visible else 8", sources["main"]) is not None, "walking font size changed")
    require("width - 8.0" in sources["objective"] and "size.x - 8.0" in sources["objective"], "padding changed")
    require("font = ThemeDB.fallback_font" in sources["objective"], "font source changed")
    # Also exclude renamed towns that share an existing map ID: Warmstep is not
    # today's Emberfall Highlands sign. Normalize punctuation/case to fail closed.
    forbidden = []
    for place_id, place in places.items():
        if place_id not in built or place["name"] != game["MAPS"][place_id]["name"]:
            name = re.sub(r"^the ", "", place["name"], flags=re.I)
            forbidden.append(name)
    require(type(data["entries"]) is list and len(data["entries"]) == 9, "nine badge entries")
    for count, row in enumerate(data["entries"]):
        keys(row, {"badgeCount", "status", "targetWardenId", "targetBadgeId", "sourceCopy", "afterRoutes", "beforeRoutes"}, "entry")
        require(type(row["badgeCount"]) is int and row["badgeCount"] == count, "badge count/order")
        require(row["status"] == "proposed", "entry remains proposed")
        require(row["targetWardenId"] == (WARDENS[count] if count < 8 else None), "target Warden")
        require(row["targetBadgeId"] == (BADGES[count] if count < 8 else None), "target badge")
        require(row["sourceCopy"] == source_rows[count], "section 3 source copy differs")
        if count < 8:
            require(game["CAST"].get(WARDENS[count], {}).get("name") == "Warden " + WARDENS[count].title(), "source Warden identity")
            require(game["BADGES"][BADGES[count]]["name"] == BADGES[count].title() + " Badge", "source badge identity")
        for variant in ("beforeRoutes", "afterRoutes"):
            value = row[variant]
            keys(value, {"banner", "maren", "placeIds"}, variant)
            sentence(value["banner"], variant + " banner")
            sentence(value["maren"], variant + " Maren", starter=count == 0)
            require(fits_banner(value["banner"]), variant + " banner exceeds 42-character estimate")
            expected = PATHS[count] if variant == "beforeRoutes" else PLANNED[count]
            require(value["placeIds"] == expected, variant + " exact place references")
            require(all(p in places for p in expected), variant + " missing graph place")
            combined = value["banner"] + " " + value["maren"]
            cardinal = CARDINALS[DIRECTIONS[count]]
            written_directions = set(re.findall(r"\b(north|south|east|west)\b", combined.lower()))
            require(written_directions <= {cardinal}, variant + " wrong direction in prose")
            if ((variant == "beforeRoutes" and count != 2)
                    or (variant == "afterRoutes" and count in (0, 1, 3, 7, 8))):
                require(re.search(r"\b" + cardinal + r"\b", value["maren"], re.I) is not None,
                        variant + " Maren direction missing")
            if count < 8:
                require(WARDENS[count].title() in value["maren"], variant + " Maren target Warden missing")
                require(all(w.title() not in combined for w in WARDENS if w != WARDENS[count]), variant + " wrong Warden")
            else:
                require(all(w.title() not in combined for w in WARDENS), variant + " league guidance names a Warden")
            for badge in BADGES:
                if count == 8 or badge != BADGES[count]:
                    require(game["BADGES"][badge]["name"] not in combined, variant + " wrong badge")
            if variant == "beforeRoutes":
                require(all(p in built for p in expected), "current copy references an unbuilt map")
                require(game["MAPS"][expected[-1]]["name"] in value["maren"], "current Maren destination name missing")
                require(not any(normalized(name) in normalized(combined) for name in forbidden), "current copy names an unbuilt route or renamed town")
                for origin, destination in zip(expected, expected[1:]):
                    require(game["MAPS"][origin]["exits"].get(DIRECTIONS[count], {}).get("to") == destination,
                            "current path does not match the real directional exit")
                if count == 1:
                    require("north gate of Thornwood" in value["maren"], "Thornwood uses its north gate")
                if count in CURRENT_WALKS:
                    require(CURRENT_WALKS[count] in value["maren"], "current walk phrase missing")
                if count >= 4:
                    require(not re.search(r"\b(wait|unsafe|not safe|isn't safe|cave mouths)\b", combined, re.I), "stale closed-route or cave promise")
        if count >= 2:
            # Retain each table's named new walk and destination in the longer
            # Maren sentence even when the one-line banner is shortened.
            for place_id in PLANNED[count]:
                place = places[place_id]
                if place_id not in built or place["kind"] == "town":
                    name = re.sub(r"^the ", "", place["name"], flags=re.I)
                    if place_id == "cloudglass":
                        name = "Cloudglass Pass"  # Section 3 uses the current pass, not Highlatch.
                    if normalized(name) in normalized(source_rows[count]["maren"]):
                        require(normalized(name) in normalized(row["afterRoutes"]["maren"]), "planned Maren source place missing: " + place_id)
    return True


class BannerCopyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = strict_json(COPY.read_text(encoding="utf-8"))
        cls.sources = load_sources()

    def bad(self, change):
        candidate = copy.deepcopy(self.data)
        change(candidate)
        with self.assertRaises(ValueError):
            validate(candidate, self.sources)

    def test_authored_copy_and_sources(self):
        self.assertTrue(validate(self.data, self.sources))

    def test_fit_boundary_is_independent_of_data(self):
        self.assertTrue(fits_banner("W" * 41 + "."))
        self.assertFalse(fits_banner("W" * 42 + "."))
        self.assertFalse(fits_banner("é."))
        self.assertFalse(fits_banner(None))
        self.bad(lambda d: d["fit"].update(maxBannerCharacters=1000))
        self.bad(lambda d: d["entries"][0]["beforeRoutes"].update(banner="W" * 42 + "."))

    def test_all_badge_counts_and_identities(self):
        for index in range(9):
            for key, bad_value in (("badgeCount", True), ("badgeCount", float(index)), ("badgeCount", index + 1),
                                   ("status", "approved"), ("targetWardenId", "maren"), ("targetBadgeId", "bogus")):
                with self.subTest(index=index, key=key, value=bad_value):
                    self.bad(lambda d, i=index, k=key, v=bad_value: d["entries"][i].update({k: v}))
        self.bad(lambda d: d["entries"].pop())
        self.bad(lambda d: d["entries"].reverse())
        self.bad(lambda d: d["entries"].append(copy.deepcopy(d["entries"][0])))

    def test_source_copy_cannot_drift(self):
        for index in range(9):
            for key in ("banner", "maren"):
                self.bad(lambda d, i=index, k=key: d["entries"][i]["sourceCopy"].update({k: "Something different."}))

    def test_sentence_and_placeholder_rejections(self):
        samples = ["", " ", "Go north", "Go north. Then rest.", "Go north!", "Go north?", "go north.",
                   "Go\nnorth.", "Go\tnorth.", "Go  north.", "Go north. ", "Go éast.", "Go <b>north</b>.",
                   "Go {name}.", "Go {starter}.", "Go {starter} {starter}.", "Go {starter.", "Go starter}."]
        for variant in ("beforeRoutes", "afterRoutes"):
            for key in ("banner", "maren"):
                for sample in samples:
                    self.bad(lambda d, v=variant, k=key, s=sample: d["entries"][1][v].update({k: s}))
            self.bad(lambda d, v=variant: d["entries"][0][v].update(maren="Warden Isolde waits north."))

    def test_every_unbuilt_name_is_rejected_in_both_current_fields(self):
        for place in self.sources["graph"]["places"]:
            current = self.sources["game"]["MAPS"].get(place["id"])
            if current is not None and current["name"] == place["name"]:
                continue
            name = re.sub(r"^the ", "", place["name"], flags=re.I)
            for key in ("banner", "maren"):
                for spelling in (name, name.upper(), name.replace(" ", "-")):
                    line = ("Visit " + spelling + ".") if key == "banner" else (self.data["entries"][1]["beforeRoutes"]["maren"][:-1] + " near " + spelling + ".")
                    self.bad(lambda d, k=key, s=line: d["entries"][1]["beforeRoutes"].update({k: s}))

    def test_place_references_reject_missing_wrong_duplicate_and_unbuilt(self):
        for index in range(9):
            for variant in ("beforeRoutes", "afterRoutes"):
                for refs in ([], ["missing"], ["ashstair"], ["thornwood", "thornwood"], None, "thornwood"):
                    self.bad(lambda d, i=index, v=variant, r=refs: d["entries"][i][v].update(placeIds=r))

    def test_wrong_directions_wardens_and_badges(self):
        self.bad(lambda d: d["entries"][1]["beforeRoutes"].update(maren="Thornwood's south gate leads to Warden Nerys."))
        self.bad(lambda d: d["entries"][2]["beforeRoutes"].update(maren="Warden Isolde waits with Warden Toren."))
        self.bad(lambda d: d["entries"][2]["afterRoutes"].update(banner="Toren has the Tide Badge."))
        self.bad(lambda d: d["entries"][8]["beforeRoutes"].update(maren="The Reed Badge opens the league."))
        self.bad(lambda d: d["entries"][4]["beforeRoutes"].update(maren="Warden Olan asks you to wait."))

    def test_direction_prose_is_checked_not_only_reference_paths(self):
        for index, row in enumerate(self.data["entries"]):
            for variant in ("beforeRoutes", "afterRoutes"):
                for key in ("banner", "maren"):
                    original = row[variant][key]
                    for direction in ("north", "south", "east", "west"):
                        if direction == CARDINALS[DIRECTIONS[index]]:
                            continue
                        # Inject a contrary direction without breaking sentence shape.
                        changed = original[:-1] + " toward the " + direction + "."
                        self.bad(lambda d, i=index, v=variant, k=key, s=changed: d["entries"][i][v].update({k: s}))
                    if re.search(r"\b(north|east)\b", original, re.I):
                        changed = re.sub(r"\bnorth\b", "south", original, flags=re.I)
                        changed = re.sub(r"\beast\b", "west", changed, flags=re.I)
                        changed = changed[0].upper() + changed[1:]
                        self.bad(lambda d, i=index, v=variant, k=key, s=changed: d["entries"][i][v].update({k: s}))
        for index, phrase in CURRENT_WALKS.items():
            self.bad(lambda d, i=index, p=phrase: d["entries"][i]["beforeRoutes"].update(
                maren=d["entries"][i]["beforeRoutes"]["maren"].replace(p, "mysterious road")))

    def test_sources_fail_closed_when_map_contract_changes(self):
        changes = [lambda s: s["graph"]["places"].pop(0),
                   lambda s: s["graph"]["badges"].reverse(),
                   lambda s: s["game"]["CAST"]["nerys"].update(name="Warden Nobody"),
                   lambda s: s["game"]["MAPS"]["thornwood"]["exits"]["N"].update(to="larkhaven"),
                   lambda s: s["game"]["MAPS"]["stillreed"]["exits"]["E"].update(to="larkhaven"),
                   lambda s: s.update(main=s["main"].replace('"league", "spire"', '"league"')),
                   lambda s: s.update(main=s["main"].replace("var width := 344.0", "var width := 300.0")),
                   lambda s: s.update(main=s["main"].replace("else 8\n", "else 7\n")),
                   lambda s: s.update(objective=s["objective"].replace("width - 8.0", "width - 12.0")),
                   lambda s: s.update(objective=s["objective"].replace("ThemeDB.fallback_font", "custom_font")),
                   lambda s: s.update(design=s["design"].replace("| 2 | Climb Ashstair.", "| 2 | Walk Ashstair."))]
        for change in changes:
            sources = copy.deepcopy(self.sources)
            change(sources)
            with self.assertRaises(ValueError):
                validate(self.data, sources)

    def test_schema_rejects_malformed_nested_values(self):
        def walk(value, path=()):
            yield path, value
            if type(value) is dict:
                for key, child in value.items():
                    yield from walk(child, path + (key,))
            elif type(value) is list:
                for index, child in enumerate(value):
                    yield from walk(child, path + (index,))

        count = 0
        for path, original in walk(self.data):
            replacements = [None, True, 3.5, [], {}]
            for replacement in replacements:
                if type(original) is type(replacement) and original == replacement:
                    continue
                candidate = copy.deepcopy(self.data)
                if not path:
                    candidate = replacement
                else:
                    target = candidate
                    for part in path[:-1]:
                        target = target[part]
                    target[path[-1]] = replacement
                with self.subTest(path=path, replacement=replacement):
                    with self.assertRaises(ValueError):
                        validate(candidate, self.sources)
                count += 1
            if type(original) is dict:
                for key in list(original) + ["unexpected"]:
                    candidate = copy.deepcopy(self.data)
                    target = candidate
                    for part in path:
                        target = target[part]
                    if key == "unexpected":
                        target[key] = "not allowed"
                    else:
                        del target[key]
                    with self.assertRaises(ValueError):
                        validate(candidate, self.sources)
                    count += 1
        self.assertGreater(count, 1000)

    def test_strict_json(self):
        for value in ('{"a":1,"a":2}', '{"a":{"b":1,"b":2}}', '{"x":NaN}', '{"x":Infinity}',
                      '{"x":-Infinity}', '{"x":1,}', '[] trailing'):
            with self.assertRaises(ValueError):
                strict_json(value)

    def test_starter_substitution_keeps_each_actual_name(self):
        for starter in self.sources["game"]["STARTERS"]:
            name = self.sources["game"]["SPECIES"][starter]["name"]
            for variant in ("beforeRoutes", "afterRoutes"):
                rendered = self.data["entries"][0][variant]["maren"].replace("{starter}", name)
                sentence(rendered, "filled Maren")
                self.assertIn(name, rendered)


if __name__ == "__main__":
    unittest.main()
