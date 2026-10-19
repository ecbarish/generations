import json
from PIL import Image
R='/workspace/motion/wildbond-godot/tests/mosshog_clean/'
DIRS=['down(0)','down-side(1)','side(2)','up-side(3)','up(4)']
out={}
def load(kind,name):
    e=json.load(open(R+f'{kind}/{name}/frames.json'))[name]
    return e,Image.open(R+f'{kind}/{name}/atlas.png').convert('RGBA')
def cell(e,im,i):
    f=e['frames'][i];x,y,w,h=f['region'];return im.crop((x,y,x+w,y+h)),f['anchor']
for name in ['mosshog','thicketboar','thornback']:
    res={}
    for kind in ['baseline','assets']:
        e,im=load(kind,name)
        rows=[]
        for r in range(5):
            cells=[cell(e,im,4+r*4+p) for p in range(4)]
            ax,ay=cells[0][1]
            info=[]
            for c,(cx,cy) in cells:
                bb=c.getbbox(); a=c.getchannel('A')
                # lowest opaque row relative to anchor, top relative to anchor
                info.append(dict(top=bb[1]-cy,bottom=bb[3]-1-cy,left=bb[0]-cx,right=bb[2]-1-cx))
            ref=cells[1][0]; h=ref.height
            bb=ref.getbbox(); cut=cy - max(6,round((bb[3]-bb[1])*.23))
            diffs=[]
            for c,_ in cells:
                up=sum(1 for yy in range(0,cut+1) for xx in range(c.width) if c.getpixel((xx,yy))!=ref.getpixel((xx,yy)) and (c.getpixel((xx,yy))[3] or ref.getpixel((xx,yy))[3]))
                lo=sum(1 for yy in range(cut+1,h) for xx in range(c.width) if c.getpixel((xx,yy))!=ref.getpixel((xx,yy)) and (c.getpixel((xx,yy))[3] or ref.getpixel((xx,yy))[3]))
                diffs.append((up,lo))
            rows.append(dict(dir=DIRS[r],bbox=info,diff_vs_pass=diffs,cut=cut-cy))
        res[kind]=rows
    out[name]=res
    for r in range(5):
        b=res['baseline'][r];c=res['assets'][r]
        print(name,b['dir'],'cut',c['cut'],'| top',[i['top'] for i in b['bbox']],'->',[i['top'] for i in c['bbox']],
              '| bottom',[i['bottom'] for i in b['bbox']],'->',[i['bottom'] for i in c['bbox']],
              '| up/low diffs',b['diff_vs_pass'],'->',c['diff_vs_pass'])
json.dump(out,open('metrics.json','w'),indent=1)
