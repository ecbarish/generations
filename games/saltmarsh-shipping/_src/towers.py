"""Harbour lighthouse towers: 16x48 standard, 16x32 short, lit/unlit, year-2 snow."""
from palette import P, TOWERS
from draw import new, put, hline, vline, fill_rect, outline_rect, paste, lantern_room, shaft


def draw_tower(kind, lit, short=False, snow=False):
    h = 32 if short else 48
    im = new(16, h)
    if short:
        lantern_y0, lantern_y1 = (3, 8)
        shaft_y0, shaft_y1 = (10, 21)
        base_y0, base_y1 = (22, 30)
    else:
        lantern_y0, lantern_y1 = (4, 11)
        shaft_y0, shaft_y1 = (13, 35)
        base_y0, base_y1 = (36, 46)
    stone_l, stone, stone_d = P["sand"], P["sand_d"], P["water_m"]

    if kind == "pier":
        if not short:
            shaft_y1 = 33
            base_y0 = 34
        lantern_room(im, 5, lantern_y0, 10, lantern_y1, lit=lit)
        shaft(im, 6, 9, shaft_y0, shaft_y1, P["timber_l"], P["timber"], P["hull"])
        fill_rect(im, 1, base_y0, 14, base_y0 + 3, P["timber"])
        hline(im, 1, 14, base_y0, P["timber_l"])
        hline(im, 1, 14, base_y0 + 3, P["hull"])
        outline_rect(im, 0, base_y0 - 1, 15, base_y0 + 4, P["ink"])
        for px_ in (3, 12):
            vline(im, px_, base_y0 + 5, base_y1, P["ink"])
            vline(im, px_ + 1, base_y0 + 5, base_y1 - 1, P["hull"])
        fill_rect(im, 7, shaft_y0 + 4, 8, shaft_y0 + 6, P["lamp"] if lit else P["water"])
        outline_rect(im, 6, shaft_y0 + 3, 9, shaft_y0 + 7, P["ink"])

    elif kind == "headland":
        lantern_room(im, 5, lantern_y0, 10, lantern_y1, lit=lit)
        shaft(im, 5, 10, shaft_y0, shaft_y1 - 2, stone_l, stone, stone_d)
        fill_rect(im, 2, base_y0 - 2, 13, base_y1 - 1, stone)
        hline(im, 2, 12, base_y0 - 2, stone_l)
        vline(im, 2, base_y0 - 2, base_y1 - 2, stone_l)
        hline(im, 3, 13, base_y1 - 1, P["water"])
        put(im, 1, base_y0 + 2, stone)
        put(im, 1, base_y0 + 3, stone_d)
        put(im, 14, base_y0 + 3, stone_d)
        outline_rect(im, 1, base_y0 - 3, 14, base_y1, P["ink"])
        put(im, 0, base_y0 + 2, P["ink"])
        put(im, 0, base_y0 + 3, P["ink"])
        put(im, 15, base_y0 + 3, P["ink"])
        put(im, 15, base_y0 + 4, P["ink"])

    elif kind == "reed":
        lantern_room(im, 6, lantern_y0, 9, lantern_y1, lit=lit)
        shaft(im, 6, 9, shaft_y0, shaft_y1, stone_l, stone, stone_d)
        fill_rect(im, 4, base_y0, 11, base_y0 + 3, stone)
        hline(im, 4, 11, base_y0, stone_l)
        outline_rect(im, 3, base_y0 - 1, 12, base_y0 + 4, P["ink"])

        def reed_clump(x, top, hgt, flip=False):
            stems = (hgt, hgt - 2, hgt - 1, hgt - 4, hgt - 3)
            for i, hh in enumerate(stems):
                xx = x + (i if not flip else -i)
                if xx < 0 or xx > 15:
                    continue
                yy = top - hh
                c = P["reed_l"] if i in (1, 2) else P["reed"] if i == 0 else P["reed_d"]
                vline(im, xx, yy, top, c)
                put(im, xx, yy, P["reed_l"])
                put(im, xx, yy - 1, P["ink"])
                put(im, xx - 1 if not flip else xx + 1, yy, P["ink"])

        # Small sand island so the reeds read against the water.
        fill_rect(im, 0, base_y1 - 2, 15, base_y1, P["sand_d"])
        hline(im, 0, 15, base_y1 - 2, P["sand"])
        hline(im, 0, 15, base_y1, P["ink"])
        reed_clump(0, base_y1 - 1, 12 if not short else 8)
        reed_clump(15, base_y1 - 1, 11 if not short else 7, flip=True)

    elif kind == "quay":
        lantern_room(im, 5, lantern_y0 - (0 if short else 1), 10, lantern_y1, lit=lit)
        fill_rect(im, 3, shaft_y0 - 1, 12, shaft_y0 + 1, stone)
        hline(im, 3, 12, shaft_y0 - 1, stone_l)
        outline_rect(im, 2, shaft_y0 - 2, 13, shaft_y0 + 2, P["ink"])
        shaft(im, 5, 10, shaft_y0 + 3, shaft_y1, stone_l, stone, stone_d)
        for by in range(shaft_y0 + 6, shaft_y1, 5):
            hline(im, 5, 10, by, stone_d)
        fill_rect(im, 0, base_y0, 15, base_y1 - 1, stone)
        hline(im, 0, 15, base_y0, stone_l)
        hline(im, 0, 15, base_y0 + 3, P["hull"])
        hline(im, 0, 15, base_y1 - 1, P["water"])
        vline(im, 7, base_y0, base_y1 - 1, stone_d)
        outline_rect(im, 0, base_y0 - 1, 15, base_y1, P["ink"])

    else:  # glass
        ly0 = lantern_y0 - (0 if short else 1)
        extra = 0 if short else 1
        lantern_room(im, 4, ly0, 11, lantern_y1 + extra, lit=lit, glass=True)
        vline(im, 7, ly0, lantern_y1 + extra, P["mist"] if lit else P["water_m"])
        vline(im, 8, ly0, lantern_y1 + extra, P["water_m"])
        midy = (ly0 + lantern_y1) // 2
        hline(im, 4, 11, midy, P["mist"] if lit else P["water_m"])
        shaft(im, 6, 9, shaft_y0 + 1, shaft_y1, P["mist"], stone, stone_d)
        fill_rect(im, 3, base_y0, 12, base_y1 - 2, stone)
        hline(im, 3, 12, base_y0, P["mist"])
        outline_rect(im, 2, base_y0 - 1, 13, base_y1 - 1, P["ink"])

    # snow / glazed cap
    if snow or kind == "glass":
        cy = 2
        for x in range(5, 11):
            put(im, x, cy, P["panel"])
        put(im, 7, cy - 1, P["panel"])
        put(im, 8, cy - 1, P["panel"])
        put(im, 6, cy - 1, P["ink"])
        put(im, 9, cy - 1, P["ink"])
        put(im, 7, cy - 2, P["ink"])
        put(im, 8, cy - 2, P["ink"])
    if snow and kind in ("pier", "quay"):
        hline(im, 2, 13, base_y0, P["panel"])
        for x in range(3, 13, 3):
            put(im, x, base_y0 - 1, P["panel"])
    return im


def tower_sheet(short=False, snow=False):
    w, h = 16, (32 if short else 48)
    sheet = new(len(TOWERS) * w, 2 * h)
    coords = {}
    for r, lit in enumerate((False, True)):
        for c, kind in enumerate(TOWERS):
            spr = draw_tower(kind, lit, short=short, snow=snow)
            paste(sheet, spr, c * w, r * h)
            coords[f"{kind}-{'lit' if lit else 'unlit'}"] = {
                "x": c * w, "y": r * h, "w": w, "h": h
            }
    return sheet, coords
