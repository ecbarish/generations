#!/usr/bin/env python3
"""Fail when the packed Wildbond game changes without a matching web export.

The live site serves play/wildbond/index.pck. tools/godot-export.ps1 copies
browser JSON into the Godot project; it does not build this preview. The
preview is a Godot pack export. play/wildbond/index.html stores the pack size,
and play/wildbond/build.json stores the source commit and the pack hash. The
main-branch live check downloads those files and matches them to build.json,
so the record has to stay accurate. index.js and index.wasm stay the existing
engine bytes. When a pull request or a commit on main changes the packed game,
this check requires a new pack, an updated size, and a source_tree that matches
the reviewed commit.

A historically stale source_tree is allowed when the packed game did not change.
That keeps current main, and docs-only commits, green until the next real export.
"""
import argparse
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPORT_NAMES = ("index.pck", "index.html", "build.json")
EXPORT_PATHS = tuple(f"play/wildbond/{name}" for name in EXPORT_NAMES)
HASHED_NAMES = ("index.html", "index.js", "index.pck", "index.wasm")
TREE_RE = re.compile(r"[0-9a-f]{40}")
PACK_SIZE_RE = re.compile(br'"index\.pck"\s*:\s*(\d+)')
# The committed Godot 4.7.2 web engine. A pack refresh must not replace these.
ENGINE = {
    "index.js": "33c94cb3175f3333b82e2a3be5e8e86f77986f0aa2042b1631f6367a4e5bb6ba",
    "index.wasm": "fc74679e3b97f76878947fcd4fbe1268cbfa6188182a2e33bbc3f5dc9bfa57d0",
}

REFRESH_HELP = """
How to refresh the Wildbond web export:

tools/godot-export.ps1 does not build this preview. It copies browser JSON into wildbond-godot/data/. The preview is a Godot pack export written to play/wildbond/index.pck. From the repository root, with Godot 4.7.2:

    Godot --headless --path wildbond-godot --editor --import --quit
    Godot --headless --path wildbond-godot --export-pack Web "$PWD/play/wildbond/index.pck"

On Windows the executable is Godot_v4.7.2-stable_win64_console.exe and the pack path is %CD%\\play\\wildbond\\index.pck.

Then set the single "index.pck" byte count in play/wildbond/index.html to the new file size. Leave index.js and index.wasm unchanged. Update play/wildbond/build.json so the live check can match it: source_commit (the commit you exported), the sha256 pack hash, and the sha256 of index.html, index.js and index.wasm. Also set source_tree from `git rev-parse <that commit>:wildbond-godot`. source_tree has to equal that commit's wildbond-godot tree. Commit index.pck, index.html and build.json together.

python3 tools/wildbond-export-freshness.py --base origin/main --head HEAD

tools/wildbond-preview-manifest.py stage writes the same shell count and manifest inside the preview workflow. It needs GITHUB_REPOSITORY and GITHUB_RUN_ID, so a local refresh edits the three files directly. The same steps are in play/README.md.
""".strip()


def is_packed_source(path):
    """True for game files the Web preset packs. Tests, frames and notes are out."""
    prefix = "wildbond-godot/"
    if not path.startswith(prefix):
        return False
    rest = path[len(prefix):]
    if rest.startswith(("tests/", "frames/", ".godot/", "export/")):
        return False
    name = rest.rsplit("/", 1)[-1]
    if name.endswith(".md") or name.endswith(".bat") or name == ".gitignore":
        return False
    return True


def parse_name_status(text):
    """Paths from `git diff --name-status -M`, including both sides of a rename."""
    paths = set()
    for line in text.splitlines():
        if not line.strip():
            continue
        parts = line.split("\t")
        status = parts[0]
        if status.startswith(("R", "C")) and len(parts) >= 3:
            paths.update(parts[1:])
        elif len(parts) >= 2:
            paths.add(parts[-1])
    return paths


def engine_problems(files):
    """The live pages keep the existing engine bytes. A pack export must not replace them."""
    problems = []
    for name, expected in ENGINE.items():
        data = files.get(name)
        if data is None:
            continue
        actual = hashlib.sha256(data).hexdigest()
        if actual != expected:
            problems.append(
                f"play/wildbond/{name} is {actual}. It has to stay {expected}. "
                "The pack export leaves the Godot engine files unchanged."
            )
    return problems


def source_record_problems(manifest, source_commit_tree):
    """source_commit and source_tree have to name the same exported game."""
    if not isinstance(manifest, dict):
        return []
    commit = manifest.get("source_commit")
    if not isinstance(commit, str) or not TREE_RE.fullmatch(commit):
        return ["build.json source_commit must be the 40-character commit the pack was exported from."]
    tree = manifest.get("source_tree")
    if source_commit_tree is not None and tree != source_commit_tree:
        return [
            f"build.json source_commit {commit} has wildbond-godot tree {source_commit_tree}, "
            f"and source_tree is {tree}. The source commit and the pack hash have to describe that same export."
        ]
    return []


def shell_pack_size(html):
    found = PACK_SIZE_RE.findall(html)
    if len(found) != 1:
        return None
    return int(found[0])


