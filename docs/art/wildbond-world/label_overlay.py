#!/usr/bin/env python3
"""Stamp accurate region and place labels onto the generated illustrated overworld map.

The names and positions come from world_data.py (the same data as the schematic), so the text always matches the docs.
Positions are schematic coordinates in the map area (x 0-1460, y 0-1080 of the 1920x1080 schematic) and are scaled to the
image. The generated art will not land things in exactly the same spots, so after looking at the picture you can nudge any
label with an offsets file:

    {"reedhold": [12, -20], "region:stillreed": {"at": [740, 470]}, "hide": ["spire"]}

A pair is a nudge in output pixels; {"at": [x, y]} pins the label at that spot in the picture. "region:<id>" is a
region name; "hide" lists labels to leave out. Keys starting with "_" are comments.

Usage:
    python3 label_overlay.py gen/overworld-map.png -o gen/overworld-map-labelled.png [--offsets offsets.json]
    python3 label_overlay.py --test-card -o gen/label-test-card.png      # labels on a plain card, for checking
"""
import argparse, json, os, sys
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import world_data as W

MAP_W, MAP_H = 1460, 1080          # schematic map area the positions refer to
INK, PAPER, LAMP = (30, 26, 34), (244, 237, 220), (242, 208, 128)
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
FONT_IT = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"   # no italic face on the box

def font(path, size):
    try: return ImageFont.truetype(path, size)
    except OSError: return ImageFont.load_default()

def labels():
    """Every label to stamp: (key, text, x, y, style)."""
    out = []
    for r in W.REGIONS + W.ZONES:
        cx, cy = W.REGION_LABEL.get(r["id"], W.centroid(r["poly"]))
        out.append(("region:" + r["id"], r["name"].replace(" (home)", "").upper(), cx, cy, "region"))
    for p in W.P.values():
        if p["kind"] == "waypoint" or not p["name"]: continue
        style = {"town": "town", "cave": "cave", "site": "site"}.get(p["kind"], "place")
        out.append((p["id"], p["name"], p["x"], p["y"] + 26, style))
    for lid, text, x, y in [("greywash", "Greywash Sound", 600, 140), ("opengrey", "The Open Grey", 1060, 165),
                            ("quietchannels", "The Quiet Channels", 930, 650)]:
        out.append((lid, text, x, y, "water"))
    return out

STYLE = {  # font, size at 1920 wide, fill, outline width
    "region": (FONT_BOLD, 22, LAMP, 4), "town": (FONT_BOLD, 22, PAPER, 4), "cave": (FONT, 18, PAPER, 3),
    "site": (FONT_IT, 19, LAMP, 3), "place": (FONT, 17, PAPER, 3), "water": (FONT_IT, 19, (140, 192, 212), 3),
}

def stamp(img, offsets=None):
    offsets = offsets or {}
    hide = set(offsets.get("hide", []))
    W_, H_ = img.size
    sx, sy = W_ / MAP_W, H_ / MAP_H
    k = W_ / 1920
    d = ImageDraw.Draw(img)
    placed, boxes = [], []
    for key, text, x, y, style in labels():
        if key in hide or key.startswith("_"): continue
        fpath, size, fill, ow = STYLE[style]
        f = font(fpath, max(10, round(size * k * 1.31)))   # map area is 1460 of 1920, so scale text to the image
        off = offsets.get(key, (0, 0))
        if isinstance(off, dict) and "at" in off:        # an absolute spot on this picture
            px, py = off["at"]
        else:
            px, py = x * sx + off[0], y * sy + off[1]
        tw = d.textlength(text, font=f)
        px = min(max(px, tw / 2 + 6), W_ - tw / 2 - 6)          # keep every label fully inside the picture
        py = min(max(py, size * k + 6), H_ - size * k - 6)
        hgt = size * k * 1.31 + 4
        for _ in range(8):                                        # nudge down until it clears earlier labels
            box = (px - tw / 2 - 3, py - hgt / 2, px + tw / 2 + 3, py + hgt / 2)
            hit = [b for b in boxes if not (box[2] < b[0] or box[0] > b[2] or box[3] < b[1] or box[1] > b[3])]
            if not hit: break
            py = max(b[3] for b in hit) + hgt / 2 + 1
        boxes.append(box)
        d.text((px, py), text, font=f, fill=fill, anchor="mm", stroke_width=max(1, round(ow * k * 1.31)), stroke_fill=INK)
        placed.append((key, text, round(px), round(py)))
    return placed

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("image", nargs="?")
    ap.add_argument("-o", "--out", required=True)
    ap.add_argument("--offsets")
    ap.add_argument("--test-card", action="store_true")
    ap.add_argument("--list", action="store_true", help="print every label and where it landed")
    a = ap.parse_args()
    if a.test_card:
        img = Image.new("RGB", (1280, 720), (20, 24, 32))
    elif a.image:
        img = Image.open(a.image).convert("RGB")
    else:
        ap.error("give an image or --test-card")
    offs = json.load(open(a.offsets)) if a.offsets else {}
    placed = stamp(img, offs)
    img.save(a.out)
    if a.list:
        for p in placed: print(*p, sep="\t")
    print(f"stamped {len(placed)} labels onto {a.out} ({img.size[0]}x{img.size[1]})")

if __name__ == "__main__":
    main()
