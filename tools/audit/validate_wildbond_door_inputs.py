#!/usr/bin/env python3
"""Validate exact rendered/input coverage, with separate default-phone findings."""
import itertools
import json
from pathlib import Path
import struct
import subprocess
import sys

root = Path(sys.argv[1])
report = json.loads((root / "manifest.json").read_text())
assert report["schema"] == 1
assert report["display_server"] != "headless", "Headless execution is not rendered proof"
assert report["engine"]["major"] == 4 and report["engine"]["minor"] == 7 and report["engine"]["patch"] == 2, report["engine"]
assert len(report["source_sha"]) == 40, "Missing exact tested source SHA"
assert report["emulate_mouse_from_touch"] is True
assert report["emulate_touch_from_mouse"] is False
assert not report["failures"], json.dumps(report["failures"], indent=2)

sizes = [(1920, 1080), (812, 375)]
buildings = {"inn": (4, 4), "shop": (7, 10), "pip_home": (13, 4), "gran_home": (2, 10), "barn": (18, 4)}
methods = ["mouse", "touch", "keyboard"]
phases = ["entry", "exit", "reentry"]
expected = {(f"{w}x{h}/{building}/{method}", phase) for (w, h), building, method, phase in itertools.product(sizes, buildings, methods, phases)}
seen = set()
for case in report["cases"]:
    key = (case["case"], case["phase"])
    assert key not in seen, f"Duplicate transition: {key}"
    seen.add(key)
    size_name, building, method = case["case"].split("/")
    assert tuple(case["size"]) in sizes
    assert size_name == "%dx%d" % tuple(case["size"])
    assert case["arrived"] and case["transition_started"], key
    assert case["after"]["map"] == case["expected_map"], key
    assert case["after"]["partner_map"] == case["expected_map"], key
    assert case["after"]["partner_instance"] == case["before"]["partner_instance"], key
    assert case["after"]["partner_id"] == case["before"]["partner_id"], key
    assert case["after"]["stage"] == "free", key
    assert case["after"]["transition"] < 0, key
    if case["phase"] == "entry":
        assert case["partner_followed_before_switch"], key
        assert tuple(case["before"]["player"]) == (buildings[building][0], buildings[building][1] + 2), key
    if case["phase"] == "exit":
        assert case["expected_map"] == "larkhaven", key
        assert tuple(case["after"]["player"]) == (buildings[building][0], buildings[building][1] + 1), key
    else:
        assert case["expected_map"] == building, key
        assert tuple(case["goal"]) == buildings[building], key
    assert 0 < case["simulation_frames"] <= 240, key
    events = case["input_events"]
    if method in ("mouse", "touch"):
        assert case["phone_buttons_setting"] == "off", key
        assert not case["touch_buttons_visible"], key
        assert case["queued_at_input"] and case["queued_at_input"][-1] == case["goal"], key
        assert any(e["kind"] == "InputEventMouseButton" and e["phase"] == "unhandled_input" and e["pressed"] for e in events), key
        actual = case["world_mouse_after_input"]
        target = case["world_target"]
        assert sum((a - b) ** 2 for a, b in zip(actual, target)) < 0.25, key
        if method == "touch":
            assert any(e["kind"] == "InputEventScreenTouch" and e["phase"] == "input" and e["pressed"] for e in events), key
            assert any(e["kind"] == "InputEventMouseButton" and e["device"] == -1 and e["pressed"] for e in events), key
    else:
        assert any(e["kind"] == "InputEventKey" and e["pressed"] for e in events), key
        assert any(e["kind"] == "InputEventKey" and not e["pressed"] for e in events), key
assert seen == expected, f"Missing: {expected - seen}; unexpected: {seen - expected}"
assert len(seen) == report["expected_transitions"] == 90

# Entry -> exit -> re-entry must use the real preceding landing, not fixture resets.
for (w, h), building, method in itertools.product(sizes, buildings, methods):
    name = f"{w}x{h}/{building}/{method}"
    group = {c["phase"]: c for c in report["cases"] if c["case"] == name}
    for previous, following in [("entry", "exit"), ("exit", "reentry")]:
        for field in ["map", "player", "partner", "partner_map", "partner_instance"]:
            assert group[previous]["after"][field] == group[following]["before"][field], (name, field)

expected_diagnostics = {f"{w}x{h}/{building}/touch-auto-{state}" for (w, h), building, state in itertools.product(sizes, buildings, ["first", "settled"])}
diagnostic_seen = set()
intercepted = []
for case in report["phone_diagnostics"]:
    name = case["case"]
    assert name not in diagnostic_seen
    diagnostic_seen.add(name)
    assert case["phone_buttons_setting"] == "auto"
    if case["status"] == "intercepted-by-phone-controls":
        assert not case["arrived"] and not case["mouse_reached_unhandled_input"], name
        assert case["controls_visible_before"] and (case["target_hits_pad"] or case["target_hits_button"]), name
        intercepted.append(name)
    else:
        assert case["status"] == "entered" and case["arrived"], name
        assert case["mouse_reached_unhandled_input"], name
assert diagnostic_seen == expected_diagnostics, "Incomplete default phone diagnostics"

files = set()
for capture in report["captures"]:
    filename = capture["file"]
    assert filename not in files, filename
    files.add(filename)
    path = root / filename
    assert path.is_file() and path.stat().st_size > 1000, filename
    with path.open("rb") as image:
        header = image.read(24)
    assert header[:8] == b"\x89PNG\r\n\x1a\n" and header[12:16] == b"IHDR", filename
    dimensions = struct.unpack(">II", header[16:24])
    assert dimensions == tuple(capture["window_size"]) and dimensions in sizes, (filename, dimensions)
    deviation = float(subprocess.check_output(["identify", "-format", "%[fx:standard_deviation]", str(path)], text=True))
    assert deviation > 0.03, f"Flat/black capture: {filename} ({deviation})"
assert len(files) == 160, f"Expected 120 regression + 40 phone diagnostic screenshots, got {len(files)}"
print("PASS: 90 rendered input transitions and 160 nonblank screenshots at both exact viewport sizes")
print(f"Default auto-pad diagnostics: {20 - len(intercepted)} entered, {len(intercepted)} intercepted")
for name in intercepted:
    print(f"::warning::Default phone controls intercepted the door tap: {name}; see before/after screenshots and manifest. This is not counted as a successful door transition.")
