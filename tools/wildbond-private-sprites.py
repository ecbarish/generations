#!/usr/bin/env python3
"""Build/check a small external sprite pack. Never writes copyrighted bytes into Git."""
import argparse, hashlib, json, os, pathlib, sys, urllib.request
import xml.etree.ElementTree as ET
from PIL import Image

REPO = pathlib.Path(__file__).resolve().parents[1]
REVISIONS = {"PokeAPI/sprites": "289e842364648ec0495ae4ba12f48d5cbfbf670b",
             "PMDCollab/SpriteCollab": "aae7a436af894efab3ff24915f0b645bb4907750"}
PILOT = [(16, "Pidgey"), (37, "Vulpix"), (194, "Wooper")]
CACHE = {}
DEFAULT = pathlib.Path(os.environ.get("LOCALAPPDATA", pathlib.Path.home())) / "Wildbond" / "private-sprites" / "v1"

def digest(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def safe(root, rel):
    p = (root / rel).resolve()
    if not p.is_relative_to(root) or p == root:
        raise ValueError("Path outside private pack")
    return p

def download(root, repo, source, rel):
    p = safe(root, rel)
    url = f"https://raw.githubusercontent.com/{repo}/{REVISIONS[repo]}/{source}"
    cached = CACHE.get(rel, {})
    if not p.exists() or cached.get("url") != url or cached.get("sha256") != digest(p):
        p.parent.mkdir(parents=True, exist_ok=True)
        req = urllib.request.Request(url, headers={"User-Agent": "Wildbond-private-prototype"})
        with urllib.request.urlopen(req, timeout=30) as response:
            data = response.read(8 * 1024 * 1024 + 1)
        if len(data) > 8 * 1024 * 1024:
            raise ValueError("Asset exceeds pilot size limit")
        p.write_bytes(data)
    return {"file": rel, "sha256": digest(p), "bytes": p.stat().st_size,
            "url": url, "repository": repo, "revision": REVISIONS[repo]}

def image_info(p):
    with Image.open(p) as raw:
        image = raw.convert("RGBA")
        if image.width > 4096 or image.height > 4096:
            raise ValueError("Unexpected image dimensions")
        ink = image.getbbox()
        if not ink:
            raise ValueError("Empty sprite")
        return {"width": image.width, "height": image.height, "ink": list(ink)}

def animation(root, species_dir, name):
    xml = ET.parse(root / species_dir / "AnimData.xml")
    anim = next(a for a in xml.findall("./Anims/Anim") if a.findtext("Name") == name)
    w, h = int(anim.findtext("FrameWidth")), int(anim.findtext("FrameHeight"))
    durations = [int(d.text) / 60.0 for d in anim.findall("./Durations/Duration")]
    rel = f"{species_dir}/{name}-Anim.png"
    shadow = root / species_dir / f"{name}-Shadow.png"
    with Image.open(root / rel) as image, Image.open(shadow) as marker:
        if image.size != marker.size or image.width != w * len(durations) or image.height != h * 8:
            raise ValueError(f"Unexpected {name} frame grid")
        pixels = marker.convert("RGBA")
        anchors = []
        for row in range(8):
            frame_anchors = []
            for frame in range(len(durations)):
                # PMD shadow sheets use a white marker for the frame's ground anchor.
                marks = [(x, y) for y in range(h) for x in range(w)
                         if pixels.getpixel((frame * w + x, row * h + y)) == (255, 255, 255, 255)]
                if len(marks) != 1:
                    raise ValueError(f"Expected one shadow anchor: {species_dir}/{name}/{row}/{frame}")
                frame_anchors.append(list(marks[0]))
            anchors.append(frame_anchors)
    return {"file": rel, "frame_size": [w, h], "directions": 8,
            "direction_order": ["down", "down_right", "right", "up_right", "up", "up_left", "left", "down_left"],
            "durations": durations, "anchors": anchors}

def check(root):
    manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
    if manifest.get("schema") != 1 or len(manifest.get("species", {})) != 3:
        raise ValueError("Wrong pilot schema/roster")
    for item in manifest["files"]:
        p = safe(root, item["file"])
        if not p.is_file() or digest(p) != item["sha256"]:
            raise ValueError("Missing/changed asset: " + item["file"])
    for sid, entry in manifest["species"].items():
        if sid not in ("pokemon:16", "pokemon:37", "pokemon:194"):
            raise ValueError("Unexpected species ID")
        for facing in ("front", "back"):
            p = safe(root, entry["battle"][facing]["file"])
            if image_info(p) != entry["battle"][facing]["image"]:
                raise ValueError("Invalid battle image metadata")
        for name, anim in entry["animations"].items():
            if animation(root, entry["directory"], name) != anim:
                raise ValueError("Invalid animation/anchor metadata")
    print(f"PASS: 3 species, {len(manifest['files'])} pinned files, 6 battle views, 6 eight-direction animations.")
    return manifest

def build(root):
    global CACHE
    previous = root / "manifest.json"
    if previous.is_file():
        try:
            CACHE = {item["file"]: item for item in json.loads(previous.read_text(encoding="utf-8"))["files"]}
        except (ValueError, KeyError, TypeError):
            CACHE = {}
    files, entries = [], {}
    for number, name in PILOT:
        folder = f"pokemon/{number}"
        battle = {}
        for facing in ("front", "back"):
            source = f"sprites/pokemon/versions/generation-iv/platinum/{'back/' if facing == 'back' else ''}{number}.png"
            rel = f"{folder}/battle-{facing}.png"
            files.append(download(root, "PokeAPI/sprites", source, rel))
            battle[facing] = {"file": rel, "image": image_info(root / rel)}
        for file in ("AnimData.xml", "credits.txt", "Idle-Anim.png", "Idle-Shadow.png", "Walk-Anim.png", "Walk-Shadow.png"):
            files.append(download(root, "PMDCollab/SpriteCollab", f"sprite/{number:04d}/{file}", f"{folder}/{file}"))
        entries[f"pokemon:{number}"] = {"name": name, "source_id": number, "directory": folder,
            "battle": battle, "animations": {a: animation(root, folder, a) for a in ("Idle", "Walk")},
            "credits_file": f"{folder}/credits.txt", "display_height_m": {16: 0.5, 37: 0.65, 194: 0.55}[number]}
    for repo, file in (("PokeAPI/sprites", "LICENCE.txt"), ("PMDCollab/SpriteCollab", "LICENSE.md")):
        files.append(download(root, repo, file, "notices/" + repo.split("/")[0] + ".txt"))
    result = {"schema": 1, "private": True, "scope": "native save-free prototype; not a public asset distribution",
        "revisions": REVISIONS, "files": files, "species": entries,
        "rights": "Pokemon artwork retains its owners' rights; SpriteCollab credits/terms preserved per source. Private use is not a new license."}
    # Publish the manifest only once every required source and geometry is present.
    staging = root / "manifest.pending.json"
    staging.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    staging.replace(root / "manifest.json")
    check(root)
    (root / "CREDITS.txt").write_text(
        "Wildbond optional private pilot\nPokemon artwork: The Pokemon Company / Nintendo / Game Freak / Creatures; "
        "PMD original sprites: Spike Chunsoft.\nCommunity contributions: see each pokemon/<id>/credits.txt.\n"
        "PokeAPI and PMDCollab source URLs/revisions/hashes: manifest.json.\nOriginal license notices: notices/.\n"
        "No permission for public redistribution is implied by this prototype.\n", encoding="utf-8")

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=pathlib.Path, default=DEFAULT)
    parser.add_argument("--check", action="store_true", help="Offline hash/metadata verification; no downloads")
    args = parser.parse_args()
    root = args.root.expanduser().resolve()
    if root == REPO or root.is_relative_to(REPO):
        parser.error("Private source assets must be outside this Git checkout.")
    if args.check:
        check(root)
    else:
        root.mkdir(parents=True, exist_ok=True)
        root = root.resolve() # Windows packaged-app file virtualization can change the effective root.
        build(root)
        locator = REPO / "wildbond-godot/tests/private_sprites/local-pack.json"
        locator.parent.mkdir(parents=True, exist_ok=True)
        locator.write_text(json.dumps({"root": str(root)}) + "\n", encoding="utf-8")
    print("Private pack:", root)
if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError, KeyError, ET.ParseError, StopIteration) as error:
        sys.exit("Private sprite setup failed: " + str(error))
