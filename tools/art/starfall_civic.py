"""ART-SF-5: original frontier shops and civic sprites; regenerate or --check."""
from pathlib import Path
from io import BytesIO
import argparse
import json
from PIL import Image, ImageDraw
import starfall_ground as ground
import starfall_stockade as stockade
import starfall_hall_inn as buildings
import starfall_pines as pines

ROOT=Path(__file__).resolve().parents[2]
ASSETS=ROOT/'starfall-godot/assets/env/frontier'
REVIEW=ROOT/'docs/art/starfall'
C=ground.C
SPECS={'smithy':([64,56],[4,2],3),'apothecary':([32,56],[2,2],3),
       'healer':([48,48],[3,2],2.5),'tavern':([64,56],[4,2],3),
       'well':([32,32],[2,1],1.5),'board':([32,32],[2,1],2),
       'yard':([64,48],[4,3],1.5)}


def canvas(size):
    im=ground.image(size);return im,ImageDraw.Draw(im)


def base(d,w,h,depth):
    y=h-depth;d.rectangle((0,y,w-1,h-1),fill=C['stone_d'],outline=C['ink'])
    d.line((1,y+1,1,h-2),fill=C['stone_l']);d.line((1,h-3,w-2,h-3),fill=C['stone'])
    for x in range(7,w-1,10):d.line((x,h-3,x,h-2),fill=C['ink'])


def barrel(d,x,y):
    d.rounded_rectangle((x,y,x+8,y+12),radius=2,fill=C['log'],outline=C['ink'])
    d.line((x+2,y+2,x+2,y+10),fill=C['log_l'])
    for yy in (y+3,y+9):d.line((x+1,yy,x+7,yy),fill=C['stone_d'])


