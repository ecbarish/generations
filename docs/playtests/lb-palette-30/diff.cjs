/* Pixel-diff the before/after pairs that capture.cjs wrote into <outdir> (before-*.png vs after-*.png). Needs python3 with Pillow.
     node docs/playtests/lb-palette-30/diff.cjs <outdir> [<noise tag a> <noise tag b>]
   Every differing pixel is put in one of three bins:
     merge  - the exact colour change one of the six palette merges makes (#10141c/#101820 -> #141820, #c9bc9a -> #d9c89a, #1a120c -> #1e1a22, #000000 -> #141820)
     shadow - the HUD text shadow (merge 6): a near-black pixel that becomes #141820 or within 8 of it
     edge   - an antialiased pixel next to (within one pixel of) a pixel that took an exact merge, i.e. the rim of a repainted sprite, the meter frame or the stick knob
     blend  - a small shift (largest channel change <= 8) where a translucent layer sits over a merged colour (the vignette, panel and gradient alphas fold the new base in)
     other  - anything else; each pair lists the bounding box of those pixels
   With two extra tags (say a and b: two runs of the SAME build) it prints the same table for them, which is the capture noise floor. */
'use strict';
const { execFileSync } = require('child_process');
const py = `
import sys, glob, os
from PIL import Image
out, ta, tb = sys.argv[1], sys.argv[2], sys.argv[3]
MERGE = {('#10141c','#141820'),('#101820','#141820'),('#c9bc9a','#d9c89a'),('#1a120c','#1e1a22'),('#000000','#141820')}
def hexa(p): return '#%02x%02x%02x' % p
for b in sorted(glob.glob(os.path.join(out, ta + '-*.png'))):
    a = os.path.join(out, tb + b[len(os.path.join(out, ta)):])
    name = os.path.basename(b)[len(ta) + 1:-4]
    i, j = Image.open(b).convert('RGB'), Image.open(a).convert('RGB')
    if i.size != j.size: print(name, 'SIZE DIFFERS', i.size, j.size); continue
    pb, pa = i.load(), j.load(); m = bl = o = sh = ed = 0; box = None; W, H = i.size
    def exact(x, y): return (hexa(pb[x, y]), hexa(pa[x, y])) in MERGE and pb[x, y] != pa[x, y]
    for y in range(H):
        for x in range(W):
            p, q = pb[x, y], pa[x, y]
            if p == q: continue
            if (hexa(p), hexa(q)) in MERGE: m += 1
            elif max(abs(p[k] - q[k]) for k in range(3)) <= 8: bl += 1
            elif max(p) <= 0x40 and max(abs(q[0] - 0x14), abs(q[1] - 0x18), abs(q[2] - 0x20)) <= 8: sh += 1
            elif any(exact(xx, yy) for yy in range(max(0, y - 1), min(H, y + 2)) for xx in range(max(0, x - 1), min(W, x + 2))): ed += 1
            else:
                o += 1; box = (x, y, x, y) if box is None else (min(box[0], x), min(box[1], y), max(box[2], x), max(box[3], y))
    print('%-22s %8d px  merge %8d  shadow %5d  edge %5d  blend %8d  other %6d%s' % (name, W * H, m, sh, ed, bl, o, '' if not o else '  other bbox x%d-%d y%d-%d' % (box[0], box[2], box[1], box[3])))
`;
const [dir, ta, tb] = process.argv.slice(2);
process.stdout.write(execFileSync('python3', ['-c', py, dir, ta || 'before', tb || 'after'], { encoding: 'utf8' }));
