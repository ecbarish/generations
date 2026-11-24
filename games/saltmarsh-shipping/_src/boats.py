"""Bark sprite (48x32, 4 frames, two headings) and a 16x24 scale figure."""
from PIL import Image
from palette import P
from draw import new, put, hline, vline, fill_rect, outline_rect, paste, fill_triangle


def draw_bark(frame, facing="right"):
    """Three-masted bark, 48x32. Bow to the right when leaving. 4-frame bob and sail flutter."""
    im = new(48, 32)
    bob = (0, 1, 0, -1)[frame % 4]
    flutter = (0, 1, 0, 1)[frame % 4]
    hy = 21 + bob
    # Hull: transom at left, pointed bow at right. Light from the upper left.
    fill_rect(im, 8, hy, 36, hy + 4, P["hull"])
    hline(im, 8, 36, hy, P["timber_l"])
    hline(im, 8, 36, hy + 1, P["timber"])
    hline(im, 9, 35, hy + 3, P["hull_d"])
    hline(im, 10, 34, hy + 4, P["hull_d"])
    # transom
    vline(im, 7, hy + 1, hy + 3, P["hull"])
    vline(im, 6, hy + 1, hy + 2, P["hull_d"])
    # bow taper
    put(im, 37, hy, P["timber_l"])
    put(im, 37, hy + 1, P["timber"])
    put(im, 37, hy + 2, P["hull"])
    put(im, 37, hy + 3, P["hull_d"])
    put(im, 38, hy + 1, P["timber"])
    put(im, 38, hy + 2, P["hull"])
    put(im, 39, hy + 1, P["timber_l"])
    put(im, 39, hy + 2, P["hull"])
    put(im, 40, hy + 2, P["timber"])
    put(im, 41, hy + 2, P["timber_l"])
    # ink outline around the hull
    hline(im, 8, 36, hy - 1, P["ink"])
    hline(im, 8, 36, hy + 5, P["ink"])
    vline(im, 5, hy + 1, hy + 2, P["ink"])
    put(im, 6, hy, P["ink"])
    put(im, 6, hy + 3, P["ink"])
    put(im, 7, hy - 1, P["ink"])
    put(im, 7, hy + 4, P["ink"])
    put(im, 37, hy - 1, P["ink"])
    put(im, 37, hy + 4, P["ink"])
    put(im, 38, hy, P["ink"])
    put(im, 38, hy + 3, P["ink"])
    put(im, 39, hy, P["ink"])
    put(im, 39, hy + 3, P["ink"])
    put(im, 40, hy + 1, P["ink"])
    put(im, 40, hy + 3, P["ink"])
    put(im, 41, hy + 1, P["ink"])
    put(im, 41, hy + 3, P["ink"])
    put(im, 42, hy + 2, P["ink"])
    # bowsprit
    hline(im, 42, 45, hy + 2, P["ink"])
    put(im, 43, hy + 1, P["timber"])
    # rail
    hline(im, 9, 35, hy - 1, P["ink"])
    hline(im, 10, 34, hy - 1, P["timber"])
    # Three masts with triangular sails blowing toward the bow (right).
    # (fore, main, mizzen), main is tallest.
    masts = ((15, 6, 8 + flutter), (25, 4, 9 + flutter), (33, 7, 6 + flutter))
    for mx, top, sail_w in masts:
        vline(im, mx, top, hy - 1, P["ink"])
        vline(im, mx, top + 1, hy - 2, P["mist"])
        # yard
        hline(im, mx - 1, mx + 2, top, P["ink"])
        # sail triangle: mast -> out and down, back to mast
        tip = (mx + sail_w, hy - 8)
        top_pt = (mx + 1, top + 1)
        bot_pt = (mx + 1, hy - 4)
        fill_triangle(im, top_pt, tip, bot_pt, P["mist"])
        # upper-left light and lower-right shade on the sail
        hline(im, mx + 1, min(mx + 3, tip[0]), top + 1, P["panel"])
        put(im, tip[0] - 1, tip[1] + 1, P["sky"])
        # ink sail edge
        # hypotenuse
        x0, y0 = top_pt
        x1, y1 = tip
        steps = max(abs(x1 - x0), abs(y1 - y0)) or 1
        for i in range(steps + 1):
            put(im, x0 + (x1 - x0) * i // steps, y0 + (y1 - y0) * i // steps, P["ink"])
        x0, y0 = tip
        x1, y1 = bot_pt
        steps = max(abs(x1 - x0), abs(y1 - y0)) or 1
        for i in range(steps + 1):
            put(im, x0 + (x1 - x0) * i // steps, y0 + (y1 - y0) * i // steps, P["ink"])
        vline(im, mx + 1, top + 1, hy - 4, P["ink"])
        # main gets a small topsail
        if mx == 25:
            fill_triangle(im, (mx + 1, top - 2), (mx + 4 + flutter, top + 1), (mx + 1, top + 1), P["mist"])
            put(im, mx + 1, top - 2, P["ink"])
            put(im, mx + 2, top - 2, P["ink"])
            put(im, mx + 4 + flutter, top + 1, P["ink"])
    # jib from the foremast toward the bowsprit
    fill_triangle(im, (34, 9), (44, hy + 1), (34, hy - 5), P["mist"])
    steps = max(abs(44 - 34), abs((hy + 1) - 9)) or 1
    for i in range(steps + 1):
        put(im, 34 + (44 - 34) * i // steps, 9 + ((hy + 1) - 9) * i // steps, P["ink"])
    # stern lamp, aft (left while facing right)
    put(im, 8, hy, P["lamp"])
    put(im, 9, hy, P["lamp_d"])
    put(im, 8, hy - 1, P["lamp"])
    put(im, 7, hy, P["ink"])
    put(im, 8, hy - 2, P["ink"])
    put(im, 9, hy - 1, P["ink"])
    # wake
    if frame % 2 == 1:
        put(im, 3, hy + 5, P["panel"])
        put(im, 5, hy + 4, P["mist"])
        put(im, 44, hy + 5, P["mist"])
    else:
        put(im, 4, hy + 4, P["mist"])
        put(im, 43, hy + 5, P["panel"])
    if facing == "left":
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
    return im


def bark_sheet():
    cell_w, cell_h = 48, 32
    sheet = new(cell_w * 4, cell_h * 2)
    coords = {}
    for r, facing in enumerate(("right", "left")):
        for f in range(4):
            spr = draw_bark(f, facing)
            paste(sheet, spr, f * cell_w, r * cell_h)
            key = ("leaving" if facing == "right" else "home") + f"-{f}"
            coords[key] = {"x": f * cell_w, "y": r * cell_h, "w": cell_w, "h": cell_h}
    return sheet, coords


def person():
    im = new(16, 24)
    fill_rect(im, 6, 1, 9, 4, P["sand"])
    outline_rect(im, 5, 0, 10, 5, P["ink"])
    put(im, 6, 3, P["hull_d"])
    put(im, 9, 3, P["hull_d"])
    fill_rect(im, 6, 0, 9, 0, P["hull"])
    hline(im, 4, 11, 1, P["ink"])
    hline(im, 5, 10, 0, P["ink"])
    fill_rect(im, 5, 7, 10, 15, P["timber"])
    vline(im, 5, 7, 15, P["timber_l"])
    vline(im, 10, 7, 15, P["hull"])
    outline_rect(im, 4, 6, 11, 16, P["ink"])
    fill_rect(im, 12, 10, 14, 12, P["lamp"])
    outline_rect(im, 11, 9, 15, 13, P["ink"])
    fill_rect(im, 5, 17, 7, 22, P["hull"])
    fill_rect(im, 9, 17, 11, 22, P["hull_d"])
    outline_rect(im, 4, 16, 8, 23, P["ink"])
    outline_rect(im, 8, 16, 12, 23, P["ink"])
    return im
