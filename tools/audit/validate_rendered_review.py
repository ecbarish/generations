"""Validate actual screenshot evidence without substituting it for human review."""
import json, pathlib, subprocess, sys
root = pathlib.Path(sys.argv[1])
captures = []
for game in ("wildbond", "starfall"):
    folder = root / game
    manifest = json.loads((folder / "manifest.json").read_text())
    if isinstance(manifest, dict):
        manifest = manifest.get("captures", manifest.get("shots", []))
    shots = [m for m in manifest if "file" in m]
    assert len(shots) >= 20, (game, "incomplete capture set", len(shots))
    for item in shots:
        path = folder / item["file"]
        assert path.is_file(), str(path)
        stats = subprocess.check_output(["identify", "-format", "%w %h %[fx:standard_deviation]", str(path)], text=True).split()
        width, height, deviation = int(stats[0]), int(stats[1]), float(stats[2])
        assert deviation > 0.01, (str(path), "blank or nearly blank capture", deviation)
        captures.append({"file": str(path.relative_to(root)), "width": width, "height": height, "stddev": deviation})
wb = json.loads((root / "wildbond-access.json").read_text())
sf = json.loads((root / "starfall-access.json").read_text())
# WD4b added Saltmarsh Trail and Moon Pool. Check identities as well as count:
# merely accepting a larger total could hide a missing map or a duplicate capture.
expected_wildbond_maps = {
    "larkhaven", "thornwood_route", "thornwood", "thornwood_grove",
    "saltmarsh_route", "saltmarsh", "saltmarsh_pool", "emberfall", "cloudglass",
    "stillreed", "hollowecho", "sunthread", "farwatch", "league", "spire",
    "barn", "inn", "shop", "pip_home", "gran_home",
}
assert len(wb["maps"]) == len(expected_wildbond_maps), "Incomplete or duplicate Wildbond map coverage"
assert {m["map"] for m in wb["maps"]} == expected_wildbond_maps, "Unexpected or missing Wildbond map IDs"
assert len(sf["states"]) == 501
report = {"captures": captures, "wildbond_findings": wb["findings"],
          "wildbond_route_witnesses": [m["map"] for m in wb["maps"] if m["route_roof_witness"]],
          "starfall_unreachable": [s for s in sf["states"] if s["unreachable_targets"]]}
(root / "validation.json").write_text(json.dumps(report, indent=2) + "\n")
print("Validated", len(captures), "nonblank actual-renderer captures.")
print("Wildbond access findings:", len(wb["findings"]), "Starfall access findings:", len(report["starfall_unreachable"]))
