#!/usr/bin/env python3
"""Strict rendered doors, visible phone controls, and settings regression."""
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
phone_sizes = sizes + [(844, 390), (960, 540)]
buildings = {"inn": (4, 4), "shop": (7, 10), "pip_home": (13, 4), "gran_home": (2, 10), "barn": (18, 4)}
methods = ["mouse", "touch", "keyboard"]
phases = ["entry", "exit", "reentry"]
expected_core = {(f"{w}x{h}/{building}/{method}", phase) for (w, h), building, method, phase in itertools.product(sizes, buildings, methods, phases)}
expected_auto = {(f"{w}x{h}/{building}/touch-auto", phase) for (w, h), building, phase in itertools.product(phone_sizes, buildings, phases)}
expected = expected_core | expected_auto


def close(actual, expected):
    return sum((a - b) ** 2 for a, b in zip(actual, expected)) < 0.25


def verify_pointer_preflight(case):
    preflight = case["pointer_preflight"]
    for actual, expected in [("os_position", "screen_target"), ("viewport_position", "viewport_target"), ("world_position", "world_target")]:
        assert close(preflight[actual], case[expected]), (case["case"], "pointer_preflight", actual)


seen = set()
for case in report["cases"]:
    key = (case["case"], case["phase"])
    assert key not in seen, f"Duplicate transition: {key}"
    seen.add(key)
    size_name, building, input_label = case["case"].split("/")
    method = case["method"]
    assert tuple(case["size"]) in phone_sizes
    assert size_name == "%dx%d" % tuple(case["size"])
    assert case["arrived"] and case["transition_started"], key
    assert case["after"]["map"] == case["expected_map"], key
    assert case["after"]["partner_map"] == case["expected_map"], key
    assert case["after"]["partner_instance"] == case["before"]["partner_instance"], key
    assert case["after"]["partner_id"] == case["before"]["partner_id"], key
    assert case["after"]["stage"] == "free" and case["after"]["transition"] < 0, key
    if case["phase"] == "entry":
        assert case["partner_followed_before_switch"], key
        assert tuple(case["before"]["player"]) == (buildings[building][0], buildings[building][1] + 2), key
    if case["phase"] == "exit":
        assert case["expected_map"] == "larkhaven", key
        assert tuple(case["after"]["player"]) == (buildings[building][0], buildings[building][1] + 1), key
    else:
        assert case["expected_map"] == building and tuple(case["goal"]) == buildings[building], key
    assert 0 < case["simulation_frames"] <= 240, key
    frame = tuple(case["size"]) in {(812, 375), (844, 390)}
    if key in expected_auto:
        assert case["suite"] == "visible-auto-pad" and method == "touch", key
        if frame:
            assert case["phone_buttons_setting"] == "auto" and not case["touch_buttons_visible"], key
        else:
            assert case["phone_buttons_setting"] == "auto" and case["touch_buttons_visible"], key
        assert not case["target_hits_pad"] and not case["target_hits_button"], key
    else:
        assert case["suite"] == "core" and method == input_label, key
        assert case["phone_buttons_setting"] == "off" and not case["touch_buttons_visible"], key
    events = case["input_events"]
    if method in ("mouse", "touch"):
        verify_pointer_preflight(case)
        assert case["queued_at_input"] and case["queued_at_input"][-1] == case["goal"], key
        assert any(e["kind"] == "InputEventMouseButton" and e["phase"] == "unhandled_input" and e["pressed"] for e in events), key
        assert close(case["world_mouse_after_input"], case["world_target"]), key
        if method == "touch":
            assert any(e["kind"] == "InputEventScreenTouch" and e["phase"] == "input" and e["pressed"] for e in events), key
            assert any(e["kind"] == "InputEventMouseButton" and e["device"] == -1 and e["pressed"] for e in events), key
    else:
        assert any(e["kind"] == "InputEventKey" and e["pressed"] for e in events), key
        assert any(e["kind"] == "InputEventKey" and not e["pressed"] for e in events), key
