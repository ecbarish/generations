"""ART-SF-6: loose frontier props on one indexed sheet. Generate or --check."""
from io import BytesIO
from pathlib import Path
import argparse
import json
from PIL import Image, ImageDraw
import starfall_ground as ground
import starfall_stockade as stockade

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / 'starfall-godot/assets/env/frontier'
REVIEW = ROOT / 'docs/art/starfall'
C = ground.C
# Atlas cells. Plot sits under the short props; lanterns occupy the middle band.
CELLS = {
    'barrel': (0, 0), 'crate': (16, 0), 'firewood': (32, 0), 'bunting': (48, 0),
    'lantern-unlit': (0, 16), 'lantern-lit': (16, 16), 'cart': (32, 16),
    'plot': (0, 48),
}
ATLAS = (112, 96)


def pack_hex(text):
    """Palette padding is a long zero run. Store it as {0*N} so a text commit
    cannot shorten it. --check expands the marker before comparing bytes."""
    import re
    return re.sub(r'0{16,}', lambda m: '{0*%d}' % len(m.group(0)), text)


def read_packed(hex_path):
    """Packed hex, or the same text split into `.part*` files joined in order.

    Contact part02 is only its first 5000 characters; part02b is the rest.
    """
    parts = sorted(hex_path.parent.glob(hex_path.name + '.part*'))
    if parts:
        chunks = []
        for part in parts:
            text = part.read_text()
            if part.name.endswith('.part02'):
                text = text[:5000]
            chunks.append(text)
        return ''.join(chunks)
    return hex_path.read_text()


def unpack_hex(text):
    import re
    return re.sub(r'\{0\*(\d+)\}', lambda m: '0' * int(m.group(1)), text)


def new(size):
    im = ground.image(size)
    return im, ImageDraw.Draw(im)


def barrel():
    im, d = new((16, 16))
    d.rounded_rectangle((3, 2, 12, 14), radius=2, fill=C['log'], outline=C['ink'])
    d.line((5, 3, 5, 13), fill=C['log_l'])
    d.line((11, 4, 11, 13), fill=C['log_d'])
    for y in (5, 11):
        d.line((4, y, 11, y), fill=C['stone_d'])
    return im, {'size': [16, 16], 'footprint_rect': [3, 10, 10, 5],
                'footprint_tiles': [1, 1], 'height_tiles': 1, 'solid': True}


def crate():
    im, d = new((16, 16))
    d.rectangle((2, 4, 13, 14), fill=C['plank'], outline=C['ink'])
    d.line((3, 5, 12, 5), fill=C['shake_l'])
    d.line((3, 5, 3, 13), fill=C['shake_l'])
    d.line((12, 6, 12, 13), fill=C['log_d'])
    d.line((3, 13, 12, 13), fill=C['log_d'])
    d.line((3, 6, 12, 13), fill=C['log'])
    d.line((3, 13, 12, 6), fill=C['log_d'])
    return im, {'size': [16, 16], 'footprint_rect': [2, 10, 12, 5],
                'footprint_tiles': [1, 1], 'height_tiles': 1, 'solid': True}


def firewood():
    im, d = new((16, 16))
    for i, y in enumerate((4, 8, 12)):
        d.rounded_rectangle((2, y - 3, 13, y + 1), radius=1, fill=C['log'], outline=C['ink'])
        d.line((3, y - 2, 12, y - 2), fill=C['log_l'])
        d.ellipse((2, y - 3, 6, y + 1), fill=C['plank'], outline=C['ink'])
        d.point((4, y - 1), fill=C['log_d'])
        if i == 1:
            d.line((8, y - 2, 11, y), fill=C['log_d'])
    return im, {'size': [16, 16], 'footprint_rect': [2, 11, 12, 4],
                'footprint_tiles': [1, 1], 'height_tiles': 1, 'solid': True}


