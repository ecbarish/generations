import json,sys
from PIL import Image, ImageDraw
R='/workspace/motion/wildbond-godot/tests/mosshog_clean/'
DIRS=['down','down-side','side','up-side','up']
def load(kind,name):
    e=json.load(open(R+f'{kind}/{name}/frames.json'))[name]
    return e,Image.open(R+f'{kind}/{name}/atlas.png').convert('RGBA')
def cell(e,im,i):
    x,y,w,h=e['frames'][i]['region'];return im.crop((x,y,x+w,y+h)),e['frames'][i]['anchor']
BG=(206,214,180,255)
def build(name,dirs,S,feet=None,out=None):
    data={k:load(k,name) for k in ['baseline','assets']}
    # union bbox
    bb=[999,999,0,0]
    for k in data:
        e,im=data[k]
        for i in range(4,24):
            b=cell(e,im,i)[0].getbbox();bb=[min(bb[0],b[0]),min(bb[1],b[1]),max(bb[2],b[2]),max(bb[3],b[3])]
    ay=data['assets'][0]['frames'][4]['anchor'][1]
    if feet: bb[1]=ay-feet; bb[3]=ay+1
    bb=[bb[0]-1,bb[1]-1,bb[2]+1,bb[3]+1]
    w,h=bb[2]-bb[0],bb[3]-bb[1]
    lab=110
    W=lab+(w*S+6)*4; H=(h*S+6)*2*len(dirs)+len(dirs)*8
    sheet=Image.new('RGBA',(W,H),(255,255,255,255));d=ImageDraw.Draw(sheet)
    y=0
    for r in dirs:
        for kind,lb in [('baseline','original'),('assets','clean')]:
            e,im=data[kind]
            d.text((2,y+h*S//2-6),f'{DIRS[r]} {lb}',fill=(0,0,0,255))
            for p in range(4):
                c,(ax,a_y)=cell(e,im,4+r*4+p);c=c.crop(bb)
                bg=Image.new('RGBA',c.size,BG);bg.alpha_composite(c)
                x=lab+p*(w*S+6);sheet.paste(bg.resize((w*S,h*S),Image.NEAREST),(x,y))
                gy=y+(a_y-bb[1])*S+S
                d.line([(x,gy),(x+w*S,gy)],fill=(220,0,0,255))
                d.text((x+2,y+2),f'p{p}',fill=(0,0,0,255))
            y+=h*S+6
        y+=8
    sheet.save(out)
for name in ['mosshog','thicketboar','thornback']:
    build(name,[0,1,2],5,out=f'ev/{name}-walk-a-down-downside-side.png')
    build(name,[3,4],5,out=f'ev/{name}-walk-b-upside-up.png')
    build(name,[0,1,2,3,4],8,feet=12,out=f'ev/{name}-feet-8x.png')
