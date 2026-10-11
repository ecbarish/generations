"""ART-SF-1: deterministic, palette-indexed 16 px frontier ground and review patch.
Run from anywhere: python tools/art/starfall_ground.py [--check]. No game integration.
Road masks: north=1, east=2, south=4, west=8. Atlas: 8 columns, 4 rows.
"""
from pathlib import Path
from io import BytesIO
import argparse
import json
import random
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
PALETTE = ROOT / 'docs/art/starfall/palette.gpl'
ASSETS = ROOT / 'starfall-godot/assets/env/frontier'
REVIEW = ROOT / 'docs/art/starfall'
TILE = 16
COLS = 8


def palette():
    colours, names = [(0, 0, 0)], {}
    for line in PALETTE.read_text().splitlines():
        parts = line.split()
        if len(parts) == 4 and all(p.isdigit() for p in parts[:3]):
            names[parts[3]] = len(colours)
            colours.append(tuple(map(int, parts[:3])))
    assert len(colours) == 28, 'Expected the approved 27-colour palette'
    return colours, names

COLOURS, C = palette()


def image(size):
    im = Image.new('P', size, 0)
    im.putpalette([v for rgb in COLOURS for v in rgb] + [0] * (768 - len(COLOURS) * 3))
    im.info['transparency'] = 0
    return im


def soil(material, variant):
    im = image((16, 16))
    im.paste(C[material], (0, 0, 16, 16))
    # Shared edge grain makes all variants join; the interior varies without a tile motif.
    for y in range(16):
        for x in range(16):
            seed = ((x % 15) * 193 + (y % 15) * 307 + (variant * 997 if 0 < x < 15 and 0 < y < 15 else 0))
            n = random.Random(seed + (71 if material == 'mud' else 0)).randrange(32)
            if n < 3:
                im.putpixel((x, y), C[material + ('_d' if n < 2 else '_l')])
    return im


def road(mask):
    im = soil('moss', 0)
    mud = soil('mud', 0)
    cells = {(x, y) for y in range(4, 12) for x in range(4, 12)}
    for bit, area in [(1, (4, 0, 12, 4)), (2, (12, 4, 16, 12)),
                      (4, (4, 12, 12, 16)), (8, (0, 4, 4, 12))]:
        if mask & bit:
            x0, y0, x1, y1 = area
            cells.update((x, y) for y in range(y0, y1) for x in range(x0, x1))
    for x, y in cells:
        # A soft earthen lip, never black grid outlines around ground tiles.
        edge = any(0 <= a < 16 and 0 <= b < 16 and (a, b) not in cells
                   for a, b in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)])
        im.putpixel((x, y), C['mud_d'] if edge else mud.getpixel((x, y)))
    return im


def footing(kind):
    im = image((16, 16))
    d = ImageDraw.Draw(im)
    vertical = kind >= 3 and kind < 6
    cap = kind % 3
    box = (5, 0 if cap != 0 else 2, 10, 15 if cap != 2 else 13) if vertical else (0 if cap != 0 else 2, 9, 15 if cap != 2 else 13, 14)
    if kind >= 6:
        box = (1, 8, 14, 15)
    d.rectangle(box, fill=C['stone'], outline=C['ink'])
    x0, y0, x1, y1 = box
    d.line((x0+1,y0+1,x1-1,y0+1), fill=C['stone_l'])
    d.line((x0+1,y0+1,x0+1,y1-1), fill=C['stone_l'])
    d.line((x0+1,y1-1,x1-1,y1-1), fill=C['stone_d'])
    if vertical:
        for y in range(4, 15, 5): d.line((6,y,9,y), fill=C['stone_d'])
    else:
        for x in range(5 if kind != 7 else 8, 15, 6): d.line((x,11,x,13), fill=C['stone_d'])
    # Open strip ends have no seam outline: cap variants close only the outer end.
    if kind in (0, 1, 2):
        for x in ([15] if kind == 0 else [0] if kind == 2 else [0,15]):
            for y in range(10,14): im.putpixel((x,y), C['stone_l'] if y == 10 else C['stone_d'] if y == 13 else C['stone'])
    if vertical:
        for y in ([15] if cap == 0 else [0] if cap == 2 else [0,15]):
            for x in range(6,10): im.putpixel((x,y), C['stone_l'] if x == 6 else C['stone'])
    return im