def lantern(lit):
    im, d = new((16, 32))
    d.rectangle((6, 14, 9, 31), fill=C['log'], outline=C['ink'])
    d.line((7, 15, 7, 30), fill=C['log_l'])
    d.line((8, 16, 8, 30), fill=C['log_d'])
    d.rectangle((4, 12, 11, 14), fill=C['log_d'], outline=C['ink'])
    d.line((7, 8, 7, 12), fill=C['ink'])
    d.rectangle((3, 2, 12, 11), fill=C['stone_d'], outline=C['ink'])
    d.line((4, 3, 11, 3), fill=C['stone_l'])
    glass = C['lamp'] if lit else C['stone']
    d.rectangle((5, 4, 10, 9), fill=glass, outline=C['ink'])
    if lit:
        d.rectangle((6, 5, 8, 7), fill=C['lamp_l'])
        d.point((9, 8), fill=C['plank'])
    else:
        d.line((6, 5, 6, 8), fill=C['stone_d'])
        d.point((8, 7), fill=C['ink'])
    return im, {'size': [16, 32], 'footprint_rect': [6, 26, 4, 6],
                'footprint_tiles': [1, 1], 'height_tiles': 2, 'solid': True,
                'glass_rect': [6, 5, 4, 4], 'state': 'lit' if lit else 'unlit'}


def cart():
    im, d = new((32, 24))
    d.rectangle((4, 8, 26, 14), fill=C['plank'], outline=C['ink'])
    d.line((5, 9, 25, 9), fill=C['shake_l'])
    for x in (8, 14, 20):
        d.line((x, 9, x, 13), fill=C['log_d'])
    d.rectangle((6, 5, 16, 9), fill=C['log'], outline=C['ink'])
    d.line((7, 6, 15, 6), fill=C['log_l'])
    d.line((22, 11, 30, 15), fill=C['log_d'])
    d.line((22, 10, 30, 14), fill=C['log_l'])
    for cx in (8, 22):
        d.ellipse((cx - 4, 12, cx + 4, 22), fill=C['stone_d'], outline=C['ink'])
        d.ellipse((cx - 2, 15, cx + 1, 19), fill=C['stone'], outline=C['ink'])
        d.point((cx - 1, 16), fill=C['stone_l'])
    return im, {'size': [32, 24], 'footprint_rect': [0, 8, 32, 16],
                'footprint_tiles': [2, 1], 'height_tiles': 1.5, 'solid': True}


def bunting():
    im, d = new((64, 16))
    d.line((1, 2, 62, 2), fill=C['ink'])
    d.line((1, 1, 62, 1), fill=C['plank'])
    colours = (C['banner'], C['guild'], C['banner'], C['guild'], C['banner'], C['lamp'])
    for i, colour in enumerate(colours):
        x = 4 + i * 10
        d.polygon([(x, 3), (x + 8, 3), (x + 4, 12)], fill=colour, outline=C['ink'])
        d.line((x + 1, 4, x + 4, 10), fill=C['shake_l'] if colour != C['lamp'] else C['lamp_l'])
    return im, {'size': [64, 16], 'footprint_rect': [0, 0, 64, 4],
                'footprint_tiles': [4, 1], 'height_tiles': 1, 'solid': False,
                'note': 'Decorative. Do not block walking.'}


def plot():
    im = ground.image((48, 48))
    mud = ground.soil('mud', 1)
    for y in range(48):
        for x in range(48):
            im.putpixel((x, y), mud.getpixel((x % 16, y % 16)))
    d = ImageDraw.Draw(im)
    # Four corner stakes and a sagging string. The mud inside stays walkable.
    stakes = [(3, 4), (40, 4), (3, 33), (40, 33)]
    for x, y in stakes:
        d.polygon([(x + 2, y), (x, y + 4), (x + 4, y + 4)], fill=C['log_l'], outline=C['ink'])
        d.rectangle((x, y + 4, x + 4, y + 14), fill=C['log'], outline=C['ink'])
        d.line((x + 1, y + 5, x + 1, y + 13), fill=C['log_l'])
    for x in range(8, 40):
        sag = 1 if 16 <= x <= 31 else 0
        im.putpixel((x, 7 + sag), C['ink'])
        im.putpixel((x, 6 + sag), C['plank'])
    for y in range(10, 36):
        sag = 1 if 20 <= y <= 30 else 0
        im.putpixel((7 + sag, y), C['ink'])
        im.putpixel((40 - sag, y), C['ink'])
    return im, {'size': [48, 48], 'footprint_rect': [0, 0, 48, 48],
                'footprint_tiles': [3, 3], 'height_tiles': 0, 'solid': False,
                'solid_rects': [[x, y + 4, 5, 11] for x, y in stakes],
                'note': 'Placement envelope. Walk the mud; only the stakes are solid.'}


