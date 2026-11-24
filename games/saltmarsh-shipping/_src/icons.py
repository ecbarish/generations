"""Coast Chart stop icons (24x24) and strip backgrounds."""
import math
from palette import P, STOPS, STATES
from draw import (
    new, put, hline, vline, fill_rect, outline_rect, disk, paste, fill_triangle,
    lantern_room, shaft, current_glow, mute_locked,
)


def icon_base_pier():
    im = new(24, 24)
    lantern_room(im, 9, 4, 14, 9, lit=True)
    shaft(im, 10, 13, 11, 16, P["timber_l"], P["timber"], P["hull"])
    fill_rect(im, 4, 17, 19, 19, P["timber"])
    hline(im, 4, 19, 17, P["timber_l"])
    hline(im, 4, 19, 19, P["hull"])
    outline_rect(im, 3, 16, 20, 20, P["ink"])
    vline(im, 6, 20, 21, P["ink"])
    vline(im, 17, 20, 21, P["ink"])
    vline(im, 6, 20, 20, P["hull"])
    vline(im, 17, 20, 20, P["hull"])
    return im


def icon_base_headland():
    im = new(24, 24)
    lantern_room(im, 9, 3, 14, 8, lit=True)
    shaft(im, 10, 13, 10, 14, P["sand"], P["sand_d"], P["water_m"])
    hline(im, 9, 14, 9, P["ink"])
    fill_rect(im, 6, 15, 17, 19, P["sand_d"])
    hline(im, 6, 16, 15, P["sand"])
    vline(im, 6, 15, 18, P["sand"])
    hline(im, 7, 17, 19, P["water"])
    put(im, 5, 17, P["sand_d"])
    put(im, 5, 18, P["sand_d"])
    put(im, 4, 18, P["water_m"])
    put(im, 18, 17, P["water_m"])
    put(im, 18, 18, P["water"])
    outline_rect(im, 5, 14, 18, 20, P["ink"])
    put(im, 4, 18, P["ink"])
    put(im, 5, 16, P["ink"])
    put(im, 19, 18, P["ink"])
    return im


def icon_base_reed():
    im = new(24, 24)
    lantern_room(im, 10, 3, 13, 8, lit=True)
    shaft(im, 10, 13, 10, 16, P["sand"], P["sand_d"], P["water_m"])
    for x, h in ((4, 6), (6, 8), (17, 8), (19, 6)):
        top = 20 - h
        vline(im, x, top, 19, P["reed_d"])
        vline(im, x + 1, top + 1, 19, P["reed"])
        put(im, x, top, P["reed_l"])
        put(im, x - 1, top + 1, P["reed_l"])
        put(im, x, top - 1, P["ink"])
        vline(im, x - 1, top, 19, P["ink"])
        vline(im, x + 2, top + 1, 19, P["ink"])
    fill_rect(im, 8, 17, 15, 19, P["sand_d"])
    hline(im, 8, 15, 17, P["sand"])
    outline_rect(im, 7, 16, 16, 20, P["ink"])
    return im


def icon_base_quay():
    im = new(24, 24)
    lantern_room(im, 9, 2, 14, 7, lit=True)
    fill_rect(im, 8, 8, 15, 9, P["sand_d"])
    hline(im, 8, 15, 8, P["sand"])
    outline_rect(im, 7, 7, 16, 10, P["ink"])
    shaft(im, 10, 13, 11, 15, P["sand"], P["sand_d"], P["water_m"])
    fill_rect(im, 5, 16, 18, 20, P["sand_d"])
    hline(im, 5, 18, 16, P["sand"])
    hline(im, 5, 18, 18, P["hull"])
    hline(im, 5, 18, 20, P["water"])
    outline_rect(im, 4, 15, 19, 21, P["ink"])
    vline(im, 11, 16, 20, P["water_m"])
    return im


