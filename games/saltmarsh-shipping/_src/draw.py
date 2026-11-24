"""Pixel-safe drawing helpers. No anti-aliasing, binary alpha only."""
from palette import P, TRANSPARENT
from PIL import Image

# 5x7 caps + digits + a few marks, palette-safe labels on mocks.
FONT = {
    "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
    "B": ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
    "C": ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
    "D": ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
    "E": ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
    "F": ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
    "G": ["01110", "10001", "10000", "10111", "10001", "10001", "01110"],
    "H": ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
    "I": ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
    "J": ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
    "K": ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
    "L": ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
    "M": ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
    "N": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
    "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
    "P": ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
    "Q": ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
    "R": ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
    "S": ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
    "T": ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
    "U": ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
    "V": ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
    "W": ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
    "X": ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
    "Y": ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
    "Z": ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
    "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
    "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
    "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
    "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
    "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
    "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
    "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
    "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
    "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
    "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
    "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
    ":": ["00000", "00100", "00100", "00000", "00100", "00100", "00000"],
    ".": ["00000", "00000", "00000", "00000", "00000", "00100", "00100"],
    "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
    " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
    "'": ["00100", "00100", "00000", "00000", "00000", "00000", "00000"],
}


def new(w, h):
    return Image.new("RGBA", (w, h), TRANSPARENT)


def put(im, x, y, c):
    if c is None:
        return
    if 0 <= x < im.width and 0 <= y < im.height:
        im.putpixel((int(x), int(y)), c)


def hline(im, x0, x1, y, c):
    if x1 < x0:
        x0, x1 = x1, x0
    for x in range(int(x0), int(x1) + 1):
        put(im, x, y, c)


def vline(im, x, y0, y1, c):
    if y1 < y0:
        y0, y1 = y1, y0
    for y in range(int(y0), int(y1) + 1):
        put(im, x, y, c)


def fill_rect(im, x0, y0, x1, y1, c):
    if x1 < x0:
        x0, x1 = x1, x0
    if y1 < y0:
        y0, y1 = y1, y0
    for y in range(int(y0), int(y1) + 1):
        for x in range(int(x0), int(x1) + 1):
            put(im, x, y, c)


def outline_rect(im, x0, y0, x1, y1, c):
    hline(im, x0, x1, y0, c)
    hline(im, x0, x1, y1, c)
    vline(im, x0, y0, y1, c)
    vline(im, x1, y0, y1, c)


def fill_triangle(im, a, b, c, col):
    """Integer scan fill. No anti-aliasing."""
    ax, ay = a
    bx, by = b
    cx_, cy = c
    minx, maxx = min(ax, bx, cx_), max(ax, bx, cx_)
    miny, maxy = min(ay, by, cy), max(ay, by, cy)

    def edge(x0, y0, x1, y1, x, y):
        return (x - x0) * (y1 - y0) - (y - y0) * (x1 - x0)

    s0 = edge(ax, ay, bx, by, cx_, cy)
    if s0 == 0:
        return
    for y in range(miny, maxy + 1):
        for x in range(minx, maxx + 1):
            w0 = edge(bx, by, cx_, cy, x, y)
            w1 = edge(cx_, cy, ax, ay, x, y)
            w2 = edge(ax, ay, bx, by, x, y)
            if (s0 > 0 and w0 >= 0 and w1 >= 0 and w2 >= 0) or (s0 < 0 and w0 <= 0 and w1 <= 0 and w2 <= 0):
                put(im, x, y, col)


def disk(im, cx, cy, r, c):
    r2 = r * r
    for y in range(-r, r + 1):
        for x in range(-r, r + 1):
            if x * x + y * y <= r2:
                put(im, cx + x, cy + y, c)


def paste(dst, src, x, y):
    dst.alpha_composite(src, (int(x), int(y)))


def text_width(s):
    return len(s) * 6 - 1 if s else 0


