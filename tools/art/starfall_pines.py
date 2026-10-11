"""ART-SF-3: original indexed pine edge. Generate or verify with --check."""
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


def pine(height):
    width = {16:16, 32:24, 48:32}[height]
    im = ground.image((width,height)); d = ImageDraw.Draw(im)
    cx = width//2; base = height-1
    trunk_w = {16:4,32:6,48:8}[height]
    left = cx-trunk_w//2
    d.rectangle((left,base-5,left+trunk_w-1,base),fill=C['log'],outline=C['ink'])
    d.line((left+1,base-4,left+1,base-1),fill=C['log_l'])
    d.line((left+trunk_w-2,base-3,left+trunk_w-2,base-1),fill=C['log_d'])
    # Overlapping conical whorls, each broader below; no round broadleaf crowns.
    levels = {16:[(0,8,4),(4,12,7)],32:[(0,12,5),(6,20,8),(14,27,11)],
              48:[(0,16,6),(8,27,10),(18,37,13),(29,43,15)]}[height]
    for top,bottom,radius in levels:
        d.polygon([(cx,top),(cx+radius,bottom-2),(cx+radius-2,bottom),
                   (cx-radius+2,bottom),(cx-radius,bottom-2)],fill=C['pine'],outline=C['ink'])
        d.polygon([(cx+1,top+3),(cx+radius-1,bottom-2),(cx+2,bottom-1)],fill=C['pine_d'])
        d.line((cx-1,top+3,cx-radius+2,bottom-3),fill=C['pine_l'])
        # Broken, stepped branch tips instead of smooth filled triangles.
        for y in range(top+6,bottom-2,5):
            extent = max(1,round(radius*(y-top)/(bottom-top)))
            d.line((cx-extent+2,y,cx-2,y+1),fill=C['pine_l'])
            d.line((cx+2,y+2,cx+extent-1,y+2),fill=C['pine_d'])
    return im, [left,base-3,trunk_w,4]


def prop(kind):
    im=ground.image((16,16));d=ImageDraw.Draw(im)
    if kind.startswith('stump'):
        wide = kind=='stump-wide';x0,x1=(2,13) if wide else (4,11)
        d.rectangle((x0,7,x1,13),fill=C['log_d'],outline=C['ink'])
        d.line((x0+1,8,x0+1,12),fill=C['log_l'])
        d.ellipse((x0,4,x1,10),fill=C['plank'],outline=C['ink'])
        d.arc((x0+2,5,x1-2,9),0,330,fill=C['log_d'])
        d.point((7,7),fill=C['log_l'])
        if wide:d.line((10,5,8,8),fill=C['log_d'])
        return im,[x0,10,x1-x0+1,4],True
    if kind.startswith('fern'):
        d.line((7,13,7,6),fill=C['pine_d'])
        for dx,dy in [(-6,-3),(-5,-7),(-2,-10),(3,-10),(6,-7),(7,-3)]:
            end=(7+dx,13+dy);d.line((7,13,*end),fill=C['ink'])
            d.line((7,12,*end),fill=C['pine'])
            for t in (0.4,0.7):
                x=round(7+dx*t);y=round(13+dy*t)
                d.line((x,y,x-1 if dx<0 else x+1,y-2),fill=C['pine_l'])
        if kind=='fern-low':im=im.resize((16,11),Image.Resampling.NEAREST); out=ground.image((16,16));out.paste(im,(0,5));im=out
        return im,[2,12,12,2],False
    big=kind=='rock-large'
    points=[(1,12),(3,6),(8,3),(13,6),(15,12),(12,14),(4,14)] if big else [(3,12),(5,8),(9,6),(12,9),(13,13),(5,14)]
    d.polygon(points,fill=C['stone'],outline=C['ink'])
    d.polygon([(8,5),(12,7),(14,12),(10,13),(8,10)],fill=C['stone_d'])
    d.line((4,8,7,5),fill=C['stone_l']);d.line((4,9,7,9),fill=C['stone_l'])
    return im,([1,11,15,4] if big else [3,11,11,4]),True


EDGE_TREES=[(-6,48,51),(17,32,43),(31,48,57),(53,32,48),
            (65,48,53),(87,48,58),(108,32,46),(120,16,59)]