def pieces():
    made = {
        'barrel': barrel(), 'crate': crate(), 'firewood': firewood(),
        'lantern-unlit': lantern(False), 'lantern-lit': lantern(True),
        'cart': cart(), 'bunting': bunting(), 'plot': plot(),
    }
    out = {}
    for name, (im, meta) in made.items():
        x, y = CELLS[name]
        meta = dict(meta)
        meta.update({'name': name, 'file': 'props.png', 'rect': [x, y, im.width, im.height]})
        out[name] = (im, meta)
    return out


def atlas_of(made):
    sheet = ground.image(ATLAS)
    for im, meta in made.values():
        x, y, w, h = meta['rect']
        assert im.size == (w, h)
        assert x + w <= ATLAS[0] and y + h <= ATLAS[1]
        sheet.paste(im, (x, y))
    return sheet


def crop(atlas, meta):
    x, y, w, h = meta['rect']
    return atlas.crop((x, y, x + w, y + h))


def scene(made):
    im = ground.image((384, 224))
    moss = [ground.soil('moss', v) for v in range(4)]
    for y in range(14):
        for x in range(24):
            im.paste(moss[(x * 3 + y * 5) % 4], (x * 16, y * 16))
    road = ground.road(10)  # east-west
    for x in range(24):
        im.paste(road, (x * 16, 8 * 16))
    order = [
        ('plot', 32, 48), ('bunting', 24, 22), ('barrel', 96, 72),
        ('crate', 116, 70), ('firewood', 140, 74),
        ('lantern-unlit', 176, 48), ('lantern-lit', 200, 48),
        ('cart', 240, 112),
    ]
    for name, x, y in order:
        stockade.paste(im, made[name][0], (x, y))
    person = ground.image((16, 24))
    d = ImageDraw.Draw(person)
    d.rectangle((5, 0, 10, 6), fill=C['plank'], outline=C['ink'])
    d.rectangle((3, 7, 12, 15), fill=C['guild'], outline=C['ink'])
    d.rectangle((4, 16, 6, 23), fill=C['log_d'])
    d.rectangle((9, 16, 11, 23), fill=C['log_d'])
    stockade.paste(im, person, (216, 120))
    return im


def contact(atlas, scene_im, made):
    names = list(CELLS)
    scale = 2
    gap = 8
    row_h = max(made[name][0].height for name in names) * scale
    top = 508
    sheet_h = top + row_h * 3 + gap * 2 + 28
    sheet = ground.image((800, sheet_h))
    sheet.paste(C['pine_d'], (0, 0, 800, sheet_h))
    d = ImageDraw.Draw(sheet)
    d.fontmode = '1'
    d.text((16, 8), 'ART-SF-6 / LOOSE PROPS ON ART-SF-1 GROUND / 16x24 PERSON', fill=C['lamp'])
    sheet.paste(scene_im.resize((768, 448), Image.Resampling.NEAREST), (16, 28))
    d.text((16, 486), 'x2 SPRITE / RED FOOTPRINT / INK SILHOUETTE', fill=C['lamp'])
    x = 16
    for name in names:
        im = crop(atlas, made[name][1])
        scaled = im.resize((im.width * scale, im.height * scale), Image.Resampling.NEAREST)
        stockade.paste(sheet, scaled, (x, top))
        marked = scaled.copy()
        md = ImageDraw.Draw(marked)
        fx, fy, fw, fh = made[name][1]['footprint_rect']
        md.rectangle((fx * scale, fy * scale, (fx + fw) * scale - 1, (fy + fh) * scale - 1), outline=C['banner'])
        stockade.paste(sheet, marked, (x, top + row_h + gap))
        sil = ground.image(scaled.size)
        sil.paste(C['ink'], (0, 0, *scaled.size), scaled.convert('RGBA').getchannel('A'))
        stockade.paste(sheet, sil, (x, top + (row_h + gap) * 2))
        d.text((x, top + (row_h + gap) * 3), name.replace('-', ' ')[:11], fill=C['lamp'])
        x += scaled.width + gap
    assert x <= 800
    return sheet


def meta_doc(made):
    return {
        'palette': 'docs/art/starfall/palette.gpl',
        'tile_size': 16,
        'file': 'props.png',
        'atlas_size': list(ATLAS),
        'origin': 'local top-left inside each rect; footprint_rect is the placement base',
        'pieces': {name: meta for name, (_, meta) in made.items()},
    }


