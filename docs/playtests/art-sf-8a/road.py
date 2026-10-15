import sys
from PIL import Image
R='/workspace/generations/starfall-godot/assets/env/frontier/'
tag=sys.argv[1]
a=Image.open(R+'square.png').convert('RGBA'); g=Image.open(R+'ground.png').convert('RGBA')
moss=g.crop((0,0,16,16)); ew=ns=g.crop((64,32,80,48))
sc=Image.new('RGBA',(112,80))
for x in range(7):
  for y in range(5): sc.paste(moss,(x*16,y*16))
for i in range(4): sc.paste(ew,(8+i*16,32)); sc.alpha_composite(a.crop((0,0,16,16)),(8+i*16,32))   # 4-tile straight road, east-west
for i in range(4): sc.paste(ns,(88,8+i*16)); sc.alpha_composite(a.crop((16,0,32,16)),(88,8+i*16))  # 4-tile straight road, north-south
sc.resize((112*6,80*6),Image.Resampling.NEAREST).save(f'/workspace/sf8a/shots/{tag}-straight-road.png')