def render():
    tiles = [soil('moss', v) for v in range(4)] + [road(m) for m in range(16)]
    tiles += [soil('mud', v) for v in range(4)] + [footing(k) for k in range(8)]
    atlas = image((128, 64))
    for i, tile in enumerate(tiles): atlas.paste(tile, ((i % COLS)*16, (i // COLS)*16))
    patch = image((384,224))
    paths = {(x,7) for x in range(24)} | {(11,y) for y in range(2,14)}
    paths |= {(4,y) for y in range(2,8)} | {(x,2) for x in range(4,9)}
    paths |= {(19,y) for y in range(7,12)} | {(x,11) for x in range(16,20)}
    square = {(x,y) for x in range(10,14) for y in range(6,10)}
    for y in range(14):
        for x in range(24):
            if (x,y) in square:
                i = 20 + random.Random(x*41+y*103).randrange(4)
            elif (x,y) in paths:
                mask = sum(bit for dx,dy,bit in [(0,-1,1),(1,0,2),(0,1,4),(-1,0,8)] if (x+dx,y+dy) in paths | square)
                # Road carries on through the patch's left and right edges.
                if y == 7 and x == 0: mask |= 8
                if y == 7 and x == 23: mask |= 2
                i = 4 + mask
            else:
                i = random.Random(x*131+y*71).randrange(4)
            patch.paste(tiles[i], (x*16,y*16))
    for x, i in [(14,24),(15,25),(16,25),(17,26)]: patch.paste(tiles[i], (x*16,4*16), tiles[i].convert('RGBA').getchannel('A'))
    # A 16×24 scale figure, drawn from the same approved colours (review only).
    person = image((16,24)); d = ImageDraw.Draw(person)
    d.rectangle((5,0,10,6), fill=C['plank'], outline=C['ink'])
    d.rectangle((3,7,12,15), fill=C['guild'], outline=C['ink'])
    d.rectangle((4,16,6,23), fill=C['log_d']); d.rectangle((9,16,11,23), fill=C['log_d'])
    patch.paste(person, (8*16,7*16-8), person.convert('RGBA').getchannel('A'))
    # Preserve the exact patch at native resolution; the contact sheet uses nearest scaling.
    sheet = image((800,672)); sheet.paste(C['pine_d'],(0,0,800,672)); d = ImageDraw.Draw(sheet); d.fontmode = '1'
    d.text((16,8), 'ART-SF-1  STARFALL FRONTIER GROUND / 16 PX', fill=C['lamp'])
    sheet.paste(patch.resize((768,448),Image.Resampling.NEAREST),(16,28))
    d.text((16,490), 'MOSS x4 / ROADS: N1 E2 S4 W8 / EARTH x4 / STONE STRIPS',fill=C['lamp'])
    for i, tile in enumerate(tiles):
        x=16+(i%16)*48; y=512+(i//16)*76
        sheet.paste(tile.resize((32,32),Image.Resampling.NEAREST),(x,y))
        d.text((x,y+36),str(i),fill=C['lamp'])
    manifest = {'tile_size':16,'columns':8,'rows':4,'palette':'docs/art/starfall/palette.gpl',
                'road_bits':{'north':1,'east':2,'south':4,'west':8},
                'tiles':[{'index':i,'name': ('moss-'+str(i) if i<4 else 'road-'+str(i-4) if i<20 else 'earth-'+str(i-20) if i<24 else ['stone-left','stone-middle','stone-right','stone-top','stone-vertical','stone-bottom','stone-block-a','stone-block-b'][i-24]), 'rect':[i%8*16,i//8*16,16,16], 'solid':False,'height_tiles':0} for i in range(32)]}
    return atlas, patch, sheet, manifest, tiles


def validate(tiles):
    for t in tiles:
        assert set(t.tobytes()) <= set(range(28))
    for a in range(16):
        for b in range(16):
            if bool(a&2) == bool(b&8):
                assert [tiles[4+a].getpixel((15,y)) for y in range(16)] == [tiles[4+b].getpixel((0,y)) for y in range(16)], (a,b,'east/west')
            if bool(a&4) == bool(b&1):
                assert [tiles[4+a].getpixel((x,15)) for x in range(16)] == [tiles[4+b].getpixel((x,0)) for x in range(16)], (a,b,'south/north')


def main():
    args = argparse.ArgumentParser(); args.add_argument('--check',action='store_true'); opts=args.parse_args()
    atlas, patch, sheet, manifest, tiles = render()
    validate(tiles)
    outputs = {ASSETS/'ground.png':atlas, REVIEW/'ground-patch-1x.png':patch, REVIEW/'ground-contact.png':sheet}
    for p, im in outputs.items():
        buf=BytesIO(); im.save(buf,format='PNG',transparency=0); data=buf.getvalue()
        if opts.check: assert p.read_bytes()==data, f'Stale generated art: {p}'
        else: p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
    p=ASSETS/'ground.json'; data=json.dumps(manifest,indent=2)+'\n'
    if opts.check: assert p.read_text()==data
    else: p.write_text(data)
    print('PASS: 32 palette-indexed tiles; all compatible road edges; deterministic outputs; 24x14 scale patch')

if __name__ == '__main__': main()
