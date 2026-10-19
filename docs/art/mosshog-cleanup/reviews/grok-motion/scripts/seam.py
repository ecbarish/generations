import json
from PIL import Image
R='/workspace/motion/wildbond-godot/tests/mosshog_clean/'
DIRS=['down','down-side','side','up-side','up']
rows=[]
for name in ['mosshog','thicketboar','thornback']:
  tot={}
  for kind in ['baseline','assets']:
    e=json.load(open(R+f'{kind}/{name}/frames.json'))[name];im=Image.open(R+f'{kind}/{name}/atlas.png').convert('RGBA')
    E=json.load(open(R+f'assets/{name}/frames.json'))[name];IM=Image.open(R+f'assets/{name}/atlas.png').convert('RGBA')
    for i in range(4,24):
        x,y,w,h=e['frames'][i]['region'];ax,ay=e['frames'][i]['anchor'];c=im.crop((x,y,x+w,y+h))
        # cut as in checks.gd, from the clean passing frame of this group
        start=4+((i-4)//4)*4
        X,Y,W,H=E['frames'][start+1]['region'];ref=IM.crop((X,Y,X+W,Y+H));used=ref.getbbox()
        cut=-max(6,round((used[3]-used[1])*.23))
        r1=ay+cut+1;r0=ay+cut
        op=lambda a,b:0<=a<w and 0<=b<h and c.getpixel((a,b))[3]>0
        # unsupported: opaque in first moving row with no opaque within +-1 above, AND horizontal run end mismatch
        uns=sum(1 for a in range(w) if op(a,r1) and not any(op(a+d,r0) for d in (-1,0,1)))
        # dangling above: opaque outline pixel at r0 with nothing below in +-1 (limb cut)
        dang=sum(1 for a in range(w) if op(a,r0) and not any(op(a+d,r1) for d in (-1,0,1)))
        tot.setdefault(kind,[]).append(uns+dang)
        if kind=='assets': rows.append((uns+dang,name,DIRS[(i-4)//4],(i-4)%4,uns,dang))
  print(name,'seam breaks per frame orig',sum(tot['baseline']),'clean',sum(tot['assets']))
rows.sort(reverse=True)
for r in rows[:10]: print(r)
