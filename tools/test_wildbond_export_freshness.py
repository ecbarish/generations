#!/usr/bin/env python3
"""Positive and negative controls for the Wildbond web-export freshness check."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = Path(__file__).with_name("wildbond-export-freshness.py")
spec = importlib.util.spec_from_file_location("wildbond_export_freshness", SCRIPT)
freshness = importlib.util.module_from_spec(spec)
spec.loader.exec_module(freshness)

TREE = "a" * 40
OTHER = "b" * 40


def files_for(pack_size, html_size=None):
    if html_size is None:
        html_size = pack_size
    html = b'{"fileSizes":{"index.pck":%d,"index.wasm":4}}' % html_size
    blob = {
        "index.html": html,
        "index.js": b"engine-js",
        "index.pck": b"P" * pack_size,
        "index.wasm": b"WASM",
    }
    return blob


def manifest_for(blob, tree=TREE):
    return {
        "built": "2026-10-14",
        "godot": "4.7.2-stable",
        "source_commit": "c" * 40,
        "source_tree": tree,
        "review_run": None,
        "sha256": {name: hashlib.sha256(data).hexdigest() for name, data in blob.items()},
    }


class PackedPathRules(unittest.TestCase):
    def test_game_files_count_and_notes_do_not(self):
        self.assertTrue(freshness.is_packed_source("wildbond-godot/scripts/main.gd"))
        self.assertTrue(freshness.is_packed_source("wildbond-godot/scripts/main.gd.uid"))
        self.assertTrue(freshness.is_packed_source("wildbond-godot/scenes/world.tscn"))
        self.assertTrue(freshness.is_packed_source("wildbond-godot/assets/hero.png"))
        self.assertTrue(freshness.is_packed_source("wildbond-godot/shaders/water.gdshader"))
        self.assertTrue(freshness.is_packed_source("wildbond-godot/data/creatures.json"))
        self.assertTrue(freshness.is_packed_source("wildbond-godot/tools/paint_tiles.gd"))
        self.assertTrue(freshness.is_packed_source("wildbond-godot/project.godot"))
        self.assertTrue(freshness.is_packed_source("wildbond-godot/export_presets.cfg"))
        self.assertTrue(freshness.is_packed_source("wildbond-godot/default_bus_layout.tres"))
        self.assertFalse(freshness.is_packed_source("wildbond-godot/tests/wbl_battle_start.gd"))
        self.assertFalse(freshness.is_packed_source("wildbond-godot/frames/shot.png"))
        self.assertFalse(freshness.is_packed_source("wildbond-godot/.godot/global_script_class_cache.cfg"))
        self.assertFalse(freshness.is_packed_source("wildbond-godot/export/Wildbond.exe"))
        self.assertFalse(freshness.is_packed_source("wildbond-godot/README.md"))
        self.assertFalse(freshness.is_packed_source("wildbond-godot/START-HERE.md"))
        self.assertFalse(freshness.is_packed_source("wildbond-godot/Play Wildbond trial.bat"))
        self.assertFalse(freshness.is_packed_source("wildbond-godot/.gitignore"))
        self.assertFalse(freshness.is_packed_source("play/wildbond/index.pck"))

    def test_rename_lists_both_paths(self):
        text = "R100\twildbond-godot/scripts/old.gd\twildbond-godot/scripts/new.gd\nM\tplay/README.md\n"
        self.assertEqual(
            freshness.parse_name_status(text),
            {"wildbond-godot/scripts/old.gd", "wildbond-godot/scripts/new.gd", "play/README.md"},
        )


class FreshnessDecision(unittest.TestCase):
    def test_stale_stamp_passes_when_the_game_is_unchanged(self):
        blob = files_for(32)
        problems = freshness.collect_problems(set(), OTHER, manifest_for(blob, TREE), blob)
        self.assertEqual(problems, [])

    def test_tests_and_notes_do_not_demand_an_export(self):
        blob = files_for(32)
        changed = {
            "wildbond-godot/tests/wbl_battle_start.gd",
            "wildbond-godot/README.md",
            "docs/QUEUE.md",
        }
        problems = freshness.collect_problems(changed, OTHER, manifest_for(blob, TREE), blob)
        self.assertEqual(problems, [])

    def test_script_change_without_a_pack_fails(self):
        blob = files_for(32)
        problems = freshness.collect_problems(
            {"wildbond-godot/scripts/battle.gd"}, TREE, manifest_for(blob, OTHER), blob
        )
        self.assertTrue(any("web export was left stale" in problem for problem in problems))
        self.assertTrue(any("source_tree" in problem for problem in problems))

    def test_matching_export_passes(self):
        blob = files_for(64)
        changed = {
            "wildbond-godot/scenes/battle.tscn",
            "wildbond-godot/assets/creatures/glimmerwing.png",
            "wildbond-godot/project.godot",
            *freshness.EXPORT_PATHS,
        }
        problems = freshness.collect_problems(changed, TREE, manifest_for(blob, TREE), blob)
        self.assertEqual(problems, [])

    def test_export_files_with_the_wrong_tree_fail(self):
        blob = files_for(64)
        problems = freshness.collect_problems(set(freshness.EXPORT_PATHS), TREE, manifest_for(blob, OTHER), blob)
        self.assertEqual(len(problems), 1)
        self.assertIn(OTHER, problems[0])
        self.assertIn(TREE, problems[0])

    def test_shell_byte_count_must_match_the_pack(self):
        blob = files_for(pack_size=10, html_size=11)
        problems = freshness.collect_problems(set(), TREE, manifest_for(blob), blob)
        self.assertTrue(any("byte" in problem for problem in problems))

    def test_partial_export_lists_the_missing_pack_files(self):
        blob = files_for(16)
        changed = {"wildbond-godot/default_bus_layout.tres", "play/wildbond/build.json"}
        problems = freshness.collect_problems(changed, TREE, manifest_for(blob, TREE), blob)
        joined = "\n".join(problems)
        self.assertIn("play/wildbond/index.pck", joined)
        self.assertIn("play/wildbond/index.html", joined)
        self.assertNotIn("play/wildbond/build.json", joined.split("Update ", 1)[-1].split(" in this same", 1)[0])


class RepositoryFixtures(unittest.TestCase):
    def run_check(self, base, head):
        return subprocess.run(
            [sys.executable, str(SCRIPT), "--base", base, "--head", head],
            cwd=ROOT,
            text=True,
            capture_output=True,
        )

    def require_commit(self, sha):
        present = subprocess.call(["git", "cat-file", "-e", sha + "^{commit}"], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if present != 0:
            if os.environ.get("REQUIRE_FIXTURES") == "1":
                self.fail(f"required commit {sha} is not in this clone")
            self.skipTest(f"{sha} is not in this clone")

    def test_current_main_passes_with_its_stale_stamp(self):
        self.require_commit("5e5a3893a0478a7aa4816348c1dba85cbd7a6829")
        result = self.run_check("5e5a3893a0478a7aa4816348c1dba85cbd7a6829", "5e5a3893a0478a7aa4816348c1dba85cbd7a6829")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("No packed Wildbond game files changed", result.stdout)

    def test_export_head_passes(self):
        base = "5e5a3893a0478a7aa4816348c1dba85cbd7a6829"
        head = "8cdcb97361a96a60c51d0eb61d44b352dbd82f2a"
        self.require_commit(base)
        self.require_commit(head)
        result = self.run_check(base, head)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("3685dda4f56885a4d6255987db135cb1ccb84d55", result.stdout)

    def test_script_only_history_fails_and_explains_the_refresh(self):
        base = "a13258f70bb47cd2facb724e6cab4e4459f69cf6"
        head = "b2af229b7bd4257b70900aa05573dca8a07a6088"
        self.require_commit(base)
        self.require_commit(head)
        result = self.run_check(base, head)
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("web export was left stale", result.stdout)
        self.assertIn("git rev-parse HEAD:wildbond-godot", result.stdout)
        self.assertIn("--export-pack Web", result.stdout)
        manifest = json.loads(subprocess.check_output(["git", "show", head + ":play/wildbond/build.json"], cwd=ROOT))
        tree = subprocess.check_output(["git", "rev-parse", head + ":wildbond-godot"], cwd=ROOT, text=True).strip()
        self.assertNotEqual(manifest["source_tree"], tree)


if __name__ == "__main__":
    unittest.main()
