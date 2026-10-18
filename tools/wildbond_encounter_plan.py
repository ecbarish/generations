"""Read-only validation/level evaluation for the proposed Pokemon-first world tables.

Nothing in the game imports this module. --render explicitly regenerates only
the companion planning Markdown; the default command validates without writing.
"""
import argparse
import csv
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
WORLD = ROOT / "docs/plans/wildbond-world"
PLAN = WORLD / "pokemon-encounters-v1.json"
FIXED_IDS = {"thornwood_route", "millgrass", "dewcut", "rootwater", "thornwood", "thornwood_grove", "knothollow"}
OPENING = {
    "thornwood_route": ([2, 4], [("pokemon:16", 45), ("pokemon:161", 30), ("pokemon:10", 25)]),
    "millgrass": ([2, 5], [("pokemon:16", 30), ("pokemon:161", 25), ("pokemon:43", 20), ("wildbond:seedpip", 25)]),
    "dewcut": ([4, 8], [("pokemon:10", 30), ("pokemon:13", 25), ("pokemon:285", 30), ("wildbond:glimmerwing", 15)]),
    "rootwater": ([7, 12], [("pokemon:194", 45), ("pokemon:54", 30), ("pokemon:46", 17), ("wildbond:bogsnap", 8)]),
}


def parse_json(text):
    def unique_object(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError(f"Duplicate JSON key: {key}")
            result[key] = value
        return result
    def invalid_constant(value):
        raise ValueError(f"Non-finite JSON value: {value}")
    return json.loads(text, object_pairs_hook=unique_object, parse_constant=invalid_constant)


def load(path):
    return parse_json(path.read_text(encoding="utf-8-sig"))


def source_digest(raw):
    """Text-source snapshots are portable across Git's Windows LF/CRLF checkouts."""
    return hashlib.sha256(raw.replace(b"\r\n", b"\n")).hexdigest()


def sources():
    game = load(ROOT / "wildbond-godot/data/wildbond.json")
    evolution = load(ROOT / "wildbond-godot/data/evolution.json")
    original = {**game["SPECIES"], **evolution["species"]}
    catalogue = (ROOT / "wildbond-godot/tests/journey/catalogue.gd").read_text(encoding="utf-8")
    match = re.search(r"const ALL_IDS\s*:=\s*(\[[^\]]*\])", catalogue)
    if not match:
        raise ValueError("Cannot resolve current native catalogue's explicit ALL_IDS")
    supported = set(json.loads(match[1]))
    with (ROOT / "docs/research/wildbond-private-library/coverage.csv").open(encoding="utf-8", newline="") as stream:
        coverage = {f"pokemon:{r['dex']}": r for r in csv.DictReader(stream)}
    return {"game": game, "original": original, "supported": supported, "coverage": coverage,
            "graph": load(WORLD / "world-graph.json"), "audit": load(WORLD / "region-audit.json")}


def readiness(sid, src):
    if sid.startswith("pokemon:"):
        row = src["coverage"][sid]
        art = "private_library_verified_needs_scene_review" if row["ready_for_pack"] == "True" else "private_library_incomplete"
    else:
        art = "approved_design_candidate_needs_scene_review" if sid == "wildbond:bogsnap" else "legacy_design_needs_redesign_review"
    return {"art": art, "combat": "supported_in_chapter" if sid in src["supported"] else "needs_catalogue_integration"}


def level_band(plan, area_id, badges, caps):
    if type(badges) is not int or not 0 <= badges < len(caps):
        raise ValueError("Badge count must be an integer from 0 through 8")
    if area_id not in plan["areas"]:
        raise ValueError("Not an ordinary encounter area")
    cap = caps[badges]
    rule = plan["areas"][area_id]["levels"]
    if rule["mode"] == "fixed":
        lo, hi = rule["band"]
    elif rule["mode"] == "regional":
        offset = plan["level_policy"]["difficulty_offsets"][rule["difficulty"]]
        lo, hi = [cap + delta + offset for delta in plan["level_policy"]["relative_band"]]
    else:
        raise ValueError("Unsupported planning level rule")
    # Reachability is checked separately: a band is never permission to enter.
    return [max(2, min(cap, lo)), max(2, min(cap, hi))]


def validate(plan, src=None):
    src = src or sources()
    errors = []
    def require(ok, message):
        if not ok:
            errors.append(message)
    require(plan.get("schema_version") == 1 and plan.get("status") == "proposal", "Expected planning-only schema one")
    require(plan.get("runtime_activation") is False, "Runtime activation must stay false")
    require(plan.get("source_snapshot_format") == "sha256_utf8_lf", "Expected portable LF-normalized source snapshots")
    require(plan.get("coverage_policy") == {"eligible_areas": 33, "minimum_original_areas": 17, "target_original_areas": 18,
            "counts_placements_not_distinct_species": True, "starters": "exclusive_to_starter_selection"}, "Coverage policy changed")
    require(plan.get("allocation_swaps") == [{"from": "thornwood_route", "to": "millgrass"}, {"from": "knothollow", "to": "dewcut"}],
            "Documented allocation swaps changed")
    areas = plan.get("areas", {})
    ordinary = {p["id"]: p for p in src["audit"]["places"] if p["encounters"] in ("ordinary", "ordinary+special")}
    require(set(areas) == set(ordinary) and len(areas) == 33, "Area denominator must exactly match all 33 audited ordinary areas")
    graph_ids = {p["id"] for p in src["graph"]["places"] if not p.get("isLink")}
    require(set(areas) <= graph_ids, "Area IDs must be graph map nodes")
    policy = plan.get("level_policy", {})
    require(policy.get("relative_band") == [-13, -5], "Regional band must be cap minus 13 through minus 5")
    require(policy.get("difficulty_offsets") == {"gentle": -2, "ordinary": 0, "demanding": 3}, "Difficulty offsets changed")
    require(set(policy.get("fixed_areas", [])) == FIXED_IDS, "Fixed beginner area policy changed")
    require(policy.get("resolve_at") == "encounter_start" and policy.get("mutate_saved_creatures") is False,
            "Level policy must resolve only at encounter start without mutating saved creatures")
    require(policy.get("special_and_trainers") == "unchanged", "Special/trainer rules must remain separate")
    caps = src["game"]["CAP_TABLE"]
    require(caps == [15, 25, 35, 45, 55, 60, 65, 70, 75], "Badge caps changed; review the proposal")
    species = plan.get("species", {})
    used = set()
    original_areas = set()
    weighted = set()
    starters = {"wildbond:" + sid for sid in src["game"]["STARTERS"]}
    for sid, record in species.items():
        valid = sid in src["coverage"] if sid.startswith("pokemon:") else sid.startswith("wildbond:") and sid[9:] in src["original"]
        require(valid, f"Unknown species {sid}")
        if not valid:
            continue
        require(sid not in starters, f"Starter-exclusive species must not be wild: {sid}")
        if sid.startswith("wildbond:"):
            raw = src["original"][sid[9:]]
            require(not raw.get("unique") and raw.get("tier") != "Legend", f"Unique/guardian species cannot fill ordinary quota: {sid}")
            name = raw["name"]
        else:
            name = src["coverage"][sid]["name"]
        require(record.get("name") == name, f"Species name differs from source: {sid}")
        require(record.get("readiness") == readiness(sid, src), f"Art/combat readiness mismatch: {sid}")
    for aid, area in areas.items():
        source = ordinary.get(aid)
        if source is None:
            continue
        require(area.get("habitat") == source["habitat"], f"Habitat snapshot changed: {aid}")
        require(area.get("progression") == source["progression"], f"Progression snapshot changed: {aid}")
        require(area.get("dependencies") == source["issues"], f"Audit dependency snapshot changed: {aid}")
        require(area.get("region") in src["game"]["BIOMES"], f"Unknown region: {aid}")
        require(bool(area.get("encounter_role")) and bool(area.get("habitat_rationale")), f"Missing habitat/progression rationale: {aid}")
        require(area.get("integration_status") == "not_activated", f"Must not claim runtime encounter activation: {aid}")
        slots = area.get("pool", [])
        ids = [s.get("species") for s in slots]
        require(bool(ids) and len(ids) == len(set(ids)) and set(ids) <= set(species), f"Invalid or duplicate pool references: {aid}")
        used.update(ids)
        originals = [sid for sid in ids if isinstance(sid, str) and sid.startswith("wildbond:")]
        if originals:
            original_areas.add(aid)
        require(area.get("original_feature") == bool(originals), f"Original-area flag differs from pool: {aid}")
        require(area.get("original_rarity") in ("regular", "uncommon", "rare") if originals else area.get("original_rarity") is None,
                f"Invalid original rarity: {aid}")
        require(area.get("pool_status") in ("weighted_proposal", "candidate_pool"), f"Unknown pool status: {aid}")
        if area.get("pool_status") == "weighted_proposal":
            weighted.add(aid)
            weights = [s.get("weight") for s in slots]
            require(all(type(w) is int and w > 0 for w in weights), f"Weights must be positive integers: {aid}")
            if all(type(w) is int for w in weights):
                require(sum(weights) == 100, f"Weights must total 100: {aid}")
        else:
            require(all(s.get("weight") is None for s in slots), f"Candidate weights must stay unset: {aid}")
        rule = area.get("levels", {})
        fixed = aid in FIXED_IDS
        require(rule.get("mode") == ("fixed" if fixed else "regional"), f"Wrong level mode: {aid}")
        if fixed:
            expected = OPENING[aid][0] if aid in OPENING else src["game"]["BIOMES"]["thornwood"]["lv"]
            require(rule.get("band") == expected, f"Fixed authored band changed: {aid}")
        else:
            require(rule.get("difficulty") in policy.get("difficulty_offsets", {}), f"Unknown difficulty: {aid}")
        try:
            bands = [level_band(plan, aid, b, caps) for b in range(9)]
            require(all(2 <= lo <= hi <= cap for (lo, hi), cap in zip(bands, caps)), f"Band exceeds cap or reverses: {aid}")
            if fixed:
                require(all(band == bands[0] for band in bands), f"Beginner revisit band changed: {aid}")
        except (ValueError, KeyError, TypeError, IndexError):
            require(False, f"Cannot evaluate level rule: {aid}")
    require(weighted == set(OPENING), "Only the four opening tables should be fully weighted")
    for aid, (band, pairs) in OPENING.items():
        actual = [(s.get("species"), s.get("weight")) for s in areas.get(aid, {}).get("pool", [])]
        require(actual == pairs, f"Approved opening table changed: {aid}")
        rarity = {"thornwood_route": None, "millgrass": "regular", "dewcut": "uncommon", "rootwater": "rare"}[aid]
        require(areas.get(aid, {}).get("original_rarity") == rarity, f"Opening rarity changed: {aid}")
    require(used == set(species), "Species index must contain exactly the species used by pools")
    require(len(original_areas) == 18, "Original target is exactly 18 of 33 areas, not 18 distinct species")
    require(len(original_areas) * 2 >= len(areas), "Original coverage below half")
    require({areas[a]["region"] for a in original_areas} == set(src["game"]["BIOMES"]), "Originals must span all eight regions")
    require(any(p["kind"] == "water" and p["id"] in original_areas for p in src["graph"]["places"]), "Originals missing from water routes")
    recommended = {p["id"] for p in ordinary.values() if p["originalArea"]}
    expected_originals = (recommended - {"thornwood_route", "knothollow"}) | {"millgrass", "dewcut"}
    require(original_areas == expected_originals, "Original allocation differs from the documented two-area swap")
    for rel, digest in plan.get("source_snapshots", {}).items():
        p = (ROOT / rel).resolve()
        require(p.is_relative_to(ROOT) and p.is_file(), f"Invalid source snapshot path: {rel}")
        if p.is_relative_to(ROOT) and p.is_file():
            require(source_digest(p.read_bytes()) == digest, f"Source changed; reconcile blueprint: {rel}")
    require(set(plan.get("source_snapshots", {})) == {"docs/plans/wildbond-world/world-graph.json", "docs/plans/wildbond-world/region-audit.json", "docs/research/wildbond-private-library/coverage.csv"}, "Missing source snapshot")
    return errors


def render(plan, src):
    lines = ["# Wildbond: Pokémon-first encounter blueprint", "", "Status: **planning proposal only**, WB-ENCOUNTER-BLUEPRINT, Codex / Evan, 2026-10-18. Generated from [the planning data](pokemon-encounters-v1.json) using `python -B tools/wildbond_encounter_plan.py --render`. Nothing in the game loads these tables; no encounter, save, graph, art, trainer or guardian changed.", "",
             "## Agreed rules", "", "- One audited graph place is one encounter area. The denominator is **33 ordinary or ordinary+special areas**; towns/special-only arenas and the Glassfall link do not add quota slots.",
             "- **18 areas feature an original** across all eight regions and water. This counts placements, not 18 new species. Reusing a creature in suitable habitat is encouraged. Starter species stay exclusive to starter selection in this proposal.",
             "- Rarity varies by creature. Only the first four pools have weights; later pools are habitat candidates, not finalized encounter tables. All placements here are design proposals, not new dex text or established habitat canon.",
             "- Early Thornwood uses fixed authored levels; the rest uses **badge cap −13 through cap −5**, offset by gentle −2 / ordinary 0 / demanding +3, clamped to level 2 through the current cap. Resolve once at encounter start, never from party level or by rewriting caught creatures. Special encounters and trainers retain their own rules.", "",
             "The seven fixed-policy places are Thornwood Trail, Millgrass, Dewcut, Rootwater, Thornwood, Old Root Grove and Knothollow. Thornwood town is special-only in the audit, so its reserved fixed-policy entry does not add an ordinary pool. Knothollow and the grove inherit the existing Thornwood 2–12 band; the four opening bands are explicitly proposed below.", "",
             "### Regional bands by badges", "", "| Badges | Cap | Gentle | Ordinary | Demanding |", "| --- | --- | --- | --- | --- |"]
    for b, cap in enumerate(src["game"]["CAP_TABLE"]):
        cells = []
        for offset in (-2, 0, 3):
            cells.append(f"{max(2, min(cap, cap-13+offset))}–{max(2, min(cap, cap-5+offset))}")
        lines.append(f"| {b} | {cap} | {' | '.join(cells)} |")
    lines += ["", "This table does not grant access: phase, badge, field and story requirements still govern entry. First-reach values below are uncorrected snapshots of the audited graph, including its known leaks; they are not new progression approvals.", "", "## First four encounter tables", "", "| Area | Fixed levels | Weighted species |", "| --- | --- | --- |"]
    for aid in OPENING:
        area = plan["areas"][aid]
        pool = ", ".join(f"{plan['species'][s['species']]['name']} {s['weight']}%" for s in area["pool"])
        lines.append(f"| {area['name']} | {'–'.join(map(str, area['levels']['band']))} | {pool} |")
    lines += ["", "Seedpip is regular (25%), Glimmerwing uncommon (15%) and Bogsnap rare (8%). Their placement rationales are recorded per area. Shroomish is a shaded, damp meadow-edge candidate; this proposal does not introduce time-of-day, weather or fishing conditions.", "",
              "## All 33 encounter areas", "", "Claude’s 18 recommended placements are retained with two explicit Thornwood swaps: **Thornwood Trail → Millgrass** and **Knothollow → Dewcut**, matching the approved first tables. Rootwater and Old Root Grove retain originals. This keeps 18 placements, region/water spread and the half-area target without forcing a fourth original into the opening.", "",
              "| Area / region | Reach: ropes → open order | Level rule | Candidate pool | Original rarity |", "| --- | --- | --- | --- | --- |"]
    for aid, area in plan["areas"].items():
        reach = area["progression"]
        reach_text = " → ".join("—" if reach[k] is None else str(reach[k]) for k in ("firstReachPhase1Ropes", "firstReachAfterOrder"))
        rule = area["levels"]
        rule_text = "fixed " + "–".join(map(str, rule["band"])) if rule["mode"] == "fixed" else "regional / " + rule["difficulty"]
        pool = ", ".join(("**" + plan["species"][s["species"]]["name"] + "**") if s["species"].startswith("wildbond:") else plan["species"][s["species"]]["name"] for s in area["pool"])
        lines.append(f"| {area['name']} / {area['region']} | {reach_text} | {rule_text} | {pool} | {area['original_rarity'] or '—'} |")
    lines += ["", "### Habitat and journey roles", ""]
    for area in plan["areas"].values():
        lines += [f"**{area['name']}.** {area['habitat_rationale']} {area['encounter_role']} Dependencies: {', '.join(area['dependencies']) or 'none specific in the audit'}. Original notes: {area['original_rarity'] or 'no original assigned'}. Not activated.", ""]
    lines += ["## Readiness and implementation boundary", "", "A verified private sprite is not a playable species. Art status below includes an outstanding scene review; unpolished legacy originals require redesign/review rather than automatic acceptance. Bogsnap has the approved identity and existing animation candidates, not final visual acceptance. Combat support means support in the current native chapter, not the old adventure or isolated battle studies.", "", "| Species | Art readiness | Chapter combat |", "| --- | --- | --- |"]
    for sid, record in sorted(plan["species"].items()):
        lines.append(f"| {record['name']} (`{sid}`) | {record['readiness']['art']} | {record['readiness']['combat']} |")
    lines += ["", "## Dependencies and handoff", "", "- Source audit: [PR #564](https://github.com/ecbarish/generations/pull/564), [region audit](region-audit.md). Current art availability: [private library](../../research/wildbond-private-library/README.md). Original dialogue/lore remains governed by the writer ledger; no clue or player text was placed here.",
              "- **RA-01 / RA-02:** this proposal records the chosen regional-level rule and area denominator; it does not install them in an engine or mark the audit resolved.",
              "- **RA-03:** graph owner must resolve Orchard Fen’s missing Echo Badge rope; historical ropes-phase reachability here still reflects that leak. **RA-04:** Answering Ways’ Bellstep connection remains with existing PR #523. **RA-05:** temporary pre-Trialstair League access must become machine-checkable. This task does not edit their graph/gates.",
              "- **RA-08 / RA-09 / RA-10 / RA-17:** measured Thornwood destination, Grove Wake/first loop and destination landings need reconciliation before native wiring. Planned null landings are not safe engine coordinates.",
              "- Next playable increment: Thornwood town with Isolde/healing, then the badge/Grove Wake loop. Before encounter integration, add bounded combat definitions/learnsets, approve selected art, resolve map/grass-area ownership and test catch → battle → return → save/reopen. Preserve existing six-species chapter records and private-pack fallback behavior.",
              "- Do not treat candidate pools as weighted distributions, invent missing move/status/evolution support or globally scale the old adventure’s wild tables. Existing [route tables](route-encounters.md) and cave plans remain intact historical inputs.", ""]
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--render", action="store_true")
    args = parser.parse_args()
    plan, src = load(PLAN), sources()
    errors = validate(plan, src)
    if errors:
        raise SystemExit("\n".join(errors))
    if args.render:
        PLAN.with_suffix(".md").write_text(render(plan, src), encoding="utf-8")
    print(f"PASS: {len(plan['areas'])} areas, 18 original placements, four weighted opening pools; all nine badge stages valid")


if __name__ == "__main__":
    main()
