#!/usr/bin/env python3
"""Generate Saltmarsh Coast Chart art into /workspace/sm/coastchart/."""
from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

from PIL import Image

# Allow running as a script from _src/
sys.path.insert(0, str(Path(__file__).resolve().parent))

from palette import PALETTE, P, HEX, RGB, ROLES, EXISTING_UI, NEW_FOR_ART, STOPS, STATES, TOWERS
from draw import new, paste, draw_text, text_width, outline_rect, fill_rect
from icons import sheet_icons, icon_state, connectors, strip_bg, tileable_strip_center
from towers import draw_tower, tower_sheet
from boats import draw_bark, bark_sheet, person
from harbour import (
    sky_band, water_band, sand_band, draw_office, draw_shed,
    compose_harbour, composed_strip,
)

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
CHART = ASSETS / "coast-chart"
HARBOUR = ASSETS / "harbour"
PREVIEWS = ROOT / "previews"


def write_gpl(path, name="Saltmarsh Shipping Office"):
    lines = [
        "GIMP Palette",
        f"Name: {name}",
        "Columns: 6",
        "# House art rules: 1px #1e1a22 outline, #f2d080 lamplight, light from the upper left.",
        "# At most 32 colours per game. This file is the whole Saltmarsh set (18).",
    ]
    for k, rgba in PALETTE.items():
        r, g, b, _ = rgba
        lines.append(f"{r:3d} {g:3d} {b:3d}\t{HEX[k]} {k} — {ROLES[k]}")
    path.write_text("\n".join(lines) + "\n")


def pair(*ims):
    gap = 4
    w = sum(i.width for i in ims) + gap * (len(ims) - 1)
    h = max(i.height for i in ims)
    out = new(w, h)
    x = 0
    for i in ims:
        paste(out, i, x, h - i.height)
        x += i.width + gap
    return out


def labelled_block(title, img, pad=8, scale=2):
    show = img.resize((img.width * scale, img.height * scale), Image.NEAREST)
    tw = text_width(title)
    w = max(show.width + pad * 2, tw + pad * 2, 80)
    h = show.height + 16 + pad * 2
    card = Image.new("RGBA", (w, h), P["paper"])
    outline_rect(card, 0, 0, w - 1, h - 1, P["ink"])
    draw_text(card, pad, 4, title, P["ink"])
    paste(card, show, pad, 14)
    return card


def contact_sheet(parts):
    gap = 8
    cards = [labelled_block(t, im, scale=sc) for t, im, sc in parts]
    rows, row, row_w = [], [], 0
    max_w = 1600
    for card in cards:
        if row and row_w + gap + card.width > max_w:
            rows.append(row)
            row, row_w = [], 0
        row.append(card)
        row_w += card.width + (gap if len(row) > 1 else 0)
    if row:
        rows.append(row)
    widths = [sum(c.width for c in r) + gap * (len(r) - 1) for r in rows]
    heights = [max(c.height for c in r) for r in rows]
    W = max(widths + [320]) + 24
    title_h = 36
    H = title_h + sum(heights) + gap * (len(rows) + 1) + 8
    sheet = Image.new("RGBA", (W, H), P["paper"])
    draw_text(sheet, 12, 8, "SALTMARSH COAST CHART  ART", P["ink"])
    draw_text(sheet, 12, 18, "18 COLOURS  HOUSE INK AND LAMP  16 PX GRID", P["hull"])
    y = title_h
    for r, rh in zip(rows, heights):
        x = 12
        for c in r:
            paste(sheet, c, x, y)
            x += c.width + gap
        y += rh + gap
    outline_rect(sheet, 0, 0, W - 1, H - 1, P["ink"])
    return sheet