assert seen == expected, f"Missing: {expected - seen}; unexpected: {seen - expected}"
assert len(seen) == report["expected_transitions"] == 150

# Exit and re-entry must use the actual preceding landing, never a fixture reset.
for name in {name for name, _ in expected}:
    group = {c["phase"]: c for c in report["cases"] if c["case"] == name}
    for previous, following in [("entry", "exit"), ("exit", "reentry")]:
        for field in ["map", "player", "partner", "partner_map", "partner_instance"]:
            assert group[previous]["after"][field] == group[following]["before"][field], (name, field)

settings_seen = set()
expected_settings = {f"{w}x{h}/settings/{label}" for (w, h), label in itertools.product(phone_sizes, ["auto-untouched", "auto-after-touch", "on", "off"])}
for case in report["settings_checks"]:
    assert case["case"] not in settings_seen
    settings_seen.add(case["case"])
    assert case["visible"] == case["expected_visible"]
    setting, touched, visible = {
        "auto-untouched": ("auto", False, False),
        "auto-after-touch": ("auto", True, True),
        "on": ("on", False, True),
        "off": ("off", True, False),
    }[case["label"]]
    if tuple(case["size"]) in {(812, 375), (844, 390)}:
        visible = False
    assert (case["setting"], case["touched"], case["visible"]) == (setting, touched, visible), case
assert settings_seen == expected_settings

pad_seen = set()
directions = {"move_up": (0, -1), "move_down": (0, 1), "move_left": (-1, 0), "move_right": (1, 0)}
expected_pad = {f"{w}x{h}/pad/{action}" for (w, h), action in itertools.product(phone_sizes, list(directions) + ["hide-releases"])}
for case in report["pad_checks"]:
    name = case["case"]
    assert name not in pad_seen
    pad_seen.add(name)
    if case.get("phone_frame"):
        assert case["released"], name
        if case["kind"] == "hold-release":
            direction = directions[case["action"]]
            assert tuple(case["direction"]) == direction and case["moved_while_held"], name
            assert not case["world_tap_leaked"], name
            assert case["after"]["player"] == [case["start"][0] + direction[0], case["start"][1] + direction[1]], name
            assert case["after"]["player_path"] == [], name
        else:
            assert case["kind"] == "hide-release" and not case["visible"], name
        continue
    verify_pointer_preflight(case)
    x, y = case["pad_center"]
    radius = case["pad_radius"]
    assert radius == 32 and radius <= x <= 384 - radius and radius <= y <= 216 - radius, name
    assert case["released"], name
    if case["kind"] == "hold-release":
        direction = directions[case["action"]]
        assert tuple(case["direction"]) == direction and case["moved_while_held"], name
        assert not case["world_tap_leaked"], name
        assert case["after"]["player"] == [case["start"][0] + direction[0], case["start"][1] + direction[1]], name
        assert case["after"]["player_path"] == [], name
        events = case["input_events"]
        assert any(e["kind"] == "InputEventScreenTouch" and e["pressed"] for e in events), name
        assert any(e["kind"] == "InputEventScreenTouch" and not e["pressed"] for e in events), name
    else:
        assert case["kind"] == "hide-release" and not case["visible"], name
assert pad_seen == expected_pad

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
    assert dimensions == tuple(capture["window_size"]) and dimensions in phone_sizes, (filename, dimensions)
    deviation = float(subprocess.check_output(["identify", "-format", "%[fx:standard_deviation]", str(path)], text=True))
    assert deviation > 0.03, f"Flat/black capture: {filename} ({deviation})"
assert len(files) == 256, f"Expected 120 core + 80 default-pad + 40 pad-control + 16 settings screenshots, got {len(files)}"
print("PASS: original 90 transitions plus 60 visible-default-pad transitions; all five buildings entered, exited, and re-entered")
print("PASS: 16 directional hold/release checks, 4 release-on-hide checks, 16 auto/on/off checks, and 256 nonblank screenshots")
print("Viewport sizes: 1920x1080, 812x375, 844x390, 960x540; desktop emulated touch, not physical mobile-browser testing")
