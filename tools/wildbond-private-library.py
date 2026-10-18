#!/usr/bin/env python3
"""Resumable external Pokemon art library; does not modify active packs or saves."""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import importlib.util
import html
import json
from pathlib import Path
import shutil
import time
import urllib.error
import urllib.request

spec = importlib.util.spec_from_file_location("pilot", Path(__file__).with_name("wildbond-private-sprites.py"))
pilot = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pilot)
DEFAULT = pilot.DEFAULT.parent / "library-v1"
MAX_ID = 1025


def outside_checkout(root):
    root = Path(root).expanduser().resolve()
    # Refuse every Git checkout, not only this tool's checkout.
    if any((p / ".git").exists() for p in (root, *root.parents)):
        raise ValueError("Private artwork must be outside every Git checkout")
    return root


def atomic_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".pending")
    temp.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")
    temp.replace(path)


def fetch(root, repo, source, rel):
    """Immutable source bytes plus a per-file receipt allow interrupted builds to resume."""
    path = pilot.safe(root, rel)
    receipt = path.with_suffix(path.suffix + ".receipt.json")
    url = f"https://raw.githubusercontent.com/{repo}/{pilot.REVISIONS[repo]}/{source}"
    if path.is_file() and receipt.is_file():
        try:
            old = json.loads(receipt.read_text(encoding="utf-8"))
            if old.get("url") == url and old.get("sha256") == pilot.digest(path):
                return old
        except (ValueError, OSError):
            pass
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Wildbond-private-library"})
            with urllib.request.urlopen(req, timeout=30) as response:
                data = response.read(32 * 1024 * 1024 + 1)
            if len(data) > 32 * 1024 * 1024:
                raise ValueError("Source exceeds library file limit")
            path.parent.mkdir(parents=True, exist_ok=True)
            pending = path.with_suffix(path.suffix + ".pending")
            pending.write_bytes(data)
            pending.replace(path)
            result = {"file": rel, "sha256": pilot.digest(path), "bytes": len(data),
                      "url": url, "repository": repo, "revision": pilot.REVISIONS[repo]}
            atomic_json(receipt, result)
            return result
        except urllib.error.HTTPError as error:
            if error.code == 404:
                return None
            if error.code < 500 and error.code != 429:
                raise
            if attempt == 2:
                raise
        except (TimeoutError, urllib.error.URLError):
            if attempt == 2:
                raise
        time.sleep(attempt + 1)


def battle_sources(number):
    # A species generation is not an art style. Later default community sprites
    # remain tagged separately; they do not silently become Platinum artwork.
    if number <= 493:
        yield "platinum", "sprites/pokemon/versions/generation-iv/platinum"
    if number <= 649:
        yield "black-white", "sprites/pokemon/versions/generation-v/black-white"
    yield "default", "sprites/pokemon"