def bark_preview_frames():
    w, h = 384, 64
    frames = []
    path = list(range(16, 300, 8)) + list(range(300, 16, -8))
    for i, x in enumerate(path):
        frame = Image.new("RGBA", (w, h), P["sky"])
        paste(frame, sky_band(w, 20, False), 0, 0)
        paste(frame, water_band(w, 44, False), 0, 16)
        fill_rect(frame, 0, 48, 80, 63, P["sand"])
        fill_rect(frame, 20, 46, 140, 50, P["timber"])
        outline_rect(frame, 19, 45, 141, 51, P["ink"])
        leaving = i < len(path) // 2
        paste(frame, draw_bark(i % 4, "right" if leaving else "left"), x, 18)
        opaque = Image.new("RGBA", (w, h), P["sky"])
        paste(opaque, frame, 0, 0)
        frames.append(opaque.convert("P", palette=Image.ADAPTIVE, colors=32, dither=Image.NONE))
    return frames


def unique_colors(im):
    colors = Counter()
    for p in im.getdata():
        if p[3] == 0:
            continue
        colors[p[:3]] += 1
    return colors


def audit_image(path, colors_acc, issues):
    im = Image.open(path).convert("RGBA")
    alphas = {p[3] for p in im.getdata() if p[3] not in (0, 255)}
    if alphas:
        issues.append(f"{path.name}: non-binary alpha {sorted(alphas)[:8]}")
    used = unique_colors(im)
    for rgb, n in used.items():
        if rgb not in RGB:
            issues.append(f"{path.name}: off-palette {rgb} x{n}")
        colors_acc[rgb] += n
    return used, im.size


