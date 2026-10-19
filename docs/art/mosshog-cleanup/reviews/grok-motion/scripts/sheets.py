import json
from PIL import Image, ImageDraw
R='/workspace/motion/wildbond-godot/tests/mosshog_clean/'
DIRS=['down','down-side','side','up-side','up']
S=4
def load(kind,name):
    e=json.load(open(R+f'{kind}/{name}/frames.json'))[name]
    return e,Image.open(R+f'{kind}/{name}/atlas.png').convert('RGBA')
def cell(e,im,i):
    x,y,w,h=e['frames'][i]['region'];return im.crop((x,y,x+w,y+h)),e['frames'][i]['anchor']
BG=(206,214,180,255)
for name in ['mosshog','thicketboar','thornback']:
    data={k:load(k,name) for k in ['baseline','assets']}
    e,im=data['assets'];w,h=e['frames'][0]['region'][2:]
    W=(w*4+8*3+20)*S; H=(h*2+12)*5*S+40
    sheet=Image.new('RGBA',(W*1,H),(255,255,255,255));d=ImageDraw.Draw(sheet)
    for r in range(5):
        for k,(kind,lab) in enumerate([('baseline','orig'),('assets','clean')]):
            e,im=data[kind]
            oy=(r*(h*2+12)+k*h)*S+20
            d.text((2,oy+4),f'{DIRS[r]} {lab}',fill=(0,0,0,255))
            for p in range(4):
                c,(ax,ay)=cell(e,im,4+r*4+p)
                ox=(20+p*(w+8))*S
                bg=Image.new('RGBA',c.size,BG);bg.alpha_composite(c)
                sheet.paste(bg.resize((w*S,h*S),Image.NEAREST),(ox,oy))
                d.line([(ox,oy+ay*S),(ox+w*S,oy+ay*S)],fill=(200,0,0,255))
    sheet.save(f'ev/{name}-walk-sheet-4x.png')
    # gifs: 8 directions side by side (orig top, clean bottom), 4 phases at stride cadence
    frames=[]
    for p in range(4):
        fr=Image.new('RGBA',(w*8*3,h*2*3),BG)
        for k,kind in enumerate(['baseline','assets']):
            e,im=data[kind]
            for dd in range(8):
                row=[0,1,2,3,4,3,2,1][dd];c,_=cell(e,im,4+row*4+p)
                if dd>4:c=c.transpose(Image.FLIP_LEFT_RIGHT)
                fr.alpha_composite(c.resize((w*3,h*3),Image.NEAREST),(dd*w*3,k*h*3))
        frames.append(fr.convert('RGB'))
    frames[0].save(f'ev/{name}-8dir-orig-top-clean-bottom.gif',save_all=True,append_images=frames[1:],duration=140,loop=0)
print('ok')
