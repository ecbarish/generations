"""Measure source alpha only; never redraw, crop or rewrite generated image bytes."""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).parent

def runs(values, bridge=6):
    occupied = [i for i, value in enumerate(values) if value]
    if not occupied:
        return []
    groups = []
    start = last = occupied[0]
    for value in occupied[1:]:
        if value-last > bridge+1:
            groups.append((start, last+1))
            start = value
        last = value
    return groups + [(start, last+1)]

def measure(name, file, height):
    source = ROOT / 'assets' / file
    image = Image.open(source).convert('RGBA')
    alpha = image.getchannel('A')
    mask = alpha.point(lambda value: 255 if value >= 128 else 0)
    rows = runs([mask.crop((0,y,image.width,y+1)).getbbox() is not None for y in range(image.height)])
    if len(rows) != 6:
        raise ValueError(f'{name}: expected 6 distinct rows, found {rows}')
    frames = []
    for top, bottom in rows:
        strip = mask.crop((0,top,image.width,bottom))
        columns = runs([strip.crop((x,0,x+1,strip.height)).getbbox() is not None for x in range(strip.width)])
        if len(columns) != 4:
            raise ValueError(f'{name}: expected 4 complete poses in row {top}, found {columns}')
        for left, right in columns:
            ink = mask.crop((left,top,right,bottom)).getbbox()
            x0,y0,x1,y1 = left+ink[0],top+ink[1],left+ink[2],top+ink[3]
            region = [x0-4,y0-4,x1-x0+8,y1-y0+8]
            if min(region[:2])<0 or x1+4>image.width or y1+4>image.height:
                raise ValueError(f'{name}: clipped source pose')
            feet = mask.crop((x0,max(y0,y1-12),x1,y1)).getbbox()
            anchor = [(x0+feet[0]+x0+feet[2])/2-region[0],y1-region[1]]
            frames.append({'region':region,'anchor':anchor,'ink':[4,4,x1-x0,y1-y0]})
    return {'file':'assets/'+file,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'size':list(image.size),'height_m':height,'frames':frames}

if __name__ == '__main__':
    specs = [('ripplet','ripplet-v2.png',.55),('mosshog','mosshog-v1.png',.55),('cindercub','cindercub-v1.png',.60)]
    result = {name:measure(name,file,height) for name,file,height in specs if (ROOT/'assets'/file).exists()}
    (ROOT/'frames.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print('Measured', ', '.join(f'{name}: {len(meta["frames"])} poses' for name,meta in result.items()))