def collect_species(root, number, tracker):
    info = tracker.get(f"{number:04d}", {})
    result = {"id": f"pokemon:{number}", "source_id": number,
              "name": info.get("name", f"Pokemon {number}"), "battle": {},
              "world": None, "files": [], "issues": []}
    try:
        # Download the preferred complete pair, retaining partial coverage honestly.
        for style, prefix in battle_sources(number):
            pair = {}
            for facing in ("front", "back"):
                source = f"{prefix}/{'back/' if facing == 'back' else ''}{number}.png"
                rel = f"pokemon/{number}/battle/{style}-{facing}.png"
                record = fetch(root, "PokeAPI/sprites", source, rel)
                if record:
                    result["files"].append(record)
                    pair[facing] = {"file": rel, "image": pilot.image_info(root / rel)}
            if pair:
                result["battle"][style] = pair
            if len(pair) == 2:
                result["preferred_style"] = style
                break
        # Tracker booleans indicate locked status, not file existence. Completion
        # and credit records decide whether to probe, then actual files decide.
        if info.get("sprite_credit", {}).get("primary") or info.get("sprite_complete", 0):
            folder = f"pokemon/{number}/world"
            complete = True
            for name in ("AnimData.xml", "credits.txt"):
                record = fetch(root, "PMDCollab/SpriteCollab", f"sprite/{number:04d}/{name}", f"{folder}/{name}")
                if record:
                    result["files"].append(record)
                else:
                    complete = False
                    result["issues"].append("Missing world file: " + name)
            if complete:
                actual = {pilot.animation_source(root, folder, state)[0] for state in ("Idle", "Walk")}
                for name in sorted(actual):
                    for suffix in ("Anim", "Shadow"):
                        filename = f"{name}-{suffix}.png"
                        record = fetch(root, "PMDCollab/SpriteCollab", f"sprite/{number:04d}/{filename}", f"{folder}/{filename}")
                        if record:
                            result["files"].append(record)
                        else:
                            complete = False
                            result["issues"].append("Missing world file: " + filename)
            if complete:
                try:
                    animations = {name: pilot.animation(root, folder, name) for name in ("Idle", "Walk")}
                    result["world"] = {"directory": folder, "animations": animations,
                                       "credits_file": f"{folder}/credits.txt",
                                       "tracker_credit": info.get("sprite_credit")}
                except (ValueError, OSError, StopIteration, pilot.ET.ParseError) as error:
                    result["issues"].append("World set needs adaptation: " + str(error))
        else:
            result["issues"].append("No credited base-form world set in pinned tracker")
    except (OSError, ValueError) as error:
        result["issues"].append("Intake error: " + str(error))
    result["ready_for_pack"] = bool(result.get("preferred_style") and result["world"])
    return result


def summary(entries):
    values = list(entries.values())
    return {"species_scanned": len(values),
            "battle_pairs": sum(bool(e.get("preferred_style")) for e in values),
            "directional_world_sets": sum(bool(e.get("world")) for e in values),
            "ready_for_pack": sum(bool(e.get("ready_for_pack")) for e in values),
            "files": sum(len(e["files"]) for e in values),
            "bytes": sum(f["bytes"] for e in values for f in e["files"]),
            "styles": {s: sum(e.get("preferred_style") == s for e in values)
                       for s in ("platinum", "black-white", "default")}}


def gallery(root, index):
    cards = []
    for entry in sorted(index["species"].values(), key=lambda e: e["source_id"]):
        style = entry.get("preferred_style")
        pair = entry["battle"].get(style, {})
        images = "".join(f'<img loading="lazy" alt="{facing}" src="{html.escape(view["file"])}">'
                         for facing, view in pair.items())
        ready = entry.get("ready_for_pack", False)
        label = "Battle + walking" if ready else "Battle only" if style else "Incomplete"
        cards.append(f'<article data-search="{html.escape(str(entry["source_id"]) + " " + entry["name"].lower())}" data-ready="{int(ready)}">'
                     f'<h2>#{entry["source_id"]} {html.escape(entry["name"])}</h2><div>{images}</div>'
                     f'<p>{label} · {html.escape(style or "No battle pair")}</p></article>')
    page = '''<!doctype html><html lang="en"><meta charset="utf-8"><title>Wildbond private sprite library</title>
<style>body{background:#152a28;color:#eef6dc;font:16px system-ui;margin:24px}header{position:sticky;top:0;background:#152a28;padding:12px 0}input{padding:10px}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(235px,1fr));gap:14px}article{background:#243d38;border-radius:12px;padding:14px}h2{font-size:18px}img{width:96px;height:96px;object-fit:contain;image-rendering:pixelated;background:#b6c5a2;margin:4px}article[hidden]{display:none}</style>
<header><h1>Wildbond private sprite library</h1><p>Art availability only. These species are not all playable encounters. Credits and pinned sources: library.json, notices/ and each world/credits.txt.</p>
<input id="search" placeholder="Search name or Dex number" aria-label="Search species"> <label><input id="ready" type="checkbox"> Battle + walking only</label> <span id="count"></span></header><main>'''
    page += "".join(cards) + '''</main><script>const cards=[...document.querySelectorAll('article')],search=document.querySelector('#search'),ready=document.querySelector('#ready');function filter(){let n=0;for(const c of cards){c.hidden=!c.dataset.search.includes(search.value.toLowerCase().trim())||(ready.checked&&c.dataset.ready!=='1');if(!c.hidden)n++;}document.querySelector('#count').textContent=n+' species';}search.addEventListener('input',filter);ready.addEventListener('change',filter);filter();</script></html>'''
    (root / "index.html").write_text(page, encoding="utf-8")


