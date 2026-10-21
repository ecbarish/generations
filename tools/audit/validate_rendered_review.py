"""Validate actual screenshot evidence without substituting it for human review."""
import json, pathlib, subprocess, sys
root = pathlib.Path(sys.argv[1])
captures = []
folder = root / "starfall"
manifest = json.loads((folder / "manifest.json").read_text())
if isinstance(manifest, dict):
    manifest = manifest.get("captures", manifest.get("shots", []))
shots = [m for m in manifest if "file" in m]
assert len(shots) >= 20, ("starfall", "incomplete capture set", len(shots))
for item in shots:
    path = folder / item["file"]
    assert path.is_file(), str(path)
    stats = subprocess.check_output(["identify", "-format", "%w %h %[fx:standard_deviation]", str(path)], text=True).split()
    width, height, deviation = int(stats[0]), int(stats[1]), float(stats[2])
    assert deviation > 0.01, (str(path), "blank or nearly blank capture", deviation)
    captures.append({"file": str(path.relative_to(root)), "width": width, "height": height, "stddev": deviation})
sf = json.loads((root / "starfall-access.json").read_text())
assert len(sf["states"]) == 501
report = {"captures": captures, "starfall_unreachable": [s for s in sf["states"] if s["unreachable_targets"]]}
(root / "validation.json").write_text(json.dumps(report, indent=2) + "\n")
print("Validated", len(captures), "nonblank actual-renderer captures.")
print("Starfall access findings:", len(report["starfall_unreachable"]))
