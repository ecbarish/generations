"""Harbour layers, office/shed props, and composed year-1 / year-2 scenes."""
from palette import P, STOPS
from draw import (
    new, put, hline, vline, fill_rect, outline_rect, paste, draw_text, text_width,
)
from towers import draw_tower
from boats import draw_bark
from icons import icon_state, strip_bg
from PIL import Image


def sky_band(w, h, winter=False):
    im = new(w, h)
    if winter:
        # Pale cold day, not a night sky: sky above, mist toward the horizon.
        fill_rect(im, 0, 0, w - 1, int(h * 0.55), P["sky"])
        fill_rect(im, 0, int(h * 0.55), w - 1, h - 1, P["mist"])
        flakes = (
            (12, 8), (40, 14), (70, 6), (110, 16), (150, 4),
            (190, 12), (230, 7), (270, 15), (310, 5), (350, 11),
            (24, 20), (96, 22), (200, 18), (300, 20),
        )
        for x, y in flakes:
            if x < w and y < h:
                put(im, x, y, P["panel"])
    else:
        fill_rect(im, 0, 0, w - 1, h - 1, P["sky"])
        for y in range(int(h * 0.78), h):
            hline(im, 0, w - 1, y, P["mist"] if y % 2 == 0 else P["sky"])
    return im


def water_band(w, h, winter=False):
    im = new(w, h)
    fill_rect(im, 0, 0, w - 1, h - 1, P["water"])
    # A few mid-water bands, then sparse glints. Not a full stripe field.
    for y in range(6, h - 4, 10):
        hline(im, 0, w - 1, y, P["water_m"])
    for y in range(4, h - 2, 10):
        phase = (y * 3) % 14
        for x in range(phase, w, 22):
            hline(im, x, min(w - 1, x + 5), y, P["sky"] if not winter else P["mist"])
            if winter and x % 44 == phase:
                hline(im, x + 1, min(w - 1, x + 3), y - 1, P["panel"])
    return im


def sand_band(w, h, winter=False):
    im = new(w, h)
    for y in range(0, h):
        c = P["sand"] if y < h // 2 else P["sand_d"]
        if winter and y < 4:
            c = P["paper"]
        hline(im, 0, w - 1, y, c)
    if winter:
        for x in range(0, w, 6):
            put(im, x, 1, P["panel"])
            if x % 12 == 0:
                put(im, x + 2, 2, P["panel"])
    hline(im, 0, w - 1, 0, P["water_m"])
    return im


def draw_office(snow=False):
    im = new(48, 32)
    fill_rect(im, 6, 10, 40, 28, P["timber"])
    vline(im, 6, 10, 28, P["timber_l"])
    vline(im, 40, 10, 28, P["hull"])
    for i in range(8):
        hline(im, 6 - 1 + i, 40 + 1 - i, 9 - i, P["hull"] if i > 5 else P["timber"])
        put(im, 5 + i, 9 - i, P["ink"])
        put(im, 41 - i, 9 - i, P["ink"])
    hline(im, 13, 33, 2, P["ink"])
    if snow:
        for i in range(6):
            hline(im, 8 + i, 38 - i, 8 - i, P["panel"])
    fill_rect(im, 20, 18, 26, 28, P["hull_d"])
    outline_rect(im, 19, 17, 27, 28, P["ink"])
    put(im, 25, 23, P["lamp"])
    for wx in (10, 32):
        fill_rect(im, wx, 14, wx + 5, 20, P["lamp"])
        outline_rect(im, wx - 1, 13, wx + 6, 21, P["ink"])
        vline(im, wx + 2, 14, 20, P["lamp_d"])
        hline(im, wx, wx + 5, 17, P["lamp_d"])
    outline_rect(im, 5, 9, 41, 29, P["ink"])
    fill_rect(im, 34, 4, 38, 10, P["hull"])
    outline_rect(im, 33, 3, 39, 10, P["ink"])
    if snow:
        hline(im, 34, 38, 3, P["panel"])
    return im


def draw_shed(snow=False):
    im = new(24, 24)
    fill_rect(im, 3, 10, 20, 21, P["timber"])
    vline(im, 3, 10, 21, P["timber_l"])
    vline(im, 20, 10, 21, P["hull"])
    for i in range(7):
        hline(im, 3 + i, 20 - i, 9 - i, P["hull"])
        put(im, 2 + i, 9 - i, P["ink"])
        put(im, 21 - i, 9 - i, P["ink"])
    hline(im, 9, 14, 3, P["ink"])
    if snow:
        for i in range(5):
            hline(im, 4 + i, 19 - i, 8 - i, P["panel"])
    outline_rect(im, 2, 9, 21, 22, P["ink"])
    fill_rect(im, 10, 14, 15, 21, P["hull_d"])
    outline_rect(im, 9, 13, 16, 22, P["ink"])
    return im