def build(root, ids, workers):
    if (root / "manifest.json").exists():
        raise ValueError("Choose a separate library root, not an existing runtime pack")
    index_path = root / "library.json"
    old = None
    if index_path.exists():
        old = json.loads(index_path.read_text(encoding="utf-8"))
        if old.get("schema") != 1 or old.get("revisions") != pilot.REVISIONS:
            raise ValueError("Existing library uses other revisions; choose a new root")
    root.mkdir(parents=True, exist_ok=True)
    tracker_record = fetch(root, "PMDCollab/SpriteCollab", "tracker.json", "sources/tracker.json")
    if not tracker_record:
        raise ValueError("Pinned tracker unavailable")
    tracker = json.loads((root / tracker_record["file"]).read_text(encoding="utf-8"))
    notices = [tracker_record]
    for repo, name in (("PokeAPI/sprites", "LICENCE.txt"), ("PMDCollab/SpriteCollab", "LICENSE.md")):
        item = fetch(root, repo, name, f"notices/{repo.split('/')[0]}.txt")
        if not item:
            raise ValueError("Source notice unavailable")
        notices.append(item)
    index = {"schema": 1, "private": True, "revisions": pilot.REVISIONS,
             "sources": notices, "species": {}, "scope": "External art inventory, not a combat or encounter catalogue"}
    if old is not None:
        index["species"] = old["species"]
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(collect_species, root, n, tracker): n for n in ids}
        for count, future in enumerate(as_completed(futures), 1):
            entry = future.result()
            index["species"][entry["id"]] = entry
            # Checkpoint every species; interruption cannot destroy previous receipt/index.
            atomic_json(index_path, index)
            if count % 25 == 0 or count == len(ids):
                print(f"Scanned {count}/{len(ids)}: {json.dumps(summary(index['species']))}", flush=True)
    index["summary"] = summary(index["species"])
    atomic_json(index_path, index)
    gallery(root, index)
    (root / "CREDITS.txt").write_text(
        "Optional private Wildbond art library. Pokemon owner rights retained.\n"
        "Per-file URLs, revisions and SHA-256 hashes: library.json and receipts.\n"
        "World sprite artists: pokemon/<id>/world/credits.txt and tracker_credit.\n"
        "Original source terms: notices/. No public redistribution permission implied.\n", encoding="utf-8")
    return index


def check(root):
    index = json.loads((root / "library.json").read_text(encoding="utf-8"))
    if index.get("schema") != 1 or index.get("revisions") != pilot.REVISIONS:
        raise ValueError("Unsupported library schema/revisions")
    for record in index["sources"] + [f for e in index["species"].values() for f in e["files"]]:
        path = pilot.safe(root, record["file"])
        if not path.is_file() or pilot.digest(path) != record["sha256"] or path.stat().st_size != record["bytes"]:
            raise ValueError("Missing/changed library source: " + record["file"])
    for sid, entry in index["species"].items():
        if sid != f"pokemon:{entry['source_id']}" or not 1 <= entry["source_id"] <= MAX_ID:
            raise ValueError("Invalid library species identity")
        verified = {f["file"] for f in entry["files"]}
        for pair in entry["battle"].values():
            for view in pair.values():
                if view["file"] not in verified:
                    raise ValueError("Unverified battle reference")
                if pilot.image_info(pilot.safe(root, view["file"])) != view["image"]:
                    raise ValueError("Battle metadata mismatch")
        preferred = entry.get("preferred_style")
        if preferred and set(entry["battle"].get(preferred, {})) != {"front", "back"}:
            raise ValueError("Preferred style lacks a complete pair")
        world = entry.get("world")
        if world:
            if set(world["animations"]) != {"Idle", "Walk"} or world["credits_file"] not in verified:
                raise ValueError("Incomplete credited world set")
            if f"{world['directory']}/AnimData.xml" not in verified:
                raise ValueError("Unverified animation source metadata")
            for name, anim in world["animations"].items():
                if anim["file"] not in verified or anim["file"].replace("-Anim.png", "-Shadow.png") not in verified:
                    raise ValueError("Unverified animation reference")
                if pilot.animation(root, world["directory"], name) != anim:
                    raise ValueError("Animation metadata mismatch")
        if entry["ready_for_pack"] != bool(entry.get("preferred_style") and world):
            raise ValueError("Incorrect coverage claim")
    print("PASS library: " + json.dumps(summary(index["species"])), flush=True)
    return index