def draw_text(im, x, y, s, c, shadow=None):
    s = s.upper()
    cx = x
    for ch in s:
        glyph = FONT.get(ch, FONT[" "])
        for row, bits in enumerate(glyph):
            for col, bit in enumerate(bits):
                if bit == "1":
                    if shadow:
                        put(im, cx + col + 1, y + row + 1, shadow)
                    put(im, cx + col, y + row, c)
        cx += 6


def shaft(im, x0, x1, y0, y1, light, mid, dark, ink=True):
    w = x1 - x0 + 1
    for x in range(x0, x1 + 1):
        t = (x - x0) / max(1, w - 1)
        if t < 0.35:
            c = light
        elif t > 0.7:
            c = dark
        else:
            c = mid
        vline(im, x, y0, y1, c)
    if ink:
        vline(im, x0 - 1, y0, y1, P["ink"])
        vline(im, x1 + 1, y0, y1, P["ink"])
        hline(im, x0 - 1, x1 + 1, y0 - 1, P["ink"])


def lantern_room(im, x0, y0, x1, y1, lit, glass=False):
    fill_rect(im, x0, y0, x1, y1, P["lamp"] if lit else P["water"])
    if lit:
        hline(im, x0, x1 - 1, y0, P["panel"])
        vline(im, x0, y0, y1 - 1, P["lamp"])
        hline(im, x0 + 1, x1, y1, P["lamp_d"])
        vline(im, x1, y0 + 1, y1, P["lamp_d"])
        put(im, x0 + 1, y0 + 1, P["panel"])
    else:
        hline(im, x0, x1 - 1, y0, P["water_m"])
        vline(im, x0, y0, y1 - 1, P["water_m"])
        hline(im, x0 + 1, x1, y1, P["hull_d"])
        vline(im, x1, y0 + 1, y1, P["hull_d"])
        if glass:
            mx = (x0 + x1) // 2
            my = (y0 + y1) // 2
            vline(im, mx, y0, y1, P["mist"])
            hline(im, x0, x1, my, P["mist"])
    outline_rect(im, x0 - 1, y0 - 1, x1 + 1, y1 + 1, P["ink"])
    hline(im, x0 - 1, x1 + 1, y0 - 2, P["ink"])
    hline(im, x0, x1, y0 - 3, P["ink"])
    fill_rect(im, x0, y0 - 2, x1, y0 - 2, P["hull"] if not lit else P["lamp_d"])
    if lit:
        cx = (x0 + x1) // 2
        cy = (y0 + y1) // 2
        for dx, dy in ((-2, 0), (2, 0), (0, -2), (0, 2), (-3, -1), (3, -1), (-3, 1), (3, 1)):
            x, y = cx + dx, cy + dy
            if 0 <= x < im.width and 0 <= y < im.height and im.getpixel((x, y))[3] == 0:
                put(im, x, y, P["lamp"])


def current_glow(im):
    w, h = im.size
    glow = new(w, h)
    for y in range(h):
        for x in range(w):
            if im.getpixel((x, y))[3] == 0:
                continue
            for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, -1), (-1, 1), (1, 1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and im.getpixel((nx, ny))[3] == 0:
                    put(glow, nx, ny, P["lamp"] if abs(dx) + abs(dy) == 1 else P["lamp_d"])
    out = new(w, h)
    paste(out, glow, 0, 0)
    paste(out, im, 0, 0)
    return out


def mute_locked(im):
    swap = {
        P["lamp"]: P["sand_d"],
        P["lamp_d"]: P["hull"],
        P["panel"]: P["mist"],
        P["timber_l"]: P["timber"],
        P["reed_l"]: P["reed"],
        P["paper"]: P["mist"],
    }
    out = new(*im.size)
    for y in range(im.height):
        for x in range(im.width):
            p = im.getpixel((x, y))
            if p[3] == 0:
                continue
            out.putpixel((x, y), swap.get(p, p))
    return out
