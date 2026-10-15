"""Draws world-map-schematic.svg from world_data.py, then renders world-map-schematic.png at 1920x1080 with headless Chrome.
Run: python3 make_schematic.py"""
import math, html, asyncio, os
import world_data as W

OUT = os.path.dirname(os.path.abspath(__file__))
INK, PAPER, LAMP, BG = "#1e1a22", "#f4eddc", "#f2d080", "#141820"
GATE = {  # type: (fill, letter, shape)
    "stone": ("#8a8f99", "S", "hex"), "tide": ("#3a7090", "T", "circle"), "lantern": (LAMP, "L", "diamond"),
    "glide": ("#e6dcc6", "G", "tri"), "grove": ("#2f6a4a", "W", "square"), "hush": ("#5b4a78", "H", "square"),
    "daymark": ("#ead6a8", "D", "square"), "badge": ("#8e342c", "B", "shield"),
}
GATE_NAME = {"stone": "Stone Break (Isolde, Thorn Badge)", "tide": "Tide Ride (Nerys, Tide Badge)",
             "lantern": "Lantern (Toren, Ember Badge)", "glide": "Glide (Vessa, Beacon Badge)",
             "grove": "Grove Wake (the grove's antler sign)", "hush": "Hush (Senna, Echo Badge)",
             "daymark": "Daymark (Halen, Loom Badge)", "badge": "Badge rope (Ashstair: Tide; league: all 8)"}
LBL = {  # label offset per place: dx, dy, anchor
    "larkhaven": (0, 34, "middle"), "thornwood": (0, 34, "middle"), "lanternquay": (20, 6, "start"),
    "warmstep": (18, 6, "start"), "highlatch": (-18, -14, "end"), "reedhold": (18, -14, "start"),
    "bellstep": (-18, 24, "end"), "threadmeet": (-16, 30, "end"), "highwatch": (18, 22, "start"),
    "league": (0, -26, "middle"), "oldrootgrove": (16, 26, "start"), "saltmarshcoast": (18, -10, "start"),
    "moonpool": (16, 26, "start"), "outershoal": (0, 30, "middle"), "spire": (0, 30, "middle"),
    "greymill": (16, 26, "start"), "answering": (0, 36, "middle"), "knothollow": (0, 34, "middle"),
    "keelcave": (18, 6, "start"), "kilnvent": (-18, 22, "end"), "larkburrow": (0, 36, "middle"),
    "lowbell": (18, 20, "start"), "trialstair": (-20, 6, "end"), "lampcrown": (18, 6, "start"),
    "meadowground": (16, -14, "start"), "eldertrees": (14, -14, "start"), "wracklinebeach": (16, -6, "start"),
    "springterrace": (16, 24, "start"), "jetty": (16, -4, "start"), "firstbend": (14, 26, "start"), "harborlight": (-14, 30, "end"),
    "nestledge": (18, 8, "start"),
}
GATE_AT = {"burrow": (300, 1035), "rockfall": (960, 398), "greywash": (420, 112), "glassfall": (838, 440)}
REGION_LABEL_AT = {"stillreed": "bottom", "hollowecho": "bottom", "emberfall": "bottom", "league": "bottom"}
REGION_LABEL_DX = {"saltmarsh": 64}

def esc(s): return html.escape(s, quote=True)
def xy(pid): p = W.P[pid]; return (p["x"], p["y"])

def poly_mid(pts):
    segs = [(pts[i], pts[i + 1]) for i in range(len(pts) - 1)]
    L = [math.dist(a, b) for a, b in segs]; half = sum(L) / 2
    for (a, b), l in zip(segs, L):
        if half <= l and l > 0:
            t = half / l; return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t), (b[0] - a[0], b[1] - a[1])
        half -= l
    return pts[-1], (1, 0)