def collect_problems(changed, head_tree, manifest, files):
    """Return human-readable failures. An empty list means the range passes.

    changed is the set of paths that differ between the merge base and head.
    files maps the four shipped names to their bytes at head. manifest is the
    parsed build.json object, or None when that file is missing or invalid.
    """
    problems = []
    changed = set(changed)
    files = dict(files)
    if not isinstance(manifest, dict):
        problems.append("play/wildbond/build.json is missing or is not a JSON object at this commit.")
        manifest = {}

    pck = files.get("index.pck")
    html = files.get("index.html")
    if pck is None:
        problems.append("play/wildbond/index.pck is missing at this commit.")
    elif html is None:
        problems.append("play/wildbond/index.html is missing at this commit.")
    else:
        size = shell_pack_size(html)
        if size is None:
            problems.append('play/wildbond/index.html needs exactly one "index.pck" byte count.')
        elif size != len(pck):
            problems.append(
                f'The shell says the pack is {size} bytes, and index.pck is {len(pck)} bytes. '
                "Update that one count so the page can load the pack."
            )

    recorded = manifest.get("sha256")
    if not isinstance(recorded, dict):
        problems.append(
            "play/wildbond/build.json needs a sha256 object for index.html, index.js, index.pck and index.wasm."
        )
        recorded = {}
    for name in HASHED_NAMES:
        data = files.get(name)
        if data is None:
            problems.append(f"play/wildbond/{name} is missing at this commit.")
            continue
        actual = hashlib.sha256(data).hexdigest()
        expected = recorded.get(name)
        if expected != actual:
            problems.append(
                f"build.json records sha256 {expected} for {name}, and the file at this commit is {actual}."
            )

    tree = manifest.get("source_tree")
    if not isinstance(tree, str) or not TREE_RE.fullmatch(tree):
        problems.append(
            "build.json source_tree must be the 40-character id from `git rev-parse <commit>:wildbond-godot`."
        )
    if not isinstance(head_tree, str) or not TREE_RE.fullmatch(head_tree):
        problems.append(f"The wildbond-godot tree of this commit is not a 40-character id ({head_tree!r}).")

    packed = sorted(path for path in changed if is_packed_source(path))
    exported = [path for path in EXPORT_PATHS if path in changed]
    tree_mismatch = tree != head_tree
    if packed:
        missing = [path for path in EXPORT_PATHS if path not in changed]
        shown = ", ".join(packed[:12])
        if len(packed) > 12:
            shown += f", and {len(packed) - 12} more"
        if missing:
            problems.append(
                "The packed Wildbond game changed and the web export was left stale. "
                f"Update {', '.join(missing)} in this same pull request. Packed files include {shown}."
            )
        if tree_mismatch:
            problems.append(
                f"build.json source_tree is {tree}, and this commit's wildbond-godot tree is {head_tree}. "
                "Stamp source_tree from the commit that contains the new pack."
            )
    elif exported and tree_mismatch:
        problems.append(
            f"play/wildbond/ changed, and build.json source_tree is {tree} instead of this commit's "
            f"wildbond-godot tree {head_tree}."
        )
    return problems


def git_text(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True).strip()


def git_bytes(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT)


def changed_paths(base, head):
    """Paths changed on head since the merge base, or a direct tree diff if ancestry is absent."""
    merge_base = None
    try:
        merge_base = git_text("merge-base", base, head)
    except subprocess.CalledProcessError:
        merge_base = None
    if merge_base:
        diff = git_text("diff", "--name-status", "-M", merge_base, head)
        label = f"{merge_base}..{head}"
    else:
        diff = git_text("diff", "--name-status", "-M", base, head)
        label = f"{base}..{head} (direct tree diff; ancestry was not available)"
    return parse_name_status(diff), label


def load_head(head):
    files = {}
    for name in HASHED_NAMES:
        files[name] = git_bytes("show", f"{head}:play/wildbond/{name}")
    raw = git_bytes("show", f"{head}:play/wildbond/build.json")
    manifest = json.loads(raw)
    tree = git_text("rev-parse", f"{head}:wildbond-godot")
    return files, manifest, tree


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", required=True, help="Base commit, usually the pull request base SHA")
    parser.add_argument("--head", required=True, help="Commit under review")
    args = parser.parse_args(argv)
    try:
        git_text("cat-file", "-e", f"{args.base}^{{commit}}")
        git_text("cat-file", "-e", f"{args.head}^{{commit}}")
        changed, label = changed_paths(args.base, args.head)
        files, manifest, tree = load_head(args.head)
        source_commit = manifest.get("source_commit") if isinstance(manifest, dict) else None
        source_commit_tree = None
        if isinstance(source_commit, str) and TREE_RE.fullmatch(source_commit):
            source_commit_tree = git_text("rev-parse", f"{source_commit}:wildbond-godot")
    except subprocess.CalledProcessError as error:
        print("Could not read the two commits. Fetch both, then run this again.", file=sys.stderr)
        print(error, file=sys.stderr)
        return 2
    except json.JSONDecodeError as error:
        print(f"play/wildbond/build.json at {args.head} is not valid JSON ({error}).", file=sys.stderr)
        print(REFRESH_HELP)
        return 1
    problems = collect_problems(changed, tree, manifest, files)
    problems.extend(engine_problems(files))
    problems.extend(source_record_problems(manifest, source_commit_tree))
    if problems:
        print(f"Wildbond export freshness failed for {label}.")
        for problem in problems:
            print(f"- {problem}")
        print()
        print(REFRESH_HELP)
        return 1
    packed = sorted(path for path in changed if is_packed_source(path))
    exported = [path for path in EXPORT_PATHS if path in changed]
    print(f"Wildbond export freshness passed for {label}.")
    if packed:
        print(f"The packed game changed in {len(packed)} file(s), and play/wildbond/ was exported to match.")
        print(f"source_tree {tree} matches {args.head}:wildbond-godot.")
    elif exported:
        print("play/wildbond/ was exported again. The packed game files were already this tree.")
        print(f"source_tree {tree} matches {args.head}:wildbond-godot.")
    else:
        print("No packed Wildbond game files changed, so the existing web pack can stay.")
    size = len(files["index.pck"])
    print(
        f"index.pck is {size} bytes. That size, the pack hash, and source_commit "
        f"{manifest.get('source_commit')} agree, and the engine files are unchanged."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