def validate(atlas, made):
    assert atlas.size == ATLAS and atlas.mode == 'P' and atlas.info['transparency'] == 0
    assert set(atlas.tobytes()) <= set(range(len(ground.COLOURS)))
    masks = []
    for name, (im, meta) in made.items():
        cut = crop(atlas, meta)
        assert list(cut.tobytes()) == list(im.tobytes())
        alpha = cut.convert('RGBA').getchannel('A')
        assert alpha.getextrema()[1] == 255
        if name != 'plot':
            assert alpha.getextrema()[0] == 0
        x, y, w, h = meta['footprint_rect']
        assert x >= 0 and y >= 0 and x + w <= im.width and y + h <= im.height
        assert meta['footprint_tiles'] == [max(1, w // 16), max(1, h // 16)] or name == 'bunting'
        if meta.get('solid_rects'):
            for rect in meta['solid_rects']:
                rx, ry, rw, rh = rect
                assert rx >= 0 and ry >= 0 and rx + rw <= im.width and ry + rh <= im.height
        if name in ('barrel', 'crate', 'firewood'):
            masks.append(alpha.tobytes())
    assert len(set(masks)) == 3, 'Barrel, crate and firewood must not share a silhouette'
    unlit = made['lantern-unlit'][0]
    lit = made['lantern-lit'][0]
    assert unlit.convert('RGBA').getchannel('A').tobytes() == lit.convert('RGBA').getchannel('A').tobytes()
    gx, gy, gw, gh = made['lantern-lit'][1]['glass_rect']
    for y in range(32):
        for x in range(16):
            same = unlit.getpixel((x, y)) == lit.getpixel((x, y))
            inside = gx <= x < gx + gw and gy <= y < gy + gh
            assert inside != same
            if inside:
                assert lit.getpixel((x, y)) in (C['lamp'], C['lamp_l'], C['plank'], C['ink'])
    assert made['cart'][1]['footprint_tiles'] == [2, 1]
    assert made['plot'][1]['footprint_tiles'] == [3, 3]
    assert made['plot'][1]['height_tiles'] == 0 and made['plot'][1]['solid'] is False
    assert made['bunting'][1]['solid'] is False
    plot_im = made['plot'][0]
    assert plot_im.getpixel((24, 24)) in (C['mud'], C['mud_d'], C['mud_l'])
    assert plot_im.getpixel((5, 12)) == C['log']
    flags = set(made['bunting'][0].tobytes())
    assert C['banner'] in flags and C['guild'] in flags
    assert C['stone_d'] in set(made['cart'][0].crop((4, 12, 13, 23)).tobytes())


def render():
    made = pieces()
    atlas = atlas_of(made)
    scene_im = scene(made)
    sheet = contact(atlas, scene_im, made)
    validate(atlas, made)
    return atlas, scene_im, sheet, meta_doc(made)


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--check', action='store_true')
    args = p.parse_args()
    atlas, scene_im, sheet, meta = render()
    outputs = {
        ASSETS / 'props.png': atlas,
        REVIEW / 'props-scene-1x.png': scene_im,
        REVIEW / 'props-contact.png': sheet,
    }
    for path, im in outputs.items():
        buf = BytesIO()
        im.save(buf, format='PNG', transparency=0)
        data = buf.getvalue()
        text = data.hex() + '\n'
        packed = pack_hex(text)
        # Packed hex is the committed byte copy. This writer can only push text,
        # and a PNG signature is not valid UTF-8, so --check locks the exact PNG
        # bytes in the .hex file. A long zero run is written as {0*N}. Running
        # without --check also writes the real PNG.
        hex_path = Path(str(path) + '.hex')
        if args.check:
            found = read_packed(hex_path)
            if hex_path.exists() and list(hex_path.parent.glob(hex_path.name + '.part*')):
                assert unpack_hex(hex_path.read_text()) == text, f'Stale art bytes: {hex_path}'
            assert unpack_hex(found) == text, f'Stale art bytes: {hex_path}'
            if path.exists():
                assert path.read_bytes() == data, f'Stale art: {path}'
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
            hex_path.write_text(packed)
    path = ASSETS / 'props.json'
    data = json.dumps(meta, indent=2) + '\n'
    if args.check:
        assert path.read_text() == data, 'Stale props.json'
    else:
        path.write_text(data)
    print('PASS: props sheet, footprints, lantern glass-only change, walkable plot, deterministic output')


if __name__ == '__main__':
    main()
