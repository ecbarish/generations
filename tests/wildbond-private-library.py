"""Offline behavioral checks using synthetic geometry, never private source art."""
import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from PIL import Image

spec = importlib.util.spec_from_file_location("library", Path(__file__).resolve().parents[1] / "tools/wildbond-private-library.py")
library = importlib.util.module_from_spec(spec)
spec.loader.exec_module(library)


class LibraryChecks(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()

    def fixture(self, number=1):
        root = self.root
        folder = f"pokemon/{number}/world"
        (root / folder).mkdir(parents=True, exist_ok=True)
        files = []
        def record(rel):
            p = root / rel
            files.append({"file": rel, "sha256": library.pilot.digest(p), "bytes": p.stat().st_size})
        pair = {}
        for facing in ("front", "back"):
            rel = f"pokemon/{number}/{facing}.png"
            Image.new("RGBA", (16, 16), (20, 80, 60, 255)).save(root / rel)
            record(rel)
            pair[facing] = {"file": rel, "image": library.pilot.image_info(root / rel)}
        xml = "<AnimData><Anims>" + "".join(f"<Anim><Name>{name}</Name><FrameWidth>16</FrameWidth><FrameHeight>16</FrameHeight><Durations><Duration>8</Duration><Duration>8</Duration></Durations></Anim>" for name in ("Idle", "Walk")) + "</Anims></AnimData>"
        (root / folder / "AnimData.xml").write_text(xml)
        (root / folder / "credits.txt").write_text("Synthetic test only")
        for name in ("AnimData.xml", "credits.txt"):
            record(f"{folder}/{name}")
        for state in ("Idle", "Walk"):
            Image.new("RGBA", (32, 128), (20, 80, 60, 255)).save(root / folder / f"{state}-Anim.png")
            shadow = Image.new("RGBA", (32, 128))
            for y in range(8):
                for x in range(2):
                    shadow.putpixel((x * 16 + 8, y * 16 + 14), (255, 255, 255, 255))
            shadow.save(root / folder / f"{state}-Shadow.png")
            record(f"{folder}/{state}-Anim.png")
            record(f"{folder}/{state}-Shadow.png")
        return {"id": f"pokemon:{number}", "source_id": number, "name": "Synthetic",
                "battle": {"platinum": pair}, "preferred_style": "platinum",
                "world": {"directory": folder, "animations": {s: library.pilot.animation(root, folder, s) for s in ("Idle", "Walk")}, "credits_file": f"{folder}/credits.txt"},
                "files": files, "ready_for_pack": True, "issues": []}

    def write_index(self, entry):
        index = {"schema": 1, "revisions": library.pilot.REVISIONS, "sources": [], "species": {entry["id"]: entry}}
        library.atomic_json(self.root / "library.json", index)
        return index

    def test_ranges_and_style_priority(self):
        self.assertEqual(library.parse_ids("1-3,2,194"), [1, 2, 3, 194])
        for value in ("0", "1026", "4-1", "1-2-3"):
            with self.assertRaises(ValueError): library.parse_ids(value)
        self.assertEqual(next(library.battle_sources(493))[0], "platinum")
        self.assertEqual(next(library.battle_sources(494))[0], "black-white")
        self.assertEqual(next(library.battle_sources(650))[0], "default")

    def test_external_paths(self):
        with self.assertRaises(ValueError): library.outside_checkout(Path(__file__).parent)
        with self.assertRaises(ValueError): library.pilot.safe(self.root, "../escape")

    def test_active_pack_and_revision_changes_reject_before_network(self):
        with patch.object(library, "fetch", side_effect=AssertionError("network used")):
            (self.root / "manifest.json").write_text("{}")
            with self.assertRaisesRegex(ValueError, "separate library"):
                library.build(self.root, [1], 1)
            (self.root / "manifest.json").unlink()
            library.atomic_json(self.root / "library.json", {"schema": 1, "revisions": {}})
            with self.assertRaisesRegex(ValueError, "other revisions"):
                library.build(self.root, [1], 1)

    def test_hash_and_geometry(self):
        entry = self.fixture()
        self.write_index(entry)
        library.check(self.root)
        entry["world"]["animations"]["Walk"]["anchors"][0][0][0] = 99
        self.write_index(entry)
        with self.assertRaisesRegex(ValueError, "Animation metadata"):
            library.check(self.root)
        (self.root / entry["files"][0]["file"]).write_bytes(b"changed")
        with self.assertRaisesRegex(ValueError, "Missing/changed"):
            library.check(self.root)

    def test_missing_pair_and_unverified_reference(self):
        entry = self.fixture()
        del entry["battle"]["platinum"]["back"]
        self.write_index(entry)
        with self.assertRaisesRegex(ValueError, "complete pair"):
            library.check(self.root)
        entry = self.fixture()
        entry["files"] = entry["files"][1:]
        self.write_index(entry)
        with self.assertRaisesRegex(ValueError, "Unverified battle"):
            library.check(self.root)

    def test_resume_receipt_avoids_network(self):
        entry = self.fixture()
        record = copy.deepcopy(entry["files"][0])
        repo = "PokeAPI/sprites"
        record["url"] = f"https://raw.githubusercontent.com/{repo}/{library.pilot.REVISIONS[repo]}/test.png"
        p = self.root / record["file"]
        library.atomic_json(p.with_suffix(p.suffix + ".receipt.json"), record)
        with patch.object(library.urllib.request, "urlopen", side_effect=AssertionError("network used")):
            self.assertEqual(library.fetch(self.root, repo, "test.png", record["file"]), record)

    def test_unavailable_files_not_claimed_ready(self):
        tracker = {"0001": {"name": "Synthetic", "sprite_complete": 1}}
        with patch.object(library, "fetch", return_value=None):
            entry = library.collect_species(self.root, 1, tracker)
        self.assertFalse(entry["ready_for_pack"])
        self.assertIsNone(entry["world"])
        self.assertEqual(len(entry["issues"]), 2)

    def test_alias_uses_original_walk_sheet_and_rejects_cycles(self):
        entry = self.fixture()
        folder = self.root / entry["world"]["directory"]
        xml = "<AnimData><Anims><Anim><Name>Idle</Name><CopyOf>Walk</CopyOf></Anim><Anim><Name>Walk</Name><FrameWidth>16</FrameWidth><FrameHeight>16</FrameHeight><Durations><Duration>8</Duration><Duration>8</Duration></Durations></Anim></Anims></AnimData>"
        (folder / "AnimData.xml").write_text(xml)
        idle = library.pilot.animation(self.root, entry["world"]["directory"], "Idle")
        self.assertTrue(idle["file"].endswith("Walk-Anim.png"))
        self.assertEqual(idle["directions"], 8)
        (folder / "AnimData.xml").write_text(xml.replace("<CopyOf>Walk</CopyOf>", "<CopyOf>Idle</CopyOf>"))
        with self.assertRaisesRegex(ValueError, "cyclic"):
            library.pilot.animation(self.root, entry["world"]["directory"], "Idle")

    def test_export_preserves_pilot_and_requires_new_root(self):
        entry = self.fixture()
        self.write_index(entry)
        (self.root / "CREDITS.txt").write_text("Synthetic")
        pilot_root = self.root / "pilot"
        pilot_root.mkdir()
        base = {"schema": 1, "files": [], "species": {}, "trainer": {}, "npcs": {}}
        # Minimal verified pilot is a separate copy, as in a real new-pack export.
        import shutil
        for record in entry["files"]:
            target = pilot_root / record["file"]
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(self.root / record["file"], target)
        base["files"] = entry["files"]
        base["species"][entry["id"]] = {**entry["world"], "battle": entry["battle"]["platinum"]}
        library.atomic_json(pilot_root / "manifest.json", base)
        before = (pilot_root / "manifest.json").read_bytes()
        destination = self.root / "selected"
        library.export_pack(self.root, [1], pilot_root, destination)
        self.assertEqual(before, (pilot_root / "manifest.json").read_bytes())
        self.assertTrue((destination / "manifest.json").exists())
        with self.assertRaises(ValueError): library.export_pack(self.root, [1], pilot_root, destination)
        with self.assertRaises(ValueError): library.export_pack(self.root, list(range(1, 14)), pilot_root, self.root / "too-big")

    def test_gallery_escapes_names_and_lists_coverage(self):
        entry = self.fixture()
        entry["name"] = "<script>"
        library.gallery(self.root, self.write_index(entry))
        page = (self.root / "index.html").read_text(encoding="utf-8")
        self.assertIn("&lt;script&gt;", page)
        self.assertIn("Battle + walking", page)


if __name__ == "__main__":
    unittest.main()