def path_d(kind_id, pts):
    """SVG path and (midpoint, direction) for a segment; a few are curved so they do not sit on other lines."""
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    if kind_id == "glassfall":
        return f"M{x1},{y1} Q820,380 {x2},{y2}", ((815, 420), (1, 1))
    if kind_id == "rockfall":
        return f"M{x1},{y1} C1000,400 760,380 {x2},{y2}", ((880, 405), (-1, 0))
    if kind_id == "burrow":
        return f"M{x1},{y1} C60,1075 700,1075 760,1062 S1200,1060 1180,760 L{x2},{y2}", ((560, 1062), (1, 0))
    if kind_id == "greywash":
        a, k, s = pts
        return f"M{a[0]},{a[1]} C260,120 360,60 {k[0]},{k[1]} S800,150 {s[0]},{s[1]}", ((700, 120), (1, 0))
    return "M" + " L".join(f"{x},{y}" for x, y in pts), poly_mid(pts)

def gate_icon(t, x, y, r=11):
    fill, letter, shape = GATE[t]
    tc = INK if t in ("lantern", "glide", "daymark") else PAPER
    if shape == "circle": s = f'<circle cx="{x}" cy="{y}" r="{r}"/>'
    elif shape == "hex":
        s = '<polygon points="' + " ".join(f"{x + r * math.cos(math.pi / 3 * i):.1f},{y + r * math.sin(math.pi / 3 * i):.1f}" for i in range(6)) + '"/>'
    elif shape == "diamond": s = f'<polygon points="{x},{y - r - 2} {x + r + 2},{y} {x},{y + r + 2} {x - r - 2},{y}"/>'
    elif shape == "tri": s = f'<polygon points="{x},{y - r - 1} {x + r + 1},{y + r - 1} {x - r - 1},{y + r - 1}"/>'
    elif shape == "shield": s = f'<path d="M{x - r},{y - r} H{x + r} V{y} Q{x + r},{y + r} {x},{y + r + 3} Q{x - r},{y + r} {x - r},{y} Z"/>'
    else: s = f'<rect x="{x - r}" y="{y - r}" width="{2 * r}" height="{2 * r}" rx="3"/>'
    return (f'<g fill="{fill}" stroke="{INK}" stroke-width="2">{s}</g>'
            f'<text x="{x}" y="{y + 4.5}" font-size="{13 if r >= 11 else 11}" font-weight="700" text-anchor="middle" fill="{tc}">{letter}</text>')

def place_icon(p):
    x, y, k = p["x"], p["y"], p["kind"]
    if k == "town":
        return (f'<g stroke="{INK}" stroke-width="2"><rect x="{x - 12}" y="{y - 6}" width="24" height="17" fill="{PAPER}"/>'
                f'<polygon points="{x - 16},{y - 5} {x},{y - 19} {x + 16},{y - 5}" fill="#435a78"/>'
                f'<rect x="{x - 4}" y="{y + 1}" width="8" height="10" fill="{LAMP}"/></g>')
    if k == "cave":
        return (f'<g stroke="{INK}" stroke-width="2"><path d="M{x - 17},{y + 12} V{y} A17,17 0 0 1 {x + 17},{y} V{y + 12} Z" fill="#56708f"/>'
                f'<path d="M{x - 8},{y + 12} V{y + 3} A8,8 0 0 1 {x + 8},{y + 3} V{y + 12} Z" fill="{BG}"/></g>')
    if k == "site":
        pts = " ".join(f"{x + (16 if i % 2 == 0 else 7) * math.cos(-math.pi / 2 + i * math.pi / 5):.1f},"
                       f"{y + (16 if i % 2 == 0 else 7) * math.sin(-math.pi / 2 + i * math.pi / 5):.1f}" for i in range(10))
        return f'<polygon points="{pts}" fill="{LAMP}" stroke="{INK}" stroke-width="2"/>'
    if k == "side":
        return (f'<g stroke="{INK}" stroke-width="2"><rect x="{x - 10}" y="{y - 10}" width="20" height="20" fill="#cfc4ac"/>'
                f'<path d="M{x - 10},{y - 10} L{x + 10},{y + 10} M{x + 10},{y - 10} L{x - 10},{y + 10}" stroke="#6a4a32"/></g>')
    if k == "place":
        return f'<circle cx="{x}" cy="{y}" r="9" fill="{PAPER}" stroke="{INK}" stroke-width="2"/><circle cx="{x}" cy="{y}" r="3.5" fill="{INK}"/>'
    return f'<circle cx="{x}" cy="{y}" r="3.5" fill="#e6dcc6" stroke="{INK}" stroke-width="1"/>'

