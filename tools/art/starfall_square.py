"""ART-SF-8: dressing for Starfall's square and roads, on one indexed sheet. Generate or --check.

Worn ruts, puddles, scuffed earth and grass tufts lie flat on the ground (never solid); the bench and the hitching
rail stand on a 2x1 footprint and block it, like any prop. The plank step goes under the apothecary's, the healer's
and the tavern's doors, as tools/art/starfall_hall_inn.py does for the hall and the inn.
    PYTHONDONTWRITEBYTECODE=1 python tools/art/starfall_square.py [--check]
"""
from io import BytesIO
from pathlib import Path
import argparse
import json
from PIL import Image, ImageDraw
import starfall_ground as ground

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / 'starfall-godot/assets/env/frontier'
REVIEW = ROOT / 'docs/art/starfall'
C = ground.C
ATLAS = (128, 32)
CELLS = {'ruts-h': (0, 0), 'ruts-v': (16, 0), 'puddle-a': (32, 0), 'puddle-b': (48, 0), 'tuft-a': (64, 0),
         'tuft-b': (80, 0), 'scuff': (96, 0), 'step': (112, 0), 'bench': (0, 16), 'hitch': (32, 16)}


def new(size):
    im = ground.image(size)
    return im, ImageDraw.Draw(im)


def flat(size=(16, 16)):
    return {'size': list(size), 'footprint_rect': [0, 0, size[0], size[1]], 'footprint_tiles': [1, 1],
            'height_tiles': 0, 'solid': False}


def ruts(vertical):
    im, d = new((16, 16))
    for a in (6, 9):                           # two wheel ruts, worn dark, a lighter lip on the lit (upper left) side
        for b in range(16):
            if (b * 5 + a) % 7 == 0:
                continue                       # broken here and there, so the tiles don't read as rails
            x, y = (a, b) if vertical else (b, a)
            d.point((x, y), fill=C['mud_d'])
            lx, ly = (x - 1, y) if vertical else (x, y - 1)
            d.point((lx, ly), fill=C['mud_l'])
    return im, flat()


def puddle(variant):
    im, d = new((16, 16))
    box = (2, 5, 13, 12) if variant == 0 else (4, 3, 12, 9)
    d.ellipse(box, fill=C['water'], outline=C['mud_d'])
    x0, y0 = box[0] + 2, box[1] + 2
    d.line((x0, y0, x0 + 3, y0), fill=C['water_l'])  # the sky caught on the top-left
    d.point((box[2] - 3, box[3] - 2), fill=C['pine_d'])
    if variant == 1:
        d.ellipse((9, 10, 13, 13), fill=C['water'], outline=C['mud_d'])
    return im, flat()


def tuft(variant):
    im, d = new((16, 16))
    blades = [(3, 14, 2, 9), (5, 14, 6, 8), (7, 14, 9, 10)] if variant == 0 else [(8, 14, 7, 10), (10, 14, 11, 8), (12, 14, 14, 11), (4, 14, 3, 11)]
    for x0, y0, x1, y1 in blades:
        d.line((x0, y0, x1, y1), fill=C['moss_d'])
        d.point((x1, y1), fill=C['moss_l'])
    return im, flat()


def scuff():
    im, d = new((16, 16))
    for x, y in ((3, 4), (6, 9), (10, 5), (12, 12), (4, 13)):  # boot prints and a dropped wisp of straw
        d.rectangle((x, y, x + 1, y + 2), fill=C['mud_d'])
    d.line((8, 13, 12, 11), fill=C['plank'])
    return im, flat()


def step():
    # A plank step, 14x6 with outline: top board in light, riser in shadow; sits from the door sill to the ground.
    im, d = new((16, 8))
    d.rectangle((1, 1, 14, 6), fill=C['log'], outline=C['ink'])
    d.line((2, 2, 13, 2), fill=C['plank'])
    d.line((2, 3, 13, 3), fill=C['log_l'])
    d.line((2, 5, 13, 5), fill=C['log_d'])
    return im, {'size': [16, 8], 'footprint_rect': [0, 0, 16, 8], 'footprint_tiles': [1, 1], 'height_tiles': 0,
                'solid': False, 'anchor': 'bottom centre under the door rect; the door tile stays walkable'}


def bench():
    im, d = new((32, 16))
    d.rectangle((3, 6, 28, 9), fill=C['plank'], outline=C['ink'])      # the seat
    d.line((4, 7, 27, 7), fill=C['shake_l'])
    d.line((4, 9, 27, 9), fill=C['log_d'])
    for x in (6, 24):                                                   # split-log legs
        d.rectangle((x, 10, x + 2, 14), fill=C['log'], outline=C['ink'])
        d.line((x + 1, 11, x + 1, 13), fill=C['log_l'])
    return im, {'size': [32, 16], 'footprint_rect': [3, 10, 26, 5], 'footprint_tiles': [2, 1], 'height_tiles': 0.5,
                'solid': True}


