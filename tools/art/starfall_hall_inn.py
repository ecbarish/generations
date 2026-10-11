"""ART-SF-4: original indexed Guild Hall and Inn; --check verifies generated files."""
from pathlib import Path
from io import BytesIO
import argparse
import json
from PIL import Image, ImageDraw
import starfall_ground as ground
import starfall_stockade as stockade
import starfall_pines as pines

ROOT=Path(__file__).resolve().parents[2]
ASSETS=ROOT/'starfall-godot/assets/env/frontier'
REVIEW=ROOT/'docs/art/starfall'
C=ground.C


def foundation(d,width):
    # Full marked base: 6x3 or 4x3 tiles; the upper drawing projects above it.
    d.rectangle((0,32,width-1,79),fill=C['stone_d'],outline=C['ink'])
    d.line((1,33,width-2,33),fill=C['stone_l'])
    d.line((1,33,1,78),fill=C['stone_l'])
    d.line((1,77,width-2,77),fill=C['stone'])
    for x in range(9,width-2,12):d.line((x,76,x,78),fill=C['ink'])


def logs(d,box):
    x0,y0,x1,y1=box
    d.rectangle(box,fill=C['log'],outline=C['ink'])
    for y in range(y0+1,y1,5):
        d.line((x0+1,y,x1-1,y),fill=C['log_l'])
        d.line((x0+1,y+3,x1-1,y+3),fill=C['log_d'])
    for x in (x0+1,x1-3):
        d.rectangle((x,y0+1,x+2,y1-1),fill=C['log_d'])
        for y in range(y0+2,y1,5):d.point((x+1,y),fill=C['plank'])


