"""Encounter proposal regressions; stdlib only, no player profiles or writes."""
import copy
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent))
import wildbond_encounter_plan as model


class EncounterPlanTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.plan = model.load(model.PLAN)
        cls.src = model.sources()

    def changed(self):
        return copy.deepcopy(self.plan)

    def rejects(self, plan, text):
        self.assertTrue(any(text in error for error in model.validate(plan, self.src)), text)

    def test_complete_source_consistent_blueprint(self):
        self.assertEqual(model.validate(self.plan, self.src), [])
        self.assertEqual(len(self.plan["areas"]), 33)

    def test_duplicate_json_keys_and_nonfinite_values_do_not_hide_bad_tables(self):
        for text in ('{"areas":{"dewcut":{},"dewcut":{}}}', '{"weight":NaN}', '{"weight":Infinity}', '{broken'):
            with self.subTest(text=text), self.assertRaises(ValueError):
                model.parse_json(text)

    def test_source_hashes_survive_windows_and_linux_checkouts(self):
        self.assertEqual(model.source_digest(b"dex,name\r\n16,Pidgey\r\n"), model.source_digest(b"dex,name\n16,Pidgey\n"))
        self.assertNotEqual(model.source_digest(b"16,Pidgey\n"), model.source_digest(b"16,Vulpix\n"))

    def test_all_nine_badge_stages_and_offsets(self):
        examples = {"larkburrow": -2, "ashstair": 0, "opengrey": 3}
        for aid, offset in examples.items():
            for badges, cap in enumerate(self.src["game"]["CAP_TABLE"]):
                with self.subTest(area=aid, badges=badges):
                    expected = [max(2, min(cap, cap + delta + offset)) for delta in (-13, -5)]
                    self.assertEqual(model.level_band(self.plan, aid, badges, self.src["game"]["CAP_TABLE"]), expected)
        for aid in self.plan["areas"]:
            for badges, cap in enumerate(self.src["game"]["CAP_TABLE"]):
                lo, hi = model.level_band(self.plan, aid, badges, self.src["game"]["CAP_TABLE"])
                self.assertLessEqual(2, lo)
                self.assertLessEqual(lo, hi)
                self.assertLessEqual(hi, cap)

    def test_fixed_areas_stay_low_on_revisits(self):
        for aid in model.FIXED_IDS & set(self.plan["areas"]):
            for badges in range(9):
                with self.subTest(area=aid, badges=badges):
                    self.assertEqual(model.level_band(self.plan, aid, badges, self.src["game"]["CAP_TABLE"]), self.plan["areas"][aid]["levels"]["band"])

    def test_invalid_badges_and_special_encounters_rejected(self):
        for badges in (-1, 9, True, 2.0, "2", None):
            with self.assertRaises(ValueError):
                model.level_band(self.plan, "millgrass", badges, self.src["game"]["CAP_TABLE"])
        for aid in ("thornwood", "league", "spire", "lampcrown", "glassfall", "missing"):
            with self.assertRaises(ValueError):
                model.level_band(self.plan, aid, 2, self.src["game"]["CAP_TABLE"])

    def test_level_evaluation_is_read_only_and_has_no_profile_input(self):
        snapshot = copy.deepcopy(self.plan)
        for badges in range(9):
            model.level_band(self.plan, "ashstair", badges, self.src["game"]["CAP_TABLE"])
        self.assertEqual(self.plan, snapshot)

    def test_opening_tables_are_exact_and_weighted(self):
        for aid, (band, expected) in model.OPENING.items():
            row = self.plan["areas"][aid]
            self.assertEqual(row["levels"]["band"], band)
            self.assertEqual([(slot["species"], slot["weight"]) for slot in row["pool"]], expected)
            self.assertEqual(sum(slot["weight"] for slot in row["pool"]), 100)

    def test_no_invented_weights_for_regional_candidates(self):
        rows = [a for a in self.plan["areas"].values() if a["pool_status"] == "candidate_pool"]
        self.assertEqual(len(rows), 29)
        self.assertTrue(all(s["weight"] is None for area in rows for s in area["pool"]))

    def test_original_coverage_counts_placements_and_reuse(self):
        original_areas = [a for a in self.plan["areas"].values() if a["original_feature"]]
        originals = [sid for sid in self.plan["species"] if sid.startswith("wildbond:")]
        self.assertEqual(len(original_areas), 18)
        self.assertEqual(len(originals), 16)
        self.assertEqual({a["region"] for a in original_areas}, set(self.src["game"]["BIOMES"]))
        for sid in ("wildbond:seedpip", "wildbond:brineskit"):
            self.assertEqual(sum(any(s["species"] == sid for s in a["pool"]) for a in self.plan["areas"].values()), 2)

    def test_art_is_not_combat_readiness(self):
        self.assertEqual(self.plan["species"]["pokemon:161"]["readiness"], {"art": "private_library_verified_needs_scene_review", "combat": "needs_catalogue_integration"})
        self.assertEqual(self.plan["species"]["pokemon:16"]["readiness"]["combat"], "supported_in_chapter")
        self.assertEqual(self.plan["species"]["wildbond:bogsnap"]["readiness"]["combat"], "needs_catalogue_integration")
        plan = self.changed()
        plan["species"]["pokemon:161"]["readiness"]["combat"] = "supported_in_chapter"
        self.rejects(plan, "readiness mismatch")

    def test_unknown_duplicate_species_and_bad_area_rejected(self):
        plan = self.changed()
        plan["areas"]["millgrass"]["pool"][0]["species"] = "pokemon:99999"
        self.rejects(plan, "pool references")
        plan = self.changed()
        plan["areas"]["ashstair"]["pool"].append(copy.deepcopy(plan["areas"]["ashstair"]["pool"][0]))
        self.rejects(plan, "duplicate pool")
        plan = self.changed()
        plan["areas"]["invented_location"] = plan["areas"].pop("ashstair")
        self.rejects(plan, "denominator")

    def test_missing_area_and_extra_special_site_rejected(self):
        plan = self.changed()
        del plan["areas"]["lowbell"]
        self.rejects(plan, "denominator")
        plan = self.changed()
        plan["areas"]["lampcrown"] = copy.deepcopy(plan["areas"]["crestpath"])
        self.rejects(plan, "denominator")

    def test_invalid_weights_rejected(self):
        for weight in (0, -1, True, float("nan"), "25"):
            plan = self.changed()
            plan["areas"]["millgrass"]["pool"][0]["weight"] = weight
            self.rejects(plan, "positive integers")
        plan = self.changed()
        plan["areas"]["rootwater"]["pool"][-1]["weight"] = 9
        self.rejects(plan, "total 100")
        plan = self.changed()
        plan["areas"]["ashstair"]["pool"][0]["weight"] = 50
        self.rejects(plan, "Candidate weights")

    def test_wrong_offsets_modes_and_fixed_bands_rejected(self):
        plan = self.changed()
        plan["level_policy"]["difficulty_offsets"]["demanding"] = 100
        self.rejects(plan, "offsets changed")
        plan = self.changed()
        plan["areas"]["millgrass"]["levels"] = {"mode": "regional", "difficulty": "ordinary"}
        self.rejects(plan, "Wrong level mode")
        plan = self.changed()
        plan["areas"]["rootwater"]["levels"]["band"] = [30, 40]
        self.rejects(plan, "Fixed authored band")

    def test_changed_source_and_unresolved_dependencies_not_hidden(self):
        plan = self.changed()
        key = next(iter(plan["source_snapshots"]))
        plan["source_snapshots"][key] = "wrong"
        self.rejects(plan, "Source changed")
        for aid, field in (("orchardfen", "dependencies"), ("rootwater", "progression"), ("dewcut", "habitat")):
            plan = self.changed()
            plan["areas"][aid][field] = []
            self.assertTrue(model.validate(plan, self.src))
        self.assertIn("RA-03", self.plan["areas"]["orchardfen"]["dependencies"])
        self.assertIn("RA-04", self.plan["areas"]["answering"]["dependencies"])

    def test_starters_and_guardians_cannot_fill_quota(self):
        for sid in ("wildbond:mosshog", "wildbond:elderhorn"):
            plan = self.changed()
            raw = self.src["original"][sid[9:]]
            plan["species"][sid] = {"name": raw["name"], "readiness": model.readiness(sid, self.src)}
            plan["areas"]["millgrass"]["pool"][-1]["species"] = sid
            self.rejects(plan, "Starter-exclusive" if sid.endswith("mosshog") else "Unique/guardian")

    def test_original_allocation_and_rarity_flags_not_cosmetic(self):
        plan = self.changed()
        plan["areas"]["rootwater"]["original_feature"] = False
        self.rejects(plan, "Original-area flag")
        plan = self.changed()
        plan["areas"]["rootwater"]["original_rarity"] = "always"
        self.rejects(plan, "Invalid original rarity")
        plan = self.changed()
        plan["areas"]["rootwater"]["original_rarity"] = "regular"
        self.rejects(plan, "Opening rarity changed")

    def test_runtime_and_saved_creature_policy_cannot_be_claimed_changed(self):
        plan = self.changed()
        plan["runtime_activation"] = True
        self.rejects(plan, "activation")
        plan = self.changed()
        plan["level_policy"]["mutate_saved_creatures"] = True
        self.rejects(plan, "saved creatures")
        plan = self.changed()
        plan["level_policy"]["special_and_trainers"] = "scale"
        self.rejects(plan, "Special/trainer")

    def test_render_matches_committed_review_document(self):
        self.assertEqual(model.render(self.plan, self.src), model.PLAN.with_suffix(".md").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