def hitch():
    im, d = new((32, 16))
    for x in (4, 25):                                                   # two posts and a rail, a trough between
        d.rectangle((x, 2, x + 3, 15), fill=C['log'], outline=C['ink'])
        d.line((x + 1, 3, x + 1, 14), fill=C['log_l'])
    d.rectangle((5, 3, 27, 5), fill=C['log'], outline=C['ink'])
    d.line((6, 4, 26, 4), fill=C['log_l'])
    d.rectangle((9, 10, 23, 14), fill=C['plank'], outline=C['ink'])
    d.line((10, 11, 22, 11), fill=C['water'])
    d.point((11, 11), fill=C['water_l'])
    d.line((14, 6, 15, 9), fill=C['mud_l'])                             # a lead rope, looped over the rail
    return im, {'size': [32, 16], 'footprint_rect': [4, 10, 25, 6], 'footprint_tiles': [2, 1], 'height_tiles': 1,
                'solid': True}


def pieces():
    return {'ruts-h': ruts(False), 'ruts-v': ruts(True), 'puddle-a': puddle(0), 'puddle-b': puddle(1),
            'tuft-a': tuft(0), 'tuft-b': tuft(1), 'scuff': scuff(), 'step': step(), 'bench': bench(), 'hitch': hitch()}


def atlas_of(made):
    atlas = ground.image(ATLAS)
    for name, (im, meta) in made.items():
        x, y = CELLS[name]
        atlas.paste(im, (x, y))
        meta['rect'] = [x, y, im.width, im.height]
        meta['file'] = 'square.png'
    return atlas


def validate(atlas, made):
    assert atlas.size == ATLAS and atlas.mode == 'P'
    assert set(atlas.tobytes()) <= set(range(len(ground.COLOURS))), 'palette colours only'
    for name, (im, meta) in made.items():
        x, y, w, h = meta['rect']
        assert x + w <= ATLAS[0] and y + h <= ATLAS[1], name
        alpha = im.convert('RGBA').getchannel('A')
        assert alpha.getextrema() == (0, 255), name + ' needs a transparent background and some pixels'


def contact(atlas):
    # every piece at 3x on moss and mud, beside a 16x24 review person
    tiles = Image.open(ASSETS / 'ground.png').convert('RGBA')
    scene = Image.new('RGBA', (160, 48))
    for x in range(0, 160, 16):
        for y in range(0, 48, 16):
            src = (64 + 16 * ((x // 16) % 2), 0) if y == 16 else ((x // 16) % 4 * 16, 0)
            src = (6 * 16, 0) if y == 16 else src
            scene.paste(tiles.crop((src[0], src[1], src[0] + 16, src[1] + 16)), (x, y))
    a = atlas.convert('RGBA')
    for i, n in enumerate(['ruts-h', 'puddle-a', 'scuff']):
        r = CELLS[n]; scene.alpha_composite(a.crop((r[0], r[1], r[0] + 16, r[1] + 16)), (16 + i * 32, 16))
    for i, n in enumerate(['tuft-a', 'tuft-b']):
        r = CELLS[n]; scene.alpha_composite(a.crop((r[0], r[1], r[0] + 16, r[1] + 16)), (112 + i * 16, 0))
    for n, at in (('bench', (8, 32)), ('hitch', (64, 32))):
        r = CELLS[n]; scene.alpha_composite(a.crop((r[0], r[1], r[0] + 32, r[1] + 16)), at)
    d = ImageDraw.Draw(scene)                                           # the 16x24 review person
    ink = ground.COLOURS[C['ink']]
    d.rectangle((120, 22, 135, 45), outline=ink)
    sheet = Image.new('RGBA', (160 * 3, 48 * 3 + 32 * 3 + 8), (30, 26, 34, 255))
    sheet.paste(scene.resize((480, 144), Image.Resampling.NEAREST), (0, 0))
    sheet.alpha_composite(a.resize((384, 96), Image.Resampling.NEAREST), (0, 152))
    return sheet


def meta_doc(made):
    return {'palette': 'docs/art/starfall/palette.gpl', 'tile_size': 16, 'file': 'square.png',
            'atlas_size': list(ATLAS), 'origin': 'local top-left inside each rect; footprint_rect is the placement base',
            'pieces': {name: meta for name, (_, meta) in made.items()}}


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--check', action='store_true')
    args = p.parse_args()
    made = pieces()
    atlas = atlas_of(made)
    validate(atlas, made)
    outs = {ASSETS / 'square.png': atlas, REVIEW / 'square-contact.png': contact(atlas)}
    for path, im in outs.items():
        buf = BytesIO()
        im.save(buf, format='PNG', **({'transparency': 0} if im.mode == 'P' else {}))
        if args.check:
            assert path.read_bytes() == buf.getvalue(), 'Stale ' + path.name
        else:
            path.write_bytes(buf.getvalue())
    data = json.dumps(meta_doc(made), indent=2) + '\n'
    path = ASSETS / 'square.json'
    if args.check:
        assert path.read_text() == data, 'Stale square.json'
        print('PASS ART-SF-8 square sheet matches')
    else:
        path.write_text(data)


if __name__ == '__main__':
    main()
