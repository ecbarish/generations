"""ART-SF-7: SF2.6 follow-ups, in ART-SF-2 and ART-SF-5's style and palette; regenerate or --check.
- gate-west.png: the stockade gate seen side-on, for a gate in the west wall (the 3x1 gate fits a wall that runs across).
- smithy-2.png, tavern-2.png: the smithy and tavern redrawn two tiles wide, to fit the town's 2x2 plots.
The 4-wide smithy.png and tavern.png stay as they are.
"""
from pathlib import Path
from io import BytesIO
import argparse
import json
from PIL import Image, ImageDraw
import starfall_ground as ground
import starfall_stockade as stockade
import starfall_hall_inn as buildings
import starfall_civic as civic

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / 'starfall-godot/assets/env/frontier'
REVIEW = ROOT / 'docs/art/starfall'
C = ground.C


def canvas(size):
    im = ground.image(size)
    return im, ImageDraw.Draw(im)


def leaf(d, x, bottom):
    """An open gate leaf, swung inward to stand square to the wall: its face is seen from the south."""
    top = bottom - 26
    for xx in range(x, x + 14, 4):
        d.rectangle((xx, top, xx + 3, bottom), fill=C['log'], outline=C['log_d'])
        d.line((xx, top + 1, xx, bottom - 1), fill=C['log_l'])
    d.rectangle((x, top, x + 13, bottom), outline=C['ink'])
    for y in (top + 5, bottom - 7):
        d.rectangle((x, y, x + 13, y + 2), fill=C['log_d']); d.line((x + 1, y, x + 12, y), fill=C['plank'])
    d.line((x + 1, bottom - 8, x + 12, top + 8), fill=C['log_d'], width=2)


def gate_west():
    """32x80. Footprint 1x3 tiles in the wall column (x 0..15, y 32..79): north post, the open passage, south post.
    The beam runs north-south over the passage between the post tops; the two leaves stand open inside the town
    (x 16..31), square to the wall, so the gate reads as open from the south."""
    im, d = canvas((32, 80))
    leaf(d, 16, 46)                                   # the far leaf, by the north post
    d.rectangle((2, 34, 13, 47), fill=C['stone_d'], outline=C['ink'])
    d.line((3, 35, 12, 35), fill=C['stone_l'])
    stockade.post(d, 4, 4, 44, 7)
    d.rectangle((2, 6, 13, 41), fill=C['log'], outline=C['ink'])
    d.line((3, 7, 3, 40), fill=C['log_l'])
    d.line((12, 7, 12, 40), fill=C['log_d'])
    for y in range(11, 40, 7):
        d.line((4, y, 11, y), fill=C['log_d'])
    for y in (9, 38):
        d.rectangle((6, y - 1, 8, y + 1), fill=C['stone_d']); d.point((6, y - 1), fill=C['stone_l'])
    d.rectangle((2, 66, 13, 79), fill=C['stone_d'], outline=C['ink'])
    d.line((3, 67, 12, 67), fill=C['stone_l'])
    stockade.post(d, 4, 36, 76, 7)
    leaf(d, 16, 78)                                   # the near leaf, by the south post
    return im


