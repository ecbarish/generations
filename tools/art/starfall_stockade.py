"""ART-SF-2: original indexed frontier stockade art; run with --check to verify.
Uses ART-SF-1's approved palette and ground for the review contact scene only.
"""
from pathlib import Path
from io import BytesIO
import argparse
import json
from PIL import Image, ImageDraw
import starfall_ground as ground

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / 'starfall-godot/assets/env/frontier'
REVIEW = ROOT / 'docs/art/starfall'
C = ground.C


def canvas(size):
    im = ground.image(size)
    return im, ImageDraw.Draw(im)


def post(d, x, top, bottom, width=5):
    d.polygon([(x,top+4),(x+width//2,top),(x+width-1,top+4),(x+width-1,bottom),(x,bottom)],fill=C['log'],outline=C['ink'])
    d.line((x+1,top+5,x+1,bottom-1),fill=C['log_l'])
    d.line((x+width-2,top+5,x+width-2,bottom-1),fill=C['log_d'])
    if bottom-top > 12: d.point((x+2,top+12),fill=C['log_d'])


WALLS = [('straight-h',10),('straight-v',5),('corner-ne',3),('corner-se',6),
         ('corner-sw',12),('corner-nw',9),('end-east',2),('end-west',8),
         ('end-north',1),('end-south',4),('stakes',0)]


def wall(mask):
    im,d = canvas((16,32))
    if mask == 0:
        post(d,2,20,30,3);post(d,11,22,30,3)
        d.line((4,25,11,27),fill=C['plank'])
        return im
    if mask in (1, 4, 5):
        d.rectangle((7,16,10,31),fill=C['log_d'],outline=C['ink'])
        posts = [(3,0,20),(6,6,26),(9,12,31)]
        if mask == 1: posts = posts[:2]
        elif mask == 4: posts = posts[1:]
        for x,top,bottom in posts:
            post(d,x,top,bottom,5)
        return im
    # Rails join at fixed ports. Sharpened logs carry the silhouette above the footprint.
    if mask&2 or mask&8:
        left=0 if mask&8 else 6;right=15 if mask&2 else 9
        for y in (18,26):
            d.rectangle((left,y,right,y+3),fill=C['log_d'],outline=C['ink'])
            d.line((left,y+1,right,y+1),fill=C['plank'])
    if mask&1:
        d.rectangle((5,16,10,25),fill=C['log_d'],outline=C['ink'])
        d.line((6,17,6,24),fill=C['log_l'])
    if mask&4:
        d.rectangle((5,25,10,31),fill=C['log_d'],outline=C['ink'])
        d.line((6,26,6,30),fill=C['log_l'])
    if mask&8: post(d,0,5,30,4)
    if mask&2: post(d,12,5,30,4)
    if mask&1: post(d,2,0,23,4)
    post(d,5,0,31,6)
    if mask&4: post(d,9,12,31,4)
    # A right-facing rail segment at the base distinguishes turns from a plain run.
    if mask&4:
        d.line((7,27,7,31),fill=C['log_l'])
    return im


def gate(opened):
    im,d = canvas((48,48))
    # Two stone-footed posts with an overhead beam; bottom 16 px is the collision strip.
    for x in (0,40):
        d.rectangle((x,32,x+7,47),fill=C['stone_d'],outline=C['ink'])
        d.line((x+1,33,x+6,33),fill=C['stone_l'])
        post(d,x+1,5,44,6)
    d.rectangle((0,7,47,14),fill=C['log'],outline=C['ink'])
    d.line((1,8,46,8),fill=C['log_l']);d.line((1,13,46,13),fill=C['log_d'])
    for x in (4,43):
        d.rectangle((x-1,10,x+1,12),fill=C['stone_d']);d.point((x,10),fill=C['stone_l'])
    if opened:
        # Doors fold against the posts, leaving a clear 32-pixel central passage.
        for x in (3,40):
            d.rectangle((x,17,x+4,43),fill=C['log_d'],outline=C['ink'])
            d.line((x+1,18,x+1,42),fill=C['log_l'])
    else:
        for x in range(8,40,4):
            d.rectangle((x,16,x+3,46),fill=C['log'],outline=C['log_d'])
            d.line((x,17,x,45),fill=C['log_l'])
        d.rectangle((8,16,39,46),outline=C['ink'])
        for y in (23,38):
            d.rectangle((8,y,39,y+2),fill=C['log_d'])
            d.line((9,y,38,y),fill=C['plank'])
        d.line((9,40,22,25),fill=C['log_d'],width=2)
        d.line((26,25,38,40),fill=C['log_d'],width=2)
        d.line((23,17,23,45),fill=C['ink'])
        d.rectangle((21,29,26,31),fill=C['stone_d']);d.point((21,29),fill=C['stone_l'])
    return im


def tower(lit):
    im,d = canvas((32,80))
    # Four visible footings bound the full 2x2-tile footprint, starting at y=48.
    for x,y in [(0,48),(25,48),(0,73),(25,73)]:
        d.rectangle((x,y,x+6,y+6),fill=C['stone'],outline=C['ink'])
        d.line((x+1,y+1,x+5,y+1),fill=C['stone_l'])
    for x,stop in [(2,76),(25,76),(7,51),(21,51)]:
        d.rectangle((x,24,x+3,stop),fill=C['log_d'],outline=C['ink'])
        d.line((x+1,25,x+1,stop-1),fill=C['log_l'])
    # Diagonal bracing and a narrow ladder, not a solid monolithic cottage.
    for y in (36,55):
        d.line((5,y,25,y+17),fill=C['log'],width=3)
        d.line((25,y,5,y+17),fill=C['log_d'],width=3)
        d.line((5,y,24,y+16),fill=C['log_l'])
    for x in (13,18): d.line((x,29,x,77),fill=C['plank'],width=2)
    for y in range(33,77,5): d.line((14,y,17,y),fill=C['log_l'])
    d.rectangle((0,25,31,31),fill=C['log'],outline=C['ink'])
    d.line((1,26,30,26),fill=C['plank'])
    for x in (2,9,22,28): d.rectangle((x,14,x+1,26),fill=C['log_d'])
    d.rectangle((1,19,30,21),fill=C['log'],outline=C['ink'])
    d.line((2,19,29,19),fill=C['log_l'])
    d.polygon([(0,13),(15,0),(31,13)],fill=C['shake'],outline=C['ink'])
    d.polygon([(15,1),(30,12),(17,12)],fill=C['shake_d'])
    for y in (5,8,11): d.line((16-y,y+1,15,y+1),fill=C['shake_l'])
    d.line((2,13,29,13),fill=C['ink'])
    # Light changes only the lantern pixels; illumination is the engine's job.
    d.line((15,13,15,15),fill=C['ink'])
    d.rectangle((12,15,18,23),fill=C['ink'])
    d.rectangle((13,16,17,22),fill=C['lamp'] if lit else C['stone_d'])
    if lit:
        d.rectangle((14,17,15,20),fill=C['lamp_l'])
        d.point((16,21),fill=C['plank'])
    else:
        d.line((14,17,14,21),fill=C['stone'])
    d.line((13,19,17,19),fill=C['log_d'])
    return im


def paste(target,im,xy):
    target.paste(im,xy,im.convert('RGBA').getchannel('A'))


def render():
    pieces = [wall(m) for _,m in WALLS]
    atlas,_ = canvas((64,96))
    for i,im in enumerate(pieces): atlas.paste(im,((i%4)*16,(i//4)*32))
    assets={'palisade.png':atlas,'gate-open.png':gate(True),'gate-shut.png':gate(False),
            'watchtower-lit.png':tower(True),'watchtower-unlit.png':tower(False)}
    # Neighbour contact view on ART-SF-1 moss, with gate, corner and a person for scale.
    scene,_=canvas((384,224))
    moss = [ground.soil('moss',v) for v in range(4)]
    road = ground.road(5)
    for y in range(14):
        for x in range(24):scene.paste(moss[(x*7+y*3)%4],(x*16,y*16))
    for y in range(9,14):
        for x in (9,10):scene.paste(road,(x*16,y*16))
    for x in range(2,22):
        if 8<=x<=10:continue
        im=pieces[0] if x<21 else pieces[4]
        paste(scene,im,(x*16,128))
    paste(scene,assets['gate-open.png'],(8*16,112))
    for y in (10,11,12):paste(scene,pieces[1],(21*16,y*16-16))
    paste(scene,assets['watchtower-lit.png'],(11*16,80))
    person,d=canvas((16,24))
    d.rectangle((5,0,10,6),fill=C['plank'],outline=C['ink'])
    d.rectangle((3,7,12,15),fill=C['guild'],outline=C['ink'])
    d.rectangle((4,16,6,23),fill=C['log_d']);d.rectangle((9,16,11,23),fill=C['log_d'])
    paste(scene,person,(9*16+8,164))
    sheet,d=canvas((800,768));sheet.paste(C['pine_d'],(0,0,800,768));d.fontmode='1'
    d.text((16,8),'ART-SF-2 / FRONTIER STOCKADE / PALETTE ONLY / 16x24 PERSON',fill=C['lamp'])
    paste(sheet,scene.resize((768,448),Image.Resampling.NEAREST),(16,28))
    d.text((16,489),'PALISADE: H, V, FOUR CORNERS, FOUR ENDS, STAKES',fill=C['lamp'])
    for i,im in enumerate(pieces):
        x=16+i*64;paste(sheet,im.resize((32,64),Image.Resampling.NEAREST),(x,514))
        d.text((x,584),str(i),fill=C['lamp'])
    for i,(name,im) in enumerate(list(assets.items())[1:]):
        x=16+i*192;paste(sheet,im,(x,624));d.text((x,714),name.removesuffix('.png'),fill=C['lamp'])
    metadata={'palette':'docs/art/starfall/palette.gpl','tile_size':16,'origin':'sprite coordinates start at top-left; footprint_rect defines world placement and collision',
      'palisade':{'file':'palisade.png','pieces':[{'name':name,'rect':[i%4*16,i//4*32,16,32],'footprint_rect':[0,16,16,16],'footprint_tiles':[1,1],'height_tiles':2,'connections':mask,'solid':name!='stakes'} for i,(name,mask) in enumerate(WALLS)]},
      'gate':{'size':[48,48],'footprint_tiles':[3,1],'footprint_rect':[0,32,48,16],'height_tiles':3,'states':{'open':{'file':'gate-open.png','solid_rects':[[0,32,8,16],[40,32,8,16]]},'shut':{'file':'gate-shut.png','solid_rects':[[0,32,48,16]]}}},
      'watchtower':{'size':[32,80],'footprint_tiles':[2,2],'footprint_rect':[0,48,32,32],'height_tiles':5,'states':{'lit':'watchtower-lit.png','unlit':'watchtower-unlit.png'}}}
    return assets,scene,sheet,metadata


def validate(assets,meta):
    for name,im in assets.items():
        assert im.mode=='P' and im.info['transparency']==0
        assert set(im.tobytes())<=set(range(len(ground.COLOURS))),name
        assert im.convert('RGBA').getchannel('A').getextrema()==(0,255),name
    wall_tiles = [assets['palisade.png'].crop((i%4*16,i//4*32,i%4*16+16,i//4*32+32)).tobytes() for i in range(len(WALLS))]
    assert len(set(wall_tiles)) == len(WALLS), 'Wall pieces must be visually distinct'
    assert assets['palisade.png'].size == (64,96)
    for name in ('gate-open.png','gate-shut.png'): assert assets[name].size == (48,48)
    for name in ('watchtower-lit.png','watchtower-unlit.png'): assert assets[name].size == (32,80)
    for kind in ('gate','watchtower'):
        x,y,w,h=meta[kind]['footprint_rect'];sw,sh=meta[kind]['size']
        assert 0<=x and 0<=y and x+w<=sw and y+h<=sh
        assert [w//16,h//16]==meta[kind]['footprint_tiles']
    opened=assets['gate-open.png']
    assert all(opened.getpixel((x,y))==0 for x in range(8,40) for y in range(32,48)), 'Open passage blocked by pixels'
    shut=assets['gate-shut.png'];assert all(shut.getpixel((x,40))!=0 for x in range(8,40))
    lit=assets['watchtower-lit.png'];unlit=assets['watchtower-unlit.png']
    changed=[(x,y) for y in range(80) for x in range(32) if lit.getpixel((x,y))!=unlit.getpixel((x,y))]
    assert changed and all(13<=x<=17 and 16<=y<=22 for x,y in changed), 'Lighting changes geometry'


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
    assets,scene,sheet,meta=render();validate(assets,meta)
    outputs={ASSETS/name:im for name,im in assets.items()}
    outputs.update({REVIEW/'stockade-scene-1x.png':scene,REVIEW/'stockade-contact.png':sheet})
    for p,im in outputs.items():
        buf=BytesIO();im.save(buf,format='PNG',transparency=0);data=buf.getvalue()
        if args.check:assert p.read_bytes()==data,f'Stale art: {p}'
        else:p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
    p=ASSETS/'stockade.json';data=json.dumps(meta,indent=2)+'\n'
    if args.check:assert p.read_text()==data
    else:p.write_text(data)
    print('PASS: palette, dimensions, footprints, clear open gate, closed gate, stable lantern geometry, deterministic outputs')

if __name__=='__main__':main()
