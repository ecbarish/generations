import json
from PIL import Image, ImageDraw
l={x['title']:x for x in json.load(open('raw/log.json'))}
DIRS=['up','up-right','right','down-right','down','down-left','left','up-left']
S=3
for name in ['mosshog','thicketboar','thornback']:
    cw,ch=(72,60) if name=="mosshog" else (100,84)
    W=Image.new('RGB',(130+5*(cw*S+4),len(DIRS)*2*(ch*S+4)+40),(255,255,255));d=ImageDraw.Draw(W)
    d.text((4,4),f'{name}: in-engine follower, Godot 4.7.2 Compatibility/llvmpipe, 1536x864 window, 3x nearest. 5 samples ~60-90 ms apart',fill=(0,0,0))
    y=24
    for dd in DIRS:
        for mode in ['original','clean']:
            d.text((4,y+ch*S//2-10),f'{dd}\n{mode}',fill=(0,0,0))
            for i in range(5):
                x=l[f'{name}-{mode}-walk-{dd}-{i}'];px,py=x['partner_px']
                im=Image.open(f"raw/{name}-{mode}-walk-{dd}-{i}.png")
                c=im.crop((int(px*4-cw/2),int(py*4-ch+12),int(px*4+cw/2),int(py*4+12))).resize((cw*S,ch*S),Image.NEAREST)
                X=130+i*(cw*S+4);W.paste(c,(X,y));d.text((X+3,y+3),f"d{x['dir8']} p{x['phase']}",fill=(255,0,0))
            y+=ch*S+4
    W.save(f'ev/{name}-engine-8dir-walk.png')
# run + stop + battle composites
for name in ['mosshog','thicketboar','thornback']:
    cw,ch=(72,60) if name=="mosshog" else (100,84)
    W=Image.new('RGB',(130+6*(cw*S+4),2*(ch*S+4)+30),(255,255,255));d=ImageDraw.Draw(W)
    y=20
    for mode in ['original','clean']:
        d.text((4,y+ch*S//2),f'run right\n+stop\n{mode}',fill=(0,0,0))
        titles=[f'{name}-{mode}-run-right-{i}' for i in range(5)]+[f'{name}-{mode}-stop-right']
        for i,t in enumerate(titles):
            x=l[t];px,py=x['partner_px'];im=Image.open(f'raw/{t}.png')
            c=im.crop((int(px*4-cw/2),int(py*4-ch+12),int(px*4+cw/2),int(py*4+12))).resize((cw*S,ch*S),Image.NEAREST)
            X=130+i*(cw*S+4);W.paste(c,(X,y));d.text((X+3,y+3),('STOP ' if 'stop' in t else '')+f"d{x['dir8']} p{x['phase']}",fill=(255,0,0))
        y+=ch*S+4
    W.save(f'ev/{name}-engine-run-stop.png')
print('ok')
