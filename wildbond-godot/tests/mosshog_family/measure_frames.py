"""Read source alpha/geometry; preserve original generated PNG bytes."""
import hashlib, json
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).parent
def runs(values, bridge=1):
    occupied=[i for i,v in enumerate(values) if v]
    if not occupied:return []
    groups=[]; start=last=occupied[0]
    for v in occupied[1:]:
        if v-last>bridge+1:groups.append((start,last+1));start=v
        last=v
    return groups+[(start,last+1)]
def measure(name,file,height,mega=False):
    source=ROOT/'assets'/file
    image=Image.open(source).convert('RGBA')
    mask=image.getchannel('A').point(lambda v:255 if v>=128 else 0)
    rows=runs([mask.crop((0,y,image.width,y+1)).getbbox() is not None for y in range(image.height)])
    expected=1 if mega else 6
    if len(rows)!=expected:raise ValueError(f'{name}: expected {expected} rows, got {rows}')
    frames=[]
    for top,bottom in rows:
        columns=runs([mask.crop((x,top,x+1,bottom)).getbbox() is not None for x in range(image.width)])
        if len(columns)!=(2 if mega else 4):raise ValueError(f'{name}: unexpected poses {columns}')
        for left,right in columns:
            ink=mask.crop((left,top,right,bottom)).getbbox()
            x0,y0,x1,y1=left+ink[0],top+ink[1],left+ink[2],top+ink[3]
            pad=1
            region=[x0-pad,y0-pad,x1-x0+2*pad,y1-y0+2*pad]
            if min(region[:2])<0 or x1+pad>image.width or y1+pad>image.height:raise ValueError('Clipped pose')
            # Root at the centre of the torso band, not whichever hoof is lowest.
            band=mask.crop((x0,y0+int((y1-y0)*.45),x1,y0+int((y1-y0)*.78)))
            pixels=band.load(); mass=sum(pixels[x,y]>0 for y in range(band.height) for x in range(band.width))
            cx=sum(x for y in range(band.height) for x in range(band.width) if pixels[x,y]>0)/max(1,mass)
            frames.append({'region':region,'anchor':[round(cx+pad,3),y1-region[1]],'ink':[pad,pad,x1-x0,y1-y0]})
    groups=[[0],[1]] if mega else [[0,1],[2,3]]+[list(range(i,i+4)) for i in range(4,24,4)]
    for group in groups:
        # One sample step per direction, grounded and centred on measured torso roots.
        budget=64 if mega or group[0]<4 else 40
        step=max(max(frames[i]['ink'][3]/budget,frames[i]['ink'][2]/(80 if group[0]<4 else 64)) for i in group)
        for i in group:frames[i]['sample_step']=round(step,5)
    return {'file':'assets/'+file,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'size':list(image.size),'height_m':height,'mega':mega,'stride_m':.14 if name=='thicketboar' else .18,'frames':frames}
if __name__=='__main__':
    entries={}
    for name,file,height,mega in [('thicketboar','thicketboar-v1.png',.85,False),('thornback','thornback-v2.png',1.15,False),('mega_thornback','mega-thornback-v1.png',1.15,True)]:
        if (ROOT/'assets'/file).exists():entries[name]=measure(name,file,height,mega)
    (ROOT/'frames.json').write_text(json.dumps(entries,indent=2)+'\n',encoding='utf-8')
    print({name:len(entry['frames']) for name,entry in entries.items()})
