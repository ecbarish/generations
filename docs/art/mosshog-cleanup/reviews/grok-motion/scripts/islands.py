import json
from PIL import Image
R='/workspace/motion/wildbond-godot/tests/mosshog_clean/'
DIRS=['down','down-side','side','up-side','up']
res={}
for name in ['mosshog','thicketboar','thornback','mega_thornback']:
  for kind in ['baseline','assets']:
    e=json.load(open(R+f'{kind}/{name}/frames.json'))[name];im=Image.open(R+f'{kind}/{name}/atlas.png').convert('RGBA')
    for i,f in enumerate(e['frames']):
        x,y,w,h=f['region'];c=im.crop((x,y,x+w,y+h));ax,ay=f['anchor']
        op={(a,b) for b in range(h) for a in range(w) if c.getpixel((a,b))[3]}
        comps=[]
        while op:
            s=op.pop();st=[s];comp=[s]
            while st:
                a,b=st.pop()
                for n in ((a+1,b),(a-1,b),(a,b+1),(a,b-1),(a+1,b+1),(a-1,b-1),(a+1,b-1),(a-1,b+1)):
                    if n in op: op.remove(n);st.append(n);comp.append(n)
            comps.append(comp)
        comps.sort(key=len,reverse=True)
        small=[(len(cp),min(p[0] for p in cp)-ax,min(p[1] for p in cp)-ay) for cp in comps[1:]]
        if small:
            lab=('battle' if i<4 else f'{DIRS[(i-4)//4]} p{(i-4)%4}') if name!='mega_thornback' else ('front','back')[i]
            res.setdefault(name,{}).setdefault(kind,[]).append((i,lab,small))
for n,v in res.items():
    for k,l in v.items(): print(n,k,l)