def draw(name):
    size,tiles,height=SPECS[name];w,h=size;im,d=canvas(size);depth=tiles[1]*16
    door=None;details={};solid=True
    if name in ('smithy','apothecary','healer','tavern'):base(d,w,h,depth)
    if name=='smithy':
        d.rectangle((4,24,59,52),fill=C['stone'],outline=C['ink'])
        for y in range(26,51,6):
            d.line((5,y,58,y),fill=C['stone_d'])
            for x in range(9+(y//6%2)*5,59,10):d.line((x,y,x,y+4),fill=C['stone_d'])
        buildings.roof(d,64,12,29)
        # Tall masonry chimney gives the smithy its unmistakable top outline.
        d.rectangle((47,3,55,31),fill=C['stone_d'],outline=C['ink'])
        d.rectangle((45,0,57,4),fill=C['stone'],outline=C['ink'])
        d.line((48,5,48,29),fill=C['stone_l'])
        for y in (10,18,25):d.line((49,y,54,y),fill=C['ink'])
        d.rectangle((8,31,38,51),fill=C['ink'])
        d.rectangle((10,33,23,49),fill=C['stone_d'])
        d.polygon([(12,47),(11,43),(15,44),(16,37),(19,42),(22,40),(21,47)],fill=C['lamp'])
        d.polygon([(15,47),(17,42),(19,47)],fill=C['lamp_l'])
        d.line((25,48,36,48),fill=C['log_l'])
        # Anvil outside the open front, with horn and broad feet.
        d.polygon([(42,42),(60,42),(55,46),(51,46),(51,50),(56,52),(43,52),(47,49),(47,46),(43,46)],fill=C['stone_d'],outline=C['ink'])
        d.line((44,43,57,43),fill=C['stone_l'])
        details={'open_front_rect':[8,31,31,21],'forge_rect':[11,37,12,11],
                 'smoke_anchor':[51,0],'smoke_note':'Emitter anchor only; smoke belongs to engine, not baked pixels.'}
    elif name=='apothecary':
        buildings.logs(d,(2,24,29,53))
        d.polygon([(0,28),(16,0),(31,28)],fill=C['shake'],outline=C['ink'])
        d.polygon([(17,3),(30,27),(18,27)],fill=C['shake_d'])
        for y in range(8,27,4):d.line((16-y//2,y,15,y),fill=C['shake_l'])
        d.line((1,28,30,28),fill=C['log_l'])
        buildings.door(d,10,33);door=[10,33,12,20]
        d.line((2,31,8,31),fill=C['plank'])
        for x in (3,6,8):
            d.line((x,31,x,39),fill=C['ink']);d.line((x-1,35,x+1,37),fill=C['pine_l'])
            d.line((x+1,34,x-1,38),fill=C['pine'])
        d.rectangle((23,33,29,41),fill=C['ink']);d.rectangle((24,34,28,40),fill=C['stone_d'])
        d.rectangle((25,37,27,39),fill=C['guild']);d.point((26,36),fill=C['lamp_l'])
        details={'herb_rack_rect':[2,31,7,9],'bottle_window_rect':[23,33,7,9]}
    elif name=='healer':
        buildings.logs(d,(3,18,44,45));buildings.roof(d,48,7,23)
        buildings.door(d,18,25);door=[18,25,12,20]
        # Light cloth canopy over the entry, as the look sheet specifies.
        d.polygon([(17,23),(30,23),(30,28),(27,27),(24,29),(21,27),(17,28)],fill=C['smoke'],outline=C['ink'])
        d.line((18,24,29,24),fill=C['stone_l'])
        d.rectangle((3,36,14,39),fill=C['plank'],outline=C['ink'])
        for x in (4,12):d.line((x,39,x,44),fill=C['log_d'],width=2)
        d.rectangle((34,36,44,44),fill=C['mud'],outline=C['ink'])
        for x in (36,40,43):
            d.line((x,41,x,37),fill=C['pine']);d.point((x-1,38),fill=C['pine_l'])
        details={'cloth_rect':[17,23,14,7],'bench_rect':[3,36,12,9],'herb_bed_rect':[34,36,11,9]}
    elif name=='tavern':
        buildings.logs(d,(7,24,56,50));buildings.roof(d,64,5,28)
        buildings.door(d,27,30);door=[27,30,12,20]
        buildings.window(d,12,32,False);buildings.window(d,45,32,False)
        # Porch roof, deck and posts project out from the facade.
        d.polygon([(2,26),(61,26),(63,33),(0,33)],fill=C['shake'],outline=C['ink'])
        d.line((3,27,60,27),fill=C['shake_l'])
        for x in (2,59):
            d.rectangle((x,33,x+2,51),fill=C['log_d'],outline=C['ink']);d.line((x+1,34,x+1,50),fill=C['log_l'])
        d.rectangle((1,51,62,53),fill=C['log'],outline=C['ink']);d.line((2,52,61,52),fill=C['plank'])
        barrel(d,7,40);barrel(d,47,40)
        d.line((52,17,62,17),fill=C['ink']);d.line((61,18,61,21),fill=C['ink'])
        d.rectangle((54,21,63,30),fill=C['plank'],outline=C['ink'])
        d.rectangle((56,23,60,27),fill=C['stone_l']);d.arc((59,23,62,27),270,90,fill=C['ink'])
        details={'porch_rect':[0,26,64,28],'tankard_sign_rect':[54,21,10,10]}
    elif name=='well':
        # Round masonry cylinder, frame and suspended bucket; no cottage roof.
        d.ellipse((0,16,31,31),fill=C['stone_d'],outline=C['ink'])
        d.ellipse((1,13,30,26),fill=C['stone'],outline=C['ink'])
        d.ellipse((5,16,26,23),fill=C['ink'])
        d.arc((2,14,29,25),180,300,fill=C['stone_l'])
        for x in (3,27):
            d.rectangle((x,4,x+2,24),fill=C['log_d'],outline=C['ink']);d.line((x+1,5,x+1,23),fill=C['log_l'])
        d.rectangle((2,3,30,6),fill=C['log'],outline=C['ink']);d.line((3,4,29,4),fill=C['log_l'])
        d.line((15,7,15,18),fill=C['plank'])
        d.rectangle((12,18,18,23),fill=C['log'],outline=C['ink']);d.line((13,19,17,19),fill=C['stone_l'])
        details={'collision_shape':'alpha within footprint_rect'}
    elif name=='board':
        for x in (3,26):d.rectangle((x,12,x+2,31),fill=C['log_d'],outline=C['ink'])
        d.rectangle((2,8,29,24),fill=C['log'],outline=C['ink'])
        d.polygon([(0,8),(5,1),(27,1),(31,8)],fill=C['shake'],outline=C['ink'])
        d.line((6,2,26,2),fill=C['shake_l'])
        for x,y in [(5,11),(15,10),(23,15)]:
            d.rectangle((x,y,x+5,y+7),fill=C['plank'],outline=C['log_d'])
            d.point((x+2,y+1),fill=C['stone_l']);d.line((x+1,y+4,x+4,y+4),fill=C['log_d'])
        details={'solid_rects':[[3,24,3,8],[26,24,3,8]],'interaction_rect':[2,8,28,17]}
    else:
        solid=False
        # Rope fence with a clear southern entry, not an opaque collision rectangle.
        for a,b in [((2,4),(61,4)),((2,4),(2,44)),((61,4),(61,44)),((2,44),(20,44)),((43,44),(61,44))]:
            d.line((*a,*b),fill=C['ink'],width=2);d.line((a[0],a[1]-1,b[0],b[1]-1),fill=C['plank'])
        posts=[(0,0),(59,0),(0,40),(59,40),(18,40),(41,40)]
        for x,y in posts:
            d.rectangle((x,y,x+4,y+7),fill=C['log'],outline=C['ink']);d.line((x+1,y+1,x+1,y+6),fill=C['log_l'])
        d.line((24,13,24,32),fill=C['log_d'],width=3)
        d.ellipse((20,8,27,15),fill=C['plank'],outline=C['ink'])
        d.rectangle((20,16,28,25),fill=C['plank'],outline=C['ink'])
        d.line((14,18,33,18),fill=C['log'],width=3);d.line((21,23,27,23),fill=C['log_d'])
        d.rectangle((40,13,55,16),fill=C['log'],outline=C['ink'])
        for x in (40,53):d.line((x,16,x,31),fill=C['log_d'],width=2)
        for x in (43,48,52):
            d.line((x,10,x,26),fill=C['stone_l']);d.line((x-2,22,x+2,22),fill=C['log'])
        details={'solid_rects':[[x,y,5,8] for x,y in posts]+[[20,8,9,25],[40,10,16,22]],
            'fence_segments':[[2,4,61,4],[2,4,2,44],[61,4,61,44],[2,44,20,44],[43,44,61,44]],
            'entry_rect':[23,40,18,8]}
    return im,{'file':name+'.png','size':size,'footprint_rect':[0,h-depth,w,depth],
        'footprint_tiles':tiles,'height_tiles':height,'solid':solid,'door_rect':door,**details}


def render():
    assets={};meta={'palette':'docs/art/starfall/palette.gpl','tile_size':16,
        'origin':'local top-left; footprint_rect is placement base; explicit solid_rects/fence_segments override full solidity', 'pieces':{}}
    for name in SPECS:
        im,e=draw(name);assets[name+'.png']=im;meta['pieces'][name]=e
    scene=ground.image((384,224));moss=[ground.soil('moss',v) for v in range(4)];mud=[ground.soil('mud',v) for v in range(4)]
    for y in range(14):
        for x in range(24):scene.paste((mud if 7<=y<=9 else moss)[(x*7+y*3)%4],(x*16,y*16))
    for x in (0,128,256):stockade.paste(scene,pines.edge(),(x,0))
    placements=[('smithy',24,61),('apothecary',120,61),('healer',184,69),('tavern',272,61),('well',88,146),('board',160,144),('yard',240,146)]
    for name,x,y in placements:stockade.paste(scene,assets[name+'.png'],(x,y))
    for x in (56,127,199,291):stockade.paste(scene,buildings.person(),(x,120))
    sheet=ground.image((800,816));sheet.paste(C['pine_d'],(0,0,800,816));d=ImageDraw.Draw(sheet);d.fontmode='1'
    d.text((16,8),'ART-SF-5 / FRONTIER SHOPS AND CIVIC PIECES / 16x24 PEOPLE',fill=C['lamp'])
    sheet.paste(scene.resize((768,448),Image.Resampling.NEAREST),(16,28))
    d.text((16,490),'NATIVE PIECES / RED FOOTPRINT OVERLAY / INK SILHOUETTE',fill=C['lamp'])
    for i,(name,(size,tiles,height)) in enumerate(SPECS.items()):
        x=16+i*110;im=assets[name+'.png'];stockade.paste(sheet,im,(x,520))
        d.text((x,583),name,fill=C['lamp'])
        marked=im.copy();md=ImageDraw.Draw(marked);fx,fy,fw,fh=meta['pieces'][name]['footprint_rect'];md.rectangle((fx,fy,fx+fw-1,fy+fh-1),outline=C['banner'])
        stockade.paste(sheet,marked,(x,614));d.text((x,677),f'{tiles[0]}x{tiles[1]} / h{height}',fill=C['lamp'])
        silhouette=ground.image(im.size);silhouette.paste(C['ink'],(0,0,*im.size),im.convert('RGBA').getchannel('A'))
        stockade.paste(sheet,silhouette,(x,707))
    return assets,scene,sheet,meta


def validate(assets,meta):
    masks=[]
    for name,e in meta['pieces'].items():
        im=assets[e['file']];assert list(im.size)==e['size']
        assert im.mode=='P' and im.info['transparency']==0
        assert set(im.tobytes())<=set(range(len(ground.COLOURS)))
        alpha=im.convert('RGBA').getchannel('A');assert alpha.getextrema()==(0,255)
        x,y,w,h=e['footprint_rect'];assert x>=0 and y>=0 and x+w<=im.width and y+h<=im.height
        assert [w//16,h//16]==e['footprint_tiles']
        if e['door_rect']:assert e['door_rect'][2:]==[12,20]
        for rect in e.get('solid_rects',[]):
            x,y,w,h=rect;assert x>=0 and y>=0 and x+w<=im.width and y+h<=im.height
        if name in ('smithy','apothecary','healer','tavern'):masks.append((im.size,alpha.tobytes()))
    assert len(set(masks))==4,'Building silhouettes must differ'
    yard=assets['yard.png'];assert all(yard.getpixel((x,y))==0 for x in range(23,41) for y in range(40,48)), 'Yard entry blocked'
    assert assets['smithy.png'].getpixel((51,0))!=0,'Chimney missing'
    assert assets['apothecary.png'].getpixel((16,0))!=0,'Steep roof missing'


def main():
    p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');args=p.parse_args()
    assets,scene,sheet,meta=render();validate(assets,meta)
    outputs={ASSETS/name:im for name,im in assets.items()};outputs.update({REVIEW/'civic-scene-1x.png':scene,REVIEW/'civic-contact.png':sheet})
    for path,im in outputs.items():
        buf=BytesIO();im.save(buf,format='PNG',transparency=0);data=buf.getvalue()
        if args.check:assert path.read_bytes()==data,f'Stale art: {path}'
        else:path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
    path=ASSETS/'civic.json';data=json.dumps(meta,indent=2)+'\n'
    if args.check:assert path.read_text()==data
    else:path.write_text(data)
    print('PASS: seven indexed sprites, exact sizes, footprints, doors, distinct silhouettes, clear yard entry, deterministic output')

if __name__=='__main__':main()