STYLE = {
    "water": 'stroke="#8cc0d4" stroke-width="5" stroke-dasharray="14 7"',
    "passage": 'stroke="#bb9a6a" stroke-width="3" stroke-dasharray="3 5"',
    "pocket": 'stroke="#e6dcc6" stroke-width="2.5" stroke-dasharray="6 5"',
    "cave": 'stroke="#e6dcc6" stroke-width="2.5" stroke-dasharray="6 5"',
    "grove": 'stroke="#8ccf7e" stroke-width="3" stroke-dasharray="6 5"',
    "chord": 'stroke="#d9a35b" stroke-width="3" stroke-dasharray="10 4 2 4"',
    "burrow": 'stroke="#8a6444" stroke-width="4" stroke-dasharray="12 6"',
    "walk": 'stroke="#e6dcc6" stroke-width="2.5"',
}

def build():
    o = ['<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080" '
         'font-family="DejaVu Sans, Verdana, sans-serif">',
         '<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
         f'<path d="M0,0 L10,5 L0,10 z" fill="{LAMP}" stroke="{INK}" stroke-width="1"/></marker>'
         '<pattern id="wave" width="24" height="12" patternUnits="userSpaceOnUse"><path d="M0,6 q6,-5 12,0 t12,0" fill="none" stroke="#4a84a2" stroke-width="2"/></pattern></defs>',
         f'<rect width="1920" height="1080" fill="{BG}"/>']
    sea = " ".join(f"{x},{y}" for x, y in W.SEA["poly"])
    o += [f'<polygon points="{sea}" fill="{W.SEA["fill"]}"/>', f'<polygon points="{sea}" fill="url(#wave)" opacity="0.5"/>',
          '<text x="560" y="34" font-size="16" fill="#8cc0d4" font-style="italic" text-anchor="middle">the sea (rideable only on the water routes, after Tide Ride)</text>']
    for r in W.REGIONS + W.ZONES:
        zone = r in W.ZONES
        pts = " ".join(f"{x},{y}" for x, y in r["poly"])
        dash = 'stroke-dasharray="8 6"' if zone else ""
        o.append(f'<polygon points="{pts}" fill="{r["fill"]}" fill-opacity="{0.16 if zone else 0.28}" stroke="{r["fill"]}" stroke-width="2.5" {dash} stroke-linejoin="round"/>')
        x0, y0 = r["poly"][0]
        if REGION_LABEL_AT.get(r["id"]) == "bottom": x0, y0 = r["poly"][3][0], r["poly"][3][1] - 48
        x0 += REGION_LABEL_DX.get(r["id"], 0)
        sub = f'{r["badge"]} · Warden {r["warden"]}' if not zone else "no Warden"
        o.append(f'<text x="{x0 + 10}" y="{y0 + 22}" font-size="17" font-weight="700" fill="{r["fill"]}" stroke="{BG}" stroke-width="3" paint-order="stroke">{esc(r["name"].upper())}</text>')
        o.append(f'<text x="{x0 + 10}" y="{y0 + 40}" font-size="12" fill="#cfc4ac" stroke="{BG}" stroke-width="3" paint-order="stroke">{esc(sub)}</text>')
    geo = {}
    for n, rid, name, ids, note in W.ROUTES:
        if rid != "chartroad": geo[rid] = path_d(rid, [xy(i) for i in ids])
    for l in W.LINKS: geo[l["id"]] = path_d(l["id"], [xy(i) for i in l["path"]])
    for lp in W.LOOPS:
        for seg in lp["segments"]:
            o.append(f'<path d="{geo[seg][0]}" fill="none" stroke="{lp["colour"]}" stroke-width="16" stroke-opacity="0.38" stroke-linecap="round" stroke-linejoin="round"/>')
    for l in W.LINKS:
        o.append(f'<path d="{geo[l["id"]][0]}" fill="none" {STYLE[l["kind"]]} stroke-linecap="round"/>')
    for n, rid, name, ids, note in W.ROUTES:
        if rid == "chartroad":
            x, y = xy("highwatch")
            o.append(f'<circle cx="{x + 58}" cy="{y + 50}" r="30" fill="none" stroke="#e6dcc6" stroke-width="3.5"/>'
                     f'<line x1="{x}" y1="{y}" x2="{x + 37}" y2="{y + 29}" stroke="#e6dcc6" stroke-width="3.5"/>')
            continue
        one = rid == W.ONE_WAY
        o.append(f'<path d="{geo[rid][0]}" fill="none" stroke="{LAMP if one else "#e6dcc6"}" stroke-width="3.5" stroke-linecap="round" '
                 f'stroke-linejoin="round"{" marker-end=" + chr(34) + "url(#arrow)" + chr(34) if one else ""}/>')
    for n, rid, name, ids, note in W.ROUTES:
        if rid == "chartroad": x, y = xy("highwatch"); mx, my = x + 88, y + 50
        else: (mx, my), _ = geo[rid][1]
        o.append(f'<circle cx="{mx:.0f}" cy="{my:.0f}" r="13" fill="{BG}" stroke="#e6dcc6" stroke-width="2"/>'
                 f'<text x="{mx:.0f}" y="{my + 4.5:.0f}" font-size="13" font-weight="700" text-anchor="middle" fill="{PAPER}">{n}</text>')
    wlab = {"greywash": ("W1 Greywash Sound", 600, 150), "quietchannels": ("W2 The Quiet Channels", 930, 655),
            "opengrey": ("W3 The Open Grey", 1060, 172), "dryboards": ("The Dry Boards", 690, 560),
            "rockfall": ("Orchard Fen rockfall (chord)", 880, 372), "burrow": ("Larkburrow through-path (underground)", 520, 1048)}
    for k, (t, x, y) in wlab.items():
        col = "#8cc0d4" if k in W.WATER_ROUTES else ("#d9a35b" if k == "rockfall" else "#cfc4ac")
        o.append(f'<text x="{x}" y="{y}" font-size="13" font-style="italic" font-weight="700" text-anchor="middle" fill="{col}" '
                 f'stroke="{BG}" stroke-width="3" paint-order="stroke">{esc(t)}</text>')
    for p in W.P.values():
        if p["kind"] == "waypoint": continue
        o.append(place_icon(p))
        dx, dy, a = LBL.get(p["id"], (16, 5, "start"))
        town = p["kind"] == "town"
        o.append(f'<text x="{p["x"] + dx}" y="{p["y"] + dy}" font-size="{15 if town else 13}" font-weight="{700 if town else 400}" text-anchor="{a}" '
                 f'fill="{PAPER}" stroke="{BG}" stroke-width="3.5" paint-order="stroke">{esc(p["name"])}</text>')
    for i, (t, target, note) in enumerate(W.GATES):
        same = len([g for g in W.GATES[:i] if g[1] == target])
        if target in GATE_AT: x, y = GATE_AT[target]
        elif target in W.P: x, y = W.P[target]["x"] + 22, W.P[target]["y"] - 22
        else:
            (x, y), d = geo[target][1]
            L = math.hypot(*d) or 1; x, y = x - d[1] / L * 26, y + d[0] / L * 26
        o.append(gate_icon(t, round(x + 26 * same), round(y)))
    for name, el, pid, note, first in W.LEGENDS:
        if pid:
            p = W.P[pid]; dx, dy, a = LBL[pid]
            o.append(f'<text x="{p["x"] + dx}" y="{p["y"] + dy + 15}" font-size="12" font-style="italic" text-anchor="{a}" fill="{LAMP}" '
                     f'stroke="{BG}" stroke-width="3" paint-order="stroke">{esc(name)} ({el})</text>')
    gm = W.P["greymill"]
    o.append(f'<text x="{gm["x"] - 60}" y="{gm["y"] + 42}" font-size="12" font-style="italic" fill="#cfc4ac" stroke="{BG}" stroke-width="3" paint-order="stroke">Greysail roamer: proposed only</text>')
    # legend panel
    lx = 1480; y = 0
    o += [f'<rect x="{lx}" y="14" width="426" height="1052" rx="10" fill="#1b2430" stroke="#435a78" stroke-width="2"/>',
          f'<text x="{lx + 20}" y="50" font-size="24" font-weight="700" fill="{LAMP}">Wildbond world schematic</text>',
          f'<text x="{lx + 20}" y="72" font-size="12" fill="#cfc4ac">Places and links: #455 at 66647dc9, section 2. Regions: #452 section 5.</text>',
          f'<text x="{lx + 20}" y="88" font-size="12" fill="#cfc4ac">20 routes · 10 towns · 7 caves · 3 water routes · 3 loops · 1 one-way</text>',
          f'<text x="{lx + 20}" y="104" font-size="12" fill="#cfc4ac">Planning positions only; north is up.</text>']
    y = 132
    def head(t):
        nonlocal y; o.append(f'<text x="{lx + 20}" y="{y}" font-size="15" font-weight="700" fill="{LAMP}">{t}</text>'); y += 24
    def row(icon, text, h):
        nonlocal y; o.append(icon); o.append(f'<text x="{lx + 64}" y="{y + 5}" font-size="14" fill="{PAPER}">{esc(text)}</text>'); y += h
    def line_row(attrs, text):
        nonlocal y
        o.append(f'<line x1="{lx + 18}" y1="{y}" x2="{lx + 54}" y2="{y}" {attrs}/>')
        o.append(f'<text x="{lx + 64}" y="{y + 5}" font-size="14" fill="{PAPER}">{esc(text)}</text>'); y += 22
    head("Places")
    for kind, text in [("town", "Town (a healer indoors)"), ("cave", "Cave or depth"), ("site", "Legendary site"),
                       ("place", "Other place (screen, pocket, island)"), ("side", "Side dungeon (Greymill)")]:
        row(place_icon(dict(x=lx + 36, y=y, kind=kind)), text, 27)
    y += 2; head("Ways")
    line_row('stroke="#e6dcc6" stroke-width="3.5"', "Numbered route (1 to 20)")
    line_row(f'stroke="{LAMP}" stroke-width="3.5" marker-end="url(#arrow)"', "One-way shortcut (Glassfall, down only)")
    line_row(STYLE["water"], "Water route W1 to W3 (Tide Ride)")
    line_row(STYLE["passage"], "The Dry Boards (a passage, not a route)")
    line_row(STYLE["chord"], "Orchard Fen rockfall (a chord, not a loop)")
    line_row(STYLE["burrow"], "Larkburrow through-path (underground)")
    line_row(STYLE["cave"], "Cave mouth, pocket or lesson link")
    y += 4; head("Loops (highlight)")
    for lp in W.LOOPS: line_row(f'stroke="{lp["colour"]}" stroke-width="14" stroke-opacity="0.5"', lp["name"])
    y += 6; head("Gates that change how you cross")
    for t in ["stone", "tide", "lantern", "glide"]: row(gate_icon(t, lx + 36, y), GATE_NAME[t], 26)
    head("Other lessons and badge ropes")
    for t in ["grove", "hush", "daymark", "badge"]: row(gate_icon(t, lx + 36, y, 9), GATE_NAME[t], 24)
    y += 6; head("Legends (catalogue tier Legend, 9)")
    for name, el, pid, note, first in W.LEGENDS:
        where = W.P[pid]["name"]
        o.append(f'<text x="{lx + 24}" y="{y}" font-size="13" fill="{LAMP if pid else "#cfc4ac"}">{esc(name)} ({el}): {esc(where)}</text>'); y += 17
    y += 6
    for t in ["Legend sites are return visits; first meetings stay put.", "Glide fast-travels only to inns already entered.",
              "Spire: Orla's floors. Greysail: only with Evan's yes."]:
        o.append(f'<text x="{lx + 24}" y="{y}" font-size="12" fill="#cfc4ac">{esc(t)}</text>'); y += 16
    o.append('</svg>')
    return "\n".join(o), y

async def render(svg_path, png_path):
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg = await b.new_page(viewport={'width': 1920, 'height': 1080})
        await pg.goto('file://' + svg_path); await pg.wait_for_timeout(300)
        await pg.screenshot(path=png_path); await b.close()

if __name__ == "__main__":
    svg, last_y = build()
    sp = os.path.join(OUT, "world-map-schematic.svg"); open(sp, "w").write(svg)
    asyncio.run(render(sp, os.path.join(OUT, "world-map-schematic.png")))
    print("wrote", sp, "legend ends at y", last_y)