def export_pack(root, ids, pilot_root, destination):
    """Select a small eager-loaded art pack; the bulk library stays off the hot path."""
    if len(ids) > 12:
        raise ValueError("Select at most 12 species per native pack (runtime file/memory budget)")
    destination = outside_checkout(destination)
    if destination.exists() or destination == root or destination == pilot_root:
        raise ValueError("Pack destination must be a new external folder")
    index = check(root)
    base = pilot.check(pilot_root)
    selected = []
    for n in ids:
        entry = index["species"].get(f"pokemon:{n}", {})
        if not entry.get("ready_for_pack"):
            raise ValueError(f"Species {n} lacks a verified battle/world pair")
        selected.append(entry)
    # Build in a sibling staging folder; never mutate the active pilot/locator.
    staging = destination.with_name(destination.name + ".pending")
    if staging.exists():
        raise ValueError("Staging folder already exists; choose another destination")
    staging.mkdir(parents=True)
    result = dict(base)
    result["files"] = [f for f in base["files"] if not f["file"].startswith("pokemon/")]
    result["species"] = {}
    for record in result["files"]:
        target = pilot.safe(staging, record["file"])
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(pilot.safe(pilot_root, record["file"]), target)
    for entry in selected:
        world = entry["world"]
        pair = entry["battle"][entry["preferred_style"]]
        used = {v["file"] for v in pair.values()} | {world["credits_file"]}
        for anim in world["animations"].values():
            used |= {anim["file"], anim["file"].replace("-Anim.png", "-Shadow.png")}
        used.add(f"{world['directory']}/AnimData.xml")
        for record in entry["files"]:
            if record["file"] in used:
                target = pilot.safe(staging, record["file"])
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(pilot.safe(root, record["file"]), target)
                result["files"].append(record)
        result["species"][entry["id"]] = {"name": entry["name"], "source_id": entry["source_id"],
            **world, "battle": pair, "display_height_m": {16: 0.5, 37: 0.65, 194: 0.55}.get(entry["source_id"], 0.65)}
    if len(result["files"]) > 128:
        raise ValueError("Selected pack exceeds runtime file budget")
    atomic_json(staging / "manifest.json", result)
    pilot.check(staging)
    shutil.copyfile(root / "CREDITS.txt", staging / "CREDITS.txt")
    staging.rename(destination)
    print("Selected art pack (not activated): " + str(destination))


def parse_ids(value):
    ids = set()
    for part in value.split(","):
        ends = part.split("-")
        if len(ends) > 2:
            raise ValueError("Invalid species range")
        lo, hi = int(ends[0]), int(ends[-1])
        if not 1 <= lo <= hi <= MAX_ID:
            raise ValueError(f"Species IDs must be between 1 and {MAX_ID}")
        ids.update(range(lo, hi + 1))
    return sorted(ids)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=DEFAULT)
    parser.add_argument("--ids", default=f"1-{MAX_ID}")
    parser.add_argument("--workers", type=int, choices=range(1, 9), default=6)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--export-pack", type=Path)
    parser.add_argument("--pilot-root", type=Path)
    args = parser.parse_args()
    root = outside_checkout(args.root)
    ids = parse_ids(args.ids)
    if args.export_pack:
        if not args.pilot_root:
            parser.error("--export-pack requires --pilot-root")
        export_pack(root, ids, outside_checkout(args.pilot_root), args.export_pack)
    elif args.check:
        check(root)
    else:
        index = build(root, ids, args.workers)
        print(json.dumps(index["summary"], indent=2))
    print("External library: " + str(root))


if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError, KeyError, pilot.ET.ParseError) as error:
        raise SystemExit("Private library failed: " + str(error))