def smithy_2():
    """32x56, footprint 2x2: stone walls, open forge front, a tall chimney; the game draws the anvil by the door."""
    w, h = 32, 56
    im, d = canvas((w, h)); civic.base(d, w, h, 32)
    d.rectangle((2, 24, 29, 52), fill=C['stone'], outline=C['ink'])
    for y in range(26, 51, 6):
        d.line((3, y, 28, y), fill=C['stone_d'])
        for x in range(6 + (y // 6 % 2) * 5, 29, 10): d.line((x, y, x, y + 4), fill=C['stone_d'])
    buildings.roof(d, 32, 12, 29)
    d.rectangle((21, 3, 27, 31), fill=C['stone_d'], outline=C['ink'])
    d.rectangle((19, 0, 29, 4), fill=C['stone'], outline=C['ink'])
    d.line((22, 5, 22, 29), fill=C['stone_l'])
    for y in (10, 18, 25): d.line((23, y, 26, y), fill=C['ink'])
    d.rectangle((4, 31, 27, 51), fill=C['ink'])
    d.rectangle((6, 33, 17, 49), fill=C['stone_d'])
    d.polygon([(7, 47), (7, 43), (10, 44), (11, 37), (14, 42), (16, 40), (16, 47)], fill=C['lamp'])
    d.polygon([(10, 47), (12, 42), (14, 47)], fill=C['lamp_l'])
    d.line((19, 48, 26, 48), fill=C['log_l'])
    d.rectangle((20, 40, 25, 47), fill=C['log_d'], outline=C['ink'])      # a tool rack in the shadow
    return im, {'open_front_rect': [4, 31, 24, 21], 'forge_rect': [6, 37, 11, 11], 'smoke_anchor': [24, 0],
                'smoke_note': 'Emitter anchor only; smoke belongs to engine, not baked pixels.'}


def tavern_2():
    """32x56, footprint 2x2: log walls, porch on posts, the door, a hanging tankard sign."""
    w, h = 32, 56
    im, d = canvas((w, h)); civic.base(d, w, h, 32)
    buildings.logs(d, (2, 24, 29, 50)); buildings.roof(d, 32, 5, 28)
    buildings.door(d, 10, 30)
    d.polygon([(1, 26), (30, 26), (31, 33), (0, 33)], fill=C['shake'], outline=C['ink'])
    d.line((2, 27, 29, 27), fill=C['shake_l'])
    for x in (1, 28):
        d.rectangle((x, 33, x + 2, 51), fill=C['log_d'], outline=C['ink']); d.line((x + 1, 34, x + 1, 50), fill=C['log_l'])
    d.rectangle((0, 51, 31, 53), fill=C['log'], outline=C['ink']); d.line((1, 52, 30, 52), fill=C['plank'])
    d.rectangle((4, 37, 8, 41), fill=C['ink']); d.rectangle((5, 38, 7, 40), fill=C['stone_d'])   # a small window
    d.line((22, 15, 30, 15), fill=C['ink']); d.line((29, 16, 29, 18), fill=C['ink'])
    d.rectangle((24, 18, 31, 25), fill=C['plank'], outline=C['ink'])
    d.rectangle((26, 20, 28, 23), fill=C['stone_l']); d.point((29, 21), fill=C['ink'])
    return im, {'porch_rect': [0, 26, 32, 28], 'tankard_sign_rect': [24, 18, 8, 8]}


def render():
    smithy, s_det = smithy_2(); tavern, t_det = tavern_2()
    assets = {'gate-west.png': gate_west(), 'smithy-2.png': smithy, 'tavern-2.png': tavern}
    meta = {'palette': 'docs/art/starfall/palette.gpl', 'tile_size': 16,
            'origin': 'sprite top-left; footprint_rect defines world placement and collision (ART-SF-7)',
            'gate_west': {'file': 'gate-west.png', 'size': [32, 80], 'footprint_tiles': [1, 3], 'footprint_rect': [0, 32, 16, 48],
                          'height_tiles': 3, 'passage_rect': [0, 48, 16, 16], 'solid_rects': [[0, 32, 16, 16], [0, 64, 16, 16]],
                          'leaf_rects': [[16, 20, 14, 27], [16, 52, 14, 27]],
                          'note': 'Open gate in a north-south wall, seen side-on. Footprint is the wall column; the leaves (x 16..31) stand open inside the town and are decorative, not solid. Upper pixels are height: the near post rises over the passage tile.'},
            'smithy_2': dict({'file': 'smithy-2.png', 'size': [32, 56], 'footprint_rect': [0, 24, 32, 32], 'footprint_tiles': [2, 2],
                              'height_tiles': 3, 'solid': True, 'door_rect': None}, **s_det),
            'tavern_2': dict({'file': 'tavern-2.png', 'size': [32, 56], 'footprint_rect': [0, 24, 32, 32], 'footprint_tiles': [2, 2],
                              'height_tiles': 3, 'solid': True, 'door_rect': [10, 30, 12, 20]}, **t_det)}
    # Review scene at native size: the west wall with the gate, a road through it, both fitted buildings on 2x2 plots.
    scene, _ = canvas((192, 112))
    moss = [ground.soil('moss', v) for v in range(4)]
    for y in range(7):
        for x in range(12): scene.paste(moss[(x * 7 + y * 3) % 4], (x * 16, y * 16))
    for x in range(1, 12): scene.paste(ground.road(10 if x > 1 else 2), (x * 16, 48))
    pieces = {m: stockade.wall(m) for _, m in stockade.WALLS}
    for y in (0, 1, 5, 6):
        stockade.paste(scene, pieces[5], (16, y * 16 - 16))
    stockade.paste(scene, assets['gate-west.png'], (16, 2 * 16 - 32))
    stockade.paste(scene, assets['smithy-2.png'], (80, 2 * 16 + 16 - 56))
    stockade.paste(scene, assets['tavern-2.png'], (128, 2 * 16 + 16 - 56))
    stockade.paste(scene, buildings.person(), (56, 36))
    return assets, scene, meta


def validate(assets, meta):
    for name, im in assets.items():
        assert im.mode == 'P' and im.info['transparency'] == 0, name
        assert set(im.tobytes()) <= set(range(len(ground.COLOURS))), name
        assert im.convert('RGBA').getchannel('A').getextrema() == (0, 255), name
    for key in ('gate_west', 'smithy_2', 'tavern_2'):
        m = meta[key]; im = assets[m['file']]
        assert list(im.size) == m['size'], key
        x, y, w, h = m['footprint_rect']
        assert x == 0 and y + h == im.size[1] and w <= im.size[0] and [w // 16, h // 16] == m['footprint_tiles'], key
    assert meta['smithy_2']['footprint_tiles'] == [2, 2] and meta['tavern_2']['footprint_tiles'] == [2, 2], 'fit a 2x2 plot'
    dx, dy, dw, dh = meta['tavern_2']['door_rect']
    assert dy + dh <= 56 and dx + dw <= 32 and dy + dh > 24 + 16, 'tavern door at street level'
    g = assets['gate-west.png']
    for x0, y0, w, h in meta['gate_west']['solid_rects']:
        assert any(g.getpixel((x, y)) for x in range(x0, x0 + w) for y in range(y0, y0 + h)), 'post footing drawn'
    # the passage's ground strip at the west edge (the way out) stays open
    assert all(g.getpixel((x, y)) == 0 for x in range(0, 2) for y in range(48, 64)), 'passage edge blocked'


def main():
    parser = argparse.ArgumentParser(); parser.add_argument('--check', action='store_true'); args = parser.parse_args()
    assets, scene, meta = render(); validate(assets, meta)
    outputs = {ASSETS / name: im for name, im in assets.items()}
    outputs[REVIEW / 'fit-scene-1x.png'] = scene
    outputs[REVIEW / 'fit-contact.png'] = scene.resize((768, 448), Image.Resampling.NEAREST)
    for p, im in outputs.items():
        buf = BytesIO(); im.save(buf, format='PNG', transparency=0); data = buf.getvalue()
        if args.check: assert p.read_bytes() == data, f'Stale art: {p}'
        else: p.parent.mkdir(parents=True, exist_ok=True); p.write_bytes(data)
    p = ASSETS / 'fit.json'; data = json.dumps(meta, indent=2) + '\n'
    if args.check: assert p.read_text() == data, 'Stale fit.json'
    else: p.write_text(data)
    print('PASS: palette, sizes, 2x2 footprints, side-on gate posts and open passage, deterministic outputs')


if __name__ == '__main__': main()