def roof(d,width,top,eave):
    # A long shallow prism for the hall, a taller gable for the inn; grey-brown shakes.
    ridge=top+7
    polygon=[(9,top),(width-11,top),(width-1,eave-5),(width-1,eave),(0,eave),(0,eave-5)]
    d.polygon(polygon,fill=C['shake'],outline=C['ink'])
    d.polygon([(width-11,top+1),(width-2,eave-5),(width-2,eave-1),(width-12,eave-1)],fill=C['shake_d'])
    for y in range(ridge,eave-2,4):
        inset=max(1,round(8*(eave-y)/(eave-top)))
        d.line((inset,y,width-inset-2,y),fill=C['shake_d'])
        for x in range(inset+2+(y//4%2)*4,width-inset-3,8):
            d.line((x,y+1,x+5,y+1),fill=C['shake_l'])
            d.point((x+6,y+2),fill=C['shake_d'])
    d.line((10,top+1,width-12,top+1),fill=C['shake_l'])
    d.line((1,eave-1,width-2,eave-1),fill=C['log_l'])


def window(d,x,y,lit):
    # Frame 8x8, inner glass 6x6. Only glass changes between states.
    d.rectangle((x,y,x+7,y+7),fill=C['ink'])
    d.rectangle((x+1,y+1,x+6,y+6),fill=C['lamp'] if lit else C['stone_d'])
    d.line((x+2,y+1,x+2,y+6),fill=C['lamp_l'] if lit else C['stone'])
    d.line((x+4,y+1,x+4,y+6),fill=C['log_d'])
    d.line((x+1,y+4,x+6,y+4),fill=C['log_d'])
    d.line((x,y+8,x+7,y+8),fill=C['plank'])


def door(d,x,y,double=False):
    # Exactly 12x20, including outline; fits a normal 16x24 person.
    d.rectangle((x,y,x+11,y+19),fill=C['log_d'],outline=C['ink'])
    for dx in (2,5,8):d.line((x+dx,y+1,x+dx,y+18),fill=C['log'])
    if double:
        d.line((x+5,y+1,x+5,y+18),fill=C['ink'])
        d.point((x+4,y+11),fill=C['stone_l']);d.point((x+7,y+11),fill=C['stone_l'])
    else:d.point((x+9,y+11),fill=C['stone_l'])
    for dy in (5,15):d.line((x+1,y+dy,x+10,y+dy),fill=C['log_l'])


def building(kind,lit):
    width=96 if kind=='guild_hall' else 64
    im=ground.image((width,80));d=ImageDraw.Draw(im);foundation(d,width)
    if kind=='guild_hall':
        logs(d,(3,40,92,75));roof(d,width,5,48)
        windows=[(14,55),(28,55),(60,55),(74,55)]
        door_rect=[42,54,12,20];door(d,*door_rect[:2],double=True)
        # Banner and pole distinct from roof colour; guild blue only on cloth.
        d.rectangle((85,4,87,64),fill=C['ink']);d.line((86,5,86,63),fill=C['plank'])
        d.polygon([(87,7),(94,7),(94,28),(91,25),(87,28)],fill=C['guild'],outline=C['ink'])
        d.line((90,10,90,21),fill=C['stone_l']);d.line((89,14,92,14),fill=C['stone_l'])
        height=4
    else:
        logs(d,(3,23,60,75));roof(d,width,0,29)
        d.rectangle((4,49,59,52),fill=C['log_d'],outline=C['ink'])
        d.line((5,50,58,50),fill=C['log_l'])
        windows=[(10,35),(28,35),(46,35),(10,59),(44,59)]
        door_rect=[26,54,12,20];door(d,*door_rect[:2])
        # Hanging bed sign on a timber bracket; no player-facing tiny text.
        d.line((55,29,63,29),fill=C['ink']);d.line((56,30,62,30),fill=C['plank'])
        d.line((62,30,62,34),fill=C['ink'])
        d.rectangle((53,34,63,46),fill=C['log_d'],outline=C['ink'])
        d.rectangle((54,35,62,45),fill=C['plank'])
        d.line((55,39,55,44),fill=C['ink']);d.line((55,42,61,42),fill=C['ink'])
        d.line((61,40,61,44),fill=C['ink']);d.rectangle((56,40,60,41),fill=C['shake_d'])
        height=4.5
    for x,y in windows:window(d,x,y,lit)
    return im,{'size':[width,80],'footprint_rect':[0,32,width,48],
        'footprint_tiles':[width//16,3],'height_tiles':height,'door_rect':door_rect,
        'windows':[{'frame_rect':[x,y,8,8],'glass_rect':[x+1,y+1,6,6]} for x,y in windows],
        'states':{'unlit':kind+'.png','lit':kind+'-lit.png'}}


def person():
    im=ground.image((16,24));d=ImageDraw.Draw(im)
    d.rectangle((5,0,10,6),fill=C['plank'],outline=C['ink'])
    d.rectangle((3,7,12,15),fill=C['guild'],outline=C['ink'])
    d.rectangle((4,16,6,23),fill=C['log_d']);d.rectangle((9,16,11,23),fill=C['log_d'])
    return im


def scene(assets,lit):
    im=ground.image((384,224));moss=[ground.soil('moss',v) for v in range(4)];mud=[ground.soil('mud',v) for v in range(4)]
    for y in range(14):
        for x in range(24):im.paste((mud if 9<=y<=11 else moss)[(x*7+y*3)%4],(x*16,y*16))
    for x in (0,128,256):stockade.paste(im,pines.edge(),(x,0))
    for x in range(24):stockade.paste(im,stockade.wall(10),(x*16,57))
    suffix='-lit.png' if lit else '.png'
    stockade.paste(im,assets['guild_hall'+suffix],(64,63))
    stockade.paste(im,assets['inn'+suffix],(240,63))
    # Each person stands just outside the threshold, leaving the door visible.
    for x in (100,262):stockade.paste(im,person(),(x,149))
    return im


def render():
    assets={};meta={'palette':'docs/art/starfall/palette.gpl','tile_size':16,
        'origin':'sprite top-left; footprint_rect is the visible stone base; height is world geometry, independent of canvas height','buildings':{}}
    for kind in ('guild_hall','inn'):
        for lit in (False,True):
            im,entry=building(kind,lit);assets[kind+('-lit' if lit else '')+'.png']=im
        meta['buildings'][kind]=entry
    day=scene(assets,False);lit=scene(assets,True)
    sheet=ground.image((800,816));sheet.paste(C['pine_d'],(0,0,800,816));d=ImageDraw.Draw(sheet);d.fontmode='1'
    d.text((16,8),'ART-SF-4 / GUILD HALL AND INN / LOG WALLS / WOODEN SHAKES',fill=C['lamp'])
    sheet.paste(day.resize((768,448),Image.Resampling.NEAREST),(16,28))
    d.text((16,490),'UNLIT / LIT WINDOWS; WORLD NIGHT LIGHTING IS ADDED BY ENGINE',fill=C['lamp'])
    for i,(name,sprite) in enumerate(assets.items()):
        x=16+i*192;stockade.paste(sheet,sprite,(x,522))
        d.text((x,610),name.removesuffix('.png'),fill=C['lamp'])
    d.text((16,639),'REVIEW OVERLAYS: STONE FOOTPRINT / 12x20 DOOR / 16x24 PERSON',fill=C['lamp'])
    for i,kind in enumerate(('guild_hall','inn')):
        x=16+i*384;sprite=assets[kind+'.png'];stockade.paste(sheet,sprite,(x,667));e=meta['buildings'][kind]
        fx,fy,fw,fh=e['footprint_rect'];d.rectangle((x+fx,667+fy,x+fx+fw-1,667+fy+fh-1),outline=C['banner'])
        dx,dy,dw,dh=e['door_rect'];d.rectangle((x+dx,667+dy,x+dx+dw-1,667+dy+dh-1),outline=C['lamp'])
        stockade.paste(sheet,person(),(x+sprite.width+16,723))
        d.text((x,758),f"{kind}: {e['footprint_tiles']} tiles / height {e['height_tiles']}",fill=C['lamp'])
    return assets,day,lit,sheet,meta


def validate(assets,meta):
    for kind,e in meta['buildings'].items():
        a=assets[kind+'.png'];b=assets[kind+'-lit.png']
        assert list(a.size)==e['size'] and b.size==a.size
        assert e['door_rect'][2:]==[12,20]
        fx,fy,fw,fh=e['footprint_rect'];assert [fw//16,fh//16]==e['footprint_tiles']
        assert 0<=fx and 0<=fy and fx+fw<=a.width and fy+fh<=a.height
        assert all(a.getpixel((x,79))!=0 for x in range(a.width)), 'Base must span footprint'
        changed={(x,y) for y in range(a.height) for x in range(a.width) if a.getpixel((x,y))!=b.getpixel((x,y))}
        glass=set()
        for w in e['windows']:
            x,y,ww,hh=w['glass_rect'];glass.update((px,py) for py in range(y,y+hh) for px in range(x,x+ww))
            assert any((px,py) in changed for py in range(y,y+hh) for px in range(x,x+ww)), 'Each window lights'
        assert changed and changed<=glass, 'Lit state changes geometry outside glass'
        assert a.convert('RGBA').getchannel('A').tobytes()==b.convert('RGBA').getchannel('A').tobytes()
    for im in assets.values():
        assert im.mode=='P' and im.info['transparency']==0
        assert set(im.tobytes())<=set(range(len(ground.COLOURS)))
        assert im.convert('RGBA').getchannel('A').getextrema()==(0,255)
    assert len(meta['buildings']['inn']['windows'])>len(meta['buildings']['guild_hall']['windows'])


def main():
    p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');args=p.parse_args()
    assets,day,lit,sheet,meta=render();validate(assets,meta)
    outputs={ASSETS/name:im for name,im in assets.items()};outputs.update({REVIEW/'hall-inn-scene-1x.png':day,REVIEW/'hall-inn-lit-1x.png':lit,REVIEW/'hall-inn-contact.png':sheet})
    for path,im in outputs.items():
        buf=BytesIO();im.save(buf,format='PNG',transparency=0);data=buf.getvalue()
        if args.check:assert path.read_bytes()==data,f'Stale asset: {path}'
        else:path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
    path=ASSETS/'hall-inn.json';data=json.dumps(meta,indent=2)+'\n'
    if args.check:assert path.read_text()==data
    else:path.write_text(data)
    print('PASS: indexed palette, exact sizes, 12x20 doors, stone footprints, all windows light, stable state geometry, deterministic outputs')

if __name__=='__main__':main()