def icon_base_voyage():
    im = new(24, 24)
    fill_rect(im, 4, 15, 19, 18, P["hull"])
    hline(im, 5, 18, 15, P["timber_l"])
    hline(im, 5, 18, 18, P["hull_d"])
    put(im, 3, 16, P["hull"])
    put(im, 3, 17, P["hull_d"])
    put(im, 20, 16, P["hull"])
    put(im, 20, 17, P["timber"])
    put(im, 21, 16, P["timber"])
    outline_rect(im, 4, 14, 19, 19, P["ink"])
    put(im, 3, 15, P["ink"])
    put(im, 3, 18, P["ink"])
    put(im, 2, 16, P["ink"])
    put(im, 2, 17, P["ink"])
    put(im, 20, 15, P["ink"])
    put(im, 20, 18, P["ink"])
    put(im, 21, 15, P["ink"])
    put(im, 21, 17, P["ink"])
    put(im, 22, 16, P["ink"])
    for mx, sail in ((7, 4), (12, 4), (17, 3)):
        vline(im, mx, 6, 14, P["ink"])
        fill_triangle(im, (mx + 1, 7), (mx + sail, 10), (mx + 1, 13), P["mist"])
        put(im, mx + 1, 7, P["panel"])
        steps = max(sail, 6)
        for i in range(steps + 1):
            put(im, mx + 1 + (sail - 1) * i // steps, 7 + (3 * i) // steps, P["ink"])
            put(im, mx + 1 + (sail - 1) * i // steps, 13 - (3 * i) // steps, P["ink"])
    put(im, 5, 14, P["lamp"])
    put(im, 6, 14, P["lamp_d"])
    return im


def icon_base_frost():
    im = new(24, 24)
    vline(im, 11, 6, 16, P["timber_l"])
    vline(im, 12, 6, 16, P["hull"])
    outline_rect(im, 10, 5, 13, 17, P["ink"])
    fill_rect(im, 7, 7, 16, 11, P["paper"])
    hline(im, 7, 16, 7, P["panel"])
    outline_rect(im, 6, 6, 17, 12, P["ink"])
    hline(im, 7, 15, 6, P["panel"])
    put(im, 8, 5, P["panel"])
    put(im, 12, 5, P["panel"])
    put(im, 8, 5, P["ink"])
    put(im, 12, 5, P["ink"])
    put(im, 10, 4, P["ink"])
    put(im, 10, 5, P["panel"])
    fill_rect(im, 3, 18, 20, 20, P["paper"])
    hline(im, 3, 20, 18, P["panel"])
    hline(im, 4, 19, 20, P["mist"])
    outline_rect(im, 2, 17, 21, 21, P["ink"])
    put(im, 5, 19, P["panel"])
    put(im, 14, 19, P["panel"])
    return im


def icon_base_glass():
    im = new(24, 24)
    lantern_room(im, 8, 3, 15, 9, lit=True, glass=True)
    vline(im, 11, 3, 9, P["mist"])
    vline(im, 12, 3, 9, P["water_m"])
    hline(im, 8, 15, 6, P["mist"])
    shaft(im, 10, 13, 11, 16, P["mist"], P["sand_d"], P["water_m"])
    fill_rect(im, 7, 17, 16, 20, P["sand_d"])
    hline(im, 7, 16, 17, P["mist"])
    outline_rect(im, 6, 16, 17, 21, P["ink"])
    hline(im, 8, 15, 2, P["panel"])
    put(im, 11, 1, P["panel"])
    put(im, 12, 1, P["panel"])
    put(im, 10, 1, P["ink"])
    put(im, 13, 1, P["ink"])
    put(im, 11, 0, P["ink"])
    put(im, 12, 0, P["ink"])
    return im


ICON_BUILDERS = {
    "pier": icon_base_pier,
    "headland": icon_base_headland,
    "reed": icon_base_reed,
    "quay": icon_base_quay,
    "voyage": icon_base_voyage,
    "frost": icon_base_frost,
    "glass": icon_base_glass,
}


def icon_state(kind, state):
    im = ICON_BUILDERS[kind]()
    if state == "locked":
        return mute_locked(im)
    if state == "current":
        return current_glow(im)
    return im


def sheet_icons(cell=24):
    cols, rows = len(STOPS), len(STATES)
    sheet = new(cols * cell, rows * cell)
    coords = {}
    for r, state in enumerate(STATES):
        for c, (kind, _, _) in enumerate(STOPS):
            icon = icon_state(kind, state)
            if cell != 24:
                padded = new(cell, cell)
                paste(padded, icon, (cell - 24) // 2, (cell - 24) // 2)
                icon = padded
            paste(sheet, icon, c * cell, r * cell)
            coords[f"{kind}-{state}"] = {"x": c * cell, "y": r * cell, "w": cell, "h": cell}
    return sheet, coords


def connectors():
    sheet = new(16 * 4, 8)
    y = 3
    for x in range(1, 15, 3):
        hline(sheet, x, x + 1, y, P["water_m"])
    hline(sheet, 17, 30, y, P["lamp"])
    hline(sheet, 18, 29, y - 1, P["lamp_d"])
    put(sheet, 24, y, P["panel"])
    hline(sheet, 33, 46, y, P["timber"])
    hline(sheet, 33, 46, y + 1, P["hull"])
    disk(sheet, 56, y, 1, P["timber"])
    put(sheet, 56, y, P["timber_l"])
    return sheet


def coastline_y(x, amp=3, base=18):
    return base + int(round(math.sin(x / 18) * amp + math.sin(x / 7) * 1.2))


def strip_bg(width, winter=False, height=32):
    im = new(width, height)
    ground = P["paper"] if not winter else P["mist"]
    fill_rect(im, 0, 0, width - 1, height - 1, ground)
    for y in range(2, height - 2, 4):
        for x in range(2, width - 2, 4):
            if (x * 3 + y * 7) % 11 == 0:
                put(im, x, y, P["panel"] if not winter else P["paper"])
            if (x + y * 5) % 17 == 0:
                put(im, x + 1, y + 1, P["sand"] if not winter else P["sky"])
    for x in range(4, width - 4):
        y = coastline_y(x, 3, 14 if not winter else 15)
        put(im, x, y, P["water_m"])
        put(im, x, y + 1, P["sky"])
        if winter and x % 5 == 0:
            put(im, x, y - 1, P["panel"])
    fill_rect(im, 1, 1, width - 2, 2, P["timber_l"] if not winter else P["paper"])
    fill_rect(im, 1, height - 3, width - 2, height - 2, P["hull"])
    vline(im, 1, 1, height - 2, P["timber_l"])
    vline(im, width - 2, 1, height - 2, P["hull"])
    if winter:
        hline(im, 2, width - 3, 1, P["panel"])
        for x in range(4, width - 4, 7):
            put(im, x, 0, P["panel"])
    outline_rect(im, 0, 0, width - 1, height - 1, P["ink"])
    return im


def tileable_strip_center(winter=False):
    full = strip_bg(48, winter=winter, height=32)
    return full.crop((16, 0, 32, 32))
