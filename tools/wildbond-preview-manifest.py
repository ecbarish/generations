#!/usr/bin/env python3
"""Stage or verify a pack-only export against an exact source and fixed engine."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
PREVIEW = ROOT / "play/wildbond"
ENGINE = {
    "index.js": "33c94cb3175f3333b82e2a3be5e8e86f77986f0aa2042b1631f6367a4e5bb6ba",
    "index.wasm": "fc74679e3b97f76878947fcd4fbe1268cbfa6188182a2e33bbc3f5dc9bfa57d0",
}
FILES = {"index.pck", "index.html", *ENGINE}


def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True).strip()


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=["stage", "verify"])
    parser.add_argument("--source", required=True)
    parser.add_argument("--pinned-artifact", action="store_true", help="Verify an already-built immutable release while newer source remains on the branch")
    parser.add_argument("--expected-pack-sha256")
    parser.add_argument("--expected-pack-bytes", type=int)
    args = parser.parse_args()
    assert re.fullmatch(r"[0-9a-f]{40}", args.source), "An exact merged source SHA is required"
    source_tree = git("rev-parse", args.source + ":wildbond-godot")
    if args.pinned_artifact:
        assert args.mode == "verify", "Pinned-artifact mode must never export or stage a different source"
        assert re.fullmatch(r"[0-9a-f]{64}", args.expected_pack_sha256 or ""), "Pin the independently reviewed pack hash"
        assert args.expected_pack_bytes and args.expected_pack_bytes > 0
        subprocess.check_call(["git", "merge-base", "--is-ancestor", args.source, "HEAD"], cwd=ROOT)
        assert digest(PREVIEW / "index.pck") == args.expected_pack_sha256, "Immutable reviewed pack changed"
        assert (PREVIEW / "index.pck").stat().st_size == args.expected_pack_bytes, "Immutable reviewed pack size changed"
    else:
        assert git("rev-parse", "HEAD:wildbond-godot") == source_tree, "Claim branch game source differs from the pinned merged source"
    for name, expected in ENGINE.items():
        assert digest(PREVIEW / name) == expected, name + " must remain the existing Godot 4.7.2 engine"
    before_shell = subprocess.check_output(["git", "show", args.source + ":play/wildbond/index.html"], cwd=ROOT)
    source_manifest = json.loads(subprocess.check_output(["git", "show", args.source + ":play/wildbond/build.json"], cwd=ROOT))
    assert source_manifest["sha256"]["index.js"] == ENGINE["index.js"]
    assert source_manifest["sha256"]["index.wasm"] == ENGINE["index.wasm"]
    size = (PREVIEW / "index.pck").stat().st_size
    expected_shell, replacements = re.subn(rb'("index.pck"\s*:\s*)\d+', lambda m: m[1] + str(size).encode(), before_shell)
    assert replacements == 1, "Expected exactly one pack byte count"
    if args.mode == "stage":
        (PREVIEW / "index.html").write_bytes(expected_shell)
        manifest = {
            "built": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "godot": "4.7.2-stable",
            "source_commit": args.source,
            "source_tree": source_tree,
            "review_run": "https://github.com/" + os.environ["GITHUB_REPOSITORY"] + "/actions/runs/" + os.environ["GITHUB_RUN_ID"],
            "sha256": {name: digest(PREVIEW / name) for name in sorted(FILES)},
        }
        (PREVIEW / "build.json").write_text(json.dumps(manifest, indent=2) + "\n")
    manifest = json.loads((PREVIEW / "build.json").read_text())
    assert manifest["godot"] == "4.7.2-stable"
    assert manifest["source_commit"] == args.source
    assert manifest["source_tree"] == source_tree
    assert set(manifest["sha256"]) == FILES, "Manifest must cover exactly the four shipped files"
    assert (PREVIEW / "index.html").read_bytes() == expected_shell, "Only the shell pack-size field may change"
    for name, expected in manifest["sha256"].items():
        assert re.fullmatch(r"[0-9a-f]{64}", expected)
        assert digest(PREVIEW / name) == expected, name + " digest mismatch"
    assert digest(PREVIEW / "index.pck") != source_manifest["sha256"]["index.pck"], "Preview pack was not refreshed"
    previous_pack = subprocess.check_output(["git", "show", args.source + ":play/wildbond/index.pck"], cwd=ROOT)
    assert digest(PREVIEW / "index.pck") != hashlib.sha256(previous_pack).hexdigest(), "Preview pack still equals the actual previous committed pack"
    out = ROOT / "preview-review"
    out.mkdir(exist_ok=True)
    (out / "build.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print("Verified exact pack, source tree, shell-only byte count and unchanged Godot engine")


if __name__ == "__main__":
    main()
