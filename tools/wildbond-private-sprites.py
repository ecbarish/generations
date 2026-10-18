#!/usr/bin/env python3
"""Build/check a small external sprite pack. Never writes copyrighted bytes into Git."""
import argparse, hashlib, json, os, pathlib, struct, sys, urllib.request
import xml.etree.ElementTree as ET
from PIL import Image

REPO = pathlib.Path(__file__).resolve().parents[1]
REVISIONS = {"PokeAPI/sprites": "289e842364648ec0495ae4ba12f48d5cbfbf670b",
             "PMDCollab/SpriteCollab": "aae7a436af894efab3ff24915f0b645bb4907750",
             "pret/pokeemerald": "731ad5bfd6e6f265508d0efcca0ba42f9dcf5881"}
PILOT = [(16, "Pidgey"), (37, "Vulpix"), (194, "Wooper")]
NPC_ROLES = {"caretaker": "mom.png", "rival": "may/walking.png", "child": "little_boy.png",
             "forager": "hiker.png", "healer": "nurse.png", "shopkeeper": "mart_employee.png"}
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

def world_atlas(root):
    """Decode the original indexed GBA tiles/metatiles, not a creative repaint."""
    folder = root / "world/general"
    with Image.open(folder / "tiles.png") as source:
        if source.mode != "P" or source.size != (128, 256):
            raise ValueError("Unexpected world tile source")
        indices = source.copy()
    palettes = []
    for i in range(6):
        lines = (folder / f"{i:02d}.pal").read_text().splitlines()
        if lines[:3] != ["JASC-PAL", "0100", "16"]:
            raise ValueError("Unexpected world palette")
        palettes.append([tuple(map(int, line.split())) for line in lines[3:19]])
    data = (folder / "metatiles.bin").read_bytes()
    if len(data) != 8192: raise ValueError("Unexpected world metatile count")
    words = struct.unpack("<4096H", data)
    atlas = Image.new("RGBA", (256, 512))
    for block in range(512):
        for layer in range(2):
            for tile in range(4):
                value = words[block * 8 + layer * 4 + tile]
                number, palette = value & 1023, value >> 12
                if number >= 512 or palette >= 6: raise ValueError("World tile outside source")
                for y in range(8):
                    for x in range(8):
                        sx = 7 - x if value & 1024 else x
                        sy = 7 - y if value & 2048 else y
                        index = indices.getpixel(((number % 16) * 8 + sx, (number // 16) * 8 + sy))
                        if index == 0: continue
                        at = ((block % 16) * 16 + (tile % 2) * 8 + x,
                              (block // 16) * 16 + (tile // 2) * 8 + y)
                        atlas.putpixel(at, palettes[palette][index] + (255,))
    return atlas

def world_tree(atlas):
    tree = Image.new("RGBA", (32, 32))
    # Source metatiles 30/31 form the canopy; 38/39 form the lower tree.
    tree.paste(atlas.crop((224, 16, 256, 32)), (0, 0))
    tree.paste(atlas.crop((96, 32, 128, 48)), (0, 16))
    grass = {atlas.getpixel((x, y)) for y in range(16) for x in range(16, 32)}
    for y in range(32):
        for x in range(32):
            if tree.getpixel((x, y)) in grass: tree.putpixel((x, y), (0, 0, 0, 0))
    return tree

def npc_info(path, rel, role):
    # Parse the source's indexed editor background without rewriting its PNG.
    with Image.open(path) as source:
        image = source.convert("RGBA")
        w, h = image.size
        count = 4 if role == "healer" else 9
        if w != count * 16 or h != (16 if role == "child" else 32):
            raise ValueError("Unexpected NPC source grid: " + role)
        key = image.getpixel((0, 0))
        anchors = []
        bounds = []
        for frame in range(count):
            pixels = [(x, y) for y in range(h) for x in range(16)
                      if image.getpixel((frame * 16 + x, y)) != key]
            if not pixels:
                raise ValueError("Empty NPC frame: " + role)
            ink = [min(x for x, _ in pixels), min(y for _, y in pixels),
                   max(x for x, _ in pixels) + 1, max(y for _, y in pixels) + 1]
            bounds.append(ink)
            anchors.append([8, ink[3]])
    return {"file": rel, "frame_size": [16, h], "source_frames": count,
            "frame_map": [0, 1, 2, 0, 0, 1, 1, 2, 2] if role == "healer" else list(range(9)),
            "anchors": anchors, "ink": bounds, "walks": role != "healer",
            "bow_frame": 3 if role == "healer" else None,
            "pixel_size": 0.063}


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
    for name, rel in manifest.get("trainer", {}).items():
        with Image.open(safe(root, rel)) as image:
            if image.size != (144, 32):
                raise ValueError("Invalid trainer sheet: " + name)
    for role, meta in manifest.get("npcs", {}).items():
        if role not in NPC_ROLES or npc_info(safe(root, meta["file"]), meta["file"], role) != meta:
            raise ValueError("Invalid NPC geometry: " + role)
    if manifest.get("world"):
        with Image.open(safe(root, manifest["world"]["atlas"])) as decoded:
            if decoded.size != (256, 512) or decoded.tobytes() != world_atlas(root).tobytes():
                raise ValueError("World atlas differs from its pinned source decoding")
            with Image.open(safe(root, manifest["world"]["tree"])) as tree:
                if tree.tobytes() != world_tree(decoded).tobytes(): raise ValueError("World tree differs from source assembly")
    print(f"PASS: 3 species, {len(manifest['files'])} verified files, 6 battle views, 6 eight-direction animations; {len(manifest.get('npcs', {}))} NPC roles.")
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
    trainer = {}
    for state in ("walking", "running"):
        rel = f"trainer/brendan-{state}.png"
        files.append(download(root, "pret/pokeemerald", f"graphics/object_events/pics/people/brendan/{state}.png", rel))
        trainer[state] = rel
    files.append(download(root, "pret/pokeemerald", "src/data/object_events/object_event_anims.h", "trainer/source-animation-layout.h"))
    npcs = {}
    for role, source in NPC_ROLES.items():
        rel = f"npcs/{role}.png"
        files.append(download(root, "pret/pokeemerald", "graphics/object_events/pics/people/" + source, rel))
        npcs[role] = npc_info(root / rel, rel, role)
    for source in ["object_event_pic_tables.h", "object_event_graphics_info.h"]:
        files.append(download(root, "pret/pokeemerald", "src/data/object_events/" + source, "npcs/" + source))
    items = {}
    for name in ("oran-berry", "poke-ball"):
        rel = f"items/{name}.png"
        files.append(download(root, "PokeAPI/sprites", f"sprites/items/{name}.png", rel))
        items[name] = rel
    for source in ["tiles.png", "metatiles.bin"] + [f"palettes/{i:02d}.pal" for i in range(6)]:
        files.append(download(root, "pret/pokeemerald", "data/tilesets/primary/general/" + source,
                              "world/general/" + source.split("/")[-1]))
    files.append(download(root, "pret/pokeemerald", "include/constants/metatile_labels.h", "world/metatile_labels.h"))
    rel = "world/general/decoded-metatiles.png"
    world_atlas(root).save(root / rel)
    files.append({"file": rel, "sha256": digest(root / rel), "bytes": (root / rel).stat().st_size,
                  "derived": "Exact indexed-tile/palette/metatile decoding; importer version 1"})
    tree_rel = "world/general/tree.png"
    world_tree(world_atlas(root)).save(root / tree_rel)
    files.append({"file": tree_rel, "sha256": digest(root / tree_rel), "bytes": (root / tree_rel).stat().st_size,
                  "derived": "Source metatiles 30/31/38/39; background grass colours made transparent for upright prop"})
    result = {"schema": 1, "private": True, "scope": "native private chapter; not a public asset distribution",
        "revisions": REVISIONS, "files": files, "species": entries, "trainer": trainer, "items": items, "npcs": npcs,
        "world": {"atlas": rel, "tree": tree_rel, "metatiles": 512, "tile_size": 16},
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
        "Emerald Brendan walking/running: original Game Freak / Nintendo / Creatures artwork, preserved via pret/pokeemerald.\n"
        "Emerald NPC appearances: Mom, May, Little Boy, Hiker, Nurse and Mart Employee. Original owner rights retained.\n"
        "NPC roles are visual aliases for Wildbond people; original source frames/layouts are recorded in manifest.json and npcs/.\n"
        "Trainer source animation layout/revision/hash: trainer/source-animation-layout.h and manifest.json.\n"
        "Oran Berry/Poke Ball icons: PokeAPI/sprites. Ranch Berry/Bond Ball are study visual aliases, not canonical item mechanics.\n"
        "World tiles: original Emerald artwork via pret/pokeemerald, exact source palettes/layout preserved. World layout: Wildbond prototype.\n"
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