def compose_harbour(width, height, year=1, lit=("pier", "headland"), voyage="leaving", frame=1):
    im = Image.new("RGBA", (width, height), P["sky"])
    winter = year == 2
    sky_h = int(height * 0.46)
    sand_h = max(16, int(height * 0.16))
    water_h = height - sky_h - sand_h + 8
    paste(im, sky_band(width, sky_h + 8, winter), 0, 0)
    paste(im, water_band(width, water_h, winter), 0, sky_h - 4)
    paste(im, sand_band(width, sand_h + 4, winter), 0, height - sand_h)
    paste(im, draw_office(snow=winter), 8, height - sand_h - 20)
    shed = draw_shed(snow=winter)
    paste(im, shed, width - 52, height - sand_h - 12)
    paste(im, shed, width - 30, height - sand_h - 10)
    qy = height - sand_h - 4
    fill_rect(im, int(width * 0.16), qy, int(width * 0.74), qy + 4, P["timber"])
    hline(im, int(width * 0.16), int(width * 0.74), qy, P["timber_l"])
    hline(im, int(width * 0.16), int(width * 0.74), qy + 4, P["hull"])
    outline_rect(im, int(width * 0.16) - 1, qy - 1, int(width * 0.74) + 1, qy + 5, P["ink"])
    if winter:
        hline(im, int(width * 0.16), int(width * 0.74), qy, P["panel"])
    ids = ["pier", "headland", "reed", "quay"]
    short = height <= 160
    for i, kind in enumerate(ids):
        lx = int(width * (0.42 + i * 0.1)) - 8
        tw = draw_tower(kind, kind in lit, short=short, snow=winter)
        ty = max(2, sky_h - (tw.height - 10))
        paste(im, tw, lx, ty)
    if year == 2:
        gx = int(width * 0.85) - 8
        g = draw_tower("glass", "glass" in lit, short=short, snow=True)
        ty = max(2, sky_h - (g.height - 10))
        paste(im, g, gx, ty)
    facing = "right" if voyage == "leaving" else "left"
    bx = int(width * (0.22 if voyage == "leaving" else 0.55))
    paste(im, draw_bark(frame, facing), bx, sky_h + 8)
    return im


def composed_strip(width, current="quay", done=("pier", "headland", "reed"), year=1, progress=None):
    height = 48
    winter = year == 2
    im = Image.new("RGBA", (width, height), P["paper"])
    paste(im, strip_bg(width, winter=winter, height=32), 0, 0)
    n = len(STOPS)
    pad = 8 if width <= 384 else 16
    cell = (width - pad * 2) // n
    progress = progress or {
        "pier": "LIT", "headland": "LIT", "reed": "LIT",
        "quay": "11/16", "voyage": "0/4", "frost": "-", "glass": "-",
    }
    for i, (kind, full, short) in enumerate(STOPS):
        if kind in done:
            state = "done"
        elif kind == current:
            state = "current"
        else:
            state = "locked"
        icon = icon_state(kind, state)
        cx = pad + i * cell + (cell - 24) // 2
        paste(im, icon, cx, 4)
        label = short if width <= 384 else full
        lx = pad + i * cell + max(0, (cell - text_width(label)) // 2)
        draw_text(im, lx, 33, label, P["ink"])
        if i < n - 1:
            nx = pad + (i + 1) * cell + (cell - 24) // 2
            x0, x1, y = cx + 24, nx - 1, 16
            if kind in done and (STOPS[i + 1][0] in done or STOPS[i + 1][0] == current):
                col = P["timber"]
            elif kind == current:
                col = P["lamp"]
            else:
                col = P["water_m"]
            if col == P["water_m"]:
                x = x0
                while x < x1:
                    hline(im, x, min(x1, x + 1), y, col)
                    x += 3
            else:
                hline(im, x0, x1, y, col)
    if width >= 640:
        fill_rect(im, 0, 40, width - 1, height - 1, P["paper"])
        for i, (kind, full, short) in enumerate(STOPS):
            prog = progress.get(kind, "")
            px_ = pad + i * cell + max(0, (cell - text_width(prog)) // 2)
            draw_text(im, px_, 41, prog, P["hull"])
    return im