def edge(width=128):
    im=ground.image((width,64))
    # Wrapped copies preserve crowns crossing either side of the repeating strip.
    for period in range(-1,width//128+1):
        for x,h,base in sorted(EDGE_TREES,key=lambda entry:entry[2]):
            sprite,_=pine(h);stockade.paste(im,sprite,(period*128+x,base-h+1))
    return im


def render():
    atlas=ground.image((96,96));entries=[];sprites=[]
    for i,h in enumerate((16,32,48)):
        im,foot=pine(h);x=i*32;y=48-h;atlas.paste(im,(x,y));sprites.append(im)
        entries.append({'name':f'pine-{h}','rect':[x,y,*im.size],'footprint_rect':foot,
                        'footprint_tiles':[foot[2]/16,foot[3]/16],'height_tiles':h/16,'solid':True})
    for i,name in enumerate(('stump-small','stump-wide','fern','fern-low','rock-small','rock-large')):
        im,foot,solid=prop(name);x=i%6*16;y=64;atlas.paste(im,(x,y));sprites.append(im)
        entries.append({'name':name,'rect':[x,y,16,16],'footprint_rect':foot,
                        'footprint_tiles':[foot[2]/16,foot[3]/16],'height_tiles':1,'solid':solid})
    border=edge(); scene=ground.image((384,224));moss=[ground.soil('moss',v) for v in range(4)]
    for y in range(14):
        for x in range(24):scene.paste(moss[(x*7+y*3)%4],(x*16,y*16))
    for x in (0,128,256):stockade.paste(scene,border,(x,24))
    for x in range(24):stockade.paste(scene,stockade.wall(10),(x*16,90))
    for x,y,name in [(28,137,'stump-wide'),(68,153,'fern'),(112,142,'rock-large'),(282,140,'stump-small'),(312,163,'fern-low')]:
        stockade.paste(scene,prop(name)[0],(x,y))
    # Three isolated sizes and a scale person in front of the wall.
    for x,h in [(148,16),(193,32),(240,48)]:stockade.paste(scene,pine(h)[0],(x,178-h))
    person=ground.image((16,24));d=ImageDraw.Draw(person)
    d.rectangle((5,0,10,6),fill=C['plank'],outline=C['ink']);d.rectangle((3,7,12,15),fill=C['guild'],outline=C['ink'])
    d.rectangle((4,16,6,23),fill=C['log_d']);d.rectangle((9,16,11,23),fill=C['log_d'])
    stockade.paste(scene,person,(179,181))
    sheet=ground.image((800,816));sheet.paste(C['pine_d'],(0,0,800,816));d=ImageDraw.Draw(sheet);d.fontmode='1'
    d.text((16,8),'ART-SF-3 / DARK PINE EDGE / ORIGINAL PALETTE / 16x24 PERSON',fill=C['lamp'])
    sheet.paste(scene.resize((768,448),Image.Resampling.NEAREST),(16,28))
    d.text((16,489),'PINES 1 / 2 / 3 TILES HIGH; STUMPS / FERNS / ROCKS',fill=C['lamp'])
    for i,im in enumerate(sprites):
        x=16+i*84;stockade.paste(sheet,im.resize((im.width*2,im.height*2),Image.Resampling.NEAREST),(x,612-im.height*2))
        d.text((x,620),entries[i]['name'],fill=C['lamp'])
    d.text((16,649),'128 PX PERIOD / THREE COPIES / NO PAINTED FOG OR LIGHT',fill=C['lamp'])
    for x in (16,272,528):stockade.paste(sheet,border.resize((256,128),Image.Resampling.NEAREST),(x,672))
    return {'pines.png':atlas,'forest_edge.png':border},scene,sheet,{
        'tile_size':16,'palette':'docs/art/starfall/palette.gpl','sprites':entries,
        'origin':'rect addresses atlas; footprint_rect is local to extracted sprite; fractional tiles match visible bases',
        'forest_edge':{'file':'forest_edge.png','size':[128,64],'repeat_axis':'x','period_px':128,
        'solid':False,'height_tiles':3,'note':'Decorative backdrop only. Place individual pine trunks for collision; crowns are not solid.',
        'placements':[{'sprite':f'pine-{h}','x':x,'y':base-h+1} for x,h,base in EDGE_TREES]}},sprites


def validate(assets,meta,sprites):
    assert assets['pines.png'].size==(96,96) and assets['forest_edge.png'].size==(128,64)
    for im in [*assets.values(),*sprites]:
        assert im.mode=='P' and im.info['transparency']==0
        assert set(im.tobytes())<=set(range(len(ground.COLOURS)))
        assert im.convert('RGBA').getchannel('A').getextrema()==(0,255)
    twice=edge(256);one=assets['forest_edge.png']
    assert twice.crop((0,0,128,64)).tobytes()==one.tobytes()
    assert twice.crop((128,0,256,64)).tobytes()==one.tobytes(),'Wrapped forest seam differs'
    assert len({im.tobytes() for im in sprites})==len(sprites)
    for e,im in zip(meta['sprites'],sprites):
        x,y,w,h=e['footprint_rect'];assert 0<=x and 0<=y and x+w<=im.width and y+h<=im.height
        assert e['footprint_tiles']==[w/16,h/16]
        if e['name'].startswith('pine'):
            assert im.height==e['height_tiles']*16
            assert all(im.getpixel((px,im.height-1)) for px in range(x,x+w))
            assert all(im.getpixel((px,im.height-1))==0 for px in range(im.width) if not x<=px<x+w)


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
    assets,scene,sheet,meta,sprites=render();validate(assets,meta,sprites)
    outputs={ASSETS/name:im for name,im in assets.items()};outputs.update({REVIEW/'pine-scene-1x.png':scene,REVIEW/'pine-contact.png':sheet})
    for p,im in outputs.items():
        buf=BytesIO();im.save(buf,format='PNG',transparency=0);data=buf.getvalue()
        if args.check:assert p.read_bytes()==data,f'Stale art: {p}'
        else:p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
    p=ASSETS/'pines.json';data=json.dumps(meta,indent=2)+'\n'
    if args.check:assert p.read_text()==data
    else:p.write_text(data)
    print('PASS: approved indexed palette, sizes, trunk footprints, nine distinct sprites, sideways repeat, deterministic output')

if __name__=='__main__':main()