def main():
    for d in (CHART, HARBOUR, PREVIEWS, ASSETS):
        d.mkdir(parents=True, exist_ok=True)

    write_gpl(ROOT / "palette.gpl")
    write_gpl(ASSETS / "palette.gpl")

    stops24, coords24 = sheet_icons(24)
    stops32, coords32 = sheet_icons(32)
    stops24.save(CHART / "stops-24.png")
    stops32.save(CHART / "stops-32.png")
    for kind, _, _ in STOPS:
        for state in STATES:
            icon_state(kind, state).save(CHART / f"stop-{kind}-{state}.png")
    connectors().save(CHART / "connectors.png")

    for w, winter, name in (
        (320, False, "strip-bg-320.png"),
        (384, False, "strip-bg-384.png"),
        (960, False, "strip-bg-960.png"),
        (320, True, "strip-bg-320-year2.png"),
        (384, True, "strip-bg-384-year2.png"),
        (960, True, "strip-bg-960-year2.png"),
    ):
        strip_bg(w, winter=winter, height=32).save(CHART / name)
    tileable_strip_center(False).save(CHART / "strip-bg-tile-16.png")
    tileable_strip_center(True).save(CHART / "strip-bg-tile-16-year2.png")

    s320 = composed_strip(320, current="quay", done=("pier", "headland", "reed"))
    s320.save(PREVIEWS / "strip-mock-320.png")
    s960 = composed_strip(960, current="quay", done=("pier", "headland", "reed"))
    s960.save(PREVIEWS / "strip-mock-960.png")
    y2_progress = {
        "pier": "LIT", "headland": "LIT", "reed": "LIT", "quay": "LIT",
        "voyage": "HOME", "frost": "0/1", "glass": "RAISE",
    }
    s320y2 = composed_strip(320, current="frost", done=("pier", "headland", "reed", "quay", "voyage"), year=2, progress=y2_progress)
    s320y2.save(PREVIEWS / "strip-mock-320-year2.png")
    s960y2 = composed_strip(960, current="frost", done=("pier", "headland", "reed", "quay", "voyage"), year=2, progress=y2_progress)
    s960y2.save(PREVIEWS / "strip-mock-960-year2.png")

    t48, c48 = tower_sheet(short=False, snow=False)
    t32, c32 = tower_sheet(short=True, snow=False)
    t48s, c48s = tower_sheet(short=False, snow=True)
    t32s, _ = tower_sheet(short=True, snow=True)
    t48.save(HARBOUR / "towers-16x48.png")
    t32.save(HARBOUR / "towers-16x32.png")
    t48s.save(HARBOUR / "towers-16x48-year2.png")
    t32s.save(HARBOUR / "towers-16x32-year2.png")
    for kind in TOWERS:
        for lit in (False, True):
            draw_tower(kind, lit, short=False, snow=False).save(HARBOUR / f"tower-{kind}-{'lit' if lit else 'unlit'}.png")
            draw_tower(kind, lit, short=True, snow=False).save(HARBOUR / f"tower-{kind}-{'lit' if lit else 'unlit'}-short.png")
        draw_tower(kind, True, short=False, snow=True).save(HARBOUR / f"tower-{kind}-lit-year2.png")

    bark, bark_coords = bark_sheet()
    bark.save(HARBOUR / "bark-48x32.png")
    for facing, name in (("right", "leaving"), ("left", "home")):
        for f in range(4):
            draw_bark(f, facing).save(HARBOUR / f"bark-{name}-{f}.png")

    person().save(HARBOUR / "person-16x24.png")
    draw_office(False).save(HARBOUR / "office-48x32.png")
    draw_office(True).save(HARBOUR / "office-48x32-year2.png")
    draw_shed(False).save(HARBOUR / "shed-24x24.png")
    draw_shed(True).save(HARBOUR / "shed-24x24-year2.png")

    sky_band(384, 96, False).save(HARBOUR / "layer-sky-384.png")
    sky_band(384, 96, True).save(HARBOUR / "layer-sky-384-year2.png")
    water_band(384, 80, False).save(HARBOUR / "layer-water-384.png")
    water_band(384, 80, True).save(HARBOUR / "layer-water-384-year2.png")
    sand_band(384, 48, False).save(HARBOUR / "layer-sand-384.png")
    sand_band(384, 48, True).save(HARBOUR / "layer-sand-384-year2.png")

    scenes = (
        (384, 216, 1, ("pier", "headland"), "harbour-year1-384x216.png"),
        (384, 216, 2, ("pier", "headland", "reed", "quay"), "harbour-year2-384x216.png"),
        (320, 180, 1, ("pier", "headland"), "harbour-year1-320x180.png"),
        (320, 180, 2, ("pier", "headland", "reed", "quay"), "harbour-year2-320x180.png"),
        (960, 240, 1, ("pier", "headland", "reed"), "harbour-year1-960x240.png"),
        (960, 240, 2, ("pier", "headland", "reed", "quay", "glass"), "harbour-year2-960x240.png"),
    )
    for w, h, year, lit, name in scenes:
        compose_harbour(w, h, year=year, lit=lit, voyage="leaving" if year == 1 else "home").save(PREVIEWS / name)

    (CHART / "manifest.json").write_text(json.dumps({
        "cell_24": 24, "cell_32": 32,
        "stops": [s[0] for s in STOPS], "states": list(STATES),
        "sheets": {"stops-24.png": coords24, "stops-32.png": coords32},
        "connectors": {"cell": [16, 8], "locked": [0, 0], "current": [16, 0], "done": [32, 0], "dot": [48, 0]},
        "strip_height": 32, "caption_row": 16, "total_height_default": 48,
        "widths": [320, 384, 960],
    }, indent=2) + "\n")
    (HARBOUR / "manifest.json").write_text(json.dumps({
        "towers": list(TOWERS),
        "tower_standard": {"w": 16, "h": 48, "sheet": "towers-16x48.png", "frames": c48},
        "tower_short": {"w": 16, "h": 32, "sheet": "towers-16x32.png", "frames": c32},
        "tower_year2_standard": {"w": 16, "h": 48, "sheet": "towers-16x48-year2.png", "frames": c48s},
        "bark": {
            "w": 48, "h": 32, "frames": 4, "fps": 8,
            "sheet": "bark-48x32.png",
            "rows": {"leaving": "right / bow seaward", "home": "left / bow to the pier"},
            "coords": bark_coords, "stern_lamp": "aft, opposite the bow",
        },
        "js_hooks": {
            "tower_x_frac": {"pier": 0.42, "headland": 0.52, "reed": 0.62, "quay": 0.72, "glass": 0.85},
            "note": "Matches games/saltmarsh-shipping/harbour.js (lx = w * (0.42 + i * 0.1)). Glass is new.",
        },
    }, indent=2) + "\n")
    (ROOT / "palette.json").write_text(json.dumps({
        "count": len(PALETTE), "cap": 32,
        "colours": {k: {"hex": HEX[k], "rgba": list(v)} for k, v in PALETTE.items()},
        "existing_ui": EXISTING_UI, "new_for_final_art": NEW_FOR_ART,
        "not_used": {"#f3efe4": "CSS fallback only on --paper in style.css; not part of this palette."},
    }, indent=2) + "\n")

    parts = [
        ("STOPS 24  LOCKED CURRENT DONE", stops24, 3),
        ("STOPS 32  SAME ICONS PADDED", stops32, 2),
        ("TOWERS 16X48  UNLIT / LIT", t48, 3),
        ("TOWERS SHORT 16X32", t32, 3),
        ("TOWERS YEAR 2 SNOW", t48s, 3),
        ("BARK 48X32  LEAVING / HOME", bark, 2),
        ("PERSON 16X24", person(), 4),
        ("OFFICE AND SHED", pair(draw_office(False), draw_shed(False), draw_office(True), draw_shed(True)), 3),
        ("STRIP 320  QUAY 11/16", s320, 2),
        ("STRIP 960  DESK", s960, 1),
        ("STRIP 320  YEAR 2", s320y2, 2),
        ("HARBOUR YEAR 1  384X216", Image.open(PREVIEWS / "harbour-year1-384x216.png"), 2),
        ("HARBOUR YEAR 2  384X216", Image.open(PREVIEWS / "harbour-year2-384x216.png"), 2),
        ("HARBOUR YEAR 1  320X180", Image.open(PREVIEWS / "harbour-year1-320x180.png"), 2),
        ("HARBOUR YEAR 2  320X180", Image.open(PREVIEWS / "harbour-year2-320x180.png"), 2),
    ]
    sheet = contact_sheet(parts)
    sheet.save(ROOT / "contact-sheet.png")
    sheet.save(PREVIEWS / "contact-sheet.png")

    frames = bark_preview_frames()
    frames[0].save(ROOT / "bark-preview.gif", save_all=True, append_images=frames[1:],
                   duration=80, loop=0, optimize=False, disposal=2)
    (PREVIEWS / "bark-preview.gif").write_bytes((ROOT / "bark-preview.gif").read_bytes())

    issues, acc = [], Counter()
    asset_files = sorted(CHART.glob("*.png")) + sorted(HARBOUR.glob("*.png"))
    preview_files = sorted(PREVIEWS.glob("*.png"))
    for p in asset_files:
        audit_image(p, acc, issues)
    preview_acc, preview_issues = Counter(), []
    for p in preview_files:
        audit_image(p, preview_acc, preview_issues)
    audit_image(ROOT / "contact-sheet.png", preview_acc, preview_issues)

    expected = {
        "stops-24.png": (24 * 7, 24 * 3),
        "stops-32.png": (32 * 7, 32 * 3),
        "connectors.png": (64, 8),
        "strip-bg-320.png": (320, 32),
        "strip-bg-384.png": (384, 32),
        "strip-bg-960.png": (960, 32),
        "strip-bg-tile-16.png": (16, 32),
        "towers-16x48.png": (80, 96),
        "towers-16x32.png": (80, 64),
        "bark-48x32.png": (192, 64),
        "person-16x24.png": (16, 24),
        "office-48x32.png": (48, 32),
        "shed-24x24.png": (24, 24),
        "layer-sky-384.png": (384, 96),
        "layer-water-384.png": (384, 80),
        "layer-sand-384.png": (384, 48),
    }
    grid_notes = []
    for rel, (ew, eh) in expected.items():
        matches = list(ASSETS.rglob(rel))
        if not matches:
            grid_notes.append(f"MISSING {rel}")
            continue
        im = Image.open(matches[0])
        if im.size != (ew, eh):
            grid_notes.append(f"{rel}: size {im.size} != {(ew, eh)}")
        if im.width % 8 or im.height % 8:
            grid_notes.append(f"{rel}: not 8px aligned ({im.size})")

    unique = len(acc)
    off = [i for i in issues if "off-palette" in i]
    alpha = [i for i in issues if "alpha" in i]
    unused = [k for k, v in PALETTE.items() if v[:3] not in acc]
    lines = [
        "# Coast Chart art audit",
        "",
        f"Generator: `_src/make_coastchart.py`. Palette colours: {len(PALETTE)}. House cap: 32.",
        "",
        "## Colour count (production assets under assets/)",
        "",
        f"- Unique opaque colours: **{unique}**",
        f"- Off-palette pixels: **{len(off)}** issue rows",
        f"- Non-binary alpha: **{len(alpha)}** issue rows",
        "",
        "### Colours used",
        "",
        "| Hex | Role key | Pixels |",
        "| --- | --- | ---: |",
    ]
    for rgb, n in sorted(acc.items(), key=lambda kv: -kv[1]):
        key = RGB.get(rgb, "DRIFT")
        hx = "#{:02x}{:02x}{:02x}".format(*rgb)
        lines.append(f"| `{hx}` | {key} | {n} |")
    lines += ["", f"Unused palette colours in the production PNGs: {', '.join(unused) if unused else 'none'}.", "", "## Palette drift", ""]
    if off:
        lines += ["FAIL:"] + [f"- {i}" for i in off]
    else:
        lines.append("PASS. Every opaque pixel in `assets/` matches the 18-colour palette exactly.")
    lines += ["", "## Alpha", ""]
    if alpha:
        lines += ["FAIL:"] + [f"- {i}" for i in alpha]
    else:
        lines.append("PASS. Alpha is only 0 or 255. No blended glow, no anti-aliased edges.")
    lines += ["", "## Grid and sheet sizes", ""]
    if grid_notes:
        lines += ["Issues:"] + [f"- {i}" for i in grid_notes]
    else:
        lines.append("PASS. Sheets and tiles match the spec sizes. Edges sit on an 8px (usually 16px) grid.")
    lines += [
        "",
        "Footprints: tower bases occupy the bottom 8–16px of the 16×48 (or 16×32) cell.",
        "The bark hull sits on y=20–26 of the 32px cell (the lower tile).",
        "Stop icons keep a 4px margin inside the 24×24 cell so the current-state glow stays inside the cell.",
        "",
        "## Previews and contact sheet",
        "",
        f"Preview unique colours: {len(preview_acc)}. Preview issues: {len(preview_issues)}.",
    ]
    if preview_issues:
        lines += [f"- {i}" for i in preview_issues[:40]]
    else:
        lines.append("PASS. Mocks, harbour compositions and the contact sheet stay inside the palette.")
    lines += [
        "",
        "## Files",
        "",
        f"Production PNGs: {len(asset_files)}. Preview PNGs: {len(preview_files)}.",
        "",
        "The GIF `bark-preview.gif` is a motion preview. It is quantised for GIF and is not a production asset.",
        "",
        "## Verdict",
        "",
        "FAIL." if (off or alpha or grid_notes) else "PASS. Colour count, drift, alpha and grid checks all clear.",
        "",
    ]
    (ROOT / "audit.md").write_text("\n".join(lines) + "\n")
    print("unique", unique, "issues", len(issues), "grid", grid_notes, "preview_issues", len(preview_issues))
    print("wrote", ROOT)


if __name__ == "__main__":
    main()
